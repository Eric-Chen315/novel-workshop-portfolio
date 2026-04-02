'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    let timer: number | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        timer = window.setTimeout(() => {
          setVisible(true);
        }, delayMs);

        observer.unobserve(entry.target);
      },
      { threshold: 0.2 }
    );

    observer.observe(target);
    return () => {
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [delayMs]);

  return (
    <div ref={ref} className={`reveal ${visible ? 'reveal-visible' : ''} ${className ?? ''}`}>
      {children}
    </div>
  );
}
