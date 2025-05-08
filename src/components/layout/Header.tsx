import Link from "next/link";
import { Logo } from "./Logo";
import { UserNav } from "./UserNav";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { CheckBadgeIcon } from "@heroicons/react/24/outline"; // Example icon, replace if needed or use Lucide
import { FileSearch, UploadCloud } from "lucide-react";


export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          <Button variant="ghost" asChild>
            <Link href={ROUTES.HOME}>Home</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={ROUTES.REGISTER_DOCUMENT}>
              <UploadCloud className="mr-2 h-4 w-4" /> Register Document
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={ROUTES.VERIFY_DOCUMENT}>
              <FileSearch className="mr-2 h-4 w-4" /> Verify Document
            </Link>
          </Button>
        </nav>
        <UserNav />
      </div>
    </header>
  );
}
