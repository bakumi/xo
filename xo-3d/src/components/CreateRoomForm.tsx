import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faExclamationTriangle,
    faTimes,
    faPlus,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';

interface CreateRoomFormProps {
    onSubmit: (roomName: string, password: string) => void;
    onCancel: () => void;
    isLoading: boolean;
    error?: string | null;
}

/**
 * Компонент формы создания новой комнаты
 */
export function CreateRoomForm({ onSubmit, onCancel, isLoading, error }: CreateRoomFormProps) {
    const [roomName, setRoomName] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    
    useEffect(() => {
        if (localError) setLocalError(null);
    }, [roomName, password]);

    const handleSubmit = () => {
        
        if (!roomName.trim()) {
            setLocalError('Введите название комнаты');
            return;
        }
        
        if (roomName.trim().length < 3) {
            setLocalError('Название комнаты должно содержать минимум 3 символа');
            return;
        }

        
        if (!/^[a-zA-Zа-яА-Я0-9 _-]+$/.test(roomName)) {
            setLocalError('Название комнаты может содержать только буквы, цифры, пробелы, дефисы и подчеркивания');
            return;
        }

        onSubmit(roomName, password);
    };

    return (
        <div className="create-room-form">
            <h3 className="form-subtitle">Новая комната</h3>
            <input
                type="text"
                placeholder="Название комнаты (макс. 10 символов)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value.slice(0, 10))}
                className="input-field spacing-field"
                maxLength={10}
                autoFocus
            />
            <input
                type="password"
                placeholder="Пароль (необязательно)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field spacing-field"
            />

            {(localError || error) && (
                <div className="error-container">
                    <div className="error-message">
                        <FontAwesomeIcon icon={faExclamationTriangle} /> {localError || error}
                    </div>
                </div>
            )}

            <div className="button-group">
                <button
                    onClick={onCancel}
                    className="button button-secondary"
                >
                    <FontAwesomeIcon icon={faTimes} /> Отмена
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !roomName.trim()}
                    className="button button-primary"
                >
                    {isLoading ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} spin /> Создание...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faPlus} /> Создать
                        </>
                    )}
                </button>
            </div>
        </div>
    );
} 