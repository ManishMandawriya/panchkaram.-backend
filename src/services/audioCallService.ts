import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface AudioCallSession {
  id: string;
  channelName: string;
  patientId: number;
  doctorId: number;
  status: 'pending' | 'active' | 'ended';
  createdAt: Date;
  endedAt?: Date;
  patientToken?: string;
  doctorToken?: string;
}

export class AudioCallService {
  private sessions: Map<string, AudioCallSession> = new Map();

  /**
   * Generate Agora RTC token for audio calls
   */
  private generateToken(channelName: string, uid: string, role: number = RtcRole.PUBLISHER): string {
    try {
      const appID = config.AGORA_APP_ID;
      const appCertificate = config.AGORA_APP_CERTIFICATE;
      
      if (!appID || !appCertificate) {
        throw new Error('Agora App ID and Certificate are required');
      }

      const expirationTimeInSeconds = 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      const token = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs,
        privilegeExpiredTs
      );

      return token;
    } catch (error) {
      logger.error('Error generating Agora token:', error);
      throw new Error('Failed to generate token');
    }
  }

  /**
   * Create a new audio call session for testing
   */
  async createAudioCallSession(): Promise<{
    success: boolean;
    data?: {
      sessionId: string;
      channelName: string;
      user1Token: string;
      user2Token: string;
    };
    message?: string;
  }> {
    try {
      const sessionId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const channelName = `audio_channel_${sessionId}`;
      
      // Generate tokens for both users
      const user1Token = this.generateToken(channelName, `user1`);
      const user2Token = this.generateToken(channelName, `user2`);

      const session: AudioCallSession = {
        id: sessionId,
        channelName,
        patientId: 1, // Dummy values for compatibility
        doctorId: 2,
        status: 'pending',
        createdAt: new Date(),
        patientToken: user1Token,
        doctorToken: user2Token
      };

      this.sessions.set(sessionId, session);

      logger.info(`Audio call session created: ${sessionId}`);

      return {
        success: true,
        data: {
          sessionId,
          channelName,
          user1Token,
          user2Token
        }
      };
    } catch (error) {
      logger.error('Error creating audio call session:', error);
      return {
        success: false,
        message: 'Failed to create audio call session'
      };
    }
  }

  /**
   * Get audio call session details
   */
  async getAudioCallSession(sessionId: string): Promise<{
    success: boolean;
    data?: AudioCallSession;
    message?: string;
  }> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          message: 'Audio call session not found'
        };
      }

      return {
        success: true,
        data: session
      };
    } catch (error) {
      logger.error('Error getting audio call session:', error);
      return {
        success: false,
        message: 'Failed to get audio call session'
      };
    }
  }

  /**
   * Join an audio call session
   */
  async joinAudioCallSession(sessionId: string, userType: 'user1' | 'user2'): Promise<{
    success: boolean;
    data?: {
      channelName: string;
      token: string;
      uid: string;
    };
    message?: string;
  }> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          message: 'Audio call session not found'
        };
      }

      // Update session status to active if it was pending
      if (session.status === 'pending') {
        session.status = 'active';
        this.sessions.set(sessionId, session);
      }

      const token = userType === 'user1' ? session.patientToken! : session.doctorToken!;
      const uid = userType;

      logger.info(`User ${userType} joined audio call session: ${sessionId}`);

      return {
        success: true,
        data: {
          channelName: session.channelName,
          token,
          uid
        }
      };
    } catch (error) {
      logger.error('Error joining audio call session:', error);
      return {
        success: false,
        message: 'Failed to join audio call session'
      };
    }
  }

  /**
   * End an audio call session
   */
  async endAudioCallSession(sessionId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          message: 'Audio call session not found'
        };
      }

      session.status = 'ended';
      session.endedAt = new Date();
      this.sessions.set(sessionId, session);

      logger.info(`Audio call session ended: ${sessionId}`);

      return {
        success: true,
        message: 'Audio call session ended successfully'
      };
    } catch (error) {
      logger.error('Error ending audio call session:', error);
      return {
        success: false,
        message: 'Failed to end audio call session'
      };
    }
  }

  /**
   * Get all audio call sessions
   */
  async getAllAudioCallSessions(): Promise<{
    success: boolean;
    data?: AudioCallSession[];
    message?: string;
  }> {
    try {
      const sessions: AudioCallSession[] = Array.from(this.sessions.values());

      // Sort by creation date (newest first)
      sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        success: true,
        data: sessions
      };
    } catch (error) {
      logger.error('Error getting audio call sessions:', error);
      return {
        success: false,
        message: 'Failed to get audio call sessions'
      };
    }
  }

  /**
   * Generate a new token for an existing session
   */
  async refreshToken(sessionId: string, userType: 'user1' | 'user2'): Promise<{
    success: boolean;
    data?: {
      token: string;
      uid: string;
    };
    message?: string;
  }> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          message: 'Audio call session not found'
        };
      }

      const uid = userType;
      const newToken = this.generateToken(session.channelName, uid);

      // Update the token in the session
      if (userType === 'user1') {
        session.patientToken = newToken;
      } else {
        session.doctorToken = newToken;
      }
      this.sessions.set(sessionId, session);

      return {
        success: true,
        data: {
          token: newToken,
          uid
        }
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      return {
        success: false,
        message: 'Failed to refresh token'
      };
    }
  }
}
