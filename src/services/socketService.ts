import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { ChatMessage, MessageType, MessageStatus, MessageDirection } from '../models/ChatMessage';
import { ChatSession, SessionStatus, SessionType } from '../models/ChatSession';
import { Chat } from '../models/Chat';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { JWT_SECRET } from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import { CallService } from './callService';

interface AuthenticatedSocket {
  userId: number;
  userRole: string;
  fullName: string;
  sessionId?: string;
}

interface MessageData {
  sessionId: string;
  content: string;
  messageType?: MessageType;
  replyToMessageId?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

interface CallData {
  sessionId: string;
  callType: 'audio_call' | 'video_call';
  reason?: string;
}

class SocketService {
  private io: SocketIOServer;
  private userSessions: Map<number, string> = new Map(); // userId -> sessionId
  private sessionUsers: Map<string, Set<number>> = new Map(); // sessionId -> Set of userIds
  private userSocketMap: Map<number, string> = new Map(); // userId -> socketId
  private callService: CallService;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e8, // 100MB for file uploads
      allowEIO3: true
    });

    this.callService = new CallService();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          // Allow connection without token for testing
          // return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;


        // For testing purposes, allow test user without database lookup
        if (decoded) {
          // if (decoded.userId === 1 && decoded.email === 'test@example.com') {
          (socket as any).user = {
            userId: decoded.userId,
            userRole: decoded.role,
            fullName: decoded.fullName
          };
          return next();
        }

        // For real users, check database
        const user = await User.findByPk(decoded.userId);

        if (!user) {
          return next(new Error('User not found'));
        }

        (socket as any).user = {
          userId: user.id,
          userRole: user.role,
          fullName: user.fullName
        };

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('connection------>');
      const user = (socket as any).user as AuthenticatedSocket;
      console.log(`User ${JSON.stringify(user)} connected to socket------>`);

      // Map user to socket
      this.userSocketMap.set(user.userId, socket.id);
      console.log(`User ${user.userId} mapped to socket ${socket.id}. Current map:------>`, Array.from(this.userSocketMap.entries()));

      // Join user to their active sessions
      this.joinUserToActiveSessions(socket, user.userId);

      // Handle joining a specific chat session
      socket.on('join-session', async (data: any) => {
        try {
          // Extract sessionId from data, handling both string and object cases
          const sessionId = typeof data === 'string' ? data : data?.sessionId;
          console.log('sessionId--------------------------->', sessionId);

          if (!sessionId || typeof sessionId !== 'string') {
            socket.emit('error', { message: 'Invalid session ID' });
            return;
          }

          const session = await ChatSession.findOne({
            where: { sessionId: sessionId, isActive: true },
            include: [
              { model: Chat, as: 'chat' },
              { model: User, as: 'patient' },
              { model: User, as: 'doctor' }
            ]
          });
          console.log('session--------------------------->', session);

          if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
          }

          // Verify user has access to this session
          if (session.patientId !== user.userId && session.doctorId !== user.userId) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Join the session room
          socket.join(sessionId);
          (socket as any).sessionId = sessionId;

          // Track user in session
          if (!this.sessionUsers.has(sessionId)) {
            this.sessionUsers.set(sessionId, new Set());
          }
          this.sessionUsers.get(sessionId)!.add(user.userId);
          this.userSessions.set(user.userId, sessionId);

          // Mark user as joined in database
          if (user.userRole === 'patient') {
            await session.update({ patientJoinedAt: new Date() });
          } else if (user.userRole === 'doctor') {
            await session.update({ doctorJoinedAt: new Date() });
          }

          if (session.patientJoinedAt || session.doctorJoinedAt || session.status === SessionStatus.SCHEDULED) {
            await session.update({
              status: SessionStatus.ONGOING,
              startTime: new Date()
            });
          }

          // Send session info
          socket.emit('session-joined', {
            sessionId,
            status: session.status,
            sessionType: session.sessionType,
            participants: {
              patient: { id: session.patientId, name: session.patient?.fullName },
              doctor: { id: session.doctorId, name: session.doctor?.fullName }
            },
            startTime: session.startTime,
            patientJoinedAt: session.patientJoinedAt,
            doctorJoinedAt: session.doctorJoinedAt
          });

          // Notify other participants
          socket.to(sessionId).emit('user-joined', {
            userId: user.userId,
            userName: user.fullName,
            userRole: user.userRole,
            timestamp: new Date()
          });

          // Send system message
          // await this.sendSystemMessage(session.id, `${user.fullName} joined the session`);

          logger.info(`User ${user.userId} joined session ${sessionId}`);
        } catch (error) {
          logger.error('Error joining session:', error);
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // Handle real-time message sending
      socket.on('send-message', async (data: MessageData) => {
        try {
          const { sessionId, content, messageType = MessageType.TEXT, replyToMessageId, fileUrl, fileName, fileType, fileSize } = data;

          // Validate session access
          const session = await ChatSession.findOne({
            where: { sessionId, isActive: true },
            include: [
              { model: Chat, as: 'chat' },
              { model: User, as: 'patient' },
              { model: User, as: 'doctor' }
            ]
          });

          if (!session || (session.patientId !== user.userId && session.doctorId !== user.userId)) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Check if session is active
          if (session.status !== SessionStatus.ONGOING) {
            socket.emit('error', { message: 'Session is not active' });
            return;
          }

          // Determine message direction
          const direction = session.patientId === user.userId
            ? MessageDirection.INBOUND
            : MessageDirection.OUTBOUND;

          // Create message in database
          const message = await ChatMessage.create({
            chatId: session.chatId,
            sessionId: session.id,
            senderId: user.userId,
            messageType,
            direction,
            content,
            fileUrl,
            fileName,
            fileType,
            fileSize,
            replyToMessageId,
            status: MessageStatus.SENT,
            sentAt: new Date(),
            messageId: uuidv4()
          });

          // Mark message as delivered immediately
          await message.update({
            status: MessageStatus.DELIVERED,
            deliveredAt: new Date()
          });

          // Broadcast message to all users in session
          const messageData = {
            id: message.id,
            messageId: message.messageId,
            sessionId: sessionId,
            senderId: message.senderId,
            senderName: user.fullName,
            messageType: message.messageType,
            direction: message.direction,
            content: message.content,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            fileType: message.fileType,
            fileSize: message.fileSize,
            replyToMessageId: message.replyToMessageId,
            status: message.status,
            sentAt: message.sentAt,
            deliveredAt: message.deliveredAt
          };

          this.io.to(sessionId).emit('new-message', messageData);

          logger.info(`Message sent in session ${sessionId} by user ${user.userId}`);
        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (sessionId: string) => {
        socket.to(sessionId).emit('user-typing', {
          userId: user.userId,
          userName: user.fullName,
          userRole: user.userRole,
          isTyping: true,
          timestamp: new Date()
        });
      });

      socket.on('typing-stop', (sessionId: string) => {
        socket.to(sessionId).emit('user-typing', {
          userId: user.userId,
          userName: user.fullName,
          userRole: user.userRole,
          isTyping: false,
          timestamp: new Date()
        });
      });

      // Handle message read receipts
      socket.on('mark-read', async (messageIds: number[]) => {
        try {
          const sessionId = (socket as any).sessionId;
          if (!sessionId) return;

          const session = await ChatSession.findOne({
            where: { sessionId, isActive: true }
          });

          if (!session) return;

          await ChatMessage.update(
            {
              status: MessageStatus.READ,
              readAt: new Date()
            },
            {
              where: {
                id: messageIds,
                sessionId: session.id,
                senderId: { [require('sequelize').Op.ne]: user.userId } // Only mark others' messages as read
              }
            }
          );

          // Notify message sender about read receipt
          socket.to(sessionId).emit('messages-read', {
            messageIds,
            readBy: user.userId,
            readByRole: user.userRole,
            readAt: new Date()
          });
        } catch (error) {
          logger.error('Error marking messages as read:', error);
        }
      });

      // Handle session end
      socket.on('end-session', async () => {
        try {
          const sessionId = (socket as any).sessionId;
          if (!sessionId) return;

          const session = await ChatSession.findOne({
            where: { sessionId, isActive: true }
          });

          if (!session) return;

          // Only allow session participants to end the session
          if (session.patientId !== user.userId && session.doctorId !== user.userId) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // End the session
          const endTime = new Date();
          const duration = session.startTime ? Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000) : 0;

          await session.update({
            // status: SessionStatus.ENDED,
            endTime,
            duration
          });

          // Send system message
          await this.sendSystemMessage(session.id, `Session ended by ${user.fullName}`);

          // Notify all participants
          this.io.to(sessionId).emit('session-ended', {
            sessionId,
            endedBy: user.userId,
            endedByRole: user.userRole,
            endTime,
            duration
          });

          // Remove users from session tracking
          this.sessionUsers.delete(sessionId);
          this.userSessions.delete(user.userId);

          logger.info(`Session ${sessionId} ended by user ${user.userId}`);
        } catch (error) {
          logger.error('Error ending session:', error);
          socket.emit('error', { message: 'Failed to end session' });
        }
      });

      // CALL EVENT HANDLERS

      // Handle call initiation (both doctor and patient)
      socket.on('initiate-call', async (data: any) => {
        try {
          logger.info('initiate-call--------------------------->', data);
          const { sessionId } = data;
          let callType: 'audio_call' | 'video_call' = data?.callType?.includes('audio') ? 'audio_call' : 'video_call';
          if (!['doctor', 'patient'].includes(user.userRole)) {
            socket.emit('call-error', { message: 'Only doctors and patients can initiate calls' });
            return;
          }

          // Check if user is busy
          const isBusy = await this.callService.isUserBusy(user.userId);
          logger.info('isBusy--------------------------->', isBusy);
          if (isBusy) {
            // socket.emit('call-error', { message: 'You are currently busy with another call' });
            // return;
          }

          const result = await this.callService.initiateCall(user.userId, sessionId, callType);
          console.log('result--------------------------->', result);
          console.log('this.userSocketMap--------------------------->', this.userSocketMap);
          if (result.success) {
            // Notify the receiver about incoming call
            const receiverId = result.data.callData.receiverId;
            console.log('Looking for receiverId--------------------------->', receiverId);
            console.log('Available users in socket map--------------------------->', Array.from(this.userSocketMap.keys()));
            const receiverSocketId = this.userSocketMap.get(receiverId);
            console.log('receiverSocketId--------------------------->', receiverSocketId);
            if (receiverSocketId) {
              this.io.to(receiverSocketId).emit('incoming-call', {
                sessionId: result.data.callData.sessionId,
                callType: result.data.callData.callType,
                callerName: result.data.callData.callerName,
                callerImage: result.data.callData.callerImage,
                callerId: result.data.callData.callerId,
                agora: result.data.callData.agora
              });

                          // Start ringing timeout (30 seconds)
            setTimeout(async () => {
              const session = await ChatSession.findOne({ where: { sessionId } });
              console.log('session----------------------->',session);
              
              if (session && session.status === SessionStatus.SCHEDULED && !session.callAnsweredAt) {
                // Mark call as missed
                const missedResult = await this.callService.markCallAsMissed(sessionId);

                // Notify caller call was missed
                socket.emit('call-missed', { sessionId });

                // Notify receiver call ended
                if (receiverSocketId) {
                  this.io.to(receiverSocketId).emit('call-ended', {
                    sessionId,
                    reason: 'missed',
                    endedBy: 'system',
                    callEndedAt: new Date(),
                    callEndReason: 'missed'
                  });
                }
              }
            }, 30000);
            }

            socket.emit('call-initiated', result.data);
            logger.info(`Call initiated by ${user.userRole} ${user.userId} for session ${sessionId}`);
          } else {
            socket.emit('call-error', { message: result.message });
          }
        } catch (error) {
          logger.error('Error initiating call:', error);
          socket.emit('call-error', { message: 'Failed to initiate call' });
        }
      });

      // Handle call answer (both can answer)
      socket.on('answer-call', async (data: { sessionId: string }) => {
        try {
          const { sessionId } = data;

          if (!['doctor', 'patient'].includes(user.userRole)) {
            socket.emit('call-error', { message: 'Only doctors and patients can answer calls' });
            return;
          }

          // Check if user is busy
          const isBusy = await this.callService.isUserBusy(user.userId);
          if (isBusy) {
            // socket.emit('call-error', { message: 'You are currently busy with another call' });
            // return;
          }

          const result = await this.callService.answerCall(user.userId, sessionId);
console.log('result--------------------------->', result);

          if (result.success) {
            // Get the other participant's user ID
            const session = await ChatSession.findOne({ where: { sessionId } });
            if (!session) {
              socket.emit('call-error', { message: 'Session not found' });
              return;
            }

            const otherUserId = session.patientId === user.userId ? session.doctorId : session.patientId;
            const otherUserSocketId = this.userSocketMap.get(otherUserId);
            console.log('otherUserSocketId--------------------------->', otherUserSocketId);
            console.log('user.userId--------------------------->', user.userId);
            console.log('receiverId--------------------------->', {
              otherUserId,
              socketId: socket.id
            });
            // Send call answered notification directly to the other user
            if (otherUserSocketId) {
              this.io.to(otherUserSocketId).emit('call-answered', {
                sessionId,
                answeredBy: user.userId,
                answeredByName: user.fullName,
                callType: result.data.callType,
                agora: result.data.agora
              });
            }

            this.io.to(socket.id).emit('call-answered', {
              sessionId,
              answeredBy: user.userId,
              answeredByName: user.fullName,
              callType: result.data.callType,
              agora: result.data.agora
            });
            socket.emit('call-connected', result.data);
            console.log('call-connected--------------------------->',{
              sessionId,
              answeredBy: user.userId,
              answeredByName: user.fullName,
              callType: result.data.callType,
              agora: result.data.agora
            });
            
            logger.info(`Call answered by ${user.userRole} ${user.userId} for session ${sessionId}`);
          } else {
            socket.emit('call-error', { message: result.message });
          }
        } catch (error) {
          logger.error('Error answering call:', error);
          socket.emit('call-error', { message: 'Failed to answer call' });
        }
      });

      // Handle call decline (both can decline)
      socket.on('decline-call', async (data: { sessionId: string; reason?: string }) => {
        try {
          const { sessionId, reason } = data;

          if (!['doctor', 'patient'].includes(user.userRole)) {
            socket.emit('call-error', { message: 'Only doctors and patients can decline calls' });
            return;
          }

          const result = await this.callService.declineCall(user.userId, sessionId, reason);

          if (result.success) {
            // Get the other participant's user ID
            const session = await ChatSession.findOne({ where: { sessionId } });
            if (session) {
              const otherUserId = session.patientId === user.userId ? session.doctorId : session.patientId;
              const otherUserSocketId = this.userSocketMap.get(otherUserId);

              // Notify other party that call was declined
              if (otherUserSocketId) {
                this.io.to(otherUserSocketId).emit('call-declined', {
                  sessionId,
                  declinedBy: user.userId,
                  declinedByName: user.fullName,
                  reason: reason || 'Call declined'
                });
              }
            }

            socket.emit('call-ended', { sessionId, reason: 'declined', endedBy: user.userRole });
            logger.info(`Call declined by ${user.userRole} ${user.userId} for session ${sessionId}`);
          } else {
            socket.emit('call-error', { message: result.message });
          }
        } catch (error) {
          logger.error('Error declining call:', error);
          socket.emit('call-error', { message: 'Failed to decline call' });
        }
      });

      // Handle call end (both doctor and patient)
      socket.on('end-call', async (data: { sessionId: string }) => {
        try {
          const { sessionId } = data;

          const result = await this.callService.endCall(user.userId, sessionId);

          if (result.success) {
            // Get the other participant's user ID
            const session = await ChatSession.findOne({ where: { sessionId } });
            if (session) {
              const otherUserId = session.patientId === user.userId ? session.doctorId : session.patientId;
              const otherUserSocketId = this.userSocketMap.get(otherUserId);

              // Notify the other participant that call ended
              if (otherUserSocketId) {
                this.io.to(otherUserSocketId).emit('call-ended', {
                  sessionId,
                  endedBy: result.data.endedBy,
                  duration: result.data.duration,
                  reason: 'ended_by_user',
                  agora: result.data.agora // Include Agora cleanup info
                });
              }
            }

            // Notify the current user that call ended
            socket.emit('call-ended', {
              sessionId,
              endedBy: result.data.endedBy,
              duration: result.data.duration,
              reason: 'ended_by_user',
              agora: result.data.agora
            });

            logger.info(`Call ended by ${result.data.endedBy} for session ${sessionId}, duration: ${result.data.duration}s`);
          } else {
            socket.emit('call-error', { message: result.message });
          }
        } catch (error) {
          logger.error('Error ending call:', error);
          socket.emit('call-error', { message: 'Failed to end call' });
        }
      });

      // Handle WebRTC signaling for video/audio calls
      socket.on('webrtc-offer', (data: { sessionId: string; offer: any; targetUserId: number }) => {
        const { sessionId, offer, targetUserId } = data;
        const targetSocketId = this.userSocketMap.get(targetUserId);

        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc-offer', {
            sessionId,
            offer,
            fromUserId: user.userId,
            fromUserName: user.fullName
          });
        }
      });

      socket.on('webrtc-answer', (data: { sessionId: string; answer: any; targetUserId: number }) => {
        const { sessionId, answer, targetUserId } = data;
        const targetSocketId = this.userSocketMap.get(targetUserId);

        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc-answer', {
            sessionId,
            answer,
            fromUserId: user.userId,
            fromUserName: user.fullName
          });
        }
      });

      socket.on('webrtc-ice-candidate', (data: { sessionId: string; candidate: any; targetUserId: number }) => {
        const { sessionId, candidate, targetUserId } = data;
        const targetSocketId = this.userSocketMap.get(targetUserId);

        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc-ice-candidate', {
            sessionId,
            candidate,
            fromUserId: user.userId
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        const sessionId = (socket as any).sessionId;
        if (sessionId) {
          // Remove user from session tracking
          const sessionUsers = this.sessionUsers.get(sessionId);
          if (sessionUsers) {
            sessionUsers.delete(user.userId);
            if (sessionUsers.size === 0) {
              this.sessionUsers.delete(sessionId);
            }
          }

          this.userSessions.delete(user.userId);

          // Notify other users
          socket.to(sessionId).emit('user-left', {
            userId: user.userId,
            userName: user.fullName,
            userRole: user.userRole,
            timestamp: new Date()
          });
        }

        // Remove user from socket map
        this.userSocketMap.delete(user.userId);
        logger.info(`User ${user.userId} disconnected from socket. Remaining users:`, Array.from(this.userSocketMap.keys()));

        logger.info(`User ${user.userId} disconnected from socket`);
      });
    });
  }

  private async joinUserToActiveSessions(socket: any, userId: number) {
    try {
      // Find all active sessions for this user
      const activeSessions = await ChatSession.findAll({
        where: {
          [require('sequelize').Op.or]: [
            { patientId: userId },
            { doctorId: userId }
          ],
          status: [SessionStatus.SCHEDULED, SessionStatus.ONGOING],
          isActive: true
        }
      });

      // Join all active sessions
      for (const session of activeSessions) {
        socket.join(session.sessionId);
        (socket as any).sessionId = session.sessionId;

        if (!this.sessionUsers.has(session.sessionId)) {
          this.sessionUsers.set(session.sessionId, new Set());
        }
        this.sessionUsers.get(session.sessionId)!.add(userId);
        this.userSessions.set(userId, session.sessionId);
      }
    } catch (error) {
      logger.error('Error joining user to active sessions:', error);
    }
  }

  private async sendSystemMessage(sessionId: number, content: string) {
    try {
      const session = await ChatSession.findByPk(sessionId);
      if (!session) return;

      // Create system message with NULL sender_id (system messages)
      const message = await ChatMessage.create({
        chatId: session.chatId,
        sessionId,
        senderId: null, // NULL for system messages
        messageType: MessageType.SYSTEM,
        direction: MessageDirection.SYSTEM,
        content,
        messageId: uuidv4(),
        status: MessageStatus.DELIVERED,
        sentAt: new Date(),
        deliveredAt: new Date(),
      });

      // Broadcast system message
      this.io.to(session.sessionId).emit('new-message', {
        id: message.id,
        messageId: message.messageId,
        sessionId: session.sessionId,
        senderId: null,
        senderName: 'System',
        messageType: MessageType.SYSTEM,
        direction: MessageDirection.SYSTEM,
        content: message.content,
        status: message.status,
        sentAt: message.sentAt,
        deliveredAt: message.deliveredAt
      });
    } catch (error) {
      logger.error('Error sending system message:', error);
    }
  }

  // Public methods for external use
  public getIO(): SocketIOServer {
    return this.io;
  }

  public emitToSession(sessionId: string, event: string, data: any) {
    this.io.to(sessionId).emit(event, data);
  }

  public emitToUser(userId: number, event: string, data: any) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public getSessionUsers(sessionId: string): Set<number> | undefined {
    return this.sessionUsers.get(sessionId);
  }

  public isUserInSession(userId: number, sessionId: string): boolean {
    const sessionUsers = this.sessionUsers.get(sessionId);
    return sessionUsers ? sessionUsers.has(userId) : false;
  }

  public getActiveSessions(): Map<string, Set<number>> {
    return this.sessionUsers;
  }

  public getOnlineUsers(): Set<number> {
    return new Set(this.userSocketMap.keys());
  }
}

export default SocketService;
