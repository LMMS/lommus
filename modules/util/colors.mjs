import config from '../../config.json' with { type: 'json' };

/**
 * Cache color configuration here + TS assertions
 *
 * @constant
 */
export const colors = {
	GREEN: /** @type {`#${string}`} */ (config.green),
	BLUE: /** @type {`#${string}`} */ (config.blue),
	YELLOW: /** @type {`#${string}`} */ (config.yellow),
	ORANGE: /** @type {`#${string}`} */ (config.orange),
	RED: /** @type {`#${string}`} */ (config.red),
	GRAY: /** @type {`#${string}`} */ (config.gray),
};
