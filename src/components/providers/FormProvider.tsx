'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IssueFormData } from '@/lib/types/issue';

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
      // Deep merge the data
      const merged: Partial<IssueFormData> = {
        ...prev,
        ...data,
      };
      
      // Special handling for nested objects
      if (data.context) {
        merged.context = {
          ...prev.context,
          ...data.context,
        };
      }
      if (data.technical) {
        merged.technical = {
          ...prev.technical,
          ...data.technical,
        };
      }
      if (data.implementation) {
        merged.implementation = {
          ...prev.implementation,
          ...data.implementation,
        };
      }
      
      return merged;
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