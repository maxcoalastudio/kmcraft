const apiUrl = '/layout_api.php';

class LayoutApp {
    constructor() {
        this.apiUrl = apiUrl;
        this.isReady = false;
        this.windowManager = null;
    }

    init() {
        // Esperar o WindowManager ser carregado
        const waitForWindowManager = () => {
            if (window.windowManager) {
                this.windowManager = window.windowManager;
                this.setupPanelInteractions();
            } else {
                setTimeout(waitForWindowManager, 100);
            }
        };
        waitForWindowManager();

        this.activateInitialTabs();
        this.attachTabListeners();
        this.attachMenuListeners();
        this.attachPanelContext();
        this.activateDefaultPanel();
        this.attachSaveOnUnload();
        this.isReady = true;
    }

    setupPanelInteractions() {
        // Adicionar listeners para clicar em painéis para ativá-los
        document.querySelectorAll('.layout-grid-cell').forEach((cell) => {
            cell.addEventListener('click', (event) => {
                const panelId = cell.dataset.panel;
                if (panelId && !event.target.closest('.layout-tab, .blender-area-header')) {
                    this.setActivePanel(panelId);
                }
            });
        });
    }

    activateInitialTabs() {
        document.querySelectorAll('[data-panel]').forEach((panel) => {
            const activeTab = panel.dataset.activeTab;
            if (!activeTab) return;

            const tab = panel.querySelector(`.layout-tab[data-tab="${activeTab}"]`);
            if (tab) {
                tab.classList.add('active');
            }

            const content = panel.querySelector('.blender-area-content');
            if (content) {
                content.textContent = this.getPanelContent(panel.dataset.panel, activeTab);
            }
        });
    }

    attachTabListeners() {
        document.querySelectorAll('.layout-tab').forEach((button) => {
            button.addEventListener('click', (event) => {
                const target = event.currentTarget;
                const panel = target.closest('[data-panel]');
                if (!panel) return;

                const panelId = panel.dataset.panel;
                const tabName = target.dataset.tab;

                this.activateTab(panelId, tabName);
                this.saveLayoutState();
            });
        });
    }

    attachMenuListeners() {
        const menuDefinitions = {
            File: [
                { label: 'New', action: () => this.showStatus('New scene created') },
                { label: 'Open', action: () => this.showStatus('Open scene selected') },
                { label: 'Save', action: () => this.showStatus('Scene saved') },
                { label: 'Export', action: () => this.showStatus('Export dialog opened') }
            ],
            Edit: [
                { label: 'Undo', action: () => this.showStatus('Undo action executed') },
                { label: 'Redo', action: () => this.showStatus('Redo action executed') },
                { label: 'Duplicate', action: () => this.showStatus('Duplicate created') },
                { label: 'Delete', action: () => this.showStatus('Delete action executed') }
            ],
            Game: [
                { label: 'Play', action: () => this.showStatus('Game mode: Play') },
                { label: 'Pause', action: () => this.showStatus('Game mode: Pause') },
                { label: 'Stop', action: () => this.showStatus('Game mode: Stop') }
            ],
            Window: [
                { label: 'Toggle Outliner', action: () => this.togglePanelVisibility('outliner') },
                { label: 'Toggle Properties', action: () => this.togglePanelVisibility('properties') },
                { label: 'Toggle Timeline', action: () => this.togglePanelVisibility('timeline') }
            ],
            Help: [
                { label: 'About', action: () => this.showStatus('KM Craft Blender-style interface') },
                { label: 'Documentation', action: () => this.showStatus('Documentation opened') }
            ]
        };

        document.querySelectorAll('.blender-topbar .menu-item').forEach((menuItem) => {
            const menuName = menuItem.dataset.menu;
            menuItem.addEventListener('click', (event) => {
                event.stopPropagation();
                document.querySelectorAll('.blender-topbar .menu-item').forEach((item) => item.classList.remove('active'));
                menuItem.classList.add('active');
                this.closeAllMenuDropdowns();
                this.openMenuDropdown(menuItem, menuDefinitions[menuName] || []);
            });
        });

        document.body.addEventListener('click', () => {
            this.closeAllMenuDropdowns();
            document.querySelectorAll('.blender-topbar .menu-item').forEach((item) => item.classList.remove('active'));
        });
    }

