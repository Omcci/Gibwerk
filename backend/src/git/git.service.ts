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

    // TODO: Add LLM summary generation (e.g., via Claude API or MCP prompt)
}