import { Suspense } from 'react';
import { AppHeader } from '@/components/appHeader';
import { IssueListContent } from './issueListContent';

export default function IssuesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader backHref="/dashboard" backLabel="Dashboard" />
      <Suspense fallback={<LoadingState />}>
        <IssueListContent />
      </Suspense>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 rounded bg-gray-200" />
        <div className="h-24 rounded-lg bg-gray-200" />
        <div className="h-24 rounded-lg bg-gray-200" />
        <div className="h-24 rounded-lg bg-gray-200" />
      </div>
    </main>
  );
}
