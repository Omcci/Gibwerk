import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpService } from './mcp.service';
import { McpController } from './mcp.controller';

@Module({
    imports: [ConfigModule],
    controllers: [McpController],
    providers: [McpService],
    exports: [McpService],
})
export class McpModule { } 