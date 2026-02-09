'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const MESSAGES = [
  'Parsing transaction data...',
  'Matching against UKRI eligibility rules...',
  'Checking staff cost evidence...',
  'Validating timesheet records...',
  'Flagging audit risks...',
  'Generating report...',
];

const TOTAL_DURATION = 6000;
const MESSAGE_INTERVAL = 1000;

export function ProcessingLoader() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, MESSAGE_INTERVAL);

    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / TOTAL_DURATION) * 100, 100);
      setProgress(newProgress);
    }, 50);

    const redirectTimer = setTimeout(() => {
      router.push('/dashboard');
    }, TOTAL_DURATION);

    return () => {
      clearInterval(messageTimer);
      clearInterval(progressTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">
        {MESSAGES[messageIndex]}
      </p>
      <div className="mt-8 w-64">
        <Progress value={progress} className="h-2" />
      </div>
      <p className="mt-2 text-sm text-gray-500">{Math.round(progress)}%</p>
    </div>
  );
}
