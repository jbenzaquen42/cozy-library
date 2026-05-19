import type { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";
import type { LoanInput } from "../validation/book";
import { prisma as defaultPrisma } from "./prisma";

export function getLoanInclude() {
  return {
    copy: {
      include: {
        book: true,
        locationSlot: { include: { bookshelf: { include: { room: { include: { level: true } } } } } },
      },
    },
  };
}

export async function listLoans(input: { activeOnly?: boolean } = {}, db: PrismaClient = defaultPrisma) {
  return db.loan.findMany({
    where: input.activeOnly ? { dateReturned: null } : undefined,
    orderBy: [{ dateReturned: "asc" }, { dateLoaned: "desc" }],
    include: getLoanInclude(),
  });
}

export async function listActiveLoans(db: PrismaClient = defaultPrisma) {
  return listLoans({ activeOnly: true }, db);
}

export async function loanCopy(input: LoanInput, db: PrismaClient = defaultPrisma) {
  return db.$transaction(async (tx) => {
    const copy = await tx.copy.findUnique({ where: { id: input.copyId } });
    if (!copy) throw new AppError("NOT_FOUND", "Copy not found", "copyId");
    if (copy.status === "LOANED") throw new AppError("CONFLICT", "This copy is already loaned.");

    const activeLoan = await tx.loan.findFirst({ where: { copyId: input.copyId, dateReturned: null } });
    if (activeLoan) throw new AppError("CONFLICT", "This copy already has an active loan.");

    const loan = await tx.loan.create({
      data: {
        copyId: input.copyId,
        borrowerName: input.borrowerName,
        dateLoaned: input.dateLoaned ?? new Date(),
        notes: input.notes ?? null,
      },
    });
    await tx.copy.update({ where: { id: input.copyId }, data: { status: "LOANED" } });
    return tx.loan.findUniqueOrThrow({ where: { id: loan.id }, include: getLoanInclude() });
  });
}

export async function returnLoan(loanId: string, db: PrismaClient = defaultPrisma) {
  return db.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({ where: { id: loanId }, include: { copy: true } });
    if (!loan) throw new AppError("NOT_FOUND", "Loan not found", "loanId");
    if (loan.dateReturned) throw new AppError("CONFLICT", "This loan has already been returned.");

    await tx.loan.update({ where: { id: loanId }, data: { dateReturned: new Date() } });
    await tx.copy.update({ where: { id: loan.copyId }, data: { status: "AVAILABLE" } });
    return tx.loan.findUniqueOrThrow({ where: { id: loanId }, include: getLoanInclude() });
  });
}
