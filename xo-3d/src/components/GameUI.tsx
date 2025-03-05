import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../services/socket';

export function GameUI() {
    const { gameState, room, playerName, error, setPlayerName, setRoom } = useGameStore();
    const [inputRoom, setInputRoom] = useState('');
    const [inputName, setInputName] = useState('');

    const handleJoinGame = () => {
        if (!inputRoom.trim() || !inputName.trim()) return;
        setPlayerName(inputName);
        setRoom(inputRoom);
        socket.emit('join_game', { room: inputRoom, player_name: inputName });
    };

    if (!room) {
        return (
            <div className="flex absolute top-0 left-0 justify-center items-center w-full h-full bg-black/50">
                <div className="p-8 mx-4 w-full max-w-md bg-white rounded-lg shadow-xl">
                    <h2 className="mb-6 text-2xl font-bold text-gray-800">3D Крестики-нолики</h2>
                    {error && (
                        <div className="p-3 mb-4 text-red-700 bg-red-100 rounded">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Ваше имя
                            </label>
                            <input
                                type="text"
                                value={inputName}
                                onChange={(e) => setInputName(e.target.value)}
                                className="px-3 py-2 w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-game-primary"
                                placeholder="Введите ваше имя"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                ID комнаты
                            </label>
                            <input
                                type="text"
                                value={inputRoom}
                                onChange={(e) => setInputRoom(e.target.value)}
                                className="px-3 py-2 w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-game-primary"
                                placeholder="Введите ID комнаты"
                            />
                        </div>
                        <button
                            onClick={handleJoinGame}
                            className="px-4 py-2 w-full text-white rounded transition-colors bg-game-primary hover:bg-game-secondary"
                        >
                            Присоединиться к игре
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute right-4 bottom-4 left-4 p-4 bg-white rounded-lg shadow-lg">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold">Игроки:</h3>
                    <div className="space-y-2">
                        {gameState?.players.map((player) => (
                            <div
                                key={player.id}
                                className={`flex items-center ${
                                    player.symbol === gameState.currentPlayer
                                        ? 'text-game-primary font-bold'
                                        : 'text-gray-600'
                                }`}
                            >
                                <span className={`w-6 h-6 flex items-center justify-center mr-2 rounded ${
                                    player.symbol === 'X' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                    {player.symbol}
                                </span>
                                {player.name}
                                {player.symbol === gameState.currentPlayer && ' (ходит)'}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm text-gray-500">
                        Комната: {room}
                    </div>
                </div>
            </div>

            {gameState?.winner && (
                <div className="p-3 mt-4 text-green-700 bg-green-100 rounded">
                    {gameState.winner === 'X' ? 'Крестики' : 'Нолики'} победили!
                </div>
            )}
        </div>
    );
} 