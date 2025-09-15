import { Router } from 'express';
import { ChatController } from '../../controllers/api/chatController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateRequest } from '../../middleware/validateRequest';
import { 
  createSessionSchema, 
  sendMessageSchema, 
  markMessagesReadSchema,
  endSessionSchema,
  joinSessionSchema,
  verifySessionSchema
} from '../../validations/chatValidation';

const router = Router();
const chatController = new ChatController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Session Verification
router.get('/verify-session', 
  // validateRequest(verifySessionSchema),
  chatController.verifySession.bind(chatController)
);

// Session Management
router.post('/sessions', 
  validateRequest(createSessionSchema), 
  chatController.createSession.bind(chatController)
);

router.get('/sessions', 
  chatController.getUserSessions.bind(chatController)
);

router.get('/sessions/:id', 
  chatController.getSessionDetails.bind(chatController)
);

router.post('/sessions/:sessionId/join', 
  validateRequest(joinSessionSchema),
  chatController.joinSession.bind(chatController)
);

// Alternative route for joining sessions with sessionId in body
router.post('/join-session', 
  validateRequest(joinSessionSchema),
  chatController.joinSession.bind(chatController)
);

router.put('/sessions/:id/end', 
  validateRequest(endSessionSchema),
  chatController.endSession.bind(chatController)
);

// Message Management
router.post('/sessions/:id/messages', 
  validateRequest(sendMessageSchema),
  chatController.sendMessage.bind(chatController)
);

router.get('/sessions/:id/messages', 
  chatController.getMessages.bind(chatController)
);

router.put('/sessions/:id/messages/read', 
  validateRequest(markMessagesReadSchema),
  chatController.markMessagesAsRead.bind(chatController)
);

// Chat History
router.get('/history/:doctorId/:patientId', 
  chatController.getChatHistory.bind(chatController)
);

export default router;
