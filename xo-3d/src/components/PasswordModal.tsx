import React, { useState, useEffect, useRef } from 'react';
import { Room } from '../types/game';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faKey } from '@fortawesome/free-solid-svg-icons';

/**
 * Интерфейс для пропсов компонента PasswordModal
 */
interface PasswordModalProps {
    room: Room;
    onSubmit: (roomId: string, password: string) => void;
    onCancel: () => void;
    error: string | null;
}

/**
 * Модальное окно для ввода пароля перед входом в комнату
 */
export function PasswordModal({ room, onSubmit, onCancel, error }: PasswordModalProps) {
    const [password, setPassword] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSubmit = () => {
        onSubmit(room.id, password);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="password-modal-overlay" onClick={onCancel}>
            <div className="password-modal-wrapper" onClick={(e) => e.stopPropagation()}>
                <div className="password-modal-content">
                    <div className="password-room-info">
                        <div className="password-room-name">{room.name}</div>
                        <div className="password-room-creator">
                            <FontAwesomeIcon icon={faUser} /> Создатель: {room.creator}
                        </div>
                    </div>
                    
                    <div className="password-input-container">
                        <label className="password-label">
                            <FontAwesomeIcon icon={faLock} className="password-icon" /> Введите пароль комнаты
                        </label>
                        
                        <div className="password-input-wrapper">
                            <FontAwesomeIcon icon={faKey} className="password-input-icon" />
                            <input
                                type="password"
                                className="password-input"
                                placeholder="Введите пароль..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                ref={inputRef}
                            />
                        </div>
                        
                        {error && <div className="password-error">{error}</div>}
                    </div>
                    
                    <div className="password-actions">
                        <button className="password-cancel" onClick={onCancel}>
                            Отмена
                        </button>
                        <button className="password-submit" onClick={handleSubmit}>
                            Войти
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 