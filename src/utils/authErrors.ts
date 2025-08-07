interface AuthError {
  message: string
  code?: string
}

export const parseAuthError = (error: unknown): { title: string; message: string } => {
  const authError = error as AuthError
  
  // Common Supabase auth error codes and messages
  const errorMappings: Record<string, { title: string; message: string }> = {
    'invalid_credentials': {
      title: 'Login Failed',
      message: 'Invalid email or password. Please check your credentials and try again.'
    },
    'email_not_confirmed': {
      title: 'Email Not Confirmed',
      message: 'Please check your email and click the confirmation link before signing in.'
    },
    'user_not_found': {
      title: 'User Not Found',
      message: 'No account found with this email address. Please sign up first.'
    },
    'weak_password': {
      title: 'Weak Password',
      message: 'Password should be at least 6 characters long with a mix of letters and numbers.'
    },
    'email_address_invalid': {
      title: 'Invalid Email',
      message: 'Please enter a valid email address.'
    },
    'signup_disabled': {
      title: 'Sign Up Disabled',
      message: 'New user registration is currently disabled. Please contact support.'
    },
    'email_address_not_authorized': {
      title: 'Email Not Authorized',
      message: 'This email address is not authorized to create an account.'
    },
    'too_many_requests': {
      title: 'Too Many Attempts',
      message: 'Too many failed attempts. Please wait a few minutes before trying again.'
    }
  }

  // Check for specific error codes
  if (authError?.code && errorMappings[authError.code]) {
    return errorMappings[authError.code]
  }

  // Check for error message patterns
  const message = authError?.message?.toLowerCase() || ''
  
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return errorMappings.invalid_credentials
  }
  
  if (message.includes('email not confirmed')) {
    return errorMappings.email_not_confirmed
  }
  
  if (message.includes('user not found')) {
    return errorMappings.user_not_found
  }
  
  if (message.includes('weak password') || message.includes('password')) {
    return errorMappings.weak_password
  }
  
  if (message.includes('invalid email') || message.includes('email')) {
    return errorMappings.email_address_invalid
  }
  
  if (message.includes('too many requests') || message.includes('rate limit')) {
    return errorMappings.too_many_requests
  }

  // Fallback for unknown errors
  return {
    title: 'Authentication Error',
    message: authError?.message || 'An unexpected error occurred. Please try again.'
  }
}