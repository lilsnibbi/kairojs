/**
 * The sentinel path assigned to pieces that were registered by hand rather than discovered on disk.
 *
 * A piece carrying this path has no file backing it, so it can never be reloaded from disk.
 *
 * @since 1.0.0
 */
export const VirtualPath = "::virtual::";

/**
 * The key under which a store keeps its queue of manually registered pieces.
 *
 * @internal
 * @since 1.0.0
 */
export const ManuallyRegisteredPieces = Symbol(
	"kairo:loader.manuallyRegisteredPieces",
);
