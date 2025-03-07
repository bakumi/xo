import React from 'react';
import { Room } from '../types/game';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faLock, 
    faCheck, 
    faTimes, 
    faSyncAlt, 
    faExpandAlt,
    faSearch
} from '@fortawesome/free-solid-svg-icons';

interface RoomListProps {
    rooms: Room[];
    searchQuery: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRefresh: () => void;
    onJoinRoom: (room: Room) => void;
    isLoading: boolean;
    onExpand: () => void;
}

/**
 * Компонент для отображения списка доступных комнат
 */
export function RoomList({
    rooms,
    searchQuery,
    onSearchChange,
    onRefresh,
    onJoinRoom,
    isLoading,
    onExpand
}: RoomListProps) {
    
    console.log("Доступные комнаты с ID:", rooms.map(room => `${room.name} (ID: ${room.id})`));
    
    const filteredRooms = rooms
        .filter(room => {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return true;
            
            const nameMatch = room.name.toLowerCase().includes(query);
            const creatorMatch = room.creator.toLowerCase().includes(query);
            const idMatch = room.id && room.id.toLowerCase().includes(query);
            
            console.log(`Комната: ${room.name}, ID: ${room.id}, Поиск: ${query}, Совпадение ID: ${idMatch}`);
            
            return nameMatch || creatorMatch || idMatch;
        });

    return (
        <div>
            <div className="room-list-header">
                <div className="room-list-title-container">
                    <h3 className="room-list-title">Доступные комнаты</h3>
                </div>
                <div className="room-list-actions">
                    <button 
                        className="expand-list-button" 
                        onClick={onExpand}
                        title="Расширенный просмотр комнат"
                    >
                        <FontAwesomeIcon icon={faExpandAlt} />
                    </button>
                    <button 
                        className="refresh-button" 
                        onClick={onRefresh}
                        disabled={isLoading}
                        title="Обновить список комнат"
                    >
                        <FontAwesomeIcon icon={faSyncAlt} />
                    </button>
                </div>
            </div>
            
            <div className="room-search-container">
                <span className="room-search-icon">
                    <FontAwesomeIcon icon={faSearch} />
                </span>
                <input
                    type="text"
                    placeholder="Поиск по названию, создателю или ID..."
                    value={searchQuery}
                    onChange={onSearchChange}
                    className="room-search-input"
                />
            </div>
            
            <div className="room-list">
                {isLoading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <div className="loading-text">Загрузка комнат...</div>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="no-rooms-message">
                        Нет доступных комнат. Создайте свою!
                    </div>
                ) : (
                    filteredRooms.map((room, idx) => (
                        <div
                            key={room.id || idx}
                            className={`room-item ${room.hasPassword ? 'has-password' : ''}`}
                            onClick={() => onJoinRoom(room)}
                        >
                            <div className="room-name">
                                <span className="room-title">{room.name}</span>
                                {room.hasPassword && (
                                    <span className="badge badge-password">
                                        <FontAwesomeIcon icon={faLock} /> с паролем
                                    </span>
                                )}
                            </div>
                            <div className="room-meta">
                                <span className="room-creator">
                                    <FontAwesomeIcon icon={faUser} /> Создатель: {room.creator}
                                </span>
                                <div className="room-status">
                                    {room.players === 2 ? (
                                        <span className="badge badge-full">
                                            <FontAwesomeIcon icon={faTimes} /> Заполнена
                                        </span>
                                    ) : (
                                        <span className="badge badge-available">
                                            <FontAwesomeIcon icon={faCheck} /> Доступна ({room.players}/2)
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="room-id">
                                ID: <span className="room-id-value">{room.id}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
} 