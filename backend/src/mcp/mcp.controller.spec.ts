import { Test, TestingModule } from '@nestjs/testing';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

describe('McpController', () => {
    let controller: McpController;
    let service: McpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [McpController],
            providers: [
                {
                    provide: McpService,
                    useValue: {
                        generateResponse: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<McpController>(McpController);
        service = module.get<McpService>(McpService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('generateResponse', () => {
        it('should call mcpService.generateResponse with the provided prompt', async () => {
            const prompt = 'test prompt';
            const expectedResponse = {
                content: [
                    {
                        type: 'text',
                        text: 'test response'
                    }
                ]
            };

            jest.spyOn(service, 'generateResponse').mockResolvedValue(expectedResponse);

            const result = await controller.generateResponse(prompt);

            expect(service.generateResponse).toHaveBeenCalledWith(prompt);
            expect(result).toBe(expectedResponse);
        });
    });
}); 