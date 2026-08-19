/**
 * Expands a dot-separated path into a nested object holding `value` at that path.
 *
 * @param path The dotted path, e.g. `"a.b.c"`.
 * @param value The value to place at `path`.
 * @param target The object to write into. Defaults to a fresh empty object.
 * @returns `target`, mutated to contain `value` at `path`.
 *
 * @since 1.0.0
 */
export function makeObject(
	path: string,
	value: unknown,
	target: Record<string, unknown> = {},
): Record<string, unknown> {
	if (path.includes(".")) {
		const segments = path.split(".");
		const lastSegment = segments.pop() as string;

		let reference = target;
		for (const segment of segments) {
			if (!reference[segment]) reference[segment] = {};
			reference = reference[segment] as Record<string, unknown>;
		}

		reference[lastSegment] = value;
	} else {
		target[path] = value;
	}

	return target;
}
