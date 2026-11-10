import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  /** Replaces the default label classes. The auth form uses this to keep its current label styling. */
  labelClassName?: string
  /** Trailing control inside the field, such as a show-password button. */
  endAdornment?: ReactNode
  /**
   * Content under the control, such as the password checklist. The error
   * line stays reserved above it whenever `error` is provided, including
   * when that string is empty. A longer message grows the line.
   */
  details?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    labelClassName,
    endAdornment,
    details,
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
  const hasError = Boolean(error)
  const descriptionId = hasError ? errorId : helperText ? helperId : undefined
  const describedBy = [descriptionId, props['aria-describedby']].filter(Boolean).join(' ') || undefined

  const input = (
    <input
      {...props}
      ref={ref}
      id={fieldId}
      className={[
        'w-full h-[46px] px-4 py-3 bg-background-darker border text-gray-100 rounded-lg transition-colors placeholder-gray-400 font-pixel-body text-base leading-5 sm:text-sm',
        'focus-visible:outline-none focus-visible:ring-2',
        hasError
          ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
          : 'border-medieval-gold/30 focus-visible:border-medieval-gold focus-visible:ring-medieval-gold/20',
        endAdornment ? 'pr-14' : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-invalid={hasError ? true : props['aria-invalid']}
      aria-describedby={describedBy}
    />
  )

  return (
    <div className="flex w-full flex-col gap-label-gap">
      {label && (
        <label
          htmlFor={fieldId}
          className={labelClassName ?? 'block text-sm font-medium text-gray-300'}
        >
          {label}
        </label>
      )}
      {endAdornment ? (
        <div className="relative">
          {input}
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {endAdornment}
          </div>
        </div>
      ) : (
        input
      )}
      {error !== undefined && (
        <p
          id={errorId}
          className={[
            // 6px of wash into the card padding. A line that fills a 320px card
            // otherwise has no background pixels beside the glyphs.
            'min-h-5 -mx-1.5 px-1.5 text-left text-sm leading-5 text-red-200',
            // A light red still misses 4.5:1 on the brightest part of the card,
            // so the message sits on a dark wash. The empty slot stays clear.
            hasError ? 'bg-background-darker/55' : '',
          ].filter(Boolean).join(' ')}
          aria-hidden={hasError ? undefined : true}
        >
          {error}
        </p>
      )}
      {details}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
