export class InputManager {
    constructor(windowContext) {
        this.windowContext = windowContext;
        this.keyboardState = new Map();
        this.mouseState = { x: 0, y: 0, buttons: new Map() };
        this.gamepads = [];
        this._listeners = {};
        this.setupListeners();
    }

    setupListeners() {
        this._listeners.keydown = (event) => {
            this.keyboardState.set(event.code, true);
        };
        this._listeners.keyup = (event) => {
            this.keyboardState.set(event.code, false);
        };
        this._listeners.mousemove = (event) => {
            this.mouseState.x = event.clientX;
            this.mouseState.y = event.clientY;
        };
        this._listeners.mousedown = (event) => {
            this.mouseState.buttons.set(event.button, true);
        };
        this._listeners.mouseup = (event) => {
            this.mouseState.buttons.set(event.button, false);
        };
        this._listeners.gamepadconnected = (event) => {
            this.gamepads.push(event.gamepad);
        };
        this._listeners.gamepaddisconnected = (event) => {
            this.gamepads = this.gamepads.filter((gamepad) => gamepad.index !== event.gamepad.index);
        };

        this.windowContext.addEventListener('keydown', this._listeners.keydown);
        this.windowContext.addEventListener('keyup', this._listeners.keyup);
        this.windowContext.addEventListener('mousemove', this._listeners.mousemove);
        this.windowContext.addEventListener('mousedown', this._listeners.mousedown);
        this.windowContext.addEventListener('mouseup', this._listeners.mouseup);
        this.windowContext.addEventListener('gamepadconnected', this._listeners.gamepadconnected);
        this.windowContext.addEventListener('gamepaddisconnected', this._listeners.gamepaddisconnected);
    }

    update() {
        const connected = this.windowContext.navigator.getGamepads?.() || [];
        for (let i = 0; i < connected.length; i++) {
            const gamepad = connected[i];
            if (gamepad && gamepad.connected && !this.gamepads.find((g) => g.index === gamepad.index)) {
                this.gamepads.push(gamepad);
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

    getGamepads() {
        return [...this.gamepads];
    }

    dispose() {
        if (!this.windowContext || !this._listeners) return;
        this.windowContext.removeEventListener('keydown', this._listeners.keydown);
        this.windowContext.removeEventListener('keyup', this._listeners.keyup);
        this.windowContext.removeEventListener('mousemove', this._listeners.mousemove);
        this.windowContext.removeEventListener('mousedown', this._listeners.mousedown);
        this.windowContext.removeEventListener('mouseup', this._listeners.mouseup);
        this.windowContext.removeEventListener('gamepadconnected', this._listeners.gamepadconnected);
        this.windowContext.removeEventListener('gamepaddisconnected', this._listeners.gamepaddisconnected);
        this._listeners = null;
    }
}
