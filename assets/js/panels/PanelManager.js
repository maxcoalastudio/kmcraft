/**
 * PanelManager - Gerencia os painéis laterais (Properties)
 * Abas organizadas verticalmente com redimensionamento
 */
export class PanelManager {
    constructor(container, appState) {
        this.container = container;
        this.appState = appState;
        this.panel = null;
        this.isVisible = true;
        this.width = 300;
        this.currentTab = 'object';
        
        this.tabs = [
            { id: 'render', icon: '🎨', name: 'Render' },
            { id: 'scene', icon: '🌍', name: 'Scene' },
            { id: 'object', icon: '📦', name: 'Object' },
            { id: 'material', icon: '🎨', name: 'Material' },
            { id: 'texture', icon: '🖼️', name: 'Texture' },
            { id: 'physics', icon: '⚡', name: 'Physics' },
            { id: 'modifiers', icon: '⚙️', name: 'Modifiers' },
            { id: 'particles', icon: '✨', name: 'Particles' },
            { id: 'animation', icon: '🎬', name: 'Animation' },
            { id: 'compositing', icon: '🎭', name: 'Compositing' },
            { id: 'scripting', icon: '📜', name: 'Scripting' },
            { id: 'game', icon: '🎮', name: 'Game' }
        ];
        
        this.init();
    }
    
    init() {
        this.createPanel();
        this.createTabs();
        this.switchTab('object');
        this.setupResize();
        
        // Atalho N para mostrar/esconder
        window.addEventListener('keydown', (e) => {
            if (e.key === 'n' && !e.ctrlKey) {
                e.preventDefault();
                this.toggle();
            }
        });
        
        console.log('PanelManager inicializado');
    }
    
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'properties-panel visible';
        this.panel.style.width = `${this.width}px`;
        
        // Handle de redimensionamento
        this.resizeHandle = document.createElement('div');
        this.resizeHandle.className = 'panel-resize';
        this.panel.appendChild(this.resizeHandle);
        
        // Container de abas
        this.tabsContainer = document.createElement('div');
        this.tabsContainer.className = 'panel-tabs';
        this.panel.appendChild(this.tabsContainer);
        
        // Container de conteúdo
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'panel-content';
        this.panel.appendChild(this.contentContainer);
        
