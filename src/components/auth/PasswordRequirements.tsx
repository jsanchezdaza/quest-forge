import { Check, Circle } from 'lucide-react'
import { passwordRequirementStatus, VALIDATION_RULES } from '../../constants/validation'
import { useTranslation } from '../../i18n'

interface PasswordRequirementsProps {
  id: string
  password: string
}

const RULES = ['minLength', 'letter', 'number'] as const

/**
 * Checklist for a new password. Sign-up uses it today; the new-password
 * view (#37) can place the same list under its field.
 *
 * aria-live is off so typing is not announced. Blur and submit report
 * problems through the field error, which the input exposes with
 * aria-describedby. Rows use a minimum height so a longer label can wrap.
 */
export default function PasswordRequirements({ id, password }: PasswordRequirementsProps) {
  const { t } = useTranslation()
  const status = passwordRequirementStatus(password)
  const label = {
    minLength: t('auth.passwordRule.minLength', { min: VALIDATION_RULES.PASSWORD_MIN_LENGTH }),
    letter: t('auth.passwordRule.letter'),
    number: t('auth.passwordRule.number'),
  }

  return (
    <ul
      id={id}
      aria-live="off"
      className="flex list-none flex-col gap-1 bg-background-darker/55 text-left font-pixel-body text-sm leading-5 text-gray-100"
    >
      {RULES.map((rule) => {
        const met = status[rule]
        const Icon = met ? Check : Circle
        return (
          <li key={rule} className="flex min-h-5 items-center gap-2">
            <Icon aria-hidden size={16} className="shrink-0" />
            <span>{label[rule]}</span>
            <span className="sr-only">{met ? t('auth.passwordRule.met') : t('auth.passwordRule.notMet')}</span>
          </li>
        )
      })}
    </ul>
  )
}
