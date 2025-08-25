import { Request, Response } from 'express';
import { ChatService } from '../../services/chatService';
import { SessionType, SessionStatus } from '../../models/ChatSession';
import { MessageType, MessageStatus } from '../../models/ChatMessage';
import { logger } from '../../utils/logger';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  // GET /api/chat/verify-session - Verify if user has an active session
  async verifySession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      // console.log('userId--------------------------->',userId);
      // console.log('userRole--------------------------->',userRole);
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!userRole || !['patient', 'doctor'].includes(userRole)) {
        res.status(400).json({
          success: false,
          message: 'Valid user role is required',
        });
        return;
      }

      const result = await this.chatService.verifySession(userId, userRole);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Verify session controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify session. Please try again.',
      });
    }
  }

  // POST /api/chat/sessions - Create a new chat session
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { doctorId, sessionType, sessionToken } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (userRole !== 'patient') {
        res.status(403).json({
          success: false,
          message: 'Only patients can create chat sessions',
        });
        return;
      }

      if (!doctorId || !sessionType) {
        res.status(400).json({
          success: false,
          message: 'Doctor ID and session type are required',
        });
        return;
      }

      const result = await this.chatService.createSession({
        patientId: userId,
        doctorId,
        sessionType,
        sessionToken,
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error('Create chat session controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create chat session. Please try again.',
      });
    }
  }

  // POST /api/chat/sessions/:sessionId/join - Join a session
  async joinSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!userRole || !['patient', 'doctor'].includes(userRole)) {
        res.status(400).json({
          success: false,
          message: 'Valid user role is required',
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

      const result = await this.chatService.joinSession(parseInt(sessionId), userId, userRole);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Join session controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join session. Please try again.',
      });
    }
  }

  // POST /api/chat/sessions/:id/messages - Send a message
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const sessionId = parseInt(req.params.id);
      const { content, messageType, fileUrl, fileName, fileType, fileSize, replyToMessageId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (isNaN(sessionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid session ID',
        });
        return;
      }

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message content is required',
        });
        return;
      }

      const result = await this.chatService.sendMessage({
        sessionId,
        senderId: userId,
        content: content.trim(),
        messageType: messageType || MessageType.TEXT,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        replyToMessageId,
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error('Send message controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again.',
      });
    }
  }

  // GET /api/chat/sessions/:id/messages - Get messages for a session
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const sessionId = parseInt(req.params.id);
      const { page, limit, status, messageType, beforeDate, afterDate } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (isNaN(sessionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid session ID',
        });
        return;
      }

      const filters = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
        status: status as MessageStatus,
        messageType: messageType as MessageType,
        beforeDate: beforeDate ? new Date(beforeDate as string) : undefined,
        afterDate: afterDate ? new Date(afterDate as string) : undefined,
      };

      const result = await this.chatService.getMessages(sessionId, userId, filters);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get messages controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve messages. Please try again.',
      });
    }
  }

  // PUT /api/chat/sessions/:id/messages/read - Mark messages as read
  async markMessagesAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const sessionId = parseInt(req.params.id);
      const { messageIds } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (isNaN(sessionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid session ID',
        });
        return;
      }

      const result = await this.chatService.markMessagesAsRead(sessionId, userId, messageIds);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Mark messages as read controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read. Please try again.',
      });
    }
  }

  // PUT /api/chat/sessions/:id/end - End a chat session
  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const sessionId = parseInt(req.params.id);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (isNaN(sessionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid session ID',
        });
        return;
      }

      const result = await this.chatService.endSession(sessionId, userId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('End session controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end session. Please try again.',
      });
    }
  }

  // GET /api/chat/sessions - Get user's chat sessions
  async getUserSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { page, limit, status, sessionType } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const filters = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        status: status as SessionStatus,
        sessionType: sessionType as SessionType,
      };

      const result = await this.chatService.getUserSessions(userId, userRole, filters);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get user sessions controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sessions. Please try again.',
      });
    }
  }

  // GET /api/chat/sessions/:id - Get session details
  async getSessionDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const sessionId = parseInt(req.params.id);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (isNaN(sessionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid session ID',
        });
        return;
      }

      const result = await this.chatService.getSessionDetails(sessionId, userId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get session details controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve session details. Please try again.',
      });
    }
  }

  // GET /api/chat/history/:doctorId/:patientId - Get chat history
  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const doctorId = parseInt(req.params.doctorId);
      const patientId = parseInt(req.params.patientId);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (isNaN(doctorId) || isNaN(patientId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid doctor ID or patient ID',
        });
        return;
      }

      const result = await this.chatService.getChatHistory(doctorId, patientId, userId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get chat history controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat history. Please try again.',
        error: error,
      });
    }
  }
}
