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

    // Helper for selected state in radio/checkbox
    const isSelected = (opt: string) => {
      const val = formValues[field.id];
      if (Array.isArray(val)) return val.includes(opt);
      return val === opt;
    };

    return (
      <div key={field.id} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
        <label className="block text-brand-navy font-bold text-lg mb-4">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        
        {field.type === "text" || field.type === "number" ? (
          <input 
            type={field.type}
            placeholder={field.placeholder || "Začnite písať..."}
            {...register(field.id, validation)}
            className={`w-full p-4 bg-gray-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-cyan transition-all duration-200 ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'}`}
          />
        ) : field.type === "textarea" ? (
          <textarea 
            placeholder={field.placeholder || "Začnite písať..."}
            rows={4}
            {...register(field.id, validation)}
            className={`w-full p-4 bg-gray-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-cyan transition-all duration-200 ${hasError ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'}`}
          />
        ) : field.type === "select" ? (
          <select 
            {...register(field.id, validation)}
            className={`w-full p-4 bg-gray-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-cyan transition-all duration-200 ${hasError ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <option value="">-- Vyberte --</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : field.type === "radio" || field.type === "checkbox" || field.type === "checkbox_group" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field.options?.map(opt => (
              <label 
                key={opt} 
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 group ${
                  isSelected(opt) 
                    ? 'border-brand-cyan bg-brand-light-cyan/20 ring-1 ring-brand-cyan shadow-sm' 
                    : 'border-gray-200 hover:border-brand-cyan/50 hover:bg-gray-50'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <input 
                    type={field.type === "radio" ? "radio" : "checkbox"} 
                    value={opt}
                    {...register(field.id, validation)}
                    className="sr-only" 
                  />
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors duration-200 ${field.type === "radio" ? "rounded-full" : "rounded"} border ${isSelected(opt) ? "border-brand-cyan bg-brand-cyan" : "border-gray-300 group-hover:border-brand-cyan/50"}`}>
                    {isSelected(opt) && (
                      field.type === "radio" 
                        ? <div className="w-2 h-2 bg-white rounded-full"></div> 
                        : <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                </div>
                <span className={`ml-3 font-medium ${isSelected(opt) ? 'text-brand-navy' : 'text-gray-700 group-hover:text-brand-navy'}`}>
                  {opt}
                </span>
              </label>
            ))}
          </div>
        ) : field.type === "grid" ? (
          <div className="space-y-3">
            {field.rows?.map(row => (
              <div key={row} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-gray-200 transition-colors">
                <span className="font-medium text-brand-navy mb-2 sm:mb-0">{row}</span>
                <input 
                  type="text" 
                  placeholder="napr. 3x"
                  {...register(`${field.id}.${row}`)}
                  className="p-3 w-full sm:w-48 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-all bg-white"
                />
              </div>
            ))}
          </div>
        ) : field.type === "vas_scale" ? (
          <div className="px-2 pt-4">
            <div className="flex justify-between text-sm text-gray-500 font-medium mb-3">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md">0 (Žiadna)</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md">10 (Neznesiteľná)</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10" 
              {...register(field.id)}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-cyan hover:accent-brand-dark-navy transition-all"
            />
            <div className="text-center mt-6">
              <span className="inline-block bg-brand-navy text-white text-xl font-bold px-4 py-2 rounded-xl shadow-sm">
                Bolesť: {formValues[field.id] || 0}
              </span>
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
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive ? 'border-brand-cyan bg-brand-light-cyan/30 scale-[1.02]' : 
                    hasError ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-brand-cyan hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {value ? (
                    <div className="text-brand-navy flex flex-col items-center">
                      <div className="w-16 h-16 bg-brand-cyan/10 text-brand-cyan rounded-full flex items-center justify-center text-3xl mb-4">📄</div>
                      <p className="font-bold text-lg">{value.name}</p>
                      <p className="text-sm text-gray-500 mt-1 font-medium">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
                      <span className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Kliknite pre zmenu súboru</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">☁️</div>
                      <p className="font-medium text-brand-navy text-lg">Potiahnite súbor sem</p>
                      <p className="text-sm mt-1">alebo kliknite pre výber z počítača</p>
                      <div className="flex gap-2 mt-4">
                        <span className="px-2 py-1 bg-gray-100 text-xs font-medium rounded text-gray-500">PDF</span>
                        <span className="px-2 py-1 bg-gray-100 text-xs font-medium rounded text-gray-500">JPG</span>
                        <span className="px-2 py-1 bg-gray-100 text-xs font-medium rounded text-gray-500">PNG</span>
                        <span className="px-2 py-1 bg-gray-100 text-xs font-medium rounded text-gray-500">Max 10MB</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          />
        ) : null}

        {hasError && (
          <div className="flex items-center text-red-500 text-sm mt-3 font-medium">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {errorMessage}
          </div>
        )}
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
