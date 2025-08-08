export const AUTH_MESSAGES = {
  SIGNIN_LOADING: 'SIGNING IN...',
  SIGNUP_LOADING: 'CREATING ACCOUNT...',
  SIGNIN_BUTTON: 'SIGN IN',
  SIGNUP_BUTTON: 'CREATE ACCOUNT',
  SIGNIN_SUCCESS: {
    title: 'Welcome Back!',
    message: 'Successfully signed in. Prepare for adventure!'
  },
  SIGNUP_SUCCESS: {
    title: 'Account Created Successfully',
    message: 'Welcome to Quest Forge! You can now start your adventure.'
  },
  WELCOME_MESSAGES: {
    RETURNING_USER: 'WELCOME BACK, ADVENTURER',
    NEW_USER: 'BEGIN YOUR QUEST'
  },
  TOGGLE_MESSAGES: {
    TO_SIGNUP: "DON'T HAVE AN ACCOUNT? SIGN UP",
    TO_SIGNIN: 'ALREADY HAVE AN ACCOUNT? SIGN IN'
  }
} as const