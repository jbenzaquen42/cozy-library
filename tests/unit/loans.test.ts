import { beforeAll, describe, expect, it } from "vitest";
import { createManualBook } from "../../lib/db/books";
import { loanCopy, returnLoan } from "../../lib/db/loans";
import { prisma } from "../../lib/db/prisma";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("loan state transitions", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.loan.deleteMany({ where: { copy: { book: { title: { startsWith: "Loan Test" } } } } });
    await prisma.copy.deleteMany({ where: { book: { title: { startsWith: "Loan Test" } } } });
    await prisma.book.deleteMany({ where: { title: { startsWith: "Loan Test" } } });
  });

  async function createLoanableCopy() {
    const slot = await prisma.shelfSlot.findFirstOrThrow();
    const book = await createManualBook({
      title: `Loan Test ${crypto.randomUUID()}`,
      subtitle: undefined,
      displayAuthor: "Loan Tester",
      isbn10: undefined,
      isbn13: undefined,
      publisher: undefined,
      publishedDate: undefined,
      pageCount: undefined,
      language: undefined,
      description: undefined,
      seriesName: undefined,
      seriesNumber: undefined,
      locationSlotId: slot.id,
      condition: undefined,
      notes: undefined,
    });
    return book.copies[0]!;
  }

  it("loans and returns a copy", async () => {
    const copy = await createLoanableCopy();

    const loan = await loanCopy({ copyId: copy.id, borrowerName: "Sam Reader", notes: "Porch pickup" });
    expect(loan.borrowerName).toBe("Sam Reader");
    await expect(prisma.copy.findUniqueOrThrow({ where: { id: copy.id } })).resolves.toMatchObject({ status: "LOANED" });

    const returned = await returnLoan(loan.id);
    expect(returned.dateReturned).toBeTruthy();
    await expect(prisma.copy.findUniqueOrThrow({ where: { id: copy.id } })).resolves.toMatchObject({ status: "AVAILABLE" });
  });

  it("prevents duplicate active loans for one copy", async () => {
    const copy = await createLoanableCopy();
    await loanCopy({ copyId: copy.id, borrowerName: "First Borrower", notes: undefined });

    await expect(loanCopy({ copyId: copy.id, borrowerName: "Second Borrower", notes: undefined })).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
