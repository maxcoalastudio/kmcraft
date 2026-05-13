import { ComponentRegistry } from './GameObject.js';

/**
 * Component - Classe base para todos os componentes
 */
export class Component {
    constructor() {
        this.gameObject = null;
        this.isEnabled = true;
    }

    init() {
        // Chamado quando o componente é adicionado ao GameObject
    }

    update(deltaTime) {
        // Chamado a cada frame
    }

    destroy() {
        // Chamado quando o componente é removido
    }

    toJSON() {
        return {
            isEnabled: this.isEnabled
        };
    }
}

/**
 * Transform - Componente de transformação
 */
export class Transform extends Component {
    constructor() {
        super();
        this.localPosition = new THREE.Vector3();
        this.localRotation = new THREE.Euler();
        this.localScale = new THREE.Vector3(1, 1, 1);
    }

    init() {
        this.updateMeshTransform();
    }

    update(deltaTime) {
        this.updateMeshTransform();
    }

    updateMeshTransform() {
        if (this.gameObject && this.gameObject.mesh) {
            this.gameObject.mesh.position.copy(this.localPosition);
            this.gameObject.mesh.rotation.copy(this.localRotation);
            this.gameObject.mesh.scale.copy(this.localScale);
        }
    }

    setPosition(x, y, z) {
        this.localPosition.set(x, y, z);
        this.updateMeshTransform();
    }

    setRotation(x, y, z) {
        this.localRotation.set(x, y, z);
        this.updateMeshTransform();
    }

    setScale(x, y, z) {
        this.localScale.set(x, y, z);
        this.updateMeshTransform();
    }

    toJSON() {
        return {
            ...super.toJSON(),
            localPosition: this.localPosition.toArray(),
            localRotation: [this.localRotation.x, this.localRotation.y, this.localRotation.z],
            localScale: this.localScale.toArray()
        };
    }
}

/**
 * RigidBody - Componente de física
 */
export class RigidBody extends Component {
    constructor(mass = 1, shape = 'box') {
        super();
        this.mass = mass;
        this.shape = shape;
        this.velocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3();
        this.isKinematic = false;
        this.useGravity = true;
        this.physicsBody = null;
    }

    init() {
        // Inicializar corpo físico
        this.createPhysicsBody();
    }

    createPhysicsBody() {
        // Placeholder para integração com biblioteca de física
        // Por enquanto, simulação básica
        this.physicsBody = {
            position: this.gameObject.position.clone(),
            velocity: this.velocity.clone(),
            mass: this.mass
        };
    }

    update(deltaTime) {
        if (this.isKinematic || !this.physicsBody) return;

        // Aplicar gravidade
        if (this.useGravity) {
            this.velocity.y -= 9.81 * deltaTime;
        }

        // Atualizar posição
        this.gameObject.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Colisão simples com chão
        if (this.gameObject.position.y < 0) {
            this.gameObject.position.y = 0;
            this.velocity.y *= -0.3; // Rebote
        }
    }

    addForce(force) {
        if (this.physicsBody) {
            this.velocity.add(force.divideScalar(this.mass));
        }
    }

    setVelocity(x, y, z) {
        this.velocity.set(x, y, z);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            mass: this.mass,
            shape: this.shape,
            velocity: this.velocity.toArray(),
            angularVelocity: this.angularVelocity.toArray(),
            isKinematic: this.isKinematic,
            useGravity: this.useGravity
        };
    }
}

/**
 * Renderer - Componente de renderização
 */
export class Renderer extends Component {
    constructor(material = null, geometry = null) {
        super();
        this.material = material || new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.geometry = geometry || new THREE.BoxGeometry(1, 1, 1);
        this.castShadow = true;
        this.receiveShadow = true;
    }

    init() {
        if (this.gameObject && this.gameObject.mesh) {
            this.gameObject.mesh.material = this.material;
            this.gameObject.mesh.geometry = this.geometry;
            this.gameObject.mesh.castShadow = this.castShadow;
            this.gameObject.mesh.receiveShadow = this.receiveShadow;
        }
    }

    setMaterial(material) {
        this.material = material;
        if (this.gameObject && this.gameObject.mesh) {
            this.gameObject.mesh.material = material;
        }
    }

    setGeometry(geometry) {
        this.geometry = geometry;
        if (this.gameObject && this.gameObject.mesh) {
            this.gameObject.mesh.geometry = geometry;
        }
    }

    toJSON() {
        return {
            ...super.toJSON(),
            material: this.material.toJSON ? this.material.toJSON() : {},
            geometry: this.geometry.toJSON ? this.geometry.toJSON() : {},
            castShadow: this.castShadow,
            receiveShadow: this.receiveShadow
        };
    }
}

/**
 * Collider - Componente de colisão
 */
export class Collider extends Component {
    constructor(shape = 'box', isTrigger = false) {
        super();
        this.shape = shape;
        this.isTrigger = isTrigger;
        this.bounds = null;
    }

    init() {
        this.updateBounds();
    }

    updateBounds() {
        if (!this.gameObject || !this.gameObject.mesh) return;

        const geometry = this.gameObject.mesh.geometry;
        geometry.computeBoundingBox();
        this.bounds = geometry.boundingBox.clone();
    }

    checkCollision(otherCollider) {
        if (!this.bounds || !otherCollider.bounds) return false;

        // Bounding box collision
        return this.bounds.intersectsBox(otherCollider.bounds);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            shape: this.shape,
            isTrigger: this.isTrigger
        };
    }
}

// Registrar componentes
ComponentRegistry.set('Transform', Transform);
ComponentRegistry.set('RigidBody', RigidBody);
ComponentRegistry.set('Renderer', Renderer);
ComponentRegistry.set('Collider', Collider);