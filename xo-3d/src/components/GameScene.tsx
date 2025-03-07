import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Billboard, Environment, BakeShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useGameStore } from '../store/gameStore';
import { socket } from '../services/socket';
import { Position } from '../types/game';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

function Stars() {
    const groupRef = useRef<THREE.Group>(null);
    const [stars] = useState(() => {
        const temp = [];
        const numStars = 1000;
        for (let i = 0; i < numStars; i++) {
            const position = new THREE.Vector3();
           
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 20 + Math.random() * 20;
            
            position.x = radius * Math.sin(phi) * Math.cos(theta);
            position.y = radius * Math.sin(phi) * Math.sin(theta);
            position.z = radius * Math.cos(phi);
            
            const scale = 0.03 + Math.random() * 0.15;
            const color = new THREE.Color();
            
           
            if (Math.random() > 0.9) {
                color.setHSL(0.6, 1, 0.9);
            } else if (Math.random() > 0.8) {
                color.setHSL(0.1, 1, 0.9);
            } else if (Math.random() > 0.7) {
                color.setHSL(0.95, 1, 0.9);
            } else {
                color.setHSL(0, 0, 1);
            }
            temp.push({ position: position.toArray(), scale, color: color.getHex() });
        }
        return temp;
    });

    useFrame((state) => {
        if (groupRef.current) {
           
            groupRef.current.rotation.y += 0.0001;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
            
           
            groupRef.current.children.forEach((star, i) => {
                const mesh = star as THREE.Mesh;
                const material = mesh.material as THREE.MeshBasicMaterial;
                material.opacity = 0.7 + Math.sin(state.clock.elapsedTime * 0.3 + i * 0.1) * 0.3;
            });
        }
    });

    return (
        <group ref={groupRef}>
            {stars.map((star, i) => (
                <mesh key={i} position={star.position as [number, number, number]}>
                    <sphereGeometry args={[star.scale, 8, 8]} />
                    <meshBasicMaterial 
                        color={star.color}
                        transparent
                        opacity={0.7}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

function HoverEffect({ size = 0.9 }) {
    const linesRef = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if (linesRef.current) {
           
            linesRef.current.children.forEach((line, index) => {
                const material = (line as THREE.Line).material as THREE.MeshPhysicalMaterial;
                const t = (state.clock.elapsedTime * 0.5 + index * 0.2) % 1;
                material.opacity = Math.max(0, 1 - Math.abs((t - 0.5) * 2));
                material.emissiveIntensity = 2 * material.opacity;
            });
        }
    });

    const createEdgeLine = (start: THREE.Vector3, end: THREE.Vector3) => {
        const points = [start, end];
       
        const lines: JSX.Element[] = [];
        const offsets = [-0.005, 0, 0.005];
        
        offsets.forEach(offset => {
            lines.push(
                <primitive key={offset} object={new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints(points),
                    new THREE.MeshPhysicalMaterial({
                        color: '#ffffff',
                        transparent: true,
                        opacity: 0,
                        emissive: '#ffffff',
                        emissiveIntensity: 2,
                        toneMapped: false
                    })
                )} position={[offset, offset, offset]} />
            );
        });
        
        return lines;
    };

   
    const halfSize = size / 2;
    const edges = [
       
        [new THREE.Vector3(-halfSize - 0.02, -halfSize - 0.02, halfSize + 0.02), new THREE.Vector3(halfSize + 0.02, -halfSize - 0.02, halfSize + 0.02)],
        [new THREE.Vector3(halfSize + 0.02, -halfSize - 0.02, halfSize + 0.02), new THREE.Vector3(halfSize + 0.02, halfSize + 0.02, halfSize + 0.02)],
        [new THREE.Vector3(halfSize + 0.02, halfSize + 0.02, halfSize + 0.02), new THREE.Vector3(-halfSize - 0.02, halfSize + 0.02, halfSize + 0.02)],
        [new THREE.Vector3(-halfSize - 0.02, halfSize + 0.02, halfSize + 0.02), new THREE.Vector3(-halfSize - 0.02, -halfSize - 0.02, halfSize + 0.02)],
        
       
        [new THREE.Vector3(-halfSize - 0.02, -halfSize - 0.02, -halfSize - 0.02), new THREE.Vector3(halfSize + 0.02, -halfSize - 0.02, -halfSize - 0.02)],
        [new THREE.Vector3(halfSize + 0.02, -halfSize - 0.02, -halfSize - 0.02), new THREE.Vector3(halfSize + 0.02, halfSize + 0.02, -halfSize - 0.02)],
        [new THREE.Vector3(halfSize + 0.02, halfSize + 0.02, -halfSize - 0.02), new THREE.Vector3(-halfSize - 0.02, halfSize + 0.02, -halfSize - 0.02)],
        [new THREE.Vector3(-halfSize - 0.02, halfSize + 0.02, -halfSize - 0.02), new THREE.Vector3(-halfSize - 0.02, -halfSize - 0.02, -halfSize - 0.02)],
        
       
        [new THREE.Vector3(-halfSize - 0.02, -halfSize - 0.02, halfSize + 0.02), new THREE.Vector3(-halfSize - 0.02, -halfSize - 0.02, -halfSize - 0.02)],
        [new THREE.Vector3(halfSize + 0.02, -halfSize - 0.02, halfSize + 0.02), new THREE.Vector3(halfSize + 0.02, -halfSize - 0.02, -halfSize - 0.02)],
        [new THREE.Vector3(halfSize + 0.02, halfSize + 0.02, halfSize + 0.02), new THREE.Vector3(halfSize + 0.02, halfSize + 0.02, -halfSize - 0.02)],
        [new THREE.Vector3(-halfSize - 0.02, halfSize + 0.02, halfSize + 0.02), new THREE.Vector3(-halfSize - 0.02, halfSize + 0.02, -halfSize - 0.02)]
    ];

    return (
        <group ref={linesRef}>
            {edges.map((points, index) => createEdgeLine(points[0], points[1]))}
        </group>
    );
}

function Cell({ position, value, isWinning, onClick }: { 
    position: Position, 
    value: string | null, 
    isWinning: boolean,
    onClick: () => void 
}) {
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef<THREE.Mesh>(null);

    const baseColor = value === 'X' ? '#f87171' : value === 'O' ? '#60a5fa' : '#f8fafc';
    const color = isWinning ? '#34d399' : baseColor;

    const x = position[0] * 1.2 - 1.2;
    const y = position[1] * 1.2;
    const z = position[2] * 1.2 - 1.2;

   
    const handleClick = (e: any) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <group position={[x, y, z]}>
            <mesh
                ref={meshRef}
                onClick={handleClick}
                onPointerDown={(e: any) => {
                    e.stopPropagation();
                }}
                onPointerUp={(e: any) => {
                    e.stopPropagation();
                }}
                onPointerOver={(e: any) => {
                    e.stopPropagation();
                    setHovered(true);
                }}
                onPointerOut={(e: any) => {
                    e.stopPropagation();
                    setHovered(false);
                }}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[0.9, 0.9, 0.9]} />
                <meshPhysicalMaterial
                    color={color}
                    transparent
                    opacity={value ? 0.7 : 0.2}
                    metalness={0.8}
                    roughness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    envMapIntensity={2}
                    transmission={0.2}
                    thickness={1}
                    ior={1.5}
                    attenuationColor={color}
                    attenuationDistance={0.5}
                    reflectivity={1}
                />
            </mesh>

            {hovered && !value && (
                <group>
                    <mesh scale={1.05}>
                        <boxGeometry args={[0.9, 0.9, 0.9]} />
                        <meshBasicMaterial
                            color={color}
                            transparent
                            opacity={0.1}
                            side={THREE.BackSide}
                        />
                    </mesh>
                    <HoverEffect />
                </group>
            )}

            {value && (
                <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                    <group scale={0.8}>
                        {value === 'X' ? (
                            <group rotation={[0, Math.PI / 4, 0]}>
                                <group rotation={[Math.PI / 4, 0, 0]}>
                                    <mesh position={[0, 0, 0]} castShadow>
                                        <boxGeometry args={[0.15, 0.15, 0.8]} />
                                        <meshPhysicalMaterial 
                                            color={baseColor} 
                                            metalness={0.9} 
                                            roughness={0.1}
                                            emissive={baseColor}
                                            emissiveIntensity={2.0}
                                            envMapIntensity={2}
                                            clearcoat={1}
                                            clearcoatRoughness={0.1}
                                        />
                                    </mesh>
                                </group>
                                <group rotation={[-Math.PI / 4, 0, 0]}>
                                    <mesh position={[0, 0, 0]} castShadow>
                                        <boxGeometry args={[0.15, 0.15, 0.8]} />
                                        <meshPhysicalMaterial 
                                            color={baseColor} 
                                            metalness={0.9} 
                                            roughness={0.1}
                                            emissive={baseColor}
                                            emissiveIntensity={2.0}
                                            envMapIntensity={2}
                                            clearcoat={1}
                                            clearcoatRoughness={0.1}
                                        />
                                    </mesh>
                                </group>
                            </group>
                        ) : (
                            <mesh castShadow>
                                <torusGeometry args={[0.3, 0.1, 32, 64]} />
                                <meshPhysicalMaterial 
                                    color={baseColor} 
                                    metalness={0.9} 
                                    roughness={0.1}
                                    emissive={baseColor}
                                    emissiveIntensity={2.0}
                                    envMapIntensity={2}
                                    clearcoat={1}
                                    clearcoatRoughness={0.1}
                                />
                            </mesh>
                        )}
                    </group>
                </Billboard>
            )}
        </group>
    );
}

