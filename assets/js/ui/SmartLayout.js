/**
 * SmartLayout - Layout inteligente tipo Blender com hierarquia e redimensionamento dinâmico
 */
export class SmartLayout {
    constructor(container, engine) {
        this.container = container;
        this.engine = engine;
        this.panels = new Map();        // Painel -> { tabs, activeTab, rect, hierarchy }
        this.panelOrder = [];           // Ordem de criação (hierarquia)
        this.activePanel = null;        // Painel onde mouse está
        this.resizing = null;           // { panelId, direction, startPos }
        this.minSize = { width: 200, height: 150 };
        this.maxSize = { width: 0.8, height: 0.8 }; // % do viewport
        
        this.init();
    }

    init() {
        this.createTopBar();
        this.createLayoutContainer();
        this.createDefaultPanels();
        this.setupEventListeners();
        this.loadLayoutFromStorage();
        this.updateLayout();
        this.render();
    }

    createTopBar() {
        const topBar = document.createElement('div');
        topBar.className = 'wave-topbar';
        topBar.innerHTML = `
            <div class="topbar-menu">
                <button class="menu-btn">File</button>
                <button class="menu-btn">Edit</button>
                <button class="menu-btn">Game</button>
                <button class="menu-btn">Window</button>
                <button class="menu-btn">Help</button>
            </div>
            <div class="topbar-templates">
                <select id="scene-templates" class="template-select">
                    <option value="">Templates</option>
                    <option value="general">General</option>
                    <option value="modeling">Modeling</option>
                    <option value="sculpting">Sculpting</option>
                </select>
                <input id="scene-name" type="text" placeholder="Scene" class="scene-name-input" value="Scene">
            </div>
        `;
        this.container.parentElement.insertBefore(topBar, this.container);
    }

    createLayoutContainer() {
        this.layout = document.createElement('div');
        this.layout.className = 'smart-layout-container';
        this.layout.id = 'smart-layout';
        this.container.parentElement.appendChild(this.layout);
    }

    createDefaultPanels() {
        // Painel principal (3D View) - Hierarquia 0
        this.createPanel('panel-main', {
            x: 0, y: 0, width: 70, height: 100,
            hierarchy: 0,
            tabs: [{ type: '3d', title: '3D View', icon: '🎥' }]
        });

        // Painel direito (Outliner + Properties) - Hierarquia 1
        this.createPanel('panel-right', {
            x: 70, y: 0, width: 30, height: 100,
            hierarchy: 1,
            tabs: [
                { type: 'outliner', title: 'Outliner', icon: '🌳' },
                { type: 'properties', title: 'Properties', icon: '📋' }
            ]
        });

        // Move canvas para 3D View
        const mainPanel = this.panels.get('panel-main');
        if (mainPanel && this.container) {
            const content = mainPanel.contentEl;
            content.appendChild(this.container);
            content.style.overflow = 'hidden';
        }
    }

    createPanel(panelId, config) {
        const panelEl = document.createElement('div');
        panelEl.className = 'smart-panel';
        panelEl.id = panelId;
        panelEl.dataset.hierarchy = config.hierarchy;
        panelEl.style.cssText = `
            position: absolute;
            left: ${config.x}%;
            top: ${config.y}%;
            width: ${config.width}%;
            height: ${config.height}%;
            z-index: ${10 + config.hierarchy};
        `;

        // Tab bar
        const tabBar = document.createElement('div');
        tabBar.className = 'smart-tab-bar';

        // Tab buttons
        config.tabs.forEach((tab, idx) => {
            const tabBtn = this.createTabButton(tab, panelId);
            tabBar.appendChild(tabBtn);
        });

        // Add Tab Button
        const addTabBtn = document.createElement('div');
        addTabBtn.className = 'smart-tab-add-btn';
        addTabBtn.innerHTML = '+';
        addTabBtn.addEventListener('click', () => this.showAddTabMenu(panelId));
        tabBar.appendChild(addTabBtn);

        panelEl.appendChild(tabBar);

        // Content area
        const contentEl = document.createElement('div');
        contentEl.className = 'smart-panel-content';

        config.tabs.forEach(tab => {
            const tabContent = document.createElement('div');
            tabContent.className = `smart-tab-content ${config.tabs[0].type === tab.type ? 'active' : ''}`;
            tabContent.id = `content-${tab.type}`;
            contentEl.appendChild(tabContent);
        });

        panelEl.appendChild(contentEl);

        // Resize handles (apenas para painéis de hierarquia inferior)
        if (config.hierarchy > 0) {
            this.createResizeHandles(panelEl, config.hierarchy);
        }

        this.layout.appendChild(panelEl);
        this.panels.set(panelId, {
            element: panelEl,
            tabBar,
            contentEl,
            tabs: config.tabs.map(t => ({ ...t, id: `${panelId}-${t.type}` })),
            activeTab: config.tabs[0].type,
            hierarchy: config.hierarchy,
            x: config.x, y: config.y, width: config.width, height: config.height
        });
        this.panelOrder.push(panelId);
    }

