"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function safeId() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoAny = globalThis.crypto as any;
  if (cryptoAny?.randomUUID) return cryptoAny.randomUUID() as string;
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = safeId();
    setItems((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[60] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => {
          const base =
            "rounded-lg border px-3 py-2 text-sm shadow-lg backdrop-blur transition-colors";
          const cls =
            t.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/60 dark:text-emerald-200"
              : t.type === "error"
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-200"
                : "border-zinc-200 bg-white/90 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-200";
          return (
            <div key={t.id} className={`${base} ${cls}`}>
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}