function WinningLine({ positions, color = "#10b981" }: { positions: Position[], color?: string }) {
    const points = positions.map(p => new THREE.Vector3(
        p[0] * 1.2 - 1.2,
        p[1] * 1.2,
        p[2] * 1.2 - 1.2
    ));
    return (
        <line>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={points.length}
                    array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial color={color} linewidth={3} />
        </line>
    );
}

function MiniCube({ board, winningLine }: { board: string[][][], winningLine?: Position[] }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
        }
    });

    return (
        <group ref={groupRef} scale={0.6}>
            {board.map((plane, x) =>
                plane.map((row, y) =>
                    row.map((cell, z) => {
                        const position: Position = [x, y, z];
                        const isWinning = winningLine?.some(
                            pos => pos[0] === x && pos[1] === y && pos[2] === z
                        ) ?? false;

                        const baseColor = cell === 'X' ? '#f87171' : cell === 'O' ? '#60a5fa' : '#f8fafc';
                        const color = isWinning ? '#34d399' : baseColor;

                        return (
                            <mesh
                                key={`${x}-${y}-${z}`}
                                position={[
                                    position[0] * 1.2 - 1.2,
                                    position[1] * 1.2 - 1.2,
                                    position[2] * 1.2 - 1.2
                                ]}
                            >
                                <boxGeometry args={[0.9, 0.9, 0.9]} />
                                <meshPhysicalMaterial
                                    color={color}
                                    transparent
                                    opacity={cell ? 0.7 : 0.15}
                                    metalness={0.6}
                                    roughness={0.2}
                                />
                            </mesh>
                        );
                    })
                )
            )}

            {winningLine && (
                <line>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={winningLine.length}
                            array={new Float32Array(winningLine.flatMap(p => [
                                p[0] * 1.2 - 1.2,
                                p[1] * 1.2 - 1.2,
                                p[2] * 1.2 - 1.2
                            ]))}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="#10b981" linewidth={2} />
                </line>
            )}
        </group>
    );
}

