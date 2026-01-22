import { exec } from 'node:child_process';
import fs from 'node:fs';
import fsAsync from 'node:fs/promises';
import { BotModule } from './util/module.mjs';
import type { Client } from 'discord.js';

export default class FileManagerModule extends BotModule {
	/**
	 * Set of temporary files tracked
	 */
	static tempFiles: Set<string> = new Set();

	/**
	 * The temp directory path
	 *
	 * @static
	 */
	static tempDirPath: fs.PathLike = '/tmp/lommus';

	/**
	 * Creates an instance of TempFile.
	 *
	 * @constructor
	 */
	constructor(client: Client) {
		super(
			client,
			"File Manager",
			"Manages file operations, disk data streaming, and temporary directory management",
		);
	}

	/**
	 * Scary
	 *
	 * @param path
	 */
	#cleanTempDirectory(path: fs.PathLike = FileManagerModule.tempDirPath) {
		exec(`rm -r ${path}/*`);
	}

	/**
	 * Ensures Creates a temporary directory
	 *
	 * @param path The name of the directory
	 */
	#ensureTempDir(path: fs.PathLike = FileManagerModule.tempDirPath) {
		if (!fs.existsSync(path)) { fs.mkdirSync(path) }
	}

	/**
	 * Streams chunked Base64-encoded data to a file
	 *
	 * @static
	 * @param b64 The Base64-encoded data
	 * @param tmpOutputFile The output file path. Appended to `FileManagerModule.tempDirPath`
	 * @param chunkSize The chunk size. Defaults to `64 * 1024`
	 */
	static async streamB64ToFile(b64: string, tmpOutputFile: string, chunkSize = 64 * 1024) {
		const filePath = `${this.tempDirPath}/${tmpOutputFile}`;
		this.tempFiles.add(filePath);

		return new Promise((resolve, reject) => {
			const stream = fs.createWriteStream(filePath, { autoClose: true });

			stream.on('error', reject);
			stream.on('finish', resolve);

			/** The remaining data not covered by the chunk */
			let remainder: string = "";

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

			this.cleanupFileEntry(filePath);
		});
	}

	/**
	 * Cleans up the given file entry. Must exist on the `TempFile.tempFiles` set
	 *
	 * @static
	 * @param filePath The path to clean up. Must correspond to `TempFile.tempFiles`
	 * @returns Is the operation successful or not?
	 */
	static async cleanupFileEntry(filePath: string): Promise<boolean> {
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

	init() {
		this.#cleanTempDirectory();
		this.#ensureTempDir();
		return true;
	}
}
