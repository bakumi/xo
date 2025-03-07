import { useRef, useState, useEffect } from 'react';
import { GameScene } from './GameScene';
import { useGameStore } from '../store/gameStore';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Position } from '../types/game';


function checkWinner(board: string[][][], lastMove: Position): [string | null, Position[] | null] {
    const [x, y, z] = lastMove;
    const symbol = board[x][y][z];
    if (!symbol) {
        return [null, null];
    }

    
    const directions = [
        
        [[1,0,0], [-1,0,0]],  
        [[0,1,0], [0,-1,0]],  
        [[0,0,1], [0,0,-1]],  
        
        
        [[1,1,0], [-1,-1,0]],  
        [[1,-1,0], [-1,1,0]],  
        [[1,0,1], [-1,0,-1]],  
        [[1,0,-1], [-1,0,1]],  
        [[0,1,1], [0,-1,-1]],  
        [[0,1,-1], [0,-1,1]],  
        
        
        [[1,1,1], [-1,-1,-1]],  
        [[1,1,-1], [-1,-1,1]],  
        [[1,-1,1], [-1,1,-1]],  
        [[1,-1,-1], [-1,1,1]],  
    ];

    for (const directionPair of directions) {
        let count = 1;
        const line: Position[] = [[x, y, z]];
        
        for (const [dx, dy, dz] of directionPair) {
            let currX = x, currY = y, currZ = z;
            
            for (let i = 0; i < 2; i++) {  
                currX += dx as number;
                currY += dy as number;
                currZ += dz as number;
                
                if (currX >= 0 && currX < 3 && currY >= 0 && currY < 3 && currZ >= 0 && currZ < 3 &&
                    board[currX][currY][currZ] === symbol) {
                    count += 1;
                    line.push([currX, currY, currZ]);
                } else {
                    break;
                }
            }
        }

        if (count >= 3) {
            console.log(`Found winning line for ${symbol}:`, line);
            return [symbol, line];
        }
    }

    return [null, null];
}

