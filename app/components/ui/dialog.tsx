"use client";

import React from "react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  // 当 open 改变时调用 onOpenChange
  React.useEffect(() => {
    if (onOpenChange) {
      onOpenChange(open);
    }
  }, [open, onOpenChange]);
  
  if (!open) return null;
  
  return <>{children}</>;
}

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function DialogTrigger({ children }: DialogTriggerProps) {
  return <>{children}</>;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function DialogContent({ children, className = "", onClose }: DialogContentProps) {
  const handleOverlayClick = (e: React.MouseEvent) => {
    // 点击遮罩层时关闭弹窗
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleOverlayClick}>
      {/* 半透明遮罩层 */}
      <div className="absolute inset-0 bg-black/50" />
      {/* 对话框内容 */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogHeader({ children, className = "" }: DialogHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className = "" }: DialogTitleProps) {
  return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogDescription({ children, className = "" }: DialogDescriptionProps) {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className = "" }: DialogFooterProps) {
  return <div className={`mt-6 flex justify-end gap-2 ${className}`}>{children}</div>;
}
