// biome-ignore-all lint/correctness/noUnusedPrivateClassMembers: #getTypedOption's overload signatures are not recognised as uses

import { ApplicationCommandOptionType } from "discord.js";
import type {
	APIApplicationCommandInteractionDataOption,
	APIAttachment,
	APIChatInputApplicationCommandInteraction,
	APIInteractionDataResolved,
	APIInteractionDataResolvedChannel,
	APIInteractionDataResolvedGuildMember,
	APIRole,
	APIUser,
} from "discord.js";
import type {
	BasicApplicationCommandOptionType,
	RequiredIf,
	TypeToOptionMap,
} from "@types";

/**
 * Resolves the options of a raw chat-input (slash command) interaction, hoisting past any
 * subcommand or subcommand group and exposing one typed accessor per Discord option type.
 *
 * Mirrors the ergonomics of discord.js's own interaction option resolver, but works directly
 * against the raw gateway/API payload instead of a hydrated `Interaction` instance.
 *
 * @since 1.0.0
 */
export class ChatInputInteractionOptionResolver {
	/**
	 * The options attached directly to the interaction, before hoisting.
	 */
	readonly #data: APIApplicationCommandInteractionDataOption[] | null;

	/**
	 * The resolved data (users, members, channels, roles, attachments) referenced by the options.
	 */
	readonly #resolved: APIInteractionDataResolved | null;

	/**
	 * The options a caller actually queries against — the options of the innermost subcommand when
	 * one was selected, otherwise {@link ChatInputInteractionOptionResolver.#data}.
	 */
	#hoistedOptions: APIApplicationCommandInteractionDataOption[] | null;

	/**
	 * The selected subcommand group's name, if any.
	 */
	#group: string | null = null;

	/**
	 * The selected subcommand's name, if any.
	 */
	#subcommand: string | null = null;

	/**
	 * @param interaction The raw chat-input interaction to resolve options from.
	 */
	public constructor(interaction: APIChatInputApplicationCommandInteraction) {
		this.#data =
			"options" in interaction.data ? (interaction.data.options ?? null) : null;
		this.#resolved =
			"resolved" in interaction.data
				? (interaction.data.resolved ?? null)
				: null;
		this.#hoistedOptions = this.#data;

		// Hoist past a subcommand group, if one was selected.
		if (
			this.#hoistedOptions?.[0]?.type ===
			ApplicationCommandOptionType.SubcommandGroup
		) {
			this.#group = this.#hoistedOptions[0].name;
			this.#hoistedOptions = this.#hoistedOptions[0].options ?? [];
		}

		// Hoist past a subcommand, if one was selected.
		if (
			this.#hoistedOptions?.[0]?.type ===
			ApplicationCommandOptionType.Subcommand
		) {
			this.#subcommand = this.#hoistedOptions[0].name;
			this.#hoistedOptions = this.#hoistedOptions[0].options ?? [];
		}
	}

	/**
	 * Returns a raw option by name, without narrowing its type.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public get<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<Required, APIApplicationCommandInteractionDataOption>;
	public get(
		name: string,
		required = false,
	): APIApplicationCommandInteractionDataOption | null {
		const option = this.#hoistedOptions?.find(
			(candidate) => candidate.name === name,
		);
		if (!option) {
			if (required) {
				throw new Error(`Missing required option "${name}"`);
			}

			return null;
		}

		return option;
	}

	/**
	 * Returns the selected subcommand's name.
	 *
	 * @param required Throws if no subcommand was selected. Defaults to `true`.
	 */
	public getSubcommand<Required extends boolean = false>(
		required?: Required,
	): RequiredIf<Required, string>;
	public getSubcommand(required = true): string | null {
		if (required && !this.#subcommand) {
			throw new Error("A subcommand was not selected");
		}

		return this.#subcommand;
	}

	/**
	 * Returns the selected subcommand group's name.
	 *
	 * @param required Throws if no subcommand group was selected. Defaults to `true`.
	 */
	public getSubcommandGroup<Required extends boolean = false>(
		required?: Required,
	): RequiredIf<Required, string>;
	public getSubcommandGroup(required = true): string | null {
		if (required && !this.#group) {
			throw new Error("A subcommand group was not selected");
		}

		return this.#group;
	}

