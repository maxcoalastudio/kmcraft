import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { EditMode } from '../editors/EditMode.js';
import { ObjectMode } from '../editors/ObjectMode.js';

export class EditorManager {
    constructor(engine, container) {
        this.engine = engine;
        this.container = container;
        this.orbitControls = null;
        this.transformGizmo = null;
        this.editMode = null;
        this.objectMode = null;
        this.currentMode = 'object';
        this.init();
    }

    init() {
        this.setupOrbitControls();
        this.setupTransformGizmo();
        this.setupModes();
        this.updateMode();
    }

    setupOrbitControls() {
        this.orbitControls = new OrbitControls(this.engine.camera, this.container);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.orbitControls.rotateSpeed = 1.5;
        this.orbitControls.zoomSpeed = 1.2;
        this.orbitControls.panSpeed = 0.8;
        this.orbitControls.screenSpacePanning = true;
        this.orbitControls.maxPolarAngle = Math.PI;
        this.orbitControls.minPolarAngle = 0;
        this.orbitControls.target.set(0, 0, 0);
    }

    setupTransformGizmo() {
        this.transformGizmo = new TransformControls(this.engine.camera, this.container);
        this.transformGizmo.addEventListener('dragging-changed', (event) => {
            this.orbitControls.enabled = !event.value;
        });
        this.engine.sceneManager.scene.add(this.transformGizmo);
    }

    setupModes() {
        this.objectMode = new ObjectMode(this.engine.sceneManager, this.transformGizmo, (message) => {
            this.updateStatus(message);
        });
        this.editMode = new EditMode(this.engine.sceneManager, this.engine.camera, (message) => {
            this.updateStatus(message);
        });
    }

    updateMode() {
        if (this.currentMode === 'object') {
            this.objectMode.enter();
            this.editMode.exit();
        } else if (this.currentMode === 'edit') {
            const selectedGameObject = this.engine.sceneManager.getSelectedGameObject();
            const selectedMesh = selectedGameObject ? selectedGameObject.mesh : null;
            this.editMode.enter(selectedMesh);
            this.objectMode.exit();
        }
    }

    switchMode(mode) {
        if (mode === this.currentMode) return;
        this.currentMode = mode;
        this.updateMode();
    }

    update(deltaTime) {
        this.orbitControls.update();
        if (this.currentMode === 'edit') {
            this.editMode.update(deltaTime);
        }
    }

    updateStatus(message) {
        const statusBar = document.getElementById('status-bar');
        if (statusBar) {
            statusBar.querySelector('span').textContent = message;
        }
    }

    updateContainer(newContainer) {
        this.container = newContainer;
        
        // Update OrbitControls
        if (this.orbitControls) {
            this.orbitControls.dispose();
        }
        this.setupOrbitControls();
        
        // Update TransformControls
        if (this.transformGizmo) {
            this.transformGizmo.dispose();
            this.engine.sceneManager.scene.remove(this.transformGizmo);
        }
        this.setupTransformGizmo();
        
        // Update modes if they need container updates
        if (this.objectMode && this.objectMode.updateContainer) {
            this.objectMode.updateContainer(newContainer);
        }
        if (this.editMode && this.editMode.updateContainer) {
            this.editMode.updateContainer(newContainer);
        }
    }
}
