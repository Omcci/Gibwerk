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
        it('should generate a structured technical summary for a commit', async () => {
            const mockCommit = {
                id: 1,
                hash: 'abc123',
                author: 'Test User',
                date: new Date(),
                message: 'Fix authentication bug',
                diff: `diff --git a/auth/middleware.js b/auth/middleware.js
                index abcdef..123456 100644
                --- a/auth/middleware.js
                +++ b/auth/middleware.js
                @@ -10,7 +10,9 @@ const authMiddleware = (req, res, next) => {
                   if (!token) {
                     return res.status(401).json({ error: 'No token provided' });
                   }
                -  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                +  jwt.verify(token, process.env.JWT_SECRET, { 
                +    algorithms: ['HS256', 'RS256'] 
                +  }, (err, decoded) => {
                     if (err) {
                       return res.status(401).json({ error: 'Invalid token' });
                     }`,
                repository: 'test-repo',
                generatedSummary: null,
            };

            mockCommitRepository.findOne.mockResolvedValue(mockCommit);

            // Mock MCP service to return a structured summary with Markdown formatting
            const mockSummaryResponse = {
                content: `### WHAT CHANGED
Enhanced JWT authentication security in the auth middleware.

- 🔒 Added explicit algorithm verification in \`jwt.verify()\` calls to prevent <span style="color: #e11d48">signature bypass attacks</span>
- 🔒 Implemented support for both \`HS256\` and \`RS256\` signature algorithms
- 🐛 Updated error handling for invalid tokens with more specific error messages

### TECHNICAL IMPACT
- Mitigated <span style="color: #e11d48">potential security vulnerability</span> that could allow forged tokens
- Improved error logging for authentication failures, aiding in <span style="color: #22c55e">faster troubleshooting</span>`
            };
            mockMcpService.generateResponse.mockResolvedValue(mockSummaryResponse);

            // Mock repository save
            const updatedCommit = {
                ...mockCommit,
                generatedSummary: mockSummaryResponse.content
            };
            mockCommitRepository.save.mockResolvedValue(updatedCommit);

            // Call the function
            const result = await service.generateCommitSummary(1);

            // Check for Markdown section headers
            expect(result.generatedSummary).toContain('### WHAT CHANGED');
            expect(result.generatedSummary).toContain('### TECHNICAL IMPACT');

            // Check for bullet points and emojis
            expect(result.generatedSummary).toMatch(/- 🔒 Added explicit/);
            expect(result.generatedSummary).toMatch(/- 🐛 Updated error/);

            // Check for HTML styling
            expect(result.generatedSummary).toContain('<span style="color: #e11d48">');
            expect(result.generatedSummary).toContain('<span style="color: #22c55e">');

            // Check for code formatting
            expect(result.generatedSummary).toContain('`jwt.verify()`');

            // Verify correct calls were made
            expect(mockCommitRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(mockMcpService.generateResponse).toHaveBeenCalled();
            expect(mockCommitRepository.save).toHaveBeenCalled();
        });
    });

    describe('generateDailySummary', () => {
        it('should generate a structured daily summary with sections', async () => {
            // Mock date and repository
            const date = '2023-01-01';
            const repoFullName = 'user/test-repo';

            // Mock commits for the day
            const mockCommits = [
                {
                    id: 1,
                    hash: 'abc123',
                    author: 'Test User',
                    date: new Date('2023-01-01T10:00:00Z'),
                    message: 'Fix authentication bug',
                    diff: 'test diff',
                    repository: 'test-repo',
                    generatedSummary: 'Fixed authentication bug',
                },
                {
                    id: 2,
                    hash: 'def456',
                    author: 'Another User',
                    date: new Date('2023-01-01T14:00:00Z'),
                    message: 'Add new UI component',
                    diff: 'more test diff',
                    repository: 'test-repo',
                    generatedSummary: 'Added new UI component',
                }
            ];

            // Mock repository findOne to return null (no existing summary)
            mockDailySummaryRepository.findOne.mockResolvedValue(null);

            // Mock commit repository to return our test commits
            mockCommitRepository.find.mockResolvedValue(mockCommits);

            // Mock MCP service to return a structured summary with Markdown formatting
            const mockSummaryResponse = {
                content: `## SUMMARY OF CHANGES
Authentication system improvements and UI enhancements were the focus of today's development work.

### Features
- 🆕 Added OAuth2 authentication middleware to \`api/auth/middleware.js\`
- 🆕 Implemented **password reset flow** with email notifications

### Fixes
- 🐛 Fixed <span style="color: #e11d48">critical payment processing transaction failures</span>
- 🔒 Enhanced JWT token validation with proper algorithm verification

## TECHNICAL METRICS
Today's work included \`1\` major feature (authentication) and \`2\` bug fixes across \`7\` files. The payment processing fix resolved an issue affecting <span style="color: #22c55e">15% of transactions</span>. The error handling improvements will reduce unhandled exceptions by approximately \`30%\`.

## NEXT STEPS
Browser compatibility testing is still needed for the new UI component, especially for older versions of Safari.`
            };
            mockMcpService.generateResponse.mockResolvedValue(mockSummaryResponse);

            // Mock repository save
            const savedSummary = {
                id: 1,
                date: new Date('2023-01-01'),
                repository: repoFullName,
                summary: mockSummaryResponse.content,
                commitCount: 2,
                contributorCount: 2
            };
            mockDailySummaryRepository.save.mockResolvedValue(savedSummary);

            // Call the function
            const result = await service.generateDailySummary(date, repoFullName);

            // Check for Markdown section headers
            expect(result.text).toContain('## SUMMARY OF CHANGES');
            expect(result.text).toContain('## TECHNICAL METRICS');
            expect(result.text).toContain('## NEXT STEPS');

            // Check for subsection headers
            expect(result.text).toContain('### Features');
            expect(result.text).toContain('### Fixes');

            // Check for emojis and bullet points
            expect(result.text).toMatch(/- 🆕 Added/);
            expect(result.text).toMatch(/- 🐛 Fixed/);

            // Check for HTML styling
            expect(result.text).toContain('<span style="color: #e11d48">');
            expect(result.text).toContain('<span style="color: #22c55e">');

            // Check for code formatting
            expect(result.text).toContain('`api/auth/middleware.js`');

            // Verify correct calls were made
            expect(mockCommitRepository.find).toHaveBeenCalled();
            expect(mockMcpService.generateResponse).toHaveBeenCalled();
            expect(mockDailySummaryRepository.save).toHaveBeenCalled();
        });
    });
}); 