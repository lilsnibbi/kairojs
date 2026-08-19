/**
 * The symbols a {@link Plugin} attaches its hooks to.
 *
 * Symbols rather than plain names keep a plugin's hooks from colliding with anything else declared
 * on the class, and make the hooks unambiguous to look up.
 *
 * @since 1.0.0
 */

/**
 * Runs first, before the client has touched any of its own options.
 */
export const preGenericsInitialization: unique symbol = Symbol(
	"kairo:plugin.preGenericsInitialization",
);

/**
 * Runs once the logger exists but before the stores are registered.
 */
export const preInitialization: unique symbol = Symbol(
	"kairo:plugin.preInitialization",
);

/**
 * Runs once every built-in store is registered, at the end of the constructor.
 */
export const postInitialization: unique symbol = Symbol(
	"kairo:plugin.postInitialization",
);

/**
 * Runs after paths are registered but before any piece is loaded or the gateway is reached.
 */
export const preLogin: unique symbol = Symbol("kairo:plugin.preLogin");

/**
 * Runs once the client is connected to the gateway.
 */
export const postLogin: unique symbol = Symbol("kairo:plugin.postLogin");
