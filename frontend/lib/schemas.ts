import { z } from 'zod';

export const CommitSchema = z.object({
    id: z.number(),
    hash: z.string(),
    author: z.string(),
    date: z.string(),
    message: z.string(),
    summary: z.string().optional(),
    repository: z.string().optional(),
});