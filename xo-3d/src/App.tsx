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
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded z-50">
                        <p>Подключение к серверу... Первое соединение может занять до 50 секунд.</p>
                    </div>
                )}
                {error && (
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
                        <p>{error}</p>
                    </div>
                )}
                <Routes>
                    <Route path="/" element={<MainMenu />} />
                    <Route path="/game" element={<Game />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
