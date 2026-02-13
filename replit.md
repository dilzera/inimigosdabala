# Inimigos da Bala

## Overview

Inimigos da Bala is a Counter-Strike 2 community management system designed for friend groups. The application tracks player performance metrics, manages user profiles, provides player rankings, team balancing (MIX), server information, and administrative dashboards. Built as a full-stack TypeScript application with Portuguese language interface, it combines a React frontend with an Express backend, using PostgreSQL for data persistence and Replit's OpenID Connect for authentication.

## User Preferences

- Preferred communication style: Simple, everyday language
- Language: Portuguese (Brazil)
- Theme: CS-themed dark design with orange accents

## Application Structure

### Main Menu Structure
The sidebar navigation includes the following sections:

1. **Mural** - Home page with information board (server costs, ACE player, monthly ranking, championship, profile update)

2. **Dashboard** - Personal stats dashboard (Admin: AdminDashboard, Player: Dashboard)

3. **MIX** (Collapsible)
   - Escolher Time do Mix - Team balancing for matches

4. **Perfil de Usuário** - User profile with personal stats

5. **Melhores Jogadores** - Player rankings with multiple categories (Skill Rating, K/D, HS%, Win Rate, MVPs, Assists)

6. **Piores Jogadores** - Worst player rankings (Skill Rating, K/D, HS%, Win Rate)

5. **Servidor** (Collapsible)
   - Comandos do Servidor - Server commands reference
   - Mapas de Treino - Training maps with Workshop links
   - Como Colocar as Skins - Skin customization guide
   - SteamID64 - How to get SteamID64

5. **Patrocinadores** - Sponsors page

6. **Links** (Collapsible)
   - Discord - External link
   - WhatsApp - External link

7. **Partidas** (Collapsible)
   - Jogadas por você - User's match history
   - Todas - All matches history

8. **Painel Admin** (Admin only, Collapsible)
   - Gerenciar Usuários - User management
   - Importar Partida - CSV import from CS2 server

### Page Routes
- `/` - Mural (information board - home page after login)
- `/dashboard` - Personal dashboard (Admin: AdminDashboard, Player: Dashboard)
- `/perfil` - User profile page
- `/mix/escolher-time` - Team selection for MIX
- `/rankings` - Player leaderboards
- `/piores-jogadores` - Worst player rankings
- `/servidor/comandos` - Server commands
- `/servidor/mapas` - Training maps
- `/servidor/skins` - Skin guide
- `/servidor/steamid` - SteamID64 guide
- `/patrocinadores` - Sponsors page
- `/cassino/apostas` - Virtual betting on player stats
- `/cassino/jogos` - Case opening and slot machine games
- `/partidas/minhas` - User's matches
- `/partidas/todas` - All matches
- `/admin/users` - Admin user management
- `/admin/import` - CSV match data import (admin only)

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
- Gaming dashboard aesthetic inspired by competitive gaming platforms (Tracker.gg, FACEIT)

**State Management**
- TanStack Query (React Query) for server state management with aggressive caching strategies (staleTime: Infinity)
- Custom hooks pattern for business logic encapsulation (useAuth for authentication state)
- No global client state management library - relying on React Query's cache and local component state

**Design System**
- Custom logo integration (Inimigos da Bala logo)
- Typography: Inter font for data display, JetBrains Mono for statistics and numerical values
- Consistent spacing using Tailwind's 2/4/6/8 unit system
- Responsive grid layouts: 3-column on desktop, collapsing to 1-2 columns on mobile
- Component elevation system using subtle borders and shadows

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
The application uses the following main tables:
1. **sessions** - Express session storage for authentication state
2. **users** - Player profiles with SteamID64 and aggregated CS stats including:
   - Basic combat stats (kills, deaths, assists, headshots, damage)
   - Match stats (wins, losses, rounds played/won, MVPs)
   - Multi-kill stats (2K, 3K, 4K, 5K/ACE)
   - Clutch performance (1v1, 1v2 wins/count)
   - Entry frag stats (wins/count)
   - Utility stats (flash count/success, enemies flashed, utility damage)
   - Accuracy stats (shots fired, shots on target)
3. **matches** - Individual match records (map, scores, date, external match ID)
4. **matchStats** - Per-player statistics for each match including all 30+ detailed stat fields from CS2 server CSV
5. **casinoBalances** - Virtual currency balances for casino system (starts at R$10M)
6. **bets** - Player betting records with target player, amounts, odds, and status
7. **betItems** - Individual bet conditions (kills over/under, K/D, headshots, etc.)
8. **casinoTransactions** - Transaction history for balance changes (bets, wins, games)

**Authentication & Authorization**
- Replit OpenID Connect integration using openid-client and Passport.js
- Role-based access control with `isAdmin` flag on user records
- Protected API routes using `isAuthenticated` middleware
- Session management with 7-day cookie lifetime

**Admin Bootstrap Logic**
- The FIRST user to log in is automatically granted admin privileges (`isAdmin = true`)
- All subsequent users are regular players by default (`isAdmin = false`)
- Admin status is preserved across logins: the `upsertUser` function uses PostgreSQL ON CONFLICT with a SET clause that excludes `isAdmin`, ensuring existing roles are never overwritten
- Admins can promote other users via the user management API (PATCH /api/users/:id)

**API Endpoints**
- `GET /api/auth/user` - Get current authenticated user
- `GET /api/users` - Get all users (for rankings, mix balancing)
- `PATCH /api/users/:id` - Update user stats (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/matches` - Get all matches
- `GET /api/users/:id/matches` - Get user's match stats
- `POST /api/matches/import` - Import CSV match data from CS2 server (admin only, also resolves pending bets)
- `POST /api/users/link-steam` - Link SteamID64 to user account
- `GET /api/casino/balance` - Get user's virtual currency balance
- `GET /api/casino/bets` - Get user's betting history
- `POST /api/casino/bet` - Place a bet on a player's stats
- `POST /api/casino/slot` - Play the tigrinho slot machine (10% win rate, 2x-50x multipliers)
- `POST /api/casino/case` - Open a case (6 rarity tiers: consumidor to faca/luva)

**CSV Import System**
- Admin-only feature for importing match data from CS2 server CSV exports
- Supports file upload or direct paste of CSV content
- CSV format includes: matchid, mapnumber, steamid64, team, and 30+ statistical fields
- Automatic player creation from Steam data if SteamID64 not found in system
- Aggregated user statistics are recalculated after each import
- Duplicate match detection based on external match ID
- **Automatic MVP Calculation**: When importing a match, the system analyzes player performance and assigns MVP to the best performer based on:
  - Kills (2 pts each), Assists (0.5 pts), K/D ratio (5 pts per ratio)
  - Headshot percentage (up to 10 pts), Damage (0.01 pts per damage)
  - Multi-kills: ACE (15 pts), 4K (10 pts), 3K (5 pts), 2K (2 pts)
  - Clutches: 1v1 wins (8 pts), 1v2 wins (12 pts)
  - Entry frags (3 pts each), Utility damage (0.02 pts per damage)
  - Enemies flashed (0.5 pts each)

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
