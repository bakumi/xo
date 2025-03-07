from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from dataclasses import dataclass
from typing import List, Optional, Tuple
import json
import logging
import random
import uuid

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'your-secret-key!'

# Настройка Socket.IO
socketio = SocketIO(
    app,
    cors_allowed_origins=["https://xo-frontend.onrender.com", "http://localhost:5173"],
    async_mode='gevent',
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    transports=['websocket', 'polling'],  # Добавляем поддержку polling
)

@dataclass
class Player:
    id: str
    symbol: str
    name: str

@dataclass
class Game:
    board: List[List[List[str]]]
    players: List[Player]
    current_player_index: int
    room_name: str
    creator_name: str
    password: Optional[str] = None
    winner: Optional[str] = None
    winning_line: Optional[List[Tuple[int, int, int]]] = None
    ready_players: List[str] = None
    # Добавляем подсчет выигрышных линий для каждого игрока
    winning_lines_x: List[List[Tuple[int, int, int]]] = None
    winning_lines_o: List[List[Tuple[int, int, int]]] = None
    # Добавляем счет игроков
    score_x: int = 0
    score_o: int = 0
    # Флаг о том, что игра завершена (все клетки заполнены или нажата кнопка завершения)
    is_game_over: bool = False

    def __post_init__(self):
        self.ready_players = []
        self.winning_lines_x = []
        self.winning_lines_o = []
        self.score_x = 0
        self.score_o = 0

games = {}

def check_winner(board: List[List[List[str]]], last_move: Tuple[int, int, int]) -> Tuple[Optional[str], Optional[List[Tuple[int, int, int]]]]:
    x, y, z = last_move
    symbol = board[x][y][z]
    if not symbol:
        return None, None

    # Все возможные направления для проверки
    directions = [
        # Горизонтальные линии
        [(1,0,0), (-1,0,0)],  # по X
        [(0,1,0), (0,-1,0)],  # по Y
        [(0,0,1), (0,0,-1)],  # по Z
        
        # Диагонали в плоскостях
        [(1,1,0), (-1,-1,0)],  # XY плоскость
        [(1,-1,0), (-1,1,0)],  # XY плоскость (обратная)
        [(1,0,1), (-1,0,-1)],  # XZ плоскость
        [(1,0,-1), (-1,0,1)],  # XZ плоскость (обратная)
        [(0,1,1), (0,-1,-1)],  # YZ плоскость
        [(0,1,-1), (0,-1,1)],  # YZ плоскость (обратная)
        
        # Объемные диагонали
        [(1,1,1), (-1,-1,-1)],  # Основная диагональ куба
        [(1,1,-1), (-1,-1,1)],  # Обратная диагональ куба
        [(1,-1,1), (-1,1,-1)],  # Диагональ через центр
        [(1,-1,-1), (-1,1,1)],  # Диагональ через центр
    ]

    for direction_pair in directions:
        count = 1
        line = [last_move]
        
        for dx, dy, dz in direction_pair:
            curr_x, curr_y, curr_z = x, y, z
            
            for _ in range(2):  # Проверяем на 2 клетки в каждом направлении
                curr_x, curr_y, curr_z = curr_x + dx, curr_y + dy, curr_z + dz
                
                if (0 <= curr_x < 3 and 0 <= curr_y < 3 and 0 <= curr_z < 3 and 
                    board[curr_x][curr_y][curr_z] == symbol):
                    count += 1
                    line.append((curr_x, curr_y, curr_z))
                else:
                    break

        if count >= 3:
            logger.info(f"Found winning line for {symbol}: {line}")
            return symbol, line

    return None, None

@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to server', 'sid': request.sid})

