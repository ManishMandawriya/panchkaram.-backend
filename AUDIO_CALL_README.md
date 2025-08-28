# Audio Call Feature Documentation

## Overview

This audio call feature is implemented using Agora's Real-Time Communication (RTC) SDK for high-quality audio calls between patients and doctors. The feature is designed for testing purposes and operates independently of appointments or chat sessions.

## Features

- ✅ Create audio call sessions
- ✅ Join existing audio call sessions
- ✅ End audio call sessions
- ✅ Get user's audio call sessions
- ✅ Refresh tokens for ongoing sessions
- ✅ Role-based access control (patient/doctor)
- ✅ Secure token generation using Agora

## API Endpoints

### Base URL
```
http://localhost:3000/api/audio-call
```

### Endpoints

#### 1. Create Audio Call Session
- **POST** `/sessions`
- **Description**: Create a new audio call session (patients only)
- **Body**:
  ```json
  {
    "doctorId": 123
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "sessionId": "audio_1234567890_abc123",
      "channelName": "audio_channel_audio_1234567890_abc123",
      "patientToken": "agora_token_here",
      "doctorToken": "agora_token_here"
    }
  }
  ```

#### 2. Get User's Audio Call Sessions
- **GET** `/sessions`
- **Description**: Get all audio call sessions for the authenticated user
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "audio_1234567890_abc123",
        "channelName": "audio_channel_audio_1234567890_abc123",
        "patientId": 1,
        "doctorId": 123,
        "status": "active",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "endedAt": null
      }
    ]
  }
  ```

#### 3. Get Audio Call Session Details
- **GET** `/sessions/:sessionId`
- **Description**: Get details of a specific audio call session
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "audio_1234567890_abc123",
      "channelName": "audio_channel_audio_1234567890_abc123",
      "patientId": 1,
      "doctorId": 123,
      "status": "active",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "endedAt": null
    }
  }
  ```

#### 4. Join Audio Call Session
- **POST** `/sessions/:sessionId/join`
- **Description**: Join an existing audio call session
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "channelName": "audio_channel_audio_1234567890_abc123",
      "token": "agora_token_here",
      "uid": "patient_1"
    }
  }
  ```

#### 5. End Audio Call Session
- **PUT** `/sessions/:sessionId/end`
- **Description**: End an audio call session
- **Response**:
  ```json
  {
    "success": true,
    "message": "Audio call session ended successfully"
  }
  ```

#### 6. Refresh Token
- **POST** `/sessions/:sessionId/refresh-token`
- **Description**: Generate a new token for an existing session
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "token": "new_agora_token_here",
      "uid": "patient_1"
    }
  }
  ```

## Environment Variables

Add these to your `.env` file:

```env
# Agora Configuration
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
```

## Testing

### 1. Using the Test HTML Page

1. Start your backend server
2. Navigate to `http://localhost:3000/audio-call-test.html`
3. Enter your JWT token and API URL
4. Test the audio call functionality

### 2. Using cURL

#### Create a session (as patient):
```bash
curl -X POST http://localhost:3000/api/audio-call/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"doctorId": 123}'
```

#### Join a session:
```bash
curl -X POST http://localhost:3000/api/audio-call/sessions/SESSION_ID/join \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### End a session:
```bash
curl -X PUT http://localhost:3000/api/audio-call/sessions/SESSION_ID/end \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Implementation Details

### Files Created/Modified

1. **Service**: `src/services/audioCallService.ts`
   - Handles business logic for audio calls
   - Manages session state in memory
   - Generates Agora tokens

2. **Controller**: `src/controllers/api/audioCallController.ts`
   - Handles HTTP requests
   - Validates user permissions
   - Returns appropriate responses

3. **Validation**: `src/validations/audioCallValidation.ts`
   - Joi schemas for request validation
   - Ensures data integrity

4. **Routes**: `src/routes/api/audioCall.ts`
   - Defines API endpoints
   - Applies middleware

5. **Main Routes**: `src/routes/api/index.ts`
   - Added audio call routes to main API

6. **Test Page**: `public/audio-call-test.html`
   - Simple HTML interface for testing

### Session States

- **pending**: Session created but not yet joined
- **active**: Session is currently active
- **ended**: Session has been ended

### Security Features

- JWT authentication required for all endpoints
- Role-based access control (patient/doctor)
- Session ownership validation
- Secure token generation with expiration

### Token Management

- Tokens are generated with 1-hour expiration
- Separate tokens for patient and doctor
- Token refresh functionality available
- Uses Agora's RTC token builder

## Frontend Integration

To integrate with your frontend application:

1. **Install Agora SDK**:
   ```bash
   npm install agora-rtc-sdk-ng
   ```

2. **Basic Usage**:
   ```javascript
   import AgoraRTC from 'agora-rtc-sdk-ng';

   // Create client
   const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

   // Join channel
   await client.join(appId, channelName, token, uid);

   // Create and publish local audio track
   const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
   await client.publish(localAudioTrack);

   // Subscribe to remote audio
   client.on('user-published', async (user, mediaType) => {
     await client.subscribe(user, mediaType);
     if (mediaType === 'audio') {
       user.audioTrack.play();
     }
   });
   ```

## Notes

- This implementation stores sessions in memory (not persistent)
- For production, consider using a database to store session data
- Agora tokens expire after 1 hour by default
- The feature is designed for testing and can be extended for production use

## Troubleshooting

1. **Token Generation Error**: Ensure Agora App ID and Certificate are set in environment variables
2. **Authentication Error**: Verify JWT token is valid and not expired
3. **Session Not Found**: Check if session ID is correct and user has permission to access it
4. **Permission Denied**: Ensure user role matches the required permissions for the endpoint
