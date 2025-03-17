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
        
        IMPORTANT FORMATTING GUIDELINES:
        Create a well-structured summary with the following sections using HTML/Markdown mixed formatting:
        
        SECTION 1: "WHAT CHANGED"
        - Use ### for the section heading (will be styled as a primary color)
        - A single concise sentence overview of the commit
        - Then 2-3 bullet points with specific technical details about what was changed
        - Be precise about components, files, or systems affected
        - For important points, use **bold** formatting
        
        SECTION 2: "TECHNICAL IMPACT" (When relevant)
        - Use ### for the section heading (will be styled as a primary color) 
        - 1-2 bullet points describing technical impact
        - Include metrics if possible (e.g., "Reduced page load time by ~20%")
        - Note performance, security, or architectural implications
        - Wrap numbers/metrics in inline code blocks using backticks for emphasis
        
        Advanced Formatting:
        1. For feature additions, prefix with 🆕
        2. For bug fixes, prefix with 🐛
        3. For performance improvements, prefix with ⚡
        4. For security improvements, prefix with 🔒
        5. For refactorings, prefix with ♻️
        6. For documentation, prefix with 📝
        7. For critical items, wrap in <span style="color: #e11d48">critical text</span>
        8. For positive impacts, wrap in <span style="color: #22c55e">positive text</span>
        9. For file paths or code elements, use \`code\` backticks
        
        Follow these style rules:
        1. Use Markdown formatting with HTML for color highlights
        2. Be technical and specific, focusing on what and how (not why)
        3. Code elements should be in backticks (e.g., \`function()\`)
        4. Keep the entire summary concise (max 150 words)
        
        Example:
        
        ### WHAT CHANGED
        Enhanced JWT authentication security in the auth middleware.
        
        - 🔒 Added explicit algorithm verification in \`jwt.verify()\` calls to prevent <span style="color: #e11d48">signature bypass attacks</span>
        - 🔒 Implemented support for both \`HS256\` and \`RS256\` signature algorithms
        - 🐛 Updated error handling for invalid tokens with more specific error messages
        
        ### TECHNICAL IMPACT
        - Mitigated <span style="color: #e11d48">potential security vulnerability</span> that could allow forged tokens
        - Improved error logging for authentication failures, aiding in <span style="color: #22c55e">faster troubleshooting</span>
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

    async generateDailySummary(date: string, repoFullName: string, force: boolean = false): Promise<{ text: string }> {
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

        // If we have an existing summary and force is false, return it
        if (existingSummary && !force) {
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
        
        IMPORTANT FORMATTING GUIDELINES:
        Create a well-structured report with the following sections using HTML/Markdown mixed formatting:
        
        SECTION 1: "SUMMARY OF CHANGES"
        - Use ## for the section heading (will be styled as a primary color)
        - Start with a concise 2-3 sentence overview of the day's work
        - Then list key changes as bullet points, grouped by type (features, fixes, refactoring)
        - Use technical, specific descriptions for each bullet point
        - For important points, use **bold** formatting
        
        SECTION 2: "TECHNICAL METRICS"
        - Use ## for the section heading (will be styled as a primary color)
        - Present specific metrics about the work completed
        - Mention affected components, systems, or areas of the codebase
        - Note any technical debt or items needing future attention
        - Include concrete numbers when possible
        - Wrap numbers/metrics in inline code blocks using backticks for emphasis
        
        SECTION 3: "NEXT STEPS" (Optional, only if clearly implied by the commits)
        - Use ## for the section heading (will be styled as a primary color)
        - Briefly suggest logical next steps or areas to focus on
        - Base this strictly on the commits analyzed, not speculation
        
        Advanced Formatting:
        1. For feature additions, prefix with 🆕
        2. For bug fixes, prefix with 🐛
        3. For performance improvements, prefix with ⚡
        4. For security improvements, prefix with 🔒
        5. For refactorings, prefix with ♻️
        6. For documentation, prefix with 📝
        7. For critical items, wrap in <span style="color: #e11d48">critical text</span>
        8. For positive impacts, wrap in <span style="color: #22c55e">positive text</span>
        9. For file paths or code elements, use \`code\` backticks
        10. For subsection titles, use ### (smaller headings)
        
        Example Output:
        
        ## SUMMARY OF CHANGES
        Authentication system implementation and payment processing improvements were the main focus of today's development work.
        
        ### Features
        - 🆕 Added OAuth2 authentication middleware to \`api/auth/middleware.js\`
        - 🆕 Implemented **password reset flow** with email notifications
        
        ### Fixes
        - 🐛 Fixed <span style="color: #e11d48">critical payment processing transaction failures</span>
        - 🔒 Enhanced JWT token validation with proper algorithm verification
        
        ## TECHNICAL METRICS
        Today's work included \`1\` major feature (authentication) and \`2\` bug fixes across \`7\` files. The payment processing fix resolved an issue affecting <span style="color: #22c55e">15% of transactions</span>. The error handling improvements will reduce unhandled exceptions by approximately \`30%\`.
        
        ## NEXT STEPS
        The validation layer still needs refactoring to address technical debt and improve input sanitization.
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
            if (existingSummary && force) {
                // Update existing summary
                existingSummary.summary = summaryText;
                existingSummary.createdAt = new Date(); // Update timestamp
                await this.dailySummaryRepository.save(existingSummary);
            } else {
                // Create new summary
                const newSummary = new DailySummary();
                newSummary.date = targetDate;
                newSummary.repository = repoFullName;
                newSummary.summary = summaryText;
                newSummary.createdAt = new Date();
                await this.dailySummaryRepository.save(newSummary);
            }

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