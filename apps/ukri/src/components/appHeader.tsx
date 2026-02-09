'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  backHref?: string;
  backLabel?: string;
}

export function AppHeader({ backHref, backLabel = 'Back' }: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center px-4">
        {backHref ? (
          <Button
            variant="ghost"
            size="sm"
            className="mr-4 gap-2"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        ) : (
          <div className="mr-4" />
        )}
        <Link href="/" className="ml-auto flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">FES Validator</span>
        </Link>
      </div>
    </header>
  );
}
