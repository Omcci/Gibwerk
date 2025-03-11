import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitService } from './git.service';
import { GitController } from './git.controller';
import { Commit } from './entities/commit.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Commit])],
    providers: [GitService],
    controllers: [GitController],
})
export class GitModule { }