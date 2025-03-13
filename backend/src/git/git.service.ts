import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commit } from './entities/commit.entity';
import { spawn } from 'child_process';
import { McpService } from '../mcp/mcp.service';
import { Between } from 'typeorm';

@Injectable()
export class GitService {
    constructor(
        @InjectRepository(Commit)
        private commitRepository: Repository<Commit>,
        private mcpService: McpService,
    ) { }

    async syncCommits(repoPath: string): Promise<Commit[]> {
        const commits = await this.getGitLog(repoPath);

        // Fetch diff for each commit
        for (const commit of commits) {
            commit.diff = await this.getCommitDiff(repoPath, commit.hash);
        }

        return this.commitRepository.save(commits);
    }

    private getGitLog(repoPath: string): Promise<Commit[]> {
        return new Promise((resolve, reject) => {
            const gitProcess = spawn('git', [
                '-C',
                repoPath,
                'log',
                '--pretty=format:%H%n%an%n%at%n%s%n%b%n---',
                '-n',
                '10'
            ]);

            let output = '';
            gitProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            gitProcess.stderr.on('data', (data) => {
                console.error('Git error:', data.toString());
            });

            gitProcess.on('close', (code) => {
                if (code === 0) {
                    const commits = output
                        .split('---\n')
                        .filter(Boolean)
                        .map(commitStr => {
                            const [hash, author, timestamp, subject, ...bodyLines] = commitStr.split('\n');
                            const commit = new Commit();
                            commit.hash = hash;
                            commit.author = author;
                            commit.date = new Date(parseInt(timestamp) * 1000);
                            commit.message = subject;
                            commit.summary = bodyLines.join('\n').trim();
                            return commit;
                        });
                    resolve(commits);
                } else {
                    reject(new Error('Git process failed'));
                }
            });

            gitProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    private getCommitDiff(repoPath: string, commitHash: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const gitProcess = spawn('git', [
                '-C',
                repoPath,
                'show',
                '--pretty=format:""',
                commitHash
            ]);

            let output = '';
            gitProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            gitProcess.stderr.on('data', (data) => {
                console.error('Git error:', data.toString());
            });

            gitProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                } else {
                    reject(new Error('Failed to get commit diff'));
                }
            });

            gitProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    async getRepoStatus(repoPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const gitProcess = spawn('git', [
                '-C',
                repoPath,
                'status',
            ]);

            let output = '';
            gitProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            gitProcess.stderr.on('data', (data) => {
                console.error('Git error:', data.toString());
            });

            gitProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                } else {
                    reject(new Error('Failed to get repo status'));
                }
            });

            gitProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    async getUserRepositories(token: string): Promise<string[]> {
        try {
            const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&direction=desc', {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.map(repo => repo.full_name);
        } catch (error) {
            console.error('Error fetching repositories:', error);
            throw new Error('Failed to fetch GitHub repositories');
        }
    }

    async getGithubCommits(token: string, repoFullName: string): Promise<Commit[]> {
        try {
            const [owner, repo] = repoFullName.split('/');

            if (!owner || !repo) {
                throw new Error('Invalid repository format. Expected "owner/repo"');
            }

            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`,
                {
                    headers: {
                        Authorization: `token ${token}`,
                        Accept: 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            const commits = await Promise.all(data.map(async item => {
                const commit = new Commit();
                commit.hash = item.sha;
                commit.author = item.commit.author.name;
                commit.date = new Date(item.commit.author.date);
                commit.message = item.commit.message.split('\n')[0];
                commit.summary = item.commit.message.split('\n').slice(1).join('\n').trim();

                // Fetch diff for this commit
                try {
                    const diffResponse = await fetch(
                        `https://api.github.com/repos/${owner}/${repo}/commits/${item.sha}`,
                        {
                            headers: {
                                Authorization: `token ${token}`,
                                Accept: 'application/vnd.github.v3.diff'
                            }
                        }
                    );

                    if (diffResponse.ok) {
                        commit.diff = await diffResponse.text();
                    }
                } catch (error) {
                    console.error(`Error fetching diff for commit ${item.sha}:`, error);
                }

                return commit;
            }));

            // Save commits to database
            return this.commitRepository.save(commits);
        } catch (error) {
            console.error('Error fetching GitHub commits:', error);
            throw new Error(`Failed to fetch commits from GitHub: ${error.message}`);
        }
    }

    async generateCommitSummary(commitId: number): Promise<Commit> {
        const commit = await this.commitRepository.findOne({ where: { id: commitId } });

        if (!commit) {
            throw new Error(`Commit with ID ${commitId} not found`);
        }

        if (!commit.diff) {
            throw new Error(`No diff information available for commit ${commit.hash}`);
        }

        // Generate summary using MCP service
        const prompt = `
        You are an expert developer analyzing a git commit. 
        Please provide a concise summary of what this commit does, focusing on the key changes and their impact.
        
        Commit message: ${commit.message}
        Commit author: ${commit.author}
        Commit date: ${commit.date}
        
        Diff:
        ${commit.diff}
        
        Please provide a summary in 3-5 sentences that explains:
        1. What was changed
        2. Why it was changed (if discernible)
        3. The potential impact of these changes
        `;

        try {
            const response = await this.mcpService.generateResponse(prompt);

            // Extract the text from the response
            let summaryText = 'Failed to generate summary';

            if (response && response.content && Array.isArray(response.content)) {
                // Find the first text content block
                const textContent = response.content.find(item => item.type === 'text');
                if (textContent && 'text' in textContent && typeof textContent.text === 'string') {
                    summaryText = textContent.text;
                }
            }

            commit.generatedSummary = summaryText;
            return this.commitRepository.save(commit);
        } catch (error) {
            console.error('Error generating commit summary:', error);
            throw new Error(`Failed to generate summary: ${error.message}`);
        }
    }

    async generateDailySummary(date: string, repoFullName: string): Promise<string> {
        // Parse the date string to a Date object
        const targetDate = new Date(date);

        // Set time to beginning of day
        targetDate.setHours(0, 0, 0, 0);

        // Create end date (end of the same day)
        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);

        // Find all commits for this day and repository using TypeORM's Between operator
        const commits = await this.commitRepository.find({
            where: {
                date: Between(targetDate, endDate)
            },
            order: {
                date: 'ASC'
            }
        });

        if (commits.length === 0) {
            return `No commits found for ${date} in repository ${repoFullName}`;
        }

        // Prepare data for the LLM
        const commitsData = commits.map(commit => ({
            hash: commit.hash.substring(0, 7),
            message: commit.message,
            summary: commit.summary || '',
            diff: commit.diff ? `${commit.diff.substring(0, 500)}...` : 'No diff available',
            generatedSummary: commit.generatedSummary || ''
        }));

        // Generate daily summary using MCP service
        const prompt = `
        You are an expert developer creating a daily summary of git activity.
        Please provide a comprehensive summary of the development work done on ${date} for the repository ${repoFullName}.
        
        Here are the commits from that day:
        
        ${JSON.stringify(commitsData, null, 2)}
        
        Please provide:
        1. A high-level summary of the day's development work (2-3 paragraphs)
        2. Key accomplishments or milestones reached
        3. Any notable technical decisions or changes
        4. Suggestions for areas that might need attention based on the commits
        
        Format your response in markdown.
        `;

        try {
            const response = await this.mcpService.generateResponse(prompt);

            // Extract the text from the response
            let summaryText = 'Failed to generate daily summary';

            if (response && response.content && Array.isArray(response.content)) {
                // Find the first text content block
                const textContent = response.content.find(item => item.type === 'text');
                if (textContent && 'text' in textContent && typeof textContent.text === 'string') {
                    summaryText = textContent.text;
                }
            }

            return summaryText;
        } catch (error) {
            console.error('Error generating daily summary:', error);
            throw new Error(`Failed to generate daily summary: ${error.message}`);
        }
    }
}