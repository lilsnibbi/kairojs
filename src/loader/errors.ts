import type { LoaderErrorType } from "@types";

/**
 * The kinds of failure the piece loader can report, used to tell one {@link LoaderError} from
 * another without matching on message text.
 *
 * @since 1.0.0
 */
export const LoaderErrorTypes = Object.freeze({
	/**
	 * A module was loaded but exported nothing the store could use.
	 */
	EmptyModule: "EMPTY_MODULE",

	/**
	 * An operation that needs a file on disk was attempted on a manually registered piece.
	 */
	VirtualPiece: "VIRTUAL_PIECE",

	/**
	 * A piece was looked up in a store that does not hold it.
	 */
	UnloadedPiece: "UNLOADED_PIECE",

	/**
	 * A value was not an instance of, or did not extend, the store's piece constructor.
	 */
	IncorrectType: "INCORRECT_TYPE",

	/**
	 * A store was referenced by a name that is not registered.
	 */
	UnknownStore: "UNKNOWN_STORE",
} as const);

/**
 * An error raised by the piece loader, tagged with a {@link LoaderErrorType} so callers can branch
 * on the kind of failure.
 *
 * @since 1.0.0
 */
export class LoaderError extends Error {
	/**
	 * Which kind of loader failure this is.
	 */
	public readonly type: LoaderErrorType;

	/**
	 * @param type Which kind of loader failure this is.
	 * @param message A human-readable description of what went wrong.
	 */
	public constructor(type: LoaderErrorType, message: string) {
		super(message);
		this.type = type;
	}

	public override get name() {
		return `${super.name} [${this.type}]`;
	}
}

/**
 * Raised when a module was loaded successfully but exported no class the store could accept.
 *
 * Carries the offending path so the file can be found without reading the message.
 *
 * @since 1.0.0
 */
export class MissingExportsError extends LoaderError {
	/**
	 * The path of the module that exported nothing usable.
	 */
	public readonly path: string;

	/**
	 * @param path The path of the module that exported nothing usable.
	 */
	public constructor(path: string) {
		super(
			LoaderErrorTypes.EmptyModule,
			`A compatible class export was not found. [${path}]`,
		);
		this.path = path;
	}
}
