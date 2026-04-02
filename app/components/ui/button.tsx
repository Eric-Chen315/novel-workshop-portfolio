import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  type?: 'button' | 'submit' | 'reset';
};

export const Button = ({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  type = 'button',
}: ButtonProps) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  }[variant];
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};