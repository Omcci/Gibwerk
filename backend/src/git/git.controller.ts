import { Controller, Get, Query, Headers } from '@nestjs/common';
import { GitService } from './git.service';
import { Commit } from './entities/commit.entity';
import { z } from 'zod';

const RepoQuerySchema = z.object({
    repoPath: z.string().min(1),
});

@Controller('git')
export class GitController {
    constructor(private readonly gitService: GitService) { }

    @Get('sync')
    async syncCommits(@Query('repoPath') repoPath: string): Promise<Commit[]> {
        return this.gitService.syncCommits(repoPath);
    }

    @Get('status')
    async getRepoStatus(@Query('repoPath') repoPath: string): Promise<string> {
        return this.gitService.getRepoStatus(repoPath);
    }

    @Get('user-repos')
    async getUserRepos(@Headers('authorization') authHeader: string) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Invalid authorization header');
        }

        const token = authHeader.split(' ')[1];
        return this.gitService.getUserRepositories(token);
    }

    @Get('github-commits')
    async getGithubCommits(
        @Query('repo') repo: string,
        @Headers('authorization') authHeader: string
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Invalid authorization header');
        }

        const token = authHeader.split(' ')[1];
        return this.gitService.getGithubCommits(token, repo);
    }
}