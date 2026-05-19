import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { listActiveLoans } from "@/lib/db/loans";

export const dynamic = "force-dynamic";

export default async function Home() {
  const activeLoans = await listActiveLoans();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader label="Home bookshelf locator" title="Cozy Home Library" />

      <p className="max-w-2xl text-lg leading-8 text-muted-text">
        A fresh foundation for cataloging physical books by real shelf location.
        Database, scanning, metadata lookup, 2D maps, and 3D house browsing are
        prepared for later stages.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="cream" title="Catalog first">
          <p className="text-sm text-muted-text">
            Book-specific language and copy locations stay central.
          </p>
        </Card>
        <Card variant="blue" title="NAS ready">
          <p className="text-sm text-muted-text">
            Docker and PostgreSQL are set up and running.
          </p>
        </Card>
        <Card variant="pink" title="Blender ready">
          <p className="text-sm text-muted-text">
            Scene keys and house views are prepared for later stages.
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button href="/catalog" variant="primary">
          Browse catalog
        </Button>
        <Button href="/scan" variant="secondary">
          Scan a book
        </Button>
        <Button href="/settings" variant="outline">
          Settings
        </Button>
      </div>

      <Card variant="white" title="Active loans">
        {activeLoans.length === 0 ? (
          <p className="text-sm text-muted-text">No books are currently loaned out.</p>
        ) : (
          <div className="space-y-3">
            {activeLoans.slice(0, 5).map((loan) => (
              <div key={loan.id} className="rounded-2xl bg-parchment p-3 text-sm">
                <p className="font-semibold text-deep-brown">{loan.copy.book.title}</p>
                <p className="text-muted-text">Copy {loan.copy.copyLabel} with {loan.borrowerName} since {loan.dateLoaned.toLocaleDateString()}</p>
              </div>
            ))}
            <Button href="/loans" variant="outline" size="sm">View all loans</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
