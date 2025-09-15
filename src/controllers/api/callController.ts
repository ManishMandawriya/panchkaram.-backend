import { Request, Response } from 'express';
import { CallService } from '../../services/callService';
import { logger } from '../../utils/logger';

export class CallController {
  private callService: CallService;

  constructor() {
    this.callService = new CallService();
  }

  // POST /api/calls/initiate - Initiate a call (both doctor and patient)
  async initiateCall(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { sessionId, callType } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!['doctor', 'patient'].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'Only doctors and patients can initiate calls',
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
        return;
      }

      if (!callType || !['audio_call', 'video_call'].includes(callType)) {
        res.status(400).json({
          success: false,
          message: 'Valid call type (audio_call/video_call) is required',
        });
        return;
      }

      // Check if user is already busy with another call
      const isBusy = await this.callService.isUserBusy(userId);
      if (isBusy) {
        res.status(409).json({
          success: false,
          message: 'You are currently busy with another call',
        });
        return;
      }

      const result = await this.callService.initiateCall(userId, sessionId, callType);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Initiate call controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate call. Please try again.',
      });
    }
  }

  // POST /api/calls/answer - Answer a call (both can answer)
  async answerCall(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { sessionId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!['doctor', 'patient'].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'Only doctors and patients can answer calls',
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
        return;
      }

      // Check if user is already busy with another call
      const isBusy = await this.callService.isUserBusy(userId);
      if (isBusy) {
        res.status(409).json({
          success: false,
          message: 'You are currently busy with another call',
        });
        return;
      }

      const result = await this.callService.answerCall(userId, sessionId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Answer call controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to answer call. Please try again.',
      });
    }
  }

  // POST /api/calls/decline - Decline a call (both can decline)
  async declineCall(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { sessionId, reason } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!['doctor', 'patient'].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'Only doctors and patients can decline calls',
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
        return;
      }

      const result = await this.callService.declineCall(userId, sessionId, reason);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Decline call controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to decline call. Please try again.',
      });
    }
  }

  // POST /api/calls/end - End a call (both doctor and patient)
  async endCall(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { sessionId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
        return;
      }

      const result = await this.callService.endCall(userId, sessionId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('End call controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end call. Please try again.',
      });
    }
  }

  // GET /api/calls/active - Get active call
  async getActiveCall(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const result = await this.callService.getActiveCall(userId);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Get active call controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active call. Please try again.',
      });
    }
  }

  // POST /api/calls/missed - Mark call as missed
  async markCallAsMissed(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
        return;
      }

      const result = await this.callService.markCallAsMissed(sessionId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Mark call as missed controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark call as missed. Please try again.',
      });
    }
  }

  // GET /api/calls/status/:userId - Check if user is busy
  async checkUserBusy(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const isBusy = await this.callService.isUserBusy(parseInt(userId));
      res.status(200).json({
        success: true,
        message: 'User status retrieved successfully',
        data: {
          userId: parseInt(userId),
          isBusy
        }
      });
    } catch (error) {
      logger.error('Check user busy controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check user status. Please try again.',
      });
    }
  }

  // GET /api/calls/agora-token/:sessionId - Generate Agora token for a session
  async generateAgoraToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
        return;
      }

      const result = await this.callService.generateAgoraToken(userId, sessionId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Generate Agora token controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate Agora token. Please try again.',
      });
    }
  }

  // GET /api/calls/agora-status - Get Agora service status
  async getAgoraStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.callService.getAgoraStatus();
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get Agora status controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Agora status.',
      });
    }
  }
}
