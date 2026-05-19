import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { AppError, toAppErrorShape } from "../errors";

export function createTRPCContext() {
  return {};
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const cause = error.cause;
    const appError = cause instanceof AppError ? toAppErrorShape(cause) : undefined;

    return {
      ...shape,
      data: {
        ...shape.data,
        appError,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export function toTRPCError(error: unknown): TRPCError {
  if (error instanceof AppError) {
    const code = error.code === "BAD_REQUEST" ? "BAD_REQUEST" : error.code === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR";
    return new TRPCError({ code, message: error.message, cause: error });
  }

  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected server error", cause: error });
}
