import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

/**
 * ModelLoader - Carrega modelos 3D em diversos formatos
 * Suporta: OBJ, FBX, GLTF, GLB, DAE
 */
export class ModelLoader {
    constructor(bridge, sceneManager) {
        this.bridge = bridge;
        this.sceneManager = sceneManager;
        
        this.gltfLoader = new GLTFLoader();
        this.objLoader = new OBJLoader();
        this.fbxLoader = new FBXLoader();
        
        this.onProgress = null;
        this.onError = null;
        
        console.log('ModelLoader inicializado');
    }
    
    loadModel(file, options = {}) {
        return new Promise((resolve, reject) => {
            const extension = file.name.split('.').pop().toLowerCase();
            const url = URL.createObjectURL(file);
            
            const onLoad = (model) => {
                URL.revokeObjectURL(url);
                resolve(this.processModel(model, file.name, options));
            };
            
            const onError = (error) => {
                URL.revokeObjectURL(url);
                reject(error);
            };
            
            switch (extension) {
                case 'gltf':
                case 'glb':
                    this.gltfLoader.load(url, onLoad, this.onProgress, onError);
                    break;
                case 'obj':
                    this.objLoader.load(url, onLoad, this.onProgress, onError);
                    break;
                case 'fbx':
                    this.fbxLoader.load(url, onLoad, this.onProgress, onError);
                    break;
                default:
                    reject(new Error(`Formato não suportado: ${extension}`));
            }
        });
    }
    
    processModel(model, fileName, options) {
        let mesh = null;
        
        if (model.scene) {
            mesh = model.scene;
        } else if (model.isGroup) {
            mesh = model;
        } else if (model.isMesh) {
            mesh = model;
        }
        
        if (!mesh) {
            throw new Error('Não foi possível extrair a malha do modelo');
        }
        
        mesh.userData = {
            name: fileName.replace(/\.[^/.]+$/, ''),
            type: 'imported',
            isSelectable: true,
            importedAt: Date.now()
        };
        
        // Ajustar para sistema Z-up (Blender style)
        if (options.convertToZUp !== false) {
            this.convertToZUp(mesh);
        }
        
        // Configurar sombras
        mesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.roughness = child.material.roughness || 0.5;
                    child.material.metalness = child.material.metalness || 0.1;
                }
            }
        });
        
        // Centralizar
        if (options.center !== false) {
            this.centerModel(mesh);
        }
        
        // Escalar se necessário
        if (options.scale) {
            mesh.scale.multiplyScalar(options.scale);
        }
        
        this.bridge.addToScene(mesh);
        
        // Extrair dados de geometria para edição
        this.extractGeometryData(mesh);
        
        console.log(`✅ Modelo importado: ${fileName}`);
        return mesh;
    }
    
    convertToZUp(obj) {
        obj.rotation.x = -Math.PI / 2;
        const oldY = obj.position.y;
        obj.position.y = obj.position.z;
        obj.position.z = -oldY;
    }
    
    centerModel(obj) {
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        obj.position.sub(center);
        obj.position.z = -box.min.z;
    }
    
    extractGeometryData(obj) {
        obj.traverse(child => {
            if (child.isMesh && child.geometry) {
                const geo = child.geometry;
                const positions = geo.attributes.position;
                const indices = geo.index;
                
                if (positions && indices) {
                    child.userData.vertices = [];
                    child.userData.indices = [];
                    child.userData.edges = [];
                    
                    for (let i = 0; i < positions.count; i++) {
                        child.userData.vertices.push(new THREE.Vector3(
                            positions.getX(i),
                            positions.getY(i),
                            positions.getZ(i)
                        ));
                    }
                    
                    for (let i = 0; i < indices.count; i++) {
                        child.userData.indices.push(indices.getX(i));
                    }
                    
                    const edgeSet = new Set();
                    for (let i = 0; i < indices.count; i += 3) {
                        const a = indices.getX(i);
                        const b = indices.getX(i + 1);
                        const c = indices.getX(i + 2);
                        const edge1 = [Math.min(a, b), Math.max(a, b)].join(',');
                        const edge2 = [Math.min(b, c), Math.max(b, c)].join(',');
                        const edge3 = [Math.min(c, a), Math.max(c, a)].join(',');
                        if (!edgeSet.has(edge1)) { edgeSet.add(edge1); child.userData.edges.push([a, b]); }
                        if (!edgeSet.has(edge2)) { edgeSet.add(edge2); child.userData.edges.push([b, c]); }
                        if (!edgeSet.has(edge3)) { edgeSet.add(edge3); child.userData.edges.push([c, a]); }
                    }
                }
            }
        });
    }
    
    setProgressCallback(callback) {
        this.onProgress = callback;
    }
    
    setErrorCallback(callback) {
        this.onError = callback;
    }
    
    getSupportedFormats() {
        return ['obj', 'fbx', 'gltf', 'glb', 'dae'];
    }
}