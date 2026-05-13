import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { RenderManager } from './RenderManager.js';
import { InputManager } from './InputManager.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { EditorManager } from '../editor/EditorManager.js';

export class WAVEOnlineEngine {
    static sharedSceneManager = null;
    static sharedPhysicsWorld = null;
    static primaryEngine = null;

    static ensureSharedScene() {
        if (!WAVEOnlineEngine.sharedSceneManager) {
            WAVEOnlineEngine.sharedSceneManager = new SceneManager();
            WAVEOnlineEngine.sharedSceneManager.init();
            WAVEOnlineEngine.sharedSceneManager.createDefaultScene();
        }
        return WAVEOnlineEngine.sharedSceneManager;
    }

    static ensureSharedPhysics() {
        if (!WAVEOnlineEngine.sharedPhysicsWorld) {
            WAVEOnlineEngine.sharedPhysicsWorld = new PhysicsWorld();
        }
        return WAVEOnlineEngine.sharedPhysicsWorld;
    }

    constructor(container) {
        this.container = container;
        this.sceneManager = WAVEOnlineEngine.ensureSharedScene();
        this.inputManager = new InputManager(window);
        this.physicsWorld = WAVEOnlineEngine.ensureSharedPhysics();
        this.renderManager = null;
        this.editorManager = null;
        this.camera = null;
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.mode = 'editor'; // 'editor' ou 'runtime'
    }

    async init() {
        if (!this.container) {
            throw new Error('WAVE Online: container não encontrado.');
        }

        const scene = this.sceneManager.scene || this.sceneManager.init();
        this.camera = this.createCamera();
        this.renderManager = new RenderManager(this.container, scene, this.camera);

        this.sceneManager.configureCamera(this.camera);

        this.editorManager = new EditorManager(this, this.container);

        this._resizeHandler = () => this.renderManager.resize();
        window.addEventListener('resize', this._resizeHandler);
        this.renderManager.resize();

        if (!WAVEOnlineEngine.primaryEngine) {
            WAVEOnlineEngine.primaryEngine = this;
        }

        console.log('WAVE Online engine inicializado', { windowId: this.container.dataset?.threeViewHost });
        return true;
    }

    createCamera() {
        const width = this.container?.clientWidth || window.innerWidth;
        const height = this.container?.clientHeight || window.innerHeight;
        const aspect = width && height ? width / height : 1.777;
        const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        camera.position.set(10, -10, 10);
        camera.up.set(0, 0, 1);
        camera.lookAt(0, 0, 0);
        return camera;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    stop() {
        this.isRunning = false;
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            requestAnimationFrame((time) => this.loop(time));
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = timestamp;

        if (!WAVEOnlineEngine.primaryEngine || WAVEOnlineEngine.primaryEngine === this) {
            this.updateShared(deltaTime);
        }

        if (this.mode === 'editor' && this.editorManager) {
            this.editorManager.update(deltaTime);
        }

        this.renderManager.render(deltaTime);

        requestAnimationFrame((time) => this.loop(time));
    }

    updateShared(deltaTime) {
        this.inputManager.update();
        this.physicsWorld.step(deltaTime);
        this.sceneManager.update(deltaTime, this.inputManager, this.physicsWorld);
    }

    switchMode(mode) {
        if (mode === this.mode) return;
        this.mode = mode;
        if (this.editorManager) {
            if (mode === 'editor') {
                this.editorManager.updateMode();
            } else if (mode === 'runtime') {
                // Desabilitar controles do editor
                this.editorManager.orbitControls.enabled = false;
                this.editorManager.transformGizmo.visible = false;
            }
        }
    }

    getEditorManager() {
        return this.editorManager;
    }

    dispose() {
        this.stop();

        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        if (this.renderManager && this.renderManager.renderer) {
            const canvas = this.renderManager.renderer.domElement;
            if (canvas && canvas.parentElement) {
                canvas.parentElement.removeChild(canvas);
            }
            this.renderManager.renderer.dispose();
        }

        if (this.inputManager?.dispose) {
            this.inputManager.dispose();
        }

        if (WAVEOnlineEngine.primaryEngine === this) {
            WAVEOnlineEngine.primaryEngine = null;
        }

        this.renderManager = null;
        this.editorManager = null;
        this.inputManager = null;
    }
}
