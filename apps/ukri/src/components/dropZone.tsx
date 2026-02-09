'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_FILE_NAME, DEMO_GRANT_ID } from '@/lib/data';

export function DropZone() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = useCallback(() => {
    sessionStorage.setItem(
      'fesDemo',
      JSON.stringify({ fileName: DEMO_FILE_NAME, grantId: DEMO_GRANT_ID })
    );
    router.push('/upload-confirmation');
  }, [router]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleUpload();
    },
    [handleUpload]
  );

  return (
    <div
      onClick={handleUpload}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative w-full max-w-lg cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'rounded-full p-4 transition-colors',
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          )}
        >
          {isDragging ? (
            <FileSpreadsheet className="h-8 w-8 text-blue-600" />
          ) : (
            <Upload className="h-8 w-8 text-gray-500" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-700">
            Drag & drop your transaction export
          </p>
          <p className="mt-1 text-sm text-gray-500">or click to browse files</p>
        </div>
        <p className="text-xs text-gray-400">.xlsx, .csv up to 50MB</p>
      </div>
    </div>
  );
}
