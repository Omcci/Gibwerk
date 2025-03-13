import { Controller, Get, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { GitService } from './git.service';
import { Commit } from './entities/commit.entity';
import { z } from 'zod';

const RepoQuerySchema = z.object({
    repoPath: z.string().min(1),
});

@Controller('git')
export class GitController {
    constructor(private readonly gitService: GitService) { }

    @Post('sync-commits')
    async syncCommits(@Body('repoPath') repoPath: string): Promise<Commit[]> {
        return this.gitService.syncCommits(repoPath);
    }

    @Get('repo-status')
    async getRepoStatus(@Body('repoPath') repoPath: string): Promise<string> {
        return this.gitService.getRepoStatus(repoPath);
    }

    @Get('user-repos')
    async getUserRepos(@Headers('authorization') authHeader: string): Promise<string[]> {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new BadRequestException('Invalid authorization header format. Expected "Bearer TOKEN"');
        }

        const token = authHeader.split(' ')[1];
        return this.gitService.getUserRepositories(token);
    }

    @Post('github-commits')
    async getGithubCommits(
        @Body('repo') repo: string,
        @Headers('authorization') authHeader: string,
    ): Promise<Commit[]> {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new BadRequestException('Invalid authorization header format. Expected "Bearer TOKEN"');
        }

        const token = authHeader.split(' ')[1];
        return this.gitService.getGithubCommits(token, repo);
    }

    @Post('generate-commit-summary')
    async generateCommitSummary(@Body('commitId') commitId: number): Promise<Commit> {
        const schema = z.object({
            commitId: z.number().int().positive(),
        });

        try {
            schema.parse({ commitId });
        } catch (error) {
            throw new BadRequestException('Invalid commitId. Must be a positive integer.');
        }

        return this.gitService.generateCommitSummary(commitId);
    }

    @Post('generate-daily-summary')
    async generateDailySummary(
        @Body('date') date: string,
        @Body('repoFullName') repoFullName: string,
    ): Promise<string> {
        const schema = z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
            repoFullName: z.string().regex(/^[^\/]+\/[^\/]+$/, 'Repository must be in format "owner/repo"'),
        });

        try {
            schema.parse({ date, repoFullName });
        } catch (error) {
            throw new BadRequestException('Invalid parameters. Date must be in YYYY-MM-DD format and repoFullName must be in "owner/repo" format.');
        }

        return this.gitService.generateDailySummary(date, repoFullName);
    }
}