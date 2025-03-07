import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../services/socket';

export function GameUI() {
    const { gameState, room, error, setPlayerName, setRoom } = useGameStore();
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
                                onChange={(e) => setInputName(e.target.value.slice(0, 10))}
                                className="px-3 py-2 w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-game-primary"
                                placeholder="Введите ваше имя (макс. 10 символов)"
                                maxLength={10}
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                ID комнаты
                            </label>
                            <input
                                type="text"
                                value={inputRoom}
                                onChange={(e) => setInputRoom(e.target.value.slice(0, 10))}
                                className="px-3 py-2 w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-game-primary"
                                placeholder="Введите ID комнаты (макс. 10 символов)"
                                maxLength={10}
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
                                
                                <div className="flex items-center ml-2">
                                    <span className="text-sm font-medium text-gray-500">
                                        линий: {player.symbol === 'X' ? gameState.scoreX || 0 : gameState.scoreO || 0}
                                    </span>
                                    <div className={`ml-2 w-2 h-2 rounded-full ${
                                        player.symbol === 'X' ? 'bg-red-500' : 'bg-blue-500'
                                    }`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm text-gray-500">
                        Комната: {room}
                    </div>
                    {!gameState?.isGameOver && (
                        <div className="px-2 py-1 mt-2 text-xs font-medium text-blue-600 bg-blue-50 rounded">
                            Игра до заполнения куба
                        </div>
                    )}
                </div>
            </div>

            {}
            {!gameState?.isGameOver && gameState?.board && (
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Заполнение куба:</span>
                        {(() => {
                            
                            const totalCells = 27; 
                            const filledCells = gameState.board.flat(2).filter(cell => cell !== '').length;
                            const percentage = Math.round((filledCells / totalCells) * 100);
                            
                            return (
                                <span className="text-xs text-gray-600">{filledCells} из {totalCells} ячеек ({percentage}%)</span>
                            );
                        })()}
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                            className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                            style={{
                                width: `${(gameState.board.flat(2).filter(cell => cell !== '').length / 27) * 100}%`
                            }}
                        ></div>
                    </div>
                </div>
            )}

            {}
            {!gameState?.isGameOver && gameState?.winningLine && (
                <div className="p-3 mt-4 text-green-700 bg-green-100 rounded">
                    <div className="flex items-center font-bold">
                        <svg className="mr-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {gameState.players.find(p => p.symbol !== gameState.currentPlayer)?.name || ''} 
                        построил линию!
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-green-200">
                        <div className="flex items-center">
                            <div className="mr-1 w-4 h-4 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium">X: {gameState.scoreX || 0} линий</span>
                        </div>
                        <div className="flex items-center">
                            <div className="mr-1 w-4 h-4 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium">O: {gameState.scoreO || 0} линий</span>
                        </div>
                    </div>
                    <div className="flex items-center px-3 py-1 mt-2 text-sm text-yellow-700 bg-yellow-50 rounded border border-yellow-100">
                        <svg className="mr-1 w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Игра продолжается! Делайте следующий ход.
                    </div>
                </div>
            )}

            {}
            {!gameState?.isGameOver && !gameState?.winningLine && (gameState?.scoreX > 0 || gameState?.scoreO > 0) && (
                <div className="p-3 mt-4 text-blue-700 bg-blue-50 rounded">
                    <div className="font-bold">
                        Текущий счет:
                    </div>
                    <div className="mt-1 text-sm">
                        X: {gameState.scoreX || 0} - O: {gameState.scoreO || 0}
                    </div>
                </div>
            )}

            {}
            {gameState?.isGameOver && gameState.winner && (
                <div className="p-4 mt-4 bg-green-100 rounded shadow-inner">
                    <div className="flex items-center mb-3">
                        {gameState.winner === 'draw' ? (
                            <div className="flex items-center px-3 py-1 text-sm font-bold text-yellow-700 bg-yellow-100 rounded-full">
                                <svg className="mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-9a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Ничья!
                            </div>
                        ) : (
                            <div className="flex items-center px-3 py-1 text-sm font-bold text-green-800 bg-green-200 rounded-full">
                                <svg className="mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {gameState.players.find(p => p.symbol === gameState.winner)?.name || ''} победил!
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className={`p-3 rounded ${gameState.winner === 'X' ? 'bg-red-100' : 'bg-white'} border`}>
                            <div className="flex items-center mb-2">
                                <div className="mr-2 w-4 h-4 bg-red-500 rounded-full"></div>
                                <span className="font-medium">{gameState.players.find(p => p.symbol === 'X')?.name || 'X'}</span>
                            </div>
                            <div className="text-sm">Линий: <span className="font-bold text-red-700">{gameState.scoreX || 0}</span></div>
                            {gameState.winningLinesX && <div className="mt-1 text-xs text-gray-500">Построено {gameState.winningLinesX.length} линий</div>}
                        </div>
                        
                        <div className={`p-3 rounded ${gameState.winner === 'O' ? 'bg-blue-100' : 'bg-white'} border`}>
                            <div className="flex items-center mb-2">
                                <div className="mr-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                                <span className="font-medium">{gameState.players.find(p => p.symbol === 'O')?.name || 'O'}</span>
                            </div>
                            <div className="text-sm">Линий: <span className="font-bold text-blue-700">{gameState.scoreO || 0}</span></div>
                            {gameState.winningLinesO && <div className="mt-1 text-xs text-gray-500">Построено {gameState.winningLinesO.length} линий</div>}
                        </div>
                    </div>
                    
                    <div className="p-2 text-xs text-gray-600 bg-gray-50 rounded">
                        {(() => {
                            const totalCells = 27; 
                            const filledCells = gameState.board.flat(2).filter(cell => cell !== '').length;
                            const cellsX = gameState.board.flat(2).filter(cell => cell === 'X').length;
                            const cellsO = gameState.board.flat(2).filter(cell => cell === 'O').length;
                            
                            return (
                                <div>
                                    <div>Заполнено {filledCells} из {totalCells} ячеек ({Math.round((filledCells / totalCells) * 100)}%)</div>
                                    <div className="flex justify-between mt-1">
                                        <span>X: {cellsX} ячеек</span>
                                        <span>O: {cellsO} ячеек</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {}
            {!gameState?.isGameOver && gameState?.players.length === 2 && (
                <div className="flex justify-end mt-4">
                    <button 
                        onClick={() => socket.emit('end_game', { room })}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded transition-colors hover:bg-red-600"
                    >
                        Завершить игру
                    </button>
                </div>
            )}

            {}
            {gameState?.isGameOver && (
                <div className="flex justify-end mt-4">
                    <button 
                        onClick={() => socket.emit('restart_game', { room })}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded transition-colors hover:bg-green-600"
                    >
                        Начать заново
                    </button>
                </div>
            )}
        </div>
    );
} 