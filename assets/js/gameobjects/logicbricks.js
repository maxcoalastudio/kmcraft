import { LogicBrickRegistry } from './GameObject.js';

/**
 * LogicBrick - Classe base para todos os tijolos de lógica
 */
export class LogicBrick {
    constructor(name = '') {
        this.name = name;
        this.gameObject = null;
        this.isActive = true;
    }

    toJSON() {
        return {
            type: this.constructor.name,
            name: this.name,
            isActive: this.isActive
        };
    }
}

/**
 * SENSORS - Detectam eventos
 */

// Always Sensor - Sempre ativo
export class AlwaysSensor extends LogicBrick {
    constructor(pulseMode = 'once') {
        super('Always');
        this.pulseMode = pulseMode; // 'once', 'true', 'false'
        this.hasTriggered = false;
    }

    evaluate() {
        if (!this.isActive) return false;

        switch (this.pulseMode) {
            case 'once':
                if (!this.hasTriggered) {
                    this.hasTriggered = true;
                    return true;
                }
                return false;
            case 'true':
                return true;
            case 'false':
                return false;
            default:
                return true;
        }
    }

    toJSON() {
        return {
            ...super.toJSON(),
            pulseMode: this.pulseMode,
            hasTriggered: this.hasTriggered
        };
    }

    static fromJSON(data) {
        const sensor = new AlwaysSensor(data.pulseMode);
        sensor.name = data.name;
        sensor.isActive = data.isActive;
        sensor.hasTriggered = data.hasTriggered;
        return sensor;
    }
}

// Keyboard Sensor - Detecta entrada do teclado
export class KeyboardSensor extends LogicBrick {
    constructor(key = 'Space', mode = 'pressed') {
        super(`Keyboard ${key}`);
        this.key = key;
        this.mode = mode; // 'pressed', 'released', 'held'
        this.wasPressed = false;
    }

    evaluate() {
        if (!this.isActive || !this.gameObject) return false;

        const inputManager = window.engine?.inputManager;
        if (!inputManager) return false;

        const isPressed = inputManager.isKeyPressed(this.key);

        switch (this.mode) {
            case 'pressed':
                if (isPressed && !this.wasPressed) {
                    this.wasPressed = true;
                    return true;
                }
                if (!isPressed) {
                    this.wasPressed = false;
                }
                return false;
            case 'released':
                if (!isPressed && this.wasPressed) {
                    this.wasPressed = false;
                    return true;
                }
                if (isPressed) {
                    this.wasPressed = true;
                }
                return false;
            case 'held':
                return isPressed;
            default:
                return false;
        }
    }

    toJSON() {
        return {
            ...super.toJSON(),
            key: this.key,
            mode: this.mode,
            wasPressed: this.wasPressed
        };
    }

    static fromJSON(data) {
        const sensor = new KeyboardSensor(data.key, data.mode);
        sensor.name = data.name;
        sensor.isActive = data.isActive;
        sensor.wasPressed = data.wasPressed;
        return sensor;
    }
}

// Collision Sensor - Detecta colisões
export class CollisionSensor extends LogicBrick {
    constructor(targetProperty = '') {
        super('Collision');
        this.targetProperty = targetProperty;
        this.collidingObjects = new Set();
    }

    evaluate() {
        if (!this.isActive || !this.gameObject) return false;

        // Simulação básica de colisão
        const sceneManager = window.engine?.sceneManager;
        if (!sceneManager) return false;

        let hasCollision = false;
        const myCollider = this.gameObject.getComponent(window.Collider);

        for (const obj of sceneManager.objects) {
            if (obj === this.gameObject.mesh) continue;

            const otherGameObject = obj.userData.gameObject;
            if (!otherGameObject) continue;

            const otherCollider = otherGameObject.getComponent(window.Collider);
            if (myCollider && otherCollider && myCollider.checkCollision(otherCollider)) {
                if (!this.collidingObjects.has(otherGameObject)) {
                    this.collidingObjects.add(otherGameObject);
                    hasCollision = true;
                }
            } else {
                this.collidingObjects.delete(otherGameObject);
            }
        }

        return hasCollision;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            targetProperty: this.targetProperty
        };
    }

    static fromJSON(data) {
        const sensor = new CollisionSensor(data.targetProperty);
        sensor.name = data.name;
        sensor.isActive = data.isActive;
        return sensor;
    }
}

/**
 * CONTROLLERS - Processam sinais dos sensores
 */

// AND Controller - Ativa se todos os sensores conectados estiverem ativos
export class ANDController extends LogicBrick {
    constructor() {
        super('AND');
        this.connectedSensors = [];
        this.connectedActuators = [];
    }

