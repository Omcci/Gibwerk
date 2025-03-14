'use client';

import { create } from 'zustand';

interface Commit {
    id?: number;
    hash: string;
    author: string;
    date: string | Date;
    message: string;
    summary?: string;
    repository?: string;
}

interface GitState {
    commits: Commit[];
    setCommits: (commits: Commit[]) => void;
    clearCommits: () => void;
}

export const useGitStore = create<GitState>((set) => ({
    commits: [],
    setCommits: (commits: Commit[]) => set({ commits }),
    clearCommits: () => set({ commits: [] }),
}));