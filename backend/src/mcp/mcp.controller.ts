import { Controller, Post, Body } from '@nestjs/common';
import { McpService } from './mcp.service';

@Controller('mcp')
export class McpController {
    constructor(private readonly mcpService: McpService) { }

    @Post('generate')
    async generateResponse(@Body('prompt') prompt: string) {
        return this.mcpService.generateResponse(prompt);
    }
} 