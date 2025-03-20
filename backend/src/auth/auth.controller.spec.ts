import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
    let controller: AuthController;
    let jwtService: JwtService;

    // Mock JWT service
    const mockJwtService = {
        sign: jest.fn().mockReturnValue('test.jwt.token'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('exchangeToken', () => {
        it('should exchange a GitHub token for a JWT token', async () => {
            const result = await controller.exchangeToken({ token: 'github-token' });
            expect(result).toEqual({ accessToken: 'test.jwt.token' });
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: 'github-user',
                githubToken: 'github-token',
            });
        });

        it('should throw UnauthorizedException when no token is provided', async () => {
            await expect(controller.exchangeToken({ token: '' })).rejects.toThrow(
                UnauthorizedException,
            );
            // @ts-ignore - Testing invalid inputs
            await expect(controller.exchangeToken({ token: null })).rejects.toThrow(
                UnauthorizedException,
            );
            // @ts-ignore - Testing invalid inputs
            await expect(controller.exchangeToken({ token: undefined })).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException when token validation fails', async () => {
            mockJwtService.sign.mockImplementationOnce(() => {
                throw new Error('Token validation failed');
            });

            await expect(controller.exchangeToken({ token: 'invalid-token' })).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
}); 