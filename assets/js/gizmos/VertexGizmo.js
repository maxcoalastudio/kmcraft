import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

/**
 * VertexGizmo - Gizmo para transformar vértices individualmente
 * Usado no modo edição para mover vértices selecionados
 */
export class VertexGizmo {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.gizmo = null;
        this.helperObject = null;
        this.currentVertexIndex = null;
        this.currentObject = null;
        this.isActive = false;
        this.onVertexMoved = null;
        
        this.init();
    }
    
    init() {
        this.gizmo = new TransformControls(this.camera, document.body);
        this.gizmo.setMode('translate');
        this.gizmo.setSize(0.6);
        
        this.gizmo.addEventListener('dragging-changed', (event) => {
            if (!event.value && this.currentVertexIndex !== null && this.currentObject) {
                this.updateVertexPosition();
            }
        });
        
        this.scene.add(this.gizmo);
        this.gizmo.visible = false;
        
        console.log('VertexGizmo inicializado');
    }
    
    attach(vertexIndex, object, worldPosition, onMoved = null) {
        this.detach();
        
        this.currentVertexIndex = vertexIndex;
        this.currentObject = object;
        this.onVertexMoved = onMoved;
        
        this.helperObject = new THREE.Object3D();
        this.helperObject.position.copy(worldPosition);
        this.scene.add(this.helperObject);
        
        this.gizmo.attach(this.helperObject);
        this.gizmo.visible = true;
        this.isActive = true;
    }
    
    updateVertexPosition() {
        if (!this.currentObject || this.currentVertexIndex === null || !this.helperObject) return;
        
        const newWorldPos = this.helperObject.position.clone();
        const localPos = this.currentObject.worldToLocal(newWorldPos);
        
        const geometry = this.currentObject.geometry;
        const positionAttribute = geometry.attributes.position;
        
        positionAttribute.setXYZ(this.currentVertexIndex, localPos.x, localPos.y, localPos.z);
        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
        
        if (this.currentObject.userData.vertices[this.currentVertexIndex]) {
            this.currentObject.userData.vertices[this.currentVertexIndex].copy(localPos);
        }
        
        if (this.onVertexMoved) {
            this.onVertexMoved(this.currentVertexIndex, newWorldPos);
        }
    }
    
    detach() {
        if (this.gizmo) {
            this.gizmo.detach();
            this.gizmo.visible = false;
        }
        if (this.helperObject) {
            this.scene.remove(this.helperObject);
            this.helperObject = null;
        }
        this.currentVertexIndex = null;
        this.currentObject = null;
        this.isActive = false;
    }
    
    update() {
        if (this.isActive && this.helperObject && this.currentObject && this.currentVertexIndex !== null) {
            const vertex = this.currentObject.userData.vertices[this.currentVertexIndex];
            if (vertex) {
                const worldPos = this.currentObject.localToWorld(vertex.clone());
                this.helperObject.position.copy(worldPos);
            }
        }
    }
    
    isDragging() {
        return this.gizmo?.dragging || false;
    }
}