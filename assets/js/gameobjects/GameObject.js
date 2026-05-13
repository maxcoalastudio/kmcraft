import * as THREE from 'three';

/**
 * GameObject - Objeto de jogo no estilo UPBGE
 * Representa um objeto na cena com componentes e lógica
 */
export class GameObject {
    constructor(name = 'GameObject', mesh = null) {
        this.name = name;
        this.mesh = mesh || new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
        this.components = new Map();
        this.children = [];
        this.parent = null;
        this.isActive = true;
        this.userData = {};

        // Propriedades UPBGE-like
        this.logicBricks = {
            sensors: [],
            controllers: [],
            actuators: []
        };

        // Estado
        this.position = this.mesh.position;
        this.rotation = this.mesh.rotation;
        this.scale = this.mesh.scale;

        // Inicializar
        this.init();
        this.setupEditableProperties();
    }

    setupEditableProperties() {
        // Configurar propriedades para modo de edição (compatibilidade com EditMode)
        if (this.mesh.geometry) {
            this.mesh.userData.vertices = this.mesh.geometry.attributes.position.array;
            this.mesh.userData.faces = this.mesh.geometry.index ? this.mesh.geometry.index.array : null;
            this.mesh.userData.isEditable = true;
            this.mesh.userData.gameObject = this;
        }
    }

    init() {
        // Configurar userData para identificação
        this.mesh.userData.gameObject = this;
        this.mesh.userData.name = this.name;
        this.mesh.userData.type = 'gameObject';
    }

    addComponent(component) {
        if (component.gameObject) {
            component.gameObject.removeComponent(component);
        }

        component.gameObject = this;
        this.components.set(component.constructor.name, component);

        if (component.init) {
            component.init();
        }

        return component;
    }

    getComponent(componentClass) {
        return this.components.get(componentClass.name) || null;
    }

    removeComponent(component) {
        const componentName = component.constructor.name;
        if (this.components.has(componentName)) {
            if (component.destroy) {
                component.destroy();
            }
            component.gameObject = null;
            this.components.delete(componentName);
        }
    }

    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }

        this.children.push(child);
        child.parent = this;
        this.mesh.add(child.mesh);
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            this.mesh.remove(child.mesh);
        }
    }

    // Logic Bricks (sensores, controladores, atuadores)
    addSensor(sensor) {
        sensor.gameObject = this;
        this.logicBricks.sensors.push(sensor);
        return sensor;
    }

    addController(controller) {
        controller.gameObject = this;
        this.logicBricks.controllers.push(controller);
        return controller;
    }

    addActuator(actuator) {
        actuator.gameObject = this;
        this.logicBricks.actuators.push(actuator);
        return actuator;
    }

    // Ciclo de vida
    update(deltaTime) {
        if (!this.isActive) return;

        // Atualizar componentes
        for (const component of this.components.values()) {
            if (component.update) {
                component.update(deltaTime);
            }
        }

        // Processar logic bricks
        this.processLogicBricks(deltaTime);

        // Atualizar filhos
        for (const child of this.children) {
            child.update(deltaTime);
        }
    }

    processLogicBricks(deltaTime) {
        // Sensores -> Controladores -> Atuadores
        const activeSensors = this.logicBricks.sensors.filter(sensor => sensor.evaluate());

        for (const controller of this.logicBricks.controllers) {
            const controllerActive = controller.evaluate(activeSensors);
            if (controllerActive) {
                for (const actuator of this.logicBricks.actuators) {
                    if (controller.isConnectedTo(actuator)) {
                        actuator.execute(deltaTime);
                    }
                }
            }
        }
    }

    // Utilitários
    setPosition(x, y, z) {
        this.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
    }

    setScale(x, y, z) {
        this.scale.set(x, y, z);
    }

    getWorldPosition() {
        return new THREE.Vector3().setFromMatrixPosition(this.mesh.matrixWorld);
    }

    getWorldDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        this.mesh.getWorldDirection(direction);
        return direction;
    }

    // Serialização
    toJSON() {
        return {
            name: this.name,
            position: this.position.toArray(),
            rotation: this.rotation.toArray(),
            scale: this.scale.toArray(),
            isActive: this.isActive,
            components: Array.from(this.components.entries()).map(([name, comp]) => ({
                type: name,
                data: comp.toJSON ? comp.toJSON() : {}
            })),
            logicBricks: {
                sensors: this.logicBricks.sensors.map(s => s.toJSON()),
                controllers: this.logicBricks.controllers.map(c => c.toJSON()),
                actuators: this.logicBricks.actuators.map(a => a.toJSON())
            },
            children: this.children.map(child => child.toJSON())
        };
    }

    static fromJSON(data, sceneManager) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial();
        const mesh = new THREE.Mesh(geometry, material);

        const gameObject = new GameObject(data.name, mesh);
        gameObject.position.fromArray(data.position);
        gameObject.rotation.fromArray(data.rotation);
        gameObject.scale.fromArray(data.scale);
        gameObject.isActive = data.isActive;

        // Restaurar componentes
        for (const compData of data.components) {
            const ComponentClass = ComponentRegistry.get(compData.type);
            if (ComponentClass) {
                const component = new ComponentClass(compData.data);
                gameObject.addComponent(component);
            }
        }

        // Restaurar logic bricks
        for (const sensorData of data.logicBricks.sensors) {
            const SensorClass = LogicBrickRegistry.getSensor(sensorData.type);
            if (SensorClass) {
                const sensor = SensorClass.fromJSON(sensorData);
                gameObject.addSensor(sensor);
            }
        }

        for (const controllerData of data.logicBricks.controllers) {
            const ControllerClass = LogicBrickRegistry.getController(controllerData.type);
            if (ControllerClass) {
                const controller = ControllerClass.fromJSON(controllerData);
                gameObject.addController(controller);
            }
        }

        for (const actuatorData of data.logicBricks.actuators) {
            const ActuatorClass = LogicBrickRegistry.getActuator(actuatorData.type);
            if (ActuatorClass) {
                const actuator = ActuatorClass.fromJSON(actuatorData);
                gameObject.addActuator(actuator);
            }
        }

        // Adicionar à cena
        sceneManager.addObject(gameObject.mesh);

        return gameObject;
    }
}

// Registros globais para serialização
export const ComponentRegistry = new Map();
export const LogicBrickRegistry = {
    sensors: new Map(),
    controllers: new Map(),
    actuators: new Map(),

    registerSensor(name, clazz) {
        this.sensors.set(name, clazz);
    },

    registerController(name, clazz) {
        this.controllers.set(name, clazz);
    },

    registerActuator(name, clazz) {
        this.actuators.set(name, clazz);
    },

    getSensor(name) {
        return this.sensors.get(name);
    },

    getController(name) {
        return this.controllers.get(name);
    },

    getActuator(name) {
        return this.actuators.get(name);
    }
};