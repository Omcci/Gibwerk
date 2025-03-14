import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class McpService {
    private openai: OpenAI | null = null;

    constructor(private configService: ConfigService) {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return;
        }

        try {
            this.openai = new OpenAI({ apiKey });
        } catch (error) {
            this.openai = null;
        }
    }

    async generateResponse(prompt: string) {
        if (!this.openai) {
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
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
            });

            if (!response || !response.choices || response.choices.length === 0) {
                throw new Error('Invalid response format from OpenAI API');
            }

            return response.choices[0].message;
        } catch (error) {
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