import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { McpService } from './mcp.service';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn(),
            },
        },
    }));
});

describe('McpService', () => {
    let service: McpService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                McpService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<McpService>(McpService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateResponse', () => {
        it('should return error message when OpenAI is not initialized', async () => {
            // Force openai to be null
            (service as any).openai = null;

            const result = await service.generateResponse('test prompt');

            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: 'Cannot generate response: OpenAI API key is missing or invalid. Please set a valid API key in the .env file.'
                    }
                ]
            });
        });

        it('should return OpenAI response when successful', async () => {
            // Mock successful OpenAI response
            const mockResponse = {
                choices: [
                    {
                        message: {
                            content: 'This is a test response',
                            role: 'assistant'
                        }
                    }
                ]
            };

            // Set up the mock
            (service as any).openai = {
                chat: {
                    completions: {
                        create: jest.fn().mockResolvedValue(mockResponse)
                    }
                }
            };

            const result = await service.generateResponse('test prompt');

            expect(result).toEqual(mockResponse.choices[0].message);
            expect((service as any).openai.chat.completions.create).toHaveBeenCalledWith({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'test prompt' }],
                max_tokens: 1000,
            });
        });

        it('should handle errors from OpenAI API', async () => {
            // Set up the mock to throw an error
            (service as any).openai = {
                chat: {
                    completions: {
                        create: jest.fn().mockRejectedValue(new Error('API error'))
                    }
                }
            };

            const result = await service.generateResponse('test prompt');

            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: 'Error generating response: API error'
                    }
                ]
            });
        });
    });
}); 