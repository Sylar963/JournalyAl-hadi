type ErrorWithMessage = {
  message: unknown;
};

type ErrorWithCode = {
  code: string;
};

export function hasErrorMessage(error: unknown): error is ErrorWithMessage {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export function hasErrorCode(error: unknown): error is ErrorWithCode {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as ErrorWithCode).code === 'string';
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (hasErrorMessage(error)) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}
