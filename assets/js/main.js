import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const AppState = {
    mode: 'object',
    selectionType: 'vertex',
    selectedObject: null,
    objects: [],
    editMode: {
        active: false,
        selection: { vertices: new Set(), edges: new Set(), faces: new Set() },
        vertexSprites: [],
        edgeLines: [],
        faceOverlays: [],
        faceSprites: []
    }
};

document.addEventListener('DOMContentLoaded', () => init());

async function init() {
    const container = document.getElementById('canvas-container');
    
    // Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    
    // Câmera Z-up
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(8, -6, 6);
    camera.up.set(0, 0, 1);
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x1a1a1a, 1);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.rotateSpeed = 1.5;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI;
    
    // Grid
    const grid = new THREE.GridHelper(12, 24, 0x555555, 0x333333);
    grid.position.z = -0.01;
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);
    
    // Eixos
    const colors = { X: 0xff3333, Y: 0x33ff33, Z: 0x3333ff };
    const points = { X: [[-8,0,0],[8,0,0]], Y: [[0,-8,0],[0,8,0]], Z: [[0,0,-8],[0,0,8]] };
    for (const [axis, pts] of Object.entries(points)) {
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))),
            new THREE.LineBasicMaterial({ color: colors[axis] })
        );
        scene.add(line);
    }
    
    // Luzes
    scene.add(new THREE.AmbientLight(0x404060, 0.6));
    const mainLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    mainLight.position.set(5, -4, 8);
    mainLight.castShadow = true;
    scene.add(mainLight);
    const fillLight = new THREE.PointLight(0x557799, 0.4);
    fillLight.position.set(-3, 2, 4);
    scene.add(fillLight);
    
    // Cubo padrão
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0xd18e5b, roughness: 0.4 });
    const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.set(0, 0, 1);
    cube.castShadow = true;
    cube.userData = { name: 'Cube', vertices: [], indices: [], edges: [] };
    extractGeometryData(cube);
    scene.add(cube);
    AppState.selectedObject = cube;
    AppState.objects.push(cube);
    
    // TransformControls
    const transformGizmo = new TransformControls(camera, renderer.domElement);
    transformGizmo.addEventListener('dragging-changed', (e) => controls.enabled = !e.value);
    transformGizmo.attach(cube);
    scene.add(transformGizmo);
    
    // ==============================================
    // UI Manual (sem módulos externos)
    // ==============================================
    createToolbar();
    createPropertiesPanel();
    
    function createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'top-toolbar';
        toolbar.innerHTML = `
            <button id="tool-move" title="Mover (G)">📍</button>
            <button id="tool-rotate" title="Rotacionar (R)">🔄</button>
            <button id="tool-scale" title="Escalar (S)">📏</button>
            <span class="sep"></span>
            <button id="tool-vertex" title="Vértices (1)">⚫</button>
            <button id="tool-edge" title="Arestas (2)">📐</button>
            <button id="tool-face" title="Faces (3)">🔷</button>
            <span class="sep"></span>
            <button id="tool-object" title="Modo Objeto (Tab)">🔲</button>
            <button id="tool-edit" title="Modo Edição (Tab)">✏️</button>
            <span class="sep"></span>
            <button id="tool-add-cube" title="Adicionar Cubo">➕</button>
            <span class="obj-count">1 objeto</span>
        `;
        container.appendChild(toolbar);
        
        // Estilos inline para garantir funcionamento
        const style = document.createElement('style');
        style.textContent = `
            .top-toolbar { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; background: rgba(34,34,34,0.95); padding: 6px 14px; border-radius: 40px; border: 1px solid #3a3a3a; z-index: 200; }
            .top-toolbar button { width: 36px; height: 36px; background: transparent; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; color: #aaa; }
            .top-toolbar button:hover { background: #3a3a3a; color: #fff; }
            .top-toolbar button.active { background: #00BFFF; color: white; }
            .top-toolbar .sep { width: 1px; height: 28px; background: #3a3a3a; margin: 0 6px; }
            .top-toolbar .obj-count { margin-left: 12px; padding: 0 12px; font-size: 11px; color: #00BFFF; background: #252525; border-radius: 20px; height: 30px; display: flex; align-items: center; }
        `;
        document.head.appendChild(style);
        
        document.getElementById('tool-move').onclick = () => transformGizmo.setMode('translate');
        document.getElementById('tool-rotate').onclick = () => transformGizmo.setMode('rotate');
        document.getElementById('tool-scale').onclick = () => transformGizmo.setMode('scale');
        document.getElementById('tool-add-cube').onclick = () => addCube();
    }
    
    function createPropertiesPanel() {
        const panel = document.createElement('div');
        panel.className = 'properties-panel';
        panel.innerHTML = `
            <div class="resize-handle"></div>
            <div class="tabs">
                <button class="tab active" data-tab="object">📦</button>
                <button class="tab" data-tab="render">🎨</button>
                <button class="tab" data-tab="material">🎨</button>
                <button class="tab" data-tab="physics">⚡</button>
            </div>
            <div class="content">
                <div id="panel-object">
                    <h3>Transform</h3>
                    <div><label>X</label><input id="pos-x" type="number" step="0.01"></div>
                    <div><label>Y</label><input id="pos-y" type="number" step="0.01"></div>
                    <div><label>Z</label><input id="pos-z" type="number" step="0.01"></div>
                </div>
                <div id="panel-render" style="display:none"><h3>Render</h3><p>Configurações</p></div>
                <div id="panel-material" style="display:none"><h3>Material</h3><p>Configurações</p></div>
                <div id="panel-physics" style="display:none"><h3>Physics</h3><p>Configurações</p></div>
            </div>
        `;
        container.appendChild(panel);
        
        const panelStyle = document.createElement('style');
        panelStyle.textContent = `
            .properties-panel { position: absolute; right: 0; top: 0; width: 280px; height: 100vh; background: rgba(30,30,30,0.96); border-left: 1px solid #3a3a3a; display: flex; z-index: 150; transition: right 0.25s; }
            .properties-panel .resize-handle { position: absolute; left: -4px; top: 0; width: 8px; height: 100%; cursor: ew-resize; background: transparent; z-index: 160; }
            .properties-panel .resize-handle:hover { background: rgba(0,191,255,0.3); }
            .properties-panel .tabs { display: flex; flex-direction: column; gap: 4px; padding: 12px 8px; background: #252525; border-right: 1px solid #3a3a3a; width: 48px; }
            .properties-panel .tab { padding: 10px 0; background: transparent; border: none; color: #aaa; cursor: pointer; border-radius: 10px; font-size: 20px; }
            .properties-panel .tab.active { background: #00BFFF; color: white; }
            .properties-panel .content { flex: 1; overflow-y: auto; padding: 16px; }
            .properties-panel h3 { font-size: 11px; color: #00BFFF; margin-bottom: 12px; border-bottom: 1px solid #3a3a3a; padding-bottom: 6px; }
            .properties-panel div { margin-bottom: 12px; }
            .properties-panel label { display: inline-block; width: 25px; color: #aaa; font-size: 11px; }
            .properties-panel input { width: 80px; background: #252525; border: 1px solid #444; color: #ddd; padding: 4px 8px; border-radius: 4px; }
        `;
        document.head.appendChild(panelStyle);
        
        // Resize
        let isResizing = false, startX, startWidth;
        const resizeHandle = panel.querySelector('.resize-handle');
        resizeHandle.onmousedown = (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = panel.offsetWidth;
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        };
        document.onmousemove = (e) => {
            if (!isResizing) return;
            const newWidth = startWidth - (e.clientX - startX);
            if (newWidth >= 200 && newWidth <= 500) panel.style.width = `${newWidth}px`;
        };
        document.onmouseup = () => { isResizing = false; document.body.style.cursor = ''; };
        
        // Tabs
        const tabs = panel.querySelectorAll('.tab');
        const contents = {
            object: panel.querySelector('#panel-object'),
            render: panel.querySelector('#panel-render'),
            material: panel.querySelector('#panel-material'),
            physics: panel.querySelector('#panel-physics')
        };
        tabs.forEach(tab => {
            tab.onclick = () => {
                const tabId = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                Object.values(contents).forEach(c => c.style.display = 'none');
                if (contents[tabId]) contents[tabId].style.display = 'block';
            };
        });
        
        // Inputs
        const inputs = ['pos-x', 'pos-y', 'pos-z'];
        inputs.forEach(id => {
            document.getElementById(id).onchange = () => {
                if (AppState.selectedObject) {
                    AppState.selectedObject.position.set(
                        parseFloat(document.getElementById('pos-x').value) || 0,
                        parseFloat(document.getElementById('pos-y').value) || 0,
                        parseFloat(document.getElementById('pos-z').value) || 0
                    );
                }
            };
        });
    }
    
    function addCube() {
        const newCube = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshStandardMaterial({ color: 0xd18e5b }));
        newCube.position.set(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 2 + 1);
        extractGeometryData(newCube);
        scene.add(newCube);
        AppState.objects.push(newCube);
        document.querySelector('.obj-count').textContent = `${AppState.objects.length} objetos`;
    }
    
    function extractGeometryData(mesh) {
        const pos = mesh.geometry.attributes.position;
        const idx = mesh.geometry.index;
        mesh.userData.vertices = [];
        mesh.userData.indices = [];
        for (let i = 0; i < pos.count; i++) mesh.userData.vertices.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
        for (let i = 0; i < idx.count; i++) mesh.userData.indices.push(idx.getX(i));
        const edgeSet = new Set();
        mesh.userData.edges = [];
        for (let i = 0; i < idx.count; i += 3) {
            const a = idx.getX(i), b = idx.getX(i+1), c = idx.getX(i+2);
            const e1 = [Math.min(a,b), Math.max(a,b)].join(','), e2 = [Math.min(b,c), Math.max(b,c)].join(','), e3 = [Math.min(c,a), Math.max(c,a)].join(',');
            if (!edgeSet.has(e1)) { edgeSet.add(e1); mesh.userData.edges.push([a,b]); }
            if (!edgeSet.has(e2)) { edgeSet.add(e2); mesh.userData.edges.push([b,c]); }
            if (!edgeSet.has(e3)) { edgeSet.add(e3); mesh.userData.edges.push([c,a]); }
        }
    }
    
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    console.log('✅ KM Craft pronto!');
}