        this.container.appendChild(this.panel);
    }
    
    createTabs() {
        this.tabs.forEach(tab => {
            const tabBtn = document.createElement('button');
            tabBtn.className = 'panel-tab';
            tabBtn.innerHTML = tab.icon;
            tabBtn.title = tab.name;
            tabBtn.dataset.tab = tab.id;
            tabBtn.addEventListener('click', () => this.switchTab(tab.id));
            tabBtn.addEventListener('mouseenter', (e) => this.showTooltip(e, tab.name));
            tabBtn.addEventListener('mouseleave', () => this.hideTooltip());
            this.tabsContainer.appendChild(tabBtn);
        });
    }
    
    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Atualizar UI das abas
        const tabs = this.tabsContainer.querySelectorAll('.panel-tab');
        tabs.forEach((tab, idx) => {
            if (this.tabs[idx].id === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Carregar conteúdo
        this.loadContent(tabId);
    }
    
    loadContent(tabId) {
        const contents = {
            object: this.renderObjectPanel(),
            render: this.renderRenderPanel(),
            scene: this.renderScenePanel(),
            material: this.renderMaterialPanel(),
            texture: this.renderTexturePanel(),
            physics: this.renderPhysicsPanel(),
            modifiers: this.renderModifiersPanel(),
            particles: this.renderParticlesPanel(),
            animation: this.renderAnimationPanel(),
            compositing: this.renderCompositingPanel(),
            scripting: this.renderScriptingPanel(),
            game: this.renderGamePanel()
        };
        
        this.contentContainer.innerHTML = '';
        const content = contents[tabId] || this.renderDefaultPanel(tabId);
        this.contentContainer.appendChild(content);
    }
    
    renderObjectPanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">📦 Transform</div>
            <div class="prop-group">
                <label>📍 Posição</label>
                <div class="prop-row">
                    <span class="prop-label X">X</span>
                    <input type="number" id="pos-x" class="prop-input" step="0.01" value="0">
                    <span class="prop-label Y">Y</span>
                    <input type="number" id="pos-y" class="prop-input" step="0.01" value="0">
                    <span class="prop-label Z">Z</span>
                    <input type="number" id="pos-z" class="prop-input" step="0.01" value="0">
                </div>
            </div>
            <div class="prop-group">
                <label>🔄 Rotação</label>
                <div class="prop-row">
                    <span class="prop-label X">X</span>
                    <input type="number" id="rot-x" class="prop-input" step="1" value="0">
                    <span class="prop-label Y">Y</span>
                    <input type="number" id="rot-y" class="prop-input" step="1" value="0">
                    <span class="prop-label Z">Z</span>
                    <input type="number" id="rot-z" class="prop-input" step="1" value="0">
                </div>
            </div>
            <div class="prop-group">
                <label>📐 Escala</label>
                <div class="prop-row">
                    <span class="prop-label X">X</span>
                    <input type="number" id="scl-x" class="prop-input" step="0.01" value="1">
                    <span class="prop-label Y">Y</span>
                    <input type="number" id="scl-y" class="prop-input" step="0.01" value="1">
                    <span class="prop-label Z">Z</span>
                    <input type="number" id="scl-z" class="prop-input" step="0.01" value="1">
                </div>
            </div>
            <div class="prop-group">
                <label>📋 Objetos</label>
                <div id="object-list" class="object-list"></div>
                <button id="add-cube-btn" class="prop-btn">➕ Adicionar Cubo</button>
            </div>
        `;
        return div;
    }
    
    renderRenderPanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">🎨 Render</div>
            <div class="prop-group">
                <label>Qualidade</label>
                <select id="render-quality" class="prop-input">
                    <option value="low">Baixa</option>
                    <option value="medium" selected>Média</option>
                    <option value="high">Alta</option>
                </select>
            </div>
            <div class="prop-group">
                <label><input type="checkbox" id="render-shadows"> Sombras</label>
                <label><input type="checkbox" id="render-fog"> Névoa</label>
                <label><input type="checkbox" id="render-fxaa"> FXAA</label>
            </div>
            <div class="prop-group">
                <label>Bloom:</label>
                <input type="range" id="render-bloom" class="prop-slider" min="0" max="1" step="0.01" value="0">
            </div>
            <div class="prop-group">
                <label>FPS Limit:</label>
                <select id="render-fps" class="prop-input">
                    <option value="30">30</option>
                    <option value="60" selected>60</option>
                    <option value="120">120</option>
                    <option value="144">144</option>
                </select>
            </div>
        `;
        return div;
    }
    
    renderScenePanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">🌍 Scene</div>
            <div class="prop-group">
                <label>Background:</label>
                <input type="color" id="scene-bg" class="prop-color" value="#1a1a1a">
            </div>
            <div class="prop-group">
                <label><input type="checkbox" id="scene-grid" checked> Grid</label>
                <label><input type="checkbox" id="scene-axes" checked> Eixos</label>
            </div>
            <div class="prop-group">
                <label>Grid Size:</label>
                <input type="number" id="scene-grid-size" class="prop-input" value="12" step="1">
            </div>
            <div class="prop-group">
                <label>Grid Divisions:</label>
                <input type="number" id="scene-grid-div" class="prop-input" value="24" step="1">
            </div>
        `;
        return div;
    }
    
    renderMaterialPanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">🎨 Material</div>
            <div class="material-preview"></div>
            <div class="prop-group">
                <label>Color:</label>
                <input type="color" id="mat-color" class="prop-color" value="#d18e5b">
            </div>
            <div class="prop-group">
                <label>Roughness:</label>
                <input type="range" id="mat-roughness" class="prop-slider" min="0" max="1" step="0.01" value="0.4">
            </div>
            <div class="prop-group">
                <label>Metalness:</label>
                <input type="range" id="mat-metalness" class="prop-slider" min="0" max="1" step="0.01" value="0.05">
            </div>
            <div class="prop-group">
                <label>Emission:</label>
                <input type="range" id="mat-emission" class="prop-slider" min="0" max="1" step="0.01" value="0">
            </div>
        `;
        return div;
    }
    
    renderTexturePanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">🖼️ Texture</div>
            <div class="prop-group">
                <label>Texture Slot:</label>
                <select class="prop-input">
                    <option>Base Color</option>
                    <option>Normal Map</option>
                    <option>Roughness</option>
                    <option>Metallic</option>
                    <option>Emission</option>
                </select>
            </div>
            <div class="prop-group">
                <label><input type="file" id="texture-file" accept="image/*"> Carregar Textura</label>
            </div>
            <div class="prop-group">
                <label>UV Scale:</label>
                <input type="number" step="0.01" value="1" class="prop-input">
            </div>
        `;
        return div;
    }
    
    renderPhysicsPanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">⚡ Physics</div>
            <div class="prop-group">
                <label>Type:</label>
                <select class="prop-input">
                    <option>Static</option>
                    <option selected>Dynamic</option>
                    <option>Kinematic</option>
                    <option>Sensor</option>
                </select>
            </div>
            <div class="prop-group">
                <label>Mass:</label>
                <input type="number" class="prop-input" value="1" step="0.1">
            </div>
            <div class="prop-group">
                <label>Friction:</label>
                <input type="range" class="prop-slider" min="0" max="1" step="0.01" value="0.5">
            </div>
            <div class="prop-group">
                <label>Bounciness:</label>
                <input type="range" class="prop-slider" min="0" max="1" step="0.01" value="0.5">
            </div>
        `;
        return div;
    }
    
    renderModifiersPanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">⚙️ Modifiers</div>
            <button class="prop-btn" id="add-subdivide">➕ Subdivide</button>
            <button class="prop-btn" id="add-smooth">✨ Smooth</button>
            <div id="modifier-list"></div>
        `;
        return div;
    }
    
    renderParticlesPanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">✨ Particles</div>
            <div class="prop-group">
                <label>Count:</label>
                <input type="number" class="prop-input" value="100" step="10">
            </div>
            <div class="prop-group">
                <label>Emission Rate:</label>
                <input type="range" class="prop-slider" min="0" max="100" value="10">
            </div>
            <div class="prop-group">
                <label>Life Time:</label>
                <input type="number" class="prop-input" value="60" step="10">
            </div>
        `;
        return div;
    }
    
    renderAnimationPanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">🎬 Animation</div>
            <div class="prop-group">
                <label>Start Frame:</label>
                <input type="number" class="prop-input" value="1">
            </div>
            <div class="prop-group">
                <label>End Frame:</label>
                <input type="number" class="prop-input" value="250">
            </div>
            <div class="prop-group">
                <label>Current Frame:</label>
                <input type="range" class="prop-slider" min="1" max="250" value="1">
            </div>
            <div class="prop-group">
                <label>FPS:</label>
                <select class="prop-input">
                    <option>24</option>
                    <option selected>30</option>
                    <option>60</option>
                </select>
            </div>
        `;
        return div;
    }
    
    renderCompositingPanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">🎭 Compositing</div>
            <div class="prop-group">
                <label><input type="checkbox"> Bloom</label>
                <label><input type="checkbox"> Depth of Field</label>
                <label><input type="checkbox"> Motion Blur</label>
            </div>
            <div class="prop-group">
                <label>Color Correction:</label>
                <div class="prop-row">
                    <span>Brightness:</span>
                    <input type="range" class="prop-slider" min="0" max="2" step="0.01" value="1">
                </div>
                <div class="prop-row">
                    <span>Contrast:</span>
                    <input type="range" class="prop-slider" min="0" max="2" step="0.01" value="1">
                </div>
            </div>
        `;
        return div;
    }
    
    renderScriptingPanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">📜 Scripting</div>
            <div class="prop-group">
                <label>Python Console:</label>
                <textarea class="prop-input" rows="6" placeholder="print('Hello KM Craft!')"></textarea>
            </div>
            <button class="prop-btn">▶ Executar</button>
        `;
        return div;
    }
    
    renderGamePanel() {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `
            <div class="prop-header">🎮 Game</div>
            <div class="prop-group">
                <label>Start Game:</label>
                <button class="prop-btn" id="start-game">▶ Iniciar</button>
            </div>
            <div class="prop-group">
                <label>Physics:</label>
                <select class="prop-input">
                    <option>None</option>
                    <option selected>Bullet</option>
                </select>
            </div>
            <div class="prop-group">
                <label>Gravity:</label>
                <input type="number" class="prop-input" value="-9.8" step="0.1">
            </div>
        `;
        return div;
    }
    
    renderDefaultPanel(tabId) {
        const div = document.createElement('div');
        div.className = 'prop-section';
        div.innerHTML = `<div class="prop-header">${tabId.toUpperCase()}</div><p>Configurações em desenvolvimento...</p>`;
        return div;
    }
    
    showTooltip(event, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;
    }
    
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }
    
    setupResize() {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        this.resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = this.width;
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = startWidth - (e.clientX - startX);
            if (newWidth >= 200 && newWidth <= 500) {
                this.width = newWidth;
                this.panel.style.width = `${this.width}px`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = '';
        });
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.panel.classList.add('visible');
        } else {
            this.panel.classList.remove('visible');
        }
    }
    
    updateTransform(position, rotation, scale) {
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const posZ = document.getElementById('pos-z');
        const rotX = document.getElementById('rot-x');
        const rotY = document.getElementById('rot-y');
        const rotZ = document.getElementById('rot-z');
        const sclX = document.getElementById('scl-x');
        const sclY = document.getElementById('scl-y');
        const sclZ = document.getElementById('scl-z');
        
        if (posX && position) {
            posX.value = position.x.toFixed(3);
            posY.value = position.y.toFixed(3);
            posZ.value = position.z.toFixed(3);
            rotX.value = (rotation.x * 180 / Math.PI).toFixed(1);
            rotY.value = (rotation.y * 180 / Math.PI).toFixed(1);
            rotZ.value = (rotation.z * 180 / Math.PI).toFixed(1);
            sclX.value = scale.x.toFixed(3);
            sclY.value = scale.y.toFixed(3);
            sclZ.value = scale.z.toFixed(3);
        }
    }
    
    updateObjectList(objects, onSelect, onAdd) {
        const listEl = this.contentContainer.querySelector('#object-list');
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
                if (onSelect) onSelect(obj, 'rename');
            });
            
            item.querySelector('.delete-obj').addEventListener('click', (e) => {
                e.stopPropagation();
                if (onSelect) onSelect(obj, 'delete');
            });
            
            item.addEventListener('click', () => {
                if (onSelect) onSelect(obj, 'select');
            });
            
            listEl.appendChild(item);
        });
        
        const addBtn = this.contentContainer.querySelector('#add-cube-btn');
        if (addBtn && onAdd) addBtn.addEventListener('click', () => onAdd());
    }
    
    highlightObject(name) {
        const items = this.contentContainer.querySelectorAll('.object-item');
        items.forEach(item => {
            const itemName = item.querySelector('.object-name')?.textContent;
            if (itemName === name) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
}