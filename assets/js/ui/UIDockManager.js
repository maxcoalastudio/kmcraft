import * as THREE from 'three';
import { ShortcutManager } from './ShortcutManager.js';
import { PreferencesManager, AddonManager } from './PreferencesManager.js';

export class UIDockManager {
    constructor(container, engine) {
        this.container = container;
        this.engine = engine;
        this.selectedContext = 'scene';
        this.selectedSubContext = 'background';
        this.shortcutManager = new ShortcutManager(engine);
        this.preferencesManager = new PreferencesManager();
        this.addonManager = new AddonManager();
        this.categories = [
            {
                id: 'scene',
                icon: '🌍',
                name: 'Cena',
                items: [
                    { id: 'background', label: 'Background' },
                    { id: 'grid', label: 'Grid' },
                    { id: 'lights', label: 'Lights' },
                    { id: 'environment', label: 'Environment' }
                ]
            },
            {
                id: 'object',
                icon: '📦',
                name: 'Objeto',
                items: [
                    { id: 'transform', label: 'Transform' },
                    { id: 'material', label: 'Material' },
                    { id: 'physics', label: 'Physics' }
                ]
            },
            {
                id: 'render',
                icon: '🎨',
                name: 'Render',
                items: [
                    { id: 'settings', label: 'Render Settings' },
                    { id: 'post', label: 'Post Processing' }
                ]
            },
            {
                id: 'game',
                icon: '🎮',
                name: 'Game',
                items: [
                    { id: 'logic', label: 'Logic Bricks' },
                    { id: 'physics', label: 'Physics' }
                ]
            },
            {
                id: 'shortcuts',
                icon: '⌨️',
                name: 'Shortcuts',
                items: [
                    { id: 'object-mode', label: 'Modo Objeto' },
                    { id: 'edit-mode', label: 'Modo Edição' }
                ]
            },
            {
                id: 'preferences',
                icon: '⚙️',
                name: 'Preferências',
                items: [
                    { id: 'interface', label: 'Interface' },
                    { id: 'viewport', label: 'Viewport' },
                    { id: 'editor', label: 'Editor' },
                    { id: 'performance', label: 'Performance' },
                    { id: 'autosave', label: 'Autosave' }
                ]
            },
            {
                id: 'addons',
                icon: '🔌',
                name: 'Addons',
                items: [
                    { id: 'installed', label: 'Instalados' },
                    { id: 'available', label: 'Disponíveis' }
                ]
            }
        ];

        this.init();
    }

    init() {
        this.createLayout();
        this.createLeftPanel();
        this.createRightPanel();
        this.renderContent();
        this.setupSplitters();
    }

    createLayout() {
        const app = document.getElementById('app');
        const toolbar = document.getElementById('toolbar');

        this.layout = document.createElement('div');
        this.layout.id = 'ui-layout';
        this.layout.className = 'ui-layout';

        this.leftPanel = document.createElement('aside');
        this.leftPanel.id = 'left-panel';
        this.leftPanel.className = 'dock-panel left-panel';

        this.leftSplitter = document.createElement('div');
        this.leftSplitter.className = 'splitter vertical-splitter left-splitter';

        this.centerArea = document.createElement('section');
        this.centerArea.id = 'center-area';
        this.centerArea.className = 'center-area';

        this.rightSplitter = document.createElement('div');
        this.rightSplitter.className = 'splitter vertical-splitter right-splitter';

        this.rightPanel = document.createElement('aside');
        this.rightPanel.id = 'right-panel';
        this.rightPanel.className = 'dock-panel right-panel';

        const canvasParent = this.container.parentElement;
        if (canvasParent) {
            this.centerArea.appendChild(this.container);
        }

        this.layout.appendChild(this.leftPanel);
        this.layout.appendChild(this.leftSplitter);
        this.layout.appendChild(this.centerArea);
        this.layout.appendChild(this.rightSplitter);
        this.layout.appendChild(this.rightPanel);

        if (toolbar) {
            app.insertBefore(this.layout, toolbar);
        } else {
            app.appendChild(this.layout);
        }
    }

