'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet } from 'lucide-react';
import { AppHeader } from '@/components/appHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getGrant, formatCurrency, formatNumber, DEMO_GRANT_ID, DEMO_FILE_NAME } from '@/lib/data';

export default function UploadConfirmationPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState(DEMO_FILE_NAME);

  useEffect(() => {
    const stored = sessionStorage.getItem('fesDemo');
    if (stored) {
      const data = JSON.parse(stored);
      setFileName(data.fileName || DEMO_FILE_NAME);
    }
  }, []);

  const grant = getGrant(DEMO_GRANT_ID);

  if (!grant) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader backHref="/" backLabel="Back" />

      <main className="container mx-auto max-w-2xl px-4 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            <span className="font-mono text-sm text-gray-700">{fileName}</span>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(grant.summary.totalTransactions)}
                </p>
                <p className="text-sm text-gray-500">transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(grant.totalSpent)}
                </p>
                <p className="text-sm text-gray-500">total value</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 space-y-2 text-gray-600">
            <p className="font-medium text-gray-900">
              Grant: {grant.reference} — {grant.title}
            </p>
            <p className="text-sm">
              Period: {new Date(grant.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} –{' '}
              {new Date(grant.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </p>
            <p className="text-sm">Funder: {grant.funder}</p>
          </div>

          <Button
            size="lg"
            onClick={() => router.push('/processing')}
            className="px-8"
          >
            Run Compliance Check →
          </Button>
        </div>
      </main>
    </div>
  );
}
