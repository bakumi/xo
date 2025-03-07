import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { socket } from '../services/socket';
import { PlayerNameInput } from './PlayerNameInput';
import { RoomList } from './RoomList';
import { CreateRoomForm } from './CreateRoomForm';
import { PasswordModal } from './PasswordModal';
import { GameRules } from './GameRules';
import '../styles/MainMenu.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faUsers, 
    faLock, 
    faCheck, 
    faTimes, 
    faSyncAlt, 
    faExpand, 
    faExpandAlt, 
    faExclamationTriangle,
    faInfoCircle,
    faChevronDown,
    faChevronUp,
    faSearch
} from '@fortawesome/free-solid-svg-icons';

/**
 * Интерфейс для комнаты
 */
interface Room {
    name: string;
    creator: string;
    players: number;
    id: string;
    hasPassword: boolean;
}

/**
 * Основной компонент главного меню
 */
export function MainMenu() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || '');
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    
    const [showRules, setShowRules] = useState(false);
    const [showExpandedServers, setShowExpandedServers] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    
    useEffect(() => {
        useGameStore.getState().setError(null);
    }, []);

    
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    
    useEffect(() => {
        
        socket.emit('get_rooms');
        
        socket.on('rooms_update', (updatedRooms: Room[]) => {
            console.log("Полученные комнаты:", updatedRooms);
            setRooms(updatedRooms);
            setIsLoading(false);
        });

        return () => {
            socket.off('rooms_update');
        };
    }, []);
    
    
    useEffect(() => {
        
        if (location.pathname === '/') {
            console.log("Перешли на главную страницу, обновляем список комнат");
            socket.emit('get_rooms');
        }
        
        
        const interval = setInterval(() => {
            if (location.pathname === '/') {
                console.log("Периодическое обновление списка комнат");
                socket.emit('get_rooms');
            }
        }, 10000);
        
        return () => clearInterval(interval);
    }, [location.pathname]);
    
    
    const refreshRooms = () => {
        setIsLoading(true);
        socket.emit('get_rooms');
    };
    
    
    useEffect(() => {
        const query = searchQuery.trim();
        
        if (query && query.length >= 4 && query.length <= 10 && !query.includes(' ')) {
            
            const roomById = rooms.find(room => room.id === query);
            if (roomById) {
                console.log("Найдена комната по ID:", roomById);
                
            } else {
                
                console.log("Поиск комнаты по ID на сервере:", query);
                socket.emit('get_rooms');
            }
        }
    }, [searchQuery, rooms]);
    
    
    const handleDirectJoinById = () => {
        const roomId = searchQuery.trim();
        if (!roomId) {
            setError('Введите ID комнаты');
            return;
        }
        
        if (!playerName.trim()) {
            setError('Введите имя игрока');
            return;
        }
        
        
        if (playerName.trim().length < 3) {
            setError('Имя игрока должно содержать минимум 3 символа');
            return;
        }
        
        joinRoom(roomId);
    };

    
    useEffect(() => {
        if (showExpandedServers) {
            
            const roomItems = document.querySelectorAll('.expanded-room-item');
            
            
            roomItems.forEach(item => {
                
                (item as HTMLElement).style.cursor = 'pointer';
                
                
                const roomId = item.getAttribute('data-room-id');
                const roomIndex = item.getAttribute('data-room-index');
                
                
                const room = rooms.find(r => r.id === roomId) || 
                             (roomIndex ? rooms[parseInt(roomIndex)] : null);
                
                if (room) {
                    
                    item.addEventListener('click', () => handleJoinRoom(room));
                }
            });
            
            
            return () => {
                roomItems.forEach(item => {
                    item.removeEventListener('click', () => {});
                });
            };
        }
    }, [showExpandedServers, rooms]);

    
    const toggleRules = () => {
        setShowRules(!showRules);
    };

    
    const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value.slice(0, 10);
        setPlayerName(newName);
        localStorage.setItem('playerName', newName);
        
        if (error === 'Введите имя игрока') {
                setError(null);
        }
    };

    
    const handleRefreshRooms = () => {
        const buttons = document.querySelectorAll('.refresh-button');
        buttons.forEach(button => {
            button.classList.add('spinning');
            setTimeout(() => {
                button.classList.remove('spinning');
            }, 500);
        });
        socket.emit('get_rooms');
    };

    
    const toggleExpandedServers = () => {
        if (showExpandedServers) {
            setShowExpandedServers(false);
        } else {
            setShowExpandedServers(true);
            handleRefreshRooms();
        }
    };

    
    const handleCreateRoom = (roomName: string, password: string) => {
        if (!playerName.trim()) {
            setError('Введите имя игрока');
            return;
        }
        
        
        if (playerName.trim().length < 3) {
            setError('Имя игрока должно содержать минимум 3 символа');
            return;
        }
        
        if (!roomName.trim()) {
            setError('Введите название комнаты');
            return;
        }
        
        
        if (roomName.trim().length < 3) {
            setError('Название комнаты должно содержать минимум 3 символа');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        
        useGameStore.getState().setGameState({
            board: Array(3).fill(null).map(() => 
                Array(3).fill(null).map(() => 
                    Array(3).fill('')
                )
            ),
            players: [],
            currentPlayer: '',
            winner: null,
            winningLine: null,
            winningLinesX: [],
            winningLinesO: [],
            readyPlayers: [],
            scoreX: 0,
            scoreO: 0,
            isGameOver: false
        });

        
        socket.emit('create_room', { 
            room_name: roomName, 
            player_name: playerName,
            password: password.trim() || null
        }, (response: any) => {
            setIsLoading(false);
            
            if (response.error) {
                
                if (response.error.includes('уже существует')) {
                    setError(`Комната "${roomName}" уже существует. Выберите другое название.`);
                } else if (response.error.includes('имя') || response.error.includes('никнейм')) {
                    setError(`Ошибка с именем игрока: ${response.error}`);
                } else {
                setError(response.error);
                }
            } else {
                navigate('/game');
                useGameStore.getState().setRoom(response.room_id);
                useGameStore.getState().setPlayerName(playerName);
            }
        });
    };

    
    const handleJoinRoom = (room: Room) => {
        if (!playerName.trim()) {
            setError('Введите имя игрока');
            return;
        }

        
        if (playerName.trim().length < 3) {
            setError('Имя игрока должно содержать минимум 3 символа');
            return;
        }

        if (room.hasPassword) {
            
            if (showExpandedServers) {
                setShowExpandedServers(false);
            }
            
            
            setTimeout(() => {
                setSelectedRoom(room);
            }, 100);
        } else {
        joinRoom(room.id);
        }
    };

    
    const joinRoom = (roomId: string, password?: string) => {
        setIsLoading(true);
        setError(null);
        
        
        useGameStore.getState().setGameState({
            board: Array(3).fill(null).map(() => 
                Array(3).fill(null).map(() => 
                    Array(3).fill('')
                )
            ),
            players: [],
            currentPlayer: '',
            winner: null,
            winningLine: null,
            winningLinesX: [],
            winningLinesO: [],
            readyPlayers: [],
            scoreX: 0,
            scoreO: 0,
            isGameOver: false
        });

        
        socket.emit('join_game', { 
            room: roomId, 
            player_name: playerName,
            password
        }, (response: any) => {
            setIsLoading(false);
            
            if (response.error) {
                
                if (response.error.includes('имя уже используется') || 
                    response.error.includes('имя занято') ||
                    response.error.includes('совпадает')) {
                    setError(`Имя "${playerName}" уже используется в этой комнате. Выберите другое имя.`);
                } else if (response.error.includes('пароль')) {
                setError(response.error);
                } else if (response.error.includes('полная') || response.error.includes('заполнена')) {
                    setError('Комната заполнена. Выберите другую комнату или создайте новую.');
            } else {
                    setError(response.error);
                }
                return; 
            } 
            
            
                useGameStore.getState().setRoom(roomId);
                useGameStore.getState().setPlayerName(playerName);
            navigate('/game');
            
            
            setSelectedRoom(null);
        });
    };

    
    const handlePasswordCancel = () => {
        setShowPasswordModal(false);
        setSelectedRoom(null);
        setError(null);
    };

    
    const handleCreateRoomCancel = () => {
        setShowCreateRoomModal(false);
        setError(null);
    };

    return (
        <div className="main-menu-container">
            {}
            <div className="stars-container">
                <div className="stars"></div>
                <div className="stars2"></div>
                <div className="stars3"></div>
            </div>

            <div className="twinkling-stars-container">
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
            </div>
            
            <div className="meteors-container">
                <div className="meteor"></div>
                <div className="meteor"></div>
                <div className="meteor"></div>
                <div className="meteor"></div>
            </div>

            {}
            <div className="menu-container">
                {}
                            <button
                    onClick={toggleRules}
                    className="rules-button"
                >
                    <FontAwesomeIcon icon={faInfoCircle} />
                            </button>
                
                <h2 className="menu-header">Крестики-нолики 3D</h2>

                {}
                <PlayerNameInput 
                    playerName={playerName}
                        onChange={handlePlayerNameChange}
                    />

                {}
                {showCreateRoomModal ? (
                    <CreateRoomForm 
                        onSubmit={handleCreateRoom}
                        onCancel={handleCreateRoomCancel}
                        isLoading={isLoading}
                        error={error}
                    />
                ) : (
                    <>
                        <RoomList 
                            rooms={rooms}
                            searchQuery={searchQuery}
                            onSearchChange={(e) => setSearchQuery(e.target.value)}
                            onRefresh={refreshRooms}
                            onJoinRoom={handleJoinRoom}
                            isLoading={isLoading}
                            onExpand={toggleExpandedServers}
                        />
                        
                        <button className="create-room-button" onClick={() => setShowCreateRoomModal(true)}>
                            <span>Создать комнату</span>
                        </button>
                        
                        <button 
                            className="create-room-button bot-game-button" 
                            onClick={() => {
                                console.log('Переход в игру с ботом, navigate:', typeof navigate);
                                
                                console.log('Текущий путь:', window.location.pathname);
                                try {
                                    console.log('Вызываем navigate с путем /game/bot');
                                    
                                    navigate('/game/bot');
                                    console.log('navigate вызван успешно');
                                    
                                    
                                    if (window.location.pathname !== '/game/bot') {
                                        console.log('Пробуем альтернативный способ');
                                        window.location.href = '/game/bot';
                                    }
                                } catch (error) {
                                    console.error('Ошибка при переходе:', error);
                                    
                                    window.location.href = '/game/bot';
                                }
                            }}
                        >
                            <span>Игра с ботом</span>
                        </button>
                    </>
                )}

                {}
                {error && !showCreateRoomModal && (
                        <div className="error-container">
                                <div className="error-message">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                    {error}
                        </div>
                                </div>
                            )}
                        </div>

            {}
            {showRules && (
                <div className="modal-overlay rules-modal-overlay">
                    <div className="modal-container rules-modal-container">
                        <GameRules />
                        <button
                            onClick={toggleRules}
                            className="close-button rules-close-button"
                            aria-label="Закрыть правила"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>
            )}
            
            {showExpandedServers && (
                <div className="expanded-servers-modal">
                    <div className="expanded-servers-container">
                        <div className="expanded-servers-header">
                            <div className="expanded-servers-title">Доступные комнаты</div>
                            <button className="expanded-servers-close" onClick={toggleExpandedServers}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        
                        <div className="room-search-container">
                            <input
                                type="text"
                                className="room-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Поиск по названию, создателю или ID комнаты..."
                            />
                            <span className="room-search-icon">
                                <FontAwesomeIcon icon={faSearch} />
                            </span>
                        </div>
                        
                        {}
                        {error && (
                            <div className="expanded-error-container">
                                <div className="expanded-error-message">
                                    <span className="error-icon">
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                    </span>
                                    {error}
                                </div>
                            </div>
                        )}
                        
                        <div className="expanded-servers-list">
                            {rooms.length === 0 ? (
                                <div className="no-rooms-message">
                                    Нет доступных комнат. Создайте свою!
                                </div>
                            ) : (
                                rooms
                                    .filter(room => {
                                        const query = searchQuery.toLowerCase().trim();
                                        if (!query) return true;
                                        
                                        const nameMatch = room.name.toLowerCase().includes(query);
                                        const creatorMatch = room.creator.toLowerCase().includes(query);
                                        const idMatch = room.id && room.id.toLowerCase().includes(query);
                                        
                                        console.log(`Expanded: Комната: ${room.name}, ID: ${room.id}, Поиск: ${query}, Совпадение ID: ${idMatch}`);
                                        
                                        return nameMatch || creatorMatch || idMatch;
                                    })
                                    .map((room, index) => (
                                    <div 
                                        key={room.id || index} 
                                        className={`expanded-room-item ${room.hasPassword ? 'has-password' : ''}`}
                                        data-room-id={room.id}
                                        data-room-index={index.toString()}
                                        onClick={() => handleJoinRoom(room)}
                                    >
                                        <div className="expanded-room-container">
                                            <div className="expanded-room-left">
                                                <div className="expanded-room-name">
                                                    <span className="room-name-text">{room.name}</span>
                                                </div>
                                                
                                                <div className="expanded-room-info">
                                                    <div className="room-info-item">
                                                        <span className="room-info-icon">
                                                            <FontAwesomeIcon icon={faUser} />
                                                        </span>
                                                        <span>Создатель: {room.creator}</span>
                                                    </div>
                                                    <div className="room-info-item">
                                                        <span className="room-info-icon">
                                                            <FontAwesomeIcon icon={faUsers} />
                                                        </span>
                                                        <span>Игроков: {room.players}/2</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="expanded-room-right">
                                                {room.hasPassword && (
                                                    <span className="badge badge-password">
                                                        <FontAwesomeIcon icon={faLock} /> с паролем
                                                    </span>
                                                )}
                                                
                                                <div className="expanded-room-status">
                                                    {room.players === 2 ? (
                                                        <span className="badge badge-full">
                                                            <FontAwesomeIcon icon={faTimes} /> Заполнена
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-available">
                                                            <FontAwesomeIcon icon={faCheck} /> Доступна для игры
                                                        </span>
                                                    )}
                                                </div>

                                                <button className="expand-icon" onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    handleJoinRoom(room);
                                                }}>
                                                    <FontAwesomeIcon icon={faExpandAlt} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {}
            {selectedRoom && (
                <PasswordModal 
                    room={selectedRoom}
                    onSubmit={joinRoom}
                    onCancel={handlePasswordCancel}
                    error={error}
                />
            )}
        </div>
    );
} 