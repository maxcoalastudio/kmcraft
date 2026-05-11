import * as THREE from 'three';

export class GeometryUtils {
    
    static extractGeometryData(mesh) {
        const geometry = mesh.geometry;
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
    
    static createDefaultCube() {
        const material = new THREE.MeshStandardMaterial({ color: 0xd18e5b, roughness: 0.4, metalness: 0.05 });
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 1);
        mesh.castShadow = true;
        mesh.userData = { name: 'Cube', isSelectable: true, vertices: [], indices: [], edges: [] };
        this.extractGeometryData(mesh);
        return mesh;
    }
    
    static createRandomCube() {
        const material = new THREE.MeshStandardMaterial({ color: 0xd18e5b, roughness: 0.4 });
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 2 + 1);
        mesh.userData = { name: `Cube_${Date.now()}`, isSelectable: true, vertices: [], indices: [], edges: [] };
        this.extractGeometryData(mesh);
        return mesh;
    }
    
    static recalculateEdges(mesh) {
        const indices = mesh.userData.indices;
        const vertices = mesh.userData.vertices;
        const edges = [];
        const edgeSet = new Set();
        
        for (let i = 0; i < indices.length; i += 3) {
            const a = indices[i];
            const b = indices[i + 1];
            const c = indices[i + 2];
            const edge1 = [Math.min(a, b), Math.max(a, b)].join(',');
            const edge2 = [Math.min(b, c), Math.max(b, c)].join(',');
            const edge3 = [Math.min(c, a), Math.max(c, a)].join(',');
            
            if (!edgeSet.has(edge1)) { edgeSet.add(edge1); edges.push([a, b]); }
            if (!edgeSet.has(edge2)) { edgeSet.add(edge2); edges.push([b, c]); }
            if (!edgeSet.has(edge3)) { edgeSet.add(edge3); edges.push([c, a]); }
        }
        
        mesh.userData.edges = edges;
    }
    
    static updateGeometry(mesh) {
        const geometry = mesh.geometry;
        const vertices = mesh.userData.vertices;
        const indices = mesh.userData.indices;
        
        const positions = [];
        vertices.forEach(v => positions.push(v.x, v.y, v.z));
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
    }
}