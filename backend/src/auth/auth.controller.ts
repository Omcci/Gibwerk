import { Controller, Post, Body, HttpCode, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
    constructor(private readonly jwtService: JwtService) { }

    @Post('exchange-token')
    @HttpCode(200)
    async exchangeToken(@Body() body: { token: string }) {
        try {
            // For now, just issue a JWT for any GitHub token
            // In a real app, you would validate the GitHub token first
            if (!body.token) {
                throw new UnauthorizedException('No token provided');
            }

            // Create a JWT token with the user data
            const jwtToken = this.jwtService.sign({
                sub: 'github-user',
                githubToken: body.token
            });

            return { accessToken: jwtToken };
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
} 