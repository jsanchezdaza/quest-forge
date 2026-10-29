import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  /** Replaces the default label classes. The auth form uses this to keep its current label styling. */
  labelClassName?: string
  /** Trailing control inside the field, such as a show-password button. */
  endAdornment?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    labelClassName,
    endAdornment,
    className = '',
    id,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  const helperId = `${fieldId}-helper`
  const descriptionId = error ? errorId : helperText ? helperId : undefined
  const describedBy = [descriptionId, props['aria-describedby']].filter(Boolean).join(' ') || undefined

  const input = (
    <input
      {...props}
      ref={ref}
      id={fieldId}
      className={[
        'w-full px-4 py-3 bg-background-darker border text-gray-100 rounded-lg transition-colors placeholder-gray-400 font-pixel-body text-sm',
        'focus-visible:outline-none focus-visible:ring-2',
        error
          ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
          : 'border-medieval-gold/30 focus-visible:border-medieval-gold focus-visible:ring-medieval-gold/20',
        endAdornment ? 'pr-12' : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-invalid={error ? true : props['aria-invalid']}
      aria-describedby={describedBy}
    />
  )

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={fieldId}
          className={labelClassName ?? 'block text-sm font-medium text-gray-300 mb-1'}
        >
          {label}
        </label>
      )}
      {endAdornment ? (
        <div className="relative">
          {input}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {endAdornment}
          </div>
        </div>
      ) : (
        input
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
