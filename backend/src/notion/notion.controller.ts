import { Controller, Post, Body, HttpCode, UseGuards, Get } from '@nestjs/common';
import { NotionService } from './notion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notion')
export class NotionController {
    constructor(private readonly notionService: NotionService) { }

    @UseGuards(JwtAuthGuard)
    @Post('sync-daily-summary')
    @HttpCode(200)
    async syncDailySummary(
        @Body() data: { date: string; repoFullName: string; summary: string },
    ) {
        return this.notionService.syncDailySummary(
            data.date,
            data.repoFullName,
            data.summary,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('database-schema')
    @HttpCode(200)
    async getDatabaseSchema() {
        return this.notionService.getDatabaseSchema();
    }
} 