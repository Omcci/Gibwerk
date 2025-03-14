import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commit } from './entities/commit.entity';
import { DailySummary } from './entities/daily-summary.entity';
import { spawn } from 'child_process';
import { McpService } from '../mcp/mcp.service';
import { Between } from 'typeorm';

@Injectable()
export class GitService {
    constructor(
        @InjectRepository(Commit)
        private commitRepository: Repository<Commit>,
        @InjectRepository(DailySummary)
        private dailySummaryRepository: Repository<DailySummary>,
        private mcpService: McpService,
    ) { }

    async syncCommits(repoPath: string): Promise<Commit[]> {
        const commits = await this.getGitLog(repoPath);

        // Extract repository name from the path
        const repoName = repoPath.split('/').pop() || 'Gibwerk';

        // Fetch diff for each commit
        for (const commit of commits) {
            commit.diff = await this.getCommitDiff(repoPath, commit.hash);
            commit.repository = repoName;
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
                commit.repository = repoFullName;

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

    async generateCommitSummary(commitId: number, repoContext?: string): Promise<Commit> {
        const commit = await this.commitRepository.findOne({ where: { id: commitId } });

        if (!commit) {
            throw new Error(`Commit with ID ${commitId} not found`);
        }

        if (!commit.diff) {
            throw new Error(`No diff information available for commit ${commit.hash}`);
        }

        // Use the stored repository name, the provided context, or a default
        const repoName = repoContext || commit.repository || 'Gibwerk';

        // Generate summary using MCP service
        const prompt = `
        You are summarizing a git commit for the "${repoName}" project for a Product Manager or Lead Developer.
        
        Commit message: ${commit.message}
        Commit author: ${commit.author}
        Commit date: ${commit.date}
        
        Diff:
        ${commit.diff}
        
        IMPORTANT GUIDELINES:
        1. Write a CONCISE, HIGH-LEVEL summary (2-3 sentences maximum)
        2. Focus on WHAT was changed (new features, fixes, refactoring)
        3. Mention key components or areas affected
        4. Use plain, direct language
        5. DO NOT list every file changed
        6. DO NOT use marketing language or subjective assessments
        7. DO NOT speculate about intentions or impacts
        
        Example of good summary:
        "Added authentication middleware to API endpoints. Implemented password reset functionality with email notifications. Fixed user profile data validation."
        `;

        try {
            const response = await this.mcpService.generateResponse(prompt);

            // Extract the text from the response
            let summaryText = 'Failed to generate summary';

            // Handle OpenAI response format
            if (response) {
                if (response.content && Array.isArray(response.content)) {
                    // Anthropic format
                    const textContent = response.content.find(item => item.type === 'text');
                    if (textContent && 'text' in textContent && typeof textContent.text === 'string') {
                        summaryText = textContent.text;
                    }
                } else if (response.content) {
                    // OpenAI format - direct content
                    summaryText = response.content;
                } else if (typeof response === 'object' && 'text' in response) {
                    // Simple object with text property
                    summaryText = (response as { text: string }).text;
                } else if (typeof response === 'string') {
                    // Direct string response
                    summaryText = response;
                }
            }

            commit.generatedSummary = summaryText;
            return this.commitRepository.save(commit);
        } catch (error) {
            console.error('Error generating commit summary:', error);
            throw new Error(`Failed to generate summary: ${error.message}`);
        }
    }

    async generateDailySummary(date: string, repoFullName: string): Promise<{ text: string }> {
        // Parse the date string to a Date object
        const targetDate = new Date(date);

        // Set time to beginning of day
        targetDate.setHours(0, 0, 0, 0);

        // Create end date (end of the same day)
        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);

        // Check if we already have a summary for this date and repository
        const existingSummary = await this.dailySummaryRepository.findOne({
            where: {
                date: targetDate,
                repository: repoFullName
            }
        });

        // If we have an existing summary, return it
        if (existingSummary) {
            return { text: existingSummary.summary };
        }

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
            return { text: `No commits found for ${date} in repository ${repoFullName}` };
        }

        // Calculate some metrics for the LLM to use
        const totalCommits = commits.length;
        const uniqueAuthors = new Set(commits.map(commit => commit.author)).size;

        // Estimate code changes (very rough approximation)
        let totalLinesChanged = 0;
        let complexityScore = 0;

        commits.forEach(commit => {
            if (commit.diff) {
                // Count lines added/removed
                const lines = commit.diff.split('\n');
                const addedLines = lines.filter(line => line.startsWith('+')).length;
                const removedLines = lines.filter(line => line.startsWith('-')).length;
                totalLinesChanged += addedLines + removedLines;

                // Rough complexity estimation
                const filesChanged = (commit.diff.match(/^diff --git/gm) || []).length;
                const functionsChanged = (commit.diff.match(/^[+-]\s*(function|const\s+\w+\s+=\s+\(|class\s+\w+|def\s+\w+)/gm) || []).length;

                complexityScore += filesChanged * 2 + functionsChanged * 3;
            }
        });

        // Prepare data for the LLM
        const commitsData = commits.map(commit => ({
            hash: commit.hash.substring(0, 7),
            author: commit.author,
            message: commit.message,
            summary: commit.summary || '',
            generatedSummary: commit.generatedSummary || '',
            linesChanged: commit.diff ?
                (commit.diff.split('\n').filter(line => line.startsWith('+') || line.startsWith('-')).length) :
                'unknown'
        }));

        // Generate daily summary using MCP service
        const prompt = `
        You are creating a daily summary of git activity for ${date} in repository ${repoFullName} for a Product Manager or Lead Developer.
        
        Here are the commits from that day:
        
        ${JSON.stringify(commitsData, null, 2)}
        
        Additional metrics:
        - Total commits: ${totalCommits}
        - Unique contributors: ${uniqueAuthors}
        - Estimated lines changed: ${totalLinesChanged}
        - Complexity score: ${complexityScore} (higher means more complex changes)
        
        IMPORTANT GUIDELINES:
        1. Write a CONCISE summary (3-5 sentences) of what was accomplished
        2. Focus on key features, fixes, or improvements
        3. Group related changes together
        4. Use plain, direct language
        
        THEN, provide a brief assessment of developer productivity:
        1. Evaluate the day's output (exceptional, good, average, or below average)
        2. Consider quantity (number of commits, lines changed) AND quality/complexity
        3. Be fair but honest in your assessment
        4. Keep this section to 1-2 sentences
        
        Format your response with two paragraphs:
        1. First paragraph: Summary of changes
        2. Second paragraph: Assessment of productivity
        
        Example:
        "Implemented user authentication system with login and registration. Fixed critical bug in payment processing that was causing transaction failures. Added error handling to improve system stability.
        
        This was a highly productive day with substantial feature additions and critical bug fixes. The changes demonstrate strong technical execution across both frontend and backend systems."
        `;

        try {
            const response = await this.mcpService.generateResponse(prompt);

            // Extract the text from the response
            let summaryText = 'Failed to generate daily summary';

            // Handle OpenAI response format
            if (response) {
                if (response.content && Array.isArray(response.content)) {
                    // Anthropic format
                    const textContent = response.content.find(item => item.type === 'text');
                    if (textContent && 'text' in textContent && typeof textContent.text === 'string') {
                        summaryText = textContent.text;
                    }
                } else if (response.content) {
                    // OpenAI format - direct content
                    summaryText = response.content;
                } else if (typeof response === 'object' && 'text' in response) {
                    // Simple object with text property
                    summaryText = (response as { text: string }).text;
                } else if (typeof response === 'string') {
                    // Direct string response
                    summaryText = response;
                }
            }

            // Store the summary in the database
            const newSummary = new DailySummary();
            newSummary.date = targetDate;
            newSummary.repository = repoFullName;
            newSummary.summary = summaryText;
            newSummary.createdAt = new Date();
            await this.dailySummaryRepository.save(newSummary);

            return { text: summaryText };
        } catch (error) {
            console.error('Error generating daily summary:', error);
            throw new Error(`Failed to generate daily summary: ${error.message}`);
        }
    }

    // Add a new method to get a daily summary without generating it
    async getDailySummary(date: string, repoFullName: string): Promise<{ text: string } | null> {
        // Parse the date string to a Date object
        const targetDate = new Date(date);

        // Set time to beginning of day
        targetDate.setHours(0, 0, 0, 0);

        // Check if we have a summary for this date and repository
        const existingSummary = await this.dailySummaryRepository.findOne({
            where: {
                date: targetDate,
                repository: repoFullName
            }
        });

        // If we have an existing summary, return it
        if (existingSummary) {
            return { text: existingSummary.summary };
        }

        return null;
    }
}