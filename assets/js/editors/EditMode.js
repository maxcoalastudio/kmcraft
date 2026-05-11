import * as THREE from 'three';
import { GeometryUtils } from '../utils/GeometryUtils.js';

export class EditMode {
    constructor(sceneManager, cameraController, onStatusUpdate) {
        this.sceneManager = sceneManager;
        this.cameraController = cameraController;
        this.onStatusUpdate = onStatusUpdate;
        
        this.isActive = false;
        this.currentObject = null;
        
        // Seleção - definida internamente
        this.selection = {
            vertices: new Set(),
            edges: new Set(),
            faces: new Set()
        };
        this.selectionType = 'vertex';
        
        // Elementos visuais
        this.vertexSprites = [];
        this.edgeLines = [];
        this.faceSprites = [];
        this.faceOverlays = [];
        
        // Texturas
        this.normalTexture = null;
        this.selectedTexture = null;
        
        this.initTextures();
    }
    
    initTextures() {
        const canvasNormal = document.createElement('canvas');
        canvasNormal.width = 4;
        canvasNormal.height = 4;
        const ctxN = canvasNormal.getContext('2d');
        ctxN.fillStyle = 'rgba(255,255,255,0.8)';
        ctxN.fillRect(1, 1, 2, 2);
        this.normalTexture = new THREE.CanvasTexture(canvasNormal);
        
        const canvasSel = document.createElement('canvas');
        canvasSel.width = 4;
        canvasSel.height = 4;
        const ctxS = canvasSel.getContext('2d');
        ctxS.fillStyle = '#00BFFF';
        ctxS.fillRect(1, 1, 2, 2);
        this.selectedTexture = new THREE.CanvasTexture(canvasSel);
    }
    
    enter(object) {
        if (!object || !object.userData.vertices) {
            this.updateStatus('Selecione um objeto editável primeiro', 'warning');
            return false;
        }
        
        this.isActive = true;
        this.currentObject = object;
        this.clearSelection();
        this.createVisualElements();
        this.updateVisuals();
        this.updateStatus('✏️ Modo Edição ativado | 1=Vértices, 2=Arestas, 3=Faces');
        return true;
    }
    
    exit() {
        this.isActive = false;
        this.clearVisualElements();
        this.currentObject = null;
        this.clearSelection();
        this.updateStatus('🔲 Modo Objeto ativado');
    }
    
    clearSelection() {
        this.selection.vertices.clear();
        this.selection.edges.clear();
        this.selection.faces.clear();
    }
    
    clearSelectionType(type) {
        this.selection[type + 's'].clear();
    }
    
