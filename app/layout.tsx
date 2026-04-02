import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from './providers';

export const metadata: Metadata = {
  title: 'AI Novel Workstation Portfolio',
  description: 'Production-grade AI writing workstation portfolio showcase.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
