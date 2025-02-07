let scene, camera, renderer, controls, cubes = [], raycaster, mouse;
const socket = io();
let currentRoom = null;
let hoveredCube = null;

function init() {
    // Инициализация сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Настройка камеры
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(8, 8, 8);
    camera.lookAt(3, 3, 3);

    // Настройка рендерера
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('game-canvas').appendChild(renderer.domElement);

    // Добавление освещения
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-10, -10, -10);
    scene.add(backLight);

    // Инициализация raycaster и mouse для определения кликов
    raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.1;
    mouse = new THREE.Vector2();

    // Создание сетки кубов
    createGrid();

    // Добавление направляющих линий
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x888888);
    scene.add(gridHelper);

    // Настройка орбитальных контролей
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2;

    // Добавляем обработчики событий
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('resize', onWindowResize);

    animate();
}

function createGrid() {
    // Создаем геометрию куба с небольшими промежутками
    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    
    // Создаем базовый материал
    const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        specular: 0x444444,
        shininess: 30
    });

    // Создаем вспомогательную геометрию для рамки
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });

    // Создаем вспомогательную геометрию для области выделения
    const highlightGeometry = new THREE.BoxGeometry(1, 1, 1);
    const highlightMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });

    for(let x = 0; x < 3; x++) {
        cubes[x] = [];
        for(let y = 0; y < 3; y++) {
            cubes[x][y] = [];
            for(let z = 0; z < 3; z++) {
                const group = new THREE.Group();
                group.position.set(x * 2, y * 2, z * 2);
                group.userData = { x, y, z, type: '' };

                // Создаем куб
                const cube = new THREE.Mesh(geometry, material.clone());
                group.add(cube);

                // Добавляем рамку
                const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
                group.add(edges);

                // Добавляем область выделения (изначально невидимая)
                const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial.clone());
                highlight.visible = false;
                highlight.name = 'highlight';
                group.add(highlight);

                cubes[x][y][z] = group;
                scene.add(group);
            }
        }
    }
}

function createSymbol(type, position) {
    let symbol;
    if (type === 'X') {
        const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
        const geometry = new THREE.BufferGeometry();
        const size = 0.3;
        const vertices = new Float32Array([
            -size, -size, 0,  size, size, 0,
            -size, size, 0,   size, -size, 0
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        symbol = new THREE.LineSegments(geometry, material);
        // Поворачиваем X чтобы он был виден с разных сторон
        symbol.rotation.y = Math.PI / 4;
    } else {
        const geometry = new THREE.TorusGeometry(0.3, 0.05, 16, 32);
        const material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
        symbol = new THREE.Mesh(geometry, material);
        // Поворачиваем O чтобы оно было видно с разных сторон
        symbol.rotation.x = Math.PI / 2;
    }
    symbol.position.copy(position);
    return symbol;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    // Получаем все группы кубов
    const cubeGroups = scene.children.filter(obj => obj.userData && obj.userData.type === '');
    const intersects = raycaster.intersectObjects(cubeGroups, true);

    // Сброс подсветки всех кубов
    cubeGroups.forEach(group => {
        const highlight = group.children.find(child => child.name === 'highlight');
        if (highlight) {
            highlight.visible = false;
        }
    });

    // Подсветка куба под курсором
    if (intersects.length > 0) {
        const intersectedGroup = intersects[0].object.parent;
        if (intersectedGroup.userData && intersectedGroup.userData.type === '') {
            hoveredCube = intersectedGroup;
            const highlight = intersectedGroup.children.find(child => child.name === 'highlight');
            if (highlight) {
                highlight.visible = true;
            }
        }
    } else {
        hoveredCube = null;
    }
}

function onClick() {
    if (hoveredCube && currentRoom) {
        const { x, y, z } = hoveredCube.userData;
        socket.emit('make_move', { room: currentRoom, x, y, z });
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Обработка состояния игры
socket.on('game_state', function(gameState) {
    for(let x = 0; x < 3; x++) {
        for(let y = 0; y < 3; y++) {
            for(let z = 0; z < 3; z++) {
                const group = cubes[x][y][z];
                const value = gameState.board[x][y][z];
                
                // Если значение изменилось
                if (value !== group.userData.type) {
                    group.userData.type = value;
                    
                    // Удаляем старый символ, если он есть
                    group.children = group.children.filter(child => 
                        child.type === 'Mesh' || 
                        child.type === 'LineSegments' || 
                        child.name === 'highlight'
                    );
                    
                    // Добавляем новый символ
                    if (value) {
                        const symbol = createSymbol(value, new THREE.Vector3(0, 0, 0));
                        group.add(symbol);
                    }
                }
            }
        }
    }
});

// Присоединение к комнате
document.getElementById('join-room').addEventListener('click', function() {
    const roomId = document.getElementById('room-id').value;
    if(roomId) {
        currentRoom = roomId;
        socket.emit('join', { room: roomId });
    }
});

// Инициализация при загрузке страницы
window.addEventListener('load', init); 