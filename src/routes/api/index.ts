import { Router } from 'express';
import authRoutes from './auth';
import categoryRoutes from './categories';
import reviewRoutes from './reviews';
import doctorRoutes from './doctors';
import appointmentRoutes from './appointments';
import doctorAppointmentRoutes from './doctorAppointments';
import doctorSlotRoutes from './doctorSlots';
import doctorReviewRoutes from './doctorReviews';
import serviceRoutes from './services';
import doctorServiceRoutes from './doctorServices';
import bannerRoutes from './banners';
import chatRoutes from './chat';
import audioCallRoutes from './audioCall';
import callRoutes from './calls';


const router = Router();

// API version prefix
const API_VERSION = 'v1'; // Default version

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// API documentation
router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Documentation',
    version: API_VERSION,
    endpoints: {
      auth: {
        'POST /auth/register': 'Register a new user (Patient, Doctor, Clinic)',
        'POST /auth/login': 'User login',
        'POST /auth/forgot-password': 'Request password reset',
        'POST /auth/verify-code': 'Verify reset code',
        'POST /auth/reset-password': 'Reset password with code',
        'POST /auth/refresh-token': 'Refresh access token',
        'GET /auth/profile': 'Get user profile (protected)',
        'PUT /auth/profile': 'Update user profile (protected)',
        'POST /auth/change-password': 'Change password (protected)',
        'POST /auth/logout': 'Logout (protected)',
      },
      categories: {
        'GET /categories': 'Get active categories (public)',
        'GET /categories/:id': 'Get category by ID (public)',
      },
      reviews: {
        'POST /reviews': 'Create a new review (protected)',
        'GET /reviews': 'Get all reviews with filters (protected)',
        'GET /reviews/statistics': 'Get review statistics (protected)',
        'GET /reviews/doctor/:doctorId': 'Get reviews by doctor (protected)',
        'GET /reviews/patient/me': 'Get current user reviews (protected)',
        'GET /reviews/:id': 'Get review by ID (protected)',
        'PUT /reviews/:id': 'Update review (protected)',
        'DELETE /reviews/:id': 'Delete review (protected)',
      },
      doctors: {
        'GET /doctors': 'Get all doctors (public)',
        'GET /doctors/top': 'Get top doctors (public)',
        'POST /doctors/search': 'Search doctors (public)',
        'GET /doctors/:id': 'Get doctor by ID (public)',
      },
      appointments: {
        'POST /appointments': 'Create appointment (protected)',
        'GET /appointments': 'Get appointments (protected)',
        'GET /appointments/my': 'Get my appointments (protected)',
        'GET /appointments/:id': 'Get appointment by ID (protected)',
        'PUT /appointments/:id/status': 'Update appointment status (protected)',
        'DELETE /appointments/:id': 'Cancel appointment (protected)',
        'GET /doctors/:doctorId/available-slots': 'Get available slots (protected)',
      },
      doctorAppointments: {
        'GET /doctor/appointments': 'Get doctor appointments (protected, doctor only)',
        'GET /doctor/appointments/pending': 'Get pending appointments (protected, doctor only)',
        'GET /doctor/appointments/upcoming': 'Get upcoming appointments (protected, doctor only)',
        'GET /doctor/appointments/completed': 'Get completed appointments (protected, doctor only)',
        'GET /doctor/appointments/:id': 'Get appointment details (protected, doctor only)',
        'PUT /doctor/appointments/:id/status': 'Update appointment status (protected, doctor only)',
        'PUT /doctor/appointments/:id/accept': 'Accept appointment (protected, doctor only)',
        'PUT /doctor/appointments/:id/reject': 'Reject appointment (protected, doctor only)',
        'PUT /doctor/appointments/:id/complete': 'Mark appointment complete (protected, doctor only)',
        'GET /doctor/appointments/stats/overview': 'Get appointment statistics (protected, doctor only)',
      },
      doctorSlots: {
        'GET /doctor/slots': 'Get doctor time slots (protected, doctor only)',
        'POST /doctor/slots': 'Create or update doctor time slots (protected, doctor only)',
      },
      doctorReviews: {
        'GET /doctor/reviews': 'Get doctor reviews (protected, doctor only)',
        'GET /doctor/reviews/statistics': 'Get review statistics (protected, doctor only)',
        'GET /doctor/reviews/:id': 'Get specific review (protected, doctor only)',
        'DELETE /doctor/reviews/:id': 'Delete review (protected, doctor only)',
      },
      chat: {
        'POST /chat/sessions': 'Create a new chat session (protected, patient only)',
        'GET /chat/sessions': 'Get user chat sessions (protected)',
        'GET /chat/sessions/:id': 'Get session details (protected)',
        'GET /chat/sessions/:id/status': 'Get session status (protected)',
        'PUT /chat/sessions/:id/start': 'Start chat session (protected, doctor only)',
        'PUT /chat/sessions/:id/end': 'End chat session (protected)',
        'POST /chat/sessions/:id/messages': 'Send a message (protected)',
        'GET /chat/sessions/:id/messages': 'Get session messages (protected)',
        'PUT /chat/sessions/:id/messages/read': 'Mark messages as read (protected)',
      },
      audioCall: {
        'POST /audio-call/sessions': 'Create a new audio call session (public)',
        'GET /audio-call/sessions': 'Get all audio call sessions (public)',
        'GET /audio-call/sessions/:sessionId': 'Get audio call session details (public)',
        'POST /audio-call/sessions/:sessionId/join': 'Join an audio call session (public)',
        'PUT /audio-call/sessions/:sessionId/end': 'End an audio call session (public)',
        'POST /audio-call/sessions/:sessionId/refresh-token': 'Refresh token for a session (public)',
      },
      calls: {
        'POST /calls/initiate': 'Initiate a call (protected, doctor only)',
        'POST /calls/answer': 'Answer a call (protected, patient only)',
        'POST /calls/decline': 'Decline a call (protected, patient only)',
        'POST /calls/end': 'End a call (protected)',
        'GET /calls/active': 'Get active call (protected)',
        'POST /calls/missed': 'Mark call as missed (protected)',
        'GET /calls/status/:userId': 'Check if user is busy (protected)',
      },
      services: {
        'GET /services': 'Get all services (public)',
        'GET /services/prices': 'Get service prices (public)',
        'GET /services/:id': 'Get service by ID (public)',
        'GET /services/type/:type': 'Get service by type (public)',
        'POST /services/initialize': 'Initialize default services (public)',
      },
      doctorServices: {
        'GET /doctor/:doctorId/services': 'Get doctor services and pricing (public)',
        'PUT /doctor/:doctorId/services': 'Update doctor services and pricing (protected)',
        'GET /doctor/:doctorId/availability': 'Get doctor availability (public)',
        'PUT /doctor/:doctorId/availability': 'Update doctor availability (protected)',
        'GET /doctor/:doctorId/profile': 'Get doctor profile with services and availability (public)',
        'PUT /doctor/:doctorId/degrees': 'Update doctor degrees array (protected)',
        'PUT /doctor/:doctorId/specializations': 'Update doctor specializations array (protected)',
        'POST /doctor/:doctorId/initialize': 'Initialize default services and availability (protected)',
      },

      banners: {
        'GET /banners': 'Get all active banners (public)',
        'GET /banners/slug/:slug': 'Get banner by slug (public)',
        'POST /banners': 'Create new banner (protected)',
        'PUT /banners/:id': 'Update banner (protected)',
        'DELETE /banners/:id': 'Delete banner (protected)',
      },

    },
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/doctor/appointments', doctorAppointmentRoutes);
router.use('/doctor/slots', doctorSlotRoutes);
router.use('/doctor/reviews', doctorReviewRoutes);
router.use('/services', serviceRoutes);
router.use('/doctor', doctorServiceRoutes);

router.use('/banners', bannerRoutes);
router.use('/chat', chatRoutes);
router.use('/audio-call', audioCallRoutes);
router.use('/calls', callRoutes);

// 404 for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

export default router; 