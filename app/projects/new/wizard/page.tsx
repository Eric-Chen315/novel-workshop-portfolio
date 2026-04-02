import { Suspense } from 'react';
import WizardClient from './WizardClient';

export const metadata = { title: '新书生成向导 · 小说工作台' };

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <span className="text-sm text-gray-400 dark:text-gray-500">加载中…</span>
    </div>
  );
}

export default function WizardPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-6">
      <Suspense fallback={<Loading />}>
        <WizardClient />
      </Suspense>
    </main>
  );
}
