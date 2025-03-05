import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { socket } from '../services/socket';

interface Room {
    name: string;
    creator: string;
    players: number;
    id: string;
    hasPassword: boolean;
}

export function MainMenu() {
    const navigate = useNavigate();
    const [roomName, setRoomName] = useState('');
    const [playerName, setPlayerName] = useState(() => {
        // Пытаемся загрузить имя из localStorage при инициализации
        const savedName = localStorage.getItem('playerName');
        return savedName || '';
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [isExpandedView, setIsExpandedView] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [password, setPassword] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsExpandedView(false);
            setIsClosing(false);
        }, 200);
    };

    const filteredRooms = rooms.filter(room => 
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        socket.emit('get_rooms');

        socket.on('rooms_update', (updatedRooms: Room[]) => {
            setRooms(updatedRooms);
        });

        return () => {
            socket.off('rooms_update');
        };
    }, []);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleCreateRoom = () => {
        if (!playerName.trim()) {
            setError('Пожалуйста, введите ваше имя');
            return;
        }
        if (!roomName.trim()) {
            setError('Пожалуйста, введите название комнаты');
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
            readyPlayers: []
        });

        socket.emit('create_room', { 
            room_name: roomName, 
            player_name: playerName,
            password: password.trim() || null
        }, (response: any) => {
            if (response.error) {
                setError(response.error);
                setIsLoading(false);
            } else {
                navigate('/game');
                useGameStore.getState().setRoom(response.room_id);
                useGameStore.getState().setPlayerName(playerName);
            }
        });
    };

    const handleJoinRoom = (room: Room) => {
        if (!playerName.trim()) {
            setError('Пожалуйста, введите ваше имя');
            return;
        }

        if (room.hasPassword) {
            setSelectedRoom(room);
            return;
        }

        joinRoom(room.id);
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
            readyPlayers: []
        });

        socket.emit('join_game', { 
            room: roomId, 
            player_name: playerName,
            password
        }, (response: any) => {
            if (response.error) {
                setError(response.error);
                setIsLoading(false);
                if (response.error === 'Неверный пароль') {
                    setJoinPassword('');
                }
            } else {
                navigate('/game');
                useGameStore.getState().setRoom(roomId);
                useGameStore.getState().setPlayerName(playerName);
            }
        });
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

    // Сохраняем имя в localStorage при его изменении
    const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setPlayerName(newName);
        localStorage.setItem('playerName', newName);
        if (error === 'Пожалуйста, введите ваше имя') {
            setError(null);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            minHeight: '100vh'
        }}>
            <style>
                {`
                    @keyframes fadeSlideUp {
                        0% {
                            opacity: 0;
                            transform: translateY(20px) scale(0.95);
                        }
                        100% {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }

                    @keyframes gradientBG {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }

                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.02); }
                        100% { transform: scale(1); }
                    }

                    .input-field {
                        width: 100%;
                        padding: 14px 18px;
                        background: rgba(255, 255, 255, 0.07);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                        color: white;
                        font-size: 16px;
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        outline: none;
                        backdrop-filter: blur(10px);
                    }

                    .input-field:focus {
                        border-color: rgba(99, 102, 241, 0.6);
                        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25);
                        background: rgba(255, 255, 255, 0.12);
                    }

                    .input-field::placeholder {
                        color: rgba(255, 255, 255, 0.5);
                    }

                    .room-list {
                        max-height: 300px;
                        overflow-y: auto;
                        margin: 24px 0;
                        padding-right: 12px;
                    }

                    .room-list::-webkit-scrollbar {
                        width: 6px;
                    }

                    .room-list::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 8px;
                    }

                    .room-list::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 8px;
                    }

                    .room-list::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.25);
                    }

                    .room-item {
                        background: rgba(255, 255, 255, 0.07);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                        padding: 20px;
                        margin-bottom: 12px;
                        cursor: pointer;
                        backdrop-filter: blur(10px);
                        position: relative;
                        overflow: hidden;
                    }

                    @keyframes roomAppear {
                        0% {
                            opacity: 0;
                            transform: scale(0.95) translateY(10px);
                        }
                        100% {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }

                    .room-item:hover {
                        background: rgba(255, 255, 255, 0.12);
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                    }

                    .room-item::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.03), transparent);
                        transform: translateX(-100%);
                        transition: transform 0.6s;
                    }

                    .room-item:hover {
                        background: rgba(255, 255, 255, 0.12);
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                    }

                    .room-item:hover::before {
                        transform: translateX(100%);
                    }

                    .button {
                        position: relative;
                        overflow: hidden;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 12px 24px;
                        border-radius: 12px;
                        color: #fff;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.4s ease;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    }

                    .button::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(
                            circle at center,
                            rgba(10, 10, 31, 0.95) 30%,
                            rgba(10, 10, 31, 0.8) 50%,
                            transparent 70%
                        );
                        transform: translate(-50%, -50%) scale(0);
                        transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                        z-index: 1;
                    }

                    .button:hover::before {
                        transform: translate(0, 0) scale(2);
                    }

                    .button::after {
                        content: '';
                        position: absolute;
                        inset: 0;
                        background: linear-gradient(90deg, 
                            transparent, 
                            rgba(99, 102, 241, 0.2),
                            rgba(99, 102, 241, 0.4),
                            rgba(99, 102, 241, 0.2),
                            transparent
                        );
                        transform: translateX(-100%) skewX(-25deg);
                        transition: transform 0.7s ease;
                        z-index: 2;
                    }

                    .button:hover::after {
                        transform: translateX(100%) skewX(-25deg);
                    }

                    @keyframes cosmicPulse {
                        0%, 100% { 
                            box-shadow: 0 0 15px rgba(99, 102, 241, 0.3),
                                       0 0 30px rgba(99, 102, 241, 0.2),
                                       0 0 45px rgba(99, 102, 241, 0.1);
                        }
                        50% { 
                            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4),
                                       0 0 40px rgba(99, 102, 241, 0.3),
                                       0 0 60px rgba(99, 102, 241, 0.2);
                        }
                    }

                    .button:hover {
                        transform: translateY(-2px);
                        animation: cosmicPulse 2s infinite;
                        border-color: rgba(99, 102, 241, 0.4);
                    }

                    @keyframes starTwinkle {
                        0%, 100% { 
                            opacity: 0; 
                            transform: scale(0) rotate(0deg); 
                        }
                        50% { 
                            opacity: 1; 
                            transform: scale(1) rotate(180deg); 
                        }
                    }

                    .button .star {
                        position: absolute;
                        width: 2px;
                        height: 2px;
                        background: #fff;
                        border-radius: 50%;
                        opacity: 0;
                        z-index: 3;
                        box-shadow: 0 0 4px #fff,
                                    0 0 8px #fff;
                    }

                    .button:hover .star {
                        animation: starTwinkle 1.5s infinite;
                    }

                    .button:hover .star:nth-child(1) { top: 20%; left: 15%; animation-delay: 0.1s; }
                    .button:hover .star:nth-child(2) { top: 35%; left: 35%; animation-delay: 0.3s; }
                    .button:hover .star:nth-child(3) { top: 65%; left: 60%; animation-delay: 0.2s; }
                    .button:hover .star:nth-child(4) { top: 45%; left: 85%; animation-delay: 0.4s; }
                    .button:hover .star:nth-child(5) { top: 75%; left: 25%; animation-delay: 0.5s; }

                    .button span {
                        position: relative;
                        z-index: 4;
                        background: linear-gradient(90deg, #fff, #f0f0ff);
                        -webkit-background-clip: text;
                        background-clip: text;
                        color: transparent;
                        transition: all 0.3s ease;
                    }

                    .button:hover span {
                        letter-spacing: 1px;
                        text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
                    }

                    .button-primary {
                        background: linear-gradient(135deg, rgba(79, 70, 229, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%);
                    }

                    .button-secondary {
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
                        backdrop-filter: blur(10px);
                    }

                    .button-secondary:hover {
                        transform: translateY(-2px);
                        animation: cosmicPulse 2s infinite;
                        border-color: rgba(255, 255, 255, 0.4);
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
                    }

                    .button-secondary::before {
                        background: radial-gradient(
                            circle at center,
                            rgba(255, 255, 255, 0.15) 30%,
                            rgba(255, 255, 255, 0.1) 50%,
                            transparent 70%
                        );
                    }

                    .button-secondary::after {
                        background: linear-gradient(90deg, 
                            transparent, 
                            rgba(255, 255, 255, 0.2),
                            rgba(255, 255, 255, 0.4),
                            rgba(255, 255, 255, 0.2),
                            transparent
                        );
                    }

                    .button-secondary:hover .star {
                        box-shadow: 0 0 4px rgba(255, 255, 255, 0.8),
                                    0 0 8px rgba(255, 255, 255, 0.6);
                    }

                    .button-secondary span {
                        background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
                        -webkit-background-clip: text;
                        background-clip: text;
                        color: transparent;
                    }

                    .error-message {
                        animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                    }

                    @keyframes shake {
                        10%, 90% { transform: translateX(-1px); }
                        20%, 80% { transform: translateX(2px); }
                        30%, 50%, 70% { transform: translateX(-4px); }
                        40%, 60% { transform: translateX(4px); }
                    }

                    .expand-button {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    }

                    .expand-button:hover {
                        background: rgba(255, 255, 255, 0.15);
                        border-color: rgba(255, 255, 255, 0.3);
                    }

                    .expanded-container {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(8px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        animation: ${isClosing ? 'fadeOut 0.2s ease forwards' : 'fadeIn 0.2s ease'};
                        padding: 20px;
                    }

                    .expanded-content {
                        width: 90%;
                        max-width: 900px;
                        max-height: 85vh;
                        background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98));
                        border-radius: 24px;
                        padding: 28px;
                        position: relative;
                        animation: ${isClosing ? 'expandOut 0.2s ease forwards' : 'expandIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'};
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);
                        overflow: hidden;
                    }

                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }

                    @keyframes expandOut {
                        from { 
                            opacity: 1;
                            transform: scale(1);
                        }
                        to { 
                            opacity: 0;
                            transform: scale(0.95);
                        }
                    }

                    .expanded-rooms {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 16px;
                        overflow-y: auto;
                        max-height: calc(85vh - 160px);
                        padding: 4px;
                        margin: -4px;
                    }

                    .expanded-rooms::-webkit-scrollbar {
                        width: 6px;
                    }

                    .expanded-rooms::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 4px;
                    }

                    .expanded-rooms::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 4px;
                    }

                    .expanded-rooms::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }

                    .room-list::-webkit-scrollbar {
                        width: 6px;
                    }

                    .room-list::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 4px;
                    }

                    .room-list::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 4px;
                    }

                    .room-list::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }

                    .expanded-rooms .room-item {
                        opacity: 0;
                        background: rgba(255, 255, 255, 0.07);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                        padding: 20px;
                        cursor: pointer;
                        backdrop-filter: blur(10px);
                        position: relative;
                        overflow: hidden;
                        animation: roomAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        transform-origin: center;
                        transition: opacity 0.2s ease-out, transform 0.2s ease-out;
                    }

                    .room-item {
                        background: rgba(255, 255, 255, 0.07);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                        padding: 20px;
                        margin-bottom: 12px;
                        cursor: pointer;
                        backdrop-filter: blur(10px);
                        position: relative;
                        overflow: hidden;
                    }

                    @keyframes roomAppear {
                        0% {
                            opacity: 0;
                            transform: scale(0.95) translateY(10px);
                        }
                        100% {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }

                    .room-item:hover {
                        background: rgba(255, 255, 255, 0.12);
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                    }

                    .search-transition {
                        transition: opacity 0.2s ease-out, transform 0.2s ease-out;
                    }

                    .search-transition.fade-out {
                        opacity: 0;
                        transform: scale(0.95);
                    }

                    .close-button {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: none;
                        border: none;
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 22px;
                        cursor: pointer;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 8px;
                        transition: all 0.2s ease;
                    }

                    .close-button:hover {
                        background: rgba(255, 255, 255, 0.1);
                        color: rgba(255, 255, 255, 0.9);
                    }

                    .search-container {
                        margin-bottom: 24px;
                        position: relative;
                    }

                    .search-icon {
                        position: absolute;
                        left: 16px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: rgba(255, 255, 255, 0.5);
                        pointer-events: none;
                    }

                    .error-message {
                        animation: errorSlideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        transform-origin: top;
                    }

                    @keyframes errorSlideDown {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .error-container {
                        overflow: hidden;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        height: ${error ? '60px' : '0px'};
                        opacity: ${error ? '1' : '0'};
                        margin-top: ${error ? '24px' : '0px'};
                    }

                    .error-message {
                        animation: errorSlideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        transform-origin: top;
                        color: #ef4444;
                        font-size: 14px;
                        text-align: center;
                        padding: 12px 16px;
                        background-color: rgba(239, 68, 68, 0.1);
                        border-radius: 12px;
                        border: 1px solid rgba(239, 68, 68, 0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }

                    @keyframes errorSlideDown {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .search-transition {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .expand-icon-button:hover, .refresh-button:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }
                    .expand-icon-button:hover svg, .refresh-button:hover svg {
                        stroke: rgba(255, 255, 255, 0.9);
                    }
                    
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    
                    .refresh-button svg {
                        transition: all 0.2s ease;
                    }
                    
                    .refresh-button.spinning svg {
                        animation: spin 0.5s ease;
                    }

                    .constellation {
                        position: fixed;
                        inset: 0;
                        z-index: 0;
                        overflow: hidden;
                    }

                    .star {
                        position: absolute;
                        background: white;
                        border-radius: 50%;
                        animation: twinkle 1s infinite ease-in-out alternate;
                    }

                    .constellation-line {
                        position: absolute;
                        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
                        height: 1px;
                        transform-origin: left center;
                        animation: fadeInOut 3s infinite ease-in-out;
                    }

                    @keyframes twinkle {
                        0% { opacity: 0.3; }
                        100% { opacity: 1; }
                    }

                    @keyframes fadeInOut {
                        0%, 100% { opacity: 0.1; }
                        50% { opacity: 0.3; }
                    }
                `}
            </style>

            <div className="constellation">
                {/* Большая Медведица (ковш) */}
                <div className="star" style={{ top: '20%', left: '10%', width: '2px', height: '2px', animationDelay: '0s' }} />
                <div className="star" style={{ top: '22%', left: '13%', width: '2px', height: '2px', animationDelay: '0.3s' }} />
                <div className="star" style={{ top: '24%', left: '16%', width: '2px', height: '2px', animationDelay: '0.6s' }} />
                <div className="star" style={{ top: '26%', left: '19%', width: '2px', height: '2px', animationDelay: '0.9s' }} />
                <div className="star" style={{ top: '24%', left: '22%', width: '2px', height: '2px', animationDelay: '1.2s' }} />
                <div className="star" style={{ top: '21%', left: '21%', width: '2px', height: '2px', animationDelay: '1.5s' }} />
                <div className="star" style={{ top: '18%', left: '20%', width: '2px', height: '2px', animationDelay: '1.8s' }} />
                <div className="constellation-line" style={{ top: '21%', left: '10%', width: '70px', transform: 'rotate(15deg)' }} />
                <div className="constellation-line" style={{ top: '23%', left: '13%', width: '70px', transform: 'rotate(15deg)' }} />
                <div className="constellation-line" style={{ top: '25%', left: '16%', width: '70px', transform: 'rotate(15deg)' }} />
                <div className="constellation-line" style={{ top: '25%', left: '19%', width: '50px', transform: 'rotate(-15deg)' }} />
                <div className="constellation-line" style={{ top: '22.5%', left: '21%', width: '40px', transform: 'rotate(-45deg)' }} />
                <div className="constellation-line" style={{ top: '19.5%', left: '20%', width: '40px', transform: 'rotate(-75deg)' }} />

                {/* Малая Медведица */}
                <div className="star" style={{ top: '10%', left: '30%', width: '2px', height: '2px', animationDelay: '0.2s' }} />
                <div className="star" style={{ top: '12%', left: '32%', width: '2px', height: '2px', animationDelay: '0.5s' }} />
                <div className="star" style={{ top: '14%', left: '34%', width: '2px', height: '2px', animationDelay: '0.8s' }} />
                <div className="star" style={{ top: '16%', left: '36%', width: '2px', height: '2px', animationDelay: '1.1s' }} />
                <div className="star" style={{ top: '15%', left: '38%', width: '2px', height: '2px', animationDelay: '1.4s' }} />
                <div className="star" style={{ top: '13%', left: '37%', width: '2px', height: '2px', animationDelay: '1.7s' }} />
                <div className="star" style={{ top: '11%', left: '36%', width: '2px', height: '2px', animationDelay: '2.0s' }} />
                <div className="constellation-line" style={{ top: '11%', left: '30%', width: '50px', transform: 'rotate(15deg)' }} />
                <div className="constellation-line" style={{ top: '13%', left: '32%', width: '50px', transform: 'rotate(15deg)' }} />
                <div className="constellation-line" style={{ top: '15%', left: '34%', width: '50px', transform: 'rotate(15deg)' }} />
                <div className="constellation-line" style={{ top: '15.5%', left: '36%', width: '30px', transform: 'rotate(-15deg)' }} />
                <div className="constellation-line" style={{ top: '13.5%', left: '37%', width: '30px', transform: 'rotate(-45deg)' }} />
                <div className="constellation-line" style={{ top: '11.5%', left: '36%', width: '30px', transform: 'rotate(-75deg)' }} />

                {/* Орион */}
                <div className="star" style={{ top: '50%', left: '60%', width: '2px', height: '2px', animationDelay: '0.4s' }} />
                <div className="star" style={{ top: '53%', left: '62%', width: '2px', height: '2px', animationDelay: '0.7s' }} />
                <div className="star" style={{ top: '56%', left: '64%', width: '2px', height: '2px', animationDelay: '1.0s' }} />
                <div className="star" style={{ top: '54%', left: '58%', width: '2px', height: '2px', animationDelay: '1.3s' }} />
                <div className="star" style={{ top: '54%', left: '66%', width: '2px', height: '2px', animationDelay: '1.6s' }} />
                <div className="star" style={{ top: '48%', left: '63%', width: '2px', height: '2px', animationDelay: '1.9s' }} />
                <div className="star" style={{ top: '58%', left: '63%', width: '2px', height: '2px', animationDelay: '2.2s' }} />
                <div className="constellation-line" style={{ top: '51.5%', left: '60%', width: '60px', transform: 'rotate(15deg)' }} />
                <div className="constellation-line" style={{ top: '54.5%', left: '62%', width: '60px', transform: 'rotate(15deg)' }} />
                <div className="constellation-line" style={{ top: '54%', left: '58%', width: '80px', transform: 'rotate(0deg)' }} />
                <div className="constellation-line" style={{ top: '49%', left: '63%', width: '40px', transform: 'rotate(90deg)' }} />
                <div className="constellation-line" style={{ top: '54%', left: '63%', width: '40px', transform: 'rotate(90deg)' }} />

                {/* Кассиопея (W-образная форма) */}
                <div className="star" style={{ top: '30%', left: '80%', width: '2px', height: '2px', animationDelay: '0.3s' }} />
                <div className="star" style={{ top: '32%', left: '83%', width: '2px', height: '2px', animationDelay: '0.6s' }} />
                <div className="star" style={{ top: '30%', left: '86%', width: '2px', height: '2px', animationDelay: '0.9s' }} />
                <div className="star" style={{ top: '32%', left: '89%', width: '2px', height: '2px', animationDelay: '1.2s' }} />
                <div className="star" style={{ top: '30%', left: '92%', width: '2px', height: '2px', animationDelay: '1.5s' }} />
                <div className="constellation-line" style={{ top: '31%', left: '80%', width: '40px', transform: 'rotate(15deg)' }} />
                <div className="constellation-line" style={{ top: '31%', left: '83%', width: '40px', transform: 'rotate(-15deg)' }} />
                <div className="constellation-line" style={{ top: '31%', left: '86%', width: '40px', transform: 'rotate(15deg)' }} />
                <div className="constellation-line" style={{ top: '31%', left: '89%', width: '40px', transform: 'rotate(-15deg)' }} />

                {/* Дополнительные звезды для фона */}
                <div className="star" style={{ top: '5%', left: '25%', width: '1px', height: '1px', animationDelay: '0.1s' }} />
                <div className="star" style={{ top: '35%', left: '35%', width: '1px', height: '1px', animationDelay: '0.4s' }} />
                <div className="star" style={{ top: '65%', left: '45%', width: '1px', height: '1px', animationDelay: '0.7s' }} />
                <div className="star" style={{ top: '15%', left: '55%', width: '1px', height: '1px', animationDelay: '1.0s' }} />
                <div className="star" style={{ top: '45%', left: '85%', width: '1px', height: '1px', animationDelay: '1.3s' }} />
                <div className="star" style={{ top: '75%', left: '95%', width: '1px', height: '1px', animationDelay: '1.6s' }} />
                <div className="star" style={{ top: '25%', left: '65%', width: '1px', height: '1px', animationDelay: '1.9s' }} />
                <div className="star" style={{ top: '55%', left: '5%', width: '1px', height: '1px', animationDelay: '2.2s' }} />
                <div className="star" style={{ top: '85%', left: '75%', width: '1px', height: '1px', animationDelay: '2.5s' }} />
                <div className="star" style={{ top: '95%', left: '35%', width: '1px', height: '1px', animationDelay: '2.8s' }} />
                <div className="star" style={{ top: '40%', left: '15%', width: '1px', height: '1px', animationDelay: '3.1s' }} />
                <div className="star" style={{ top: '60%', left: '55%', width: '1px', height: '1px', animationDelay: '3.4s' }} />
                <div className="star" style={{ top: '30%', left: '95%', width: '1px', height: '1px', animationDelay: '3.7s' }} />
                <div className="star" style={{ top: '80%', left: '45%', width: '1px', height: '1px', animationDelay: '4.0s' }} />
                <div className="star" style={{ top: '10%', left: '85%', width: '1px', height: '1px', animationDelay: '4.3s' }} />
                <div className="star" style={{ top: '70%', left: '30%', width: '1px', height: '1px', animationDelay: '4.6s' }} />
                <div className="star" style={{ top: '20%', left: '70%', width: '1px', height: '1px', animationDelay: '4.9s' }} />
                <div className="star" style={{ top: '90%', left: '60%', width: '1px', height: '1px', animationDelay: '5.2s' }} />
                <div className="star" style={{ top: '15%', left: '40%', width: '1px', height: '1px', animationDelay: '5.5s' }} />
                <div className="star" style={{ top: '50%', left: '80%', width: '1px', height: '1px', animationDelay: '5.8s' }} />
                <div className="star" style={{ top: '82%', left: '12%', width: '1px', height: '1px', animationDelay: '6.1s' }} />
                <div className="star" style={{ top: '45%', left: '22%', width: '1px', height: '1px', animationDelay: '6.4s' }} />
                <div className="star" style={{ top: '33%', left: '88%', width: '1px', height: '1px', animationDelay: '6.7s' }} />
                <div className="star" style={{ top: '78%', left: '67%', width: '1px', height: '1px', animationDelay: '7.0s' }} />
                <div className="star" style={{ top: '8%', left: '45%', width: '1px', height: '1px', animationDelay: '7.3s' }} />
                <div className="star" style={{ top: '92%', left: '82%', width: '1px', height: '1px', animationDelay: '7.6s' }} />
                <div className="star" style={{ top: '28%', left: '7%', width: '1px', height: '1px', animationDelay: '7.9s' }} />
                <div className="star" style={{ top: '67%', left: '93%', width: '1px', height: '1px', animationDelay: '8.2s' }} />
                <div className="star" style={{ top: '38%', left: '48%', width: '1px', height: '1px', animationDelay: '8.5s' }} />
                <div className="star" style={{ top: '88%', left: '23%', width: '1px', height: '1px', animationDelay: '8.8s' }} />
                <div className="star" style={{ top: '12%', left: '73%', width: '1px', height: '1px', animationDelay: '9.1s' }} />
                <div className="star" style={{ top: '62%', left: '33%', width: '1px', height: '1px', animationDelay: '9.4s' }} />
                <div className="star" style={{ top: '42%', left: '92%', width: '1px', height: '1px', animationDelay: '9.7s' }} />
                <div className="star" style={{ top: '72%', left: '52%', width: '1px', height: '1px', animationDelay: '10.0s' }} />
                <div className="star" style={{ top: '22%', left: '32%', width: '1px', height: '1px', animationDelay: '10.3s' }} />
                <div className="star" style={{ top: '52%', left: '72%', width: '1px', height: '1px', animationDelay: '10.6s' }} />
                <div className="star" style={{ top: '18%', left: '88%', width: '1px', height: '1px', animationDelay: '10.9s' }} />
                <div className="star" style={{ top: '48%', left: '28%', width: '1px', height: '1px', animationDelay: '11.2s' }} />
                <div className="star" style={{ top: '58%', left: '78%', width: '1px', height: '1px', animationDelay: '11.5s' }} />
                <div className="star" style={{ top: '98%', left: '48%', width: '1px', height: '1px', animationDelay: '11.8s' }} />
                <div className="star" style={{ top: '3%', left: '63%', width: '1px', height: '1px', animationDelay: '12.1s' }} />
                <div className="star" style={{ top: '83%', left: '83%', width: '1px', height: '1px', animationDelay: '12.4s' }} />
                <div className="star" style={{ top: '73%', left: '13%', width: '1px', height: '1px', animationDelay: '12.7s' }} />
                <div className="star" style={{ top: '93%', left: '93%', width: '1px', height: '1px', animationDelay: '13.0s' }} />
            </div>

            {isExpandedView && (
                <div className="expanded-container" onClick={(e) => {
                    if (e.target === e.currentTarget) handleClose();
                }}>
                    <div className="expanded-content">
                        <button 
                            className="close-button"
                            onClick={handleClose}
                        >
                            ✕
                        </button>

                        <h2 style={{
                            color: 'white',
                            fontSize: '24px',
                            marginBottom: '24px',
                            textAlign: 'center',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px'
                        }}>
                            Доступные комнаты
                            <button
                                onClick={handleRefreshRooms}
                                className="refresh-button"
                                title="Обновить список"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="rgba(255, 255, 255, 0.7)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <path d="M21 2v6h-6" />
                                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                    <path d="M3 22v-6h6" />
                                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                                </svg>
                            </button>
                        </h2>

                        <div className="search-container">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Поиск по названию, создателю или ID комнаты..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field"
                                style={{
                                    paddingLeft: '48px'
                                }}
                                autoFocus
                            />
                        </div>

                        <div className="expanded-rooms">
                            {filteredRooms.length === 0 ? (
            <div style={{
                                    gridColumn: '1 / -1',
                                    textAlign: 'center',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    padding: '32px',
                                    animation: 'roomAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}>
                                    {searchQuery ? 'Комнаты не найдены' : 'Нет доступных комнат'}
                                </div>
                            ) : (
                                filteredRooms.map((room, index) => (
                                    <div
                                        key={room.id}
                                        className="room-item search-transition"
                                        onClick={() => {
                                            handleJoinRoom(room);
                                            handleClose();
                                        }}
                                        style={{
                                            animationDelay: `${index * 0.05}s`,
                                            opacity: 0,
                                            animation: `roomAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s forwards`
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px'
                                        }}>
                                            <span style={{
                                                color: 'white',
                                                fontSize: '18px',
                                                fontWeight: '600'
                                            }}>
                                                {room.name}
                                            </span>
                                            <span style={{
                                                color: room.players === 2 ? '#ef4444' : '#10b981',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                padding: '4px 12px',
                                                background: room.players === 2 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                borderRadius: '20px'
                                            }}>
                                                {room.players}/2 игроков
                                            </span>
                                        </div>
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <span style={{ opacity: 0.7 }}>👤</span>
                                            Создатель: {room.creator}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для ввода пароля при входе в комнату */}
            {selectedRoom && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
                borderRadius: '24px',
                        padding: '32px',
                        width: '90%',
                        maxWidth: '400px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <h3 style={{
                            color: 'white',
                            fontSize: '24px',
                            marginBottom: '24px',
                            textAlign: 'center'
                        }}>
                            Введите пароль
                        </h3>
                        <input
                            type="password"
                            value={joinPassword}
                            onChange={(e) => setJoinPassword(e.target.value)}
                            placeholder="Пароль комнаты"
                            className="input-field"
                            style={{ marginBottom: '24px' }}
                            autoFocus
                        />
                        <div style={{
                            display: 'flex',
                            gap: '16px'
                        }}>
                            <button
                                onClick={() => {
                                    setSelectedRoom(null);
                                    setJoinPassword('');
                                }}
                                className="button button-secondary"
                                style={{ flex: 1 }}
                            >
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <span>Назад</span>
                            </button>
                            <button
                                onClick={() => {
                                    joinRoom(selectedRoom.id, joinPassword);
                                    setSelectedRoom(null);
                                    setJoinPassword('');
                                }}
                                className="button button-primary"
                                style={{ flex: 1 }}
                            >
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <span>{isLoading ? 'Создание...' : 'Создать комнату'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                width: '100%',
                maxWidth: '650px',
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                backdropFilter: 'blur(20px)',
                borderRadius: '28px',
                padding: '48px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                animation: 'fadeSlideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <h1 style={{
                    margin: '0 0 12px 0',
                    color: 'white',
                    fontSize: '40px',
                    fontWeight: '700',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #60a5fa, #34d399, #60a5fa)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'gradientBG 6s ease infinite'
                }}>
                    Крестики-нолики 3D
                </h1>

                <p style={{
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '32px',
                    fontSize: '16px'
                }}>
                    Погрузитесь в классическую игру в новом измерении
                </p>

                <div style={{ marginTop: '32px' }}>
                    <input
                        type="text"
                        placeholder="Ваше имя"
                        value={playerName}
                        onChange={handlePlayerNameChange}
                        className="input-field"
                        style={{ marginBottom: '16px' }}
                    />
                </div>

                {isCreatingRoom ? (
                    <div style={{ marginTop: '24px' }}>
                        <input
                            type="text"
                            placeholder="Название комнаты"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="input-field"
                            style={{ marginBottom: '16px' }}
                        />
                        <input
                            type="password"
                            placeholder="Пароль (необязательно)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            style={{ marginBottom: '24px' }}
                        />

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={() => {
                                    setIsCreatingRoom(false);
                                    setPassword('');
                                }}
                                className="button button-secondary"
                                style={{ flex: 1 }}
                            >
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <span>Назад</span>
                            </button>
                            <button
                                onClick={handleCreateRoom}
                                disabled={isLoading}
                                className="button button-primary"
                                style={{ flex: 1 }}
                            >
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <div className="star"></div>
                                <span>{isLoading ? 'Создание...' : 'Создать комнату'}</span>
                            </button>
                        </div>

                        <div className="error-container">
                            {error && (
                                <div className="error-message">
                                    <span style={{ fontSize: '16px' }}>⚠️</span>
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                fontSize: '18px',
                                color: 'white',
                                fontWeight: '500'
                            }}>
                                Доступные комнаты
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '8px'
                            }}>
                                <button
                                    onClick={handleRefreshRooms}
                                    className="refresh-button"
                                    title="Обновить список"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="rgba(255, 255, 255, 0.7)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <path d="M21 2v6h-6" />
                                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                        <path d="M3 22v-6h6" />
                                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!playerName.trim()) {
                                            setError('Пожалуйста, введите ваше имя');
                                            return;
                                        }
                                        setIsExpandedView(true);
                                    }}
                                    className="expand-icon-button"
                                    title="Расширенный просмотр"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="rgba(255, 255, 255, 0.7)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <style>
                            {`
                                .expand-icon-button:hover, .refresh-button:hover {
                                    background: rgba(255, 255, 255, 0.1);
                                }
                                .expand-icon-button:hover svg, .refresh-button:hover svg {
                                    stroke: rgba(255, 255, 255, 0.9);
                                }
                                
                                @keyframes spin {
                                    from { transform: rotate(0deg); }
                                    to { transform: rotate(360deg); }
                                }
                                
                                .refresh-button svg {
                                    transition: all 0.2s ease;
                                }
                                
                                .refresh-button.spinning svg {
                                    animation: spin 0.5s ease;
                                }
                            `}
                        </style>

                        <div className="room-list">
                            {rooms.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    padding: '32px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '16px',
                                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                                }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎮</div>
                                    Нет доступных комнат
                                </div>
                            ) : (
                                rooms.map(room => (
                                    <div
                                        key={room.id}
                                        className="room-item"
                                        onClick={() => handleJoinRoom(room)}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px'
                                        }}>
                                            <span style={{
                                                color: 'white',
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                {room.name}
                                                {room.hasPassword && (
                                                    <span style={{ opacity: 0.7 }}>🔒</span>
                                                )}
                                            </span>
                                            <span style={{
                                                color: room.players === 2 ? '#ef4444' : '#10b981',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                padding: '4px 12px',
                                                background: room.players === 2 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                borderRadius: '20px'
                                            }}>
                                                {room.players}/2 игроков
                                            </span>
                                        </div>
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <span style={{ opacity: 0.7 }}>👤</span>
                                            Создатель: {room.creator}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setIsCreatingRoom(true)}
                            className="button button-primary"
                            style={{ width: '100%' }}
                        >
                            <div className="star"></div>
                            <div className="star"></div>
                            <div className="star"></div>
                            <div className="star"></div>
                            <div className="star"></div>
                            <span>Создать комнату</span>
                        </button>

                        <div className="error-container">
                {error && (
                                <div className="error-message">
                                    <span style={{ fontSize: '16px' }}>⚠️</span>
                        {error}
                    </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 