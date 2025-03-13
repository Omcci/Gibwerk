import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitService } from './git.service';
import { GitController } from './git.controller';
import { Commit } from './entities/commit.entity';
import { McpModule } from '../mcp/mcp.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Commit]),
        McpModule,
    ],
    providers: [GitService],
    controllers: [GitController],
    exports: [GitService],
})
export class GitModule { }