    createTabButton(tab, panelId) {
        const tabBtn = document.createElement('div');
        tabBtn.className = `smart-tab-button ${tab.type === this.panels.get(panelId)?.activeTab ? 'active' : ''}`;
        tabBtn.innerHTML = `
            <span class="smart-tab-icon">${tab.icon}</span>
            <span class="smart-tab-title">${tab.title}</span>
            <button class="smart-tab-close">✕</button>
        `;
        tabBtn.dataset.tabType = tab.type;
        tabBtn.addEventListener('click', () => this.activateTab(panelId, tab.type));
        tabBtn.addEventListener('contextmenu', (e) => this.showTabMenu(panelId, tab.type, e));
        tabBtn.querySelector('.smart-tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(panelId, tab.type);
        });
        return tabBtn;
    }

    createResizeHandles(panelEl, hierarchy) {
        const directions = ['top', 'bottom', 'left', 'right'];
        directions.forEach(dir => {
            const handle = document.createElement('div');
            handle.className = `smart-resize-handle ${dir}`;
            handle.dataset.direction = dir;
            handle.dataset.hierarchy = hierarchy;
            handle.addEventListener('mousedown', (e) => this.startResize(e, panelEl.id, dir));
            panelEl.appendChild(handle);
        });
    }

    startResize(event, panelId, direction) {
        event.preventDefault();
        const panel = this.panels.get(panelId);
        if (!panel) return;

        this.resizing = {
            panelId,
            direction,
            startX: event.clientX,
            startY: event.clientY,
            startRect: panel.element.getBoundingClientRect(),
            hierarchy: panel.hierarchy
        };

        document.addEventListener('mousemove', this.onResizeMove.bind(this));
        document.addEventListener('mouseup', this.onResizeEnd.bind(this));
    }

    onResizeMove(event) {
        if (!this.resizing) return;

        const { panelId, direction, startX, startY, startRect, hierarchy } = this.resizing;
        const panel = this.panels.get(panelId);
        if (!panel) return;

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        const layoutRect = this.layout.getBoundingClientRect();

        let newX = panel.x;
        let newY = panel.y;
        let newWidth = panel.width;
        let newHeight = panel.height;

        // Converte pixels para porcentagem
        const pctX = (deltaX / layoutRect.width) * 100;
        const pctY = (deltaY / layoutRect.height) * 100;

        switch (direction) {
            case 'right':
                newWidth = Math.max(this.minSize.width / layoutRect.width * 100,
                          Math.min(this.maxSize.width * 100, panel.width + pctX));
                break;
            case 'left':
                newX = panel.x + pctX;
                newWidth = Math.max(this.minSize.width / layoutRect.width * 100,
                          Math.min(this.maxSize.width * 100, panel.width - pctX));
                break;
            case 'bottom':
                newHeight = Math.max(this.minSize.height / layoutRect.height * 100,
                           Math.min(this.maxSize.height * 100, panel.height + pctY));
                break;
            case 'top':
                newY = panel.y + pctY;
                newHeight = Math.max(this.minSize.height / layoutRect.height * 100,
                           Math.min(this.maxSize.height * 100, panel.height - pctY));
                break;
        }

        // Atualiza painel
        panel.x = newX;
        panel.y = newY;
        panel.width = newWidth;
        panel.height = newHeight;

        this.updatePanelPosition(panelId);
        this.updateLayout(); // Redistribui espaço
    }

    onResizeEnd() {
        if (this.resizing) {
            this.saveLayoutToStorage();
            this.resizing = null;
        }
        document.removeEventListener('mousemove', this.onResizeMove.bind(this));
        document.removeEventListener('mouseup', this.onResizeEnd.bind(this));
    }

    updatePanelPosition(panelId) {
        const panel = this.panels.get(panelId);
        if (!panel) return;

        panel.element.style.left = `${panel.x}%`;
        panel.element.style.top = `${panel.y}%`;
        panel.element.style.width = `${panel.width}%`;
        panel.element.style.height = `${panel.height}%`;
    }

    updateLayout() {
        // Redistribui espaço baseado na hierarquia
        // Painéis de hierarquia inferior não podem afetar superiores
        const sortedPanels = Array.from(this.panels.entries())
            .sort(([,a], [,b]) => a.hierarchy - b.hierarchy);

        for (const [panelId, panel] of sortedPanels) {
            // Ajusta limites baseado em painéis superiores
            this.adjustPanelLimits(panelId);
        }

        // Atualiza aspect ratio do 3D View
        this.update3DViewAspectRatio();
    }

    adjustPanelLimits(panelId) {
        const panel = this.panels.get(panelId);
        if (!panel || panel.hierarchy === 0) return;

        // Painéis superiores definem limites para inferiores
        const superiorPanels = Array.from(this.panels.values())
            .filter(p => p.hierarchy < panel.hierarchy);

        // Ajusta baseado nos superiores
        let maxX = 100;
        let maxY = 100;
        let minX = 0;
        let minY = 0;

        for (const supPanel of superiorPanels) {
            if (supPanel.x + supPanel.width > panel.x && supPanel.x < panel.x + panel.width) {
                // Mesmo range horizontal
                if (supPanel.y < panel.y) {
                    minY = Math.max(minY, supPanel.y + supPanel.height);
                }
                if (supPanel.y + supPanel.height > panel.y) {
                    maxY = Math.min(maxY, supPanel.y);
                }
            }

            if (supPanel.y + supPanel.height > panel.y && supPanel.y < panel.y + panel.height) {
                // Mesmo range vertical
                if (supPanel.x < panel.x) {
                    minX = Math.max(minX, supPanel.x + supPanel.width);
                }
                if (supPanel.x + supPanel.width > panel.x) {
                    maxX = Math.min(maxX, supPanel.x);
                }
            }
        }

        // Aplica limites
        panel.x = Math.max(minX, Math.min(maxX - panel.width, panel.x));
        panel.y = Math.max(minY, Math.min(maxY - panel.height, panel.y));
        this.updatePanelPosition(panelId);
    }

    update3DViewAspectRatio() {
        const mainPanel = this.panels.get('panel-main');
        if (!mainPanel || mainPanel.activeTab !== '3d') return;

        const rect = mainPanel.element.getBoundingClientRect();
        const aspectRatio = rect.width / rect.height;

        // Atualiza renderer do Three.js
        if (this.engine && this.engine.renderManager) {
            this.engine.renderManager.resize(rect.width, rect.height);
            if (this.engine.sceneManager && this.engine.sceneManager.camera) {
                this.engine.sceneManager.camera.aspect = aspectRatio;
                this.engine.sceneManager.camera.updateProjectionMatrix();
            }
        }
    }

    activateTab(panelId, tabType) {
        const panel = this.panels.get(panelId);
        if (!panel) return;

        panel.activeTab = tabType;

        // Update tab buttons
        panel.tabBar.querySelectorAll('.smart-tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tabType === tabType);
        });

        // Update content visibility
        panel.contentEl.querySelectorAll('.smart-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `content-${tabType}`);
        });

        // Re-render content
        this.renderTabContent(panelId, tabType);
        this.saveLayoutToStorage();
    }

    closeTab(panelId, tabType) {
        const panel = this.panels.get(panelId);
        if (!panel || panel.tabs.length === 1) return;

        // Remove aba da lista
        panel.tabs = panel.tabs.filter(t => t.type !== tabType);

        // Remove botão
        const btn = panel.tabBar.querySelector(`[data-tab-type="${tabType}"]`);
        if (btn) btn.remove();

        // Remove conteúdo
        const content = panel.contentEl.querySelector(`#content-${tabType}`);
        if (content) content.remove();

        // Se era a aba ativa, ativa a primeira
        if (panel.activeTab === tabType) {
            const firstTab = panel.tabs[0];
            if (firstTab) this.activateTab(panelId, firstTab.type);
        }

        this.saveLayoutToStorage();
    }

    addTabToPanel(panelId, tab) {
        const panel = this.panels.get(panelId);
        if (!panel) return;

        // Verifica se aba já existe
        if (panel.tabs.some(t => t.type === tab.type)) return;

        // Adiciona aba
        panel.tabs.push({ ...tab, id: `${panelId}-${tab.type}` });

        // Cria botão de aba
        const tabBtn = this.createTabButton(tab, panelId);
        const addBtn = panel.tabBar.querySelector('.smart-tab-add-btn');
        panel.tabBar.insertBefore(tabBtn, addBtn);

        // Cria conteúdo de aba
        const tabContent = document.createElement('div');
        tabContent.className = 'smart-tab-content';
        tabContent.id = `content-${tab.type}`;
        panel.contentEl.appendChild(tabContent);

        this.activateTab(panelId, tab.type);
    }

    showAddTabMenu(panelId) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'fixed';
        menu.innerHTML = `
            <div class="context-menu-item" data-type="3d">🎥 3D View</div>
            <div class="context-menu-item" data-type="outliner">🌳 Outliner</div>
            <div class="context-menu-item" data-type="properties">📋 Properties</div>
            <div class="context-menu-item" data-type="text-editor">📝 Text Editor</div>
            <div class="context-menu-item" data-type="uv-editor">📐 UV Editor</div>
            <div class="context-menu-item" data-type="timeline">⏱️ Timeline</div>
            <div class="context-menu-item" data-type="console">⚡ Console</div>
        `;

        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (item) {
                this.addTabToPanel(panelId, {
                    type: item.dataset.type,
                    title: item.textContent.trim(),
                    icon: item.textContent.trim()[0]
                });
                menu.remove();
            }
        });

        document.body.appendChild(menu);
        menu.style.zIndex = '1000';
    }

    renderTabContent(panelId, tabType) {
        const panel = this.panels.get(panelId);
        if (!panel) return;

        const content = panel.contentEl.querySelector(`#content-${tabType}`);
        if (!content) return;

        content.innerHTML = '';

        switch (tabType) {
            case 'outliner':
                this.renderOutliner(content);
                break;
            case 'properties':
                this.renderProperties(content);
                break;
            case 'text-editor':
                content.innerHTML = `<textarea class="text-editor-content" placeholder="Script Code..."></textarea>`;
                break;
            case 'uv-editor':
                content.innerHTML = '<div class="uv-editor-content">UV Editor - Not Implemented</div>';
                break;
            case 'timeline':
                content.innerHTML = '<div class="timeline-content">Timeline - Not Implemented</div>';
                break;
            case 'console':
                content.innerHTML = '<div class="console-content">Console Output</div>';
                break;
        }
    }

    renderOutliner(container) {
        container.className = 'outliner-content';
        const list = document.createElement('div');
        list.className = 'outliner-tree';

        const gameObjects = this.engine.sceneManager.getGameObjects();
        gameObjects.forEach(obj => {
            const item = document.createElement('div');
            item.className = 'outliner-item';
            item.innerHTML = `
                <span class="outliner-icon">📦</span>
                <span class="outliner-name">${obj.name || 'Object'}</span>
            `;
            item.addEventListener('click', () => {
                this.engine.sceneManager.selectGameObject(obj);
            });
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    renderProperties(container) {
        container.className = 'properties-content';
        const selected = this.engine.sceneManager.getSelectedGameObject();

        if (!selected) {
            container.innerHTML = '<div class="properties-empty">No object selected</div>';
            return;
        }

        const props = document.createElement('div');
        props.className = 'properties-panel';
        props.innerHTML = `
            <div class="prop-section">
                <h4>Transform</h4>
                <div class="prop-field">
                    <label>Position X</label>
                    <input type="number" value="${selected.position.x}" data-prop="position.x">
                </div>
                <div class="prop-field">
                    <label>Position Y</label>
                    <input type="number" value="${selected.position.y}" data-prop="position.y">
                </div>
                <div class="prop-field">
                    <label>Position Z</label>
                    <input type="number" value="${selected.position.z}" data-prop="position.z">
                </div>
            </div>
        `;

        props.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const [obj, prop] = e.target.dataset.prop.split('.');
                selected[obj][prop] = parseFloat(e.target.value);
                this.engine.sceneManager.updateGameObject(selected);
            });
        });

        container.appendChild(props);
    }

    setupEventListeners() {
        // Track mouse position para context-aware shortcuts
        document.addEventListener('mousemove', (e) => {
            this.updateActivePanel(e.clientX, e.clientY);
        });

        // Resize observer para atualizar aspect ratio
        const resizeObserver = new ResizeObserver(() => {
            this.update3DViewAspectRatio();
        });
        resizeObserver.observe(this.layout);
    }

    updateActivePanel(mouseX, mouseY) {
        for (const [panelId, panel] of this.panels) {
            const rect = panel.element.getBoundingClientRect();
            if (
                mouseX >= rect.left &&
                mouseX <= rect.right &&
                mouseY >= rect.top &&
                mouseY <= rect.bottom
            ) {
                this.activePanel = panelId;
                return;
            }
        }
        this.activePanel = null;
    }

    getActiveContext() {
        if (!this.activePanel) return null;
        const panel = this.panels.get(this.activePanel);
        return panel ? panel.activeTab : null;
    }

    render() {
        // Re-render content de todos os painéis ativos
        for (const [panelId, panel] of this.panels) {
            this.renderTabContent(panelId, panel.activeTab);
        }
    }

    saveLayoutToStorage() {
        const layout = {};
        for (const [panelId, panel] of this.panels) {
            layout[panelId] = {
                x: panel.x,
                y: panel.y,
                width: panel.width,
                height: panel.height,
                activeTab: panel.activeTab,
                tabs: panel.tabs.map(t => ({ type: t.type, title: t.title, icon: t.icon })),
                hierarchy: panel.hierarchy
            };
        }
        localStorage.setItem('wave_smart_layout', JSON.stringify(layout));
    }

    loadLayoutFromStorage() {
        const stored = localStorage.getItem('wave_smart_layout');
        if (!stored) return;

        try {
            const layout = JSON.parse(stored);
            // Carrega layout salvo ou usa padrão
            this.loadLayout(layout);
        } catch (e) {
            console.warn('Failed to load layout:', e);
            // Carrega padrão se falhar
            this.createDefaultPanels();
        }
    }

    loadLayout(layout) {
        // Remove painéis existentes
        for (const panelId of this.panels.keys()) {
            const panel = this.panels.get(panelId);
            if (panel.element) panel.element.remove();
        }
        this.panels.clear();
        this.panelOrder = [];

        // Carrega painéis salvos
        for (const [panelId, data] of Object.entries(layout)) {
            this.createPanel(panelId, {
                x: data.x,
                y: data.y,
                width: data.width,
                height: data.height,
                hierarchy: data.hierarchy || 0,
                tabs: data.tabs || [{ type: '3d', title: '3D View', icon: '🎥' }]
            });

            if (data.activeTab) {
                this.activateTab(panelId, data.activeTab);
            }
        }

        // Se nenhum painel carregado, cria padrão
        if (this.panels.size === 0) {
            this.createDefaultPanels();
        }
    }

    showTabMenu(panelId, tabType, event) {
        event.preventDefault();
        // Pode adicionar menu de contexto para abas aqui
    }
}
