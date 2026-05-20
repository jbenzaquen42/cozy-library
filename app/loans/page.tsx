import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashBanner } from "@/components/ui/flash-banner";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { listLoans } from "@/lib/db/loans";
import { formatDate } from "@/lib/utils";
import { returnLoanAction } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; saved?: string }>;
type Loan = Awaited<ReturnType<typeof listLoans>>[number];

export default async function LoansPage({ searchParams }: { searchParams: SearchParams }) {
  const [, activeLoans, allLoans] = await Promise.all([
    searchParams,
    listLoans({ activeOnly: true }),
    listLoans(),
  ]);
  const history = allLoans.filter((loan: Loan) => loan.dateReturned);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader label="Library" title="Loans" />
      <FlashBanner successMessage="Loan updated." />

      <Card variant="cream" title="Active loans">
        {activeLoans.length === 0 ? (
          <EmptyState title="No active loans" message="Loan a copy from a book detail page." />
        ) : (
          <div className="mt-4 space-y-4">
            {activeLoans.map((loan: Loan) => <LoanRow key={loan.id} loan={loan} active />)}
          </div>
        )}
      </Card>

      <Card variant="white" title="Loan history">
        {history.length === 0 ? (
          <EmptyState title="No loan history" message="Returned loans will appear here." />
        ) : (
          <div className="mt-4 space-y-4">
            {history.map((loan: Loan) => <LoanRow key={loan.id} loan={loan} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

function LoanRow({ loan, active = false }: { loan: Loan; active?: boolean }) {
  return (
    <div className="rounded-2xl border border-warm-border bg-cream/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href={`/books/${loan.copy.book.id}`} className="font-heading text-xl font-semibold text-deep-brown underline-offset-4 hover:underline">
            {loan.copy.book.title}
          </Link>
          <p className="text-sm text-muted-text">Copy {loan.copy.copyLabel} loaned to {loan.borrowerName}</p>
          <p className="text-sm text-soft-brown">Loaned {formatDate(loan.dateLoaned)}</p>
          {loan.dateReturned ? <p className="text-sm text-soft-brown">Returned {formatDate(loan.dateReturned)}</p> : null}
          {loan.notes ? <p className="mt-2 text-sm text-muted-text">{loan.notes}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={active ? "pink" : "sage"}>{active ? "Active" : "Returned"}</Badge>
          {active ? (
            <form action={returnLoanAction}>
              <input type="hidden" name="loanId" value={loan.id} />
              <input type="hidden" name="bookId" value={loan.copy.book.id} />
              <input type="hidden" name="returnTo" value="/loans" />
              <SubmitButton size="sm" pendingLabel="Returning…" confirmMessage="Mark this loan as returned?">Return</SubmitButton>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
