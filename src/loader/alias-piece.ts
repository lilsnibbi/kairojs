import type {
	AliasPieceJSON,
	AliasPieceOptions,
	PieceLoaderContext,
	StoreRegistryKey,
} from "@types";
import { Piece } from "./piece.ts";

/**
 * A {@link Piece} that can additionally be reached by one or more alternative names.
 *
 * Commands are the main user of this: `aliases: ["ping", "pong"]` makes both names resolve to the
 * same piece in an {@link AliasStore}.
 *
 * @since 1.0.0
 */
export class AliasPiece<
	Options extends AliasPieceOptions = AliasPieceOptions,
	StoreName extends StoreRegistryKey = StoreRegistryKey,
> extends Piece<Options, StoreName> {
	/**
	 * The alternative names this piece answers to.
	 */
	public aliases: readonly string[];

	/**
	 * @param context Supplied by the store: where the piece came from and who loaded it.
	 * @param options The piece's own options, including its aliases.
	 */
	public constructor(
		context: PieceLoaderContext<StoreName>,
		options: AliasPieceOptions = {},
	) {
		super(context, options);
		this.aliases = options.aliases ?? [];
	}

	/**
	 * Defines how this piece is serialised by `JSON.stringify`.
	 */
	public override toJSON(): AliasPieceJSON {
		return {
			...super.toJSON(),
			aliases: this.aliases.slice(),
		};
	}
}
