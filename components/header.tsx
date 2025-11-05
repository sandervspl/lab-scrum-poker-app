import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link
          href="/"
          className="hover:text-primary flex items-center gap-2 text-lg font-medium transition-colors"
        >
          <Image
            src="https://www.labdigital.nl/images/logo.svg"
            fetchPriority="high"
            alt="Lab Digital"
            width="103"
            height="24"
            className="h-6 dark:invert dark:filter"
          />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
