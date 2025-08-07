interface FormFieldProps {
  id: string
  type: string
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
  required?: boolean
  minLength?: number
}

export default function FormField({ 
  id, 
  type, 
  value, 
  onChange, 
  label, 
  placeholder, 
  required, 
  minLength 
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        required={required}
        placeholder={placeholder}
        minLength={minLength}
      />
    </div>
  )
}