// Основной игровой скрипт
document.addEventListener('DOMContentLoaded', function() {
    // Элементы игры
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const radiationLevelEl = document.getElementById('radiation-level');
    const totalDoseEl = document.getElementById('total-dose');
    const missionTimeEl = document.getElementById('mission-time');
    const statusTextEl = document.getElementById('status-text');
    const fatalOverlay = document.getElementById('fatal-overlay');
    const positionInfoEl = document.getElementById('position-info');
    const speedInfoEl = document.getElementById('speed-info');
    const targetInfoEl = document.getElementById('target-info');
    const shieldInfoEl = document.getElementById('shield-info');
    
    // Кнопки
    const startButtons = document.querySelectorAll('.planet-btn');
    const targetButtons = document.querySelectorAll('.target-btn');
    const landBtn = document.getElementById('land-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const autoBtn = document.getElementById('auto-btn');
    const restartBtn = document.getElementById('restart-btn');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelp = document.getElementById('close-help');
    const resultsModal = document.getElementById('results-modal');
    const closeResults = document.getElementById('close-results');
    const restartModalBtn = document.querySelector('.btn-restart-modal');
    const theoryBtn = document.querySelector('.btn-theory');
    
    // Новые элементы для системы маршрутов
    const routeSelector = document.getElementById('route-selector');
    const routeDirectBtn = document.getElementById('route-direct');
    const routeSafeBtn = document.getElementById('route-safe');
    
    // Игровые переменные
    let gameState = {
        missionStarted: false,
        missionPaused: false,
        missionComplete: false,
        currentPlanet: null,
        targetPlanet: null,
        shipPosition: { x: 600, y: 350 },
        shipVelocity: { x: 0, y: 0 },
        shipOnOrbit: true,
        shipLanded: false,
        radiationLevel: 0.0001,
        totalDose: 0,
        missionStartTime: null,
        currentTime: 0,
        lastUpdate: Date.now(),
        fatalShown: false,
        planets: [],
        trajectory: [],
        solarFlareActive: false,
        solarFlareTime: 0,
        shieldLevel: 100,
        autoPilot: false,
        currentSpeed: 0,
        maxPeakRadiation: 0,
        routeType: null, // 'direct', 'safe', или null
        controlPoints: [] // Точки для безопасного маршрута
    };
    
    // Обновленные данные планет
    const planetsData = {
        sun: { name: 'Солнце', radius: 35, color: '#FFD700', orbitRadius: 0, radiation: 10000 },
        mercury: { name: 'Меркурий', radius: 8, color: '#A9A9A9', orbitRadius: 60, radiation: 0.5 },
        venus: { name: 'Венера', radius: 10, color: '#FFA500', orbitRadius: 90, radiation: 0.2 },
        earth: { name: 'Земля', radius: 12, color: '#1E90FF', orbitRadius: 120, radiation: 0.1, hasBelts: true },
        moon: { name: 'Луна', radius: 4, color: '#C0C0C0', orbitRadius: 0, radiation: 0.3, parent: 'earth', distance: 40 },
        mars: { name: 'Марс', radius: 10, color: '#FF4500', orbitRadius: 160, radiation: 0.4 },
        jupiter: { name: 'Юпитер', radius: 20, color: '#FFA07A', orbitRadius: 210, radiation: 10, hasBelts: true },
        saturn: { name: 'Сатурн', radius: 18, color: '#F0E68C', orbitRadius: 260, radiation: 5 },
        iss: { name: 'МКС', radius: 4, color: '#FFFFFF', orbitRadius: 125, radiation: 0.5 }
    };
    
    // Инициализация игры
    function initGame() {
        gameState = {
            missionStarted: false,
            missionPaused: false,
            missionComplete: false,
            currentPlanet: null,
            targetPlanet: null,
            shipPosition: { x: 600, y: 350 },
            shipVelocity: { x: 0, y: 0 },
            shipOnOrbit: true,
            shipLanded: false,
            radiationLevel: 0.0001,
            totalDose: 0,
            missionStartTime: null,
            currentTime: 0,
            lastUpdate: Date.now(),
            fatalShown: false,
            planets: [],
            trajectory: [],
            solarFlareActive: false,
            solarFlareTime: 0,
            shieldLevel: 100,
            autoPilot: false,
            currentSpeed: 0,
            maxPeakRadiation: 0,
            routeType: null,
            controlPoints: []
        };
        
        initPlanets();
        updateUI();
        statusTextEl.textContent = 'Выберите стартовую позицию';
        landBtn.disabled = true;
        routeSelector.style.display = 'none';
        
        // Активировать кнопки старта
        startButtons.forEach(btn => btn.disabled = false);
        targetButtons.forEach(btn => btn.disabled = true);
        
        fatalOverlay.style.display = 'none';
        resultsModal.style.display = 'none';
        
        requestAnimationFrame(gameLoop);
    }
    
    // Инициализация планет
    function initPlanets() {
        gameState.planets = [];
        
        // Сначала создаем все планеты, кроме Луны
        for (const [key, data] of Object.entries(planetsData)) {
            if (key === 'moon') continue; // Луну создадим отдельно
            
            const angle = Math.random() * Math.PI * 2;
            const planet = {
                ...data,
                id: key,
                angle: angle,
                angleSpeed: 0.001 / Math.sqrt(data.orbitRadius || 1),
                x: 600 + Math.cos(angle) * data.orbitRadius,
                y: 350 + Math.sin(angle) * data.orbitRadius
            };
            gameState.planets.push(planet);
        }
        
        // Теперь создаем Луну как спутник Земли
        const earth = gameState.planets.find(p => p.id === 'earth');
        const moonData = planetsData.moon;
        const moonAngle = Math.random() * Math.PI * 2;
        
        const moon = {
            ...moonData,
            id: 'moon',
            angle: moonAngle,
            angleSpeed: 0.02,
            x: earth.x + Math.cos(moonAngle) * moonData.distance,
            y: earth.y + Math.sin(moonAngle) * moonData.distance
        };
        gameState.planets.push(moon);
    }
    
    // Игровой цикл
    function gameLoop() {
        if (!gameState.missionPaused && !gameState.missionComplete) {
            updateGame();
        }
        renderGame();
        requestAnimationFrame(gameLoop);
    }
    
    // Обновление игры
    function updateGame() {
        const now = Date.now();
        const deltaTime = (now - gameState.lastUpdate) / 1000;
        gameState.lastUpdate = now;
        
        if (gameState.missionStarted) {
            gameState.currentTime += deltaTime;
            updatePlanets(deltaTime);
            updateShip(deltaTime);
            updateRadiation(deltaTime);
            checkConditions();
            updateUI();
        }
    }
    
    // Обновление планет
    function updatePlanets(deltaTime) {
        for (const planet of gameState.planets) {
            // Если это Луна - обновляем относительно Земли
            if (planet.id === 'moon') {
                const earth = gameState.planets.find(p => p.id === 'earth');
                if (earth) {
                    planet.angle += planet.angleSpeed * deltaTime;
                    planet.x = earth.x + Math.cos(planet.angle) * planet.distance;
                    planet.y = earth.y + Math.sin(planet.angle) * planet.distance;
                }
            }
            // Для остальных планет с орбитой
            else if (planet.orbitRadius > 0) {
                planet.angle += planet.angleSpeed * deltaTime;
                planet.x = 600 + Math.cos(planet.angle) * planet.orbitRadius;
                planet.y = 350 + Math.sin(planet.angle) * planet.orbitRadius;
            }
        }
    }
    
    // Обновление корабля
    function updateShip(deltaTime) {
        if (gameState.autoPilot && !gameState.shipOnOrbit && gameState.targetPlanet) {
            autoNavigate(deltaTime);
        } else if (!gameState.shipOnOrbit && gameState.targetPlanet) {
            if (gameState.routeType === 'direct') {
                directNavigate(deltaTime);
            } else if (gameState.routeType === 'safe') {
                safeNavigate(deltaTime);
            }
        }
        
        // Обновление скорости
        gameState.currentSpeed = Math.sqrt(
            gameState.shipVelocity.x ** 2 + gameState.shipVelocity.y ** 2
        );
    }
    
    // Прямой маршрут (быстрый и опасный)
    function directNavigate(deltaTime) {
        const target = gameState.planets.find(p => p.id === gameState.targetPlanet);
        const dx = target.x - gameState.shipPosition.x;
        const dy = target.y - gameState.shipPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < target.radius + 25) {
            // Достигли цели
            completeArrival(target);
        } else {
            // Летим прямо к цели
            const speed = 60; // Быстрая скорость
            gameState.shipVelocity.x = (dx / distance) * speed;
            gameState.shipVelocity.y = (dy / distance) * speed;
            gameState.shipPosition.x += gameState.shipVelocity.x * deltaTime;
            gameState.shipPosition.y += gameState.shipVelocity.y * deltaTime;
            
            // Сохраняем траекторию для отрисовки
            if (Math.random() < 0.1) {
                gameState.trajectory.push({x: gameState.shipPosition.x, y: gameState.shipPosition.y});
                if (gameState.trajectory.length > 50) gameState.trajectory.shift();
            }
        }
    }
    
    // Безопасный маршрут (долгий и безопасный)
    function safeNavigate(deltaTime) {
        const target = gameState.planets.find(p => p.id === gameState.targetPlanet);
        const dx = target.x - gameState.shipPosition.x;
        const dy = target.y - gameState.shipPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < target.radius + 25) {
            // Достигли цели
            completeArrival(target);
        } else {
            // Если контрольные точки не рассчитаны - рассчитываем
            if (gameState.controlPoints.length === 0) {
                calculateSafeRoute();
            }
            
            // Летим к следующей контрольной точке
            const nextPoint = gameState.controlPoints[0];
            const pointDx = nextPoint.x - gameState.shipPosition.x;
            const pointDy = nextPoint.y - gameState.shipPosition.y;
            const pointDist = Math.sqrt(pointDx * pointDx + pointDy * pointDy);
            
            if (pointDist < 20) {
                // Достигли контрольной точки, переходим к следующей
                gameState.controlPoints.shift();
                if (gameState.controlPoints.length === 0) return;
            }
            
            // Двигаемся к контрольной точке
            const speed = 40; // Медленная скорость для безопасного маршрута
            gameState.shipVelocity.x = (pointDx / pointDist) * speed;
            gameState.shipVelocity.y = (pointDy / pointDist) * speed;
            gameState.shipPosition.x += gameState.shipVelocity.x * deltaTime;
            gameState.shipPosition.y += gameState.shipVelocity.y * deltaTime;
            
            // Сохраняем траекторию
            if (Math.random() < 0.1) {
                gameState.trajectory.push({x: gameState.shipPosition.x, y: gameState.shipPosition.y});
                if (gameState.trajectory.length > 100) gameState.trajectory.shift();
            }
        }
    }
    
    // Автонавигация
    function autoNavigate(deltaTime) {
        const target = gameState.planets.find(p => p.id === gameState.targetPlanet);
        const dx = target.x - gameState.shipPosition.x;
        const dy = target.y - gameState.shipPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < target.radius + 25) {
            // Достигли цели
            completeArrival(target, true);
        } else {
            // Избегаем радиационные пояса
            let avoidX = 0, avoidY = 0;
            
            const earth = gameState.planets.find(p => p.id === 'earth');
            const earthDist = Math.sqrt(
                Math.pow(gameState.shipPosition.x - earth.x, 2) +
                Math.pow(gameState.shipPosition.y - earth.y, 2)
            );
            
            if (earthDist < 170) {
                avoidX += (gameState.shipPosition.x - earth.x) / earthDist * 100;
                avoidY += (gameState.shipPosition.y - earth.y) / earthDist * 100;
            }
            
            const jupiter = gameState.planets.find(p => p.id === 'jupiter');
            const jupiterDist = Math.sqrt(
                Math.pow(gameState.shipPosition.x - jupiter.x, 2) +
                Math.pow(gameState.shipPosition.y - jupiter.y, 2)
            );
            
            if (jupiterDist < 290) {
                avoidX += (gameState.shipPosition.x - jupiter.x) / jupiterDist * 150;
                avoidY += (gameState.shipPosition.y - jupiter.y) / jupiterDist * 150;
            }
            
            // Двигаемся к цели с учетом избегания
            const speed = 70;
            const targetDirX = dx / distance;
            const targetDirY = dy / distance;
            
            gameState.shipVelocity.x = targetDirX * speed + avoidX * 0.1;
            gameState.shipVelocity.y = targetDirY * speed + avoidY * 0.1;
            
            // Нормализация
            const velLength = Math.sqrt(
                gameState.shipVelocity.x ** 2 + gameState.shipVelocity.y ** 2
            );
            gameState.shipVelocity.x = (gameState.shipVelocity.x / velLength) * speed;
            gameState.shipVelocity.y = (gameState.shipVelocity.y / velLength) * speed;
            
            gameState.shipPosition.x += gameState.shipVelocity.x * deltaTime;
            gameState.shipPosition.y += gameState.shipVelocity.y * deltaTime;
        }
    }
    
    // Расчет безопасного маршрута
    function calculateSafeRoute() {
        const start = gameState.planets.find(p => p.id === gameState.currentPlanet);
        const target = gameState.planets.find(p => p.id === gameState.targetPlanet);
        
        if (!start || !target) return;
        
        gameState.controlPoints = [];
        
        // Вычисляем точки для обхода опасных зон
        const earth = gameState.planets.find(p => p.id === 'earth');
        const jupiter = gameState.planets.find(p => p.id === 'jupiter');
        
        // Точка 1: Начальная позиция (немного в сторону от прямой линии)
        const angle = Math.atan2(target.y - start.y, target.x - start.x);
        const offset1 = Math.PI / 6; // 30 градусов
        
        // Если цель - не Земля, обходим Землю
        if (gameState.targetPlanet !== 'earth' && gameState.currentPlanet !== 'earth') {
            const earthAngle = Math.atan2(earth.y - start.y, earth.x - start.x);
            const point1 = {
                x: start.x + Math.cos(earthAngle + offset1) * 100,
                y: start.y + Math.sin(earthAngle + offset1) * 100
            };
            gameState.controlPoints.push(point1);
            
            // Точка 2: Облетаем Землю на безопасном расстоянии
            const point2 = {
                x: earth.x + Math.cos(earthAngle + Math.PI/2) * 150,
                y: earth.y + Math.sin(earthAngle + Math.PI/2) * 150
            };
            gameState.controlPoints.push(point2);
        }
        
        // Если цель - Юпитер или дальше, обходим радиационный пояс Юпитера
        if (gameState.targetPlanet === 'jupiter' || gameState.targetPlanet === 'saturn') {
            const jupiterAngle = Math.atan2(jupiter.y - start.y, jupiter.x - start.x);
            const point3 = {
                x: jupiter.x + Math.cos(jupiterAngle - Math.PI/3) * 200,
                y: jupiter.y + Math.sin(jupiterAngle - Math.PI/3) * 200
            };
            gameState.controlPoints.push(point3);
        }
        
        // Финальная точка: сама цель
        gameState.controlPoints.push({x: target.x, y: target.y});
    }
    
    // Завершение прибытия к цели
    function completeArrival(target, isAutoPilot = false) {
        gameState.currentPlanet = gameState.targetPlanet;
        gameState.targetPlanet = null;
        gameState.shipOnOrbit = true;
        gameState.shipVelocity = { x: 0, y: 0 };
        gameState.controlPoints = [];
        gameState.trajectory = [];
        
        statusTextEl.textContent = isAutoPilot ? 
            `Достигнута орбита ${target.name} (автопилот)` : 
            `Достигнута орбита ${target.name}`;
        
        landBtn.disabled = false;
        targetButtons.forEach(btn => btn.disabled = false);
        routeSelector.style.display = 'none';
    }
    
    // Обновление радиации
    function updateRadiation(deltaTime) {
        let baseRadiation = 0.0001;
        
        if (gameState.currentPlanet) {
            const planet = gameState.planets.find(p => p.id === gameState.currentPlanet);
            baseRadiation = planet.radiation;
        }
        
        // Радиационные пояса
        let beltRadiation = 0;
        const earth = gameState.planets.find(p => p.id === 'earth');
        const jupiter = gameState.planets.find(p => p.id === 'jupiter');
        
        if (earth) {
            const distToEarth = Math.sqrt(
                Math.pow(gameState.shipPosition.x - earth.x, 2) +
                Math.pow(gameState.shipPosition.y - earth.y, 2)
            );
            if (distToEarth > (earth.orbitRadius + 30) && distToEarth < (earth.orbitRadius + 50)) {
                beltRadiation += 5;
            }
        }
        
        if (jupiter) {
            const distToJupiter = Math.sqrt(
                Math.pow(gameState.shipPosition.x - jupiter.x, 2) +
                Math.pow(gameState.shipPosition.y - jupiter.y, 2)
            );
            if (distToJupiter > 250 && distToJupiter < 280) {
                beltRadiation += 20;
            }
        }
        
        // Солнечные вспышки (система событий будет добавлена позже)
        let solarFlareRadiation = 0;
        if (gameState.solarFlareActive) {
            solarFlareRadiation = 30;
            gameState.solarFlareTime -= deltaTime;
            if (gameState.solarFlareTime <= 0) {
                gameState.solarFlareActive = false;
            }
        }
        
        // Радиация во время полета зависит от типа маршрута
        let flightRadiation = 0;
        if (!gameState.shipOnOrbit) {
            if (gameState.routeType === 'direct') {
                flightRadiation = 5; // Высокая радиация на прямом маршруте
            } else if (gameState.routeType === 'safe') {
                flightRadiation = 1; // Низкая радиация на безопасном маршруте
            }
            
            if (gameState.autoPilot) {
                flightRadiation *= 0.7; // Автопилот немного снижает радиацию
            }
        }
        
        // Эффект защиты
        const shieldEffect = gameState.shieldLevel / 100;
        gameState.radiationLevel = (baseRadiation + beltRadiation + solarFlareRadiation + flightRadiation) * (1 - shieldEffect * 0.7);
        
        // Ухудшение защиты со временем
        if (gameState.radiationLevel > 1) {
            gameState.shieldLevel -= deltaTime * gameState.radiationLevel * 0.1;
            if (gameState.shieldLevel < 0) gameState.shieldLevel = 0;
        }
        
        // Накопление дозы
        const doseRate = gameState.radiationLevel * 0.000001;
        gameState.totalDose += doseRate * deltaTime;
        
        // Обновление максимального пика
        if (gameState.radiationLevel > gameState.maxPeakRadiation) {
            gameState.maxPeakRadiation = gameState.radiationLevel;
        }
        
        // Проверка смертельной дозы
        if (gameState.totalDose > 5 && !gameState.fatalShown) {
            showFatal();
        }
    }
    
    // Проверка условий
    function checkConditions() {
        if (gameState.totalDose > 5) {
            gameState.missionComplete = true;
            fatalOverlay.style.display = 'block';
        }
    }
    
    // Обновление интерфейса
    function updateUI() {
        radiationLevelEl.textContent = gameState.radiationLevel.toFixed(4);
        totalDoseEl.textContent = gameState.totalDose.toFixed(3);
        
        const hours = Math.floor(gameState.currentTime / 3600);
        const minutes = Math.floor((gameState.currentTime % 3600) / 60);
        const seconds = Math.floor(gameState.currentTime % 60);
        missionTimeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Цветовая индикация
        radiationLevelEl.style.color = getRadiationColor(gameState.radiationLevel);
        totalDoseEl.style.color = getDoseColor(gameState.totalDose);
        
        // Информация о состоянии
        positionInfoEl.textContent = gameState.currentPlanet 
            ? gameState.planets.find(p => p.id === gameState.currentPlanet)?.name || 'Неизвестно'
            : 'Не задано';
        
        speedInfoEl.textContent = `${Math.round(gameState.currentSpeed)} км/с`;
        
        targetInfoEl.textContent = gameState.targetPlanet 
            ? gameState.planets.find(p => p.id === gameState.targetPlanet)?.name || 'Неизвестно'
            : 'Не задана';
        
        shieldInfoEl.textContent = `${Math.round(gameState.shieldLevel)}%`;
        shieldInfoEl.style.color = gameState.shieldLevel > 50 ? 'var(--safe)' : 
                                  gameState.shieldLevel > 20 ? 'var(--warning)' : 'var(--danger)';
        
        // Отображение типа маршрута
        if (gameState.routeType) {
            const routeInfo = document.getElementById('route-info') || (() => {
                const info = document.createElement('div');
                info.id = 'route-info';
                info.style.marginTop = '10px';
                info.style.fontSize = '0.9em';
                return info;
            })();
            
            if (gameState.routeType === 'direct') {
                routeInfo.innerHTML = '<i class="fas fa-bolt" style="color:#ff4444"></i> Маршрут: <span style="color:#ff4444">Быстрый и опасный</span>';
            } else {
                routeInfo.innerHTML = '<i class="fas fa-shield-alt" style="color:var(--safe)"></i> Маршрут: <span style="color:var(--safe)">Долгий и безопасный</span>';
            }
            
            if (!document.getElementById('route-info')) {
                document.querySelector('.state-info').appendChild(routeInfo);
            }
        }
    }
    
    // Отрисовка игры
    function renderGame() {
        // Фон
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Звезды
        drawStars();
        
        // Орбиты (только для основных планет)
        drawOrbits();
        
        // Радиационные пояса
        drawRadiationBelts();
        
        // Планеты
        for (const planet of gameState.planets) {
            drawPlanet(planet);
        }
        
        // Траектория полета
        drawTrajectory();
        
        // Контрольные точки безопасного маршрута
        if (gameState.routeType === 'safe' && gameState.controlPoints.length > 0) {
            drawControlPoints();
        }
        
        // Корабль
        if (gameState.missionStarted) {
            drawShip();
        }
        
        // Солнечная вспышка
        if (gameState.solarFlareActive) {
            drawSolarFlare();
        }
    }
    
    // Вспомогательные функции отрисовки
    function drawStars() {
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 200; i++) {
            const x = (i * 7) % canvas.width;
            const y = (i * 13) % canvas.height;
            const size = Math.random() * 1.5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawOrbits() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        
        // Рисуем орбиты только для основных планет (не для Луны и МКС)
        const orbitRadii = [];
        
        for (const planet of gameState.planets) {
            if (planet.orbitRadius > 0 && planet.id !== 'moon' && planet.id !== 'iss') {
                if (!orbitRadii.includes(planet.orbitRadius)) {
                    orbitRadii.push(planet.orbitRadius);
                }
            }
        }
        
        orbitRadii.sort((a, b) => a - b);
        
        for (const radius of orbitRadii) {
            ctx.beginPath();
            ctx.arc(600, 350, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    function drawPlanet(planet) {
        // Планета
        const gradient = ctx.createRadialGradient(
            planet.x, planet.y, 0,
            planet.x, planet.y, planet.radius
        );
        gradient.addColorStop(0, planet.color);
        gradient.addColorStop(1, planet.color.replace(')', ', 0.8)'));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Подсветка
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(
            planet.x - planet.radius * 0.3,
            planet.y - planet.radius * 0.3,
            planet.radius * 0.4,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Название
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(planet.name, planet.x, planet.y - planet.radius - 10);
    }
    
    function drawRadiationBelts() {
        // Пояс Ван Аллена Земли
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        const earth = gameState.planets.find(p => p.id === 'earth');
        if (earth) {
            ctx.beginPath();
            ctx.arc(600, 350, earth.orbitRadius + 30, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(600, 350, earth.orbitRadius + 50, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Радиация Юпитера
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
        ctx.beginPath();
        ctx.arc(600, 350, 250, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(600, 350, 280, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    function drawTrajectory() {
        if (gameState.trajectory.length > 1) {
            ctx.strokeStyle = gameState.routeType === 'direct' ? 'rgba(255, 68, 68, 0.6)' : 'rgba(76, 175, 80, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(gameState.trajectory[0].x, gameState.trajectory[0].y);
            
            for (let i = 1; i < gameState.trajectory.length; i++) {
                ctx.lineTo(gameState.trajectory[i].x, gameState.trajectory[i].y);
            }
            ctx.stroke();
        }
    }
    
    function drawControlPoints() {
        // Рисуем контрольные точки безопасного маршрута
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < gameState.controlPoints.length; i++) {
            const point = gameState.controlPoints[i];
            
            // Точка
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Номер точки
            ctx.fillStyle = '#FFF';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((i + 1).toString(), point.x, point.y);
            ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
            
            // Линия к следующей точке
            if (i < gameState.controlPoints.length - 1) {
                const nextPoint = gameState.controlPoints[i + 1];
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(nextPoint.x, nextPoint.y);
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
    
    function drawShip() {
        const shipX = gameState.shipPosition.x;
        const shipY = gameState.shipPosition.y;
        const time = Date.now() / 1000;
        
        // Основной корпус
        ctx.fillStyle = gameState.autoPilot ? '#00d4ff' : 
                       gameState.routeType === 'direct' ? '#ff4444' : '#6c63ff';
        ctx.beginPath();
        ctx.ellipse(shipX, shipY, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Вращающееся кольцо
        ctx.save();
        ctx.translate(shipX, shipY);
        ctx.rotate(time * 0.5);
        
        ctx.strokeStyle = gameState.shieldLevel > 50 ? '#00ff00' : 
                         gameState.shieldLevel > 20 ? '#ff9800' : '#f44336';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // Двигатели
        if (!gameState.shipOnOrbit) {
            ctx.fillStyle = gameState.routeType === 'direct' ? '#ff8888' : '#ff6584';
            ctx.beginPath();
            ctx.ellipse(-10, 0, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Цель
        if (gameState.targetPlanet) {
            const target = gameState.planets.find(p => p.id === gameState.targetPlanet);
            ctx.strokeStyle = gameState.routeType === 'direct' ? '#ff4444' : '#00ff00';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(shipX, shipY);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    function drawSolarFlare() {
        const sun = gameState.planets.find(p => p.id === 'sun');
        const time = Date.now() / 200;
        
        for (let i = 0; i < 5; i++) {
            const angle = time + (i * Math.PI * 2 / 5);
            const length = 100 + Math.sin(time * 2) * 50;
            
            const gradient = ctx.createLinearGradient(
                sun.x, sun.y,
                sun.x + Math.cos(angle) * length,
                sun.y + Math.sin(angle) * length
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(sun.x, sun.y);
            ctx.lineTo(
                sun.x + Math.cos(angle) * length,
                sun.y + Math.sin(angle) * length
            );
            ctx.stroke();
        }
    }
    
    // Цвета для индикации
    function getRadiationColor(level) {
        if (level > 100) return 'var(--extreme)';
        if (level > 10) return 'var(--danger)';
        if (level > 1) return 'var(--warning)';
        if (level > 0.1) return '#2196f3';
        return 'var(--safe)';
    }
    
    function getDoseColor(dose) {
        if (dose > 3) return 'var(--extreme)';
        if (dose > 1) return 'var(--danger)';
        if (dose > 0.5) return 'var(--warning)';
        if (dose > 0.1) return '#2196f3';
        return 'var(--safe)';
    }
    
    // Фатальная ошибка
    function showFatal() {
        gameState.fatalShown = true;
        gameState.missionComplete = true;
        fatalOverlay.style.display = 'block';
    }
    
    // Завершение миссии
    function completeMission() {
        gameState.missionComplete = true;
        
        // Расчет результатов
        const distance = gameState.trajectory.reduce((sum, point, i) => {
            if (i === 0) return 0;
            const dx = point.x - gameState.trajectory[i-1].x;
            const dy = point.y - gameState.trajectory[i-1].y;
            return sum + Math.sqrt(dx*dx + dy*dy);
        }, 0) / 100;
        
        // Определение состояния
        let healthStatus, shipStatus;
        if (gameState.totalDose > 3) {
            healthStatus = 'Погиб';
            shipStatus = 'Критические повреждения';
        } else if (gameState.totalDose > 1) {
            healthStatus = 'Лучевая болезнь';
            shipStatus = 'Повреждена';
        } else if (gameState.totalDose > 0.5) {
            healthStatus = 'Повышенный риск';
            shipStatus = 'Незначительные повреждения';
        } else {
            healthStatus = 'Отличное';
            shipStatus = 'Исправна';
        }
        
        // Оценка
        let stars = 3;
        if (gameState.totalDose < 0.1) stars = 5;
        else if (gameState.totalDose < 0.5) stars = 4;
        else if (gameState.totalDose > 3) stars = 1;
        else if (gameState.totalDose > 1) stars = 2;
        
        // Бонус за безопасный маршрут
        if (gameState.routeType === 'safe' && gameState.totalDose < 1) {
            stars = Math.min(5, stars + 1);
        }
        
        // Заполнение результатов
        document.getElementById('result-dose').textContent = gameState.totalDose.toFixed(3) + ' Гр';
        document.getElementById('result-time').textContent = missionTimeEl.textContent;
        document.getElementById('result-peak').textContent = gameState.maxPeakRadiation.toFixed(2) + ' мГр/ч';
        document.getElementById('result-distance').textContent = (distance / 10).toFixed(1) + ' а.е.';
        document.getElementById('result-health').textContent = healthStatus;
        document.getElementById('result-ship').textContent = shipStatus;
        
        // Сообщение
        const messageEl = document.getElementById('result-message');
        if (gameState.totalDose > 3) {
            messageEl.innerHTML = '<p>Миссия провалена. Экипаж погиб от лучевой болезни.</p>';
            messageEl.style.background = 'rgba(244, 67, 54, 0.1)';
            messageEl.style.borderColor = 'var(--danger)';
        } else if (gameState.totalDose > 1) {
            messageEl.innerHTML = '<p>Миссия завершена с рисками. Экипаж получил опасную дозу радиации.</p>';
            messageEl.style.background = 'rgba(255, 152, 0, 0.1)';
            messageEl.style.borderColor = 'var(--warning)';
        } else if (gameState.totalDose > 0.5) {
            messageEl.innerHTML = '<p>Миссия завершена успешно, но с превышением рекомендуемых доз.</p>';
            messageEl.style.background = 'rgba(33, 150, 243, 0.1)';
            messageEl.style.borderColor = '#2196f3';
        } else {
            messageEl.innerHTML = '<p>Миссия завершена блестяще! Доза радиации в пределах безопасных значений.</p>';
            messageEl.style.background = 'rgba(76, 175, 80, 0.1)';
            messageEl.style.borderColor = 'var(--safe)';
        }
        
        // Звезды
        const starsEl = document.getElementById('mission-stars');
        starsEl.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('i');
            star.className = i < stars ? 'fas fa-star' : 'far fa-star';
            starsEl.appendChild(star);
        }
        
        resultsModal.style.display = 'flex';
    }
    
    // Обработчики событий
    
    // Кнопки старта
    startButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (gameState.missionStarted) return;
            
            const planetId = this.dataset.planet;
            const planet = gameState.planets.find(p => p.id === planetId);
            
            gameState.missionStarted = true;
            gameState.missionStartTime = Date.now();
            gameState.currentPlanet = planetId;
            gameState.shipPosition.x = planet.x;
            gameState.shipPosition.y = planet.y;
            
            statusTextEl.textContent = `Старт с ${planet.name}. Выберите цель.`;
            landBtn.disabled = false;
            
            // Активировать кнопки целей
            startButtons.forEach(b => b.disabled = true);
            targetButtons.forEach(b => b.disabled = false);
        });
    });
    
    // Кнопки целей
    targetButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (!gameState.missionStarted || !gameState.shipOnOrbit || gameState.targetPlanet) return;
            
            const targetId = this.dataset.target;
            const target = gameState.planets.find(p => p.id === targetId);
            
            if (targetId === gameState.currentPlanet) {
                statusTextEl.textContent = 'Вы уже находитесь на этой орбите!';
                return;
            }
            
            gameState.targetPlanet = targetId;
            gameState.trajectory.push({...gameState.shipPosition});
            
            const travelTime = Math.random() * 2 + 1;
            statusTextEl.textContent = `Цель: ${target.name}. Выберите маршрут.`;
            landBtn.disabled = true;
            targetButtons.forEach(b => b.disabled = true);
            
            // Показываем выбор маршрута
            routeSelector.style.display = 'block';
        });
    });
    
    // Кнопка прямого маршрута
    routeDirectBtn.addEventListener('click', function() {
        if (!gameState.targetPlanet) return;
        
        gameState.routeType = 'direct';
        gameState.shipOnOrbit = false;
        routeSelector.style.display = 'none';
        
        const target = gameState.planets.find(p => p.id === gameState.targetPlanet);
        statusTextEl.textContent = `Прямой маршрут на ${target.name}. Высокий риск радиации!`;
    });
    
    // Кнопка безопасного маршрута
    routeSafeBtn.addEventListener('click', function() {
        if (!gameState.targetPlanet) return;
        
        gameState.routeType = 'safe';
        gameState.shipOnOrbit = false;
        gameState.controlPoints = []; // Сброс контрольных точек
        routeSelector.style.display = 'none';
        
        const target = gameState.planets.find(p => p.id === gameState.targetPlanet);
        statusTextEl.textContent = `Безопасный маршрут на ${target.name}. Обход опасных зон.`;
    });
    
    // Кнопка посадки
    landBtn.addEventListener('click', function() {
        if (gameState.shipOnOrbit && gameState.currentPlanet) {
            completeMission();
        }
    });
    
    // Кнопка паузы
    pauseBtn.addEventListener('click', function() {
        gameState.missionPaused = !gameState.missionPaused;
        this.innerHTML = gameState.missionPaused ? 
            '<i class="fas fa-play"></i><span>Продолжить</span>' : 
            '<i class="fas fa-pause"></i><span>Пауза</span>';
    });
    
    // Кнопка автопилота
    autoBtn.addEventListener('click', function() {
        if (!gameState.missionStarted || gameState.shipOnOrbit) return;
        
        // Автопилот доступен только для безопасного маршрута
        if (gameState.routeType === 'safe') {
            gameState.autoPilot = !gameState.autoPilot;
            this.innerHTML = gameState.autoPilot ? 
                '<i class="fas fa-user"></i><span>Ручное управление</span>' : 
                '<i class="fas fa-robot"></i><span>Автопилот</span>';
            this.style.background = gameState.autoPilot ? 'var(--neon-blue)' : 'var(--primary)';
            
            statusTextEl.textContent = gameState.autoPilot ? 
                'Автопилот активирован. Избегание радиационных поясов.' : 
                'Ручное управление безопасным маршрутом.';
        } else {
            statusTextEl.textContent = 'Автопилот доступен только для безопасного маршрута!';
        }
    });
    
    // Кнопка помощи
    helpBtn.addEventListener('click', function() {
        helpModal.style.display = 'flex';
    });
    
    closeHelp.addEventListener('click', function() {
        helpModal.style.display = 'none';
    });
    
    // Кнопка перезапуска
    restartBtn.addEventListener('click', initGame);
    
    // Закрытие модальных окон
    window.addEventListener('click', function(e) {
        if (e.target === helpModal) helpModal.style.display = 'none';
        if (e.target === resultsModal) resultsModal.style.display = 'none';
    });
    
    closeResults.addEventListener('click', function() {
        resultsModal.style.display = 'none';
    });
    
    restartModalBtn.addEventListener('click', function() {
        resultsModal.style.display = 'none';
        initGame();
    });
    
    // Кнопка перехода к теории
    if (theoryBtn) {
        theoryBtn.addEventListener('click', function() {
            window.location.href = '/theory';
        });
    }
    
    // Мобильное меню
    document.querySelector('.mobile-menu-btn')?.addEventListener('click', function() {
        document.querySelector('.nav-menu')?.classList.toggle('show');
    });
    
    // Инициализация
    initGame();
});