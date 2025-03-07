import React from 'react';

interface PlayerNameInputProps {
    playerName: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Компонент для ввода имени игрока
 */
export function PlayerNameInput({ playerName, onChange }: PlayerNameInputProps) {
    return (
        <div className="player-name-input">
            <label htmlFor="playerName">Ваше имя:</label>
            <input
                type="text"
                id="playerName"
                placeholder="Введите имя игрока"
                value={playerName}
                onChange={onChange}
                className="input-field"
                maxLength={10}
            />
        </div>
    );
} 