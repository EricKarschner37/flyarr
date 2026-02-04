import Link from "next/link";
import { SearchForm } from "@/components/search-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Flyarr
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the best award flight redemptions. Search for routes and discover
            which loyalty programs offer the best value for your points.
          </p>
          <Link
            href="/programs"
            className="text-sm text-primary hover:underline mt-4 inline-block"
          >
            Browse all award programs &rarr;
          </Link>
        </div>

        <div className="max-w-5xl mx-auto">
          <SearchForm />
        </div>
      </div>
    </main>
  );
}
