'use client';

import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: ReactNode;
}

export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  helpText,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : helpText ? (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helpText}</p>
      ) : null}
    </div>
  );
}
