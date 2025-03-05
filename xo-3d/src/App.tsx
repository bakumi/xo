import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { useGameStore } from './store/gameStore';

function App() {
    const { error } = useGameStore();

    return (
        <Router>
            <div className="relative">
                {error && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="font-medium text-red-400 text-center">
                            {error}
                        </p>
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
