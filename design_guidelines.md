# Counter-Strike Match Management System - Design Guidelines

## Design Approach

**Hybrid Gaming Dashboard Approach**: Drawing inspiration from competitive gaming platforms (Tracker.gg, Leetify, FACEIT) combined with modern admin dashboards (Linear, Vercel). This creates a professional statistics interface with gaming-appropriate aesthetics.

**Core Principles**:
- Data clarity over decoration
- Competitive gaming atmosphere
- Instant metric comprehension
- Professional dashboard functionality

## Typography

**Font Stack**:
- Primary: "Inter" (Google Fonts) - Clean, highly legible for data
- Monospace: "JetBrains Mono" - For statistics, K/D ratios, numerical displays

**Hierarchy**:
- Page Headers: text-3xl font-bold tracking-tight
- Section Headers: text-xl font-semibold
- Stat Labels: text-sm font-medium uppercase tracking-wide
- Primary Stats: text-4xl font-bold (monospace for numbers)
- Body Text: text-base
- Secondary Text: text-sm

## Layout System

**Spacing Units**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-6
- Section spacing: space-y-6
- Card gaps: gap-4
- Tight groupings: gap-2

**Grid System**:
- Dashboard: 3-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Stats cards: 2-4 columns based on content density
- User tables: Full-width with responsive overflow

## Component Library

**Navigation**:
- Sidebar navigation (fixed left, width w-64) with user avatar, role badge, main menu items
- Top bar showing current page title, user profile dropdown, logout button

**Dashboard Cards**:
- Stat Cards: Elevated containers (rounded-lg with subtle border) showing icon, label, large value, trend indicator
- Primary metrics: K/D Ratio, Win Rate, Headshot %, Total Matches
- Secondary metrics: Recent performance, rank progression, favorite weapons

**Data Displays**:
- Match History Table: Striped rows, sortable columns (date, map, result, K/D, score)
- Leaderboards: Ranked lists with position number, player name, key stats
- Performance Graphs: Line charts for trends over time using Chart.js or similar

**Forms** (Admin & User Management):
- Input fields with floating labels
- Role selector (dropdown: Admin/Player)
- Stats editors: Grid of labeled number inputs
- Action buttons grouped at bottom (Save/Cancel/Delete)

**Authentication**:
- Login page: Centered card (max-w-md) with logo area, input fields, social login options via Replit Auth
- No full-page background image - clean centered form

**Badges & Status**:
- Role badges: Small pills (px-3 py-1 rounded-full text-xs font-semibold)
- Win/Loss indicators: Subtle background treatments
- Rank badges: Icon + text combination

**Modals**:
- User deletion confirmation: Centered overlay with warning icon
- Match details: Larger modal with full statistics breakdown

## Images

**Strategic Image Use**:
- User Avatars: Circular thumbnails (w-10 h-10) throughout interface
- Weapon Icons: Small inline icons (w-6 h-6) in stat breakdowns
- Map Thumbnails: Small previews (aspect-video) in match history
- No large hero images - this is a data-focused application
- Dashboard background: Subtle pattern or solid treatment, not imagery

**Image Placeholders**:
- User avatars default to initials in colored circle
- Weapon/map icons from icon library or placeholder comments

## Special Considerations

**Admin Features**:
- Clear visual distinction for admin views (admin badge always visible)
- Bulk action capabilities in user table (checkboxes, action bar)
- Inline editing for quick stat updates

**Responsive Behavior**:
- Sidebar collapses to hamburger menu on mobile
- Stat cards stack to single column
- Tables scroll horizontally on small screens
- Maintain data readability at all breakpoints

**Empty States**:
- "No matches yet" with icon and CTA to add first match
- "No users" in admin view with "Create User" prompt