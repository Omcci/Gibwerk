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
        const commits = await this.runMcpGitLog(repoPath);
        return this.commitRepository.save(commits);
    }

    private runMcpGitLog(repoPath: string): Promise<Commit[]> {
        return new Promise((resolve, reject) => {
            const mcpProcess = spawn('uvx', [
                'mcp-server-git',
                '--repository',
                repoPath,
                'git_log',
                '--max-count',
                '10',
            ]);
            let output = '';

            mcpProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            mcpProcess.on('close', (code) => {
                if (code === 0) {
                    const commits = JSON.parse(output).map((entry: any) => ({
                        hash: entry.hash,
                        author: entry.author,
                        date: new Date(entry.date),
                        message: entry.message,
                        summary: '',
                    }));
                    resolve(commits);
                } else {
                    reject(new Error('MCP process failed'));
                }
            });
        });
    }

    async getRepoStatus(repoPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const mcpProcess = spawn('uvx', [
                'mcp-server-git',
                '--repository',
                repoPath,
                'git_status',
            ]);

            let output = '';
            mcpProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            mcpProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                } else {
                    reject(new Error('Failed to get repo status'));
                }
            });
        });
    }

    // TODO: Add LLM summary generation (e.g., via Claude API or MCP prompt)
}