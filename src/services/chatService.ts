import { ChatSession, SessionStatus, SessionType } from '../models/ChatSession';
import { ChatMessage, MessageType, MessageStatus, MessageDirection } from '../models/ChatMessage';
import { Chat } from '../models/Chat';
import { DoctorService } from './doctorService';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../types/auth';
import { DoctorService as DoctorServiceModel } from '../models/DoctorService';

interface CreateSessionData {
  patientId: number;
  doctorId: number;
  sessionType: SessionType;
  sessionToken?: string;
}

interface SendMessageData {
  sessionId: number;
  senderId: number;
  content: string;
  messageType?: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  replyToMessageId?: string;
}

interface MessageFilters {
  sessionId?: number;
  senderId?: number;
  status?: MessageStatus;
  messageType?: MessageType;
  page?: number;
  limit?: number;
  beforeDate?: Date;
  afterDate?: Date;
}

export class ChatService {
  private doctorService: DoctorService;

  constructor() {
    this.doctorService = new DoctorService();
  }

  // Join a chat session
  async joinSession(userId: number, userRole: string, sessionId: string) {
    try {
      // Find the session
      const session = await ChatSession.findOne({
        where: { sessionId, isActive: true },
        include: [
          { model: Chat, as: 'chat' },
          { model: User, as: 'patient', attributes: ['id', 'fullName', 'profileImage'] }, 
          { model: User, as: 'doctor', attributes: ['id', 'fullName', 'profileImage'] }
        ]
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      // Verify user has access to this session
      if (session.patientId !== userId && session.doctorId !== userId) {
        return {
          success: false,
          message: 'Access denied to this session',
        };
      }

      // Check if session can be joined
      if (![SessionStatus.SCHEDULED, SessionStatus.ONGOING].includes(session.status)) {
        return {
          success: false,
          message: 'Session cannot be joined in its current state',
        };
      }

      // Update join timestamps
      const updateData: any = {
        // status: SessionStatus.ONGOING,
      };
      if (userRole === 'patient' && !session.patientJoinedAt) {
        updateData.patientJoinedAt = new Date();
      } else if (userRole === 'doctor' && !session.doctorJoinedAt) {
        updateData.doctorJoinedAt = new Date();
      }

      if (Object.keys(updateData).length > 0) {
        await session.update(updateData);
        await session.reload(); // Reload to get updated data
      }
      console.log('patientJoinedAt--------------------------->', session.patientJoinedAt, session.doctorJoinedAt, session.status);
      // If both participants have joined and session is scheduled, mark as ongoing
      if (session.patientJoinedAt || session.doctorJoinedAt || session.status === SessionStatus.SCHEDULED) {
        await session.update({ 
          status: SessionStatus.ONGOING,
          startTime: new Date()
        });
        await session.reload();
      }

      return {
        success: true,
        message: 'Successfully joined session',
        data: {
          session: {
            id: session.id,
            sessionId: session.sessionId,
            status: session.status,
            sessionType: session.sessionType,
            startTime: session.startTime,
            endTime: session.endTime,
            patientJoinedAt: session.patientJoinedAt,
            doctorJoinedAt: session.doctorJoinedAt,
            duration: session.duration,
            participants: {
              patient: { 
                id: session.patientId, 
                name: session.patient?.fullName,
                profileImage: session.patient?.profileImage,
                hasJoined: !!session.patientJoinedAt
              },
              doctor: { 
                id: session.doctorId, 
                name: session.doctor?.fullName,
                profileImage: session.doctor?.profileImage,
                hasJoined: !!session.doctorJoinedAt
              }
            }
          }
        }
      };
    } catch (error) {
      logger.error('Join session service error:', error);
      return {
        success: false,
        message: 'Failed to join session',
      };
    }
  }

  // Verify if user has an active session
  async verifySession(userId: number, userRole: string) {
    try {
      const whereClause: any = {
        isActive: true,
        status: [SessionStatus.SCHEDULED, SessionStatus.ONGOING],
      };

      if (userRole === 'patient') {
        whereClause.patientId = userId;
      } else if (userRole === 'doctor') {
        whereClause.doctorId = userId;
      } else {
        return {
          success: false,
          message: 'Invalid user role',
        };
      }

      const session = await ChatSession.findOne({
        where: whereClause,
        include: [
          { model: Chat, as: 'chat' },
          { model: User, as: 'patient', attributes: ['id', 'fullName', 'profileImage'] },
          { model: User, as: 'doctor', attributes: ['id', 'fullName', 'profileImage'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      if (!session) {
        return {
          success: false,
          message: 'No active session found',
        };
      }

      return {
        success: true,
        message: 'Active session found',
        data: {
          session: {
            id: session.id,
            sessionId: session.sessionId,
            status: session.status,
            sessionType: session.sessionType,
            startTime: session.startTime,
            patient: session.patient,
            doctor: session.doctor,
          },
        },
      };
    } catch (error) {
      logger.error('Verify session error:', error);
      return {
        success: false,
        message: 'Failed to verify session',
        error,
      };
    }
  }

  // Create a new chat session
  async createSession(data: CreateSessionData) {
    try {
      // Validate doctor exists and has chat service enabled
      const doctor = await User.findOne({
        where: {
          id: data.doctorId,
          role: UserRole.DOCTOR,
          isActive: true,
          isApproved: true,
        },
        include: [
          {
            model: DoctorServiceModel,
            as: 'doctorServices',
            required: false,
            attributes: [
              'id', 'chatPrice', 'chatEnabled', 'chatDuration', 'chatDescription'
            ],
          },
        ],
      });

      if (!doctor) {
        return {
          success: false,
          message: 'Doctor not found',
        };
      }

      if (!doctor.doctorServices?.chatEnabled) {
        return {
          success: false,
          message: 'Doctor does not offer chat services',
        };
      }

      // Find or create chat
      const chat = await Chat.findOrCreateChat(data.doctorId, data.patientId);

      // Check if there's already an active session for this chat
      const existingSession = await ChatSession.findOne({
        where: {
          chatId: chat.id,
          status: [SessionStatus.SCHEDULED, SessionStatus.ONGOING],
          isActive: true,
        },
      });

      if (existingSession) {
        return {
          success: false,
          message: 'An active session already exists',
          data: { 
            sessionId: existingSession.sessionId,
            session: existingSession,
          },
        };
      }

      // Generate session ID
      const sessionId = ChatSession.generateSessionId(data.doctorId, data.patientId);

      // Create new session
      const session = await ChatSession.create({
        chatId: chat.id,
        sessionId,
        doctorId: data.doctorId,
        patientId: data.patientId,
        sessionType: data.sessionType,
        sessionToken: data.sessionToken,
        status: SessionStatus.SCHEDULED,
      });

      // Send initial system message
      await this.sendSystemMessage(session.id, 'Chat session created. Waiting for participants to join...');

      return {
        success: true,
        message: 'Chat session created successfully',
        data: {
          session: {
            id: session.id,
            sessionId: session.sessionId,
            status: session.status,
            sessionType: session.sessionType,
            chatId: chat.id,
          },
        },
      };
    } catch (error) {
      logger.error('Create chat session error:', error);
      return {
        success: false,
        message: 'Failed to create chat session',
        error,
      };
    }
  }



  // Send a message
  async sendMessage(data: SendMessageData) {
    try {
      const session = await ChatSession.findOne({
        where: {
          id: data.sessionId,
          isActive: true,
        },
        include: [
          { model: Chat, as: 'chat' },
          { model: User, as: 'patient', attributes: ['id', 'fullName', 'profileImage'] },
          { model: User, as: 'doctor', attributes: ['id', 'fullName', 'profileImage'] },
        ],
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      // Validate sender is part of the session
      if (data.senderId !== session.patientId && data.senderId !== session.doctorId) {
        return {
          success: false,
          message: 'Unauthorized to send message in this session',
        };
      }

      // Check if session is active
      if (session.status !== SessionStatus.ONGOING) {
        return {
          success: false,
          message: 'Session is not active',
        };
      }

      // Determine message direction
      const direction = data.senderId === session.patientId 
        ? MessageDirection.INBOUND 
        : MessageDirection.OUTBOUND;

      // Create message
      const message = await ChatMessage.create({
        chatId: session.chatId,
        sessionId: data.sessionId,
        senderId: data.senderId,
        messageType: data.messageType || MessageType.TEXT,
        direction,
        content: data.content,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        replyToMessageId: data.replyToMessageId,
        messageId: uuidv4(),
        status: MessageStatus.SENT,
        sentAt: new Date(),
      });

      // Mark message as delivered immediately (for chat)
      await message.update({
        status: MessageStatus.DELIVERED,
        deliveredAt: new Date(),
      });

      return {
        success: true,
        message: 'Message sent successfully',
        data: {
          message: {
            id: message.id,
            messageId: message.messageId,
            content: message.content,
            messageType: message.messageType,
            direction: message.direction,
            status: message.status,
            sentAt: message.sentAt,
            deliveredAt: message.deliveredAt,
            sender: {
              id: data.senderId,
              name: data.senderId === session.patientId 
                ? session.patient.fullName 
                : session.doctor.fullName,
            },
          },
        },
      };
    } catch (error) {
      logger.error('Send message error:', error);
      return {
        success: false,
        message: 'Failed to send message',
        error,
      };
    }
  }

  // Send system message
  async sendSystemMessage(sessionId: number, content: string) {
    try {
      const session = await ChatSession.findByPk(sessionId);
      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      const message = await ChatMessage.create({
        chatId: session.chatId,
        sessionId,
        senderId: 0, // System user
        messageType: MessageType.SYSTEM,
        direction: MessageDirection.SYSTEM,
        content,
        messageId: uuidv4(),
        status: MessageStatus.DELIVERED,
        sentAt: new Date(),
        deliveredAt: new Date(),
      });

      return {
        success: true,
        message: 'System message sent',
        data: { message },
      };
    } catch (error) {
      logger.error('Send system message error:', error);
      return {
        success: false,
        message: 'Failed to send system message',
        error,
      };
    }
  }

  // Get messages for a session
  async getMessages(sessionId: number, userId: number, filters: MessageFilters = {}) {
    try {
      const session = await ChatSession.findOne({
        where: {
          id: sessionId,
          isActive: true,
        },
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      // Validate user is part of the session
      if (userId !== session.patientId && userId !== session.doctorId) {
        return {
          success: false,
          message: 'Unauthorized to access this session',
        };
      }

      const whereClause: any = {
        sessionId,
        isActive: true,
      };

      if (filters.status) whereClause.status = filters.status;
      if (filters.messageType) whereClause.messageType = filters.messageType;
      if (filters.beforeDate) whereClause.createdAt = { [Op.lt]: filters.beforeDate };
      if (filters.afterDate) whereClause.createdAt = { [Op.gt]: filters.afterDate };

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      const { count, rows } = await ChatMessage.findAndCountAll({
        where: whereClause,
        include: [
          { model: User, as: 'sender', attributes: ['id', 'fullName', 'profileImage'] },
        ],
        order: [['createdAt', 'ASC']],
        limit,
        offset,
      });

      return {
        success: true,
        message: 'Messages retrieved successfully',
        data: {
          messages: rows,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit,
          },
        },
      };
    } catch (error) {
      logger.error('Get messages error:', error);
      return {
        success: false,
        message: 'Failed to retrieve messages',
        error,
      };
    }
  }

  // Mark messages as read
  async markMessagesAsRead(sessionId: number, userId: number, messageIds?: number[]) {
    try {
      const session = await ChatSession.findOne({
        where: {
          id: sessionId,
          isActive: true,
        },
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      // Validate user is part of the session
      if (userId !== session.patientId && userId !== session.doctorId) {
        return {
          success: false,
          message: 'Unauthorized to access this session',
        };
      }

      const whereClause: any = {
        sessionId,
        status: MessageStatus.DELIVERED,
        isActive: true,
      };

      // Mark specific messages or all unread messages
      if (messageIds && messageIds.length > 0) {
        whereClause.id = { [Op.in]: messageIds };
      } else {
        // Mark all unread messages from the other participant
        const otherUserId = userId === session.patientId ? session.doctorId : session.patientId;
        whereClause.senderId = otherUserId;
      }

      const updatedCount = await ChatMessage.update(
        {
          status: MessageStatus.READ,
          readAt: new Date(),
        },
        {
          where: whereClause,
        }
      );

      return {
        success: true,
        message: `${updatedCount[0]} messages marked as read`,
        data: { updatedCount: updatedCount[0] },
      };
    } catch (error) {
      logger.error('Mark messages as read error:', error);
      return {
        success: false,
        message: 'Failed to mark messages as read',
        error,
      };
    }
  }

  // End chat session
  async endSession(sessionId: number, userId: number) {
    try {
      const session = await ChatSession.findOne({
        where: {
          id: sessionId,
          isActive: true,
        },
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      // Validate user is part of the session
      if (userId !== session.patientId && userId !== session.doctorId) {
        return {
          success: false,
          message: 'Unauthorized to end this session',
        };
      }

      session.markAsEnded();
      await session.save();

      // Send system message
      await this.sendSystemMessage(sessionId, 'Chat session ended');

      return {
        success: true,
        message: 'Chat session ended successfully',
        data: {
          session: {
            id: session.id,
            sessionId: session.sessionId,
            status: session.status,
            endTime: session.endTime,
            duration: session.duration,
          },
        },
      };
    } catch (error) {
      logger.error('End session error:', error);
      return {
        success: false,
        message: 'Failed to end session',
        error,
      };
    }
  }

  // Get user's chat sessions
  async getUserSessions(userId: number, userRole: string, filters: any = {}) {
    try {
      const whereClause: any = {
        isActive: true,
      };

      if (userRole === 'patient') {
        whereClause.patientId = userId;
      } else if (userRole === 'doctor') {
        whereClause.doctorId = userId;
      } else {
        return {
          success: false,
          message: 'Invalid user role',
        };
      }

      if (filters.status) whereClause.status = filters.status;
      if (filters.sessionType) whereClause.sessionType = filters.sessionType;

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await ChatSession.findAndCountAll({
        where: whereClause,
        include: [
          { model: Chat, as: 'chat' },
          { model: User, as: 'patient', attributes: ['id', 'fullName', 'profileImage'] },
          { model: User, as: 'doctor', attributes: ['id', 'fullName', 'profileImage'] },
        ],
        order: [['updatedAt', 'DESC']],
        limit,
        offset,
      });

      return {
        success: true,
        message: 'Sessions retrieved successfully',
        data: {
          sessions: rows,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit,
          },
        },
      };
    } catch (error) {
      logger.error('Get user sessions error:', error);
      return {
        success: false,
        message: 'Failed to retrieve sessions',
        error,
      };
    }
  }

  // Get session details
  async getSessionDetails(sessionId: number, userId: number) {
    try {
      const session = await ChatSession.findOne({
        where: {
          id: sessionId,
          isActive: true,
        },
        include: [
          { model: Chat, as: 'chat' },
          { model: User, as: 'patient', attributes: ['id', 'fullName', 'profileImage'] },
          { model: User, as: 'doctor', attributes: ['id', 'fullName', 'profileImage'] },
        ],
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      // Validate user is part of the session
      if (userId !== session.patientId && userId !== session.doctorId) {
        return {
          success: false,
          message: 'Unauthorized to access this session',
        };
      }

      return {
        success: true,
        message: 'Session details retrieved successfully',
        data: { session },
      };
    } catch (error) {
      logger.error('Get session details error:', error);
      return {
        success: false,
        message: 'Failed to retrieve session details',
        error,
      };
    }
  }

  // Get chat history between doctor and patient
  async getChatHistory(doctorId: number, patientId: number, userId: number) {
    try {
      // Validate user is either the doctor or patient
      if (userId !== doctorId && userId !== patientId) {
        return {
          success: false,
          message: 'Unauthorized to access this chat history',
        };
      }

      const chat = await Chat.findOne({
        where: {
          doctorId,
          patientId,
          // isActive: true,
        },
        include: [
          { model: User, as: 'patient', attributes: ['id', 'fullName', 'profileImage'] },
          { model: User, as: 'doctor', attributes: ['id', 'fullName', 'profileImage'] },
          {
            model: ChatSession,
            as: 'sessions',
            // where: { isActive: true },
            include: [
              {
                model: ChatMessage,
                as: 'messages',
                // where: { isActive: true },
                include: [
                  { model: User, as: 'sender', attributes: ['id', 'fullName', 'profileImage'] },
                ],
                order: [['createdAt', 'ASC']],
              },
            ],
            order: [['createdAt', 'DESC']],
          },
        ],
      });

      // if (!chat) {
      //   return {
      //     success: false,
      //     message: 'Chat history not found',
      //   };
      // }

      return {
        success: true,
        message: 'Chat history retrieved successfully',
        data: { chat },
      };
    } catch (error) {
      logger.error('Get chat history error:', error);
      return {
        success: false,
        message: 'Failed to retrieve chat history',
        error,
      };
    }
  }
}
