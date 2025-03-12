import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commit } from './entities/commit.entity';
import { spawn } from 'child_process';

@Injectable()
export class GitService {
    constructor(
        @InjectRepository(Commit)
        private commitRepository: Repository<Commit>,
    ) { }

    async syncCommits(repoPath: string): Promise<Commit[]> {
        const commits = await this.getGitLog(repoPath);
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

            const commits = data.map(item => {
                const commit = new Commit();
                commit.hash = item.sha;
                commit.author = item.commit.author.name;
                commit.date = new Date(item.commit.author.date);
                commit.message = item.commit.message.split('\n')[0];
                commit.summary = item.commit.message.split('\n').slice(1).join('\n').trim();
                return commit;
            });

            // Save commits to database
            return this.commitRepository.save(commits);
        } catch (error) {
            console.error('Error fetching GitHub commits:', error);
            throw new Error(`Failed to fetch commits from GitHub: ${error.message}`);
        }
    }

    // TODO: Add LLM summary generation (e.g., via Claude API or MCP prompt)
}