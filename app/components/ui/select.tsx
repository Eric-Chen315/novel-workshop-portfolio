"use client";

import React from "react";

export interface SelectOption {
  value: string;
  label: string;
}

// Select 复合组件的上下文
interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

// 根 Select 组件
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value = "", onValueChange, children }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onValueChange: onValueChange || (() => {}) }}>
      <div className="w-full">{children}</div>
    </SelectContext.Provider>
  );
}

// SelectTrigger - 触发器
interface SelectTriggerProps {
  children?: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className = "" }: SelectTriggerProps) {
  const context = React.useContext(SelectContext);
  if (!context) return null;
  
  return (
    <div 
      className={`flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${className}`}
    >
      {children || <span className="text-gray-400">请选择</span>}
    </div>
  );
}

// SelectValue - 显示选中值
interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder = "请选择" }: SelectValueProps) {
  const context = React.useContext(SelectContext);
  if (!context) return <span>{placeholder}</span>;
  
  return <span>{context.value || placeholder}</span>;
}

// SelectContent - 下拉内容容器
interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className = "" }: SelectContentProps) {
  return (
    <div className={`mt-1 rounded-md border border-gray-300 bg-white shadow-sm ${className}`}>
      <div className="py-1">{children}</div>
    </div>
  );
}

// SelectItem - 下拉选项
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className = "" }: SelectItemProps) {
  const context = React.useContext(SelectContext);
  if (!context) return null;
  
  const isSelected = context.value === value;
  
  return (
    <div 
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50 text-blue-600' : ''} ${className}`}
      onClick={() => context.onValueChange(value)}
    >
      {children}
    </div>
  );
}

// SelectLabel - 标签
interface SelectLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectLabel({ children, className = "" }: SelectLabelProps) {
  return <div className={`px-3 py-2 text-sm font-medium text-gray-700 ${className}`}>{children}</div>;
}

// 兼容旧的简单使用方式
type SimpleSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: SelectOption[];
};

export const SimpleSelect = React.forwardRef<HTMLSelectElement, SimpleSelectProps>(
  ({ className = "", options, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
          focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 
          disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

SimpleSelect.displayName = "SimpleSelect";