    createLeftPanel() {
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `<div class="panel-title">Contexto</div><div class="panel-subtitle">Escolha em cascata</div>`;
        this.leftPanel.appendChild(header);

        const menu = document.createElement('div');
        menu.className = 'panel-context-menu';

        this.categories.forEach(category => {
            const group = document.createElement('div');
            group.className = 'context-group';

            const button = document.createElement('button');
            button.className = 'context-category';
            button.type = 'button';
            button.innerHTML = `<span class="context-icon">${category.icon}</span><span>${category.name}</span>`;
            button.dataset.category = category.id;
            button.addEventListener('click', () => this.toggleCategory(category.id));
            group.appendChild(button);

            const submenu = document.createElement('div');
            submenu.className = 'context-submenu';
            submenu.dataset.category = category.id;
            category.items.forEach(item => {
                const subButton = document.createElement('button');
                subButton.className = 'context-item';
                subButton.type = 'button';
                subButton.innerText = item.label;
                subButton.dataset.category = category.id;
                subButton.dataset.sub = item.id;
                subButton.addEventListener('click', () => this.selectSubContext(category.id, item.id));
                submenu.appendChild(subButton);
            });
            group.appendChild(submenu);
            menu.appendChild(group);
        });

        this.leftPanel.appendChild(menu);
        this.updateLeftSelection();
    }

    createRightPanel() {
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `<div class="panel-title">Detalhes</div><div class="panel-subtitle">Ajustes contextuais</div>`;
        this.rightPanel.appendChild(header);

        this.rightContent = document.createElement('div');
        this.rightContent.className = 'panel-details';
        this.rightPanel.appendChild(this.rightContent);
    }

    setupSplitters() {
        this.makeSplitterResizable(this.leftSplitter, this.leftPanel, 'horizontal');
        this.makeSplitterResizable(this.rightSplitter, this.rightPanel, 'horizontal');
    }

