# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev           # Start development server at http://localhost:3000
npm install          # Install dependencies

# Production
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint

# Deployment
npm run netlify-build # Build specifically for Netlify deployment
```

## Environment Setup

Required environment variables in `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The app requires a Gemini API key from Google AI Studio (makersuite.google.com/app/apikey) for all AI functionality.

## Architecture Overview

### Core Application Flow
This is an AI-powered educational content generator that follows a two-phase architecture:

1. **Builder Phase** (`src/app/page.tsx`): Teachers input content, select educational apps, and configure pedagogical settings
2. **Student Phase**: After generation, students can log in and interact with generated educational content

### Key Architectural Components

#### 1. Educational App System (`src/types/apps.ts`)
The system generates multiple educational apps from a single content input:
- **Categories**: Verkenning (Chatbot, Mindmap), Kennisverwerking (Flashcards, Escape Room, Presentatie), Toetsing (Oefentoets, 30 Seconds)
- **Generation**: Each app has its own API endpoint (`/api/generate-{app}`) that uses Gemini AI to create app-specific content
- **Interaction**: Each app component provides different learning interactions

#### 2. Student Session Management (`src/contexts/StudentContext.tsx`)
- **Login System**: Simple name-based authentication (no passwords)
- **Data Isolation**: Each student's progress, notes, and chat history are stored separately
- **Persistence**: Uses localStorage with structured keys (`student_{id}_{type}_{presentation}`)

#### 3. Student Data Storage (`src/utils/studentStorage.ts`)
- **Centralized Storage**: All student data goes through StudentStorage utilities
- **Data Types**: notes, progress, chat, scores, preferences
- **Migration**: Automatically migrates old localStorage format to new student-based structure
- **Data Management**: Export, cleanup, and deletion utilities

#### 4. AI Integration Architecture
- **Multi-Model Support**: Gemini 2.5 Pro, 2.5 Flash, 2.0 Flash with different capabilities
- **Context-Aware**: Each API endpoint receives didactic/pedagogical settings and HBO level
- **Streaming**: Real-time AI responses where applicable
- **File Processing**: Supports documents (PDF, DOCX), images, and audio transcription

### Component Organization

#### Interactive Learning Components
- **Presentatie**: Full presentation system with slide navigation, editing, chat per slide, and student notes
- **Flashcards**: SM-2 algorithm for spaced repetition, dual modes (study/quiz)
- **EscapeRoom**: Gamified learning with timer, story elements, and hint system
- **Oefentoets**: Quiz system with immediate feedback and chat follow-up
- **Mindmap**: Visual content structure with collapsible nodes

#### Supporting Components
- **LoginModal**: Student authentication with previous student selection
- **StudentProfile**: Session management, data export, logout functionality
- **ChatbotSettings**: Configures didactic roles and pedagogical approaches

### API Endpoint Patterns

All generation endpoints follow similar patterns:
```
/api/generate-{app}/route.ts
- Input: baseContent, didactics, pedagogy, level, app-specific settings
- Processing: Gemini AI with structured prompts
- Output: App-specific data structure (JSON)
```

Chat endpoints provide contextual AI interaction:
```
/api/{app}-chat/route.ts
- Input: message, context (slide/flashcard/etc), student settings
- Processing: Context-aware Gemini responses
- Output: AI response tailored to specific learning context
```

### State Management Patterns

#### Page-Level State (`src/app/page.tsx`)
- **Generation State**: isGenerating, isGenerated, generationError
- **App Data**: Separate state for each generated app's data
- **Settings**: didactics, pedagogy, level, app selection

#### Student Context State
- **Session**: currentStudent, isLoggedIn
- **Management**: login/logout functions, previous students list
- **Data Control**: clearStudentData, export functionality

#### Component-Level State
- **Interactive Elements**: Edit modes, chat panels, navigation state
- **Persistence**: Auto-save to localStorage through StudentStorage utilities

### Key Integration Points

#### Student Login Flow
1. Page generates content → LoginModal appears if no student logged in
2. Student logs in → All subsequent data operations use student context
3. Data automatically migrates from old format to student-specific format

#### Multi-App Generation
1. Teacher selects apps and configures settings
2. Parallel API calls to generate all selected apps
3. Error handling per app with partial success support
4. Student can switch between generated apps with persistent state

#### Presentation Chat System
- **Slide-Specific**: Each slide maintains separate chat history
- **Context-Aware**: AI knows current slide content + overall presentation context
- **Persistent**: Chat history saved per student per slide
- **Integrated**: Works seamlessly with presentation editing and navigation

This architecture enables a scalable, multi-user educational platform with rich AI interactions while maintaining data privacy through client-side storage.