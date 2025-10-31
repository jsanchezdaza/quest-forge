import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          className={`w-full px-4 py-3 bg-background-darker border border-medieval-gold/30 focus:border-medieval-gold text-gray-100 rounded-lg transition-colors placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medieval-gold/20 font-pixel-body text-sm resize-y min-h-[100px] ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />

        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
