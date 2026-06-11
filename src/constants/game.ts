// Game balance constants
export const GAME_CONSTANTS = {
  // Experience system
  EXPERIENCE_PER_LEVEL: 100,
  EXPERIENCE_GAIN_MIN: 5,
  EXPERIENCE_GAIN_MAX: 25,

  // Level up rewards  
  ATTRIBUTE_POINTS_PER_LEVEL: 3,
  HEALTH_GAIN_PER_LEVEL: 20,

  // Starting values
  STARTING_HEALTH: 100,
  STARTING_LEVEL: 1,
  // Cosmetic gold shown in the status bar (not yet tracked in game state).
  STARTING_GOLD: 50,

  // Status bar thresholds (current health as a percentage of max).
  HEALTH_HEALTHY_THRESHOLD: 75,
  HEALTH_WOUNDED_THRESHOLD: 40,

  // UI constants
  MAX_NARRATIVE_PREVIEW_LENGTH: 150,
} as const