import {
  forwardRef,
  useRef,
  useState,
  type FocusEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Input from './Input'
import { useTranslation } from '../../i18n'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  labelClassName?: string
  details?: ReactNode
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { onBlur, details, ...props },
  ref,
) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectionRef = useRef<{ start: number; end: number } | null>(null)

  const setInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  const remember = (input: HTMLInputElement | null) => {
    if (!input || input.selectionStart === null || input.selectionEnd === null) return
    selectionRef.current = { start: input.selectionStart, end: input.selectionEnd }
  }

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    remember(event.currentTarget)
    onBlur?.(event)
  }

  const toggle = () => {
    const input = inputRef.current
    // After the field blurs, its caret may already have collapsed. Keep the
    // range captured on blur instead of reading that collapsed caret.
    if (input && document.activeElement === input) remember(input)
    const saved = selectionRef.current
    setVisible((current) => !current)
    if (!input || !saved) return
    // Changing the input type resets the caret after this event. Put it back
    // once the browser has finished that reset.
    window.setTimeout(() => input.setSelectionRange(saved.start, saved.end), 0)
  }

  const toggleLabel = visible ? t('form.hidePassword') : t('form.showPassword')

  return (
    <Input
      {...props}
      ref={setInputRef}
      type={visible ? 'text' : 'password'}
      spellCheck={false}
      autoCapitalize="none"
      autoCorrect="off"
      onBlur={handleBlur}
      details={details}
      endAdornment={
        <button
          type="button"
          aria-pressed={visible}
          aria-label={toggleLabel}
          onPointerDown={(event) => {
            remember(inputRef.current)
            // Keep focus in the field so the caret does not jump.
            event.preventDefault()
          }}
          onClick={toggle}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-medieval-gold hover:text-white"
        >
          {visible ? <EyeOff aria-hidden size={20} /> : <Eye aria-hidden size={20} />}
        </button>
      }
    />
  )
})

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
