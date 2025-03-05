import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

export const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

socket.on('connect', () => {
    console.log('Connected to server');
    useGameStore.getState().setIsConnected(true);
    useGameStore.getState().setError(null);
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
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