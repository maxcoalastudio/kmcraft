import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// ==============================================
// KM Craft - UPBGE 2.5 Clone
// Versão Funcional Completa
// ==============================================

// Estado
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

// Inicialização
document.addEventListener('DOMContentLoaded', () => init());

async function init() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // ==============================================
    // CENA
    // ==============================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = null;

    // ==============================================
    // CÂMERA (Z-up estilo Blender)
    // ==============================================
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(8, -6, 6);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    // ==============================================
    // RENDERER
    // ==============================================
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x1a1a1a, 1);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // ==============================================
    // CONTROLES ORBITAIS
    // ==============================================
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 1.5;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI;
    controls.minPolarAngle = 0;
    controls.target.set(0, 0, 0);

    // ==============================================
    // GRID E EIXOS
    // ==============================================
    const gridHelper = new THREE.GridHelper(12, 24, 0x555555, 0x333333);
    gridHelper.position.z = -0.01;
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

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
        scene.add(line);
    }

    // ==============================================
    // LUZES
    // ==============================================
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    mainLight.position.set(5, -4, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.PointLight(0x557799, 0.4);
    fillLight.position.set(-3, 2, 4);
    scene.add(fillLight);

    const backLight = new THREE.PointLight(0xffaa66, 0.3);
    backLight.position.set(2, 3, -5);
    scene.add(backLight);

    // ==============================================
    // OBJETO PADRÃO (CUBO)
    // ==============================================
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0xd18e5b, roughness: 0.4, metalness: 0.05 });
    const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.set(0, 0, 1);
    cube.castShadow = true;
    cube.userData = { name: 'Cube', isSelectable: true, vertices: [], indices: [], edges: [] };
    extractGeometryData(cube);
    scene.add(cube);

    AppState.selectedObject = cube;
    AppState.objects.push(cube);

    // ==============================================
    // GIZMO DE TRANSFORMAÇÃO
    // ==============================================
    const transformGizmo = new TransformControls(camera, renderer.domElement);
    transformGizmo.addEventListener('dragging-changed', (event) => {
        controls.enabled = !event.value;
        if (!event.value && AppState.selectedObject) {
            updatePropertiesPanel(AppState.selectedObject);
        }
    });
    transformGizmo.attach(cube);
    scene.add(transformGizmo);

    // ==============================================
    // FUNÇÃO PARA EXTRAIR DADOS DE GEOMETRIA
    // ==============================================
    function extractGeometryData(mesh) {
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

    // ==============================================
    // MODO EDIÇÃO
    // ==============================================
    const editMode = {
        textures: null,

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
        },

        enter() {
            if (!AppState.selectedObject || !AppState.selectedObject.userData.vertices) {
                updateStatus('Selecione um objeto editável primeiro', 'warning');
                return false;
            }

            this.initTextures();
            AppState.mode = 'edit';
            AppState.editMode.active = true;
            transformGizmo.detach();
            transformGizmo.visible = false;

            this.createVisuals();
            updateStatus('✏️ Modo Edição | 1=Vértices, 2=Arestas, 3=Faces | Clique direito para selecionar');
            return true;
        },

        createVisuals() {
            this.clearVisuals();

            const obj = AppState.selectedObject;
            const vertices = obj.userData.vertices;
            const indices = obj.userData.indices;
            const edges = obj.userData.edges;

            const spriteMat = new THREE.SpriteMaterial({ map: this.normalTexture, depthTest: true, transparent: true });

            // Vértices
            vertices.forEach((vertex, idx) => {
                const worldPos = obj.localToWorld(vertex.clone());
                const sprite = new THREE.Sprite(spriteMat);
                sprite.position.copy(worldPos);
                sprite.scale.set(0.06, 0.06, 1);
                sprite.userData = { type: 'vertex', index: idx };
                scene.add(sprite);
                AppState.editMode.vertexSprites.push(sprite);
            });

            // Arestas
            edges.forEach((edge, idx) => {
                const v1 = vertices[edge[0]];
                const v2 = vertices[edge[1]];
                const worldV1 = obj.localToWorld(v1.clone());
                const worldV2 = obj.localToWorld(v2.clone());
                const points = [worldV1, worldV2];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ color: 0x88aaff });
                const line = new THREE.Line(geometry, material);
                line.userData = { type: 'edge', index: idx };
                scene.add(line);
                AppState.editMode.edgeLines.push(line);
            });

            // Faces
            for (let i = 0; i < indices.length; i += 3) {
                const i1 = indices[i];
                const i2 = indices[i + 1];
                const i3 = indices[i + 2];
                const v1 = vertices[i1];
                const v2 = vertices[i2];
                const v3 = vertices[i3];
                const worldV1 = obj.localToWorld(v1.clone());
                const worldV2 = obj.localToWorld(v2.clone());
                const worldV3 = obj.localToWorld(v3.clone());
                const center = new THREE.Vector3().add(worldV1).add(worldV2).add(worldV3).divideScalar(3);

                const faceSprite = new THREE.Sprite(spriteMat);
                faceSprite.position.copy(center);
                faceSprite.scale.set(0.05, 0.05, 1);
                faceSprite.userData = { type: 'face', index: i / 3 };
                scene.add(faceSprite);
                AppState.editMode.faceSprites.push(faceSprite);

                const verticesPos = [worldV1.x, worldV1.y, worldV1.z, worldV2.x, worldV2.y, worldV2.z, worldV3.x, worldV3.y, worldV3.z];
                const overlayGeo = new THREE.BufferGeometry();
                overlayGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesPos), 3));
                overlayGeo.setIndex([0, 1, 2]);
                const overlayMat = new THREE.MeshStandardMaterial({ color: 0x00BFFF, transparent: true, opacity: 0, side: THREE.DoubleSide });
                const overlay = new THREE.Mesh(overlayGeo, overlayMat);
                overlay.userData = { type: 'faceOverlay', index: i / 3 };
                scene.add(overlay);
                AppState.editMode.faceOverlays.push(overlay);
            }

            this.updateVisuals();
        },

        updateVisuals() {
            const sel = AppState.editMode.selection;

            AppState.editMode.vertexSprites.forEach(sprite => {
                if (sel.vertices.has(sprite.userData.index)) {
                    sprite.material.map = this.selectedTexture;
                } else {
                    sprite.material.map = this.normalTexture;
                }
            });

            AppState.editMode.edgeLines.forEach(line => {
                if (sel.edges.has(line.userData.index)) {
                    line.material.color.setHex(0xffaa44);
                } else {
                    line.material.color.setHex(0x88aaff);
                }
            });

            AppState.editMode.faceSprites.forEach(sprite => {
                if (sel.faces.has(sprite.userData.index)) {
                    sprite.material.map = this.selectedTexture;
                } else {
                    sprite.material.map = this.normalTexture;
                }
            });

            AppState.editMode.faceOverlays.forEach(overlay => {
                if (sel.faces.has(overlay.userData.index)) {
                    overlay.material.opacity = 0.35;
                } else {
                    overlay.material.opacity = 0;
                }
            });
        },

        clearVisuals() {
            AppState.editMode.vertexSprites.forEach(s => scene.remove(s));
            AppState.editMode.edgeLines.forEach(l => scene.remove(l));
            AppState.editMode.faceSprites.forEach(s => scene.remove(s));
            AppState.editMode.faceOverlays.forEach(o => scene.remove(o));
            AppState.editMode.vertexSprites = [];
            AppState.editMode.edgeLines = [];
            AppState.editMode.faceSprites = [];
            AppState.editMode.faceOverlays = [];
        },

        exit() {
            AppState.mode = 'object';
            AppState.editMode.active = false;
            this.clearVisuals();
            transformGizmo.attach(AppState.selectedObject);
            transformGizmo.visible = true;
            updateStatus('🔲 Modo Objeto');
        },

        handleSelection(type, index, shiftKey) {
            const key = type + 's';
            if (shiftKey) {
                if (AppState.editMode.selection[key].has(index)) {
                    AppState.editMode.selection[key].delete(index);
                } else {
                    AppState.editMode.selection[key].add(index);
                }
            } else {
                AppState.editMode.selection[key].clear();
                AppState.editMode.selection[key].add(index);
            }
            this.updateVisuals();
            updateStatus(`${type}s selecionados: ${AppState.editMode.selection[key].size}`);
        },

        selectAll() {
            const type = AppState.selectionType;
            const key = type + 's';
            const count = AppState.editMode[`${type}Sprites`]?.length || 0;

            if (AppState.editMode.selection[key].size > 0) {
                AppState.editMode.selection[key].clear();
                updateStatus(`Todos os ${type}s deselecionados`);
            } else {
                for (let i = 0; i < count; i++) {
                    AppState.editMode.selection[key].add(i);
                }
                updateStatus(`Todos os ${type}s selecionados`);
            }
            this.updateVisuals();
        },

        update() {
            if (!AppState.editMode.active) return;

            const obj = AppState.selectedObject;
            if (!obj) return;

            // Atualizar vértices
            AppState.editMode.vertexSprites.forEach(sprite => {
                const vertex = obj.userData.vertices[sprite.userData.index];
                if (vertex) {
                    sprite.position.copy(obj.localToWorld(vertex.clone()));
                }
            });

            // Atualizar arestas
            AppState.editMode.edgeLines.forEach(line => {
                const edge = obj.userData.edges[line.userData.index];
                if (edge) {
                    const v1 = obj.userData.vertices[edge[0]];
                    const v2 = obj.userData.vertices[edge[1]];
                    const worldV1 = obj.localToWorld(v1.clone());
                    const worldV2 = obj.localToWorld(v2.clone());
                    const points = [worldV1, worldV2];
                    line.geometry.dispose();
                    line.geometry = new THREE.BufferGeometry().setFromPoints(points);
                }
            });

            // Atualizar faces
            AppState.editMode.faceSprites.forEach((sprite, idx) => {
                const i1 = obj.userData.indices[idx * 3];
                const i2 = obj.userData.indices[idx * 3 + 1];
                const i3 = obj.userData.indices[idx * 3 + 2];
                const v1 = obj.userData.vertices[i1];
                const v2 = obj.userData.vertices[i2];
                const v3 = obj.userData.vertices[i3];
                if (v1 && v2 && v3) {
                    const worldV1 = obj.localToWorld(v1.clone());
                    const worldV2 = obj.localToWorld(v2.clone());
                    const worldV3 = obj.localToWorld(v3.clone());
                    const center = new THREE.Vector3().add(worldV1).add(worldV2).add(worldV3).divideScalar(3);
                    sprite.position.copy(center);
                }
            });
        }
    };

    // ==============================================
    // UI - TOOLBAR
    // ==============================================
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
            <span class="obj-count">${AppState.objects.length} objetos</span>
        `;
        container.appendChild(toolbar);

        document.getElementById('tool-move').onclick = () => transformGizmo.setMode('translate');
        document.getElementById('tool-rotate').onclick = () => transformGizmo.setMode('rotate');
        document.getElementById('tool-scale').onclick = () => transformGizmo.setMode('scale');

        document.getElementById('tool-vertex').onclick = () => {
            if (AppState.mode === 'edit') {
                AppState.selectionType = 'vertex';
                updateStatus('Modo: VÉRTICES');
            }
        };
        document.getElementById('tool-edge').onclick = () => {
            if (AppState.mode === 'edit') {
                AppState.selectionType = 'edge';
                updateStatus('Modo: ARESTAS');
            }
        };
        document.getElementById('tool-face').onclick = () => {
            if (AppState.mode === 'edit') {
                AppState.selectionType = 'face';
                updateStatus('Modo: FACES');
            }
        };

        document.getElementById('tool-object').onclick = () => {
            if (AppState.mode === 'edit') editMode.exit();
        };
        document.getElementById('tool-edit').onclick = () => {
            if (AppState.mode === 'object') editMode.enter();
        };

        document.getElementById('tool-add-cube').onclick = () => {
            const newMat = new THREE.MeshStandardMaterial({ color: 0xd18e5b, roughness: 0.4 });
            const newGeo = new THREE.BoxGeometry(2, 2, 2);
            const newCube = new THREE.Mesh(newGeo, newMat);
            newCube.position.set(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 2 + 1);
            extractGeometryData(newCube);
            scene.add(newCube);
            AppState.objects.push(newCube);
            document.querySelector('.obj-count').textContent = `${AppState.objects.length} objetos`;
            updateStatus(`Cubo adicionado: ${newCube.userData.name}`);
        };
    }

    // ==============================================
    // UI - PROPERTIES PANEL
    // ==============================================
    let panelWidth = 280;
    let isResizing = false;

    function createPropertiesPanel() {
        const panel = document.createElement('div');
        panel.className = 'properties-panel';
        panel.style.width = `${panelWidth}px`;
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
                    <div class="prop-header">📦 Transform</div>
                    <div class="prop-group"><label>X</label><input id="pos-x" type="number" step="0.01" value="0"></div>
                    <div class="prop-group"><label>Y</label><input id="pos-y" type="number" step="0.01" value="0"></div>
                    <div class="prop-group"><label>Z</label><input id="pos-z" type="number" step="0.01" value="0"></div>
                    <div class="prop-group"><label>Rot X</label><input id="rot-x" type="number" step="1" value="0"></div>
                    <div class="prop-group"><label>Rot Y</label><input id="rot-y" type="number" step="1" value="0"></div>
                    <div class="prop-group"><label>Rot Z</label><input id="rot-z" type="number" step="1" value="0"></div>
                    <div class="prop-group"><label>Scl X</label><input id="scl-x" type="number" step="0.01" value="1"></div>
                    <div class="prop-group"><label>Scl Y</label><input id="scl-y" type="number" step="0.01" value="1"></div>
                    <div class="prop-group"><label>Scl Z</label><input id="scl-z" type="number" step="0.01" value="1"></div>
                </div>
                <div id="panel-render" style="display:none"><div class="prop-header">🎨 Render</div><p>Configurações de render</p></div>
                <div id="panel-material" style="display:none"><div class="prop-header">🎨 Material</div><p>Configurações de material</p></div>
                <div id="panel-physics" style="display:none"><div class="prop-header">⚡ Physics</div><p>Configurações de física</p></div>
            </div>
        `;
        container.appendChild(panel);

        // Resize
        const resizeHandle = panel.querySelector('.resize-handle');
        resizeHandle.onmousedown = (e) => {
            isResizing = true;
            const startX = e.clientX;
            const startWidth = panelWidth;
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();

            const onMouseMove = (moveEvent) => {
                if (!isResizing) return;
                const newWidth = startWidth - (moveEvent.clientX - startX);
                if (newWidth >= 200 && newWidth <= 500) {
                    panelWidth = newWidth;
                    panel.style.width = `${panelWidth}px`;
                }
            };

            const onMouseUp = () => {
                isResizing = false;
                document.body.style.cursor = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

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
        const inputs = ['pos-x', 'pos-y', 'pos-z', 'rot-x', 'rot-y', 'rot-z', 'scl-x', 'scl-y', 'scl-z'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.onchange = () => {
                    if (AppState.selectedObject) {
                        AppState.selectedObject.position.set(
                            parseFloat(document.getElementById('pos-x')?.value) || 0,
                            parseFloat(document.getElementById('pos-y')?.value) || 0,
                            parseFloat(document.getElementById('pos-z')?.value) || 0
                        );
                        AppState.selectedObject.rotation.set(
                            (parseFloat(document.getElementById('rot-x')?.value) || 0) * Math.PI / 180,
                            (parseFloat(document.getElementById('rot-y')?.value) || 0) * Math.PI / 180,
                            (parseFloat(document.getElementById('rot-z')?.value) || 0) * Math.PI / 180
                        );
                        AppState.selectedObject.scale.set(
                            parseFloat(document.getElementById('scl-x')?.value) || 1,
                            parseFloat(document.getElementById('scl-y')?.value) || 1,
                            parseFloat(document.getElementById('scl-z')?.value) || 1
                        );
                    }
                };
            }
        });
    }

    function updatePropertiesPanel(obj) {
        if (!obj) return;
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const posZ = document.getElementById('pos-z');
        const rotX = document.getElementById('rot-x');
        const rotY = document.getElementById('rot-y');
        const rotZ = document.getElementById('rot-z');
        const sclX = document.getElementById('scl-x');
        const sclY = document.getElementById('scl-y');
        const sclZ = document.getElementById('scl-z');

        if (posX) posX.value = obj.position.x.toFixed(3);
        if (posY) posY.value = obj.position.y.toFixed(3);
        if (posZ) posZ.value = obj.position.z.toFixed(3);
        if (rotX) rotX.value = (obj.rotation.x * 180 / Math.PI).toFixed(1);
        if (rotY) rotY.value = (obj.rotation.y * 180 / Math.PI).toFixed(1);
        if (rotZ) rotZ.value = (obj.rotation.z * 180 / Math.PI).toFixed(1);
        if (sclX) sclX.value = obj.scale.x.toFixed(3);
        if (sclY) sclY.value = obj.scale.y.toFixed(3);
        if (sclZ) sclZ.value = obj.scale.z.toFixed(3);
    }

    // ==============================================
    // UI - STATUS BAR
    // ==============================================
    function createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'status-bar';
        statusBar.innerHTML = `<span>✅ Pronto</span><span id="status-coords"></span>`;
        container.appendChild(statusBar);
        return statusBar;
    }

    const statusBar = createStatusBar();

    function updateStatus(message, type = 'info') {
        const span = statusBar.querySelector('span:first-child');
        if (span) span.innerHTML = `✅ ${message}`;
    }

    // ==============================================
    // EVENTOS DE TECLADO
    // ==============================================
    window.addEventListener('keydown', (e) => {
        // Tab
        if (e.key === 'Tab') {
            e.preventDefault();
            if (AppState.mode === 'object') {
                if (AppState.selectedObject) editMode.enter();
            } else {
                editMode.exit();
            }
        }

        // 1,2,3
        if (AppState.mode === 'edit') {
            if (e.key === '1') {
                e.preventDefault();
                AppState.selectionType = 'vertex';
                updateStatus('Modo: VÉRTICES');
            } else if (e.key === '2') {
                e.preventDefault();
                AppState.selectionType = 'edge';
                updateStatus('Modo: ARESTAS');
            } else if (e.key === '3') {
                e.preventDefault();
                AppState.selectionType = 'face';
                updateStatus('Modo: FACES');
            } else if (e.key === 'a') {
                e.preventDefault();
                editMode.selectAll();
            }
        }

        // G, R, S
        if (AppState.mode === 'object') {
            if (e.key === 'g') { transformGizmo.setMode('translate'); updateStatus('Modo: MOVER (G)'); }
            else if (e.key === 'r') { transformGizmo.setMode('rotate'); updateStatus('Modo: ROTACIONAR (R)'); }
            else if (e.key === 's') { transformGizmo.setMode('scale'); updateStatus('Modo: ESCALAR (S)'); }
        }

        // Delete
        if (AppState.mode === 'object' && e.key === 'Delete') {
            if (AppState.selectedObject) {
                const name = AppState.selectedObject.userData.name;
                scene.remove(AppState.selectedObject);
                AppState.objects = AppState.objects.filter(obj => obj !== AppState.selectedObject);
                AppState.selectedObject = AppState.objects[0] || null;
                if (AppState.selectedObject) transformGizmo.attach(AppState.selectedObject);
                document.querySelector('.obj-count').textContent = `${AppState.objects.length} objetos`;
                updateStatus(`Removido: ${name}`);
            }
        }

        // N - toggle properties panel
        if (e.key === 'n' && !e.ctrlKey) {
            e.preventDefault();
            const panel = document.querySelector('.properties-panel');
            if (panel) panel.classList.toggle('visible');
        }
    });

    // ==============================================
    // EVENTOS DE MOUSE PARA SELEÇÃO NO MODO EDIÇÃO
    // ==============================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('click', (event) => {
        if (AppState.mode === 'edit') return;

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(AppState.objects);
        if (intersects.length > 0) {
            const selected = intersects[0].object;
            if (AppState.selectedObject !== selected) {
                AppState.selectedObject = selected;
                transformGizmo.detach();
                transformGizmo.attach(selected);
                updatePropertiesPanel(selected);
                updateStatus(`Selecionado: ${selected.userData.name}`);
            }
        }
    });

    renderer.domElement.addEventListener('contextmenu', (event) => {
        if (AppState.mode !== 'edit') return;
        event.preventDefault();

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        let targets = [];
        if (AppState.selectionType === 'vertex') targets = AppState.editMode.vertexSprites;
        else if (AppState.selectionType === 'edge') targets = AppState.editMode.edgeLines;
        else if (AppState.selectionType === 'face') targets = AppState.editMode.faceOverlays;

        const intersects = raycaster.intersectObjects(targets);
        if (intersects.length > 0) {
            const selected = intersects[0].object;
            const shiftKey = event.shiftKey;
            editMode.handleSelection(AppState.selectionType, selected.userData.index, shiftKey);
        }
    });

    // ==============================================
    // COORDENADAS EM TEMPO REAL
    // ==============================================
    setInterval(() => {
        const pos = camera.position;
        const coordsSpan = document.getElementById('status-coords');
        if (coordsSpan) {
            coordsSpan.innerHTML = `📍 ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`;
        }
    }, 100);

    // ==============================================
    // ESTILOS CSS
    // ==============================================
    const style = document.createElement('style');
    style.textContent = `
        .top-toolbar {
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(34,34,34,0.95);
            backdrop-filter: blur(12px);
            padding: 6px 14px;
            border-radius: 40px;
            border: 1px solid #3a3a3a;
            z-index: 200;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .top-toolbar button {
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.15s;
            color: #aaa;
        }
        .top-toolbar button:hover {
            background: #3a3a3a;
            color: #fff;
        }
        .top-toolbar button.active {
            background: #00BFFF;
            color: white;
        }
        .top-toolbar .sep {
            width: 1px;
            height: 28px;
            background: #3a3a3a;
            margin: 0 6px;
        }
        .top-toolbar .obj-count {
            margin-left: 12px;
            padding: 0 12px;
            font-size: 11px;
            color: #00BFFF;
            font-family: monospace;
            background: #252525;
            border-radius: 20px;
            height: 30px;
            display: flex;
            align-items: center;
        }
        .properties-panel {
            position: absolute;
            right: 0;
            top: 0;
            height: 100vh;
            background: rgba(30,30,30,0.96);
            backdrop-filter: blur(12px);
            border-left: 1px solid #3a3a3a;
            display: flex;
            z-index: 150;
            transition: right 0.25s ease;
        }
        .properties-panel.visible { right: 0; }
        .properties-panel:not(.visible) { right: -320px; }
        .properties-panel .resize-handle {
            position: absolute;
            left: -4px;
            top: 0;
            width: 8px;
            height: 100%;
            cursor: ew-resize;
            background: transparent;
            z-index: 160;
        }
        .properties-panel .resize-handle:hover { background: rgba(0,191,255,0.3); }
        .properties-panel .tabs {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 12px 8px;
            background: #252525;
            border-right: 1px solid #3a3a3a;
            width: 48px;
            flex-shrink: 0;
        }
        .properties-panel .tab {
            padding: 10px 0;
            background: transparent;
            border: none;
            color: #aaa;
            cursor: pointer;
            border-radius: 10px;
            font-size: 20px;
            transition: all 0.15s;
        }
        .properties-panel .tab:hover { background: #3a3a3a; color: #ddd; }
        .properties-panel .tab.active { background: #00BFFF; color: white; }
        .properties-panel .content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }
        .properties-panel .content::-webkit-scrollbar { width: 6px; }
        .properties-panel .content::-webkit-scrollbar-track { background: #1a1a1a; }
        .properties-panel .content::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
        .prop-header {
            font-size: 11px;
            font-weight: 600;
            color: #00BFFF;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid #3a3a3a;
        }
        .prop-group {
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .prop-group label {
            width: 40px;
            font-size: 11px;
            color: #aaa;
        }
        .prop-group input {
            flex: 1;
            background: #252525;
            border: 1px solid #444;
            color: #ddd;
            padding: 5px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-family: monospace;
        }
        .status-bar {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            padding: 6px 12px;
            border-radius: 20px;
            font-family: monospace;
            font-size: 11px;
            color: #0f0;
            z-index: 100;
            pointer-events: none;
            backdrop-filter: blur(4px);
            display: flex;
            gap: 16px;
        }
    `;
    document.head.appendChild(style);

    // ==============================================
    // ANIMAÇÃO
    // ==============================================
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        if (AppState.mode === 'edit') {
            editMode.update();
        }
        renderer.render(scene, camera);
    }
    animate();

    // ==============================================
    // RESIZE
    // ==============================================
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    // ==============================================
    // INICIALIZAR UI
    // ==============================================
    createToolbar();
    createPropertiesPanel();
    updatePropertiesPanel(cube);
    updateStatus('KM Craft pronto! Pressione TAB para modo edição');

    console.log('✅ KM Craft inicializado com sucesso!');
}