# CISM Exam Simulator

## Overview

This is a CISM (Certified Information Security Manager) exam preparation simulator designed for high-performance study sessions. The application allows users to upload question files (DOCX, PDF, TXT), practice exam questions with instant feedback, track progress, and review performance statistics. Key features include question flagging for review, personal note-taking, progress persistence, and export/import functionality for study sessions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: React Context API for exam state (`ExamProvider`)
- **Data Fetching**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a component-based architecture with clear separation:
- `pages/` - Route-level components
- `components/` - Feature components (question panel, sidebar, stats dashboard)
- `components/ui/` - Reusable shadcn/ui primitives
- `lib/` - Context providers, utilities, and API client
- `hooks/` - Custom React hooks

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **File Processing**: Multer for file uploads, Mammoth for DOCX parsing
- **API Pattern**: RESTful endpoints under `/api/` prefix

The server handles:
- File upload and question parsing from DOCX/PDF/TXT files
- Question storage and retrieval
- Static file serving in production

### Data Storage
- **Primary Storage**: In-memory storage (`MemStorage` class) for questions and blocks
- **Client-side Persistence**: LocalStorage for exam state and progress
- **Database Ready**: Drizzle ORM configured with PostgreSQL dialect (schema in `shared/schema.ts`)

The current implementation uses in-memory storage but is architected to easily migrate to PostgreSQL using the existing Drizzle configuration.

### Shared Schema
Zod schemas in `shared/schema.ts` define data structures used by both frontend and backend:
- `Question` - Exam question with options, correct answer, and explanation
- `QuestionBlock` - Groups of 50 questions organized by source file
- `QuestionProgress` - User's answer state, flags, comments, and time tracking
- `ExamState` - Complete application state for persistence

## External Dependencies

### UI Component Library
- **shadcn/ui**: Comprehensive component system built on Radix UI primitives
- **Radix UI**: Accessible, unstyled UI primitives for dialogs, tooltips, tabs, etc.

### Document Processing
- **Mammoth**: Converts DOCX files to plain text for question parsing
- **Multer**: Handles multipart form data for file uploads

### Database (Configured)
- **Drizzle ORM**: Type-safe database toolkit
- **PostgreSQL**: Target database (requires `DATABASE_URL` environment variable)
- **connect-pg-simple**: Session store for PostgreSQL

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Backend bundling for production
- **tsx**: TypeScript execution for development

### Styling & Fonts
- **Tailwind CSS**: Utility-first CSS framework
- **Google Fonts**: Inter (primary), JetBrains Mono (monospace)
- **class-variance-authority**: Component variant management