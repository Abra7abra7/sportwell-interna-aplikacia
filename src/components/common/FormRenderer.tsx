import React, { useState } from 'react';

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'vas_scale' | 'section_title';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

interface FormRendererProps {
  schema: FormField[];
  values: Record<string, any>;
  onChange: (id: string, value: any) => void;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
}

export default function FormRenderer({
  schema,
  values,
  onChange,
  onSubmit,
  submitLabel = 'Uložiť záznam do DB',
}: FormRendererProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    schema.forEach((field) => {
      if (field.type === 'section_title') return;

      const val = values[field.id];

      // Required check
      if (field.required) {
        if (val === undefined || val === null || val === '' || (field.type === 'checkbox' && !val)) {
          newErrors[field.id] = `Pole "${field.label}" je povinné.`;
        }
      }

      // Specific number check
      if (field.type === 'number' && val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          newErrors[field.id] = 'Zadajte platné číslo.';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (onSubmit) {
        onSubmit(e);
      }
    }
  };

  const handleFieldChange = (id: string, val: any) => {
    onChange(id, val);
    
    // Clear field-specific error as user types/interacts
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {schema.map((field) => {
          if (field.type === 'section_title') {
            return (
              <h3 key={field.id} className="text-sm font-bold text-brand-navy border-b pb-1 mt-4">
                {field.label}
              </h3>
            );
          }

          const hasError = !!errors[field.id];

          return (
            <div key={field.id} className="space-y-1">
              <label htmlFor={field.id} className="block font-bold text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === 'text' && (
                <input
                  id={field.id}
                  type="text"
                  required={field.required}
                  value={values[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className={`w-full bg-brand-off-white border p-2 rounded-lg outline-none transition-all ${
                    hasError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200'
                  }`}
                  placeholder={field.placeholder || ''}
                />
              )}

              {field.type === 'number' && (
                <input
                  id={field.id}
                  type="number"
                  required={field.required}
                  value={values[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className={`w-full bg-brand-off-white border p-2 rounded-lg outline-none transition-all ${
                    hasError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200'
                  }`}
                  placeholder={field.placeholder || ''}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  id={field.id}
                  required={field.required}
                  value={values[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className={`w-full bg-brand-off-white border p-2 rounded-lg outline-none h-24 transition-all ${
                    hasError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200'
                  }`}
                  placeholder={field.placeholder || ''}
                />
              )}

              {field.type === 'select' && (
                <select
                  id={field.id}
                  required={field.required}
                  value={values[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className={`w-full bg-brand-off-white border p-2 rounded-lg outline-none transition-all ${
                    hasError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200'
                  }`}
                >
                  <option value="">-- Vyberte možnosť --</option>
                  {field.options?.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'checkbox' && (
                <label className="flex items-center gap-2 cursor-pointer mt-1 font-semibold text-gray-700">
                  <input
                    id={field.id}
                    type="checkbox"
                    checked={!!values[field.id]}
                    onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                    className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                  />
                  <span>{field.label}</span>
                </label>
              )}

              {field.type === 'vas_scale' && (
                <div className="space-y-1 pt-1">
                  <input
                    id={field.id}
                    type="range"
                    min="0"
                    max="10"
                    value={values[field.id] !== undefined ? values[field.id] : 5}
                    onChange={(e) => handleFieldChange(field.id, parseInt(e.target.value))}
                    className="w-full accent-brand-cyan"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-1">
                    <span>Žiadna bolesť (0)</span>
                    <span className="text-brand-navy font-bold">
                      Hodnota: {values[field.id] !== undefined ? values[field.id] : 5}/10
                    </span>
                    <span>Neznesiteľná bolesť (10)</span>
                  </div>
                </div>
              )}

              {hasError && (
                <span className="text-xs text-red-500 font-semibold mt-0.5 block" aria-live="polite">
                  {errors[field.id]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {onSubmit && (
        <button
          type="submit"
          className="py-2.5 px-6 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-all mt-4"
        >
          {submitLabel}
        </button>
      )}
    </form>
  );
}