@socketio.on('join_game')
def join_game(data):
    """Присоединяет игрока к комнате"""
    room = data['room']
    player_name = data.get('player_name', 'Player')
    password = data.get('password', None)
    
    if room not in games:
        return {'error': 'Комната не найдена'}
    
    game = games[room]
    
    # Проверяем пароль, если он установлен
    if game.password and game.password != password:
        return {'error': 'Неверный пароль'}
    
    if len(game.players) >= 2:
        return {'error': 'Комната уже заполнена'}
    
    # Проверяем, не занято ли имя другим игроком в комнате
    for player in game.players:
        if player.name.lower() == player_name.lower():
            return {'error': 'Игрок с таким именем уже есть в комнате'}
    
    # Присоединяем игрока к комнате
    join_room(room)
    
    # Создаем нового игрока
    player = Player(
        id=request.sid,
        symbol='O' if game.players[0].symbol == 'X' else 'X',
        name=player_name
    )
    game.players.append(player)
    
    # Отправляем обновленное состояние игры всем игрокам в комнате
    game_state = {
        'board': game.board,
        'players': [{'id': p.id, 'symbol': p.symbol, 'name': p.name} for p in game.players],
        'currentPlayer': game.players[game.current_player_index].symbol,
        'winner': game.winner,
        'winningLine': game.winning_line,
        'readyPlayers': game.ready_players
    }
    
    emit('game_state', game_state, room=room)
    
    # Обновляем список комнат для всех
    get_rooms()
    
    return {'success': True}

@socketio.on('make_move')
def on_move(data):
    room = data['room']
    x, y, z = data['x'], data['y'], data['z']
    
    logger.info(f"Move in room {room}: ({x}, {y}, {z})")
    
    if room not in games:
        emit('game_error', {'message': 'Game not found'})
        return
    
    game = games[room]
    
    if len(game.players) < 2:
        emit('game_error', {'message': 'Waiting for opponent'})
        return
    
    current_player = game.players[game.current_player_index]
    
    if request.sid != current_player.id:
        emit('game_error', {'message': 'Not your turn'})
        return
    
    if game.board[x][y][z]:
        emit('game_error', {'message': 'Cell already taken'})
        return
    
    if game.is_game_over:
        emit('game_error', {'message': 'Game already over'})
        return
    
    game.board[x][y][z] = current_player.symbol
    
    winner, winning_line = check_winner(game.board, (x, y, z))
    
    if winner:
        # Добавляем выигрышную линию в соответствующий список и увеличиваем счет
        if winner == 'X':
            game.winning_lines_x.append(winning_line)
            game.score_x += 1
        else:
            game.winning_lines_o.append(winning_line)
            game.score_o += 1
            
        logger.info(f"Player {current_player.name} formed a winning line in room {room}")
        logger.info(f"Current score - X: {game.score_x}, O: {game.score_o}")
        
        # Временно сохраняем последнюю выигрышную линию для отображения
        game.winning_line = winning_line
        
        # Проверяем, заполнена ли доска полностью
        board_full = all(all(all(cell for cell in row) for row in plane) for plane in game.board)
        
        # Если доска заполнена, определяем окончательного победителя
        if board_full:
            logger.info(f"Board is full, game over in room {room}")
            if game.score_x > game.score_o:
                game.winner = 'X'
            elif game.score_o > game.score_x:
                game.winner = 'O'
            else:
                game.winner = 'draw'
            game.is_game_over = True
        else:
            # Игра продолжается, выигрышная линия есть, но общего победителя еще нет
            game.winner = None
    
    # Меняем текущего игрока
    game.current_player_index = (game.current_player_index + 1) % 2
    
    game_state = {
        'board': game.board,
        'players': [{'id': p.id, 'symbol': p.symbol, 'name': p.name} for p in game.players],
        'currentPlayer': game.players[game.current_player_index].symbol,
        'winner': game.winner,
        'winningLine': game.winning_line,
        'winningLinesX': game.winning_lines_x,
        'winningLinesO': game.winning_lines_o,
        'scoreX': game.score_x,
        'scoreO': game.score_o,
        'isGameOver': game.is_game_over,
        'readyPlayers': game.ready_players
    }
    
    logger.info(f"Sending game state after move with scores: X={game_state['scoreX']}, O={game_state['scoreO']}")
    
    # Отправляем обновленное состояние всем игрокам
    emit('game_state', game_state, room=room)

@socketio.on('disconnect')
def on_disconnect():
    logger.info(f"Client disconnected: {request.sid}")
    rooms_to_delete = []
    
    for room, game in games.items():
        for i, player in enumerate(game.players):
            if player.id == request.sid:
                disconnected_player = player
                logger.info(f"Player {disconnected_player.name} disconnected from room {room}")
                
                if request.sid in game.ready_players:
                    game.ready_players.remove(request.sid)
                
                game_state = {
                    'board': game.board,
                    'players': [{'id': p.id, 'symbol': p.symbol, 'name': p.name} for p in game.players if p.id != request.sid],
                    'currentPlayer': game.players[game.current_player_index].symbol if len(game.players) > 1 else None,
                    'winner': 'disconnect',
                    'winningLine': None,
                    'readyPlayers': game.ready_players,
                    'disconnectedPlayer': {
                        'name': disconnected_player.name,
                        'symbol': disconnected_player.symbol
                    }
                }
                
                game.players.pop(i)
                
                emit('game_state', game_state, room=room)
                
                if len(game.players) == 0:
                    rooms_to_delete.append(room)
                
                break
    
    # Удаляем пустые комнаты
    for room in rooms_to_delete:
        del games[room]
    
    # Обновляем список комнат для всех
    get_rooms()

