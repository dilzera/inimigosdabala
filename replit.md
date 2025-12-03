# CS Stats Manager

## Overview

CS Stats Manager is a Counter-Strike match statistics management system designed for friend groups. The application tracks player performance metrics, manages user profiles, and provides both player and administrative dashboards. Built as a full-stack TypeScript application, it combines a React frontend with an Express backend, using PostgreSQL for data persistence and Replit's OpenID Connect for authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server, providing fast HMR and optimized production builds
- Wouter for lightweight client-side routing instead of React Router

**UI Component Strategy**
- shadcn/ui component library built on Radix UI primitives for accessible, composable components
- Tailwind CSS with custom design tokens for styling, following a "New York" style variant
- Custom CSS variables for theming (light/dark mode support)
- Gaming dashboard aesthetic inspired by competitive gaming platforms (Tracker.gg, FACEIT) combined with modern admin dashboards

**State Management**
- TanStack Query (React Query) for server state management with aggressive caching strategies (staleTime: Infinity)
- Custom hooks pattern for business logic encapsulation (useAuth for authentication state)
- No global client state management library - relying on React Query's cache and local component state

**Design System**
- Typography: Inter font for data display, JetBrains Mono for statistics and numerical values
- Consistent spacing using Tailwind's 2/4/6/8 unit system
- Responsive grid layouts: 3-column on desktop, collapsing to 1-2 columns on mobile
- Component elevation system using subtle borders and shadows rather than material-style elevation

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for the HTTP server
- Session-based authentication using express-session with PostgreSQL session storage
- Middleware pattern for request logging, authentication checks, and error handling

**Database Layer**
- Drizzle ORM for type-safe database operations with PostgreSQL
- Neon serverless PostgreSQL with WebSocket connections for serverless environments
- Connection pooling via @neondatabase/serverless Pool
- Schema-first approach with TypeScript types generated from Drizzle schema definitions

**Data Model**
The application uses three main tables:
1. **sessions** - Express session storage for authentication state
2. **users** - Player profiles with aggregated CS:GO statistics (kills, deaths, assists, headshots, matches, skill rating)
3. **matches** - Individual match records
4. **matchStats** - Per-player statistics for each match

**Authentication & Authorization**
- Replit OpenID Connect integration using openid-client and Passport.js
- Role-based access control with `isAdmin` flag on user records
- Protected API routes using `isAuthenticated` middleware
- Session management with 7-day cookie lifetime

**API Design**
- RESTful endpoints under `/api` prefix
- Authentication routes: `/api/auth/user` for current user retrieval
- Admin-only routes for user management: `/api/users` (list), user updates, and deletions
- JSON request/response format with Zod schema validation

### Build & Deployment Strategy

**Development Mode**
- Vite dev server with middleware mode integrated into Express
- Hot Module Replacement (HMR) for rapid development
- Source maps enabled for debugging
- Replit-specific plugins for error overlays and development banners

**Production Build**
- Two-stage build process: Vite for client, esbuild for server
- Client assets bundled to `dist/public`
- Server code bundled to `dist/index.cjs` with selective dependency bundling
- Static file serving from Express in production
- Critical dependencies bundled to reduce cold start times (improved syscall performance)

**Build Optimization**
- Allowlist strategy for bundling frequently-used dependencies
- External dependencies for native modules and less-critical packages
- Single-file server bundle for faster startup

## External Dependencies

### Core Infrastructure
- **Neon Database** - Serverless PostgreSQL hosting with WebSocket support
- **Replit Authentication** - OpenID Connect provider for user authentication

### UI & Component Libraries
- **Radix UI** - Headless accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **shadcn/ui** - Pre-built component patterns on top of Radix UI
- **Lucide React** - Icon library for UI elements

### Data & State Management
- **TanStack Query** - Server state synchronization and caching
- **Drizzle ORM** - Type-safe database queries and migrations
- **Zod** - Runtime schema validation for API payloads

### Development Tools
- **TypeScript** - Type safety across frontend and backend
- **Tailwind CSS** - Utility-first styling framework
- **PostCSS & Autoprefixer** - CSS processing pipeline

### Authentication Stack
- **Passport.js** - Authentication middleware
- **openid-client** - OpenID Connect client implementation
- **express-session** - Session management
- **connect-pg-simple** - PostgreSQL session store

### Supporting Libraries
- **date-fns** - Date manipulation and formatting
- **recharts** - Data visualization for statistics charts
- **react-hook-form** - Form state management with validation
- **class-variance-authority** - Variant-based component styling