/**
 * Raised when the environment is missing or malformed.
 *
 * Lives in its own module so a caller can catch it *by type* without importing
 * `env.ts` — importing that is what throws in the first place.
 */
export class EnvError extends Error {
  constructor(
    /** Names of the variables at fault. Names only; never values. */
    readonly missing: string[],
    message: string,
  ) {
    super(message);
    this.name = "EnvError";
  }
}