@socketio.on('restart_game')
def on_restart(data, callback=None):
    try:
        room = data['room']
        player_id = request.sid
        
        logger.info(f"Restart game request from {player_id} in room {room}")
        
        if room not in games:
            logger.error(f"Game not found for room {room}")
            if callback:
                callback({'status': 'error', 'message': 'Game not found'})
            return
            
        game = games[room]
        
        if player_id not in [p.id for p in game.players]:
            logger.error(f"Player {player_id} not in game")
            if callback:
                callback({'status': 'error', 'message': 'Player not in game'})
            return
            
        if player_id not in game.ready_players:
            game.ready_players.append(player_id)
            logger.info(f"Player {player_id} is ready to restart")
            
        ready_count = len(game.ready_players)
        all_ready = ready_count == 2
        
        logger.info(f"Ready players in room {room}: {ready_count}/2")
        
        if all_ready:
            logger.info(f"All players ready in room {room}, restarting game")
            # Сброс игры
            game.board = [[['' for _ in range(3)] for _ in range(3)] for _ in range(3)]
            
            # Простой рандомный выбор первого игрока
            game.current_player_index = random.randint(0, 1)
            first_player = game.players[game.current_player_index]
            logger.info(f"Randomly selected first player: {first_player.name} ({first_player.symbol})")
            
            game.winner = None
            game.winning_line = None
            game.ready_players = []
            
            # Сбрасываем счетчики выигрышных линий и счета
            game.winning_lines_x = []
            game.winning_lines_o = []
            game.score_x = 0
            game.score_o = 0
            game.is_game_over = False
            
            game_state = {
                'board': game.board,
                'players': [{'id': p.id, 'symbol': p.symbol, 'name': p.name} for p in game.players],
                'currentPlayer': game.players[game.current_player_index].symbol,
                'winner': None,
                'winningLine': None,
                'winningLinesX': [],
                'winningLinesO': [],
                'scoreX': 0,
                'scoreO': 0,
                'isGameOver': False,
                'readyPlayers': []
            }
        else:
            game_state = {
                'board': game.board,
                'players': [{'id': p.id, 'symbol': p.symbol, 'name': p.name} for p in game.players],
                'currentPlayer': game.players[game.current_player_index].symbol,
                'winner': game.winner,
                'winningLine': game.winning_line,
                'winningLinesX': game.winning_lines_x,
                'winningLinesO': game.winning_lines_o,
                'scoreX': game.score_x,
                'scoreO': game.score_o,
                'isGameOver': game.is_game_over,
                'readyPlayers': game.ready_players
            }
        
        emit('game_state', game_state, room=room)
        
        response = {
            'status': 'success',
            'readyPlayers': game.ready_players,
            'allReady': all_ready,
            'currentPlayer': game.players[game.current_player_index].symbol if all_ready else None
        }
        logger.info(f"Sending response through callback: {response}")
        if callback:
            callback(response)
        
    except Exception as e:
        error_response = {'status': 'error', 'message': str(e)}
        logger.error(f"Error in restart_game: {str(e)}")
        if callback:
            callback(error_response)

@socketio.on('get_rooms')
def get_rooms():
    """Отправляет список доступных комнат"""
    rooms_list = []
    for room_id, game in games.items():
        rooms_list.append({
            'id': room_id,
            'name': game.room_name,
            'creator': game.creator_name,
            'players': len(game.players),
            'hasPassword': bool(game.password)  # Добавляем информацию о наличии пароля
        })
    emit('rooms_update', rooms_list)

