"use client";

import React, { useState } from "react";

interface ConditionalLogic {
  dependsOn: string;
  value: string;
}

interface Field {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  conditionalLogic?: ConditionalLogic;
  rows?: string[]; // for grid type
}

interface Step {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
}

interface Schema {
  steps: Step[];
}

interface DynamicFormProps {
  schema: Schema;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function DynamicForm({ schema, onSubmit, onCancel }: DynamicFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});

  let parsedSchema = schema;
  if (typeof schema === 'string') {
    try {
      parsedSchema = JSON.parse(schema);
    } catch (e) {
      console.error("Failed to parse schema", e);
    }
  }

  // Handle legacy flat array schema
  if (Array.isArray(parsedSchema)) {
    parsedSchema = {
      steps: [
        {
          id: "step1",
          title: "Formulár",
          fields: parsedSchema
        }
      ]
    };
  }

  if (!parsedSchema || !parsedSchema.steps || parsedSchema.steps.length === 0) {
    return <div>Neplatná schéma formulára. Schema: {JSON.stringify(schema)}</div>;
  }

  const step = parsedSchema.steps[currentStep];

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev: any) => {
        const newErrs = { ...prev };
        delete newErrs[fieldId];
        return newErrs;
      });
    }
  };

  const isFieldVisible = (field: Field) => {
    if (!field.conditionalLogic) return true;
    const parentValue = formData[field.conditionalLogic.dependsOn];
    
    // Simple equality check
    if (Array.isArray(parentValue)) {
      return parentValue.includes(field.conditionalLogic.value);
    }
    return parentValue === field.conditionalLogic.value;
  };

  const handleNext = () => {
    let valid = true;
    const newErrors: any = {};

    step.fields.forEach(field => {
      if (isFieldVisible(field) && field.required) {
        const val = formData[field.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          valid = false;
          newErrors[field.id] = "Toto pole je povinné";
        }
      }
    });

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    if (currentStep < parsedSchema.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  const renderField = (field: Field) => {
    if (!isFieldVisible(field)) return null;

    const hasError = !!errors[field.id];

    return (
      <div key={field.id} className="mb-6">
        <label className="block text-brand-navy font-bold mb-2">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        
        {field.type === "text" || field.type === "number" ? (
          <input 
            type={field.type}
            value={formData[field.id] || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || ""}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan ${hasError ? 'border-red-500' : 'border-gray-300'}`}
          />
        ) : field.type === "textarea" ? (
          <textarea 
            value={formData[field.id] || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || ""}
            rows={4}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan ${hasError ? 'border-red-500' : 'border-gray-300'}`}
          />
        ) : field.type === "radio" ? (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="radio" 
                  name={field.id} 
                  value={opt}
                  checked={formData[field.id] === opt}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-5 h-5 text-brand-cyan"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        ) : field.type === "checkbox" ? (
          <div className="space-y-2">
            {field.options?.map(opt => {
              const currentArr = formData[field.id] || [];
              const isChecked = currentArr.includes(opt);
              return (
                <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleChange(field.id, [...currentArr, opt]);
                      } else {
                        handleChange(field.id, currentArr.filter((item: string) => item !== opt));
                      }
                    }}
                    className="w-5 h-5 text-brand-cyan rounded focus:ring-brand-cyan"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        ) : field.type === "grid" ? (
          <div className="space-y-3">
            {field.rows?.map(row => (
              <div key={row} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700 mb-2 sm:mb-0">{row}</span>
                <input 
                  type="text" 
                  placeholder="uveďte počet (napr. 3x)"
                  value={(formData[field.id] && formData[field.id][row]) || ""}
                  onChange={(e) => {
                    const currentObj = formData[field.id] || {};
                    handleChange(field.id, { ...currentObj, [row]: e.target.value });
                  }}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-cyan outline-none"
                />
              </div>
            ))}
          </div>
        ) : field.type === "vas_scale" ? (
          <div className="px-2">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>0 (Žiadna bolesť)</span>
              <span>10 (Neznesiteľná bolesť)</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={formData[field.id] || 0}
              onChange={(e) => handleChange(field.id, Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
            />
            <div className="text-center mt-2 font-bold text-brand-navy">
              Vybraná hodnota: {formData[field.id] || 0}
            </div>
          </div>
        ) : null}

        {hasError && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
          <span>Krok {currentStep + 1} z {parsedSchema.steps.length}</span>
          <span>{Math.round(((currentStep + 1) / parsedSchema.steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-brand-cyan h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / parsedSchema.steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8">
        <h2 className="text-2xl font-bold text-brand-navy mb-2">{step.title}</h2>
        {step.description && <p className="text-gray-600 mb-8 whitespace-pre-line text-sm">{step.description}</p>}

        <div className="space-y-2">
          {step.fields.map(renderField)}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
        <button 
          onClick={handleBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          {currentStep === 0 ? "Zrušiť" : "O krok späť"}
        </button>
        <button 
          onClick={handleNext}
          className="px-8 py-2 bg-brand-navy text-white font-bold rounded-lg hover:bg-brand-dark-navy transition-colors"
        >
          {currentStep === parsedSchema.steps.length - 1 ? "Dokončiť a Uložiť" : "Pokračovať"}
        </button>
      </div>
    </div>
  );
}