function GameCube({ 
    board, 
    scale = 1, 
    onReady, 
    winningLine,
    winningLinesX,
    winningLinesO
}: { 
    board: string[][][], 
    scale?: number, 
    onReady?: () => void,
    winningLine?: Position[],
    winningLinesX?: Position[][],
    winningLinesO?: Position[][]
}) {
    const groupRef = useRef<THREE.Group>(null);

    useEffect(() => {
        if (onReady) {
            onReady();
        }
    }, []);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.01;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
        }
    });

    return (
        <group ref={groupRef} scale={scale}>
            {}
            {winningLinesX?.map((line, index) => (
                <WinningLine key={`x-line-${index}`} positions={line} color="#f87171" />
            ))}
            
            {}
            {winningLinesO?.map((line, index) => (
                <WinningLine key={`o-line-${index}`} positions={line} color="#60a5fa" />
            ))}
            
            {}
            {winningLine && <WinningLine positions={winningLine} color="#10b981" />}
            
            {board.map((plane, x) =>
                plane.map((row, y) =>
                    row.map((cell, z) => {
                        const position: Position = [x, y, z];
                        
                       
                        const isInWinningLineX = gameState?.winningLinesX?.some(line => 
                            line?.some(pos => pos[0] === x && pos[1] === y && pos[2] === z)
                        ) ?? false;
                        
                        const isInWinningLineO = gameState?.winningLinesO?.some(line => 
                            line?.some(pos => pos[0] === x && pos[1] === y && pos[2] === z)
                        ) ?? false;
                        
                        const isInCurrentWinningLine = gameState?.winningLine?.some(
                            pos => pos[0] === x && pos[1] === y && pos[2] === z
                        ) ?? false;
                        
                       
                        const isWinning = isInWinningLineX || isInWinningLineO || isInCurrentWinningLine;

                        return (
                            <Cell
                                key={`${x}-${y}-${z}`}
                                position={position}
                                value={cell}
                                isWinning={isWinning}
                                onClick={() => handleCellClick(position)}
                            />
                        );
                    })
                )
            )}
        </group>
    );
}

interface GameSceneProps {
    isBotGame?: boolean;
    onBotMove?: (position: Position) => void;
}

