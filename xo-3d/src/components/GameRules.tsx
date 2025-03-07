import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCube, 
    faTrophy, 
    faArrowsAlt, 
    faGamepad, 
    faFlag, 
    faEquals,
    faArrowRight,
    faArrowDown,
    faAngleDown
} from '@fortawesome/free-solid-svg-icons';

/**
 * Компонент отображения правил игры в "Крестики-нолики 3D"
 */
export function GameRules() {
    return (
        <div className="rules-container">
            <div className="rules-header">
                <div className="cube-icon">
                    <FontAwesomeIcon icon={faCube} />
                </div>
                <h2>Правила игры "Крестики-нолики 3D"</h2>
            </div>
            
            <div className="rules-content">
                <div className="rule-section">
                    <div className="rule-icon rule-icon-animate">
                        <FontAwesomeIcon icon={faCube} />
                    </div>
                    <div className="rule-text">
                        <h3>Игровое поле</h3>
                        <p>Куб 3x3x3 с 27 ячейками, расположенными в трехмерном пространстве.</p>
                    </div>
                </div>
                
                <div className="rule-section">
                    <div className="rule-icon rule-icon-animate">
                        <FontAwesomeIcon icon={faTrophy} />
                    </div>
                    <div className="rule-text">
                        <h3>Цель игры</h3>
                        <p>Построить как можно больше линий из трех своих символов (X или O).</p>
                    </div>
                </div>
                
                <div className="rule-section">
                    <div className="rule-icon rule-icon-animate">
                        <FontAwesomeIcon icon={faArrowsAlt} />
                    </div>
                    <div className="rule-text">
                        <h3>Типы линий</h3>
                        <div className="line-types">
                            <div className="line-type line-type-animate">
                                <span className="line-icon">
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </span>
                                <span>Горизонтальные (9 возможных)</span>
                            </div>
                            <div className="line-type line-type-animate">
                                <span className="line-icon">
                                    <FontAwesomeIcon icon={faArrowDown} />
                                </span>
                                <span>Вертикальные (9 возможных)</span>
                            </div>
                            <div className="line-type line-type-animate">
                                <span className="line-icon">
                                    <FontAwesomeIcon icon={faArrowRight} rotation={90} />
                                </span>
                                <span>По оси Z (9 возможных)</span>
                            </div>
                            <div className="line-type line-type-animate">
                                <span className="line-icon">
                                    <FontAwesomeIcon icon={faAngleDown} rotation={270} />
                                </span>
                                <span>Диагональные в плоскостях (18 возможных)</span>
                            </div>
                            <div className="line-type line-type-animate">
                                <span className="line-icon">
                                    <FontAwesomeIcon icon={faArrowsAlt} />
                                </span>
                                <span>Объемные диагонали через весь куб (4 возможные)</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="rule-section">
                    <div className="rule-icon rule-icon-animate">
                        <FontAwesomeIcon icon={faGamepad} />
                    </div>
                    <div className="rule-text">
                        <h3>Игровой процесс</h3>
                        <ul className="gameplay-list">
                            <li>Игроки ходят по очереди, ставя свой символ в пустую ячейку</li>
                            <li>Игра <strong>НЕ заканчивается</strong> после первой выигрышной линии</li>
                            <li>За каждую построенную линию игрок получает 1 очко</li>
                            <li>Игра продолжается до полного заполнения куба или до ручного завершения</li>
                        </ul>
                    </div>
                </div>
                
                <div className="rule-section">
                    <div className="rule-icon rule-icon-animate">
                        <FontAwesomeIcon icon={faFlag} />
                    </div>
                    <div className="rule-text">
                        <h3>Окончание игры</h3>
                        <p>Побеждает игрок, набравший больше очков (построивший больше линий).</p>
                    </div>
                </div>
                
                <div className="rule-section">
                    <div className="rule-icon rule-icon-animate">
                        <FontAwesomeIcon icon={faEquals} />
                    </div>
                    <div className="rule-text">
                        <h3>Ничья</h3>
                        <p>Если оба игрока набрали одинаковое количество очков, объявляется ничья.</p>
                    </div>
                </div>
            </div>
            
            <div className="rules-footer">
                <div className="footer-image">
                    <div className="cube-3d-icon">
                        <div className="cube-face front"></div>
                        <div className="cube-face back"></div>
                        <div className="cube-face right"></div>
                        <div className="cube-face left"></div>
                        <div className="cube-face top"></div>
                        <div className="cube-face bottom"></div>
                    </div>
                </div>
                <p className="rules-note">Наслаждайтесь игрой и удачи!</p>
            </div>
        </div>
    );
} 