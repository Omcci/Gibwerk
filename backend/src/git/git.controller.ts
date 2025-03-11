import { Controller, Get, Query } from '@nestjs/common';
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
    async syncCommits(@Query() query: z.infer<typeof RepoQuerySchema>): Promise<Commit[]> {
        RepoQuerySchema.parse(query);
        return this.gitService.syncCommits(query.repoPath);
    }

    @Get('status')
    async getRepoStatus(@Query() query: z.infer<typeof RepoQuerySchema>): Promise<string> {
        RepoQuerySchema.parse(query)
        return this.gitService.getRepoStatus(query.repoPath)
    }
}