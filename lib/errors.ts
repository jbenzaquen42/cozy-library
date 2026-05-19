export type AppErrorCode = "BAD_REQUEST" | "NOT_FOUND" | "CONFLICT" | "INTERNAL" | "NOT_IMPLEMENTED";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly field?: string;

  constructor(code: AppErrorCode, message: string, field?: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.field = field;
  }
}

export type AppErrorShape = {
  code: AppErrorCode;
  message: string;
  field?: string;
};

export function toAppErrorShape(error: unknown): AppErrorShape {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message, field: error.field };
  }

  if (error instanceof Error) {
    return { code: "INTERNAL", message: error.message };
  }

  return { code: "INTERNAL", message: "Unknown application error" };
}