    openMenuDropdown(menuItem, options) {
        const dropdown = document.createElement('div');
        dropdown.className = 'menu-dropdown';
        dropdown.dataset.menuDropdown = menuItem.dataset.menu;
        options.forEach((option) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'menu-dropdown-item';
            button.textContent = option.label;
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                option.action();
                this.closeAllMenuDropdowns();
                this.saveLayoutState();
            });
            dropdown.appendChild(button);
        });

        const rect = menuItem.getBoundingClientRect();
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.top = `${rect.bottom + window.scrollY}px`;
        document.body.appendChild(dropdown);
    }

    closeAllMenuDropdowns() {
        document.querySelectorAll('[data-menu-dropdown]').forEach((dropdown) => dropdown.remove());
    }

    togglePanelVisibility(panelId) {
        const panel = document.querySelector(`[data-panel="${panelId}"]`);
        if (!panel) return;
        panel.classList.toggle('hidden');
        this.showStatus(`${panelId.charAt(0).toUpperCase() + panelId.slice(1)} toggled ${panel.classList.contains('hidden') ? 'off' : 'on'}`);
        this.saveLayoutState();
    }

    attachSaveOnUnload() {
        window.addEventListener('beforeunload', () => {
            if (this.isReady) {
                this.saveLayoutState();
            }
        });
    }

    activateTab(panelId, tabName) {
        const panel = document.querySelector(`[data-panel="${panelId}"]`);
        if (!panel) return;

        panel.querySelectorAll('.layout-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        const content = panel.querySelector('.blender-area-content');
        if (content) {
            content.textContent = this.getPanelContent(panelId, tabName);
        }
    }

    getPanelContent(panelId, tabName) {
        const contentMap = {
            view3d: {
                View: 'Área 3D para visualização da cena. Use o painel Properties para ajustar objetos.',
                Animation: 'Modo de animação com keyframes e timeline.',
                Scripting: 'Área para scripts e automações.'
            },
            outliner: {
                'All Scenes': 'Exibe todas as cenas do projeto.',
                'Current File': 'Exibe o arquivo atualmente carregado.',
                Scenes: 'Organiza as cenas e coleções.'
            },
            properties: {
                Tool: 'Propriedades da ferramenta ativa.',
                Render: 'Opções de renderização e saída.',
                Output: 'Configurações de arquivo de saída.',
                'View Layer': 'Configurações de renderização por camada.',
                Scene: 'Configurações globais da cena.',
                World: 'Configurações de ambiente e iluminação.',
                Object: 'Propriedades do objeto selecionado.',
                Modifier: 'Modificadores aplicados ao objeto.',
                Material: 'Configurações de material e shaders.',
                Texture: 'Controle de texturas e UVs.'
            },
            timeline: {
                'Dope Sheet': 'Editor de Dope Sheet para animação.',
                'Graph Editor': 'Editor de curvas de animação.',
                Drivers: 'Editor de drivers e expressões.'
            }
        };

        return contentMap[panelId]?.[tabName] || 'Conteúdo desta aba.';
    }

    attachPanelContext() {
        document.querySelectorAll('.blender-area').forEach((panel) => {
            panel.addEventListener('click', () => {
                this.setActivePanel(panel.dataset.panel);
            });
        });
    }

    setActivePanel(panelId) {
        document.querySelectorAll('.blender-area').forEach((panel) => {
            panel.classList.toggle('active-panel', panel.dataset.panel === panelId);
        });

        const title = this.getPanelTitle(panelId);
        this.showStatus(`Context: ${title}`);
    }

    getPanelTitle(panelId) {
        const panel = document.querySelector(`[data-panel="${panelId}"]`);
        return panel ? panel.querySelector('.blender-area-title')?.textContent || panelId : panelId;
    }

    showStatus(message) {
        const status = document.getElementById('status-coords');
        if (status) {
            status.textContent = message;
        }
    }

    activateDefaultPanel() {
        const firstPanel = document.querySelector('.blender-area:not(.hidden)');
        if (firstPanel) {
            this.setActivePanel(firstPanel.dataset.panel);
        }
    }

    getCurrentLayoutStateFromDOM() {
        const panels = [];
        document.querySelectorAll('[data-panel]').forEach((panel) => {
            const panelId = panel.dataset.panel;
            const activeTab = panel.querySelector('.layout-tab.active')?.dataset.tab || '';
            panels.push({
                id: panelId,
                activeTab,
                visible: !panel.classList.contains('hidden')
            });
        });

        return {
            version: 1,
            theme: 'dark',
            panels
        };
    }

    async saveLayoutState() {
        const payload = this.getCurrentLayoutStateFromDOM();
        try {
            await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.warn('Falha ao salvar layout:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new LayoutApp();
    app.init();
});
