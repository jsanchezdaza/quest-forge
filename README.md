# Quest Forge - D&D Narrative Game

A React-based narrative D&D game built with TypeScript, Vite, Tailwind CSS, Zustand, and Supabase.

## Features

- **Authentication System**: Complete user registration, login, and profile management
- **Character Creation**: Choose from 6 different character classes with unique stats
- **Narrative Gameplay**: Interactive storytelling with choice-based progression
- **Character Progression**: Level up system with experience and stat tracking
- **Persistent Storage**: Save game progress with Supabase backend
- **Medieval UI Theme**: Dark medieval aesthetic with custom fonts and animations
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS with custom medieval theme
- **State Management**: Zustand
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Testing**: Node.js test runner and Playwright
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 24 or higher
- pnpm 11 or higher
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd quest-forge
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your public Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

AI narrative requests go through the authenticated `/api/openrouter` serverless function. Configure
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `OPENROUTER_API_KEY` as server-side Vercel environment
variables. The OpenRouter key must never use the `VITE_` prefix. Set
`VITE_OPENROUTER_ENABLED=false` to force static narratives in local development.

4. Set up the database:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `supabase/schema.sql`

5. Start the development server:
```bash
pnpm run dev
```

## Database Schema

The application uses three main tables:

- **user_profiles**: Store user information and usernames
- **game_sessions**: Store character data and game state
- **scenes**: Store narrative scenes and player choices

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Supabase Heartbeat Cron

The application includes a heartbeat cron job that keeps the Supabase instance active. This is particularly useful for free-tier Supabase projects that may pause after periods of inactivity.

**How it works:**
- A serverless function runs once daily at midnight UTC (`/api/heartbeat`)
- Performs a lightweight query to the database
- Configured in `vercel.json` using Vercel Cron Jobs (free tier allows 1 execution per day)

**Setup for Vercel deployment:**
1. Add environment variables in your Vercel project settings:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Local testing:**
You can test the heartbeat endpoint locally by running the function directly or deploying to Vercel.

## Character Classes

- **Warrior**: High Strength & Constitution
- **Mage**: High Intelligence
- **Rogue**: High Dexterity
- **Cleric**: High Wisdom
- **Ranger**: High Dexterity & Wisdom
- **Paladin**: High Strength & Charisma

## Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run test:unit` - Run serverless API unit tests
- `pnpm run test:e2e` - Run end-to-end tests
- `pnpm run lint` - Run ESLint
- `pnpm run check` - Run unit tests, type checks, lint, and the production build

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── game/          # Game-related components
│   └── ui/            # Reusable UI components
├── pages/             # Main page components
├── store/             # Zustand stores
├── lib/               # Utilities and configurations
├── types/             # TypeScript type definitions
├── styles/            # CSS and styling
└── test/              # Test setup and utilities
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run tests to ensure everything passes
6. Submit a pull request

## License

This project is licensed under the MIT License.