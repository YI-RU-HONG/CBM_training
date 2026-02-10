# CBM App 2 - Master's Thesis Project

## 📖 Project Introduction

This project is a master's thesis research on an emotional training iOS application, designed to provide users with daily emotional training tools, combining deep breathing exercises, emotion recording, and simple game modules, using LLM as a virtual coach to enhance interactivity and sustained engagement.

### 🎯 Research Objectives
- **Research Subjects**: 10 participants
- **Experimental Design**: A/B testing, divided into two groups of 5 participants each
- **Experimental Duration**: 14-day testing period
- **Group A**: Training game sequence: abababab...
- **Group B**: Training game sequence: babababa...

## 🏛️ Repository Information

**⚠️ Important Notice for Academic Submission:**
This project is uploaded to the university's GitLab repository for thesis submission: https://git.cs.bham.ac.uk/projects-2024-25/yxh481.git

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Cloud Functions](#cloud-functions)
5. [Deployment Status](#deployment-status)
6. [Solution Summary](#solution-summary)
7. [Troubleshooting](#troubleshooting)
8. [Quick Start](#quick-start)
9. [Development Guide](#development-guide)

---

## 🎯 Project Overview

This is an iOS app designed to provide daily emotional training tools, combining deep breathing exercises, emotion recording, and simple game modules. The app uses LLM as a virtual coach to enhance interactivity and sustained engagement.

### Research Context
- **Master's Thesis Project**: A/B testing with 10 participants
- **Group A**: Training game sequence: abababab...
- **Group B**: Training game sequence: babababa...
- **Duration**: 14-day testing period

---

## 🏗️ Architecture

### Project Structure
This project uses a **monorepo structure** to organize frontend and backend code:
- **Root Level**: Contains workspace management and shared configurations
- **Frontend**: React Native/Expo application with independent dependencies  
- **Backend**: Firebase Cloud Functions with separate package management
- **Benefits**: Simplified deployment, shared tooling, unified version control

### Frontend
- **Framework**: React Native (Expo)
- **Development Tool**: Expo Go for testing
- **State Management**: React Context
- **UI Design**: Figma-based design system
- **Data Format**: JSON with REST API communication
- **Mobile Testing**: Supports tunnel mode for cross-network testing

### Backend
- **Platform**: Firebase
- **Services**: Authentication, Firestore, Cloud Functions
- **AI Integration**: Google Gemini API

### Pages Structure
| Page Name | Description |
|-----------|-------------|
| Welcome | Initial launch screen with introduction & CTA |
| SignUp | User registration |
| HomePage | Daily tasks and emotional suggestions |
| Game | Interactive game area (Emotion & Game pages) |
| Profile | User settings and account information |
| DeepBreath | Breathing exercise animation and guidance |
| Statistics | Emotional changes and usage history |

---

## ✨ Features

### Core Features
1. **Emotional Training Games**
   - 4 different game types (A and B variants)
   - Dynamic scheduling based on user group
   - Performance tracking and analytics

2. **AI-Powered Coaching**
   - Personalized responses based on user emotions
   - Context-aware suggestions
   - Weekly completion analysis

3. **Breathing Exercises**
   - Guided breathing animations
   - Progress tracking
   - Customizable sessions

4. **Statistics & Analytics**
   - Emotional pattern analysis
   - Progress tracking
   - Weekly/monthly reports

### AI Conversation Types
1. **Welcome** - Initial greeting and motivation
2. **Emotion** - Response to user's emotional state
3. **Game** - Post-game performance feedback
4. **Weekly** - Weekly summary and encouragement
5. **Custom** - Personalized reason responses
6. **Homepage** - Daily suggestions with completion analysis
7. **Statistics** - Pattern-based insights

---

## ☁️ Cloud Functions

### Deployed Functions
1. **publicGeminiMessage** - Public HTTP function for AI conversations
2. **getGeminiMessage** - Authenticated AI conversation function
3. **getUserStatistics** - User statistics retrieval
4. **calculateUserStats** - Statistics calculation
5. **processAllUsersHistoricalData** - Historical data processing
6. **calculateAllUsersHistoricalStats** - Historical statistics calculation

### Function Types
- **HTTP Trigger**: `publicGeminiMessage` (public access)
- **Callable Trigger**: Other functions (require authentication)

### Key Features
- **Multi-layer Fallback System**: Ensures reliability
- **Error Handling**: Comprehensive error management
- **Performance Optimization**: Caching and retry mechanisms

---

## 🚀 Deployment Status

### ✅ Completed Setup
- **Firebase Project**: cbm-app-2
- **Region**: us-central1
- **Runtime**: Node.js 18
- **Memory**: 256MB
- **AI Integration**: Configured and tested

### ✅ Tested Features
- **Public Gemini Function**: Successfully tested
- **Response Time**: ~20 seconds (including cold start)
- **Permissions**: Correctly configured (allUsers access)
- **Multi-layer Fallback**: Working properly

### 🔧 Configuration
```bash
# Function URL
https://us-central1-cbm-app-2.cloudfunctions.net/publicGeminiMessage

# Project Repository
https://git.cs.bham.ac.uk/projects-2024-25/yxh481.git
```

---

## 🎉 Solution Summary

### Problem Resolution
1. **Permission Issues**: Resolved with public HTTP functions
2. **Network Failures**: Implemented retry mechanisms
3. **Prompt Consistency**: Unified prompt logic across all functions
4. **Error Handling**: Comprehensive fallback system

### Technical Solutions
1. **Public Function Creation**: HTTP-triggered function without authentication
2. **Multi-layer Fallback**: Public function → Cloud Functions → Direct API
3. **Prompt Standardization**: Consistent prompt logic in Cloud Functions
4. **Error Recovery**: Automatic retry with exponential backoff

### Performance Optimizations
1. **Caching Strategy**: Implemented for repeated requests
2. **Timeout Management**: 60-second timeout with retry logic
3. **Error Rate Monitoring**: Track failure rates across layers
4. **Response Time Optimization**: Cold start handling

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Network Request Failed
**Symptoms**: "Network request failed" error
**Solution**: 
- Check internet connection
- Verify function URL accessibility
- Use retry mechanism (automatic)

#### 2. Permission Denied
**Symptoms**: "permission-denied" error
**Solution**:
- Use public function instead of authenticated calls
- Verify Firebase project configuration
- Check configuration settings

#### 3. AbortError: Aborted
**Symptoms**: Request timeout
**Solution**:
- Increased timeout to 60 seconds
- Implemented retry with exponential backoff
- Added detailed error logging

#### 4. Prompt Inconsistency
**Symptoms**: AI responses don't match expected format
**Solution**:
- Unified prompt logic in Cloud Functions
- Consistent parameter handling
- Standardized response format

#### 5. Slow Page Loading
**Symptoms**: Pages take too long to load, especially Statistics and HomePage
**Solution**:
- Implemented skeleton screens for better UX
- Added caching mechanism for Gemini responses
- Separated data loading from AI message generation
- Preloading mechanisms for faster response

#### 6. Service Limitations
**Symptoms**: Long response times, timeouts, or rate limiting
**Root Cause**: External service limitations:
- Response time (can be 10-30 seconds)
- Rate limits (requests per minute)
- Concurrent requests
- Cold start delays

**Solutions**:
- **Local Response System**: Immediate fallback messages
- **Reduced Timeout**: 15 seconds instead of 60 seconds
- **Smart Caching**: 5-minute cache to reduce service calls
- **Progressive Enhancement**: Show local content first, enhance with external services
- **Background Processing**: External calls don't block UI

### Debug Steps
1. **Check Function Logs**: `firebase functions:log`
2. **Test Public Function**: Direct HTTP request
3. **Verify Configuration**: Check project settings
4. **Monitor Network**: Use browser developer tools
5. **Check Cache**: Verify cached responses are working
6. **Monitor Usage**: Check service usage dashboard

---

## ⚡ Performance Optimizations

### Loading Optimizations
1. **Skeleton Screens**: Added placeholder UI while content loads
2. **Progressive Loading**: Show basic content first, then enhance with AI
3. **Caching System**: 5-minute cache for Gemini responses
4. **Preloading**: Start loading AI messages before user interaction

### Real-time Feedback System
1. **Instant Response**: Immediate display of contextual messages
2. **Progressive Enhancement**: Messages evolve as AI processes data
3. **Typewriter Effect**: Natural text animation for AI responses
4. **Smart Default Messages**: Context-aware fallback messages
5. **Local Response System**: High-quality pre-written responses
6. **Background AI Processing**: Non-blocking AI calls

### Technical Improvements
1. **Async Operations**: Separated data fetching from AI calls
2. **Timeout Management**: 60-second timeout with retry logic
3. **Error Recovery**: Graceful fallbacks for failed requests
4. **Memory Management**: Efficient caching with expiration

### Service Optimization
1. **Reduced Timeout**: 15 seconds instead of 60 seconds
2. **Smart Retry Logic**: Only retry non-timeout errors
3. **Local Fallbacks**: Immediate responses when services are slow
4. **Caching Strategy**: 5-minute cache to reduce service calls
5. **Background Processing**: Service calls don't block user interface
6. **Rate Limit Handling**: Graceful degradation when limits are hit

### User Experience Enhancements
1. **Immediate Feedback**: Users see page structure instantly
2. **Progressive Enhancement**: Content appears as it loads
3. **Error Handling**: Clear fallback messages
4. **Loading States**: Visual indicators for long operations
5. **Natural Interaction**: Typewriter effect mimics human typing
6. **Contextual Messages**: Smart defaults based on user state

### Performance Metrics
- **Initial Load Time**: < 2 seconds for basic content
- **AI Response Time**: < 30 seconds with caching
- **Cache Hit Rate**: > 80% for repeated requests
- **Error Recovery**: < 5 seconds for fallback responses
- **Typewriter Speed**: 50ms per character for natural feel

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- Firebase CLI
- Expo CLI (optional, but recommended)

### Quick Setup
```bash
# 1. Clone and install
git clone https://git.cs.bham.ac.uk/projects-2024-25/yxh481.git
cd CBM_APP_2
npm run install:all

# 2. Start development
npm start              # Standard mode
npm run start:tunnel   # Tunnel mode (recommended for mobile testing)
```

## 👨‍💻 Development Guide

### Setup Instructions
1. **Clone Repository**
   ```bash
   git clone https://git.cs.bham.ac.uk/projects-2024-25/yxh481.git
   cd CBM_APP_2
   ```

2. **Install Dependencies**
   ```bash
   # Install all dependencies
   npm run install:all
   
   # Or install individually
   npm run install:frontend
   npm run install:backend
   ```

3. **Start Development**
   ```bash
   # Start Expo development server
   npm start
   
   # Or use specific modes
   npm run start:tunnel   # Tunnel mode for mobile testing
   npm run start:lan     # LAN mode
   ```

### Development Commands
```bash
# From root directory
npm start                    # Start Expo development server
npm run start:tunnel         # Start with tunnel mode
npm run start:lan           # Start with LAN mode
npm run ios                  # Run on iOS simulator
npm test                     # Run tests

# Frontend specific (from frontend/)
cd frontend
npx expo start              # Start Expo development server
npx expo start --tunnel     # Start with tunnel
npx expo run:ios            # Run on iOS simulator

# Backend specific (from backend/)
cd backend
firebase deploy --only functions:publicGeminiMessage  # Deploy specific function
firebase functions:log --only publicGeminiMessage     # View function logs
firebase emulators:start --only functions             # Test locally
```

### 📁 Project Structure (Monorepo)

For detailed project structure documentation, please refer to: [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)

```
CBM_APP_2/
├── README.md                 # Main project documentation
├── package.json              # Root workspace management
├── docs/                     # 📚 Documentation folder
├── scripts/                  # 🔧 Deployment scripts
├── frontend/                 # 📱 React Native/Expo application
│   ├── App.js               # Application entry point
│   ├── src/                 # Main source code
│   │   ├── screens/         # Application screens
│   │   ├── services/        # Service layer
│   │   └── utils/           # Utility functions
│   ├── __tests__/           # Frontend test files
│   ├── assets/              # Static resources
│   └── ios/                 # iOS project files
└── backend/                  # ☁️ Backend services
    ├── firebase.json        # Firebase configuration
    └── functions/           # Firebase Cloud Functions
```

### Best Practices
1. **Error Handling**: Always implement try-catch blocks
2. **Logging**: Use consistent logging format
3. **Testing**: Test all AI conversation types
4. **Performance**: Monitor function response times
5. **Security**: Follow secure coding practices

---

## 📊 Monitoring & Analytics

### Key Metrics
- **Function Response Time**: Target < 30 seconds
- **Success Rate**: Target > 95%
- **Error Rate**: Monitor per function
- **User Engagement**: Track daily active users

### Logging Strategy
- **Structured Logs**: Consistent format across functions
- **Error Tracking**: Detailed error information
- **Performance Monitoring**: Response time tracking
- **User Analytics**: Usage pattern analysis

---

## 🔮 Future Enhancements

### Planned Features
1. **Advanced Analytics**: Machine learning insights
2. **Personalization**: User-specific recommendations
3. **Social Features**: Community support
4. **Offline Support**: Local data caching

### Technical Improvements
1. **Performance**: Reduce cold start times
2. **Scalability**: Handle increased user load
3. **Security**: Enhanced authentication
4. **Monitoring**: Real-time performance tracking

---

## 📞 Support & Contact

### 📧 Academic Contact
- **Researcher**: Master's Thesis Research Project
- **Project Name**: CBM App 2 - Emotional Training Application
- **Thesis Type**: Master's Thesis

### 📚 Technical Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Documentation](https://reactnative.dev/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Google Gemini API](https://ai.google.dev/docs)

### 📋 Project Documentation
- [Project Structure Documentation](docs/PROJECT_STRUCTURE.md)
- [Dissertation PDF](docs/Dissertation.pdf)



### Project Completeness
- ✅ Complete source code
- ✅ Detailed technical documentation
- ✅ Test files
- ✅ Deployment scripts
- ✅ Dissertation PDF document

---

# CBM_training
