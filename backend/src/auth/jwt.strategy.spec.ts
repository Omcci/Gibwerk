import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtStrategy,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string, defaultValue: string) => {
                            if (key === 'JWT_SECRET') return 'test-secret';
                            return defaultValue;
                        }),
                    },
                },
            ],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    it('should use the correct JWT secret from ConfigService', () => {
        expect(configService.get).toHaveBeenCalledWith('JWT_SECRET', 'your-secret-key');
    });

    describe('validate', () => {
        it('should return a user object when given a valid payload', async () => {
            const payload = {
                sub: 'user-123',
                username: 'testuser',
            };

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                userId: 'user-123',
                username: 'testuser',
            });
        });

        it('should handle payloads without a username', async () => {
            const payload = {
                sub: 'user-123',
            };

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                userId: 'user-123',
                username: undefined,
            });
        });

        it('should preserve the sub property as userId', async () => {
            const payload = {
                sub: 'github-user',
                otherprop: 'value',
            };

            const result = await strategy.validate(payload);

            expect(result.userId).toEqual('github-user');
        });
    });
}); 