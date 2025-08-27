# CBM App 2 - Project Structure Documentation

## 📁 Project Directory Structure (Monorepo)

```
CBM_APP_2/
├── README.md                    # Main project documentation
├── package.json                 # Root package.json with workspace scripts
├── .gitignore                  # Git ignore file rules
├── .env                        # Environment variables (not committed to version control)
│
├── docs/                       # 📚 Documentation folder
│   ├── PROJECT_STRUCTURE.md    # Project structure documentation
│   └── Dissertation.pdf        # Dissertation PDF document
│
├── logs/                       # 📋 Log files
│   └── build-log.txt          # Build logs
│
├── scripts/                    # 🔧 Deployment scripts
│   └── deploy-cloud-functions.sh # Cloud Functions deployment script
│
├── frontend/                   # 📱 Frontend React Native application
│   ├── App.js                  # Application entry point
│   ├── index.js                # Expo app registration
│   ├── package.json            # Frontend dependencies
│   ├── app.config.js           # Expo application configuration
│   ├── babel.config.js         # Babel compilation configuration
│   ├── metro.config.js         # Metro bundler configuration
│   ├── .env                    # Frontend environment variables
│   ├── src/                    # 📱 Main source code directory
│   │   ├── components/             # Reusable UI components
│   │   ├── context/               # React Context state management
│   │   │   ├── AIContext.js       # AI conversation management
│   │   │   └── QuotesContext.js   # Quotes management
│   │   ├── navigation/            # Navigation configuration
│   │   ├── screens/              # Application screens
│   │   │   ├── AuthEntry.js       # Login entry point
│   │   │   ├── Welcome/           # Welcome pages
│   │   │   ├── SignUp/            # Registration pages
│   │   │   ├── Home/              # Home pages
│   │   │   ├── Game/              # Game-related pages
│   │   │   ├── Profile/           # User profile
│   │   │   ├── DeepBreath/        # Breathing exercises
│   │   │   ├── Statistics/        # Statistical analysis
│   │   │   ├── Admin/             # Administrative functions
│   │   │   └── Test/              # Test pages
│   │   ├── services/             # 🔧 Service layer
│   │   │   ├── api.js            # API calls
│   │   │   ├── firebase.js       # Firebase initialization
│   │   │   ├── cloudFunctions.js # Cloud Functions
│   │   │   ├── gemini.js         # Gemini AI integration
│   │   │   └── localStatistics.js # Local statistics
│   │   └── utils/                # 🛠️ Utility functions
│   │       └── gameSchedule.js   # Game scheduling logic
│   ├── __tests__/                # 🧪 Frontend test files
│   │   ├── HomePage.test.js       # Home page tests
│   │   ├── Profile.test.js        # Profile tests
│   │   ├── Quotes.test.js         # Quotes functionality tests
│   │   ├── SignUp.test.js         # Registration functionality tests
│   │   └── Statistics.test.js     # Statistics functionality tests
│   ├── assets/                   # 🎨 Static resources
│   │   ├── fonts/               # Font files
│   │   ├── images/              # Image resources
│   │   │   ├── Game/            # Game-related images
│   │   │   │   ├── CBM-A/       # Group A game images
│   │   │   │   └── CBM-I/       # Group I game images
│   │   │   ├── HomePage/        # Home page images
│   │   │   ├── Profile/         # Profile images
│   │   │   ├── Quotes/          # Quotes-related images
│   │   │   └── Statistics/      # Statistics images
│   │   └── sounds/              # Sound effect files
│   ├── ios/                     # 📱 iOS project files
│   │   ├── Moodee/             # iOS application main files
│   │   ├── Moodee.xcodeproj/   # Xcode project files
│   │   ├── Moodee.xcworkspace/ # Xcode workspace
│   │   ├── Podfile             # CocoaPods dependencies
│   │   └── Pods/               # CocoaPods installed dependencies
│   ├── dist/                   # 🏗️ Build output (Expo)
│   └── node_modules/           # 📦 Frontend Node.js dependencies
│
├── backend/                    # ☁️ Backend services
│   ├── package.json           # Backend dependencies
│   ├── firebase.json          # Firebase configuration
│   └── functions/             # Firebase Cloud Functions
│       ├── index.js           # Main Cloud Functions file
│       ├── package.json       # Functions dependencies
│       └── package-lock.json  # Functions version lock
│
└── node_modules/              # 📦 Root workspace dependencies
```

