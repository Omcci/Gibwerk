import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GitController } from './git.controller';
import { GitService } from './git.service';
import { Commit } from './entities/commit.entity';

describe('GitController', () => {
    let controller: GitController;
    let service: GitService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GitController],
            providers: [
                {
                    provide: GitService,
                    useValue: {
                        syncCommits: jest.fn(),
                        getRepoStatus: jest.fn(),
                        getUserRepositories: jest.fn(),
                        getGithubCommits: jest.fn(),
                        generateCommitSummary: jest.fn(),
                        generateDailySummary: jest.fn(),
                        getDailySummary: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<GitController>(GitController);
        service = module.get<GitService>(GitService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('syncCommits', () => {
        it('should call gitService.syncCommits with the provided repoPath', async () => {
            const repoPath = '/test/repo';
            const expectedCommits: Commit[] = [
                {
                    id: 1,
                    hash: 'abc123',
                    author: 'Test User',
                    date: new Date(),
                    message: 'Test commit',
                    summary: '',
                    diff: '',
                    generatedSummary: '',
                    repository: 'test-repo',
                },
            ];

            jest.spyOn(service, 'syncCommits').mockResolvedValue(expectedCommits);

            const result = await controller.syncCommits(repoPath);

            expect(service.syncCommits).toHaveBeenCalledWith(repoPath);
            expect(result).toBe(expectedCommits);
        });
    });

    describe('getRepoStatus', () => {
        it('should call gitService.getRepoStatus with the provided repoPath', async () => {
            const repoPath = '/test/repo';
            const expectedStatus = 'On branch main';

            jest.spyOn(service, 'getRepoStatus').mockResolvedValue(expectedStatus);

            const result = await controller.getRepoStatus(repoPath);

            expect(service.getRepoStatus).toHaveBeenCalledWith(repoPath);
            expect(result).toBe(expectedStatus);
        });
    });

    describe('getUserRepos', () => {
        it('should throw BadRequestException if authorization header is missing', async () => {
            await expect(controller.getUserRepos(null as unknown as string)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if authorization header format is invalid', async () => {
            await expect(controller.getUserRepos('InvalidToken')).rejects.toThrow(BadRequestException);
        });

        it('should call gitService.getUserRepositories with the token', async () => {
            const authHeader = 'Bearer test-token';
            const expectedRepos = ['repo1', 'repo2'];

            jest.spyOn(service, 'getUserRepositories').mockResolvedValue(expectedRepos);

            const result = await controller.getUserRepos(authHeader);

            expect(service.getUserRepositories).toHaveBeenCalledWith('test-token');
            expect(result).toBe(expectedRepos);
        });
    });

    describe('generateCommitSummary', () => {
        it('should call gitService.generateCommitSummary with the provided commitId and repoContext', async () => {
            const commitId = 1;
            const repoContext = 'test-repo';
            const expectedCommit: Commit = {
                id: 1,
                hash: 'abc123',
                author: 'Test User',
                date: new Date(),
                message: 'Test commit',
                summary: '',
                diff: '',
                generatedSummary: 'Generated summary',
                repository: 'test-repo',
            };

            jest.spyOn(service, 'generateCommitSummary').mockResolvedValue(expectedCommit);

            const result = await controller.generateCommitSummary(commitId, repoContext);

            expect(service.generateCommitSummary).toHaveBeenCalledWith(commitId, repoContext);
            expect(result).toBe(expectedCommit);
        });
    });

    describe('generateDailySummary', () => {
        it('should call gitService.generateDailySummary with the provided date and repoFullName', async () => {
            const date = '2023-01-01';
            const repoFullName = 'user/repo';
            const expectedSummary = { text: 'Daily summary text' };

            jest.spyOn(service, 'generateDailySummary').mockResolvedValue(expectedSummary);

            const result = await controller.generateDailySummary(date, repoFullName);

            expect(service.generateDailySummary).toHaveBeenCalledWith(date, repoFullName);
            expect(result).toBe(expectedSummary);
        });
    });

    describe('getDailySummary', () => {
        it('should call gitService.getDailySummary with the provided date and repoFullName', async () => {
            const date = '2023-01-01';
            const repoFullName = 'user/repo';
            const expectedSummary = { text: 'Daily summary text' };

            jest.spyOn(service, 'getDailySummary').mockResolvedValue(expectedSummary);

            const result = await controller.getDailySummary(date, repoFullName);

            expect(service.getDailySummary).toHaveBeenCalledWith(date, repoFullName);
            expect(result).toBe(expectedSummary);
        });

        it('should return { exists: false } when no summary is found', async () => {
            const date = '2023-01-01';
            const repoFullName = 'user/repo';

            jest.spyOn(service, 'getDailySummary').mockResolvedValue(null);

            const result = await controller.getDailySummary(date, repoFullName);

            expect(result).toEqual({ exists: false });
        });
    });
}); 