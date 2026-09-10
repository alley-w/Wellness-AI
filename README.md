# Wellness-AI

A full-stack AI-powered wellness application that helps users track their health, nutrition, and fitness goals with intelligent insights and personalized recommendations.

## 🎯 Features

- **User Management**: Create and manage user profiles with personalized health data
- **Meal Tracking**: Log meals and track nutritional intake
- **AI Photo Analysis**: Analyze meal photos using AI to extract nutritional information
- **Workout Planning**: Get AI-generated workout suggestions and plans
- **Daily Dashboard**: View daily summaries including nutrition and health metrics
- **Health Reports**: Generate comprehensive health and wellness reports
- **AI Chat**: Interact with an AI assistant for personalized wellness advice
- **Goal Analysis**: AI-powered analysis of fitness and health goals

## 🏗️ Project Structure

```
Wellness-AI/
├── backend/                 # Node.js Express API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # Data models
│   │   └── demo/           # Demo scripts
│   ├── server.js           # Main server entry point
│   └── package.json        # Backend dependencies
│
├── frontend/               # React Vite application
│   ├── src/                # React components & pages
│   ├── index.html          # HTML entry point
│   ├── vite.config.js      # Vite configuration
│   └── package.json        # Frontend dependencies
│
└── package.json            # Root package configuration
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **File Handling**: Multer (for image uploads)
- **CORS**: Enabled for cross-origin requests
- **Development**: Nodemon for hot reload

### Frontend
- **Library**: React 19
- **Build Tool**: Vite 7
- **Routing**: React Router DOM
- **Module Type**: ES Modules

## 📋 Available API Routes

### Users
- `POST /api/users` - Create new user
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile

### Meals
- `POST /api/meals` - Log a new meal
- `GET /api/users/:userId/meals` - Get user's meal history

### Dashboard
- `GET /api/users/:userId/daily-summary` - Get daily nutrition summary
- `GET /api/users/:userId/daily-nutrition` - Get daily nutrition details
- `GET /api/users/:userId/workout-suggestions` - Get AI workout suggestions
- `POST /api/users/:userId/workout-plan/complete` - Mark workout as complete
- `POST /api/users/:userId/workout-plan/regenerate` - Generate new workout plan

### Health Reports
- `GET /api/users/:userId/memory` - Get user wellness memory/history
- `GET /api/users/:userId/general-report` - Generate comprehensive health report

### AI Features
- `POST /api/ai/chat` - Chat with AI wellness assistant
- `POST /api/ai/analyze-goals` - AI analysis of health goals
- `POST /api/ai/analyze-meal-photo` - AI analysis of meal photos

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alley-w/Wellness-AI.git
   cd Wellness-AI
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

#### Backend (Terminal 1)
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5001`

#### Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173` (default Vite port)

### Demo Mode
To run the demo with sample data:
```bash
cd backend
npm run demo
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:
```env
PORT=5001
NODE_ENV=development
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## 🤖 AI Features

The application leverages AI for:
- **Meal Photo Recognition**: Identify food items and estimate nutritional content
- **Personalized Recommendations**: Get tailored workout and nutrition advice
- **Goal Analysis**: Receive AI-powered insights on your health goals
- **Conversational AI**: Chat with an AI assistant about wellness topics

## 🧪 Development

### Backend Development
- Uses Nodemon for automatic restart on file changes
- Scripts:
  - `npm run dev` - Start development server with auto-reload
  - `npm start` - Start production server
  - `npm run demo` - Run demo with sample data

### Frontend Development
- Hot module replacement (HMR) for instant updates
- Scripts:
  - `npm run dev` - Start development server
  - `npm run build` - Create optimized production build
  - `npm run preview` - Preview production build locally

## 📄 License

This project is open source. See LICENSE file for details.

## 👤 Author

Created by [alley-w](https://github.com/alley-w)

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the project.

---

**Happy coding and here's to your wellness! 💪**