## 🎯 Main Functional Modules

### 1. Game Module
- **Location**: `frontend/src/screens/Game/`
- **Function**: CBM-A and CBM-I training games
- **Files**:
  - `Game.js` - Main game logic
  - `Game-1.js`, `Game2.js`, `Game3.js`, `Game4.js` - 4 different games
  - `Emotion.js` - Emotion recording
  - `DailyGame.js` - Daily game scheduling

### 2. AI Module
- **Location**: `frontend/src/context/AIContext.js`, `frontend/src/services/gemini.js`
- **Function**: Virtual coach based on Gemini AI
- **Features**: Multi-layer error handling, local response system

### 3. Statistics Module
- **Location**: `frontend/src/screens/Statistics/`
- **Function**: Emotional change analysis, usage history tracking
- **Technology**: Firebase Cloud Functions + local statistics

### 4. Breathing Exercise Module
- **Location**: `frontend/src/screens/DeepBreath/`
- **Function**: Guided breathing exercises
- **Features**: Animation guidance, progress tracking

## 🔧 Technical Architecture

### Monorepo Structure
This project uses a monorepo structure to organize frontend and backend code:
- **Root Level**: Contains scripts, documentation, and shared configurations
- **Frontend**: React Native/Expo application with independent dependencies
- **Backend**: Firebase Cloud Functions with separate package management
- **Benefits**: Simplified deployment, shared tooling, unified version control

### Frontend Technology Stack
- **Framework**: React Native + Expo
- **State Management**: React Context
- **Navigation**: React Navigation
- **Testing**: Jest + React Native Testing Library

### Backend Technology Stack
- **Platform**: Firebase
- **Database**: Firestore
- **Authentication**: Firebase Authentication
- **Cloud Functions**: Cloud Functions
- **AI Service**: Google Gemini API

### Development Tools
- **Version Control**: Git
- **Editor Configuration**: VSCode + Cursor rules
- **Build Tools**: Expo CLI
- **Dependency Management**: npm

## 📊 A/B Testing Design

### Experimental Group Settings
- **Group A**: Game sequence abababab... (starting with CBM-A)
- **Group B**: Game sequence babababa... (starting with CBM-I)

### Data Collection
- Daily emotion records
- Game completion status
- AI conversation interaction records
- Breathing exercise participation

## 🚀 Deployment Information

### Firebase Project
- **Project ID**: cbm-app-2
- **Region**: us-central1
- **Runtime Environment**: Node.js 18

### Cloud Functions
- `publicGeminiMessage` - Public AI conversation endpoint
- `getUserStatistics` - User statistics
- `processAllUsersHistoricalData` - Historical data processing

## 📝 Development Guide

### Environment Setup
1. Install Node.js 18+
2. Install Expo CLI: `npm install -g @expo/cli`
3. Set up Firebase CLI
4. Configure environment variables

### Common Commands
```bash
# From root directory
npm start                    # Start development server
npm run start:tunnel         # Start with tunnel mode
npm run start:lan           # Start with LAN mode
npm run ios                  # iOS simulator
npm test                     # Run tests
npm run install:all         # Install all dependencies

# Frontend specific (from frontend/)
cd frontend
npx expo start              # Start Expo development server
npx expo start --tunnel     # Start with tunnel
npx expo run:ios            # Run on iOS simulator

# Backend specific (from backend/)
cd backend
firebase deploy --only functions  # Deploy Cloud Functions
firebase emulators:start    # Start local emulators
```

### Code Standards
- Use ESLint for code checking
- Follow React Native best practices
- All AI conversations must include sufficient context
- Maintain positive and encouraging tone

---

*This document is the technical documentation for the CBM App 2 master's thesis project, detailing project structure and development guidelines.* 