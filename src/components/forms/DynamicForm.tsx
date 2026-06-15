"use client";

import React, { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { useDropzone } from "react-dropzone";

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
  steps?: Step[];
  fields?: Field[];
}

interface DynamicFormProps {
  schema: Schema | string | any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function DynamicForm({ schema, onSubmit, onCancel }: DynamicFormProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const { register, handleSubmit, control, watch, trigger, formState: { errors } } = useForm({
    mode: "onTouched"
  });

  const formValues = watch();

  let parsedSchema: Schema = { steps: [] };
  
  if (typeof schema === 'string') {
    try { parsedSchema = JSON.parse(schema); } catch (e) { console.error("Parse error"); }
  } else if (Array.isArray(schema)) {
    parsedSchema = { fields: schema };
  } else {
    parsedSchema = schema as Schema;
  }

  // Normalize to steps internally
  let steps: Step[] = [];
  if (parsedSchema.steps && parsedSchema.steps.length > 0) {
    steps = parsedSchema.steps;
  } else if (parsedSchema.fields && parsedSchema.fields.length > 0) {
    steps = [{ id: "step1", title: "Formulár", fields: parsedSchema.fields }];
  } else if (Array.isArray(parsedSchema)) {
    steps = [{ id: "step1", title: "Formulár", fields: parsedSchema }];
  }

  if (steps.length === 0) {
    return <div>Neplatná schéma formulára.</div>;
  }

  const step = steps[currentStep];

  const isFieldVisible = (field: Field) => {
    if (!field.conditionalLogic) return true;
    const parentValue = formValues[field.conditionalLogic.dependsOn];
    if (Array.isArray(parentValue)) {
      return parentValue.includes(field.conditionalLogic.value);
    }
    return parentValue === field.conditionalLogic.value;
  };

  const handleNext = async () => {
    // Validate only visible fields in current step
    const fieldsToValidate = step.fields
      .filter(f => isFieldVisible(f))
      .map(f => f.id);
      
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit(onSubmit)();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      onCancel();
    }
  };

  const renderField = (field: Field) => {
    if (!isFieldVisible(field)) return null;
    const hasError = !!errors[field.id];
    const errorMessage = errors[field.id]?.message as string;

    const validation = { required: field.required ? "Toto pole je povinné" : false };

    return (
      <div key={field.id} className="mb-6">
        <label className="block text-brand-navy font-bold mb-2">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        
        {field.type === "text" || field.type === "number" ? (
          <input 
            type={field.type}
            placeholder={field.placeholder || ""}
            {...register(field.id, validation)}
            className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-cyan ${hasError ? 'border-red-500' : 'border-gray-300'}`}
          />
        ) : field.type === "textarea" ? (
          <textarea 
            placeholder={field.placeholder || ""}
            rows={4}
            {...register(field.id, validation)}
            className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-cyan ${hasError ? 'border-red-500' : 'border-gray-300'}`}
          />
        ) : field.type === "select" ? (
          <select 
            {...register(field.id, validation)}
            className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-cyan bg-white ${hasError ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">-- Vyberte --</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : field.type === "radio" ? (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="radio" 
                  value={opt}
                  {...register(field.id, validation)}
                  className="w-5 h-5 text-brand-cyan"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        ) : field.type === "checkbox" || field.type === "checkbox_group" ? (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  value={opt}
                  {...register(field.id, validation)}
                  className="w-5 h-5 text-brand-cyan rounded focus:ring-brand-cyan"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        ) : field.type === "grid" ? (
          <div className="space-y-3">
            {field.rows?.map(row => (
              <div key={row} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700 mb-2 sm:mb-0">{row}</span>
                <input 
                  type="text" 
                  placeholder="uveďte počet (napr. 3x)"
                  {...register(`${field.id}.${row}`)}
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
              {...register(field.id)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
            />
            <div className="text-center mt-2 font-bold text-brand-navy">
              Vybraná hodnota: {formValues[field.id] || 0}
            </div>
          </div>
        ) : field.type === "file_upload" ? (
          <Controller
            control={control}
            name={field.id}
            rules={{ required: field.required ? "Súbor je povinný" : false }}
            render={({ field: { onChange, value } }) => {
              const onDrop = useCallback((acceptedFiles: File[]) => {
                if (acceptedFiles.length > 0) {
                  onChange(acceptedFiles[0]); // store the actual File object
                }
              }, [onChange]);

              const { getRootProps, getInputProps, isDragActive } = useDropzone({
                onDrop,
                maxSize: 10 * 1024 * 1024, // 10 MB limit
                accept: {
                  'image/*': ['.jpeg', '.jpg', '.png'],
                  'application/pdf': ['.pdf']
                },
                multiple: false
              });

              return (
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-brand-cyan bg-brand-light-cyan/50' : 
                    hasError ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-brand-cyan hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {value ? (
                    <div className="text-brand-navy">
                      <div className="text-2xl mb-2">📄</div>
                      <p className="font-bold">{value.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p className="text-sm text-brand-cyan mt-3 hover:underline">Kliknite pre zmenu súboru</p>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <div className="text-3xl mb-2">☁️</div>
                      <p className="font-medium text-gray-700">Potiahnite súbor sem alebo kliknite pre výber</p>
                      <p className="text-xs mt-2">Podporované formáty: PDF, JPG, PNG (Max 10 MB)</p>
                    </div>
                  )}
                </div>
              );
            }}
          />
        ) : null}

        {hasError && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Progress Bar */}
      {steps.length > 1 && (
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
            <span>Krok {currentStep + 1} z {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-brand-cyan h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={(e) => e.preventDefault()}>
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
            type="button"
            onClick={handleBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            {currentStep === 0 ? "Zrušiť" : "O krok späť"}
          </button>
          <button 
            type="button"
            onClick={handleNext}
            className="px-8 py-2 bg-brand-navy text-white font-bold rounded-lg hover:bg-brand-dark-navy transition-colors"
          >
            {currentStep === steps.length - 1 ? "Dokončiť a Uložiť" : "Pokračovať"}
          </button>
        </div>
      </form>
    </div>
  );
}
