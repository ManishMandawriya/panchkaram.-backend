import { Router } from 'express';
import { AudioCallController } from '../../controllers/api/audioCallController';
import { validateRequest } from '../../middleware/validateRequest';
import { 
  createAudioCallSessionSchema, 
  joinAudioCallSessionSchema,
  endAudioCallSessionSchema,
  getAudioCallSessionSchema,
  refreshTokenSchema
} from '../../validations/audioCallValidation';

const router = Router();
const audioCallController = new AudioCallController();

// Session Management
router.post('/sessions', 
  validateRequest(createAudioCallSessionSchema), 
  audioCallController.createAudioCallSession.bind(audioCallController)
);

router.get('/sessions', 
  audioCallController.getAllAudioCallSessions.bind(audioCallController)
);

router.get('/sessions/:sessionId', 
  validateRequest(getAudioCallSessionSchema),
  audioCallController.getAudioCallSession.bind(audioCallController)
);

router.post('/sessions/:sessionId/join', 
  audioCallController.joinAudioCallSession.bind(audioCallController)
);

router.put('/sessions/:sessionId/end', 
  validateRequest(endAudioCallSessionSchema),
  audioCallController.endAudioCallSession.bind(audioCallController)
);

// Token Management
router.post('/sessions/:sessionId/refresh-token', 
  validateRequest(refreshTokenSchema),
  audioCallController.refreshToken.bind(audioCallController)
);

export default router;
