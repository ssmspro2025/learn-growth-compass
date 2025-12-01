import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dateFnsFormat, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// New helper function for safe date formatting
export function safeFormatDate(dateInput: string | Date | null | undefined, formatString: string, defaultValue: string = '-') {
  if (!dateInput) {
    return defaultValue;
  }
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (!isValid(date)) {
    return defaultValue;
  }
  return dateFnsFormat(date, formatString);
}

// Helper function to format error messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') {
      return err.message;
    }
    if (typeof err.error_description === 'string') {
      return err.error_description;
    }
    if (typeof err.hint === 'string') {
      return err.hint;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
