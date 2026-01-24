import type { CacheType, ChatInputCommandInteraction } from "discord.js";

export type CommandObject = Readonly<
	Record<string, {
		perms: bigint
		bypassUserIds: string[]
		handler: (interaction: ChatInputCommandInteraction<CacheType>) => any
	}>
>

/**
 * Reasons as to why LoMMuS threw
 */
export const THROW_REASONS = Object.freeze({
	ABSTRACT_CLASS: 0,
	ABSTRACT_METHOD: 1,
});

/**
 * Asynchronous, non-blocking delay, with an optional callback
 *
 * @export
 */
export async function delay(ms: number, callback?: () => void) {
	return new Promise<void>(resolve => {
		if (callback) callback();
		setTimeout(resolve, ms);
	})
}
