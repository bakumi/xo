import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

export const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 3000,
    timeout: 60000,
});

socket.on('connect', () => {
    console.log('Connected to server');
    useGameStore.getState().setIsConnected(true);
    useGameStore.getState().setError(null);
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
    if (socket.io.engine.transport.name === 'websocket') {
        console.log('Switching to polling transport');
        socket.io.engine.transport.on('upgrade', () => {
            console.log('Upgraded transport to', socket.io.engine.transport.name);
        });
    }
    useGameStore.getState().setError('Ошибка подключения к серверу');
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
    useGameStore.getState().setError('Произошла ошибка');
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    useGameStore.getState().setIsConnected(false);
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});

socket.on('game_state', (state) => {
    console.log('Received game state:', state);
    console.log(`Scores - X: ${state.scoreX || 0}, O: ${state.scoreO || 0}`);
    console.log(`Is game over: ${state.isGameOver}, Winner: ${state.winner}`);
    useGameStore.getState().setGameState(state);
});

socket.on('game_error', (data) => {
    console.error('Game error:', data.message);
    useGameStore.getState().setError(data.message);
});

socket.on('player_disconnected', () => {
    console.log('Player disconnected');
    useGameStore.getState().setError('Противник отключился');
}); 