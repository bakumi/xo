import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { useGameStore } from './store/gameStore';
import { useEffect, useState } from 'react';

function App() {
    const { error, isConnected } = useGameStore();
    const [showConnectingMessage, setShowConnectingMessage] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isConnected) {
                setShowConnectingMessage(true);
            }
        }, 3000);

        if (isConnected) {
            setShowConnectingMessage(false);
        }

        return () => clearTimeout(timer);
    }, [isConnected]);

    return (
        <Router>
            <div className="relative">
                {showConnectingMessage && !isConnected && !error && (
                    <div className="fixed top-4 left-1/2 z-50 px-4 py-3 text-blue-700 bg-blue-100 rounded border border-blue-400 transform -translate-x-1/2">
                        <p>Подключение к серверу... Первое соединение может занять до 50 секунд.</p>
                    </div>
                )}
                {error && (
                    <div className="fixed top-4 left-1/2 z-50 px-4 py-3 text-red-700 bg-red-100 rounded border border-red-400 transform -translate-x-1/2">
                        <p>{error}</p>
                    </div>
                )}
                <Routes>
                    <Route path="/" element={<MainMenu />} />
                    <Route path="/game" element={<Game />} />
                    <Route path="/game/bot" element={<Game />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
