import * as THREE from 'three';

/**
 * GameEngine - Motor de jogo baseado no UPBGE 2.5
 * Gerencia física, inputs, lógica de jogo e renderização em tempo real
 */
export class GameEngine {
    constructor(sceneManager, cameraController) {
        this.sceneManager = sceneManager;
        this.cameraController = cameraController;
        
        this.isRunning = false;
        this.isPaused = false;
        this.gameObjects = new Map();
        this.physicsWorld = null;
        
        // Inputs
        this.keyboardState = new Map();
        this.mouseState = { x: 0, y: 0, buttons: new Map() };
        this.gamepads = [];
        
        // Eventos
        this.onUpdateCallbacks = [];
        this.onCollisionCallbacks = [];
        
        this.init();
    }
    
    init() {
        this.setupInputEvents();
        console.log('GameEngine inicializado');
    }
    
    setupInputEvents() {
        window.addEventListener('keydown', (e) => {
            this.keyboardState.set(e.code, true);
            this.handleGameAction('keydown', e.code);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keyboardState.set(e.code, false);
            this.handleGameAction('keyup', e.code);
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouseState.x = e.clientX;
            this.mouseState.y = e.clientY;
        });
        
        window.addEventListener('mousedown', (e) => {
            this.mouseState.buttons.set(e.button, true);
            this.handleGameAction('mousedown', e.button);
        });
        
        window.addEventListener('mouseup', (e) => {
            this.mouseState.buttons.set(e.button, false);
        });
        
        // Gamepad
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepads.push(e.gamepad);
            console.log(`Gamepad conectado: ${e.gamepad.id}`);
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            const index = this.gamepads.findIndex(g => g.index === e.gamepad.index);
            if (index !== -1) this.gamepads.splice(index, 1);
        });
    }
    
    registerGameObject(object, logic = null) {
        const id = object.userData.id || Date.now();
        this.gameObjects.set(id, {
            object,
            logic,
            components: new Map()
        });
        return id;
    }
    
    unregisterGameObject(id) {
        this.gameObjects.delete(id);
    }
    
    addComponent(gameObjectId, componentName, componentData) {
        const gameObj = this.gameObjects.get(gameObjectId);
        if (gameObj) {
            gameObj.components.set(componentName, componentData);
        }
    }
    
    handleGameAction(action, code) {
        // Processar ações do jogo
        for (const [id, gameObj] of this.gameObjects) {
            if (gameObj.logic && gameObj.logic.onInput) {
                gameObj.logic.onInput(action, code);
            }
        }
    }
    
    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        if (!this.isPaused) {
            this.update();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        const deltaTime = 1 / 60; // Assumindo 60fps
        
        // Atualizar gamepads
        this.updateGamepads();
        
        // Atualizar lógica dos game objects
        for (const [id, gameObj] of this.gameObjects) {
            if (gameObj.logic && gameObj.logic.update) {
                gameObj.logic.update(deltaTime, this);
            }
        }
        
        // Callbacks de update
        this.onUpdateCallbacks.forEach(cb => cb(deltaTime));
    }
    
    updateGamepads() {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp && gp.connected) {
                // Atualizar estado do gamepad
                if (!this.gamepads.find(g => g.index === gp.index)) {
                    this.gamepads.push(gp);
                }
            }
        }
    }
    
    isKeyPressed(code) {
        return this.keyboardState.get(code) || false;
    }
    
    isMouseButtonPressed(button) {
        return this.mouseState.buttons.get(button) || false;
    }
    
    getMousePosition() {
        return { x: this.mouseState.x, y: this.mouseState.y };
    }
    
    getGamepad(index) {
        return this.gamepads.find(g => g.index === index);
    }
    
    exportGame() {
        const exportData = {
            version: '1.0.0',
            objects: [],
            gameObjects: []
        };
        
        for (const [id, gameObj] of this.gameObjects) {
            exportData.gameObjects.push({
                id,
                position: {
                    x: gameObj.object.position.x,
                    y: gameObj.object.position.y,
                    z: gameObj.object.position.z
                },
                components: Array.from(gameObj.components.keys())
            });
        }
        
        return exportData;
    }
}