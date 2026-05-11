import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.objects = [];
        this.selectedObject = null;
        this.gridHelper = null;
        this.axesHelpers = [];
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = null;
        
        this.setupGridAndAxes();
        this.setupLights();
        
        return this.scene;
    }
    
    setupGridAndAxes() {
        // Grid
        this.gridHelper = new THREE.GridHelper(12, 24, 0x555555, 0x333333);
        this.gridHelper.position.z = -0.01;
        this.gridHelper.rotation.x = Math.PI / 2;
        this.scene.add(this.gridHelper);
        
        // Eixos coloridos
        const axesMaterial = {
            X: new THREE.LineBasicMaterial({ color: 0xff3333 }),
            Y: new THREE.LineBasicMaterial({ color: 0x33ff33 }),
            Z: new THREE.LineBasicMaterial({ color: 0x3333ff })
        };
        
        const axesPoints = {
            X: [[-8, 0, 0], [8, 0, 0]],
            Y: [[0, -8, 0], [0, 8, 0]],
            Z: [[0, 0, -8], [0, 0, 8]]
        };
        
        for (const [axis, points] of Object.entries(axesPoints)) {
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p[0], p[1], p[2]))),
                axesMaterial[axis]
            );
            this.scene.add(line);
            this.axesHelpers.push(line);
        }
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambientLight);
        
        const mainLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
        mainLight.position.set(5, -4, 8);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        
        const fillLight = new THREE.PointLight(0x557799, 0.4);
        fillLight.position.set(-3, 2, 4);
        this.scene.add(fillLight);
    }
    
    addObject(object) {
        this.scene.add(object);
        this.objects.push(object);
        object.userData.id = this.objects.length;
        return object;
    }
    
    removeObject(object) {
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
        this.scene.remove(object);
        
        // Limpar geometria e material
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
    }
    
    selectObject(object) {
        this.selectedObject = object;
        return this.selectedObject;
    }
    
    getSelectedObject() {
        return this.selectedObject;
    }
    
    getAllObjects() {
        return this.objects;
    }
    
    getObjectCount() {
        return this.objects.length;
    }
    
    toggleGrid(enabled) {
        this.gridHelper.visible = enabled !== undefined ? enabled : !this.gridHelper.visible;
        return this.gridHelper.visible;
    }
    
    toggleAxes(enabled) {
        this.axesHelpers.forEach(helper => {
            helper.visible = enabled !== undefined ? enabled : !helper.visible;
        });
        return this.axesHelpers[0]?.visible || false;
    }
}