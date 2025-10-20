require('dotenv').config();
const { EmbedBuilder, Events } = require('discord.js');
const { green, red, github } = require('../config.json');
const fetch = require('node-fetch');

module.exports = {
    name: 'Github Issue Parser',
    description: 'Parses #discriminators and links respective issue/pull requests',
    listeners: ['messageCreate'],

    async execute(client) {

        client.on(Events.MessageCreate, async message => {
            if (message.author.bot) return;

            // Only process messages containing a #
            if (!message.content.includes('#')) return;

            // Remove code blocks and inline code
            const noBlockCode = message.content.replace(/```[\s\S]*?```/g, '');
            const noInlineCode = noBlockCode.replace(/`[^`]*`/g, '');

            // Match patterns:
            // 1. #123
            // 2. repo#123
            // 3. org/repo#123
            const regex = /(?:(?<org>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)|(?<repoOnly>[A-Za-z0-9_.-]+))?#(?<issue>\d{3,5})(?!\d)/g;

            const matches = [...noInlineCode.matchAll(regex)];

            if (!matches.length) return;

            const output = [];
            const seen = new Set();

            for (const m of matches) {
                const org = m.groups.org || github.allowedOrgs[0];
                const repo = m.groups.repo || m.groups.repoOnly || github.defaultRepo;
                const issue = parseInt(m.groups.issue);

                if (!github.allowedOrgs.includes(org)) continue;

                const key = `${org}/${repo}#${issue}`;
                if (seen.has(key)) continue;
                seen.add(key);

                const url = `https://api.github.com/repos/${org}/${repo}/issues/${issue}`;

                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/vnd.github.v3+json',
                            'Authorization': `token ${process.env.PATOKEN}`,
                        },
                    });

                    const data = await response.json();

                    if (response.status === 200 || response.status === 304) {
                        if (data.user?.login) {
                            let status;

                            if (!data.pull_request && data.state === 'open') {
                                status = client.emojis.cache.find(e => e.name === 'issue_opened');
                            } else if (!data.pull_request && data.state_reason === 'completed') {
                                status = client.emojis.cache.find(e => e.name === 'issue_closed');
                            } else if (!data.pull_request && data.state_reason === 'not_planned') {
                                status = client.emojis.cache.find(e => e.name === 'issue_not_planned');
                            } else if (data.pull_request?.url && data.draft) {
                                status = client.emojis.cache.find(e => e.name === 'pr_draft');
                            } else if (data.pull_request?.url && data.state === 'open') {
                                status = client.emojis.cache.find(e => e.name === 'pr_opened');
                            } else if (data.pull_request?.url && data.pull_request?.merged_at) {
                                status = client.emojis.cache.find(e => e.name === 'pr_merged');
                            } else if (data.pull_request?.url && data.state === 'closed') {
                                status = client.emojis.cache.find(e => e.name === 'pr_closed');
                            } else {
                                status = client.emojis.cache.find(e => e.name === 'spoopy');
                            }

                            output.push(
                                `[${status ?? ''} [${org}/${repo}] #${issue}, @${data.user.login}: ${data.title}](${data.html_url})`
                            );
                        }
                    } else if (response.status === 422 || response.status === 403) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor(red)
                            .setDescription('Slow down. The GitHub API is displeased.');
                        return await message.channel.send({ embeds: [errorEmbed] });
                    }
                } catch (err) {
                    console.error(err);
                }

                if (output.length > 9) break;
            }

            if (output.length) {
                const parseEmbed = new EmbedBuilder()
                    .setColor(green)
                    .setDescription(output.join('\n'));
                await message.channel.send({ embeds: [parseEmbed] });
            }
        });
    },
};
