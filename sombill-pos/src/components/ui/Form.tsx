import React from 'react'

interface Field {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'file'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  multiple?: boolean
  accept?: string
  onChange?: (value: any) => void
  hidden?: boolean
}

interface FormProps {
  fields: Field[]
  data: Record<string, any>
  onChange: (name: string, value: any) => void
  onSubmit: () => void | Promise<void>
  errors?: Record<string, string>
  loading?: boolean
  submitText?: string
  customFields?: React.ReactNode
}

export function Form({ fields, data, onChange, onSubmit, errors, loading, submitText = 'Submit', customFields }: FormProps) {
  const renderField = (field: Field) => {
    const error = errors?.[field.name]
    
    // Skip hidden fields
    if (field.hidden) return null
    
    const baseClasses = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={data[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className={baseClasses}
          />
        )
      case 'select':
        return (
          <select
            name={field.name}
            value={data[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
            className={baseClasses}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <input
            type="checkbox"
            name={field.name}
            checked={data[field.name] || false}
            onChange={(e) => onChange(field.name, e.target.checked)}
            className="w-5 h-5 text-primary-700 border-gray-300 rounded focus:ring-primary-500"
          />
        )
      case 'file':
        return (
          <input
            type="file"
            name={field.name}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                if (field.onChange) {
                  field.onChange(file)
                }
                onChange(field.name, file)
              }
            }}
            accept={field.accept}
            multiple={field.multiple}
            className={baseClasses}
          />
        )
      default:
        return (
          <input
            type={field.type}
            name={field.name}
            value={data[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={baseClasses}
          />
        )
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      onSubmit()
    }} className="space-y-4">
      {fields.filter(f => !f.hidden).map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
          {errors?.[field.name] && (
            <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
          )}
        </div>
      ))}
      {customFields}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting...' : submitText}
      </button>
    </form>
  )
}
