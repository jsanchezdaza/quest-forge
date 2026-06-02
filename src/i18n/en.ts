// English translations — the source of truth for available translation keys.
// `es.ts` must satisfy `typeof en`, so every key here must also exist there.
export const en = {
  // App
  'app.title': 'QUEST FORGE',
  'app.initializing': 'Initializing Quest Forge...',

  // Language selector
  'language.en': 'EN',
  'language.es': 'ES',

  // Auth
  'auth.signInButton': 'SIGN IN',
  'auth.signUpButton': 'CREATE ACCOUNT',
  'auth.welcomeReturning': 'WELCOME BACK, ADVENTURER',
  'auth.welcomeNew': 'BEGIN YOUR QUEST',
  'auth.toggleToSignUp': "DON'T HAVE AN ACCOUNT? SIGN UP",
  'auth.toggleToSignIn': 'ALREADY HAVE AN ACCOUNT? SIGN IN',
  'auth.signOut': 'Sign Out',

  // Forms
  'form.emailLabel': 'Email',
  'form.emailPlaceholder': 'your.email@example.com',
  'form.usernameLabel': 'Username',
  'form.usernamePlaceholder': 'Choose a username',
  'form.passwordLabel': 'Password',
  'form.passwordPlaceholder': 'Your password',
  'form.characterNameLabel': 'Character Name',
  'form.characterNamePlaceholder': "Enter your character's name",
  'form.backstoryLabel': 'Backstory (Optional)',
  'form.backstoryPlaceholder': "Write your character's backstory or generate one with AI...",

  // Shared UI
  'ui.loading': 'Loading...',
  'ui.cancel': 'Cancel',
  'ui.confirmChanges': 'Confirm Changes',

  // Game
  'game.loadingAdventure': 'Loading your adventure...',
  'game.welcome': 'WELCOME, {username}',
  'game.newCharacter': 'New Character',
  'game.newCharacterShort': 'New',
  'game.startAdventure': 'START YOUR ADVENTURE',
  'game.createCharacterPrompt': 'CREATE A CHARACTER TO BEGIN YOUR JOURNEY IN THE WORLD OF QUEST FORGE.',
  'game.createCharacter': 'Create Character',
  'game.createCharacterTitle': 'Create Your Character',
  'game.noActiveSession': 'No active game session',
  'game.adventureLog': 'Adventure Log',
  'game.aiCrafting': 'AI is crafting your story...',
  'game.whatDoYouChoose': 'What do you choose?',
  'game.yourChoice': 'Your choice:',
  'game.levelUpTitle': 'Level Up!',
  'game.levelUpCongrats': 'Congratulations! You have reached level {level}',
  'game.pointsToDistribute': 'You have {points} attribute points to distribute',
  'game.levelAndClass': 'Level {level} {class}',
  'game.health': 'Health',
  'game.experience': 'Experience',
  'game.inventory': 'Inventory',
  'game.emptyInventory': 'Your inventory is empty',
  'game.attributes': 'Attributes',

  // Character creation
  'character.chooseClass': 'Choose Your Class',
  'character.nameRequiredGenerate': 'Please enter a character name first',
  'character.nameRequiredSubmit': 'Character name is required',
  'character.creationFailed': 'Failed to create character',
  'character.backstoryFailed': 'Failed to generate backstory: {error}',
  'character.generating': 'Generating...',
  'character.generateWithAI': 'Generate with AI',
  'character.configureAI': 'Configure OpenRouter API key to enable AI backstory generation',

  // Character classes
  'class.warrior.name': 'Warrior',
  'class.warrior.desc': 'A mighty fighter skilled in combat and weapons',
  'class.warrior.stats': 'High Strength & Constitution',
  'class.mage.name': 'Mage',
  'class.mage.desc': 'A master of arcane magic and ancient knowledge',
  'class.mage.stats': 'High Intelligence',
  'class.rogue.name': 'Rogue',
  'class.rogue.desc': 'A cunning thief skilled in stealth and daggers',
  'class.rogue.stats': 'High Dexterity',
  'class.cleric.name': 'Cleric',
  'class.cleric.desc': 'A divine healer blessed with holy powers',
  'class.cleric.stats': 'High Wisdom',
  'class.ranger.name': 'Ranger',
  'class.ranger.desc': 'A wilderness expert, master of bow and nature',
  'class.ranger.stats': 'High Dexterity & Wisdom',
  'class.paladin.name': 'Paladin',
  'class.paladin.desc': 'A holy warrior, champion of justice and light',
  'class.paladin.stats': 'High Strength & Charisma',

  // Stats / attributes
  'stat.strength': 'Strength',
  'stat.dexterity': 'Dexterity',
  'stat.intelligence': 'Intelligence',
  'stat.wisdom': 'Wisdom',
  'stat.constitution': 'Constitution',
  'stat.charisma': 'Charisma',

  // Footer
  'footer.copyright': '© 2025 Quest Forge. All rights reserved.',
  'footer.author': 'Author: ',

  // Auth error messages
  'error.loginFailed.title': 'Login Failed',
  'error.loginFailed.message': 'Invalid email or password. Please check your credentials and try again.',
  'error.emailNotConfirmed.title': 'Email Not Confirmed',
  'error.emailNotConfirmed.message': 'Please check your email and click the confirmation link before signing in.',
  'error.userNotFound.title': 'User Not Found',
  'error.userNotFound.message': 'No account found with this email address. Please sign up first.',
  'error.weakPassword.title': 'Weak Password',
  'error.weakPassword.message': 'Password should be at least 6 characters long with a mix of letters and numbers.',
  'error.invalidEmail.title': 'Invalid Email',
  'error.invalidEmail.message': 'Please enter a valid email address.',
  'error.signupDisabled.title': 'Sign Up Disabled',
  'error.signupDisabled.message': 'New user registration is currently disabled. Please contact support.',
  'error.emailNotAuthorized.title': 'Email Not Authorized',
  'error.emailNotAuthorized.message': 'This email address is not authorized to create an account.',
  'error.tooManyRequests.title': 'Too Many Attempts',
  'error.tooManyRequests.message': 'Too many failed attempts. Please wait a few minutes before trying again.',
  'error.completeRegistration.title': 'Complete Registration',
  'error.completeRegistration.message': 'Your account exists but your profile is incomplete. Please use the sign up form to complete registration with a username.',
  'error.connectionIssue.title': 'Connection Issue',
  'error.connectionIssue.message': 'Unable to connect to the server. Please check your internet connection and try again.',
  'error.authError.title': 'Authentication Error',
  'error.authError.message': 'An unexpected error occurred. Please try again.',

  // Static narrative (fallback when AI is unavailable)
  'narrative.initial':
    'Welcome, {name}! You are {desc}, standing at the edge of the small village of Millhaven. Dark clouds gather on the horizon, and rumors speak of strange happenings in the nearby forest. The villagers look to you with hope in their eyes, for they know that an adventure of great importance is about to begin.\n\nWhat path will you choose to start your quest?',
  'narrative.desc.warrior': 'a mighty warrior with sword and shield',
  'narrative.desc.mage': 'a wise mage wielding arcane powers',
  'narrative.desc.rogue': 'a cunning rogue skilled in stealth and daggers',
  'narrative.desc.cleric': 'a devoted cleric blessed with divine magic',
  'narrative.desc.ranger': 'a skilled ranger, one with nature',
  'narrative.desc.paladin': 'a righteous paladin, champion of justice',
  'narrative.initialChoice.1': 'Explore the mysterious forest path',
  'narrative.initialChoice.2': 'Visit the local tavern for information',
  'narrative.initialChoice.3': 'Head to the town market to gather supplies',
  'narrative.scene.forest':
    'You venture into the mysterious forest, where ancient trees whisper secrets of old. Suddenly, you hear a rustling in the bushes ahead. Your {characterClass} instincts tell you that danger may be lurking nearby...',
  'narrative.scene.tavern':
    'You push open the heavy wooden door of "The Prancing Pony" tavern. The warm glow of the fireplace welcomes you, and you notice several interesting characters: a hooded figure in the corner, a merchant counting coins, and the talkative bartender...',
  'narrative.scene.market':
    'The bustling town market is filled with vendors selling their wares. You notice a peculiar merchant selling what appears to be magical items, while another vendor whispers about rare herbs found only in the haunted forest...',
  'narrative.scene.default': 'Your choice leads you to a new adventure...',
  'narrative.choices.forest.1': 'Draw your weapon and investigate the sound',
  'narrative.choices.forest.2': 'Try to sneak past quietly',
  'narrative.choices.forest.3': 'Call out to see who or what is there',
  'narrative.choices.tavern.1': 'Approach the hooded figure',
  'narrative.choices.tavern.2': 'Talk to the merchant about local news',
  'narrative.choices.tavern.3': 'Ask the bartender about recent strange events',
  'narrative.choices.market.1': 'Examine the magical items for sale',
  'narrative.choices.market.2': 'Ask about the herbs from the haunted forest',
  'narrative.choices.market.3': 'Look for basic adventuring supplies',
  'narrative.choices.default.1': 'Continue your adventure',
  'narrative.choices.default.2': 'Rest and plan your next move',
  'narrative.choices.default.3': 'Seek guidance from locals',
  // Keywords used to map a chosen action to a static scene (must appear in the
  // matching choice texts above, in the same language).
  'narrative.keyword.forest': 'forest',
  'narrative.keyword.tavern': 'tavern',
  'narrative.keyword.market': 'market',
  // Instruction appended to AI prompts so generated text matches the UI language.
  'narrative.aiLanguageInstruction': 'Write your response in English.',
} satisfies Record<string, string>
