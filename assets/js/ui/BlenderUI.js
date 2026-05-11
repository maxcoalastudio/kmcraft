/**
 * BlenderUI - Interface principal estilo Blender
 * Gerencia toolbar, menus, status bar e integração com o 3D view
 */
export class BlenderUI {
    constructor(appState, sceneManager, cameraController, transformGizmo, modelLoader) {
        this.appState = appState;
        this.sceneManager = sceneManager;
        this.cameraController = cameraController;
        this.transformGizmo = transformGizmo;
        this.modelLoader = modelLoader;
        
        this.objectList = [];
        this.isUpdatingUI = false;
        this.statusBar = null;
        this.loadingOverlay = null;
        this.toastContainer = null;
        
        this.init();
    }
    
    init() {
        this.createStatusBar();
        this.createLoadingOverlay();
        this.createToastContainer();
        this.initEventListeners();
        this.initFileImport();
        
        console.log('BlenderUI inicializado');
    }
    
    createStatusBar() {
        this.statusBar = document.getElementById('status-bar');
        if (!this.statusBar) {
            this.statusBar = document.createElement('div');
            this.statusBar.id = 'status-bar';
            this.statusBar.className = 'status-bar';
            document.getElementById('app').appendChild(this.statusBar);
        }
        this.updateStatusBar();
    }
    
    createLoadingOverlay() {
        this.loadingOverlay = document.getElementById('loading-overlay');
        if (!this.loadingOverlay) {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.id = 'loading-overlay';
            this.loadingOverlay.className = 'loading-overlay';
            this.loadingOverlay.innerHTML = `
                <div class="spinner"></div>
                <span id="loading-text">Carregando...</span>
            `;
            document.getElementById('app').appendChild(this.loadingOverlay);
        }
    }
    
