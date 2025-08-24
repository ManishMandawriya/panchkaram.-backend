# Panchakarma API

A professional Node.js TypeScript API for Panchakarma - Healthy Lifestyle with Ayurveda. This API provides authentication and user management for patients, doctors, clinics, and administrators.

## 🚀 Features

- **Multi-User Authentication**: Support for Patients, Doctors, Clinics, and Admins
- **JWT Token Authentication**: Secure token-based authentication with refresh tokens
- **Password Reset Flow**: SMS-based verification for password reset
- **File Upload**: Document upload for healthcare providers
- **Email Templates**: Beautiful email templates matching the UI design
- **Admin Dashboard**: Complete admin panel for user management
- **Professional Structure**: Clean, scalable, and maintainable codebase
- **TypeScript**: Full TypeScript support with strict typing
- **MySQL ORM**: Sequelize with MySQL database
- **Validation**: Comprehensive input validation with Joi
- **Error Handling**: Professional error handling and logging
- **Security**: Rate limiting, CORS, helmet, and other security measures

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd panchakarma-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration:
   - Database credentials
   - JWT secrets
   - Email/SMS settings
   - File upload settings

4. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE panchakarma_db;
   ```

5. **Run Migrations**
   ```bash
   npm run migrate
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── config/           # Configuration files
│   └── database.ts   # Database configuration
├── controllers/      # Route controllers
│   ├── api/         # API controllers
│   └── admin/       # Admin controllers
├── middleware/       # Express middleware
├── models/          # Database models
├── routes/          # Route definitions
│   ├── api/         # API routes
│   └── admin/       # Admin routes
├── services/        # Business logic
├── templates/       # Email templates
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── validations/     # Request validation schemas
└── index.ts         # Application entry point
```

## 🔐 Authentication Endpoints

### Public API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (Patient/Doctor/Clinic) |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/verify-code` | Verify reset code |
| POST | `/api/auth/reset-password` | Reset password with code |
| POST | `/api/auth/refresh-token` | Refresh access token |

### Protected API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/profile` | Get user profile |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/logout` | Logout |

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/auth/login` | Admin login |
| GET | `/admin/auth/dashboard` | Get dashboard statistics |
| GET | `/admin/auth/users` | Get all users (paginated) |
| GET | `/admin/auth/users/:id` | Get user by ID |
| PUT | `/admin/auth/users/:id/approve` | Approve/reject healthcare provider |
| PUT | `/admin/auth/users/:id/status` | Activate/deactivate user |
| DELETE | `/admin/auth/users/:id` | Delete user |

## 📝 API Examples

### Register a Patient
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "role": "patient",
    "email": "patient@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "phoneNumber": "+1234567890",
    "fullName": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123"
  }'
```

### Register a Doctor
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "role": "doctor",
    "email": "doctor@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "phoneNumber": "+1234567890",
    "fullName": "Dr. Jane Smith",
    "doctorId": "DOC123456",
    "department": "Ayurveda",
    "experience": "10 years of experience in Ayurvedic medicine"
  }'
```

## 🎨 Email Templates

The API includes beautiful email templates that match the UI design:

- **Welcome Email**: Sent to new users upon registration
- **Password Reset**: For password reset functionality
- **Account Approval**: For healthcare provider approval/rejection
- **Verification**: For email verification

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=panchakarma_db
DB_USER=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker build -t panchakarma-api .
docker run -p 3000:3000 panchakarma-api
```

## 📊 Database Schema

### Users Table
- Supports multiple user types (Patient, Doctor, Clinic, Admin)
- Role-based fields and permissions
- Document upload support for healthcare providers
- Approval workflow for doctors and clinics

### Verification Codes Table
- SMS/Email verification codes
- Password reset functionality
- Secure code generation and validation

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- SQL injection protection
- File upload security

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📈 Monitoring

- Comprehensive logging with Winston
- Error tracking and monitoring
- Performance metrics
- Health check endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@panchakarma.com or create an issue in the repository.

---

**Panchakarma API** - Healthy Lifestyle with Ayurveda 🌿 