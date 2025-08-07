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

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom medieval theme
- **State Management**: Zustand
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Testing**: Jest, React Testing Library, Playwright
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm
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
cp .env.example .env
```

Update `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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
- `pnpm run test` - Run unit tests
- `pnpm run test:e2e` - Run end-to-end tests
- `pnpm run lint` - Run ESLint

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