import type { AbstractCtor } from "@types";

/**
 * Checks whether a constructor extends another constructor, walking up the prototype chain.
 *
 * This is the canonical way Kairo answers "is this class a subclass of that class" — the piece
 * loader relies on it to validate that a loaded module actually extends the expected piece base
 * class before registering it.
 *
 * @param value The constructor to check. Abstract constructors are accepted, since piece base
 * classes are abstract.
 * @param base The constructor `value` must extend.
 * @returns `true` if `value` is `base` itself or extends it, `false` otherwise.
 *
 * @since 1.0.0
 */
export function classExtends<T extends AbstractCtor>(
	value: AbstractCtor,
	base: T,
): value is T {
	let currentConstructor: AbstractCtor | null = value;

	while (currentConstructor !== null) {
		if (currentConstructor === base) return true;
		currentConstructor = Object.getPrototypeOf(currentConstructor);
	}

	return false;
}
