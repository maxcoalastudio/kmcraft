import * as THREE from 'three';

/**
 * ThreeJSBridge - Camada de abstração para Three.js
 * Gerencia a comunicação entre o Blender UI e o Three.js
 */
export class ThreeJSBridge {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.animationId = null;
        this.isRunning = true;
        
        // Eventos
        this.onRenderCallbacks = [];
        this.onResizeCallbacks = [];
        
        this.init();
    }
    
    init() {
        // Criar cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        this.scene.fog = null;
        
        // Criar câmera (perspectiva padrão)
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.01,
            1000
        );
        this.camera.position.set(8, -6, 6);
        this.camera.up.set(0, 0, 1); // Z-up (Blender style)
        this.camera.lookAt(0, 0, 0);
        
        // Criar renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: false,
            preserveDrawingBuffer: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x111111, 1);
        
        this.container.appendChild(this.renderer.domElement);
        
        // Iniciar animação
        this.startAnimation();
        
        // Evento de resize
        window.addEventListener('resize', () => this.handleResize());
        
        console.log('ThreeJSBridge inicializado');
    }
    
    startAnimation() {
        const animate = () => {
            if (!this.isRunning) return;
            
            const delta = this.clock.getDelta();
            const time = this.clock.getElapsedTime();
            
            // Executar callbacks de render
            this.onRenderCallbacks.forEach(cb => cb(delta, time));
            
            this.renderer.render(this.scene, this.camera);
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    handleResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        
        this.onResizeCallbacks.forEach(cb => cb(width, height));
    }
    
    addToScene(object) {
        this.scene.add(object);
    }
    
    removeFromScene(object) {
        this.scene.remove(object);
    }
    
    getScene() {
        return this.scene;
    }
    
    getCamera() {
        return this.camera;
    }
    
    getRenderer() {
        return this.renderer;
    }
    
    onRender(callback) {
        this.onRenderCallbacks.push(callback);
    }
    
    onResize(callback) {
        this.onResizeCallbacks.push(callback);
    }
    
    takeScreenshot() {
        return this.renderer.domElement.toDataURL('image/png');
    }
    
    dispose() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
        this.renderer.dispose();
    }
}