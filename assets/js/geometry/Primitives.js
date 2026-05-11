import * as THREE from 'three';

/**
 * Primitives - Geração de formas geométricas primitivas
 * Cubo, Esfera, Cilindro, Cone, Plano, Toro, Suzane
 */
export class Primitives {
    
    static createCube(size = 2) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({ color: 0xd18e5b, roughness: 0.4, metalness: 0.05 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { name: 'Cube', type: 'mesh', isSelectable: true };
        this.extractGeometryData(mesh);
        return mesh;
    }
    
    static createPlane(width = 2, depth = 2) {
        const geometry = new THREE.PlaneGeometry(width, depth);
        const material = new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = Math.PI / 2;
        mesh.userData = { name: 'Plane', type: 'mesh', isSelectable: true };
        this.extractGeometryData(mesh);
        return mesh;
    }
    
    static createSphere(radius = 1, segments = 32) {
        const geometry = new THREE.SphereGeometry(radius, segments, segments);
        const material = new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.3, metalness: 0.2 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { name: 'Sphere', type: 'mesh', isSelectable: true };
        this.extractGeometryData(mesh);
        return mesh;
    }
    
    static createCylinder(radius = 1, height = 2, segments = 32) {
        const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
        const material = new THREE.MeshStandardMaterial({ color: 0xd18e5b, roughness: 0.4, metalness: 0.05 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { name: 'Cylinder', type: 'mesh', isSelectable: true };
        this.extractGeometryData(mesh);
        return mesh;
    }
    
    static createCone(radius = 1, height = 2, segments = 32) {
        const geometry = new THREE.ConeGeometry(radius, height, segments);
        const material = new THREE.MeshStandardMaterial({ color: 0xd18e5b, roughness: 0.4, metalness: 0.05 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { name: 'Cone', type: 'mesh', isSelectable: true };
        this.extractGeometryData(mesh);
        return mesh;
    }
    
    static createTorus(radius = 1, tube = 0.4, radialSegments = 48, tubularSegments = 64) {
        const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
        const material = new THREE.MeshStandardMaterial({ color: 0xd18e5b, roughness: 0.4, metalness: 0.5 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { name: 'Torus', type: 'mesh', isSelectable: true };
        this.extractGeometryData(mesh);
        return mesh;
    }
    
    static createCircle(radius = 1, segments = 32) {
        const geometry = new THREE.CircleGeometry(radius, segments);
        const material = new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { name: 'Circle', type: 'mesh', isSelectable: true };
        this.extractGeometryData(mesh);
        return mesh;
    }
    
    static createSuzanne() {
        const group = new THREE.Group();
        
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd18e5b, roughness: 0.3 });
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), headMat);
        head.position.y = 0;
        group.add(head);
        
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), eyeMat);
        leftEye.position.set(-0.35, 0.25, 0.8);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), eyeMat);
        rightEye.position.set(0.35, 0.25, 0.8);
        group.add(rightEye);
        
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), pupilMat);
        leftPupil.position.set(-0.35, 0.22, 0.95);
        group.add(leftPupil);
        
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), pupilMat);
        rightPupil.position.set(0.35, 0.22, 0.95);
        group.add(rightPupil);
        
        const earMat = new THREE.MeshStandardMaterial({ color: 0xd18e5b });
        const leftEar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.5, 16), earMat);
        leftEar.position.set(-0.85, 0.1, 0);
        leftEar.rotation.z = 0.3;
        group.add(leftEar);
        
        const rightEar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.5, 16), earMat);
        rightEar.position.set(0.85, 0.1, 0);
        rightEar.rotation.z = -0.3;
        group.add(rightEar);
        
        group.userData = { name: 'Suzanne', type: 'group', isSelectable: true };
        return group;
    }
    
    static extractGeometryData(mesh) {
        if (!mesh.geometry) return;
        
        const geometry = mesh.geometry;
        if (!geometry.index) {
            // Converter para indexed geometry
            const positions = geometry.attributes.position.array;
            const indices = [];
            for (let i = 0; i < positions.length / 3; i += 3) {
                indices.push(i, i + 1, i + 2);
            }
            geometry.setIndex(indices);
        }
        
        const positions = geometry.attributes.position;
        const indices = geometry.index;
        
        mesh.userData.vertices = [];
        mesh.userData.indices = [];
        mesh.userData.edges = [];
        
        for (let i = 0; i < positions.count; i++) {
            mesh.userData.vertices.push(new THREE.Vector3(
                positions.getX(i),
                positions.getY(i),
                positions.getZ(i)
            ));
        }
        
        for (let i = 0; i < indices.count; i++) {
            mesh.userData.indices.push(indices.getX(i));
        }
        
        const edgeSet = new Set();
        for (let i = 0; i < indices.count; i += 3) {
            const a = indices.getX(i);
            const b = indices.getX(i + 1);
            const c = indices.getX(i + 2);
            const edge1 = [Math.min(a, b), Math.max(a, b)].join(',');
            const edge2 = [Math.min(b, c), Math.max(b, c)].join(',');
            const edge3 = [Math.min(c, a), Math.max(c, a)].join(',');
            if (!edgeSet.has(edge1)) { edgeSet.add(edge1); mesh.userData.edges.push([a, b]); }
            if (!edgeSet.has(edge2)) { edgeSet.add(edge2); mesh.userData.edges.push([b, c]); }
            if (!edgeSet.has(edge3)) { edgeSet.add(edge3); mesh.userData.edges.push([c, a]); }
        }
    }
    
    static createPrimitive(type, params = {}) {
        switch(type) {
            case 'cube': return this.createCube(params.size || 2);
            case 'plane': return this.createPlane(params.width || 2, params.depth || 2);
            case 'sphere': return this.createSphere(params.radius || 1, params.segments || 32);
            case 'cylinder': return this.createCylinder(params.radius || 1, params.height || 2, params.segments || 32);
            case 'cone': return this.createCone(params.radius || 1, params.height || 2, params.segments || 32);
            case 'torus': return this.createTorus(params.radius || 1, params.tube || 0.4);
            case 'circle': return this.createCircle(params.radius || 1, params.segments || 32);
            case 'suzanne': return this.createSuzanne();
            default: return this.createCube();
        }
    }
}