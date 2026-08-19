/**
 * A single, identity-stable error used across the `Result` and `Option` suites so assertions can
 * compare by reference rather than by message.
 */
export const error = new Error("thrown");

/**
 * Always throws {@link error}. Handed to `from`/`fromAsync` to exercise the "callback threw"
 * branch.
 */
export function makeThrow(): never {
	throw error;
}
