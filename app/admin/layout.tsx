import Link from "next/link";
import { Settings, Plane, Map, ArrowLeftRight, Table2, Home } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <Settings className="h-5 w-5" />
              Flyarr Admin
            </Link>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              Back to Search
            </Link>
            <div className="my-4 border-t" />
            <Link
              href="/admin/programs"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plane className="h-4 w-4" />
              Airline Programs
            </Link>
            <Link
              href="/admin/regions"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Map className="h-4 w-4" />
              Regions
            </Link>
            <Link
              href="/admin/charts"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Table2 className="h-4 w-4" />
              Award Charts
            </Link>
            <Link
              href="/admin/transfers"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Transfer Partners
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
