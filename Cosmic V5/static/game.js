// Основной игровой скрипт
document.addEventListener('DOMContentLoaded', function() {
    // Элементы игры
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const radiationLevelEl = document.getElementById('radiation-level');
    const totalDoseEl = document.getElementById('total-dose');
    const missionTimeEl = document.getElementById('mission-time');
    const statusTextEl = document.getElementById('status-text');
    const warningOverlay = document.getElementById('warning-overlay');
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
    const speedBtn = document.getElementById('speed-btn');
    const autoBtn = document.getElementById('auto-btn');
    const restartBtn = document.getElementById('restart-btn');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelp = document.getElementById('close-help');
    const resultsModal = document.getElementById('results-modal');
    const closeResults = document.getElementById('close-results');
    const restartModalBtn = document.querySelector('.btn-restart-modal');
    const theoryBtn = document.querySelector('.btn-theory');
    
    // Игровые переменные
    let gameState = {
        missionStarted: false,
        missionPaused: false,
        missionComplete: false,
        gameSpeed: 1,
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
        warningShown: false,
        fatalShown: false,
        planets: [],
        trajectory: [],
        solarFlareActive: false,
        solarFlareTime: 0,
        shieldLevel: 100,
        autoPilot: false,
        currentSpeed: 0,
        maxPeakRadiation: 0
    };
    
    // Данные планет
    const planetsData = {
        sun: { name: 'Солнце', radius: 50, color: '#FFD700', orbitRadius: 0, radiation: 10000 },
        mercury: { name: 'Меркурий', radius: 8, color: '#A9A9A9', orbitRadius: 100, radiation: 0.5 },
        venus: { name: 'Венера', radius: 12, color: '#FFA500', orbitRadius: 150, radiation: 0.2 },
        earth: { name: 'Земля', radius: 13, color: '#1E90FF', orbitRadius: 200, radiation: 0.1, hasBelts: true },
        moon: { name: 'Луна', radius: 5, color: '#C0C0C0', orbitRadius: 220, radiation: 0.3 },
        mars: { name: 'Марс', radius: 11, color: '#FF4500', orbitRadius: 280, radiation: 0.4 },
        jupiter: { name: 'Юпитер', radius: 30, color: '#FFA07A', orbitRadius: 400, radiation: 10, hasBelts: true },
        saturn: { name: 'Сатурн', radius: 25, color: '#F0E68C', orbitRadius: 500, radiation: 5 },
        iss: { name: 'МКС', radius: 3, color: '#FFFFFF', orbitRadius: 205, radiation: 0.5 }
    };
    
    // Инициализация игры
    function initGame() {
        gameState = {
            missionStarted: false,
            missionPaused: false,
            missionComplete: false,
            gameSpeed: 1,
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
            warningShown: false,
            fatalShown: false,
            planets: [],
            trajectory: [],
            solarFlareActive: false,
            solarFlareTime: 0,
            shieldLevel: 100,
            autoPilot: false,
            currentSpeed: 0,
            maxPeakRadiation: 0
        };
        
        initPlanets();
        updateUI();
        statusTextEl.textContent = 'Выберите стартовую позицию';
        landBtn.disabled = true;
        
        // Активировать кнопки старта
        startButtons.forEach(btn => btn.disabled = false);
        targetButtons.forEach(btn => btn.disabled = true);
        
        warningOverlay.style.display = 'none';
        fatalOverlay.style.display = 'none';
        resultsModal.style.display = 'none';
        
        requestAnimationFrame(gameLoop);
    }
    
    // Инициализация планет
    function initPlanets() {
        gameState.planets = [];
        for (const [key, data] of Object.entries(planetsData)) {
            const angle = Math.random() * Math.PI * 2;
            const planet = {
                ...data,
                id: key,
                angle: angle,
                angleSpeed: 0.001 / Math.sqrt(data.orbitRadius),
                x: 600 + Math.cos(angle) * data.orbitRadius,
                y: 350 + Math.sin(angle) * data.orbitRadius
            };
            gameState.planets.push(planet);
        }
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
            gameState.currentTime += deltaTime * gameState.gameSpeed;
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
            if (planet.orbitRadius > 0) {
                planet.angle += planet.angleSpeed * deltaTime * gameState.gameSpeed;
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
            manualNavigate(deltaTime);
        }
        
        // Обновление скорости
        gameState.currentSpeed = Math.sqrt(
            gameState.shipVelocity.x ** 2 + gameState.shipVelocity.y ** 2
        );
    }
    
    // Ручная навигация
    function manualNavigate(deltaTime) {
        const target = gameState.planets.find(p => p.id === gameState.targetPlanet);
        const dx = target.x - gameState.shipPosition.x;
        const dy = target.y - gameState.shipPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < target.radius + 15) {
            // Достигли цели
            gameState.currentPlanet = gameState.targetPlanet;
            gameState.targetPlanet = null;
            gameState.shipOnOrbit = true;
            gameState.shipVelocity = { x: 0, y: 0 };
            statusTextEl.textContent = `Достигнута орбита ${target.name}`;
            landBtn.disabled = false;
            targetButtons.forEach(btn => btn.disabled = false);
        } else {
            // Двигаемся к цели
            const speed = 50 + (gameState.autoPilot ? 20 : 0);
            gameState.shipVelocity.x = (dx / distance) * speed;
            gameState.shipVelocity.y = (dy / distance) * speed;
            gameState.shipPosition.x += gameState.shipVelocity.x * deltaTime * gameState.gameSpeed;
            gameState.shipPosition.y += gameState.shipVelocity.y * deltaTime * gameState.gameSpeed;
        }
    }
    
    // Автонавигация (избегает радиационные пояса)
    function autoNavigate(deltaTime) {
        const target = gameState.planets.find(p => p.id === gameState.targetPlanet);
        const dx = target.x - gameState.shipPosition.x;
        const dy = target.y - gameState.shipPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < target.radius + 15) {
            // Достигли цели
            gameState.currentPlanet = gameState.targetPlanet;
            gameState.targetPlanet = null;
            gameState.shipOnOrbit = true;
            gameState.shipVelocity = { x: 0, y: 0 };
            statusTextEl.textContent = `Достигнута орбита ${target.name} (автопилот)`;
            landBtn.disabled = false;
            targetButtons.forEach(btn => btn.disabled = false);
        } else {
            // Избегаем радиационные пояса
            let avoidX = 0, avoidY = 0;
            
            // Избегаем Землю и Юпитер (и их пояса)
            if (gameState.currentPlanet !== 'earth' && gameState.currentPlanet !== 'jupiter') {
                const earth = gameState.planets.find(p => p.id === 'earth');
                const earthDist = Math.sqrt(
                    Math.pow(gameState.shipPosition.x - earth.x, 2) +
                    Math.pow(gameState.shipPosition.y - earth.y, 2)
                );
                
                if (earthDist < 250) {
                    avoidX += (gameState.shipPosition.x - earth.x) / earthDist * 100;
                    avoidY += (gameState.shipPosition.y - earth.y) / earthDist * 100;
                }
                
                const jupiter = gameState.planets.find(p => p.id === 'jupiter');
                const jupiterDist = Math.sqrt(
                    Math.pow(gameState.shipPosition.x - jupiter.x, 2) +
                    Math.pow(gameState.shipPosition.y - jupiter.y, 2)
                );
                
                if (jupiterDist < 450) {
                    avoidX += (gameState.shipPosition.x - jupiter.x) / jupiterDist * 150;
                    avoidY += (gameState.shipPosition.y - jupiter.y) / jupiterDist * 150;
                }
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
            
            gameState.shipPosition.x += gameState.shipVelocity.x * deltaTime * gameState.gameSpeed;
            gameState.shipPosition.y += gameState.shipVelocity.y * deltaTime * gameState.gameSpeed;
        }
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
            if (distToEarth > 180 && distToEarth < 220) {
                beltRadiation += 5;
            }
        }
        
        if (jupiter) {
            const distToJupiter = Math.sqrt(
                Math.pow(gameState.shipPosition.x - jupiter.x, 2) +
                Math.pow(gameState.shipPosition.y - jupiter.y, 2)
            );
            if (distToJupiter > 380 && distToJupiter < 420) {
                beltRadiation += 20;
            }
        }
        
        // Солнечные вспышки
        let solarFlareRadiation = 0;
        if (gameState.solarFlareActive) {
            solarFlareRadiation = 30;
            gameState.solarFlareTime -= deltaTime;
            if (gameState.solarFlareTime <= 0) {
                gameState.solarFlareActive = false;
            }
        } else if (Math.random() < 0.0001 * gameState.gameSpeed) {
            gameState.solarFlareActive = true;
            gameState.solarFlareTime = 8;
        }
        
        // Радиация во время полета
        let flightRadiation = 0;
        if (!gameState.shipOnOrbit) {
            flightRadiation = gameState.autoPilot ? 1 : 3;
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
        gameState.totalDose += doseRate * deltaTime * gameState.gameSpeed;
        
        // Обновление максимального пика
        if (gameState.radiationLevel > gameState.maxPeakRadiation) {
            gameState.maxPeakRadiation = gameState.radiationLevel;
        }
        
        // Предупреждения
        if (gameState.radiationLevel > 10 && !gameState.warningShown) {
            showWarning();
        }
        
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
    }
    
    // Отрисовка игры
    function renderGame() {
        // Фон
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Звезды
        drawStars();
        
        // Орбиты
        drawOrbits();
        
        // Планеты
        for (const planet of gameState.planets) {
            drawPlanet(planet);
        }
        
        // Радиационные пояса
        drawRadiationBelts();
        
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (const planet of gameState.planets) {
            if (planet.orbitRadius > 0) {
                ctx.beginPath();
                ctx.arc(600, 350, planet.orbitRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
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
            ctx.arc(600, 350, 180, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(600, 350, 220, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Радиация Юпитера
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
        ctx.beginPath();
        ctx.arc(600, 350, 380, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(600, 350, 420, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    function drawShip() {
        const shipX = gameState.shipPosition.x;
        const shipY = gameState.shipPosition.y;
        const time = Date.now() / 1000;
        
        // Основной корпус
        ctx.fillStyle = gameState.autoPilot ? '#00d4ff' : '#6c63ff';
        ctx.beginPath();
        ctx.ellipse(shipX, shipY, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Вращающееся кольцо
        ctx.save();
        ctx.translate(shipX, shipY);
        ctx.rotate(time * 0.5);
        
        ctx.strokeStyle = gameState.shieldLevel > 50 ? '#00ff00' : 
                         gameState.shieldLevel > 20 ? '#ff9800' : '#f44336';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Двигатели
        if (!gameState.shipOnOrbit) {
            ctx.fillStyle = '#ff6584';
            ctx.beginPath();
            ctx.ellipse(-8, 0, 3, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Цель
        if (gameState.targetPlanet) {
            const target = gameState.planets.find(p => p.id === gameState.targetPlanet);
            ctx.strokeStyle = '#00ff00';
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
    
    // Предупреждения
    function showWarning() {
        gameState.warningShown = true;
        warningOverlay.style.display = 'block';
        setTimeout(() => {
            warningOverlay.style.display = 'none';
        }, 5000);
    }
    
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
            gameState.shipOnOrbit = false;
            gameState.trajectory.push({...gameState.shipPosition});
            
            const travelTime = Math.random() * 2 + 1;
            statusTextEl.textContent = `Курс на ${target.name}. Время полета: ${travelTime.toFixed(1)} лет.`;
            landBtn.disabled = true;
            targetButtons.forEach(b => b.disabled = true);
        });
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
    
    // Кнопка скорости
    speedBtn.addEventListener('click', function() {
        const speeds = [1, 10, 100, 1000];
        const currentIndex = speeds.indexOf(gameState.gameSpeed);
        gameState.gameSpeed = speeds[(currentIndex + 1) % speeds.length];
        this.innerHTML = `<i class="fas fa-tachometer-alt"></i><span>Скорость: ${gameState.gameSpeed}x</span>`;
    });
    
    // Кнопка автопилота
    autoBtn.addEventListener('click', function() {
        if (!gameState.missionStarted || gameState.shipOnOrbit) return;
        
        gameState.autoPilot = !gameState.autoPilot;
        this.innerHTML = gameState.autoPilot ? 
            '<i class="fas fa-user"></i><span>Ручное управление</span>' : 
            '<i class="fas fa-robot"></i><span>Автополет</span>';
        this.style.background = gameState.autoPilot ? 'var(--neon-blue)' : 'var(--primary)';
        
        statusTextEl.textContent = gameState.autoPilot ? 
            'Автопилот активирован. Избегание радиационных поясов.' : 
            'Ручное управление. Будьте осторожны с радиацией!';
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