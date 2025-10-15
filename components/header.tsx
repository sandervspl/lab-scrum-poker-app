import Link from "next/link"
import { Home } from "lucide-react"

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg hover:text-primary transition-colors">
          <Home className="h-5 w-5" />
          <span>Scrum Poker</span>
        </Link>
      </div>
    </header>
  )
}