    makeSplitterResizable(splitter, panel, direction) {
        let startX = 0;
        let startWidth = 0;

        const onMouseMove = (event) => {
            const delta = event.clientX - startX;
            const newWidth = startWidth + (splitter === this.leftSplitter ? delta : -delta);
            if (newWidth >= 220 && newWidth <= 420) {
                panel.style.width = `${newWidth}px`;
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
        };

        splitter.addEventListener('mousedown', (event) => {
            event.preventDefault();
            startX = event.clientX;
            startWidth = panel.getBoundingClientRect().width;
            document.body.style.cursor = 'col-resize';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    toggleCategory(categoryId) {
        if (this.selectedContext === categoryId) {
            this.selectedContext = null;
        } else {
            this.selectedContext = categoryId;
            const category = this.categories.find(cat => cat.id === categoryId);
            if (category) {
                this.selectedSubContext = category.items[0].id;
            }
        }
        this.updateLeftSelection();
        this.renderContent();
    }

    selectSubContext(categoryId, subId) {
        this.selectedContext = categoryId;
        this.selectedSubContext = subId;
        this.updateLeftSelection();
        this.renderContent();
    }

    updateLeftSelection() {
        const categoryButtons = this.leftPanel.querySelectorAll('.context-category');
        const subMenus = this.leftPanel.querySelectorAll('.context-submenu');
        const subButtons = this.leftPanel.querySelectorAll('.context-item');

        categoryButtons.forEach(button => {
            const cat = button.dataset.category;
            button.classList.toggle('active', cat === this.selectedContext);
        });

        subMenus.forEach(menu => {
            const cat = menu.dataset.category;
            menu.classList.toggle('expanded', cat === this.selectedContext);
        });

        subButtons.forEach(button => {
            const cat = button.dataset.category;
            const sub = button.dataset.sub;
            button.classList.toggle('active', cat === this.selectedContext && sub === this.selectedSubContext);
        });
    }

    renderContent() {
        if (!this.selectedContext) {
            this.rightContent.innerHTML = '<div class="panel-empty">Selecione um contexto à esquerda para começar.</div>';
            return;
        }

        const title = this.categories.find(cat => cat.id === this.selectedContext)?.name || 'Detalhes';
        const subtitle = this.selectedSubContext || 'Selecione uma opção';
        this.rightContent.innerHTML = `
            <div class="panel-detail-header">
                <div class="panel-detail-title">${title}</div>
                <div class="panel-detail-subtitle">${subtitle}</div>
            </div>
            <div class="panel-detail-body" id="panel-detail-body"></div>
        `;

        this.renderDetailBody(this.selectedContext, this.selectedSubContext);
    }

    renderDetailBody(context, sub) {
        const body = this.rightContent.querySelector('#panel-detail-body');
        if (!body) return;
        body.innerHTML = '';

        const selectedGameObject = this.engine.sceneManager.getSelectedGameObject();
        const selectedMesh = selectedGameObject ? selectedGameObject.mesh : null;

        if (context === 'scene') {
            body.appendChild(this.createField('Background Color', 'color', '#1a1a1a', (value) => {
                this.engine.sceneManager.scene.background = new THREE.Color(value);
            }));
            if (sub === 'grid') {
                body.appendChild(this.createToggle('Grid', true, (checked) => {
                    // placeholder: implementar toggle de grid
                }));
            }
            if (sub === 'lights') {
                body.appendChild(this.createToggle('Ambient Light', true));
                body.appendChild(this.createToggle('Directional Light', true));
            }
        }

        if (context === 'object') {
            if (sub === 'transform') {
                body.appendChild(this.createTransformPanel(selectedMesh));
            }
            if (sub === 'material') {
                body.appendChild(this.createField('Color', 'color', '#d18e5b', (value) => {
                    if (selectedMesh?.material) selectedMesh.material.color.set(value);
                }));
            }
            if (sub === 'physics') {
                body.appendChild(this.createToggle('Use Gravity', false));
                body.appendChild(this.createToggle('Collision Enabled', true));
            }
        }

        if (context === 'render') {
            body.appendChild(this.createSelect('Quality', ['low', 'medium', 'high'], 'medium'));
            body.appendChild(this.createToggle('Shadows', true));
            if (sub === 'post') {
                body.appendChild(this.createRange('Bloom', 0, 1, 0, 0.01));
            }
        }

        if (context === 'game') {
            if (sub === 'logic') {
                body.innerHTML = '<div class="panel-block">Logic bricks serão exibidos aqui.</div>';
            }
            if (sub === 'physics') {
                body.appendChild(this.createToggle('Physics Enabled', true));
                body.appendChild(this.createField('Simulation Rate', 'number', '60', null));
            }
        }

        if (context === 'shortcuts') {
            const shortcuts = this.shortcutManager.getShortcuts(sub === 'object-mode' ? 'object' : 'edit');
            const shortcutsDiv = document.createElement('div');
            shortcutsDiv.className = 'shortcuts-list';
            shortcuts.forEach(shortcut => {
                const item = document.createElement('div');
                item.className = 'shortcut-item';
                item.innerHTML = `
                    <div class="shortcut-name">${shortcut.name}</div>
                    <div class="shortcut-key">${this.formatKeyName(shortcut)}</div>
                `;
                shortcutsDiv.appendChild(item);
            });
            body.appendChild(shortcutsDiv);
        }

        if (context === 'preferences') {
            const prefs = this.preferencesManager.getPreferencesByCategory(sub);
            for (const [key, value] of Object.entries(prefs)) {
                const inputType = typeof value === 'boolean' ? 'checkbox' : (typeof value === 'number' ? 'number' : 'text');
                if (inputType === 'checkbox') {
                    body.appendChild(this.createToggle(this.formatPrefKey(key), value, (checked) => {
                        this.preferencesManager.set(key, checked);
                    }));
                } else {
                    body.appendChild(this.createField(this.formatPrefKey(key), inputType, String(value), (val) => {
                        const parsed = inputType === 'number' ? parseFloat(val) : val;
                        this.preferencesManager.set(key, parsed);
                    }));
                }
            }
        }

        if (context === 'addons') {
            const addonsDiv = document.createElement('div');
            addonsDiv.className = 'addons-list';

            if (sub === 'installed') {
                const addons = this.addonManager.getAllAddons();
                if (addons.length === 0) {
                    addonsDiv.innerHTML = '<div class="panel-empty">Nenhum addon instalado.</div>';
                } else {
                    addons.forEach(addon => {
                        const item = document.createElement('div');
                        item.className = 'addon-item';
                        item.innerHTML = `
                            <div class="addon-header">
                                <div class="addon-name">${addon.name}</div>
                                <input type="checkbox" ${addon.enabled ? 'checked' : ''} data-addon-id="${addon.id}">
                            </div>
                            <div class="addon-meta">${addon.version} • ${addon.author}</div>
                            <div class="addon-desc">${addon.description}</div>
                        `;
                        const checkbox = item.querySelector('input');
                        checkbox.addEventListener('change', () => {
                            if (checkbox.checked) {
                                this.addonManager.enableAddon(addon.id);
                            } else {
                                this.addonManager.disableAddon(addon.id);
                            }
                        });
                        addonsDiv.appendChild(item);
                    });
                }
            }

            body.appendChild(addonsDiv);
        }
    }

    createField(label, type, value, onChange) {
        const wrapper = document.createElement('div');
        wrapper.className = 'panel-field';
        wrapper.innerHTML = `
            <label>${label}</label>
            <input type="${type}" value="${value}" />
        `;
        const input = wrapper.querySelector('input');
        if (onChange && input) {
            input.addEventListener('input', (e) => onChange(e.target.value));
        }
        return wrapper;
    }

    createToggle(label, checked, onChange) {
        const wrapper = document.createElement('div');
        wrapper.className = 'panel-field panel-toggle';
        wrapper.innerHTML = `
            <label>${label}</label>
            <input type="checkbox" ${checked ? 'checked' : ''} />
        `;
        const input = wrapper.querySelector('input');
        if (onChange && input) {
            input.addEventListener('change', (e) => onChange(e.target.checked));
        }
        return wrapper;
    }

    createRange(label, min, max, value, step) {
        const wrapper = document.createElement('div');
        wrapper.className = 'panel-field';
        wrapper.innerHTML = `
            <label>${label}</label>
            <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" />
        `;
        return wrapper;
    }

    createSelect(label, options, selectedValue) {
        const wrapper = document.createElement('div');
        wrapper.className = 'panel-field';
        wrapper.innerHTML = `
            <label>${label}</label>
            <select></select>
        `;
        const select = wrapper.querySelector('select');
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            opt.selected = option === selectedValue;
            select.appendChild(opt);
        });
        return wrapper;
    }

    createTransformPanel(mesh) {
        const panel = document.createElement('div');
        panel.className = 'panel-block';
        if (!mesh) {
            panel.innerHTML = '<div class="panel-empty">Nenhum objeto selecionado.</div>';
            return panel;
        }

        panel.innerHTML = `
            <div class="panel-field"><label>Posição X</label><input type="number" step="0.01" value="${mesh.position.x.toFixed(2)}"></div>
            <div class="panel-field"><label>Posição Y</label><input type="number" step="0.01" value="${mesh.position.y.toFixed(2)}"></div>
            <div class="panel-field"><label>Posição Z</label><input type="number" step="0.01" value="${mesh.position.z.toFixed(2)}"></div>
        `;

        const inputs = panel.querySelectorAll('input');
        inputs.forEach((input, idx) => {
            input.addEventListener('input', () => {
                const values = Array.from(panel.querySelectorAll('input')).map(i => parseFloat(i.value) || 0);
                mesh.position.set(values[0], values[1], values[2]);
            });
        });

        return panel;
    }

    formatKeyName(shortcut) {
        let key = shortcut.key.toUpperCase();
        const modifiers = [];
        if (shortcut.ctrl) modifiers.push('Ctrl');
        if (shortcut.shift) modifiers.push('Shift');
        if (shortcut.alt) modifiers.push('Alt');
        if (modifiers.length > 0) {
            return modifiers.join('+') + '+' + key;
        }
        return key;
    }

    formatPrefKey(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
}
