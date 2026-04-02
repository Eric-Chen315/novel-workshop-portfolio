'use client';

import React from 'react';

type TabsProps = {
  children: React.ReactNode;
  defaultValue?: string;
  className?: string;
};

type TabsListProps = {
  children: React.ReactNode;
  className?: string;
};

type TabsTriggerProps = {
  children: React.ReactNode;
  value: string;
  className?: string;
};

type TabsContentProps = {
  children: React.ReactNode;
  value: string;
  className?: string;
};

export const Tabs = ({ children, defaultValue, className = '' }: TabsProps) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <div className={`flex flex-col ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab } as any);
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = ({ children, className = '' }: TabsListProps) => {
  return (
    <div className={`flex border-b ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({
  children,
  value,
  className = '',
  activeTab,
  setActiveTab,
}: TabsTriggerProps & { activeTab?: string; setActiveTab?: (value: string) => void }) => {
  return (
    <button
      className={`px-4 py-2 font-medium ${activeTab === value ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'} ${className}`}
      onClick={() => setActiveTab?.(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({
  children,
  value,
  className = '',
  activeTab,
}: TabsContentProps & { activeTab?: string }) => {
  return activeTab === value ? (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  ) : null;
};
