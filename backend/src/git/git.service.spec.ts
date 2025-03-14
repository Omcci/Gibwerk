import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitService } from './git.service';
import { Commit } from './entities/commit.entity';
import { DailySummary } from './entities/daily-summary.entity';
import { McpService } from '../mcp/mcp.service';
import { ChildProcess } from 'child_process';

// Mock child_process
jest.mock('child_process', () => ({
    spawn: jest.fn(),
}));

describe('GitService', () => {
    let service: GitService;
    let commitRepository: Repository<Commit>;
    let dailySummaryRepository: Repository<DailySummary>;
    let mcpService: McpService;

    const mockCommitRepository = {
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
    };

    const mockDailySummaryRepository = {
        save: jest.fn(),
        findOne: jest.fn(),
    };

    const mockMcpService = {
        generateResponse: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GitService,
                {
                    provide: getRepositoryToken(Commit),
                    useValue: mockCommitRepository,
                },
                {
                    provide: getRepositoryToken(DailySummary),
                    useValue: mockDailySummaryRepository,
                },
                {
                    provide: McpService,
                    useValue: mockMcpService,
                },
            ],
        }).compile();

        service = module.get<GitService>(GitService);
        commitRepository = module.get<Repository<Commit>>(getRepositoryToken(Commit));
        dailySummaryRepository = module.get<Repository<DailySummary>>(getRepositoryToken(DailySummary));
        mcpService = module.get<McpService>(McpService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('syncCommits', () => {
        it('should sync commits from git log and save them', async () => {
            // Mock the spawn function
            const mockStdout = {
                on: jest.fn(),
            };
            const mockStderr = {
                on: jest.fn(),
            };
            const mockProcess = {
                stdout: mockStdout,
                stderr: mockStderr,
                on: jest.fn(),
            };

            (require('child_process').spawn as jest.Mock).mockReturnValue(mockProcess);

            // Mock the getGitLog method to return sample commits
            const sampleCommits = [
                {
                    hash: 'abc123',
                    author: 'Test User',
                    date: new Date(),
                    message: 'Test commit',
                    summary: '',
                    diff: '',
                    repository: '',
                },
            ];

            // Mock private methods using spyOn
            jest.spyOn(service as any, 'getGitLog').mockResolvedValue(sampleCommits);
            jest.spyOn(service as any, 'getCommitDiff').mockResolvedValue('test diff');

            mockCommitRepository.save.mockResolvedValue(sampleCommits);

            const result = await service.syncCommits('/test/repo');

            expect(result).toEqual(sampleCommits);
            expect(mockCommitRepository.save).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        hash: 'abc123',
                        diff: 'test diff',
                        repository: 'repo',
                    }),
                ])
            );
        });
    });

    describe('getRepoStatus', () => {
        it('should return the git status of a repository', async () => {
            // Mock the spawn function
            const mockStdout = {
                on: jest.fn().mockImplementation((event, callback) => {
                    if (event === 'data') {
                        callback(Buffer.from('On branch main\nYour branch is up to date with \'origin/main\'.'));
                    }
                    return mockStdout;
                }),
            };
            const mockStderr = {
                on: jest.fn().mockImplementation((event, callback) => {
                    return mockStderr;
                }),
            };
            const mockProcess = {
                stdout: mockStdout,
                stderr: mockStderr,
                on: jest.fn().mockImplementation((event, callback) => {
                    if (event === 'close') {
                        callback(0);
                    }
                    return mockProcess;
                }),
            };

            (require('child_process').spawn as jest.Mock).mockReturnValue(mockProcess);

            const result = await service.getRepoStatus('/test/repo');

            expect(result).toEqual('On branch main\nYour branch is up to date with \'origin/main\'.');
            expect(require('child_process').spawn).toHaveBeenCalledWith('git', ['-C', '/test/repo', 'status']);
        });
    });

    describe('generateCommitSummary', () => {
        it('should generate a summary for a commit', async () => {
            const mockCommit = {
                id: 1,
                hash: 'abc123',
                author: 'Test User',
                date: new Date(),
                message: 'Test commit',
                diff: 'test diff',
                repository: 'test-repo',
                generatedSummary: null,
            };

            mockCommitRepository.findOne.mockResolvedValue(mockCommit);

            const mockResponse = {
                content: 'This is a generated summary',
            };

            mockMcpService.generateResponse.mockResolvedValue(mockResponse);
            mockCommitRepository.save.mockResolvedValue({
                ...mockCommit,
                generatedSummary: 'This is a generated summary',
            });

            const result = await service.generateCommitSummary(1);

            expect(result.generatedSummary).toBe('This is a generated summary');
            expect(mockCommitRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(mockMcpService.generateResponse).toHaveBeenCalled();
            expect(mockCommitRepository.save).toHaveBeenCalled();
        });
    });
}); 