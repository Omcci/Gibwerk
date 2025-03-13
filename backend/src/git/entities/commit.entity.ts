import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Commit {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    hash: string;

    @Column()
    author: string;

    @Column()
    date: Date;

    @Column()
    message: string;

    @Column({ nullable: true })
    summary: string;

    @Column({ type: 'text', nullable: true })
    diff: string;

    @Column({ type: 'text', nullable: true })
    generatedSummary: string;
}