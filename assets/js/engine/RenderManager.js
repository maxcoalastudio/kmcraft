import * as THREE from 'three';

export class RenderManager {
    constructor(container, scene, camera) {
        this.container = container;
        this.scene = scene;
        this.camera = camera;
        this.renderer = null;
        this.initRenderer();
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, stencil: false, depth: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x1a1a1a, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    resize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (!width || !height) return;
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    render(deltaTime) {
        if (!this.renderer) return;
        this.renderer.render(this.scene, this.camera);
    }
}
