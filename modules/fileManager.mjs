import { exec } from 'node:child_process';
import fs from 'node:fs';
import fsAsync from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { BotModule } from './util/module.mjs';

export default class FileManagerModule extends BotModule {
	/**
	 * Default path of where LoMMuS will write its temporary files
	 *
	 * @static
	 * @type {string}
	 */
	static tempFolderPathPrefix = path.join(os.tmpdir(), `${path.sep}lommus-`);

	/**
	 * Set of temporary files tracked
	 *
	 * @static
	 * @type {Set<string>}
	 */
	static tempFiles = new Set();

	/**
	 * The temp folder path
	 *
	 * @static
	 * @type {fs.PathLike}
	 */
	static tempFolderPath;

	/**
	 * Creates an instance of TempFile.
	 *
	 * @constructor
	 * @param {import('discord.js').Client} client
	 */
	constructor (client) {
		super(
			client,
			"File Manager",
			"Manages file operations, disk data streaming, and temporary directory management",
			[],
		);

		this.#cleanTempDirectory();
		this.#createTempDirectory();
	}

	/**
	 * Scary
	 *
	 * @param {string} [prefix=FileManagerModule.tempFolderPathPrefix]
	 */
	#cleanTempDirectory(prefix = FileManagerModule.tempFolderPathPrefix) {
		exec(`rm -r ${prefix}*`);
	}

	/**
	 * Creates a temporary directory
	 *
	 * @param {string} [prefix=FileManagerModule.tempFolderPathPrefix] The name of the directory
	 */
	#createTempDirectory(prefix = FileManagerModule.tempFolderPathPrefix) {
		fs.mkdtemp(prefix, (err, folder) => {
			if (err) throw new Error(`Error while creating temporary folder: ${err}`);
			FileManagerModule.tempFolderPath = folder;
		});
	}

	/**
	 * Streams chunked Base64-encoded data to a file
	 *
	 * @static
	 * @param {string} b64 The Base64-encoded data
	 * @param {string} outputPath The output path
	 * @param {number} [chunkSize=64 * 1024] The chunk size. Defaults to `64x1024`
	 */
	static async streamB64ToFile(b64, outputPath, chunkSize = 64 * 1024) {
		this.tempFiles.add(outputPath);

		return new Promise((resolve, reject) => {
			const stream = fs.createWriteStream(outputPath, { autoClose: true });

			stream.on('error', reject);
			stream.on('finish', resolve);

			/** The remaining data not covered by the chunk @type {string} */
			let remainder = "";

			for (let i = 0; i < b64.length; i += chunkSize) {
				/** The particular chunk this iteration */
				let chunk = remainder + b64.slice(i, i + chunkSize);

				// slice again
				const validLength = chunk.length - (chunk.length % 4);
				remainder = chunk.slice(validLength);
				chunk = chunk.slice(0, validLength);

				if (chunk.length > 0) stream.write(Buffer.from(chunk, 'base64'));
			}

			if (remainder.length > 0) {
				const pad = (4 - (remainder.length % 4)) % 4;
				if (pad) remainder += '='.repeat(pad);
				stream.write(Buffer.from(remainder, 'base64'));
			}

			this.cleanupFileEntry(outputPath);
		});
	}

	/**
	 * Cleans up the given file entry. Must exist on the `TempFile.tempFiles` set
	 *
	 * @static
	 * @param {string} filePath The path to clean up. Must correspond to `TempFile.tempFiles`
	 * @returns {Promise<boolean>} Is the operation successful or not?
	 */
	static async cleanupFileEntry(filePath) {
		if (!this.tempFiles.has(filePath)) {
			console.error("Path not in tempFiles set!");
			return false;
		}

		try {
			await fsAsync.unlink(filePath);
			this.tempFiles.delete(filePath);
			return true;
		} catch (error) {
			console.error("Path not in tempFiles set!", error);
			return false;
		}
	}
}
