import { create } from 'zustand';

interface Commit {
    id: number;
    hash: string;
    author: string;
    date: string;
    message: string;
    summary?: string;
}

interface GitState {
    commits: Commit[];
    setCommits: (commits: Commit[]) => void;
}

export const useGitStore = create<GitState>((set) => ({
    commits: [],
    setCommits: (commits) => set({ commits }),
}));