@socketio.on('create_room')
def create_room(data):
    """Создает новую комнату"""
    room_name = data['room_name']
    player_name = data.get('player_name', 'Player')
    password = data.get('password', None)  # Опциональный пароль

    # Проверяем, нет ли комнаты с таким же названием
    for game in games.values():
        if game.room_name.lower() == room_name.lower():
            return {'error': 'Комната с таким названием уже существует'}
    
    # Генерируем уникальный ID комнаты
    room_id = str(uuid.uuid4())[:8]

    # Создаем новую игру
    games[room_id] = Game(
        board=[[['' for _ in range(3)] for _ in range(3)] for _ in range(3)],
        players=[],
        current_player_index=0,
        room_name=room_name,
        creator_name=player_name,
        password=password
    )
    
    # Добавляем создателя как первого игрока
    player = Player(id=request.sid, symbol='X', name=player_name)
    games[room_id].players.append(player)
    
    join_room(room_id)
    
    # Обновляем список комнат для всех
    get_rooms()
    
    return {'room_id': room_id}

@socketio.on('player_left')
def on_player_left(data):
    room = data.get('room')
    if not room or room not in games:
        return

    logger.info(f"Player {request.sid} left room {room}")
    
    # Находим и удаляем игрока из комнаты
    game = games[room]
    for i, player in enumerate(game.players):
        if player.id == request.sid:
            game.players.pop(i)
            break
    
    # Если комната пуста - удаляем её
    if len(game.players) == 0:
        logger.info(f"Room {room} is empty, deleting")
        del games[room]
        # Обновляем список комнат для всех
        get_rooms()
    else:
        # Отправляем обновленное состояние оставшимся игрокам
        game_state = {
            'board': game.board,
            'players': [{'id': p.id, 'symbol': p.symbol, 'name': p.name} for p in game.players],
            'currentPlayer': game.players[0].symbol if game.players else None,
            'winner': 'disconnect',
            'winningLine': None,
            'winningLinesX': [],
            'winningLinesO': [],
            'scoreX': 0,
            'scoreO': 0,
            'isGameOver': False,
            'readyPlayers': game.ready_players
        }
        emit('game_state', game_state, room=room)

@socketio.on('end_game')
def end_game(data):
    room = data['room']
    
    if room not in games:
        emit('game_error', {'message': 'Game not found'})
        return
    
    game = games[room]
    
    if len(game.players) < 2:
        emit('game_error', {'message': 'Waiting for opponent'})
        return
    
    # Останавливаем игру и определяем победителя
    game.is_game_over = True
    
    if game.score_x > game.score_o:
        game.winner = 'X'
    elif game.score_o > game.score_x:
        game.winner = 'O'
    else:
        game.winner = 'draw'
    
    logger.info(f"Game ended manually in room {room}")
    logger.info(f"Final score - X: {game.score_x}, O: {game.score_o}")
    logger.info(f"Winner: {game.winner}")
    
    # Сначала сохраняем счета в локальных переменных
    score_x = game.score_x
    score_o = game.score_o
    
    # Убеждаемся, что они не нулевые, если были выигрышные линии
    if len(game.winning_lines_x) > 0 and score_x == 0:
        score_x = len(game.winning_lines_x)
        game.score_x = score_x
        logger.info(f"Fixed score X from 0 to {score_x} based on winning lines count")
    
    if len(game.winning_lines_o) > 0 and score_o == 0:
        score_o = len(game.winning_lines_o)
        game.score_o = score_o
        logger.info(f"Fixed score O from 0 to {score_o} based on winning lines count")
    
    # Отправляем обновленное состояние всем игрокам
    game_state = {
        'board': game.board,
        'players': [{'id': p.id, 'symbol': p.symbol, 'name': p.name} for p in game.players],
        'currentPlayer': game.players[game.current_player_index].symbol,
        'winner': game.winner,
        'winningLine': game.winning_line,
        'winningLinesX': game.winning_lines_x,
        'winningLinesO': game.winning_lines_o,
        'scoreX': score_x,
        'scoreO': score_o,
        'isGameOver': game.is_game_over,
        'readyPlayers': game.ready_players
    }
    
    logger.info(f"Sending game state with scores: X={game_state['scoreX']}, O={game_state['scoreO']}")
    
    emit('game_state', game_state, room=room)

if __name__ == '__main__':
    logger.info("Starting server...")
    socketio.run(
        app,
        debug=True,
        host='0.0.0.0',
        port=5000,
        allow_unsafe_werkzeug=True,
        use_reloader=False
    ) 