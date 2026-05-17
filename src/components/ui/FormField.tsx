import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label>{label}</label>
      <div className="form-field-control">{children}</div>
      {error && <p className="field-error">{error}</p>}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
