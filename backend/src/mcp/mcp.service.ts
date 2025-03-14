import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class McpService {
    private openai: OpenAI | null = null;
    private readonly logger = new Logger(McpService.name);

    constructor(private configService: ConfigService) {
        // Get API key directly from environment variable
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY is not set in environment variables');
            return;
        }

        try {
            this.openai = new OpenAI({
                apiKey,
            });
            this.logger.log('OpenAI client initialized successfully');
        } catch (error) {
            this.logger.error(`Failed to initialize OpenAI client: ${error.message}`);
            this.openai = null;
        }
    }

    async generateResponse(prompt: string) {
        if (!this.openai) {
            this.logger.warn('Cannot generate response: OpenAI API key is missing or invalid');
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Cannot generate response: OpenAI API key is missing or invalid. Please set a valid API key in the .env file.'
                    }
                ]
            };
        }

        try {
            this.logger.log('Generating response with OpenAI API');

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'user', content: prompt },
                ],
                max_tokens: 1000,
            });

            this.logger.log('Successfully received response from OpenAI API');

            // Ensure the response has the expected structure
            if (!response || !response.choices || response.choices.length === 0) {
                throw new Error('Invalid response format from OpenAI API');
            }

            return response.choices[0].message;
        } catch (error) {
            this.logger.error(`Error generating response: ${error.message}`);

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