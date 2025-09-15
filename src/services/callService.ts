import { ChatSession, SessionStatus, SessionType } from '../models/ChatSession';
import { Chat } from '../models/Chat';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { AgoraService } from './agoraService';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export enum CallStatus {
  SCHEDULED = 'scheduled',
  RINGING = 'ringing',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  MISSED = 'missed',
  DECLINED = 'declined',
  BUSY = 'busy',
  FAILED = 'failed',
}

export enum CallEvent {
  CALL_INITIATED = 'call-initiated',
  CALL_RINGING = 'call-ringing',
  CALL_ANSWERED = 'call-answered',
  CALL_DECLINED = 'call-declined',
  CALL_ENDED = 'call-ended',
  CALL_MISSED = 'call-missed',
  CALL_BUSY = 'call-busy',
  CALL_FAILED = 'call-failed',
}

interface CallData {
  sessionId: string;
  callerId: number;
  receiverId: number;
  callType: 'audio_call' | 'video_call';
  callerName?: string;
  callerImage?: string;
  agora?: {
    token: string;
    channelName: string;
    uid: number;
    appId: string;
    expirationTime: number;
  };
}

interface CallResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export class CallService {
  private agoraService: AgoraService;

  constructor() {
    this.agoraService = new AgoraService();
  }
  
  // Initiate a call (both doctor and patient can initiate)
  async initiateCall(userId: number, sessionId: string, callType: 'audio_call' | 'video_call'): Promise<CallResponse> {
    try {
      // Find the session
      const session = await ChatSession.findOne({
        where: { sessionId, isActive: true, status: { [Op.ne]: SessionStatus.ENDED } },
        include: [
          { model: Chat, as: 'chat' },
          { model: User, as: 'patient', attributes: ['id', 'fullName', 'profileImage'] },
          { model: User, as: 'doctor', attributes: ['id', 'fullName', 'profileImage'] }
        ]
      });
      console.log('session--------------------------->', session);
      console.log('callType--------------------------->', callType);
      if (!session) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      // Verify user has access to this session
      if (session.doctorId !== userId && session.patientId !== userId) {
        return {
          success: false,
          message: 'Access denied to this session'
        };
      }

      // Check if session type matches call type
      const expectedSessionType = callType === 'audio_call' ? SessionType.AUDIO_CALL : SessionType.VIDEO_CALL;
      if (session.sessionType !== expectedSessionType) {
        return {
          success: false,
          message: `Session type mismatch. Expected ${session.sessionType} but got ${expectedSessionType}`
        };
      }

      // Check if session can be used for calls
      if (![SessionStatus.SCHEDULED, SessionStatus.ONGOING].includes(session.status)) {
        return {
          success: false,
          message: 'Session is not available for calls'
        };
      }

      // Generate Agora token and channel
      const channelName = this.agoraService.generateChannelName(sessionId);
      const agoraToken = await this.agoraService.generateRtcToken(channelName, userId);
      
      if (!agoraToken.success) {
        return {
          success: false,
          message: 'Failed to generate Agora token'
        };
      }

      // ✅ Store call info in session table
      await session.update({
        agoraChannelName: channelName,
        agoraAppId: agoraToken.data.appId,
        callerAgoraToken: agoraToken.data.token,
        callerAgoraUid: agoraToken.data.uid,
        callInitiatedAt: new Date(),
        status: SessionStatus.ONGOING,
        startTime: new Date()
      });

      // Determine caller and receiver
      const isDoctor = session.doctorId === userId;
      const receiverId = isDoctor ? session.patientId : session.doctorId;
      
      const callData: CallData = {
        sessionId: session.sessionId,
        callerId: userId,
        receiverId: receiverId,
        callType,
        callerName: isDoctor ? session.doctor?.fullName : session.patient?.fullName,
        callerImage: isDoctor ? session.doctor?.profileImage : session.patient?.profileImage,
        agora: agoraToken.data
      };

      return {
        success: true,
        message: 'Call initiated successfully',
        data: {
          callData,
          session: {
            id: session.id,
            sessionId: session.sessionId,
            status: session.status,
            sessionType: session.sessionType,
            participants: {
              doctor: session.doctor,
              patient: session.patient
            }
          }
        }
      };

    } catch (error) {
      logger.error('Initiate call service error:', error);
      return {
        success: false,
        message: 'Failed to initiate call',
        error
      };
    }
  }

  // Answer a call (both can answer)
  async answerCall(userId: number, sessionId: string): Promise<CallResponse> {
    try {
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
          message: 'Session not found'
        };
      }

      // Verify user has access to this session
      if (session.patientId !== userId && session.doctorId !== userId) {
        return {
          success: false,
          message: 'Access denied'
        };
      }

      // Check if there's an active call to answer
      if (!session.agoraChannelName || !session.callerAgoraToken) {
        return {
          success: false,
          message: 'No active call to answer'
        };
      }

      // Generate Agora token for the answering user (receiver)
      const agoraToken = await this.agoraService.generateRtcToken(session.agoraChannelName, userId);
      
