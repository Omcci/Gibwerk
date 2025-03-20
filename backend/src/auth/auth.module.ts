import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
                signOptions: { expiresIn: '1d' }
            }),
            inject: [ConfigService],
        }),
        ConfigModule,
    ],
    controllers: [AuthController],
    providers: [JwtStrategy],
    exports: [JwtModule],
})
export class AuthModule { } 