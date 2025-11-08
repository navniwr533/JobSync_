# JobSync Backend API

## Overview
Node.js + Express.js backend API for JobSync AI-Powered Job Readiness Platform.

**Built by**: Prince Barnwal (Backend Developer)

## Tech Stack (As planned in PPT)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer
- **Validation**: Express Validator

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile

### Resume Analysis (`/api/resume`)
- `POST /upload` - Upload and analyze resume
- `GET /analysis/:userId` - Get analysis history
- `POST /compare` - Compare resume against job description

### Interview Practice (`/api/interview`)
- `POST /start` - Start interview session
- `POST /submit-answer` - Submit answer for evaluation
- `GET /results/:sessionId` - Get interview results

### Analytics Dashboard (`/api/analytics`)
- `GET /dashboard/:userId` - Get dashboard data
- `GET /progress/:userId` - Get progress tracking
- `GET /skill-gaps/:userId` - Get skill gap analysis

## Installation & Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/jobsync
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:8000
NODE_ENV=development
```

## Database Schema (MongoDB)
Designed by **Preet Verma** (Database & Integration Specialist)

### Collections:
- `users` - User profiles and authentication
- `resumes` - Resume analysis data
- `interviews` - Interview session data
- `analytics` - Progress tracking and metrics

## Integration Points
- **Frontend**: Chart.js integration by **Praful kr. Singh**
- **AI Services**: AI integration by **Navneet Panwar**
- **Database**: MongoDB schemas by **Preet Verma**

## Team Contributions (As per PPT)

### Prince Barnwal - Backend Development
- Node.js + Express.js backend setup
- REST API development
- Authentication and security
- File upload handling
- Database integration

### Integration with Frontend Team
- API endpoints for Chart.js data
- Real-time analytics support
- Progress tracking APIs
- Skill gap analysis endpoints

## Current Status
🚧 **Foundation Complete** - Ready for implementation

All API routes are structured and ready for development. Each endpoint includes detailed implementation plans as specified in the team presentation.