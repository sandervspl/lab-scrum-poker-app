import Link from 'next/link';
import { Home } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="container flex h-14 items-center px-4">
        <Link
          href="/"
          className="hover:text-primary flex items-center gap-2 text-lg font-semibold transition-colors"
        >
          <Home className="h-5 w-5" />
          <span>Scrum Poker</span>
        </Link>
      </div>
    </header>
  );
}
