export type Position = [number, number, number];

export interface Player {
    id: string;
    name: string;
    symbol: 'X' | 'O';
}

export interface GameState {
    board: Array<Array<Array<string>>>;
    players: Player[];
    currentPlayer: string;
    winner: string | null;
    winningLine: Position[] | null;
    winningLinesX: Position[][] | null;
    winningLinesO: Position[][] | null;
    readyPlayers: string[];
    scoreX: number;
    scoreO: number;
    isGameOver: boolean;
    isBotGame?: boolean;
}

export type GameStore = {
    gameState: GameState | null;
    room: string | null;
    playerName: string;
    isConnected: boolean;
    error: string | null;
    setRoom: (room: string) => void;
    setPlayerName: (name: string) => void;
    setGameState: (state: GameState) => void;
    setError: (error: string | null) => void;
    setIsConnected: (connected: boolean) => void;
    reset: () => void;
}; 