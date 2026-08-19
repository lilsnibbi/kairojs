/**
 * Thrown by `Result#expect`, `Result#unwrap`, `Result#expectErr` and `Result#unwrapErr` when the
 * result is not in the state the caller demanded, e.g. `unwrap()` on an `Err`.
 *
 * The value that made the result the "wrong" variant is preserved on {@link ResultError.value} so
 * the original error (or success value) is not lost when it is re-thrown.
 *
 * @typeparam E The type of the preserved value.
 *
 * @since 1.0.0
 */
export class ResultError<E> extends Error {
	/**
	 * The value carried by the `Result` at the moment the unwrap failed — the `Err` value for
	 * `expect`/`unwrap`, or the `Ok` value for `expectErr`/`unwrapErr`.
	 */
	public readonly value: E;

	/**
	 * @param message The error message.
	 * @param value The value carried by the result that failed to unwrap.
	 */
	public constructor(message: string, value: E) {
		super(message);
		this.value = value;
	}

	public override get name(): string {
		return this.constructor.name;
	}
}

/**
 * Thrown by `Option#expect` and `Option#unwrap` when called on a `None`.
 *
 * @since 1.0.0
 */
export class OptionError extends Error {
	public override get name(): string {
		return this.constructor.name;
	}
}
