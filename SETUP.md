# Quest Forge - Setup Instructions

## Complete Supabase Configuration

To fully configure the application, follow these steps:

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to "Settings" > "API" section to get:
   - Project URL
   - anon/public key

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database

1. Go to the "SQL Editor" section in your Supabase dashboard
2. Create a new query and copy all content from `supabase/schema.sql`
3. Execute the query to create all tables and RLS policies

### 4. Verify Configuration

The following tables should be created:
- `user_profiles`
- `game_sessions` 
- `scenes`

And RLS policies should be enabled so users can only access their own data.

### 5. Start the Application

```bash
pnpm install
pnpm run dev
```

The application should be available at `http://localhost:5173`

## Implemented Features

✅ Complete authentication system (register/login/logout)
✅ Character creation with 6 different classes
✅ Interactive narrative system with choices
✅ Character progression (level, experience, stats)
✅ Automatic progress saving
✅ Medieval interface with dark theme
✅ Responsive design
✅ Unit and e2e tests configured
✅ RLS policies for data security

## Game Structure

### Character Classes
- **Warrior**: High Strength & Constitution
- **Mage**: High Intelligence
- **Rogue**: High Dexterity
- **Cleric**: High Wisdom
- **Ranger**: High Dexterity & Wisdom
- **Paladin**: High Strength & Charisma

### Progression System
- Characters gain experience by making choices
- Every 100 experience points = level up
- Leveling up increases maximum health
- Stats are assigned based on chosen class

### Narrative
- Game starts in the village of Millhaven
- Players choose between different narrative paths
- Decisions affect story development
- A log of all choices is maintained

## Available Commands

```bash
pnpm run dev         # Development server
pnpm run build       # Build for production
pnpm run preview     # Production preview
pnpm run test        # Run unit tests
pnpm run test:e2e    # Run end-to-end tests
pnpm run lint        # Code linter
```

## Next Steps

To expand the application you could add:
- More narrative options and story branches
- More complex inventory system
- Turn-based combat
- Multiple characters per user
- Player chat system
- Procedurally generated dungeons