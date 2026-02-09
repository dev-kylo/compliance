import { Shield } from 'lucide-react';
import { DropZone } from '@/components/dropZone';
import { FunderSelect } from '@/components/funderSelect';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">FES Validator</h1>
        </div>

        <p className="mb-10 max-w-md text-lg text-gray-600">
          Find the 5 rows that will fail your next UKRI audit
        </p>

        <DropZone />

        <div className="mt-8 flex items-center gap-3">
          <span className="text-sm text-gray-500">Funder:</span>
          <FunderSelect />
        </div>

        <div className="mt-12 border-t pt-6">
          <p className="text-sm text-gray-400">
            Trusted by research finance teams at 12 UK universities
          </p>
        </div>
      </div>
    </main>
  );
}