    evaluate(activeSensors) {
        if (!this.isActive) return false;

        // Verifica se todos os sensores conectados estão ativos
        for (const sensor of this.connectedSensors) {
            if (!activeSensors.includes(sensor)) {
                return false;
            }
        }
        return this.connectedSensors.length > 0;
    }

    connectSensor(sensor) {
        if (!this.connectedSensors.includes(sensor)) {
            this.connectedSensors.push(sensor);
        }
    }

    connectActuator(actuator) {
        if (!this.connectedActuators.includes(actuator)) {
            this.connectedActuators.push(actuator);
        }
    }

    isConnectedTo(actuator) {
        return this.connectedActuators.includes(actuator);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            connectedSensors: this.connectedSensors.map(s => s.name),
            connectedActuators: this.connectedActuators.map(a => a.name)
        };
    }

    static fromJSON(data) {
        const controller = new ANDController();
        controller.name = data.name;
        controller.isActive = data.isActive;
        // Conexões serão restauradas depois
        return controller;
    }
}

/**
 * ACTUATORS - Executam ações
 */

// Motion Actuator - Move o objeto
export class MotionActuator extends LogicBrick {
    constructor() {
        super('Motion');
        this.force = new THREE.Vector3();
        this.torque = new THREE.Vector3();
        this.local = true;
    }

    execute(deltaTime) {
        if (!this.isActive || !this.gameObject) return;

        const rigidBody = this.gameObject.getComponent(window.RigidBody);
        if (rigidBody) {
            const force = this.local ?
                this.force.clone().applyEuler(this.gameObject.rotation) :
                this.force.clone();
            rigidBody.addForce(force.multiplyScalar(deltaTime));
        } else {
            // Movimento direto se não há física
            const movement = this.local ?
                this.force.clone().applyEuler(this.gameObject.rotation) :
                this.force.clone();
            this.gameObject.position.add(movement.multiplyScalar(deltaTime));
        }
    }

    setForce(x, y, z) {
        this.force.set(x, y, z);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            force: this.force.toArray(),
            torque: this.torque.toArray(),
            local: this.local
        };
    }

    static fromJSON(data) {
        const actuator = new MotionActuator();
        actuator.name = data.name;
        actuator.isActive = data.isActive;
        actuator.force.fromArray(data.force);
        actuator.torque.fromArray(data.torque);
        actuator.local = data.local;
        return actuator;
    }
}

// Visibility Actuator - Controla visibilidade
export class VisibilityActuator extends LogicBrick {
    constructor(visible = true) {
        super('Visibility');
        this.visible = visible;
    }

    execute(deltaTime) {
        if (!this.isActive || !this.gameObject) return;

        this.gameObject.mesh.visible = this.visible;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            visible: this.visible
        };
    }

    static fromJSON(data) {
        const actuator = new VisibilityActuator(data.visible);
        actuator.name = data.name;
        actuator.isActive = data.isActive;
        return actuator;
    }
}

// Property Actuator - Modifica propriedades
export class PropertyActuator extends LogicBrick {
    constructor(property = '', value = 0, mode = 'assign') {
        super('Property');
        this.property = property;
        this.value = value;
        this.mode = mode; // 'assign', 'add', 'multiply'
    }

    execute(deltaTime) {
        if (!this.isActive || !this.gameObject) return;

        let currentValue = this.gameObject.userData[this.property] || 0;

        switch (this.mode) {
            case 'assign':
                currentValue = this.value;
                break;
            case 'add':
                currentValue += this.value;
                break;
            case 'multiply':
                currentValue *= this.value;
                break;
        }

        this.gameObject.userData[this.property] = currentValue;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            property: this.property,
            value: this.value,
            mode: this.mode
        };
    }

    static fromJSON(data) {
        const actuator = new PropertyActuator(data.property, data.value, data.mode);
        actuator.name = data.name;
        actuator.isActive = data.isActive;
        return actuator;
    }
}

// Registrar logic bricks
LogicBrickRegistry.registerSensor('AlwaysSensor', AlwaysSensor);
LogicBrickRegistry.registerSensor('KeyboardSensor', KeyboardSensor);
LogicBrickRegistry.registerSensor('CollisionSensor', CollisionSensor);

LogicBrickRegistry.registerController('ANDController', ANDController);

LogicBrickRegistry.registerActuator('MotionActuator', MotionActuator);
LogicBrickRegistry.registerActuator('VisibilityActuator', VisibilityActuator);
LogicBrickRegistry.registerActuator('PropertyActuator', PropertyActuator);