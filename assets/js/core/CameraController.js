import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';

export class CameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.controls = null;
        this.isEnabled = true;
        
        this.init();
    }
    
    init() {
        this.controls = new OrbitControls(this.camera, this.domElement);
        
        // Configuração estilo Blender
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
        };
        
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 1.5;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        this.controls.screenSpacePanning = true;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.minPolarAngle = 0;
        this.controls.target.set(0, 0, 0);
    }
    
    update() {
        if (this.isEnabled) {
            this.controls.update();
        }
    }
    
    enable() {
        this.isEnabled = true;
        this.controls.enabled = true;
    }
    
    disable() {
        this.isEnabled = false;
        this.controls.enabled = false;
    }
    
    getPosition() {
        return this.camera.position.clone();
    }
    
    getTarget() {
        return this.controls.target.clone();
    }
    
    setTarget(x, y, z) {
        this.controls.target.set(x, y, z);
    }
    
    resetView() {
        this.camera.position.set(8, -6, 6);
        this.setTarget(0, 0, 0);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
    }
    
    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
}