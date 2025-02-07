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
            // Распределяем звёзды в форме сферы
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 20 + Math.random() * 20; // Увеличили радиус распределения
            
            position.x = radius * Math.sin(phi) * Math.cos(theta);
            position.y = radius * Math.sin(phi) * Math.sin(theta);
            position.z = radius * Math.cos(phi);
            
            const scale = 0.03 + Math.random() * 0.15; // Увеличили размер звёзд
            const color = new THREE.Color();
            
            // Добавляем разные оттенки для звёзд
            if (Math.random() > 0.9) {
                color.setHSL(0.6, 1, 0.9); // Голубой
            } else if (Math.random() > 0.8) {
                color.setHSL(0.1, 1, 0.9); // Жёлтый
            } else if (Math.random() > 0.7) {
                color.setHSL(0.95, 1, 0.9); // Красноватый
            } else {
                color.setHSL(0, 0, 1); // Белый
            }
            temp.push({ position: position.toArray(), scale, color: color.getHex() });
        }
        return temp;
    });

    useFrame((state) => {
        if (groupRef.current) {
            // Медленное вращение всех звёзд
            groupRef.current.rotation.y += 0.0001;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
            
            // Пульсация звёзд
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
            // Анимируем каждую линию в группе
            linesRef.current.children.forEach((line, index) => {
                const material = (line as THREE.Line).material as THREE.MeshPhysicalMaterial;
                const t = (state.clock.elapsedTime * 0.5 + index * 0.2) % 1;
                material.opacity = Math.max(0, 1 - Math.abs((t - 0.5) * 2));
                material.emissiveIntensity = 2 * material.opacity; // Синхронизируем интенсивность свечения с прозрачностью
            });
        }
    });

    const createEdgeLine = (start: THREE.Vector3, end: THREE.Vector3) => {
        const points = [start, end];
        // Создаем несколько параллельных линий для большей толщины
        const lines: JSX.Element[] = [];
        const offsets = [-0.005, 0, 0.005]; // Смещения для параллельных линий
        
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

    // Создаем все ребра куба
    const halfSize = size / 2;
    const edges = [
        // Передняя грань
        [new THREE.Vector3(-halfSize - 0.02, -halfSize - 0.02, halfSize + 0.02), new THREE.Vector3(halfSize + 0.02, -halfSize - 0.02, halfSize + 0.02)],
        [new THREE.Vector3(halfSize + 0.02, -halfSize - 0.02, halfSize + 0.02), new THREE.Vector3(halfSize + 0.02, halfSize + 0.02, halfSize + 0.02)],
        [new THREE.Vector3(halfSize + 0.02, halfSize + 0.02, halfSize + 0.02), new THREE.Vector3(-halfSize - 0.02, halfSize + 0.02, halfSize + 0.02)],
        [new THREE.Vector3(-halfSize - 0.02, halfSize + 0.02, halfSize + 0.02), new THREE.Vector3(-halfSize - 0.02, -halfSize - 0.02, halfSize + 0.02)],
        
        // Задняя грань
        [new THREE.Vector3(-halfSize - 0.02, -halfSize - 0.02, -halfSize - 0.02), new THREE.Vector3(halfSize + 0.02, -halfSize - 0.02, -halfSize - 0.02)],
        [new THREE.Vector3(halfSize + 0.02, -halfSize - 0.02, -halfSize - 0.02), new THREE.Vector3(halfSize + 0.02, halfSize + 0.02, -halfSize - 0.02)],
        [new THREE.Vector3(halfSize + 0.02, halfSize + 0.02, -halfSize - 0.02), new THREE.Vector3(-halfSize - 0.02, halfSize + 0.02, -halfSize - 0.02)],
        [new THREE.Vector3(-halfSize - 0.02, halfSize + 0.02, -halfSize - 0.02), new THREE.Vector3(-halfSize - 0.02, -halfSize - 0.02, -halfSize - 0.02)],
        
        // Соединяющие ребра
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

    return (
        <group position={[x, y, z]}>
            <mesh
                ref={meshRef}
                onClick={onClick}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                }}
                onPointerOut={(e) => {
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

function WinningLine({ positions }: { positions: Position[] }) {
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
            <lineBasicMaterial color="#10b981" linewidth={3} />
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

function GameCube({ board, scale = 1, onReady, winningLine }: { 
    board: string[][][], 
    scale?: number, 
    onReady?: () => void,
    winningLine?: Position[]
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
            {board.map((plane, x) =>
                plane.map((row, y) =>
                    row.map((cell, z) => {
                        const position: Position = [x, y, z];
                        const isWinning = winningLine?.some(
                            pos => pos[0] === x && pos[1] === y && pos[2] === z
                        ) ?? false;
                        const baseColor = cell === 'X' ? '#f87171' : cell === 'O' ? '#60a5fa' : '#f8fafc';
                        const color = isWinning ? '#34d399' : baseColor;
                        const x_pos = position[0] * 1.2 - 1.2;
                        const y_pos = position[1] * 1.2;
                        const z_pos = position[2] * 1.2 - 1.2;

                        return (
                            <group key={`${x}-${y}-${z}`} position={[x_pos, y_pos, z_pos]}>
                                <mesh castShadow receiveShadow>
                                    <boxGeometry args={[0.9, 0.9, 0.9]} />
                                    <meshPhysicalMaterial
                                        color={color}
                                        transparent
                                        opacity={cell ? 0.5 : 0.15}
                                        metalness={0.6}
                                        roughness={0.2}
                                        clearcoat={0.5}
                                        clearcoatRoughness={0.2}
                                        envMapIntensity={1}
                                    />
                                </mesh>

                                {cell && (
                                    <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                                        <group scale={0.6}>
                                            {cell === 'X' ? (
                                                <group rotation={[0, Math.PI / 4, 0]}>
                                                    <group rotation={[Math.PI / 4, 0, 0]}>
                                                        <mesh castShadow>
                                                            <boxGeometry args={[0.15, 0.15, 0.8]} />
                                                            <meshPhysicalMaterial
                                                                color={color}
                                                                metalness={0.7}
                                                                roughness={0.1}
                                                                emissive={color}
                                                                emissiveIntensity={1.0}
                                                                envMapIntensity={1.5}
                                                            />
                                                        </mesh>
                                                    </group>
                                                    <group rotation={[-Math.PI / 4, 0, 0]}>
                                                        <mesh castShadow>
                                                            <boxGeometry args={[0.15, 0.15, 0.8]} />
                                                            <meshPhysicalMaterial
                                                                color={color}
                                                                metalness={0.7}
                                                                roughness={0.1}
                                                                emissive={color}
                                                                emissiveIntensity={1.0}
                                                                envMapIntensity={1.5}
                                                            />
                                                        </mesh>
                                                    </group>
                                                </group>
                                            ) : (
                                                <mesh castShadow>
                                                    <torusGeometry args={[0.3, 0.1, 32, 64]} />
                                                    <meshPhysicalMaterial
                                                        color={color}
                                                        metalness={0.7}
                                                        roughness={0.1}
                                                        emissive={color}
                                                        emissiveIntensity={1.0}
                                                        envMapIntensity={1.5}
                                                    />
                                                </mesh>
                                            )}
                                        </group>
                                    </Billboard>
                                )}
                            </group>
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
                                p[1] * 1.2,
                                p[2] * 1.2 - 1.2
                            ]))}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="#10b981" linewidth={3} />
                </line>
            )}
        </group>
    );
}

export function GameScene() {
    const { gameState, room } = useGameStore();
    const navigate = useNavigate();
    const [isCubeReady, setIsCubeReady] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);

    // Добавляем предупреждение перед обновлением страницы
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

    const handleCellClick = (position: Position) => {
        if (!room || !gameState || gameState.winner) return;
        
        // Проверяем, что ячейка пуста и это наш ход
        const [x, y, z] = position;
        if (gameState.board[x][y][z] || 
            gameState.players.find(p => p.id === socket.id)?.symbol !== gameState.currentPlayer) {
            return;
        }

        console.log('Making move:', position);
        socket.emit('make_move', { room, x: position[0], y: position[1], z: position[2] });
    };

    const handleRestart = () => {
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
                useGameStore.getState().setError(response.message);
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

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        const onGameState = (state: any) => {
            console.log('Received game state:', state);
            if (state.readyPlayers) {
                console.log('Ready players:', state.readyPlayers);
            }
        };

        const onPlayerLeft = () => {
            console.log('Player left event received');
            // Обновляем состояние игры, чтобы показать, что игра прервана
            useGameStore.getState().setGameState({
                ...gameState!,
                winner: 'disconnect'
            });
            // Показываем модальное окно
            setShowDisconnectModal(true);
        };

        socket.on('game_state', onGameState);
        socket.on('player_left', onPlayerLeft);

        return () => {
            socket.off('game_state', onGameState);
            socket.off('player_left', onPlayerLeft);
        };
    }, [gameState, room]); // Добавляем зависимости

    useEffect(() => {
        console.log('Game state updated:', { 
            winner: gameState?.winner,
            readyPlayers: gameState?.readyPlayers,
            socketId: socket.id
        });
    }, [gameState]);

    const handleMainMenu = () => {
        setShowExitConfirm(true);
    };

    const confirmExit = () => {
        socket.emit('player_left', { room });
        setShowExitConfirm(false); // Закрываем модальное окно подтверждения
        navigate('/');
    };

    // Добавляем стили для анимации ожидания
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

            .info-panel {
                animation: slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .waiting-container {
                position: fixed;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98));
                z-index: 1000;
                animation: fadeIn 0.5s ease;
            }

            .waiting-icon {
                width: 120px;
                height: 120px;
                margin-bottom: 32px;
                animation: float 3s ease-in-out infinite;
            }

            .waiting-icon svg {
                width: 100%;
                height: 100%;
                animation: rotate 10s linear infinite;
            }

            .waiting-dots span {
                display: inline-block;
                width: 8px;
                height: 8px;
                margin: 0 4px;
                background: #60a5fa;
                border-radius: 50%;
                animation: pulse 1.4s ease-in-out infinite;
            }

            .waiting-dots span:nth-child(2) {
                animation-delay: 0.2s;
            }

            .waiting-dots span:nth-child(3) {
                animation-delay: 0.4s;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <div style={{ 
            position: 'fixed',
            inset: 0,
            backgroundColor: '#1e293b'
        }}>
            {/* Экран ожидания */}
            {gameState && gameState.players.length < 2 && !gameState.winner && (
                <div className="waiting-container">
                    <div className="waiting-icon">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="45" stroke="url(#gradient)" strokeWidth="2" />
                            <path d="M50 5 L50 20" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round">
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 50 50"
                                    to="360 50 50"
                                    dur="2s"
                                    repeatCount="indefinite"
                                />
                            </path>
                            
                            <g transform="translate(30, 30) scale(0.4)">
                                <path 
                                    d="M20 20L80 80M80 20L20 80" 
                                    stroke="#f87171" 
                                    strokeWidth="8" 
                                    strokeLinecap="round"
                                    opacity="0.8"
                                >
                                    <animate
                                        attributeName="opacity"
                                        values="0.8;0.4;0.8"
                                        dur="2s"
                                        repeatCount="indefinite"
                                    />
                                </path>
                                <circle 
                                    cx="50" 
                                    cy="50" 
                                    r="30" 
                                    stroke="#60a5fa" 
                                    strokeWidth="8" 
                                    opacity="0.8"
                                >
                                    <animate
                                        attributeName="opacity"
                                        values="0.8;0.4;0.8"
                                        dur="2s"
                                        repeatCount="indefinite"
                                        begin="1s"
                                    />
                                </circle>
                            </g>

                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#60a5fa" />
                                    <stop offset="100%" stopColor="#34d399" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div style={{
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: '600',
                        marginBottom: '16px',
                        textAlign: 'center'
                    }}>
                        Ожидание второго игрока
                    </div>
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '16px',
                        marginBottom: '24px',
                        textAlign: 'center'
                    }}>
                        ID комнаты: {room}
                    </div>
                    <div className="waiting-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <button
                        onClick={handleMainMenu}
                        className="button button-secondary"
                        style={{
                            marginTop: '32px',
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
                        Вернуться в меню
                    </button>
                </div>
            )}

            {/* Информационная панель */}
            {gameState && gameState.players.length === 2 && (
                <div className="info-panel" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    padding: '20px',
                    background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.9) 70%, rgba(15, 23, 42, 0) 100%)',
                    color: '#fff',
                    zIndex: 1000,
                    minWidth: '250px',
                    paddingBottom: '40px',
                    backdropFilter: 'blur(10px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
                    transform: 'translateZ(0)', // Для более плавной анимации
                    willChange: 'transform, opacity' // Оптимизация производительности
                }}>
                    <div style={{ marginBottom: '15px', opacity: 0.7, letterSpacing: '0.02em' }}>
                        Комната: {room}
                    </div>
                    {gameState.players.map(player => (
                        <div key={player.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: player.symbol === gameState.currentPlayer 
                                ? 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)'
                                : 'transparent',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flex: 1
                            }}>
                                <span style={{
                                    color: player.symbol === 'X' ? '#f87171' : '#60a5fa',
                                    fontWeight: '600',
                                    fontSize: '1.1em',
                                    letterSpacing: '0.02em'
                                }}>
                                    {player.symbol}
                                </span>
                                <span style={{
                                    fontWeight: player.symbol === gameState.currentPlayer ? '500' : '400',
                                    color: player.symbol === gameState.currentPlayer ? '#fff' : 'rgba(255,255,255,0.7)'
                                }}>
                                    {player.name}
                                </span>
                            </div>
                            {player.symbol === gameState.currentPlayer && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.85em',
                                    color: player.symbol === 'X' ? '#f87171' : '#60a5fa',
                                    fontWeight: '500'
                                }}>
                                    <span style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: 'currentColor',
                                        animation: 'pulse 1.5s infinite'
                                    }} />
                                    ходит
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Кнопка выхода в главное меню */}
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
                `}
            </style>

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
                    {gameState?.board.map((plane, x) =>
                        plane.map((row, y) =>
                            row.map((cell, z) => {
                                const position: Position = [x, y, z];
                                const isWinning = gameState.winningLine?.some(
                                    pos => pos[0] === x && pos[1] === y && pos[2] === z
                                ) ?? false;

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

                    {gameState?.winningLine && (
                        <WinningLine positions={gameState.winningLine} />
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

            {/* Модальное окно победы */}
            {gameState?.winner && (
                <>
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
                                letterSpacing: '-0.02em',
                                color: gameState.winner === 'disconnect' 
                                    ? '#ef4444'
                                    : gameState.winner === 'draw' 
                                        ? '#f59e0b'
                                        : gameState.players.find(p => p.id === socket.id)?.symbol === gameState.winner
                                            ? '#34d399'
                                            : '#ef4444',
                                marginBottom: '8px',
                                textShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
                            }}>
                                {gameState.winner === 'disconnect' 
                                    ? 'Игра прервана!' 
                                    : gameState.winner === 'draw' 
                                        ? 'Ничья!' 
                                        : gameState.players.find(p => p.id === socket.id)?.symbol === gameState.winner
                                            ? 'Победа!' 
                                            : 'Поражение!'
                                }
                            </div>
                            <div style={{
                                fontSize: '18px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                marginBottom: '32px'
                            }}>
                                {gameState.winner === 'disconnect' 
                                    ? 'Игрок покинул игру.'
                                    : gameState.winner === 'draw' 
                                        ? 'Отличная игра! Никто не выиграл.' 
                                        : gameState.players.find(p => p.id === socket.id)?.symbol === gameState.winner
                                            ? 'Поздравляем с победой!'
                                            : `${gameState.players.find(p => p.symbol === gameState.winner)?.name} победил в этой игре.`
                                }
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
                                        disabled={gameState.readyPlayers?.includes(socket.id)}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '12px',
                                            backgroundColor: gameState.readyPlayers?.includes(socket.id) 
                                                ? '#34d399' 
                                                : '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            cursor: gameState.readyPlayers?.includes(socket.id) ? 'default' : 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            opacity: gameState.readyPlayers?.includes(socket.id) ? 0.8 : 1
                                        }}
                                        onMouseEnter={e => {
                                            if (!gameState.readyPlayers?.includes(socket.id)) {
                                                e.currentTarget.style.backgroundColor = '#2563eb';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!gameState.readyPlayers?.includes(socket.id)) {
                                                e.currentTarget.style.backgroundColor = '#3b82f6';
                                            }
                                        }}
                                    >
                                        {gameState.readyPlayers?.includes(socket.id) 
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

            {/* Модальное окно подтверждения выхода */}
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

            {/* Модальное окно отключения игрока */}
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