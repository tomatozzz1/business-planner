# Business Planner

A comprehensive productivity and business management application built with React, Vite, and Supabase. Track your tasks, goals, events, notes, and contacts all in one place with a beautiful, modern interface.

![Business Planner](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

### Dashboard

- Quick overview of your day with task and event summaries
- Real-time statistics and progress tracking
- Priority task matrix (Eisenhower Matrix)
- Visual progress indicators for goals

### Calendar

- Monthly calendar view with event management
- Color-coded events by type (meetings, deadlines, reminders, etc.)
- Quick event creation and editing
- Responsive design for all devices

### Weekly Planner

- Week-at-a-glance view
- Drag-and-drop task organization
- Daily task and event summaries
- Productivity metrics

### Goals & Objectives

- Track personal, professional, and project goals
- Milestone-based progress tracking
- Visual progress bars
- Category-based organization

### Task Management

- Eisenhower Matrix prioritization (Urgent/Important)
- Task filtering by status and priority
- Due dates and time tracking
- Category tagging

### Notes

- Markdown support for rich text formatting
- Tag-based organization
- Pin important notes
- Color-coded note cards
- Search functionality

### Contacts

- Comprehensive contact management
- Company and position tracking
- Favorite contacts
- Category organization (clients, colleagues, vendors, etc.)
- Quick access to email and phone

### Progress & Analytics

- Weekly activity charts
- Task completion statistics
- Goal progress tracking
- Productivity score calculation
- Visual data representations with Recharts

### Settings

- Customizable branding (logo, company name, slogan)
- Theme customization with color presets
- Date and time format preferences
- Week start day configuration

## Tech Stack

- **Frontend Framework:** React 18.2
- **Build Tool:** Vite 5.0
- **Styling:** Tailwind CSS 3.4
- **Database:** Supabase (PostgreSQL)
- **State Management:** TanStack Query (React Query)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React
- **UI Components:** shadcn/ui
- **Date Handling:** date-fns
- **Markdown:** react-markdown

## Installation

### Prerequisites

- Node.js 16+ and npm
- Supabase account (free tier available)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/business-planner.git
cd business-planner
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the schema provided in `/docs/supabase-schema.sql`
4. Get your project credentials from Project Settings > API

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 5: Install UI Components

```bash
npx shadcn@latest init
npx shadcn@latest add button card input label textarea select dialog tabs badge progress avatar checkbox dropdown-menu radio-group
```

### Step 6: Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Screenshots

### Dashboard Screenshot

![Dashboard](images/bp-dashboard.png)

### Calendar Screenshot

![Calendar](images/bp-calendar.png)

### Weekly Planner Screenshot

![Weekly Planner](images/bp-weeklyPlanner.png)

### Goals Screenshot

![Goals](images/bp-goals.png)

### Tasks Screenshot

![Tasks](images/bp-tasks.png)

### Notes Screenshot

![Notes](images/bp-notes.png)

### Contacts Screenshot

![Contacts](images/bp-contacts.png)

### Progress Screenshot

![Progress](images/bp-progress.png)

### Settings Screenshot

![Settings](images/bp-settings.png)
