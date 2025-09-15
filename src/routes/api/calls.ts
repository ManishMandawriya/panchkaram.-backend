import { Router } from 'express';
import { CallController } from '../../controllers/api/callController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateRequest } from '../../middleware/validateRequest';
import { 
  initiateCallSchema,
  answerCallSchema,
  declineCallSchema,
  endCallSchema,
  markCallMissedSchema
} from '../../validations/callValidation';

const router = Router();
const callController = new CallController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Call Management Routes

// POST /api/calls/initiate - Initiate a call (doctor only)
router.post('/initiate', 
  validateRequest(initiateCallSchema),
  callController.initiateCall.bind(callController)
);

// POST /api/calls/answer - Answer a call (patient only)
router.post('/answer', 
  validateRequest(answerCallSchema),
  callController.answerCall.bind(callController)
);

// POST /api/calls/decline - Decline a call (patient only)
router.post('/decline', 
  validateRequest(declineCallSchema),
  callController.declineCall.bind(callController)
);

// POST /api/calls/end - End a call (both doctor and patient)
router.post('/end', 
  validateRequest(endCallSchema),
  callController.endCall.bind(callController)
);

// GET /api/calls/active - Get active call
router.get('/active', 
  callController.getActiveCall.bind(callController)
);

// POST /api/calls/missed - Mark call as missed
router.post('/missed', 
  validateRequest(markCallMissedSchema),
  callController.markCallAsMissed.bind(callController)
);

// GET /api/calls/status/:userId - Check if user is busy
router.get('/status/:userId', 
  callController.checkUserBusy.bind(callController)
);

// GET /api/calls/agora-token/:sessionId - Generate Agora token for session
router.get('/agora-token/:sessionId',
  authMiddleware,
  callController.generateAgoraToken.bind(callController)
);

// GET /api/calls/agora-status - Get Agora service status
router.get('/agora-status',
  callController.getAgoraStatus.bind(callController)
);

export default router;
