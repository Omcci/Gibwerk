import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PassportModule } from '@nestjs/passport';

describe('AuthModule (Integration)', () => {
    let app: INestApplication;
    let jwtService: JwtService;

    beforeAll(async () => {
        // Mock ConfigService to provide JWT_SECRET
        const mockConfigService = {
            get: jest.fn((key: string, defaultValue: string) => {
                if (key === 'JWT_SECRET') return 'test-secret';
                return defaultValue;
            }),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                PassportModule.register({ defaultStrategy: 'jwt' }),
                AuthModule,
            ],
            providers: [
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        })
            .overrideProvider(ConfigService)
            .useValue(mockConfigService)
            .compile();

        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get<JwtService>(JwtService);

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should have the AuthController defined', () => {
        const controller = app.get<AuthController>(AuthController);
        expect(controller).toBeDefined();
    });

    it('should have JwtStrategy defined', () => {
        const jwtStrategy = app.get<JwtStrategy>(JwtStrategy);
        expect(jwtStrategy).toBeDefined();
    });

    it('should have JwtService defined', () => {
        expect(jwtService).toBeDefined();
    });

    describe('/auth/exchange-token (POST)', () => {
        it('should exchange a GitHub token for a JWT token', () => {
            return request(app.getHttpServer())
                .post('/auth/exchange-token')
                .send({ token: 'github-token' })
                .expect(200)
                .expect(res => {
                    expect(res.body).toHaveProperty('accessToken');
                    // Verify it's a real JWT token with 3 parts
                    expect(res.body.accessToken.split('.')).toHaveLength(3);
                });
        });

        it('should return 401 when no token is provided', () => {
            return request(app.getHttpServer())
                .post('/auth/exchange-token')
                .send({ token: '' })
                .expect(401);
        });

        it('should return 401 when token is missing from request', () => {
            return request(app.getHttpServer())
                .post('/auth/exchange-token')
                .send({})
                .expect(401);
        });
    });

    describe('JWT Verification', () => {
        it('should verify a valid JWT token', async () => {
            // Create a token directly
            const testToken = jwtService.sign({ sub: 'test-user' });

            // Verify the token
            const decoded = jwtService.verify(testToken);
            expect(decoded).toHaveProperty('sub', 'test-user');
        });
    });
}); 