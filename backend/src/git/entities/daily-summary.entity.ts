import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DailySummary {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    date: Date;

    @Column()
    repository: string;

    @Column({ type: 'text' })
    summary: string;

    @Column()
    createdAt: Date;
} 