interface ErrorMessageProps {
  message: string
}

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
