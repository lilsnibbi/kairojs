import type { FlagStrategyOptions } from "@types";
import { Option } from "@utilities/result/index.ts";
import { PrefixedStrategy } from "@utilities/lexure/index.ts";

/**
 * Claims nothing, so the parameter falls through to the ordered parameters untouched.
 */
const matchNothing = () => Option.none;

/**
 * Accepts every name the prefix matcher hands over.
 */
const allowAnyName = () => true;

/**
 * The flag and option matcher every command uses by default.
 *
 * It builds on the prefix-based matcher and adds an allow-list on top: a parameter only counts as a
 * flag or an option when the command actually declared that name. Anything else stays an ordered
 * parameter, so `!echo --help` still echoes `--help` unless `help` was declared as a flag.
 *
 * When a command declares no flags at all the matcher is replaced outright rather than left to
 * check an empty list, which keeps the common case free of work.
 *
 * @since 1.0.0
 */
export class FlagUnorderedStrategy extends PrefixedStrategy {
	/**
	 * The flag names this command accepts, or `true` when it accepts every name.
	 */
	public readonly flags: readonly string[] | true;

	/**
	 * The option names this command accepts, or `true` when it accepts every name.
	 */
	public readonly options: readonly string[] | true;

	/**
	 * @param strategyOptions Which names to accept, and how they are written.
	 */
	public constructor({
		flags,
		options,
		prefixes = ["--", "-", "—"],
		separators = ["=", ":"],
	}: FlagStrategyOptions = {}) {
		super(prefixes, separators);
		this.flags = flags || [];
		this.options = options || [];

		if (this.flags === true) this.allowedFlag = allowAnyName;
		else if (this.flags.length === 0) this.matchFlag = matchNothing;

		if (this.options === true) this.allowedOption = allowAnyName;
		else if (this.options.length === 0) this.matchOption = matchNothing;
	}

	/**
	 * Reads the parameter as a flag, but only accepts one this command declared.
	 *
	 * @param input The parameter's raw value.
	 * @returns The flag's name, if it matched a declared one.
	 */
	public override matchFlag(input: string): Option<string> {
		const result = super.matchFlag(input);

		// Only a declared flag counts; anything else stays an ordered parameter:
		if (result.isSomeAnd((name) => this.allowedFlag(name))) return result;

		return Option.none;
	}

	/**
	 * Reads the parameter as a key/value option, but only accepts one this command declared.
	 *
	 * @param input The parameter's raw value.
	 * @returns The option's key and value, if it matched a declared one.
	 */
	public override matchOption(
		input: string,
	): Option<readonly [key: string, value: string]> {
		const result = super.matchOption(input);

		// Only a declared option counts; anything else stays an ordered parameter:
		if (result.isSomeAnd(([key]) => this.allowedOption(key))) return result;

		return Option.none;
	}

	/**
	 * Whether the given name is one of the declared flags.
	 */
	private allowedFlag(name: string) {
		return (this.flags as readonly string[]).includes(name);
	}

	/**
	 * Whether the given name is one of the declared options.
	 */
	private allowedOption(name: string) {
		return (this.options as readonly string[]).includes(name);
	}
}
