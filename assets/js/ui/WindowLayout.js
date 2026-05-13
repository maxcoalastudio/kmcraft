/**
 * WindowLayout - Gerencia o layout de janelas dockables estilo UPBGE
 */
export class WindowLayout {
    constructor(container, engine) {
        this.container = container;
        this.engine = engine;
        this.windows = new Map();
        this.layout = null;
        this.windowContextMenu = null;
        this.resizingArea = null;
        
        this.init();
    }

    init() {
        this.createTopBar();
        this.createLayout();
        this.createDefaultWindows();
        this.loadLayoutFromStorage();
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
        this.layout.className = 'wave-layout';
        this.container.parentElement.appendChild(this.layout);
    }

    createDefaultWindows() {
        // 3D View (centro, 60% da altura, 70% da largura)
        const view3d = this.createWindow('3d-view', '3D View', '🎥', {
            x: 0,
            y: 0,
            width: 70,
            height: 60,
            type: '3d'
        });

        // Mover o canvas para dentro da window de 3D View
        const content3d = view3d.querySelector('#content-3d-view');
        if (content3d && this.container) {
            content3d.appendChild(this.container);
            content3d.style.overflow = 'hidden';
        }

        // Text Editor (embaixo do 3D, 40% da altura, 70% da largura)
        this.createWindow('text-editor', 'Text Editor', '📝', {
            x: 0,
            y: 60,
            width: 70,
            height: 40,
            type: 'text-editor'
        });

        // Outliner (direita, 30% da altura, 30% da largura)
        this.createWindow('outliner', 'Outliner', '🌳', {
            x: 70,
            y: 0,
            width: 30,
            height: 30,
            type: 'outliner'
        });

        // Properties (direita, embaixo do Outliner, 30% da altura, 30% da largura)
        this.createWindow('properties', 'Properties', '📋', {
            x: 70,
            y: 30,
            width: 30,
            height: 30,
            type: 'properties'
        });

        // UV Editor (pode estar escondido por padrão)
        this.createWindow('uv-editor', 'UV Editor', '📐', {
            x: 70,
            y: 60,
            width: 30,
            height: 40,
            type: 'uv-editor',
            hidden: true
        });

        // Timeline (pode estar escondido por padrão)
        this.createWindow('timeline', 'Timeline', '⏱️', {
            x: 0,
            y: 60,
            width: 70,
            height: 40,
            type: 'timeline',
            hidden: true
        });
    }

    createWindow(id, title, icon, options = {}) {
        const windowEl = document.createElement('div');
        windowEl.className = 'dockable-window';
        windowEl.id = `window-${id}`;
        windowEl.style.cssText = `
            position: absolute;
            left: ${options.x}%;
            top: ${options.y}%;
            width: ${options.width}%;
            height: ${options.height}%;
            display: ${options.hidden ? 'none' : 'flex'};
        `;
        windowEl.dataset.windowId = id;
        windowEl.dataset.type = options.type || 'generic';

        // Header
        const header = document.createElement('div');
        header.className = 'window-header';
        header.innerHTML = `
            <div class="header-context-btn" title="Change context">
                <span class="context-icon">${icon}</span>
                <span class="context-name">${title}</span>
                <span class="context-dropdown">▼</span>
            </div>
            <button class="window-close-btn" title="Close">✕</button>
        `;
        windowEl.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.className = 'window-content';
        content.id = `content-${id}`;
        windowEl.appendChild(content);

        // Resize handles (todos os lados exceto extremidades)
        this.createResizeHandles(windowEl);

        this.layout.appendChild(windowEl);
        this.windows.set(id, {
            element: windowEl,
            header,
            content,
            title,
            icon,
            options,
            visible: !options.hidden
        });

        // Event listeners
        header.querySelector('.header-context-btn').addEventListener('click', (e) => {
            this.showContextMenu(id, e);
        });

        header.querySelector('.window-close-btn').addEventListener('click', () => {
            this.closeWindow(id);
        });

        return windowEl;
    }