    createVisualElements() {
        this.clearVisualElements();
        
        const vertices = this.currentObject.userData.vertices;
        const indices = this.currentObject.userData.indices;
        const edges = this.currentObject.userData.edges;
        
        if (!vertices || !indices) return;
        
        const spriteMat = new THREE.SpriteMaterial({ 
            map: this.normalTexture, 
            depthTest: true, 
            transparent: true 
        });
        
        // Vértices
        vertices.forEach((vertex, idx) => {
            const worldPos = this.currentObject.localToWorld(vertex.clone());
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.copy(worldPos);
            sprite.scale.set(0.06, 0.06, 1);
            sprite.userData = { type: 'vertex', index: idx };
            this.sceneManager.scene.add(sprite);
            this.vertexSprites.push(sprite);
        });
        
        // Arestas
        edges.forEach((edge, idx) => {
            const v1 = vertices[edge[0]];
            const v2 = vertices[edge[1]];
            const worldV1 = this.currentObject.localToWorld(v1.clone());
            const worldV2 = this.currentObject.localToWorld(v2.clone());
            const points = [worldV1, worldV2];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x88aaff });
            const line = new THREE.Line(geometry, material);
            line.userData = { type: 'edge', index: idx };
            this.sceneManager.scene.add(line);
            this.edgeLines.push(line);
        });
        
        // Faces
        for (let i = 0; i < indices.length; i += 3) {
            const i1 = indices[i];
            const i2 = indices[i + 1];
            const i3 = indices[i + 2];
            const v1 = vertices[i1];
            const v2 = vertices[i2];
            const v3 = vertices[i3];
            
            const worldV1 = this.currentObject.localToWorld(v1.clone());
            const worldV2 = this.currentObject.localToWorld(v2.clone());
            const worldV3 = this.currentObject.localToWorld(v3.clone());
            const center = new THREE.Vector3().add(worldV1).add(worldV2).add(worldV3).divideScalar(3);
            
            const faceSprite = new THREE.Sprite(spriteMat);
            faceSprite.position.copy(center);
            faceSprite.scale.set(0.05, 0.05, 1);
            faceSprite.userData = { type: 'face', index: i / 3 };
            this.sceneManager.scene.add(faceSprite);
            this.faceSprites.push(faceSprite);
            
            const verticesPos = [worldV1.x, worldV1.y, worldV1.z, worldV2.x, worldV2.y, worldV2.z, worldV3.x, worldV3.y, worldV3.z];
            const overlayGeo = new THREE.BufferGeometry();
            overlayGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesPos), 3));
            overlayGeo.setIndex([0, 1, 2]);
            const overlayMat = new THREE.MeshStandardMaterial({ color: 0x00BFFF, transparent: true, opacity: 0, side: THREE.DoubleSide });
            const overlay = new THREE.Mesh(overlayGeo, overlayMat);
            overlay.userData = { type: 'faceOverlay', index: i / 3 };
            this.sceneManager.scene.add(overlay);
            this.faceOverlays.push(overlay);
        }
    }
    
    clearVisualElements() {
        this.vertexSprites.forEach(s => this.sceneManager.scene.remove(s));
        this.edgeLines.forEach(l => this.sceneManager.scene.remove(l));
        this.faceSprites.forEach(s => this.sceneManager.scene.remove(s));
        this.faceOverlays.forEach(o => this.sceneManager.scene.remove(o));
        
        this.vertexSprites = [];
        this.edgeLines = [];
        this.faceSprites = [];
        this.faceOverlays = [];
    }
    
    updateVisuals() {
        this.vertexSprites.forEach(sprite => {
            const idx = sprite.userData.index;
            if (this.selection.vertices.has(idx)) {
                sprite.material.map = this.selectedTexture;
            } else {
                sprite.material.map = this.normalTexture;
            }
        });
        
        this.edgeLines.forEach(line => {
            const idx = line.userData.index;
            if (this.selection.edges.has(idx)) {
                line.material.color.setHex(0xffaa44);
            } else {
                line.material.color.setHex(0x88aaff);
            }
        });
        
        this.faceSprites.forEach(sprite => {
            const idx = sprite.userData.index;
            if (this.selection.faces.has(idx)) {
                sprite.material.map = this.selectedTexture;
            } else {
                sprite.material.map = this.normalTexture;
            }
        });
        
        this.faceOverlays.forEach(overlay => {
            const idx = overlay.userData.index;
            if (this.selection.faces.has(idx)) {
                overlay.material.opacity = 0.35;
            } else {
                overlay.material.opacity = 0;
            }
        });
    }
    
    handleSelection(type, index, shiftKey) {
        const key = type + 's';
        if (shiftKey) {
            if (this.selection[key].has(index)) {
                this.selection[key].delete(index);
            } else {
                this.selection[key].add(index);
            }
        } else {
            this.selection[key].clear();
            this.selection[key].add(index);
        }
        this.updateVisuals();
        this.updateStatus(`${type}s selecionados: ${this.selection[key].size}`);
    }
    
    selectAll() {
        const type = this.selectionType;
        const key = type + 's';
        const count = this[`${type}Sprites`]?.length || 0;
        
        if (this.selection[key].size > 0) {
            this.selection[key].clear();
            this.updateStatus(`Todos os ${type}s deselecionados`);
        } else {
            for (let i = 0; i < count; i++) {
                this.selection[key].add(i);
            }
            this.updateStatus(`Todos os ${type}s selecionados`);
        }
        this.updateVisuals();
    }
    
    setSelectionType(type) {
        this.selectionType = type;
        this.updateStatus(`Modo: ${type.toUpperCase()}S`);
    }
    
    getSelectionType() {
        return this.selectionType;
    }
    
    getSelectionCount() {
        return this.selection.vertices.size + this.selection.edges.size + this.selection.faces.size;
    }
    
    hasSelection() {
        return this.getSelectionCount() > 0;
    }
    
    update() {
        if (!this.isActive || !this.currentObject) return;
        
        // Atualizar posições dos sprites
        this.vertexSprites.forEach(sprite => {
            const vertex = this.currentObject.userData.vertices[sprite.userData.index];
            if (vertex) {
                sprite.position.copy(this.currentObject.localToWorld(vertex.clone()));
            }
        });
        
        // Atualizar arestas
        this.edgeLines.forEach(line => {
            const edge = this.currentObject.userData.edges[line.userData.index];
            if (edge) {
                const v1 = this.currentObject.userData.vertices[edge[0]];
                const v2 = this.currentObject.userData.vertices[edge[1]];
                const worldV1 = this.currentObject.localToWorld(v1.clone());
                const worldV2 = this.currentObject.localToWorld(v2.clone());
                const points = [worldV1, worldV2];
                line.geometry.dispose();
                line.geometry = new THREE.BufferGeometry().setFromPoints(points);
            }
        });
        
        // Atualizar faces
        this.faceSprites.forEach((sprite, idx) => {
            const i1 = this.currentObject.userData.indices[idx * 3];
            const i2 = this.currentObject.userData.indices[idx * 3 + 1];
            const i3 = this.currentObject.userData.indices[idx * 3 + 2];
            const v1 = this.currentObject.userData.vertices[i1];
            const v2 = this.currentObject.userData.vertices[i2];
            const v3 = this.currentObject.userData.vertices[i3];
            if (v1 && v2 && v3) {
                const worldV1 = this.currentObject.localToWorld(v1.clone());
                const worldV2 = this.currentObject.localToWorld(v2.clone());
                const worldV3 = this.currentObject.localToWorld(v3.clone());
                const center = new THREE.Vector3().add(worldV1).add(worldV2).add(worldV3).divideScalar(3);
                sprite.position.copy(center);
            }
        });
    }
    
    updateStatus(message, type = 'info') {
        if (this.onStatusUpdate) {
            this.onStatusUpdate(message, type);
        }
    }
}