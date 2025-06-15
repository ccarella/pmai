'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IssueFormData, IssueType } from '@/lib/types/issue';

interface FormContextType {
  formData: Partial<IssueFormData>;
  updateFormData: (data: Partial<IssueFormData>) => void;
  resetForm: () => void;
  isDataLoaded: boolean;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

const STORAGE_KEY = 'pmai_form_data';

const initialFormData: Partial<IssueFormData> = {};

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<Partial<IssueFormData>>(initialFormData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setFormData(parsed);
      } catch (error) {
        console.error('Failed to parse stored form data:', error);
      }
    }
    setIsDataLoaded(true);
  }, []);

  // Save to localStorage whenever formData changes
  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isDataLoaded]);

  const updateFormData = useCallback((data: Partial<IssueFormData>) => {
    setFormData(prev => {
      const updated = { ...prev };
      
      // Deep merge the data
      Object.keys(data).forEach(key => {
        const typedKey = key as keyof IssueFormData;
        if (typeof data[typedKey] === 'object' && !Array.isArray(data[typedKey])) {
          updated[typedKey] = {
            ...prev[typedKey] as any,
            ...data[typedKey] as any,
          };
        } else {
          updated[typedKey] = data[typedKey] as any;
        }
      });
      
      return updated;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <FormContext.Provider value={{ formData, updateFormData, resetForm, isDataLoaded }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within FormProvider');
  }
  return context;
}