    createResizeHandles(windowEl) {
        const positions = [
            { class: 'resize-handle top', cursor: 'ns-resize', position: 'top' },
            { class: 'resize-handle bottom', cursor: 'ns-resize', position: 'bottom' },
            { class: 'resize-handle left', cursor: 'ew-resize', position: 'left' },
            { class: 'resize-handle right', cursor: 'ew-resize', position: 'right' }
        ];

        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = pos.class;
            handle.style.cursor = pos.cursor;
            handle.dataset.position = pos.position;
            handle.addEventListener('mousedown', (e) => this.startResize(e, windowEl));
            windowEl.appendChild(handle);
        });
    }

    startResize(event, windowEl) {
        event.preventDefault();
        const handle = event.target;
        const position = handle.dataset.position;
        const rect = windowEl.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;

        const onMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            if (position === 'right') {
                windowEl.style.width = `${((rect.width + deltaX) / this.layout.clientWidth) * 100}%`;
            } else if (position === 'left') {
                windowEl.style.left = `${((rect.left + deltaX) / this.layout.clientWidth) * 100}%`;
                windowEl.style.width = `${((rect.width - deltaX) / this.layout.clientWidth) * 100}%`;
            } else if (position === 'bottom') {
                windowEl.style.height = `${((rect.height + deltaY) / this.layout.clientHeight) * 100}%`;
            } else if (position === 'top') {
                windowEl.style.top = `${((rect.top + deltaY) / this.layout.clientHeight) * 100}%`;
                windowEl.style.height = `${((rect.height - deltaY) / this.layout.clientHeight) * 100}%`;
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

    showContextMenu(windowId, event) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
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
                const newType = item.dataset.type;
                this.changeWindowType(windowId, newType);
                menu.remove();
            }
        });

        document.body.appendChild(menu);
        const rect = event.target.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = (rect.bottom + 5) + 'px';

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.header-context-btn')) {
                menu.remove();
            }
        }, { once: true });
    }

    changeWindowType(windowId, newType) {
        const window = this.windows.get(windowId);
        if (!window) return;

        const typeInfo = {
            '3d': { title: '3D View', icon: '🎥' },
            'outliner': { title: 'Outliner', icon: '🌳' },
            'properties': { title: 'Properties', icon: '📋' },
            'text-editor': { title: 'Text Editor', icon: '📝' },
            'uv-editor': { title: 'UV Editor', icon: '📐' },
            'timeline': { title: 'Timeline', icon: '⏱️' },
            'console': { title: 'Console', icon: '⚡' }
        };

        const info = typeInfo[newType];
        if (info) {
            window.title = info.title;
            window.icon = info.icon;
            window.options.type = newType;
            window.element.dataset.type = newType;

            const contextBtn = window.header.querySelector('.header-context-btn');
            contextBtn.innerHTML = `
                <span class="context-icon">${info.icon}</span>
                <span class="context-name">${info.title}</span>
                <span class="context-dropdown">▼</span>
            `;

            this.renderWindowContent(windowId);
            this.saveLayoutToStorage();
        }
    }

    renderWindowContent(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        const content = window.content;
        const type = window.options.type;

        content.innerHTML = '';

        if (type === '3d') {
            // O canvas do Three.js já está lá
            if (this.engine && this.engine.renderManager) {
                content.style.overflow = 'hidden';
            }
        } else if (type === 'outliner') {
            content.innerHTML = '<div class="outliner-content"><p>Scene Objects</p></div>';
        } else if (type === 'properties') {
            content.innerHTML = '<div class="properties-content"><p>Object Properties</p></div>';
        } else if (type === 'text-editor') {
            content.innerHTML = '<textarea class="text-editor-content" placeholder="Script Editor"></textarea>';
        } else if (type === 'uv-editor') {
            content.innerHTML = '<div class="uv-editor-content"><p>UV Editor</p></div>';
        } else if (type === 'timeline') {
            content.innerHTML = '<div class="timeline-content"><p>Timeline</p></div>';
        } else if (type === 'console') {
            content.innerHTML = '<div class="console-content"><pre>Console output here</pre></div>';
        }
    }

    closeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (window) {
            window.element.style.display = 'none';
            window.visible = false;
            this.saveLayoutToStorage();
        }
    }

    openWindow(windowId) {
        const window = this.windows.get(windowId);
        if (window) {
            window.element.style.display = 'flex';
            window.visible = true;
            this.renderWindowContent(windowId);
            this.saveLayoutToStorage();
        }
    }

    saveLayoutToStorage() {
        const layout = {};
        this.windows.forEach((window, id) => {
            const rect = window.element.getBoundingClientRect();
            const layoutRect = this.layout.getBoundingClientRect();
            layout[id] = {
                type: window.options.type,
                x: ((rect.left - layoutRect.left) / layoutRect.width) * 100,
                y: ((rect.top - layoutRect.top) / layoutRect.height) * 100,
                width: (rect.width / layoutRect.width) * 100,
                height: (rect.height / layoutRect.height) * 100,
                visible: window.visible
            };
        });
        localStorage.setItem('wave_window_layout', JSON.stringify(layout));
    }

    loadLayoutFromStorage() {
        const saved = localStorage.getItem('wave_window_layout');
        if (saved) {
            try {
                const layout = JSON.parse(saved);
                Object.entries(layout).forEach(([id, data]) => {
                    const window = this.windows.get(id);
                    if (window) {
                        window.element.style.left = data.x + '%';
                        window.element.style.top = data.y + '%';
                        window.element.style.width = data.width + '%';
                        window.element.style.height = data.height + '%';
                        window.element.style.display = data.visible ? 'flex' : 'none';
                        if (data.type !== window.options.type) {
                            this.changeWindowType(id, data.type);
                        }
                    }
                });
            } catch (e) {
                console.warn('Erro ao carregar layout:', e);
            }
        }
    }

    getAllWindows() {
        return Array.from(this.windows.values());
    }

    getWindow(windowId) {
        return this.windows.get(windowId);
    }
}
