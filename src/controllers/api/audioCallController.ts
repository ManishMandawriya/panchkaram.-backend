import { Request, Response } from 'express';
import { AudioCallService } from '../../services/audioCallService';
import { logger } from '../../utils/logger';

export class AudioCallController {
  private audioCallService: AudioCallService;

  constructor() {
    this.audioCallService = new AudioCallService();
  }

  // POST /api/audio-call/sessions - Create a new audio call session
  async createAudioCallSession(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.audioCallService.createAudioCallSession();

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error('Create audio call session controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create audio call session. Please try again.',
      });
    }
  }

  // GET /api/audio-call/sessions/:sessionId - Get audio call session details
  async getAudioCallSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const result = await this.audioCallService.getAudioCallSession(sessionId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Get audio call session controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audio call session. Please try again.',
      });
    }
  }

  // POST /api/audio-call/sessions/:sessionId/join - Join an audio call session
  async joinAudioCallSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { userType } = req.body;

      if (!userType || !['user1', 'user2'].includes(userType)) {
        res.status(400).json({
          success: false,
          message: 'userType must be either "user1" or "user2"',
        });
        return;
      }

      const result = await this.audioCallService.joinAudioCallSession(sessionId, userType as 'user1' | 'user2');

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Join audio call session controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join audio call session. Please try again.',
      });
    }
  }

  // PUT /api/audio-call/sessions/:sessionId/end - End an audio call session
  async endAudioCallSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const result = await this.audioCallService.endAudioCallSession(sessionId);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('End audio call session controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end audio call session. Please try again.',
      });
    }
  }

  // GET /api/audio-call/sessions - Get all audio call sessions
  async getAllAudioCallSessions(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.audioCallService.getAllAudioCallSessions();

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get all audio call sessions controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audio call sessions. Please try again.',
      });
    }
  }

  // POST /api/audio-call/sessions/:sessionId/refresh-token - Refresh token for a session
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { userType } = req.body;

      if (!userType || !['user1', 'user2'].includes(userType)) {
        res.status(400).json({
          success: false,
          message: 'userType must be either "user1" or "user2"',
        });
        return;
      }

      const result = await this.audioCallService.refreshToken(sessionId, userType as 'user1' | 'user2');

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Refresh token controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token. Please try again.',
      });
    }
  }
}
