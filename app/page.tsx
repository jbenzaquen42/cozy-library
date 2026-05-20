import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LivingRoomBookshelfBrowser } from "@/components/house/LivingRoomBookshelfBrowser";
import { getHouseBrowserData } from "@/lib/db/houseBrowser";
import { listActiveLoans } from "@/lib/db/loans";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
type ActiveLoan = Awaited<ReturnType<typeof listActiveLoans>>[number];

export default async function Home() {
  const [levels, activeLoans] = await Promise.all([getHouseBrowserData(), listActiveLoans()]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader label="Home bookshelf locator" title="Cozy Home Library" />

      <LivingRoomBookshelfBrowser levels={levels} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card variant="cream" title="Catalog">
          <p className="text-sm text-muted-text">
            Search and edit book records outside the room view.
          </p>
        </Card>
        <Card variant="blue" title="Scan">
          <p className="text-sm text-muted-text">
            Add physical copies by barcode or OCR, then place them on shelves.
          </p>
        </Card>
        <Card variant="pink" title="Locations">
          <p className="text-sm text-muted-text">
            Keep room and shelf records aligned with the real house.
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button href="/catalog" variant="primary">
          Browse catalog
        </Button>
        <Button href="/scan" variant="secondary">
          Add scanned book
        </Button>
        <Button href="/house/3d" variant="outline">
          Open room view
        </Button>
        <Button href="/settings" variant="outline">
          Status
        </Button>
      </div>

      <Card variant="white" title="Active loans">
        {activeLoans.length === 0 ? (
          <EmptyState title="No active loans" message="Loan a copy from a book detail page." action={{ label: "View loans", href: "/loans" }} />
        ) : (
          <div className="space-y-3">
            {activeLoans.slice(0, 5).map((loan: ActiveLoan) => (
              <div key={loan.id} className="rounded-2xl bg-parchment p-3 text-sm">
                <p className="font-semibold text-deep-brown">{loan.copy.book.title}</p>
                <p className="text-muted-text">Copy {loan.copy.copyLabel} with {loan.borrowerName} since {formatDate(loan.dateLoaned)}</p>
              </div>
            ))}
            <Button href="/loans" variant="outline" size="sm">View all loans</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
