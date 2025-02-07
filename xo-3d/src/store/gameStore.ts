import { create } from 'zustand';
import { GameState } from '../types/game';

interface Store {
    isConnected: boolean;
    room: string | null;
    playerName: string | null;
    gameState: GameState | null;
    error: string | null;
    setIsConnected: (isConnected: boolean) => void;
    setRoom: (room: string) => void;
    setPlayerName: (name: string) => void;
    setGameState: (state: GameState) => void;
    setError: (error: string | null) => void;
    resetGame: () => void;
}

export const useGameStore = create<Store>((set) => ({
    isConnected: false,
    room: null,
    playerName: null,
    gameState: null,
    error: null,
    setIsConnected: (isConnected) => set({ isConnected }),
    setRoom: (room) => set({ room }),
    setPlayerName: (name) => set({ playerName: name }),
    setGameState: (state) => set({ gameState: state }),
    setError: (error) => set({ error }),
    resetGame: () => set({ 
        room: null,
        gameState: null,
        error: null 
    }),
})); 