import config from '../../config.json' with { type: 'json' };
import type { ColorResolvable } from 'discord.js';

/**
 * Cache color configuration here + TS assertions
 *
 * @constant
 */
export const colors = {
	GREEN: (config.green) as ColorResolvable,
	BLUE: (config.blue) as ColorResolvable,
	YELLOW: (config.yellow) as ColorResolvable,
	ORANGE: (config.orange) as ColorResolvable,
	RED: (config.red) as ColorResolvable,
	GRAY: (config.gray) as ColorResolvable,
};
