import { Octokit } from '@octokit/core';

const octokit = new Octokit({
	auth: process.env.PATOKEN,
	userAgent: 'LoMMuS/main'
});

type GitHubFileResult = {
	path: string
	name: string
	link: string
	size: number
	sha: string
	contents: string
}

/**
 * Fetches and parses a given file from a GitHub repository
 *
 * @export
 * @param org The organization identifier
 * @param repo The repo identifier
 * @param filePath The path of the file
 */
export async function getGitHubFile(org: string, repo: string, filePath: string): Promise<number | GitHubFileResult> {
	const request = await octokit.request(`GET /repos/{owner}/{repo}/contents/{path}`, {
		mediaType: {
			format: 'json'
		},
		owner: org,
		repo: repo,
		path: filePath,
	}).catch((reject) => { return { status: reject.status } });

	if (request.status !== 200) return request.status;

	return {
		// @ts-ignore
		name: request.data.name,
		// @ts-ignore
		path: request.data.path,
		// @ts-ignore
		link: request.data.html_url,
		// @ts-ignore
		size: request.data.size,
		// @ts-ignore
		sha: request.data.sha,
		// @ts-ignore
		contents: Buffer.from(request.data.content, 'base64').toString().substring(0, 128),
	}
}
