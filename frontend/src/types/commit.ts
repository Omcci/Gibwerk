export interface Commit {
    id?: number;
    hash: string;
    author: string;
    date: string | Date;
    message: string;
    summary?: string;
} 