export function GameScene({ isBotGame = false, onBotMove }: GameSceneProps) {
    const { gameState, room, setGameState, setError } = useGameStore();
    const navigate = useNavigate();
    const [isCubeReady, setIsCubeReady] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);
    
   
    useEffect(() => {
        console.log("GameScene render, gameState:", gameState ? "present" : "null", "room:", room, "isBotGame:", isBotGame);
    }, [gameState, room, isBotGame]);
    
   
    const isPlayerWinner = () => {
        if (!gameState || !gameState.winner) return false;
        
        if (gameState.winner === 'draw' || gameState.winner === 'disconnect') {
            return false;
        }
        
        if (isBotGame) {
           
            return gameState.players.find(p => p.id === 'player')?.symbol === gameState.winner;
        } else {
           
            return gameState.players.find(p => p.id === socket.id)?.symbol === gameState.winner;
        }
    };
    
   
    const getGameResultText = () => {
        if (!gameState || !gameState.winner) return '';
        
        if (gameState.winner === 'disconnect') {
            return 'Игрок покинул игру.';
        }
        
        if (gameState.winner === 'draw') {
            return 'Одинаковое количество линий! Никто не выиграл.';
        }
        
        if (isPlayerWinner()) {
            return 'Поздравляем! У вас больше выигрышных линий.';
        }
        
        if (isBotGame) {
            return 'Бот построил больше линий.';
        } else {
            return `${gameState.players.find(p => p.symbol === gameState.winner)?.name} построил больше линий.`;
        }
    };

   
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!gameState?.winner) {
                e.preventDefault();
                e.returnValue = 'Текущая игра будет сброшена. Вы уверены, что хотите обновить страницу?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [gameState?.winner]);

   
    useEffect(() => {
        if (!socket.connected && !isBotGame) {
            socket.connect();
        }

        const onGameState = (state: any) => {
            console.log('Received game state in GameScene:', state);
            if (state.readyPlayers) {
                console.log('Ready players:', state.readyPlayers);
            }
           
            console.log(`Game state scores in GameScene - X: ${state.scoreX || 0}, O: ${state.scoreO || 0}`);
        };

        const onPlayerLeft = () => {
            console.log('Player left event received');
            if (gameState) {
               
                setGameState({
                    ...gameState,
                    winner: 'disconnect'
                });
               
                setShowDisconnectModal(true);
            }
        };

       
        if (!isBotGame) {
            socket.on('game_state', onGameState);
            socket.on('player_left', onPlayerLeft);
        }

        return () => {
            if (!isBotGame) {
                socket.off('game_state', onGameState);
                socket.off('player_left', onPlayerLeft);
            }
        };
    }, [isBotGame, gameState, setGameState]);

   
    useEffect(() => {
        console.log('Game state updated:', { 
            winner: gameState?.winner,
            readyPlayers: gameState?.readyPlayers,
            socketId: socket.id
        });
    }, [gameState]);

   
    const handleCellClick = (position: Position) => {
        if (!gameState || gameState.isGameOver) return;

        if (isBotGame && onBotMove) {
           
            
           
            const playerSymbol = gameState.players.find(p => p.id === 'player')?.symbol;
            console.log('Игрок пытается сделать ход', {playerSymbol, currentPlayer: gameState.currentPlayer});
            
           
            const [x, y, z] = position;
            if (gameState.board[x][y][z] || gameState.currentPlayer !== playerSymbol) {
                console.log('Невозможно сделать ход: ячейка занята или не ваш ход');
                return;
            }
            
            onBotMove(position);
            return;
        }

        if (!room || !socket.connected) return;
        
       
        const [x, y, z] = position;
        if (gameState.board[x][y][z] || 
            gameState.players.find(p => p.id === socket.id)?.symbol !== gameState.currentPlayer) {
            return;
        }

        console.log('Making move:', position);
        socket.emit('make_move', { room, x, y, z });
    };

   
    const handleEndGame = () => {
        if (!room || !socket.connected) {
            console.error('Socket not connected or room not set');
            return;
        }
        
        console.log('Ending game');
        socket.emit('end_game', { room });
    };

   
    const handleRestart = () => {
       
        if (isBotGame) {
            console.log('Restarting bot game...');
            
           
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
            
           
            console.log("Устанавливаю новое состояние игры с ботом", initialState);
            setGameState(initialState);
            
           
           
            if (botSymbol === 'X') {
                console.log("Бот (X) должен ходить первым, перенаправляю...");
               
                setTimeout(() => {
                    navigate('/game/bot', { replace: true });
                }, 300);
            }
            
            return;
        }
        
       
        if (!room || !socket.connected) {
            console.error('Socket not connected or room not set');
            return;
        }
        
        console.log('Sending restart_game event:', { 
            room,
            socketId: socket.id,
            currentReadyPlayers: gameState?.readyPlayers
        });
        
        socket.emit('restart_game', { room }, (response: any) => {
            console.log('Received restart_game response:', response);
            
            if (!response) {
                console.error('No response received from server');
                return;
            }
            
            if (response.status === 'error') {
                console.error('Restart game error:', response.message);
                setError(response.message);
            } else if (response.status === 'success') {
                console.log('Restart game success:', {
                    readyPlayers: response.readyPlayers,
                    allReady: response.allReady
                });
                if (response.allReady) {
                    console.log('All players ready, game restarted');
                } else {
                    console.log('Waiting for other player...', response.readyPlayers);
                }
            } else {
                console.error('Unknown response status:', response);
            }
        });
    };

   
    if (!gameState) {
        console.log("GameScene: waiting for game state to initialize");
        return (
            <div className="flex justify-center items-center w-screen h-screen bg-gray-900">
                <div className="text-xl text-white">Инициализация игры...</div>
            </div>
        );
    }

    const handleMainMenu = () => {
        if (isBotGame) {
            navigate('/');
            return;
        }

        if (!gameState?.winner) {
            setShowExitConfirm(true);
        } else {
            socket.emit('player_left', { room });
            setShowExitConfirm(false);
            navigate('/');
        }
    };

    const confirmExit = () => {
        if (room && !isBotGame) {
            socket.emit('player_left', { room });
            setShowExitConfirm(false);
            navigate('/');
        }
    };

   
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.05); opacity: 0.8; }
                100% { transform: scale(1); opacity: 0.5; }
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0px); }
            }

            @keyframes slideInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes gradientBg {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            @keyframes dash {
                0% {
                    stroke-dashoffset: 500;
                }
                100% {
                    stroke-dashoffset: 0;
                }
            }
            
            @keyframes scale {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.2);
                }
            }
            
            @keyframes fadeInOut {
                0%, 100% {
                    opacity: 0.3;
                }
                50% {
                    opacity: 1;
                }
            }

            @keyframes pulseBackground {
                0% { opacity: 0.6; }
                50% { opacity: 0.2; }
                100% { opacity: 0.6; }
            }
            
            @keyframes pulseOutline {
                0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.2); }
                70% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
            }

            .waiting-container {
                position: fixed;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(-45deg, #1e293b, #0f172a, #1e3a8a, #0f766e);
                background-size: 400% 400%;
                animation: gradientBg 15s ease infinite;
                z-index: 1000;
            }

            .waiting-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 40px;
                border-radius: 24px;
                background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
            }

            .waiting-icon {
                width: 160px;
                height: 160px;
                margin-bottom: 32px;
                filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.4));
            }

            .waiting-icon svg {
                width: 100%;
                height: 100%;
            }

            .waiting-title {
                color: white;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 12px;
                text-align: center;
                background: linear-gradient(to right, #60a5fa, #34d399);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
            }
            
            .waiting-subtitle {
                color: rgba(255, 255, 255, 0.7);
                font-size: 16px;
                margin-bottom: 32px;
                text-align: center;
                line-height: 1.5;
            }
            
            .room-id-badge {
                background: rgba(96, 165, 250, 0.15);
                color: #60a5fa;
                padding: 8px 16px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                border: 1px solid rgba(96, 165, 250, 0.3);
            }
            
            .room-id-badge svg {
                margin-right: 8px;
                font-size: 14px;
            }

            .waiting-dots {
                display: flex;
                gap: 8px;
                margin-bottom: 32px;
            }

            .waiting-dots span {
                display: inline-block;
                width: 10px;
                height: 10px;
                background: linear-gradient(to right, #60a5fa, #34d399);
                border-radius: 50%;
                animation: pulse 1.4s infinite;
            }

            .waiting-dots span:nth-child(2) {
                animation-delay: 0.2s;
            }

            .waiting-dots span:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            .waiting-button {
                padding: 14px 28px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                cursor: pointer;
                transition: all 0.2s;
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .waiting-button:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .player-status {
                display: flex;
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .player-status-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .player-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(45deg, #60a5fa, #34d399);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                position: relative;
            }
            
            .player-avatar.ready::after {
                content: "✓";
                position: absolute;
                bottom: -5px;
                right: -5px;
                width: 20px;
                height: 20px;
                background: #34d399;
                border-radius: 50%;
                border: 2px solid rgba(15, 23, 42, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
            }
            
            .player-avatar.not-ready::after {
                content: "⏳";
                position: absolute;
                bottom: -5px;
                right: -5px;
                width: 20px;
                height: 20px;
                background: #f87171;
                border-radius: 50%;
                border: 2px solid rgba(15, 23, 42, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
            }
            
            .player-name {
                color: white;
                font-size: 14px;
                text-align: center;
            }
            
            .waiting-particles {
                position: absolute;
                inset: 0;
                z-index: -1;
                overflow: hidden;
            }
            
            .particle {
                position: absolute;
                background: white;
                border-radius: 50%;
                opacity: 0.3;
                animation: fadeInOut 3s infinite;
            }
            
            .cube-grid {
                position: absolute;
                width: 100%;
                height: 100%;
                background-image: 
                    linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
                background-size: 40px 40px;
                z-index: -1;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    useEffect(() => {
       
        if (gameState && !gameState.isGameOver && !gameState.winner) {
           
            const allCellsFilled = gameState.board.flat(2).every(cell => cell !== '');
            
           
            if (allCellsFilled && gameState.scoreX === gameState.scoreO) {
                console.log('Все ячейки заполнены и счет равный, объявляем ничью!');
                
               
                socket.emit('declare_draw', { room });
                
               
                setGameState({
                    ...gameState,
                    isGameOver: true,
                    winner: 'draw'
                });
            }
        }
    }, [gameState?.board, gameState?.scoreX, gameState?.scoreO, gameState?.isGameOver, gameState?.winner, room]);

    return (
        <div style={{ 
            position: 'fixed',
            inset: 0,
            backgroundColor: '#1e293b'
        }}>
            {}
            {gameState && gameState.players.length < 2 && !gameState.winner && !gameState.isGameOver && (
                <div className="waiting-container">
                    <div className="cube-grid"></div>
                    <div className="waiting-particles">
                        {Array.from({ length: 20 }).map((_, index) => (
                            <div 
                                key={index} 
                                className="particle" 
                                style={{
                                    width: `${Math.random() * 6 + 2}px`,
                                    height: `${Math.random() * 6 + 2}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    animationDuration: `${Math.random() * 5 + 3}s`
                                }}
                            ></div>
                        ))}
                    </div>
                    
                    <div className="waiting-content">
                        <div className="waiting-icon">
                            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {}
                                <circle cx="60" cy="60" r="54" stroke="url(#waitingGradient)" strokeWidth="3" opacity="0.8" />
                                
                                {}
                                <circle 
                                    cx="60" 
                                    cy="60" 
                                    r="54" 
                                    stroke="url(#waitingGradient)" 
                                    strokeWidth="3" 
                                    strokeDasharray="500"
                                    opacity="0.8"
                                >
                                    <animate 
                                        attributeName="stroke-dashoffset" 
                                        values="500;0" 
                                        dur="10s" 
                                        repeatCount="indefinite" 
                                    />
                                </circle>
                                
                                {}
                                <g transform="translate(40, 40) scale(0.33)">
                                    <path 
                                        d="M20 20L100 100M100 20L20 100" 
                                        stroke="#f87171" 
                                        strokeWidth="14" 
                                        strokeLinecap="round"
                                    >
                                        <animate
                                            attributeName="opacity"
                                            values="1;0.4;1"
                                            dur="4s"
                                            repeatCount="indefinite"
                                        />
                                    </path>
                                </g>
                                
                                {}
                                <g transform="translate(40, 40) scale(0.33)">
                                    <circle 
                                        cx="60" 
                                        cy="60" 
                                        r="40" 
                                        stroke="#60a5fa" 
                                        strokeWidth="14"
                                        fill="none"
                                    >
                                        <animate
                                            attributeName="opacity"
                                            values="0.4;1;0.4"
                                            dur="4s"
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                </g>
                                
                                {}
                                <circle cx="60" cy="6" r="5" fill="#34d399">
                                    <animate
                                        attributeName="r"
                                        values="3;6;3"
                                        dur="2s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                                <circle cx="114" cy="60" r="5" fill="#60a5fa">
                                    <animate
                                        attributeName="r"
                                        values="3;6;3"
                                        dur="2s"
                                        repeatCount="indefinite"
                                        begin="0.5s"
                                    />
                                </circle>
                                <circle cx="60" cy="114" r="5" fill="#f87171">
                                    <animate
                                        attributeName="r"
                                        values="3;6;3"
                                        dur="2s"
                                        repeatCount="indefinite"
                                        begin="1s"
                                    />
                                </circle>
                                <circle cx="6" cy="60" r="5" fill="#fbbf24">
                                    <animate
                                        attributeName="r"
                                        values="3;6;3"
                                        dur="2s"
                                        repeatCount="indefinite"
                                        begin="1.5s"
                                    />
                                </circle>
                                
                                {}
                                <g transform="translate(90, 30) scale(0.15)">
                                    <path 
                                        d="M20 20L100 100M100 20L20 100" 
                                        stroke="#f87171" 
                                        strokeWidth="14" 
                                        strokeLinecap="round"
                                    >
                                        <animateTransform
                                            attributeName="transform"
                                            type="rotate"
                                            from="0 60 60"
                                            to="360 60 60"
                                            dur="10s"
                                            repeatCount="indefinite"
                                        />
                                    </path>
                                </g>
                                
                                <g transform="translate(30, 90) scale(0.15)">
                                    <circle 
                                        cx="60" 
                                        cy="60" 
                                        r="40" 
                                        stroke="#60a5fa" 
                                        strokeWidth="14"
                                        fill="none"
                                    >
                                        <animateTransform
                                            attributeName="transform"
                                            type="rotate"
                                            from="0 60 60"
                                            to="360 60 60"
                                            dur="10s"
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                </g>
                                
                                <defs>
                                    <linearGradient id="waitingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#60a5fa">
                                            <animate 
                                                attributeName="stop-color" 
                                                values="#60a5fa;#34d399;#f87171;#60a5fa" 
                                                dur="8s" 
                                                repeatCount="indefinite" 
                                            />
                                        </stop>
                                        <stop offset="100%" stopColor="#34d399">
                                            <animate 
                                                attributeName="stop-color" 
                                                values="#34d399;#f87171;#60a5fa;#34d399" 
                                                dur="8s" 
                                                repeatCount="indefinite" 
                                            />
                                        </stop>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        
                        <h2 className="waiting-title">Ожидание игры</h2>
                        
                        <p className="waiting-subtitle">
                            Подождите, пока второй игрок подключится к игровой комнате
                        </p>
                        
                        <div className="room-id-badge">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                            </svg>
                            ID комнаты: {room}
                        </div>
                        
                        <div className="player-status">
                            {gameState.players.map((player, idx) => (
                                <div className="player-status-item" key={player.id}>
                                    <div className={`player-avatar ${player.id === socket.id ? 'ready' : 'not-ready'}`}>
                                        {player.symbol}
                                    </div>
                                    <div className="player-name">
                                        {player.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="waiting-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        
                        <button
                            onClick={handleMainMenu}
                            className="waiting-button"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"/>
                            </svg>
                            Вернуться в меню
                        </button>
                    </div>
                </div>
            )}

            {}
            <div style={{
                position: 'fixed',
                top: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '8px 16px',
                color: '#fff',
                zIndex: 1000,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxWidth: '90%'
            }}>
                {}
                {!isBotGame && room && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        paddingRight: '10px',
                        borderRight: '1px solid rgba(255, 255, 255, 0.15)'
                    }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M13.5 8C13.5 8.82843 12.8284 9.5 12 9.5C11.1716 9.5 10.5 8.82843 10.5 8C10.5 7.17157 11.1716 6.5 12 6.5C12.8284 6.5 13.5 7.17157 13.5 8Z" fill="currentColor"/>
                            <path d="M12 16V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span style={{fontWeight: '500'}}>{room}</span>
                    </div>
                )}

                {}
                {gameState && gameState.players && (
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center'
                    }}>
                        {gameState.players.map(player => (
                            <div key={player.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                background: player.symbol === gameState.currentPlayer 
                                    ? `linear-gradient(135deg, ${player.symbol === 'X' 
                                        ? 'rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05)'
                                        : 'rgba(37, 99, 235, 0.2) 0%, rgba(37, 99, 235, 0.05)'} 100%)`
                                    : 'rgba(255, 255, 255, 0.05)',
                                boxShadow: player.symbol === gameState.currentPlayer 
                                    ? `0 4px 12px -2px ${player.symbol === 'X' 
                                        ? 'rgba(239, 68, 68, 0.3)'  
                                        : 'rgba(37, 99, 235, 0.3)'}`
                                    : 'none',
                                border: `1px solid ${player.symbol === gameState.currentPlayer 
                                    ? player.symbol === 'X' 
                                        ? 'rgba(239, 68, 68, 0.3)'  
                                        : 'rgba(37, 99, 235, 0.3)'
                                    : 'rgba(255, 255, 255, 0.08)'}`,
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden',
                                animation: player.symbol === gameState.currentPlayer 
                                    ? 'pulseBorder 2s infinite' 
                                    : 'none'
                            }}>
                                {}
                                {player.symbol === gameState.currentPlayer && (
                                    <div style={{
                                        position: 'absolute',
                                        left: '0',
                                        top: '0',
                                        width: '100%',
                                        height: '100%',
                                        background: `linear-gradient(135deg, 
                                            ${player.symbol === 'X' 
                                                ? 'rgba(239, 68, 68, 0.2)' 
                                                : 'rgba(37, 99, 235, 0.2)'} 0%, 
                                            transparent 60%)`,
                                        zIndex: 0
                                    }} />
                                )}
                                
                                {}
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '6px',
                                    background: player.symbol === 'X' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                                    boxShadow: `0 2px 6px ${player.symbol === 'X' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 99, 235, 0.2)'}`,
                                    border: `1px solid ${player.symbol === 'X' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
                                    zIndex: 1
                                }}>
                                    <span style={{
                                        color: player.symbol === 'X' ? '#f87171' : '#60a5fa',
                                        fontWeight: '700',
                                        fontSize: '12px',
                                        textShadow: `0 0 8px ${player.symbol === 'X' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(37, 99, 235, 0.6)'}`
                                    }}>
                                        {player.symbol}
                                    </span>
                                </div>
                                
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                    zIndex: 1
                                }}>
                                    <span style={{
                                        fontWeight: '500',
                                        fontSize: '12px',
                                        color: 'white',
                                    }}>
                                        {player.name}
                                    </span>
                                    
                                    {}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        fontSize: '10px',
                                        color: 'rgba(255, 255, 255, 0.7)'
                                    }}>
                                        <span>Линии:</span>
                                        <span style={{
                                            fontWeight: '600',
                                            color: player.symbol === 'X' ? '#f87171' : '#60a5fa'
                                        }}>
                                            {player.symbol === 'X' ? gameState.scoreX || 0 : gameState.scoreO || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {}
                {gameState && !gameState.isGameOver && gameState.board && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                        paddingLeft: '10px'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '6px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden'
                        }}>
                            <div
                                style={{
                                    height: '100%',
                                    borderRadius: '3px',
                                    background: 'linear-gradient(90deg, #60a5fa 0%, #34d399 100%)',
                                    width: `${(gameState.board.flat(2).filter(cell => cell !== '').length / 27) * 100}%`,
                                    transition: 'width 0.5s ease',
                                    boxShadow: '0 0 10px rgba(96, 165, 250, 0.5)'
                                }}
                            />
                        </div>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: '500',
                            color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                        {(() => {
                            const totalCells = 27;
                            const filledCells = gameState.board.flat(2).filter(cell => cell !== '').length;
                            return `${filledCells}/${totalCells}`;
                        })()}
                        </span>
                    </div>
                )}
            </div>

            {}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 1000
            }}>
                <button
                    onClick={handleMainMenu}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backdropFilter: 'blur(8px)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Выйти
                </button>
            </div>

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

                    * {
                        font-family: 'Poppins', sans-serif;
                    }

                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.5); opacity: 0.5; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes shine {
                        0% { transform: translateX(-100%) }
                        50%, 100% { transform: translateX(100%) }
                    }
                    @keyframes slideDown {
                        0% { transform: translate(-50%, -100%); opacity: 0; }
                        100% { transform: translate(-50%, 0); opacity: 1; }
                    }
                    @keyframes fadeIn {
                        0% { opacity: 0; }
                        100% { opacity: 1; }
                    }
                    @keyframes modalSlideIn {
                        0% { 
                            opacity: 0;
                            transform: translate(-50%, calc(-50% - 24px));
                        }
                        100% { 
                            opacity: 1;
                            transform: translate(-50%, -50%);
                        }
                    }
                    @keyframes modalBackdropIn {
                        0% { 
                            opacity: 0;
                            backdrop-filter: blur(0px);
                        }
                        100% { 
                            opacity: 1;
                            backdrop-filter: blur(8px);
                        }
                    }
                    @keyframes modalFadeIn {
                        0% { 
                            opacity: 0;
                            transform: translate(-50%, -50%) scale(0.95);
                        }
                        100% { 
                            opacity: 1;
                            transform: translate(-50%, -50%) scale(1);
                        }
                    }
                    @keyframes pulseBackground {
                        0% { opacity: 0.6; }
                        50% { opacity: 0.2; }
                        100% { opacity: 0.6; }
                    }
                    @keyframes pulseOutline {
                        0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.2); }
                        70% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                    }
                    @keyframes pulseBorder {
                        0% { border-color: rgba(255, 255, 255, 0.2); }
                        50% { border-color: rgba(255, 255, 255, 0.5); }
                        100% { border-color: rgba(255, 255, 255, 0.2); }
                    }
                `}
            </style>

            {}
            <Canvas
                style={{ width: '100%', height: '100%' }}
                camera={{
                    position: [5, 5, 5],
                    fov: 75,
                    near: 0.1,
                    far: 1000
                }}
                shadows
            >
                <color attach="background" args={['#0a0a1f']} />
                
                <Stars />
                
                <ambientLight intensity={0.3} />
                <pointLight position={[8, 8, 6]} intensity={0.6} castShadow />
                <pointLight position={[-6, -8, -8]} intensity={0.4} />
                <spotLight
                    position={[4, 4, 4]}
                    angle={0.4}
                    penumbra={1}
                    intensity={0.3}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />

                <Environment preset="city" />
                <BakeShadows />

                <group rotation={[0, Math.PI / 4, 0]}>
                    {}
                    {gameState?.winningLinesX?.map((line, index) => (
                        <WinningLine key={`x-line-${index}`} positions={line} color="#f87171" />
                    ))}
                    
                    {}
                    {gameState?.winningLinesO?.map((line, index) => (
                        <WinningLine key={`o-line-${index}`} positions={line} color="#60a5fa" />
                    ))}
                    
                    {}
                    {gameState?.winningLine && <WinningLine positions={gameState.winningLine} color="#10b981" />}

                    {gameState?.board?.map((plane, x) =>
                        plane?.map((row, y) =>
                            row?.map((cell, z) => {
                                const position: Position = [x, y, z];
                                
                               
                                const isInWinningLineX = gameState?.winningLinesX?.some(line => 
                                    line?.some(pos => pos[0] === x && pos[1] === y && pos[2] === z)
                                ) ?? false;
                                
                                const isInWinningLineO = gameState?.winningLinesO?.some(line => 
                                    line?.some(pos => pos[0] === x && pos[1] === y && pos[2] === z)
                                ) ?? false;
                                
                                const isInCurrentWinningLine = gameState?.winningLine?.some(
                                    pos => pos[0] === x && pos[1] === y && pos[2] === z
                                ) ?? false;
                                
                               
                                const isWinning = isInWinningLineX || isInWinningLineO || isInCurrentWinningLine;

                                return (
                                    <Cell
                                        key={`${x}-${y}-${z}`}
                                        position={position}
                                        value={cell}
                                        isWinning={isWinning}
                                        onClick={() => handleCellClick(position)}
                                    />
                                );
                            })
                        )
                    )}
                </group>

                <EffectComposer>
                    <Bloom
                        intensity={1}
                        luminanceThreshold={0.2}
                        luminanceSmoothing={0.9}
                        mipmapBlur
                    />
                </EffectComposer>

                <OrbitControls 
                    minDistance={5} 
                    maxDistance={15}
                    enablePan={false}
                    mouseButtons={{
                        LEFT: undefined,
                        MIDDLE: THREE.MOUSE.DOLLY,
                        RIGHT: THREE.MOUSE.ROTATE
                    }}
                    autoRotate={false}
                    enableDamping={true}
                    dampingFactor={0.05}
                />
            </Canvas>

            {}
            {gameState && (
                <div className="absolute top-4 left-4 p-3 rounded-md shadow-md bg-white/80">
                    <h2 className="mb-2 text-lg font-bold">Счет:</h2>
                    <div className="flex gap-4">
                        <div className="flex items-center">
                            <div className="mr-2 w-4 h-4 bg-red-400 rounded-full"></div>
                            <span>X: {gameState.scoreX || 0}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="mr-2 w-4 h-4 bg-blue-400 rounded-full"></div>
                            <span>O: {gameState.scoreO || 0}</span>
                        </div>
                    </div>
                    {!gameState.isGameOver && !gameState.winner && (
                        <button 
                            className="px-3 py-1 mt-3 text-white bg-blue-500 rounded transition hover:bg-blue-600"
                            onClick={handleEndGame}
                        >
                            Закончить игру
                        </button>
                    )}
                </div>
            )}
            
            {}
            {gameState && isCubeReady && !gameState.winner && !gameState.isGameOver && (
                <div className="absolute bottom-8 left-1/2 px-4 py-2 rounded-full shadow-md transform -translate-x-1/2 bg-white/80">
                    <div className="flex items-center">
                        <div 
                            className={`w-4 h-4 rounded-full mr-2 ${
                                gameState.currentPlayer === 'X' ? 'bg-red-400' : 'bg-blue-400'
                            }`}
                        ></div>
                        <span>
                            {gameState.players.find(p => p.symbol === gameState.currentPlayer)?.name || ''} 
                            {gameState.players.find(p => p.symbol === gameState.currentPlayer)?.id === socket.id 
                                ? ' (Ваш ход)' 
                                : ' (ход противника)'}
                        </span>
                    </div>
                </div>
            )}

            {}
            {gameState?.winner && (
                <>
                    {console.log("Отображаем модальное окно с счетом:", {
                        scoreX: gameState.scoreX,
                        scoreO: gameState.scoreO,
                        winner: gameState.winner
                    })}
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(8px)',
                        animation: 'modalBackdropIn 0.3s ease-out',
                        zIndex: 1001
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: '65%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '32px',
                        zIndex: 1002,
                        animation: 'modalFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        width: '90%',
                        maxWidth: '400px'
                    }}>
                        <div style={{
                            width: '180px',
                            height: '180px',
                            marginBottom: '-60px',
                            marginTop: '-240px',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            <Canvas
                                camera={{
                                    position: [6, 6, 6],
                                    fov: 30
                                }}
                                style={{
                                width: '100%',
                                height: '100%',
                                background: 'transparent'
                                }}
                                >
                                    <ambientLight intensity={0.8} />
                                <pointLight position={[10, 10, 10]} intensity={0.6} />
                                
                                <MiniCube 
                                        board={gameState.board} 
                                    winningLine={gameState.winningLine ?? undefined}
                                    />

                                    <EffectComposer>
                                        <Bloom
                                            intensity={0.3}
                                        luminanceThreshold={0.2}
                                        luminanceSmoothing={0.9}
                                        mipmapBlur
                                        />
                                    </EffectComposer>
                                </Canvas>
                        </div>
                        <div style={{
                            backgroundColor: 'rgba(10, 10, 31, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '24px',
                            padding: '32px',
                            width: '100%',
                        textAlign: 'center',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(16px)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '1px',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                animation: 'shine 2s linear infinite'
                            }} />
                            <div style={{
                                fontSize: '28px',
                                fontWeight: '600',
                                color: gameState.winner === 'disconnect' 
                                    ? '#ef4444'
                                    : gameState.winner === 'draw' 
                                        ? '#f59e0b'
                                        : isPlayerWinner()
                                            ? '#34d399'
                                            : '#ef4444',
                                marginBottom: '16px',
                                textShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
                            }}>
                                {gameState.winner === 'disconnect' 
                                    ? 'Игра прервана!' 
                                    : gameState.winner === 'draw' 
                                        ? 'Ничья!' 
                                        : isPlayerWinner()
                                            ? 'Победа!' 
                                            : 'Поражение!'
                                }
                            </div>
                            
                            {}
                        {gameState.winner !== 'disconnect' && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '16px',
                                    marginTop: '8px',
                                    marginBottom: '16px',
                                    padding: '8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '16px'
                                }}>
                                    {}
                                    <div style={{ display: 'none' }}>
                                        Debug: scoreX raw={JSON.stringify(gameState.scoreX)}, 
                                        scoreO raw={JSON.stringify(gameState.scoreO)},
                                        winner={gameState.winner}
                                    </div>
                                    
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: '#f87171',
                                            marginBottom: '4px'
                                        }} />
                                        <span style={{
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: 'rgba(255, 255, 255, 0.9)'
                                        }}>
                                            {typeof gameState.scoreX === 'number' ? gameState.scoreX : 0}
                                        </span>
                                        <span style={{
                                            fontSize: '12px',
                                            color: 'rgba(255, 255, 255, 0.6)'
                                        }}>
                                            линий
                                        </span>
                                </div>
                                
                                    <div style={{
                                        fontSize: '24px',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontWeight: '600'
                                    }}>vs</div>
                                    
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: '#60a5fa',
                                            marginBottom: '4px'
                                        }} />
                                        <span style={{
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: 'rgba(255, 255, 255, 0.9)'
                                        }}>
                                            {typeof gameState.scoreO === 'number' ? gameState.scoreO : 0}
                                        </span>
                                        <span style={{
                                            fontSize: '12px',
                                            color: 'rgba(255, 255, 255, 0.6)'
                                        }}>
                                            линий
                                        </span>
                                </div>
                            </div>
                        )}
                        
                            <div style={{
                                fontSize: '18px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                marginBottom: '32px'
                            }}>
                                {getGameResultText()}
                            </div>
                            
                            {gameState.winner !== 'disconnect' && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{
                                        fontSize: '14px',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        marginBottom: '4px'
                                    }}>
                                        {gameState.readyPlayers?.length === 1 ? 'Ожидаем второго игрока...' : 'Готовность игроков:'}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '16px',
                                        justifyContent: 'center'
                                    }}>
                                        {gameState.players.map(player => (
                                            <div
                                                key={player.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <span style={{
                                                    color: player.symbol === 'X' ? '#f87171' : '#60a5fa',
                                                    fontWeight: '600'
                                                }}>
                                                    {player.symbol}
                                                </span>
                                                <span style={{
                                                    color: 'rgba(255, 255, 255, 0.8)',
                                                    fontSize: '14px'
                                                }}>
                                                    {player.name}
                                                </span>
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: gameState.readyPlayers?.includes(player.id) 
                                                        ? '#34d399' 
                                                        : 'rgba(255, 255, 255, 0.2)',
                                                    transition: 'background-color 0.3s ease',
                                                    boxShadow: gameState.readyPlayers?.includes(player.id)
                                                        ? '0 0 10px rgba(52, 211, 153, 0.5)'
                                                        : 'none'
                                                }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                        )}

                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={handleMainMenu}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '16px',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            >
                                В главное меню
                            </button>
                                
                            {gameState.winner !== 'disconnect' && (
                                <button
                                    onClick={handleRestart}
                                    disabled={!isBotGame && gameState.readyPlayers?.includes(socket.id)}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        backgroundColor: !isBotGame && gameState.readyPlayers?.includes(socket.id) 
                                            ? '#34d399' 
                                            : '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        cursor: !isBotGame && gameState.readyPlayers?.includes(socket.id) ? 'default' : 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        opacity: !isBotGame && gameState.readyPlayers?.includes(socket.id) ? 0.8 : 1
                                    }}
                                    onMouseEnter={e => {
                                        if (isBotGame || !gameState.readyPlayers?.includes(socket.id)) {
                                            e.currentTarget.style.backgroundColor = '#2563eb';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (isBotGame || !gameState.readyPlayers?.includes(socket.id)) {
                                            e.currentTarget.style.backgroundColor = '#3b82f6';
                                        }
                                    }}
                                >
                                    {isBotGame
                                        ? 'Играть снова'
                                        : gameState.readyPlayers?.includes(socket.id) 
                                            ? 'Вы готовы!' 
                                            : 'Играть снова'
                                    }
                                </button>
                            )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {}
            {showExitConfirm && (
                <>
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(8px)',
                        animation: 'modalBackdropIn 0.3s ease-out',
                        zIndex: 1003
                    }} onClick={() => setShowExitConfirm(false)} />
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(10, 10, 31, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        padding: '32px',
                        width: '90%',
                        maxWidth: '400px',
                        textAlign: 'center',
                        zIndex: 1004,
                        animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(16px)'
                    }}>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#fff',
                            marginBottom: '16px'
                        }}>
                            Выйти из игры?
                        </div>
                        <div style={{
                            fontSize: '16px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            marginBottom: '32px'
                        }}>
                            Вы уверены, что хотите вернуться в главное меню?
                            {!gameState?.winner && " Текущая игра будет завершена."}
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={() => setShowExitConfirm(false)}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '16px',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={confirmExit}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '16px',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                </>
            )}

            {}
            {showDisconnectModal && (
                <>
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(8px)',
                        animation: 'modalBackdropIn 0.3s ease-out',
                        zIndex: 1003
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(10, 10, 31, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        padding: '32px',
                        width: '90%',
                        maxWidth: '400px',
                        textAlign: 'center',
                        zIndex: 1004,
                        animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(16px)'
                    }}>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#ef4444',
                            marginBottom: '16px'
                        }}>
                            Игра прервана!
                        </div>
                        <div style={{
                            fontSize: '16px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            marginBottom: '32px'
                        }}>
                            Противник покинул игру.
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '16px',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
                            >
                                В главное меню
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
} 