import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class TransformGizmo {
    constructor(scene, camera, domElement, onDraggingChanged) {
        this.scene = scene;
        this.camera = camera;
        this.domElement = domElement;
        this.onDraggingChanged = onDraggingChanged;
        this.gizmo = null;
        this.currentObject = null;
        this.mode = 'translate';
        
        this.init();
    }
    
    init() {
        this.gizmo = new TransformControls(this.camera, this.domElement);
        
        this.gizmo.addEventListener('dragging-changed', (event) => {
            if (this.onDraggingChanged) {
                this.onDraggingChanged(event.value);
            }
        });
        
        this.scene.add(this.gizmo);
        this.gizmo.visible = false;
    }
    
    attachTo(object) {
        if (this.currentObject !== object) {
            this.detach();
            this.currentObject = object;
            this.gizmo.attach(object);
            this.gizmo.visible = true;
            this.updateMode();
        }
    }
    
    detach() {
        if (this.currentObject) {
            this.gizmo.detach();
            this.currentObject = null;
            this.gizmo.visible = false;
        }
    }
    
    setMode(mode) {
        this.mode = mode;
        this.updateMode();
    }
    
    updateMode() {
        if (!this.gizmo) return;
        this.gizmo.setMode(this.mode);
        this.gizmo.setSize(0.8);
        this.gizmo.showX = true;
        this.gizmo.showY = true;
        this.gizmo.showZ = true;
    }
    
    show() {
        if (this.gizmo) this.gizmo.visible = true;
    }
    
    hide() {
        if (this.gizmo) this.gizmo.visible = false;
    }
    
    update() {
        if (this.gizmo && this.gizmo.object && this.currentObject) {
            const distance = this.camera.position.distanceTo(this.currentObject.position);
            const scale = Math.max(0.5, Math.min(1.5, distance / 6));
            this.gizmo.setSize(scale * 0.8);
        }
    }
    
    getMode() {
        return this.mode;
    }
}