"use client";

import React from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-md border border-gray-300 p-2 text-sm 
          focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 
          disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
