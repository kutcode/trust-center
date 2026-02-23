'use client';

import { useState } from 'react';

type Validator<T, K extends keyof T> = (value: T[K], values: T) => string | null;
type ValidatorMap<T> = Partial<{ [K in keyof T]: Validator<T, K> }>;
type ErrorMap<T> = Partial<Record<keyof T, string>>;

export function useFormValidation<T>(validators: ValidatorMap<T>) {
  const [errors, setErrors] = useState<ErrorMap<T>>({});

  const validateField = <K extends keyof T>(field: K, values: T): string | null => {
    const validator = validators[field] as Validator<T, K> | undefined;
    const message = validator ? validator(values[field], values) : null;
    setErrors((prev) => {
      if (message) {
        return { ...prev, [field]: message };
      }
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    return message;
  };

  const validateAll = (values: T): boolean => {
    const nextErrors: ErrorMap<T> = {};

    (Object.keys(validators) as Array<keyof T>).forEach((field) => {
      const validator = validators[field];
      if (!validator) return;
      const message = (validator as Validator<T, typeof field>)(values[field], values);
      if (message) {
        nextErrors[field] = message;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearFieldError = <K extends keyof T>(field: K) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const clearErrors = () => setErrors({});

  return {
    errors,
    setErrors,
    validateField,
    validateAll,
    clearFieldError,
    clearErrors,
  };
}
