export class PhysicsWorld {
    constructor() {
        this.gravity = { x: 0, y: 0, z: -9.81 };
        this.bodies = [];
    }

    addBody(body) {
        this.bodies.push(body);
    }

    removeBody(body) {
        this.bodies = this.bodies.filter((item) => item !== body);
    }

    step(deltaTime) {
        if (deltaTime <= 0) return;
        for (const body of this.bodies) {
            if (!body || !body.mesh || body.isStatic) continue;
            body.velocity = body.velocity || { x: 0, y: 0, z: 0 };
            body.velocity.z += this.gravity.z * deltaTime;
            body.mesh.position.x += body.velocity.x * deltaTime;
            body.mesh.position.y += body.velocity.y * deltaTime;
            body.mesh.position.z += body.velocity.z * deltaTime;
            if (body.mesh.position.z < 0) {
                body.mesh.position.z = 0;
                body.velocity.z *= -0.35;
            }
        }
    }
}