	/**
	 * Returns a boolean option's value.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public getBoolean<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<Required, boolean>;
	public getBoolean(name: string, required = false): boolean | null {
		const option = this.#getTypedOption(
			name,
			ApplicationCommandOptionType.Boolean,
			required,
		);
		return option?.value ?? null;
	}

	/**
	 * Returns a channel option's resolved channel.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public getChannel<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<Required, APIInteractionDataResolvedChannel>;
	public getChannel(
		name: string,
		required = false,
	): APIInteractionDataResolvedChannel | null {
		const option = this.#getTypedOption(
			name,
			ApplicationCommandOptionType.Channel,
			required,
		);
		return option && this.#resolved && "channels" in this.#resolved
			? (this.#resolved.channels?.[option.value] ?? null)
			: null;
	}

	/**
	 * Returns a string option's value.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public getString<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<Required, string>;
	public getString(name: string, required = false): string | null {
		const option = this.#getTypedOption(
			name,
			ApplicationCommandOptionType.String,
			required,
		);
		return option?.value ?? null;
	}

	/**
	 * Returns an integer option's value.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public getInteger<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<Required, number>;
	public getInteger(name: string, required = false): number | null {
		const option = this.#getTypedOption(
			name,
			ApplicationCommandOptionType.Integer,
			required,
		);
		return (option?.value as number | null) ?? null;
	}

	/**
	 * Returns a number option's value.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public getNumber<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<Required, number>;
	public getNumber(name: string, required = false): number | null {
		const option = this.#getTypedOption(
			name,
			ApplicationCommandOptionType.Number,
			required,
		);
		return (option?.value as number | null) ?? null;
	}

	/**
	 * Returns a user option's resolved user.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public getUser<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<Required, APIUser>;
	public getUser(name: string, required = false): APIUser | null {
		const option = this.#getTypedOption(
			name,
			ApplicationCommandOptionType.User,
			required,
		);
		return option?.value ? this.#resolved!.users![option.value] : null;
	}

	/**
	 * Returns a user option's resolved guild member.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public getMember<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<Required, APIInteractionDataResolvedGuildMember>;
	public getMember(
		name: string,
		required = false,
	): APIInteractionDataResolvedGuildMember | null {
		const option = this.#getTypedOption(
			name,
			ApplicationCommandOptionType.User,
			required,
		);
		return option?.value ? this.#resolved!.members![option.value] : null;
	}

	/**
	 * Returns a role option's resolved role.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public getRole<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<Required, APIRole>;
	public getRole(name: string, required = false): APIRole | null {
		const option = this.#getTypedOption(
			name,
			ApplicationCommandOptionType.Role,
			required,
		);
		return option?.value ? this.#resolved!.roles![option.value] : null;
	}

	/**
	 * Returns an attachment option's resolved attachment.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public getAttachment<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<Required, APIAttachment>;
	public getAttachment(name: string, required = false): APIAttachment | null {
		const option = this.#getTypedOption(
			name,
			ApplicationCommandOptionType.Attachment,
			required,
		);
		return option?.value ? this.#resolved!.attachments![option.value] : null;
	}

	/**
	 * Returns a mentionable option's resolved user, member or role.
	 *
	 * @param name The option's name.
	 * @param required Throws if the option is missing. Defaults to `false`.
	 */
	public getMentionable<Required extends boolean = false>(
		name: string,
		required?: Required,
	): RequiredIf<
		Required,
		APIUser | APIInteractionDataResolvedGuildMember | APIRole
	>;
	public getMentionable(
		name: string,
		required = false,
	): APIUser | APIInteractionDataResolvedGuildMember | APIRole | null {
		const option = this.#getTypedOption(
			name,
			ApplicationCommandOptionType.Mentionable,
			required,
		);

		if (!option || !this.#resolved) {
			return null;
		}

		if (
			"members" in this.#resolved &&
			this.#resolved.members &&
			option.value in this.#resolved.members
		) {
			return this.#resolved.members[option.value] ?? null;
		}

		if (
			"users" in this.#resolved &&
			this.#resolved.users &&
			option.value in this.#resolved.users
		) {
			return this.#resolved.users[option.value] ?? null;
		}

		if (
			"roles" in this.#resolved &&
			this.#resolved.roles &&
			option.value in this.#resolved.roles
		) {
			return this.#resolved.roles[option.value] ?? null;
		}

		return null;
	}

	/**
	 * Looks up an option by name and asserts it carries the expected type.
	 */
	#getTypedOption<
		Option extends BasicApplicationCommandOptionType,
		Required extends boolean = false,
	>(
		name: string,
		type: Option,
		required: Required,
	): RequiredIf<Required, TypeToOptionMap[Option]>;
	#getTypedOption<Option extends BasicApplicationCommandOptionType>(
		name: string,
		type: Option,
		required: boolean,
	): TypeToOptionMap[Option] | null {
		const option = this.get(name, required);
		if (!option) {
			return null;
		} else if (option.type !== type) {
			throw new Error(`Option with name "${name}" is not of the correct type`);
		}

		return option as TypeToOptionMap[Option];
	}
}
