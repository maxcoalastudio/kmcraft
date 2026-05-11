import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

export class RenderManager {
    constructor(container, scene, camera) {
        this.container = container;
        this.scene = scene;
        this.camera = camera;
        this.renderer = null;
        this.composer = null;
        this.outlinePass = null;
        
        this.init();
    }
    
    init() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x1a1a1a, 1);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        
        // Effect Composer para outline
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        this.outlinePass = new OutlinePass(
            new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
            this.scene,
            this.camera
        );
        this.outlinePass.edgeStrength = 3.0;
        this.outlinePass.edgeGlow = 0.5;
        this.outlinePass.edgeThickness = 1.5;
        this.outlinePass.visibleEdgeColor.setHex(0x00BFFF);
        this.outlinePass.hiddenEdgeColor.setHex(0x000000);
        this.composer.addPass(this.outlinePass);
    }
    
    render() {
        this.composer.render();
    }
    
    setOutlineObjects(objects) {
        if (this.outlinePass) {
            this.outlinePass.selectedObjects = objects;
        }
    }
    
    getDomElement() {
        return this.renderer.domElement;
    }
    
    resize(width, height) {
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
        if (this.outlinePass) {
            this.outlinePass.setSize(width, height);
        }
    }
}