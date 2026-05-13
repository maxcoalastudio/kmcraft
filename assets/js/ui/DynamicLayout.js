/**
 * DynamicLayout - Layout tipo Blender com abas, resize inteligente e context awareness
 */
export class DynamicLayout {
    constructor(container, engine) {
        this.container = container;
        this.engine = engine;
        this.panels = new Map();        // Painel -> { tabs, activeTab, rect }
        this.panelOrder = [];           // Ordem de painéis
        this.tabBeingDragged = null;
        this.mousePos = { x: 0, y: 0 };
        this.activePanel = null;        // Painel onde o mouse está
        
        this.init();
    }

    init() {
        this.createTopBar();
        this.createLayout();
        this.createDefaultPanels();
        this.setupEventListeners();
        this.loadLayoutFromStorage();
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

    createLayout() {
        this.layout = document.createElement('div');
        this.layout.className = 'wave-layout-tabbed';
        this.layout.id = 'layout-container';
        this.container.parentElement.appendChild(this.layout);
    }

    createDefaultPanels() {
        // 3D View
        this.createPanel('panel-3d', 0, 0, 70, 60, [
            { type: '3d', title: '3D View', icon: '🎥' }
        ]);

        // Text Editor
        this.createPanel('panel-text', 0, 60, 70, 40, [
            { type: 'text-editor', title: 'Text Editor', icon: '📝' }
        ]);

        // Right side - Outliner + Properties (vertically split)
        this.createPanel('panel-outliner', 70, 0, 30, 30, [
            { type: 'outliner', title: 'Outliner', icon: '🌳' }
        ]);

        this.createPanel('panel-properties', 70, 30, 30, 30, [
            { type: 'properties', title: 'Properties', icon: '📋' }
        ]);

        // Move canvas para 3D View
        const view3d = this.panels.get('panel-3d');
        if (view3d && this.container) {
            const content = view3d.contentEl;
            content.appendChild(this.container);
            content.style.overflow = 'hidden';
        }
    }

    createPanel(panelId, x, y, width, height, tabs = []) {
        const panelEl = document.createElement('div');
        panelEl.className = 'layout-panel';
        panelEl.id = panelId;
        panelEl.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            width: ${width}%;
            height: ${height}%;
        `;

        // Tab bar
        const tabBar = document.createElement('div');
        tabBar.className = 'tab-bar';

        // Tab buttons
        tabs.forEach((tab, idx) => {
            const tabBtn = document.createElement('div');
            tabBtn.className = `tab-button ${idx === 0 ? 'active' : ''}`;
            tabBtn.innerHTML = `
                <span class="tab-icon">${tab.icon}</span>
                <span class="tab-title">${tab.title}</span>
                <button class="tab-close">✕</button>
            `;
            tabBtn.dataset.tabType = tab.type;
            tabBtn.addEventListener('click', () => this.activateTab(panelId, tab.type));
            tabBtn.addEventListener('contextmenu', (e) => this.showTabMenu(panelId, tab.type, e));
            tabBtn.querySelector('.tab-close').addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(panelId, tab.type);
            });
            tabBar.appendChild(tabBtn);
        });

        // Add Tab Button
        const addTabBtn = document.createElement('div');
        addTabBtn.className = 'tab-add-btn';
        addTabBtn.innerHTML = '+';
        addTabBtn.addEventListener('click', () => this.showAddTabMenu(panelId));
        tabBar.appendChild(addTabBtn);

        panelEl.appendChild(tabBar);

        // Content area
        const contentEl = document.createElement('div');
        contentEl.className = 'panel-content-area';

        tabs.forEach(tab => {
            const tabContent = document.createElement('div');
            tabContent.className = `tab-content ${tabs[0].type === tab.type ? 'active' : ''}`;
            tabContent.id = `content-${tab.type}`;
            contentEl.appendChild(tabContent);
        });

        panelEl.appendChild(contentEl);

        // Resize handles
        this.createResizeHandles(panelEl);

        this.layout.appendChild(panelEl);
        this.panels.set(panelId, {
            element: panelEl,
            tabBar,
            contentEl,
            tabs: tabs.map(t => ({ ...t, id: `${panelId}-${t.type}` })),
            activeTab: tabs[0].type,
            x, y, width, height
        });
        this.panelOrder.push(panelId);
    }

    activateTab(panelId, tabType) {
        const panel = this.panels.get(panelId);
        if (!panel) return;

        panel.activeTab = tabType;
        
        // Update tab buttons
        panel.tabBar.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tabType === tabType);
        });

        // Update content visibility
        panel.contentEl.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `content-${tabType}`);
        });

        // Re-render content
        this.renderTabContent(panelId, tabType);
        this.saveLayoutToStorage();
    }

    createResizeHandles(panelEl) {
        const positions = [
            { class: 'resize-handle top', cursor: 'ns-resize', position: 'top' },
            { class: 'resize-handle bottom', cursor: 'ns-resize', position: 'bottom' },
            { class: 'resize-handle left', cursor: 'ew-resize', position: 'left' },
            { class: 'resize-handle right', cursor: 'ew-resize', position: 'right' }
        ];

        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = pos.class;
            handle.dataset.position = pos.position;
            handle.addEventListener('mousedown', (e) => this.startResize(e, panelEl));
            panelEl.appendChild(handle);
        });
    }

    startResize(event, panelEl) {
        event.preventDefault();
        const position = event.target.dataset.position;
        const startX = event.clientX;
        const startY = event.clientY;
        const rect = panelEl.getBoundingClientRect();
        const layoutRect = this.layout.getBoundingClientRect();

        const onMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const pctX = (deltaX / layoutRect.width) * 100;
            const pctY = (deltaY / layoutRect.height) * 100;

            const style = panelEl.style;
            const currentLeft = parseFloat(style.left) || 0;
            const currentTop = parseFloat(style.top) || 0;
            const currentWidth = parseFloat(style.width) || 50;
            const currentHeight = parseFloat(style.height) || 50;

            if (position === 'right') {
                style.width = Math.max(20, currentWidth + pctX) + '%';
            } else if (position === 'left') {
                style.left = (currentLeft + pctX) + '%';
                style.width = Math.max(20, currentWidth - pctX) + '%';
            } else if (position === 'bottom') {
                style.height = Math.max(15, currentHeight + pctY) + '%';
            } else if (position === 'top') {
                style.top = (currentTop + pctY) + '%';
                style.height = Math.max(15, currentHeight - pctY) + '%';
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            this.saveLayoutToStorage();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
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

    addTabToPanel(panelId, tab) {
        const panel = this.panels.get(panelId);
        if (!panel) return;

        // Verifica se aba já existe
        if (panel.tabs.some(t => t.type === tab.type)) return;

        // Adiciona aba
        panel.tabs.push({ ...tab, id: `${panelId}-${tab.type}` });

        // Cria botão de aba
        const tabBtn = document.createElement('div');
        tabBtn.className = 'tab-button';
        tabBtn.innerHTML = `
            <span class="tab-icon">${tab.icon}</span>
            <span class="tab-title">${tab.title}</span>
            <button class="tab-close">✕</button>
        `;
        tabBtn.dataset.tabType = tab.type;
        tabBtn.addEventListener('click', () => this.activateTab(panelId, tab.type));
        tabBtn.addEventListener('contextmenu', (e) => this.showTabMenu(panelId, tab.type, e));
        tabBtn.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(panelId, tab.type);
        });

        // Insere antes do + button
        const addBtn = panel.tabBar.querySelector('.tab-add-btn');
        panel.tabBar.insertBefore(tabBtn, addBtn);

        // Cria conteúdo de aba
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.id = `content-${tab.type}`;
        panel.contentEl.appendChild(tabContent);

        this.activateTab(panelId, tab.type);
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
            this.mousePos = { x: e.clientX, y: e.clientY };
            this.updateActivePanel();
        });

        // Detecta qual painel o mouse está
        this.layout.addEventListener('mouseenter', (e) => {
            const panel = e.target.closest('.layout-panel');
            if (panel) this.activePanel = Array.from(this.panels.entries()).find(([_, p]) => p.element === panel)?.[0];
        });
    }

    updateActivePanel() {
        const rect = this.layout.getBoundingClientRect();
        for (const [panelId, panel] of this.panels) {
            const panelRect = panel.element.getBoundingClientRect();
            if (
                this.mousePos.x >= panelRect.left &&
                this.mousePos.x <= panelRect.right &&
                this.mousePos.y >= panelRect.top &&
                this.mousePos.y <= panelRect.bottom
            ) {
                this.activePanel = panelId;
                return;
            }
        }
    }

    /**
     * Detecta contexto do shortcut baseado na posição do mouse
     */
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
            const style = panel.element.style;
            layout[panelId] = {
                x: style.left,
                y: style.top,
                width: style.width,
                height: style.height,
                activeTab: panel.activeTab,
                tabs: panel.tabs.map(t => ({ type: t.type, title: t.title, icon: t.icon }))
            };
        }
        localStorage.setItem('wave_layout_tabbed', JSON.stringify(layout));
    }

    loadLayoutFromStorage() {
        const stored = localStorage.getItem('wave_layout_tabbed');
        if (!stored) return;

        try {
            const layout = JSON.parse(stored);
            for (const [panelId, data] of Object.entries(layout)) {
                const panel = this.panels.get(panelId);
                if (!panel) continue;

                panel.element.style.left = data.x;
                panel.element.style.top = data.y;
                panel.element.style.width = data.width;
                panel.element.style.height = data.height;

                // Restaura abas
                if (data.tabs && data.tabs.length > 0) {
                    panel.tabs = data.tabs;
                    this.reconstructTabBar(panelId);
                }

                // Ativa aba anterior
                if (data.activeTab) {
                    this.activateTab(panelId, data.activeTab);
                }
            }
        } catch (e) {
            console.warn('Failed to load layout:', e);
        }
    }

    reconstructTabBar(panelId) {
        const panel = this.panels.get(panelId);
        if (!panel) return;

        const tabBar = panel.tabBar;
        const addBtn = tabBar.querySelector('.tab-add-btn');
        
        // Remove todos os botões exceto +
        tabBar.querySelectorAll('.tab-button').forEach(btn => btn.remove());

        // Reconstrói abas
        panel.tabs.forEach(tab => {
            const tabBtn = document.createElement('div');
            tabBtn.className = `tab-button ${tab.type === panel.activeTab ? 'active' : ''}`;
            tabBtn.innerHTML = `
                <span class="tab-icon">${tab.icon}</span>
                <span class="tab-title">${tab.title}</span>
                <button class="tab-close">✕</button>
            `;
            tabBtn.dataset.tabType = tab.type;
            tabBtn.addEventListener('click', () => this.activateTab(panelId, tab.type));
            tabBtn.querySelector('.tab-close').addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(panelId, tab.type);
            });
            tabBar.insertBefore(tabBtn, addBtn);
        });
    }

    showTabMenu(panelId, tabType, event) {
        event.preventDefault();
        // Pode adicionar menu de contexto para abas aqui
    }
}
