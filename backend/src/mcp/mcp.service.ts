import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class McpService {
    private anthropic: Anthropic;

    constructor(private configService: ConfigService) {
        // Initialize Anthropic client
        this.anthropic = new Anthropic({
            apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
        });
    }

    async generateResponse(prompt: string) {
        const message = await this.anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                }
            ]
        });

        return message;
    }
} 