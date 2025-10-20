import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Home } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link
          href="/"
          className="hover:text-primary flex items-center gap-2 text-lg font-semibold transition-colors"
        >
          🃏
          <span>Scrum Poker</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