export function Game() {
    const navigate = useNavigate();
    const location = useLocation();
    const isBotGame = location.pathname === '/game/bot';
    const { room, gameState, setGameState, setRoom } = useGameStore();
    const botMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    console.log("Game component mounted, pathname:", location.pathname);
    console.log("isBotGame:", isBotGame);
    
    
    const handleBotGameMove = (position: Position) => {
        if (!gameState) return;
        
        
        const playerSymbol = gameState.players.find(p => p.id === 'player')?.symbol || 'X';
        const botSymbol = gameState.players.find(p => p.id === 'bot')?.symbol || 'O';
        
        
        if (gameState.winner || gameState.currentPlayer !== playerSymbol) {
            console.log('Не ваш ход или игра окончена', {
                currentPlayer: gameState.currentPlayer,
                playerSymbol,
                botSymbol,
                winner: gameState.winner
            });
            return;
        }

        
        const [x, y, z] = position;
        if (gameState.board[x][y][z] !== '') {
            console.log('Ячейка уже занята');
            return;
        }

        console.log('Игрок делает ход', position);

        
        const newBoard = JSON.parse(JSON.stringify(gameState.board));
        newBoard[x][y][z] = playerSymbol;
        
        
        const [winner, winningLine] = checkWinner(newBoard, position);
        
        
        let scoreX = gameState.scoreX;
        let scoreO = gameState.scoreO;
        let winningLinesX = [...(gameState.winningLinesX || [])];
        let winningLinesO = [...(gameState.winningLinesO || [])];
        
        if (winner) {
            console.log("Player formed a winning line:", winningLine);
            if (winner === 'X') {
                scoreX += 1;
                winningLinesX.push(winningLine!);
            } else {
                scoreO += 1;
                winningLinesO.push(winningLine!);
            }
        }
        
        
        const isBoardFull = newBoard.flat(2).every(cell => cell !== '');
        const isGameOver = isBoardFull;
        
        
        let finalWinner = null;
        if (isGameOver) {
            if (scoreX > scoreO) {
                finalWinner = 'X';
            } else if (scoreO > scoreX) {
                finalWinner = 'O';
            } else {
                finalWinner = 'draw';
            }
            console.log(`Игра завершена. X: ${scoreX}, O: ${scoreO}, Победитель: ${finalWinner}`);
        }
        
        
        setGameState({
            ...gameState,
            board: newBoard,
            currentPlayer: botSymbol,
            winningLine: winningLine,
            winningLinesX: winningLinesX,
            winningLinesO: winningLinesO,
            scoreX: scoreX,
            scoreO: scoreO,
            winner: finalWinner,
            isGameOver: isGameOver
        });

        
        if (!isGameOver) {
            makeBotMove(botSymbol);
        }
    };

    
    const makeBotMove = (botSymbol: 'X' | 'O') => {
        if (botMoveTimeoutRef.current) {
            clearTimeout(botMoveTimeoutRef.current);
        }
        
        console.log('makeBotMove вызвана, ожидание хода бота...', { botSymbol });
        
       
        botMoveTimeoutRef.current = setTimeout(() => {
           
            const currentState = useGameStore.getState().gameState;
            if (!currentState) {
                console.error('Состояние игры не инициализировано');
                return;
            }
            
            if (currentState.winner) {
                console.log('Игра уже завершена, ход бота не требуется');
                return;
            }
            
           
            const playerSymbol = currentState.players.find(p => p.id === 'player')?.symbol as 'X' | 'O';
            
           
            if (currentState.currentPlayer !== botSymbol) {
                console.log('Сейчас не ход бота', {
                    currentPlayer: currentState.currentPlayer,
                    botSymbol,
                    playerSymbol
                });
                return;
            }
            
            console.log('Бот делает ход', {
                currentPlayer: currentState.currentPlayer,
                botSymbol
            });
            
           
            const emptyPositions: Position[] = [];
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 3; y++) {
                    for (let z = 0; z < 3; z++) {
                        if (currentState.board[x][y][z] === '') {
                            emptyPositions.push([x, y, z]);
                        }
                    }
                }
            }
            
            if (emptyPositions.length === 0) {
                console.log('Нет доступных ходов для бота');
                return;
            }

            let botPosition: Position | null = null;
            
           
            botPosition = findWinningMove(currentState.board, emptyPositions, botSymbol);
            
           
            if (!botPosition) {
                botPosition = findWinningMove(currentState.board, emptyPositions, playerSymbol);
            }
            
           
            if (!botPosition) {
                botPosition = findStrategicMove(
                    currentState.board, 
                    emptyPositions, 
                    botSymbol, 
                    playerSymbol
                );
            }
            
           
            if (!botPosition) {
                const randomIndex = Math.floor(Math.random() * emptyPositions.length);
                botPosition = emptyPositions[randomIndex];
            }
            
            console.log('Бот выбрал позицию:', botPosition);
            
           
            const [x, y, z] = botPosition;
            const updatedBoard = JSON.parse(JSON.stringify(currentState.board));
            updatedBoard[x][y][z] = botSymbol;
            
           
            const [winner, winningLine] = checkWinner(updatedBoard, botPosition);
            
           
            let newWinningLinesX = [...currentState.winningLinesX || []];
            let newWinningLinesO = [...currentState.winningLinesO || []];
            let botWinningLine = null;
            let newScoreX = currentState.scoreX || 0;
            let newScoreO = currentState.scoreO || 0;
            
            if (winner) {
                botWinningLine = winningLine;
                if (winner === 'X') {
                    newWinningLinesX.push(winningLine!);
                    newScoreX++;
                } else {
                    newWinningLinesO.push(winningLine!);
                    newScoreO++;
                }
            }
            
           
            const isBoardFull = updatedBoard.flat(2).every(cell => cell !== '');
            const isGameOver = isBoardFull;
            
           
            let finalWinner = null;
            if (isGameOver) {
                if (newScoreX > newScoreO) {
                    finalWinner = 'X';
                } else if (newScoreO > newScoreX) {
                    finalWinner = 'O';
                } else {
                    finalWinner = 'draw';
                }
                console.log(`Игра завершена. X: ${newScoreX}, O: ${newScoreO}, Победитель: ${finalWinner}`);
            }
            
           
            setGameState({
                ...currentState,
                board: updatedBoard,
                currentPlayer: playerSymbol,
                winningLine: botWinningLine,
                winningLinesX: newWinningLinesX,
                winningLinesO: newWinningLinesO,
                scoreX: newScoreX,
                scoreO: newScoreO,
                winner: finalWinner,
                isGameOver: isGameOver
            });
        }, 500);
    };
    
    
    const findWinningMove = (board: string[][][], emptyPositions: Position[], symbol: string): Position | null => {
        
        for (const position of emptyPositions) {
            const [x, y, z] = position;
            
            
            const tempBoard = JSON.parse(JSON.stringify(board));
            tempBoard[x][y][z] = symbol;
            
            
            const [winner, _] = checkWinner(tempBoard, position);
            
            if (winner === symbol) {
                return position;
            }
        }
        
        return null;
    };
    
    
    const findStrategicMove = (
        board: string[][][], 
        emptyPositions: Position[], 
        botSymbol: string, 
        playerSymbol: string
    ): Position | null => {
        
        const positionScores: Map<string, number> = new Map();
        
        
        const center: Position = [1, 1, 1];
        if (board[1][1][1] === '' && emptyPositions.some(p => p[0] === 1 && p[1] === 1 && p[2] === 1)) {
            return center;
        }
        
        
        const corners: Position[] = [
            [0, 0, 0], [0, 0, 2], [0, 2, 0], [0, 2, 2],
            [2, 0, 0], [2, 0, 2], [2, 2, 0], [2, 2, 2]
        ];
        
        
        for (const position of emptyPositions) {
            const [x, y, z] = position;
            const posKey = `${x},${y},${z}`;
            let score = 0;
            
            
            if (corners.some(c => c[0] === x && c[1] === y && c[2] === z)) {
                score += 3;
            }
            
            
            for (const direction of getAllDirections()) {
                let botCount = 0;
                let playerCount = 0;
                let emptyCount = 0;
                
                
                for (let i = -2; i <= 2; i++) {
                    if (i === 0) continue; 
                    
                    const nx = x + direction[0] * i;
                    const ny = y + direction[1] * i;
                    const nz = z + direction[2] * i;
                    
                    if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3 && nz >= 0 && nz < 3) {
                        if (board[nx][ny][nz] === botSymbol) {
                            botCount++;
                        } else if (board[nx][ny][nz] === playerSymbol) {
                            playerCount++;
                        } else if (board[nx][ny][nz] === '') {
                            emptyCount++;
                        }
                    }
                }
                
                
                if (botCount > 0 && playerCount === 0) {
                    score += botCount * 2;
                }
                
                
                if (playerCount > 0 && botCount === 0) {
                    score += playerCount;
                }
            }
            
            positionScores.set(posKey, score);
        }
        
        
        let bestScore = -1;
        let bestPosition: Position | null = null;
        
        for (const position of emptyPositions) {
            const [x, y, z] = position;
            const posKey = `${x},${y},${z}`;
            const score = positionScores.get(posKey) || 0;
            
            if (score > bestScore) {
                bestScore = score;
                bestPosition = position;
            }
        }
        
        return bestPosition;
    };
    
    
    const getAllDirections = (): [number, number, number][] => {
        return [
            [1, 0, 0], [0, 1, 0], [0, 0, 1],  
            [1, 1, 0], [1, -1, 0], [1, 0, 1], [1, 0, -1], [0, 1, 1], [0, 1, -1],  
            [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1]  
        ];
    };

    
    useEffect(() => {
        if (isBotGame) {
            console.log("Initializing bot game immediately");
            
            
            setRoom('bot-game');
            
            
            const isPlayerX = Math.random() >= 0.5;
            const playerSymbol = isPlayerX ? 'X' as 'X' : 'O' as 'O';
            const botSymbol = isPlayerX ? 'O' as 'O' : 'X' as 'X';
            
            
            const currentPlayer = 'X' as 'X';
            
            
            const initialState = {
                board: Array(3).fill(null).map(() => 
                    Array(3).fill(null).map(() => 
                        Array(3).fill('')
                    )
                ),
                players: [
                    { id: 'player', name: localStorage.getItem('playerName') || 'Игрок', symbol: playerSymbol },
                    { id: 'bot', name: 'Бот', symbol: botSymbol }
                ],
                currentPlayer: currentPlayer,
                winner: null,
                winningLine: null,
                winningLinesX: [],
                winningLinesO: [],
                readyPlayers: ['player', 'bot'],
                scoreX: 0,
                scoreO: 0,
                isGameOver: false,
                isBotGame: true
            };
            
            setGameState(initialState);
            console.log("Bot game state initialized", initialState);
            
            
            if (botSymbol === 'X') {
                makeBotMove(botSymbol);
            }
        }
        
        
        return () => {
            if (botMoveTimeoutRef.current) {
                clearTimeout(botMoveTimeoutRef.current);
            }
        };
    }, [isBotGame, setGameState, setRoom]);

   
    useEffect(() => {
       
        if (gameState && isBotGame) {
            const botSymbol = gameState.players.find(p => p.id === 'bot')?.symbol as 'X' | 'O';
            const playerSymbol = gameState.players.find(p => p.id === 'player')?.symbol as 'X' | 'O';
            
            console.log('Состояние игры изменилось', {
                currentPlayer: gameState.currentPlayer,
                botSymbol,
                playerSymbol,
                isGameOver: gameState.isGameOver,
                winner: gameState.winner
            });
            
           
            if (
                gameState.currentPlayer === botSymbol && 
                !gameState.isGameOver && 
                !gameState.winner
            ) {
                console.log('Состояние изменилось - сейчас ход бота, запускаю makeBotMove');
                makeBotMove(botSymbol);
            }
        }
    }, [gameState, isBotGame]);

    
    if (!room && !isBotGame) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="relative w-screen h-screen">
            <GameScene 
                isBotGame={isBotGame} 
                onBotMove={isBotGame ? handleBotGameMove : undefined} 
            />
        </div>
    );
} 