      if (!agoraToken.success) {
        return {
          success: false,
          message: 'Failed to generate Agora token'
        };
      }

      // ✅ Store receiver's call info and mark call as answered
      const updateData: any = {
        receiverAgoraToken: agoraToken.data.token,
        receiverAgoraUid: agoraToken.data.uid,
        callAnsweredAt: new Date(),
        callStartedAt: new Date()
      };

      if (session.patientId === userId) {
        updateData.patientJoinedAt = new Date();
      } else {
        updateData.doctorJoinedAt = new Date();
      }
      
      await session.update(updateData);

      // ✅ Return stored call info from session
      return {
        success: true,
        message: 'Call answered successfully',
        data: {
          sessionId: session.sessionId,
          callType: session.sessionType === SessionType.AUDIO_CALL ? 'audio' : 'video',
          participants: {
            doctor: session.doctor,
            patient: session.patient
          },
          // ✅ Return stored call info
          agora: {
            channelName: session.agoraChannelName,
            appId: session.agoraAppId,
            callerToken: session.callerAgoraToken,
            callerUid: session.callerAgoraUid,
            receiverToken: agoraToken.data.token,
            receiverUid: agoraToken.data.uid
          }
        }
      };

    } catch (error) {
      logger.error('Answer call service error:', error);
      return {
        success: false,
        message: 'Failed to answer call',
        error
      };
    }
  }

  // Decline a call
  async declineCall(userId: number, sessionId: string, reason?: string): Promise<CallResponse> {
    try {
      const session = await ChatSession.findOne({
        where: { sessionId, isActive: true },
        include: [
          { model: User, as: 'patient', attributes: ['id', 'fullName'] },
          { model: User, as: 'doctor', attributes: ['id', 'fullName'] }
        ]
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      if (session.patientId !== userId && session.doctorId !== userId) {
        return {
          success: false,
          message: 'Access denied'
        };
      }

      // Update session status
      await session.update({
        status: SessionStatus.ENDED,
        endTime: new Date()
      });

      return {
        success: true,
        message: 'Call declined successfully',
        data: {
          sessionId: session.sessionId,
          reason: reason || 'Call declined by patient'
        }
      };

    } catch (error) {
      logger.error('Decline call service error:', error);
      return {
        success: false,
        message: 'Failed to decline call',
        error
      };
    }
  }

  // End a call
  async endCall(userId: number, sessionId: string): Promise<CallResponse> {
    try {
      const session = await ChatSession.findOne({
        where: { sessionId, isActive: true },
        include: [
          { model: User, as: 'patient', attributes: ['id', 'fullName'] },
          { model: User, as: 'doctor', attributes: ['id', 'fullName'] }
        ]
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      // Verify user has access to this session
      if (session.patientId !== userId && session.doctorId !== userId) {
        return {
          success: false,
          message: 'Access denied'
        };
      }

      // Determine who ended the call
      const endedBy = userId === session.doctorId ? 'doctor' : 'patient';
      const endTime = new Date();
      
      // Calculate call duration from call start time
      const callDuration = session.callStartedAt ? 
        Math.floor((endTime.getTime() - session.callStartedAt.getTime()) / 1000) : 0;

      // ✅ Update session with call ending info
      await session.update({
        status: SessionStatus.ENDED,
        endTime,
        duration: callDuration,
        callEndedAt: endTime,
        callEndedBy: endedBy,
        callEndReason: 'ended_by_user'
      });

      // Clean up Agora resources
      const agoraCleanup = await this.agoraService.cleanupCall(sessionId);
      
      return {
        success: true,
        message: 'Call ended successfully',
        data: {
          sessionId: session.sessionId,
          duration: callDuration,
          endedBy,
          callEndedAt: endTime,
          callEndReason: 'ended_by_user',
          agora: agoraCleanup.success ? agoraCleanup.data : undefined
        }
      };

    } catch (error) {
      logger.error('End call service error:', error);
      return {
        success: false,
        message: 'Failed to end call',
        error
      };
    }
  }

  // Get active call session
  async getActiveCall(userId: number): Promise<CallResponse> {
    try {
      const session = await ChatSession.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { patientId: userId },
            { doctorId: userId }
          ],
          sessionType: [SessionType.AUDIO_CALL, SessionType.VIDEO_CALL],
          status: [SessionStatus.ONGOING],
          isActive: true
        },
        include: [
          { model: User, as: 'patient', attributes: ['id', 'fullName', 'profileImage'] },
          { model: User, as: 'doctor', attributes: ['id', 'fullName', 'profileImage'] }
        ]
      });

      if (!session) {
        return {
          success: false,
          message: 'No active call found'
        };
      }

      return {
        success: true,
        message: 'Active call found',
        data: {
          session: {
            id: session.id,
            sessionId: session.sessionId,
            status: session.status,
            sessionType: session.sessionType,
            startTime: session.startTime,
            patientJoinedAt: session.patientJoinedAt,
            doctorJoinedAt: session.doctorJoinedAt,
            participants: {
              doctor: session.doctor,
              patient: session.patient
            }
          }
        }
      };

    } catch (error) {
      logger.error('Get active call service error:', error);
      return {
        success: false,
        message: 'Failed to get active call',
        error
      };
    }
  }

  // Mark call as missed
  async markCallAsMissed(sessionId: string): Promise<CallResponse> {
    try {
      const session = await ChatSession.findOne({
        where: { sessionId, isActive: true }
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      const endTime = new Date();
      const callDuration = session.callStartedAt ? 
        Math.floor((endTime.getTime() - session.callStartedAt.getTime()) / 1000) : 0;

      // ✅ Update session with missed call info
      await session.update({
        status: SessionStatus.ENDED,
        endTime,
        duration: callDuration,
        callEndedAt: endTime,
        callEndedBy: 'system',
        callEndReason: 'missed'
      });

      return {
        success: true,
        message: 'Call marked as missed',
        data: {
          sessionId: session.sessionId,
          callEndedAt: endTime,
          callEndReason: 'missed'
        }
      };

    } catch (error) {
      logger.error('Mark call as missed service error:', error);
      return {
        success: false,
        message: 'Failed to mark call as missed',
        error
      };
    }
  }

  // Check if user is busy (has active call)
  async isUserBusy(userId: number): Promise<boolean> {
    try {
      const activeCall = await ChatSession.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { patientId: userId },
            { doctorId: userId }
          ],
          sessionType: [SessionType.AUDIO_CALL, SessionType.VIDEO_CALL],
          status: SessionStatus.ONGOING,
          isActive: true
        }
      });

      return !!activeCall;
    } catch (error) {
      logger.error('Check user busy error:', error);
      return false;
    }
  }

  // Clean up Agora resources (public method for socket service)
  async cleanupAgoraResources(sessionId: string): Promise<CallResponse> {
    try {
      const cleanup = await this.agoraService.cleanupCall(sessionId);
      return {
        success: cleanup.success,
        message: cleanup.success ? 'Agora resources cleaned up' : cleanup.message,
        data: cleanup.data
      };
    } catch (error) {
      logger.error('Error cleaning up Agora resources:', error);
      return {
        success: false,
        message: 'Failed to cleanup Agora resources',
        error
      };
    }
  }

  // Generate Agora token for a user in a session
  async generateAgoraToken(userId: number, sessionId: string): Promise<CallResponse> {
    try {
      const session = await ChatSession.findOne({
        where: { sessionId, isActive: true }
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      // Verify user has access to this session
      if (session.patientId !== userId && session.doctorId !== userId) {
        return {
          success: false,
          message: 'Access denied'
        };
      }

      const channelName = this.agoraService.generateChannelName(sessionId);
      const agoraToken = await this.agoraService.generateRtcToken(channelName, userId);

      if (!agoraToken.success) {
        return {
          success: false,
          message: agoraToken.message || 'Failed to generate Agora token'
        };
      }

      return {
        success: true,
        message: 'Agora token generated successfully',
        data: agoraToken.data
      };

    } catch (error) {
      logger.error('Generate Agora token service error:', error);
      return {
        success: false,
        message: 'Failed to generate Agora token',
        error
      };
    }
  }

  // Get call information from session
  async getCallInfo(sessionId: string): Promise<CallResponse> {
    try {
      const session = await ChatSession.findOne({
        where: { sessionId, isActive: true },
        include: [
          { model: User, as: 'patient', attributes: ['id', 'fullName', 'profileImage'] },
          { model: User, as: 'doctor', attributes: ['id', 'fullName', 'profileImage'] }
        ]
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      // Check if there's call information
      if (!session.agoraChannelName) {
        return {
          success: false,
          message: 'No call information found for this session'
        };
      }

      return {
        success: true,
        message: 'Call information retrieved successfully',
        data: {
          sessionId: session.sessionId,
          callType: session.sessionType,
          status: session.getCallStatus(),
          callInitiatedAt: session.callInitiatedAt,
          callRingingAt: session.callRingingAt,
          callAnsweredAt: session.callAnsweredAt,
          callStartedAt: session.callStartedAt,
          callEndedAt: session.callEndedAt,
          callDuration: session.getCallDuration(),
          callEndedBy: session.callEndedBy,
          callEndReason: session.callEndReason,
          agora: {
            channelName: session.agoraChannelName,
            appId: session.agoraAppId,
            callerToken: session.callerAgoraToken,
            callerUid: session.callerAgoraUid,
            receiverToken: session.receiverAgoraToken,
            receiverUid: session.receiverAgoraUid
          },
          participants: {
            doctor: session.doctor,
            patient: session.patient
          }
        }
      };

    } catch (error) {
      logger.error('Get call info service error:', error);
      return {
        success: false,
        message: 'Failed to get call information',
        error
      };
    }
  }

  // Get Agora service status
  getAgoraStatus() {
    return this.agoraService.getStatus();
  }
}
