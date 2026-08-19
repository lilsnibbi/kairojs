import type {
	CommandDifference,
	OptionRequiredDifferenceOptions,
} from "@types";

/**
 * Compares whether an option has to be filled in.
 *
 * Discord omits the flag when an option is optional, so an absent value is read as `false` on both
 * sides before they are compared.
 *
 * @param options The flags to compare and the path to report them under.
 * @yields One difference when the flags do not match, nothing otherwise.
 *
 * @since 1.0.0
 */
export function* checkOptionRequired({
	oldRequired,
	newRequired,
	key,
}: OptionRequiredDifferenceOptions): Generator<CommandDifference> {
	if ((oldRequired ?? false) !== (newRequired ?? false)) {
		yield {
			key,
			original: String(oldRequired ?? false),
			expected: String(newRequired ?? false),
		};
	}
}
