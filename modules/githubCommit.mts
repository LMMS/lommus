import { Client, EmbedBuilder, Events } from 'discord.js'
import { BotModule } from './util/module.mjs'

type GitHubAPIResponse = {
	html_url: string
	stats: {
		additions: number
		deletions: number
	}
	commit: {
		message: string
		committer: {
			name: string
			date: string
		}
	}
	files: {
		filename: string
		status: string
	}[]
}

export default class extends BotModule {
	/**
	 * Parses GitHub commit links
	 */
	constructor(client: Client) {
		super(
			client,
			'GitHub Commit Preview',
			'Parses `/commit/` URLs and previews it'
		)
	}

	init() {
		this.client.on(Events.MessageCreate, async (message) => {
			// Only process valid messages
			if (message.author.bot || !message.content.includes('/commit/')) return

			const commitHashes: string[] = []

			const regex = /(?<=github\.com\/)(?:(?<org>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)\/commit\/(?<hash>[A-Za-z0-9]+))/g

			const matches = [ ...message.content.matchAll(regex) ]

			const output: string[] = []
			const seen = new Set()

			for (const match of matches) {
				if (!match.groups) return

				const org = match.groups.org
				const repo = match.groups.repo
				const hash = match.groups.hash

				const key = `${org}/${repo}/commit/${hash}`
				if (seen.has(key)) continue
				seen.add(key)

				await fetch(`https://api.github.com/repos/${org}/${repo}/commits/${hash}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'Authorization': `token ${process.env.PATOKEN}`,
					}
				}).then(async (response) => {
					if (response.status === 422 || response.status === 403) {
						return await message.channel.send({
							embeds: [ new EmbedBuilder()
								.setColor(this.colors.RED)
								.setDescription('Slow down. The GitHub API is displeased.') ]
						})
					}

					if (response.status !== 200 && response.status !== 304) return

					const data = await response.json() as GitHubAPIResponse

					output.push(`[${data.commit.committer.date} - [${data.commit.committer.name}] ${data.commit.message} (+${data.stats.additions}, -${data.stats.deletions})](${data.html_url})`)

					return
				})
			}

			if (output.length) return await message.channel.send({
				embeds: [
					new EmbedBuilder()
						.setColor(this.colors.GREEN)
						.setDescription(output.join('\n'))
				]
			})

			return
		})
	}
}
