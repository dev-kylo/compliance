import { AppHeader } from '@/components/appHeader';
import { ProcessingLoader } from '@/components/processingLoader';

export default function ProcessingPage() {
  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <main className="container mx-auto px-4">
        <ProcessingLoader />
      </main>
    </div>
  );
}
