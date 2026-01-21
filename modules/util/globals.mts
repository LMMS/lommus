import type { CacheType, ChatInputCommandInteraction } from "discord.js";

/**
 * Reasons as to why LoMMuS threw
 */
export const THROW_REASONS = Object.freeze({
	ABSTRACT_CLASS: 0,
	ABSTRACT_METHOD: 1,
});

export type CommandObject = Readonly<
	Record<string, {
		perms: bigint
		bypassUserIds: string[]
		handler: (interaction: ChatInputCommandInteraction<CacheType>) => any
	}>
>
