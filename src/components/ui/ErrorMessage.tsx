interface ErrorMessageProps {
  message: string
}

/**
 * Inline failure notice for forms. Renders nothing when there is no message, so
 * callers can pass their error state straight in. Announced to screen readers
 * as an alert, since it appears in response to an action the user just took.
 */
export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3"
    >
      {message}
    </div>
  )
}
