import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { logger } from '../utils/logger';

export interface AgoraTokenResponse {
  success: boolean;
  data?: {
    token: string;
    channelName: string;
    uid: number;
    appId: string;
    expirationTime: number;
  };
  message?: string;
}

export class AgoraService {
  private appId: string;
  private appCertificate: string;
  private tokenExpirationInSeconds: number;

  constructor() {
    this.appId = process.env.AGORA_APP_ID || '';
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE || '';
    this.tokenExpirationInSeconds = 300; // 1 hour
    // this.tokenExpirationInSeconds = 3600; // 1 hour

    if (!this.appId || !this.appCertificate) {
      logger.warn('Agora credentials not found in environment variables');
    }
  }

  /**
   * Generate Agora RTC token for audio/video calls
   */
  async generateRtcToken(
    channelName: string,
    userId: number,
    role: 'publisher' | 'subscriber' = 'publisher'
  ): Promise<AgoraTokenResponse> {
    try {
      if (!this.appId || !this.appCertificate) {
        return {
          success: false,
          message: 'Agora credentials not configured'
        };
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + this.tokenExpirationInSeconds;
      
      // Use userId as UID for Agora
      const uid = userId;
      
      // Determine role (both should be publisher for calls)
      const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

      // Generate token
      const token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        agoraRole,
        privilegeExpiredTs, // tokenExpire
        privilegeExpiredTs  // privilegeExpire
      );

      logger.info(`Generated Agora token for user ${userId} in channel ${channelName}`);

      return {
        success: true,
        data: {
          token,
          channelName,
          uid,
          appId: this.appId,
          expirationTime: privilegeExpiredTs
        }
      };

    } catch (error) {
      logger.error('Error generating Agora token:', error);
      return {
        success: false,
        message: 'Failed to generate Agora token'
      };
    }
  }

  /**
   * Generate channel name for a session
   */
  generateChannelName(sessionId: string): string {
    // Use sessionId as channel name (ensure it's valid)
    return `call_${sessionId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }

  /**
   * Validate if Agora is properly configured
   */
  isConfigured(): boolean {
    return !!(this.appId && this.appCertificate);
  }

  /**
   * Get Agora configuration status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      appId: this.appId ? `${this.appId.substring(0, 8)}...` : 'Not set',
      tokenExpiration: this.tokenExpirationInSeconds
    };
  }

  /**
   * Clean up Agora resources when call ends
   * This doesn't actually terminate the channel on Agora's side (that happens automatically),
   * but provides information needed for client-side cleanup
   */
  async cleanupCall(sessionId: string): Promise<{
    success: boolean;
    data?: {
      channelName: string;
      shouldLeaveChannel: boolean;
    };
    message?: string;
  }> {
    try {
      const channelName = this.generateChannelName(sessionId);
      
      logger.info(`Cleaning up Agora resources for session ${sessionId}, channel: ${channelName}`);
      
      return {
        success: true,
        data: {
          channelName,
          shouldLeaveChannel: true
        }
      };
      
    } catch (error) {
      logger.error('Error cleaning up Agora resources:', error);
      return {
        success: false,
        message: 'Failed to cleanup Agora resources'
      };
    }
  }

  /**
   * Generate a new token with very short expiration to effectively revoke access
   * This is a workaround since Agora doesn't have direct token revocation
   */
  async revokeToken(channelName: string, userId: number): Promise<AgoraTokenResponse> {
    try {
      if (!this.appId || !this.appCertificate) {
        return {
          success: false,
          message: 'Agora credentials not configured'
        };
      }

      // Generate token that expires in 1 second (effectively revoked)
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + 1;
      
      const uid = userId;
      const agoraRole = RtcRole.PUBLISHER;

      const token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        agoraRole,
        privilegeExpiredTs,
        privilegeExpiredTs
      );

      logger.info(`Revoked Agora token for user ${userId} in channel ${channelName}`);

      return {
        success: true,
        data: {
          token,
          channelName,
          uid,
          appId: this.appId,
          expirationTime: privilegeExpiredTs
        }
      };

    } catch (error) {
      logger.error('Error revoking Agora token:', error);
      return {
        success: false,
        message: 'Failed to revoke Agora token'
      };
    }
  }
}
