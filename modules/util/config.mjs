import jsonConfig from '../../config.json' with { type: 'json' };

/**
 * The rest of the configuration data. This export is meant to enable easy patching without changing `config.json`.
 * This also provides much-needed TypeScript type hinting
 *
 * @constant
 */
export const config = {
	ownerId: jsonConfig.ownerId,
	clientId: jsonConfig.clientId,
	guildId: jsonConfig.guildId,
	github: jsonConfig.github,
	greeted: ('greeted' in jsonConfig) ? jsonConfig.greeted : false
};
