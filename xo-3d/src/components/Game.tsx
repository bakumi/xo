import { GameScene } from './GameScene';
import { useGameStore } from '../store/gameStore';
import { Navigate } from 'react-router-dom';

export function Game() {
    const { room } = useGameStore();

    // Если нет комнаты, перенаправляем на главное меню
    if (!room) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="w-screen h-screen relative">
            <GameScene />
        </div>
    );
} 