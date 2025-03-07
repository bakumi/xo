import { create } from 'zustand';
import { GameState } from '../types/game';


export enum AIDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard'
}

interface Store {
    isConnected: boolean;
    room: string | null;
    playerName: string | null;
    gameState: GameState | null;
    error: string | null;
    isAIGame: boolean;
    aiDifficulty: AIDifficulty | null;
    setIsConnected: (isConnected: boolean) => void;
    setRoom: (room: string) => void;
    setPlayerName: (name: string) => void;
    setGameState: (state: GameState) => void;
    setError: (error: string | null) => void;
    setIsAIGame: (isAIGame: boolean) => void;
    setAIDifficulty: (difficulty: AIDifficulty) => void;
    resetGame: () => void;
}

export const useGameStore = create<Store>((set) => ({
    isConnected: false,
    room: null,
    playerName: null,
    gameState: null,
    error: null,
    isAIGame: false,
    aiDifficulty: null,
    setIsConnected: (isConnected) => set({ isConnected }),
    setRoom: (room) => set({ room }),
    setPlayerName: (name) => set({ playerName: name }),
    setGameState: (state) => set((currentState) => {
        
        const scoreX = typeof state.scoreX === 'number' ? state.scoreX : 
            (currentState.gameState?.scoreX || 0);
        const scoreO = typeof state.scoreO === 'number' ? state.scoreO : 
            (currentState.gameState?.scoreO || 0);
        
        console.log(`Setting game state with scores: X=${scoreX}, O=${scoreO}`);
        
        return { 
            gameState: {
                ...state,
                scoreX,
                scoreO
            } 
        };
    }),
    setError: (error) => set({ error }),
    setIsAIGame: (isAIGame) => set({ isAIGame }),
    setAIDifficulty: (difficulty) => set({ aiDifficulty: difficulty }),
    resetGame: () => set({ 
        room: null,
        gameState: null,
        error: null,
        isAIGame: false,
        aiDifficulty: null
    }),
}));