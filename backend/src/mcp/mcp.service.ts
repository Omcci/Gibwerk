import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class McpService {
    private anthropic: Anthropic;
    private readonly logger = new Logger(McpService.name);

    constructor(private configService: ConfigService) {
        // Initialize Anthropic client
        const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
        if (!apiKey) {
            this.logger.error('ANTHROPIC_API_KEY is not set in environment variables');
        }

        this.anthropic = new Anthropic({
            apiKey,
        });
    }

    async generateResponse(prompt: string) {
        try {
            this.logger.log('Generating response with Anthropic API');

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

            this.logger.log('Successfully received response from Anthropic API');

            // Ensure the response has the expected structure
            if (!message || !message.content || !Array.isArray(message.content) || message.content.length === 0) {
                throw new Error('Invalid response format from Anthropic API');
            }

            return message;
        } catch (error) {
            this.logger.error(`Error generating response: ${error.message}`, error.stack);

            // Return a structured error response that can be handled by the client
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error generating response: ${error.message}`
                    }
                ]
            };
        }
    }
} 