    createToastContainer() {
        this.toastContainer = document.getElementById('toast-container');
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.className = 'toast-container';
            document.getElementById('app').appendChild(this.toastContainer);
        }
    }
    
    initEventListeners() {
        // Atualizar coordenadas da câmera
        setInterval(() => {
            if (this.cameraController && this.cameraController.camera) {
                const pos = this.cameraController.camera.position;
                const coordsEl = document.getElementById('status-coords');
                if (coordsEl) {
                    coordsEl.innerHTML = `📍 ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`;
                }
            }
        }, 100);
    }
    
    initFileImport() {
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.obj,.fbx,.gltf,.glb,.dae';
                input.onchange = (e) => this.handleFileImport(e);
                input.click();
            });
        }
    }
    
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.showLoading(true);
        
        try {
            const model = await this.modelLoader.loadModel(file);
            if (model) {
                const name = file.name.replace(/\.[^/.]+$/, '');
                model.userData.name = name;
                this.sceneManager.addObject(model);
                this.showMessage(`✅ Modelo "${name}" importado com sucesso!`, 'success');
            }
        } catch (error) {
            console.error('Erro ao importar:', error);
            this.showMessage(`❌ Erro ao importar: ${error.message}`, 'error');
        }
        
        this.showLoading(false);
    }
    
    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = message;
        toast.addEventListener('click', () => toast.remove());
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 3000);
        
        this.updateStatusBar(message);
    }
    
    showLoading(show) {
        if (this.loadingOverlay) {
            if (show) {
                this.loadingOverlay.classList.add('active');
            } else {
                this.loadingOverlay.classList.remove('active');
            }
        }
    }
    
    updateStatusBar(message = null) {
        if (!this.statusBar) return;
        
        const mode = this.appState.mode === 'object' ? 'OBJETO' : 'EDIÇÃO';
        const transformMode = {
            translate: '📍 MOVER',
            rotate: '🔄 ROTACIONAR',
            scale: '📏 ESCALAR'
        }[this.appState.transformType] || '📍 MOVER';
        
        let selectionInfo = '';
        if (this.appState.mode === 'edit' && this.appState.selectedSelectable) {
            const sel = this.appState.selectedSelectable.selectionData;
            const total = (sel.vertices?.size || 0) + (sel.edges?.size || 0) + (sel.faces?.size || 0);
            selectionInfo = total > 0 ? ` | ${total} selecionado(s)` : '';
        } else if (this.appState.mode === 'object') {
            const count = this.sceneManager?.selectedObjects?.size || 0;
            selectionInfo = count > 0 ? ` | ${count} objeto(s)` : '';
        }
        
        const time = new Date().toLocaleTimeString();
        this.statusBar.innerHTML = `
            <span id="status-text">✅ ${message || 'Pronto'}</span>
            <span>🎮 ${mode}</span>
            <span>🎯 ${transformMode}${selectionInfo}</span>
            <span id="status-coords"></span>
            <span>🕐 ${time}</span>
        `;
    }
    
    updateSelectionDisplay(selectionData) {
        this.updateStatusBar();
    }
    
    updateStats(vertices, edges, faces) {
        const statsEl = document.getElementById('stats-values');
        if (statsEl) {
            statsEl.innerHTML = `
                <div class="stat-row"><span class="stat-label">Vértices:</span><span class="stat-value">${vertices}</span></div>
                <div class="stat-row"><span class="stat-label">Arestas:</span><span class="stat-value">${edges}</span></div>
                <div class="stat-row"><span class="stat-label">Faces:</span><span class="stat-value">${faces}</span></div>
            `;
        }
    }
    
    setMode(mode) {
        this.appState.mode = mode;
        this.updateStatusBar();
        
        // Atualizar botões da toolbar
        const objectModeBtn = document.getElementById('tool-objectMode');
        const editModeBtn = document.getElementById('tool-editMode');
        if (objectModeBtn) objectModeBtn.classList.toggle('active', mode === 'object');
        if (editModeBtn) editModeBtn.classList.toggle('active', mode === 'edit');
    }
    
    setSelectionType(type) {
        this.appState.selectionType = type;
        this.updateStatusBar();
        
        const vertexBtn = document.getElementById('tool-vertex');
        const edgeBtn = document.getElementById('tool-edge');
        const faceBtn = document.getElementById('tool-face');
        if (vertexBtn) vertexBtn.classList.toggle('active', type === 'vertex');
        if (edgeBtn) edgeBtn.classList.toggle('active', type === 'edge');
        if (faceBtn) faceBtn.classList.toggle('active', type === 'face');
    }
    
    setTransformMode(mode) {
        this.appState.transformType = mode;
        this.updateStatusBar();
        
        const moveBtn = document.getElementById('tool-move');
        const rotateBtn = document.getElementById('tool-rotate');
        const scaleBtn = document.getElementById('tool-scale');
        if (moveBtn) moveBtn.classList.toggle('active', mode === 'translate');
        if (rotateBtn) rotateBtn.classList.toggle('active', mode === 'rotate');
        if (scaleBtn) scaleBtn.classList.toggle('active', mode === 'scale');
        
        if (this.transformGizmo) this.transformGizmo.setMode(mode);
    }
    
    updateTransformPanel(object) {
        // Atualizar painel de transformação
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const posZ = document.getElementById('pos-z');
        const rotX = document.getElementById('rot-x');
        const rotY = document.getElementById('rot-y');
        const rotZ = document.getElementById('rot-z');
        const sclX = document.getElementById('scl-x');
        const sclY = document.getElementById('scl-y');
        const sclZ = document.getElementById('scl-z');
        
        if (posX && object) {
            posX.value = object.position.x.toFixed(3);
            posY.value = object.position.y.toFixed(3);
            posZ.value = object.position.z.toFixed(3);
            rotX.value = (object.rotation.x * 180 / Math.PI).toFixed(1);
            rotY.value = (object.rotation.y * 180 / Math.PI).toFixed(1);
            rotZ.value = (object.rotation.z * 180 / Math.PI).toFixed(1);
            sclX.value = object.scale.x.toFixed(3);
            sclY.value = object.scale.y.toFixed(3);
            sclZ.value = object.scale.z.toFixed(3);
        }
    }
    
    updateObjectList(objects) {
        const listEl = document.getElementById('object-list');
        if (!listEl) return;
        
        listEl.innerHTML = '';
        objects.forEach(obj => {
            const item = document.createElement('div');
            item.className = 'object-item';
            item.innerHTML = `
                <span class="object-icon">📦</span>
                <span class="object-name">${obj.userData.name}</span>
                <span class="object-actions">
                    <button class="rename-obj" title="Renomear">✏️</button>
                    <button class="delete-obj" title="Excluir">🗑️</button>
                </span>
            `;
            
            item.querySelector('.rename-obj').addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameObject(obj);
            });
            
            item.querySelector('.delete-obj').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteObject(obj);
            });
            
            item.addEventListener('click', () => {
                this.sceneManager.selectObject(obj);
                this.updateTransformPanel(obj);
                this.highlightObjectInList(obj.userData.name);
            });
            
            listEl.appendChild(item);
            this.objectList.push({ object: obj, element: item, name: obj.userData.name });
        });
    }
    
    highlightObjectInList(name) {
        this.objectList.forEach(item => {
            if (item.name === name) {
                item.element.classList.add('selected');
            } else {
                item.element.classList.remove('selected');
            }
        });
    }
    
    clearObjectHighlight() {
        this.objectList.forEach(item => item.element.classList.remove('selected'));
    }
    
    renameObject(object) {
        const newName = prompt('Novo nome:', object.userData.name);
        if (newName && newName.trim()) {
            const oldName = object.userData.name;
            object.userData.name = newName.trim();
            
            const listItem = this.objectList.find(item => item.object === object);
            if (listItem) {
                listItem.name = newName.trim();
                listItem.element.querySelector('.object-name').textContent = newName.trim();
            }
            
            this.showMessage(`✅ Objeto renomeado de "${oldName}" para "${newName}"`, 'success');
        }
    }
    
    deleteObject(object) {
        if (confirm(`Remover "${object.userData.name}"?`)) {
            this.sceneManager.removeObject(object);
            const index = this.objectList.findIndex(item => item.object === object);
            if (index !== -1) {
                this.objectList[index].element.remove();
                this.objectList.splice(index, 1);
            }
            this.showMessage(`🗑️ "${object.userData.name}" removido`, 'info');
        }
    }
    
    updateObjectCount(count) {
        const counter = document.querySelector('.object-counter');
        if (counter) {
            counter.textContent = `${count} ${count === 1 ? 'objeto' : 'objetos'}`;
        }
    }
    
    showContextMenu(x, y, items, onSelect) {
        const menu = document.getElementById('context-menu');
        if (!menu) return;
        
        menu.innerHTML = '';
        items.forEach(item => {
            if (item.type === 'divider') {
                const divider = document.createElement('div');
                divider.className = 'context-menu-divider';
                menu.appendChild(divider);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                menuItem.innerHTML = `<span>${item.icon || '•'}</span><span>${item.label}</span>`;
                menuItem.addEventListener('click', () => {
                    if (onSelect) onSelect(item.action);
                    menu.style.display = 'none';
                });
                menu.appendChild(menuItem);
            }
        });
        
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.display = 'block';
        
        const closeMenu = () => {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 10);
    }
    
    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 30}px`;
        tooltip.style.transform = 'translateX(-50%)';
        document.body.appendChild(tooltip);
        
        element.addEventListener('mouseleave', () => tooltip.remove(), { once: true });
    }
    
    cleanup() {
        if (this.toastContainer) this.toastContainer.innerHTML = '';
        this.objectList = [];
    }
}