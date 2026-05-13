import * as THREE from 'three';
import { GameObject } from '../gameobjects/GameObject.js';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.gameObjects = [];
        this.selectedGameObject = null;
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = null;
        this.setupGrid();
        this.setupLights();
        return this.scene;
    }

    setupGrid() {
        const grid = new THREE.GridHelper(16, 32, 0x555555, 0x333333);
        grid.rotation.x = Math.PI / 2;
        grid.position.set(0, 0, 0);
        this.scene.add(grid);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x8888aa, 0.6);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xfff5e0, 1.1);
        mainLight.position.set(5, -4, 8);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        const fillLight = new THREE.PointLight(0x557799, 0.4);
        fillLight.position.set(-3, 2, 4);
        this.scene.add(fillLight);
    }

    configureCamera(camera) {
        if (!camera) return;
        camera.up.set(0, 0, 1);
        camera.lookAt(0, 0, 0);
    }

    createDefaultScene() {
        const gameObject = new GameObject('WAVE Cube');
        gameObject.setPosition(0, 0, 1);
        this.addGameObject(gameObject);
        this.selectGameObject(gameObject);
    }

    addGameObject(gameObject) {
        this.scene.add(gameObject.mesh);
        this.gameObjects.push(gameObject);
        return gameObject;
    }

    removeGameObject(gameObject) {
        const index = this.gameObjects.indexOf(gameObject);
        if (index !== -1) {
            this.gameObjects.splice(index, 1);
        }
        this.scene.remove(gameObject.mesh);
    }

    selectGameObject(gameObject) {
        this.selectedGameObject = gameObject;
        return this.selectedGameObject;
    }

    getSelectedGameObject() {
        return this.selectedGameObject;
    }

    getAllGameObjects() {
        return [...this.gameObjects];
    }

    getGameObjectCount() {
        return this.gameObjects.length;
    }

    update(deltaTime, inputManager, physicsWorld) {
        for (const gameObject of this.gameObjects) {
            gameObject.update(deltaTime);
        }
    }

    // Compatibilidade com código antigo
    addObject(mesh) {
        this.scene.add(mesh);
        return mesh;
    }

    removeObject(mesh) {
        this.scene.remove(mesh);
    }

    selectObject(mesh) {
        this.selectedGameObject = mesh.userData.gameObject || null;
        return this.selectedGameObject;
    }

    getSelectedObject() {
        return this.selectedGameObject?.mesh || null;
    }

    getAllObjects() {
        return this.gameObjects.map(go => go.mesh);
    }

    getObjectCount() {
        return this.gameObjects.length;
    }
}