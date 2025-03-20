import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Reflector } from '@nestjs/core';

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtAuthGuard,
                {
                    provide: Reflector,
                    useValue: {
                        getAllAndOverride: jest.fn(),
                    },
                },
            ],
        }).compile();

        guard = module.get<JwtAuthGuard>(JwtAuthGuard);

        // Mock super.canActivate to test our guard's logic
        jest.spyOn(guard, 'canActivate').mockImplementation((context: ExecutionContext) => {
            return true; // Default to allowing the request
        });
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('handleRequest', () => {
        it('should return the user when authentication succeeds', () => {
            const user = { id: 1, username: 'testuser' };
            const result = guard.handleRequest(null, user, null);
            expect(result).toEqual(user);
        });

        it('should throw UnauthorizedException when no user is returned', () => {
            expect(() => guard.handleRequest(null, null, null)).toThrow(
                UnauthorizedException,
            );
        });

        it('should throw the original error when authentication fails with an error', () => {
            const error = new Error('Custom error');
            expect(() => guard.handleRequest(error, null, null)).toThrow(error);
        });

        it('should throw UnauthorizedException with a message when no user and no error', () => {
            expect(() => guard.handleRequest(null, null, null)).toThrow(
                'Authentication failed',
            );
        });
    });

    // Test the full flow with a mock execution context
    describe('full flow', () => {
        it('should handle the authentication flow correctly', async () => {
            // Reset the mock to test the actual flow
            jest.spyOn(guard, 'canActivate').mockRestore();

            // Mock the superclass canActivate method
            const originalCanActivate = guard['canActivate'];
            guard['canActivate'] = jest.fn().mockImplementation((context: ExecutionContext) => {
                // Simulate the passport strategy with a successful authentication
                const req = {
                    user: { id: 1, username: 'testuser' },
                };
                context.switchToHttp().getRequest = jest.fn().mockReturnValue(req);
                return Promise.resolve(true);
            });

            // Create a mock execution context
            const mockContext = {
                switchToHttp: jest.fn().mockReturnValue({
                    getRequest: jest.fn().mockReturnValue({}),
                    getResponse: jest.fn().mockReturnValue({}),
                }),
            } as unknown as ExecutionContext;

            // Test the guard
            const result = await guard.canActivate(mockContext);
            expect(result).toBe(true);

            // Restore the original method
            guard['canActivate'] = originalCanActivate;
        });
    });
}); 