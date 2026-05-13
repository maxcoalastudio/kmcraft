/**
 * Blender-Style Interface System for Web
 * Sistema de Interface Estilo Blender para Web
 *
 * Componentes principais:
 * - GHOST: Gerenciamento de janelas, contexto WebGL, entrada de dispositivos
 * - WindowManager: Gerencia janelas, eventos, mapas de teclado
 * - Interface: Desenha botões, layouts, menus
 * - Theme: Sistema de temas (Dark/Light)
 */

class BlenderInterface {
    constructor(container, engine) {
        this.container = container;
        this.engine = engine;
        this.canvas = null;
        this.gl = null;

        // Componentes principais
        this.ghost = new GHOST(this);
        this.windowManager = new WindowManager(this);
        this.interface = new Interface(this);
        this.theme = new Theme(this);

        // Estado da interface
        this.windows = [];
        this.activeWindow = null;
        this.isInitialized = false;

        // Configurações
        this.settings = {
            theme: 'dark', // 'dark' ou 'light'
            fontSize: 12,
            uiScale: 1.0,
            showTooltips: true
        };

        this.init();
    }

    async init() {
        try {
            // Inicializar GHOST (WebGL context)
            await this.ghost.init();

            // Inicializar Window Manager
            this.windowManager.init();

            // Inicializar Interface
            this.interface.init();

            // Carregar tema
            this.theme.loadTheme(this.settings.theme);

            // Criar layout padrão
            this.createDefaultLayout();

            // Iniciar loop de renderização
            this.startRenderLoop();

            this.isInitialized = true;
            console.log('Blender Interface initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Blender Interface:', error);
        }
    }

    createDefaultLayout() {
        // Layout padrão estilo Blender
        const mainWindow = this.windowManager.createWindow('Main', {
            x: 0, y: 0,
            width: this.canvas.width,
            height: this.canvas.height,
            type: 'main'
        });

        // 3D View (área principal)
        const view3D = mainWindow.createArea('3D View', {
            x: 0, y: 30, // abaixo da topbar
            width: Math.floor(this.canvas.width * 0.7),
            height: this.canvas.height - 30
        });

        // Outliner (painel direito superior)
        const outliner = mainWindow.createArea('Outliner', {
            x: Math.floor(this.canvas.width * 0.7),
            y: 30,
            width: Math.floor(this.canvas.width * 0.3),
            height: Math.floor((this.canvas.height - 30) * 0.5)
        });

        // Properties (painel direito inferior)
        const properties = mainWindow.createArea('Properties', {
            x: Math.floor(this.canvas.width * 0.7),
            y: 30 + Math.floor((this.canvas.height - 30) * 0.5),
            width: Math.floor(this.canvas.width * 0.3),
            height: Math.floor((this.canvas.height - 30) * 0.5)
        });

        // Timeline (barra inferior)
        const timeline = mainWindow.createArea('Timeline', {
            x: 0,
            y: this.canvas.height - 200,
            width: Math.floor(this.canvas.width * 0.7),
            height: 200
        });

        // Status Bar (barra inferior)
        const statusBar = mainWindow.createArea('Status Bar', {
            x: 0,
            y: this.canvas.height - 30,
            width: this.canvas.width,
            height: 30
        });

        // Top Bar (menu superior)
        const topBar = mainWindow.createArea('Top Bar', {
            x: 0, y: 0,
            width: this.canvas.width,
            height: 30
        });

        // Configurar abas para cada área
        this.setupAreaTabs(view3D);
        this.setupAreaTabs(outliner);
        this.setupAreaTabs(properties);
        this.setupAreaTabs(timeline);
    }

    setupAreaTabs(area) {
        // Adicionar abas baseado no tipo da área
        switch(area.name) {
            case '3D View':
                area.addTab('View', '3d_view');
                area.addTab('Animation', 'animation');
                area.addTab('Scripting', 'scripting');
                break;
            case 'Outliner':
                area.addTab('All Scenes', 'all_scenes');
                area.addTab('Current File', 'current_file');
                area.addTab('Scenes', 'scenes');
                break;
            case 'Properties':
                area.addTab('Tool', 'tool');
                area.addTab('Render', 'render');
                area.addTab('Output', 'output');
                area.addTab('View Layer', 'view_layer');
                area.addTab('Scene', 'scene');
                area.addTab('World', 'world');
                area.addTab('Object', 'object');
                area.addTab('Modifier', 'modifier');
                area.addTab('Material', 'material');
                area.addTab('Texture', 'texture');
                break;
            case 'Timeline':
                area.addTab('Dope Sheet', 'dope_sheet');
                area.addTab('Graph Editor', 'graph_editor');
                area.addTab('Drivers', 'drivers');
                break;
        }
    }

    startRenderLoop() {
        const render = () => {
            if (this.isInitialized) {
                this.render();
            }
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    render() {
        // Limpar canvas
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Renderizar todas as janelas
        this.windowManager.render();

        // Renderizar interface
        this.interface.render();
    }

    handleEvent(event) {
        // Delegar eventos para o Window Manager
        this.windowManager.handleEvent(event);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);

        // Atualizar layout
        this.windowManager.resize(width, height);
    }

    setTheme(themeName) {
        this.settings.theme = themeName;
        this.theme.loadTheme(themeName);
    }

    getTheme() {
        return this.theme.currentTheme;
    }
}

/**
 * GHOST - Gerenciamento de contexto WebGL e entrada
 */
class GHOST {
    constructor(interfaceSystem) {
        this.interface = interfaceSystem;
        this.canvas = null;
        this.gl = null;
    }

    async init() {
        // Criar canvas WebGL
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        this.interface.container.appendChild(this.canvas);

        // Inicializar WebGL
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        // Configurar WebGL
        this.gl.clearColor(0.2, 0.2, 0.2, 1.0);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // Configurar eventos
        this.setupEventListeners();

        this.interface.canvas = this.canvas;
        this.interface.gl = this.gl;
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.interface.handleEvent(e));
        this.canvas.addEventListener('mousemove', (e) => this.interface.handleEvent(e));
        this.canvas.addEventListener('mouseup', (e) => this.interface.handleEvent(e));
        this.canvas.addEventListener('wheel', (e) => this.interface.handleEvent(e));

        // Keyboard events
        document.addEventListener('keydown', (e) => this.interface.handleEvent(e));
        document.addEventListener('keyup', (e) => this.interface.handleEvent(e));

        // Window resize
        window.addEventListener('resize', () => {
            this.interface.resize(window.innerWidth, window.innerHeight);
        });
    }
}

/**
 * WindowManager - Gerencia janelas, eventos e layout
 */
class WindowManager {
    constructor(interfaceSystem) {
        this.interface = interfaceSystem;
        this.windows = [];
        this.activeWindow = null;
        this.eventHandlers = new Map();
    }

    init() {
        // Registrar event handlers
        this.registerEventHandlers();
    }

    createWindow(name, config) {
        const window = new BlenderWindow(this.interface, name, config);
        this.windows.push(window);

        if (!this.activeWindow) {
            this.activeWindow = window;
        }

        return window;
    }

    registerEventHandlers() {
        // Mouse events
        this.eventHandlers.set('mousedown', this.handleMouseDown.bind(this));
        this.eventHandlers.set('mousemove', this.handleMouseMove.bind(this));
        this.eventHandlers.set('mouseup', this.handleMouseUp.bind(this));

        // Keyboard events
        this.eventHandlers.set('keydown', this.handleKeyDown.bind(this));
        this.eventHandlers.set('keyup', this.handleKeyUp.bind(this));
    }

    handleEvent(event) {
        const handler = this.eventHandlers.get(event.type);
        if (handler) {
            handler(event);
        }
    }

    handleMouseDown(event) {
        // Encontrar janela/area clicada
        const rect = this.interface.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Verificar se clicou em alguma área
        for (const window of this.windows) {
            const area = window.getAreaAt(x, y);
            if (area) {
                this.activeWindow = window;
                area.handleMouseDown(x, y, event);
                break;
            }
        }
    }

    handleMouseMove(event) {
        const rect = this.interface.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.activeWindow) {
            this.activeWindow.handleMouseMove(x, y, event);
        }
    }

    handleMouseUp(event) {
        if (this.activeWindow) {
            this.activeWindow.handleMouseUp(event);
        }
    }

    handleKeyDown(event) {
        // Atalhos globais
        switch(event.key.toLowerCase()) {
            case 'n':
                // Toggle Properties panel
                this.togglePanel('Properties');
                break;
            case 't':
                // Toggle Toolbar
                this.toggleToolbar();
                break;
            case 'f11':
                // Toggle fullscreen
                this.toggleFullscreen();
                break;
        }

        if (this.activeWindow) {
            this.activeWindow.handleKeyDown(event);
        }
    }

    handleKeyUp(event) {
        if (this.activeWindow) {
            this.activeWindow.handleKeyUp(event);
        }
    }

    togglePanel(panelName) {
        // Implementar toggle de painéis
        console.log('Toggle panel:', panelName);
    }

    toggleToolbar() {
        // Implementar toggle da toolbar
        console.log('Toggle toolbar');
    }

    toggleFullscreen() {
        // Implementar fullscreen
        console.log('Toggle fullscreen');
    }

    render() {
        for (const window of this.windows) {
            window.render();
        }
    }

    resize(width, height) {
        for (const window of this.windows) {
            window.resize(width, height);
        }
    }
}

/**
 * BlenderWindow - Representa uma janela do Blender
 */
class BlenderWindow {
    constructor(interfaceSystem, name, config) {
        this.interface = interfaceSystem;
        this.name = name;
        this.config = config;
        this.areas = [];
        this.activeArea = null;
    }

    createArea(name, config) {
        const area = new BlenderArea(this.interface, this, name, config);
        this.areas.push(area);

        if (!this.activeArea) {
            this.activeArea = area;
        }

        return area;
    }

    getAreaAt(x, y) {
        for (const area of this.areas) {
            if (area.contains(x, y)) {
                return area;
            }
        }
        return null;
    }

    handleMouseDown(x, y, event) {
        const area = this.getAreaAt(x, y);
        if (area) {
            this.activeArea = area;
            area.handleMouseDown(x, y, event);
        }
    }

    handleMouseMove(x, y, event) {
        if (this.activeArea) {
            this.activeArea.handleMouseMove(x, y, event);
        }
    }

    handleMouseUp(event) {
        if (this.activeArea) {
            this.activeArea.handleMouseUp(event);
        }
    }

    handleKeyDown(event) {
        if (this.activeArea) {
            this.activeArea.handleKeyDown(event);
        }
    }

    handleKeyUp(event) {
        if (this.activeArea) {
            this.activeArea.handleKeyUp(event);
        }
    }

    render() {
        for (const area of this.areas) {
            area.render();
        }
    }

    resize(width, height) {
        // Recalcular posições das áreas baseado no novo tamanho
        this.recalculateLayout(width, height);
    }

    recalculateLayout(width, height) {
        // Layout proporcional
        for (const area of this.areas) {
            switch(area.name) {
                case '3D View':
                    area.config.width = Math.floor(width * 0.7);
                    area.config.height = height - 30;
                    break;
                case 'Outliner':
                    area.config.x = Math.floor(width * 0.7);
                    area.config.width = Math.floor(width * 0.3);
                    area.config.height = Math.floor((height - 30) * 0.5);
                    break;
                case 'Properties':
                    area.config.x = Math.floor(width * 0.7);
                    area.config.y = 30 + Math.floor((height - 30) * 0.5);
                    area.config.width = Math.floor(width * 0.3);
                    area.config.height = Math.floor((height - 30) * 0.5);
                    break;
                case 'Timeline':
                    area.config.width = Math.floor(width * 0.7);
                    area.config.height = 200;
                    area.config.y = height - 200;
                    break;
                case 'Status Bar':
                    area.config.width = width;
                    area.config.height = 30;
                    area.config.y = height - 30;
                    break;
                case 'Top Bar':
                    area.config.width = width;
                    area.config.height = 30;
                    break;
            }
        }
    }
}

/**
 * BlenderArea - Representa uma área dentro de uma janela
 */
class BlenderArea {
    constructor(interfaceSystem, window, name, config) {
        this.interface = interfaceSystem;
        this.window = window;
        this.name = name;
        this.config = config;
        this.tabs = [];
        this.activeTab = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
    }

    addTab(name, type) {
        const tab = new BlenderTab(this.interface, this, name, type);
        this.tabs.push(tab);

        if (!this.activeTab) {
            this.activeTab = tab;
        }

        return tab;
    }

    contains(x, y) {
        return x >= this.config.x && x <= this.config.x + this.config.width &&
               y >= this.config.y && y <= this.config.y + this.config.height;
    }

    handleMouseDown(x, y, event) {
        // Verificar se clicou em uma aba
        for (const tab of this.tabs) {
            if (tab.contains(x, y)) {
                this.activeTab = tab;
                return;
            }
        }

        // Verificar se clicou na área de conteúdo
        if (this.contains(x, y)) {
            // Delegar para o conteúdo da aba ativa
            if (this.activeTab) {
                this.activeTab.handleMouseDown(x, y, event);
            }
        }
    }

    handleMouseMove(x, y, event) {
        if (this.activeTab) {
            this.activeTab.handleMouseMove(x, y, event);
        }
    }

    handleMouseUp(event) {
        if (this.activeTab) {
            this.activeTab.handleMouseUp(event);
        }
    }

    handleKeyDown(event) {
        if (this.activeTab) {
            this.activeTab.handleKeyDown(event);
        }
    }

    handleKeyUp(event) {
        if (this.activeTab) {
            this.activeTab.handleKeyUp(event);
        }
    }

    render() {
        const gl = this.interface.gl;

        // Renderizar fundo da área
        this.renderBackground();

        // Renderizar header com abas
        this.renderHeader();

        // Renderizar conteúdo da aba ativa
        if (this.activeTab) {
            this.activeTab.render();
        }

        // Renderizar bordas
        this.renderBorders();
    }

    renderBackground() {
        const gl = this.interface.gl;
        const theme = this.interface.getTheme();

        // Usar shader para desenhar retângulo
        // (Implementação simplificada - em produção usaria shaders)
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(this.config.x, this.interface.canvas.height - this.config.y - this.config.height,
                  this.config.width, this.config.height);

        gl.clearColor(theme.panel.background[0], theme.panel.background[1],
                     theme.panel.background[2], theme.panel.background[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.disable(gl.SCISSOR_TEST);
    }

    renderHeader() {
        const gl = this.interface.gl;
        const theme = this.interface.getTheme();

        // Fundo do header
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(this.config.x, this.interface.canvas.height - this.config.y - 20,
                  this.config.width, 20);

        gl.clearColor(theme.header.background[0], theme.header.background[1],
                     theme.header.background[2], theme.header.background[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.disable(gl.SCISSOR_TEST);

        // Renderizar abas
        let tabX = this.config.x + 5;
        for (const tab of this.tabs) {
            tabX = tab.render(tabX, this.config.y);
        }

        // Renderizar nome da área
        this.renderText(this.name, this.config.x + this.config.width - 100, this.config.y + 5,
                       theme.text.primary);
    }

    renderBorders() {
        const gl = this.interface.gl;
        const theme = this.interface.getTheme();

        // Bordas (implementação simplificada)
        // Em produção, usaria linhas ou geometria
    }

    renderText(text, x, y, color) {
        // Implementação simplificada de renderização de texto
        // Em produção, usaria fontes bitmap ou canvas 2D overlay
        console.log('Render text:', text, 'at', x, y);
    }
}

/**
 * BlenderTab - Representa uma aba dentro de uma área
 */
class BlenderTab {
    constructor(interfaceSystem, area, name, type) {
        this.interface = interfaceSystem;
        this.area = area;
        this.name = name;
        this.type = type;
        this.width = 80; // Largura da aba
        this.height = 20;
    }

    contains(x, y) {
        const areaY = this.area.config.y;
        return x >= this.x && x <= this.x + this.width &&
               y >= areaY && y <= areaY + this.height;
    }

    handleMouseDown(x, y, event) {
        // Aba foi clicada - já foi ativada na área
    }

    handleMouseMove(x, y, event) {
        // Hover effects, etc.
    }

    handleMouseUp(event) {
        // Implementar drag de abas, etc.
    }

    handleKeyDown(event) {
        // Atalhos específicos da aba
    }

    handleKeyUp(event) {
        // ...
    }

    render(startX, areaY) {
        this.x = startX;
        const gl = this.interface.gl;
        const theme = this.interface.getTheme();
        const isActive = this.area.activeTab === this;

        // Cor da aba baseado no estado
        const bgColor = isActive ? theme.tab.active : theme.tab.inactive;

        // Renderizar fundo da aba
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(this.x, this.interface.canvas.height - areaY - this.height,
                  this.width, this.height);

        gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.disable(gl.SCISSOR_TEST);

        // Renderizar texto da aba
        this.area.renderText(this.name, this.x + 5, areaY + 5,
                           isActive ? theme.text.primary : theme.text.secondary);

        return this.x + this.width + 2; // Retornar próxima posição X
    }
}

/**
 * Interface - Sistema de renderização de UI elements
 */
class Interface {
    constructor(interfaceSystem) {
        this.interface = interfaceSystem;
        this.elements = [];
    }

    init() {
        // Inicializar shaders, texturas, etc.
        this.initShaders();
        this.initTextures();
    }

    initShaders() {
        // Vertex shader para UI elements
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            uniform vec2 u_resolution;
            varying vec2 v_texCoord;

            void main() {
                vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                v_texCoord = a_texCoord;
            }
        `;

        // Fragment shader para UI elements
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec4 u_color;
            uniform sampler2D u_texture;
            varying vec2 v_texCoord;

            void main() {
                gl_FragColor = texture2D(u_texture, v_texCoord) * u_color;
            }
        `;

        const gl = this.interface.gl;
        this.vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        this.fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(gl, this.vertexShader, this.fragmentShader);
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Error linking program:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    initTextures() {
        // Inicializar texturas para ícones, etc.
        // (Implementação simplificada)
    }

    render() {
        // Renderizar elementos da interface
        for (const element of this.elements) {
            element.render();
        }
    }

    addElement(element) {
        this.elements.push(element);
    }

    removeElement(element) {
        const index = this.elements.indexOf(element);
        if (index > -1) {
            this.elements.splice(index, 1);
        }
    }
}

/**
 * Theme - Sistema de temas visuais
 */
class Theme {
    constructor(interfaceSystem) {
        this.interface = interfaceSystem;
        this.themes = {};
        this.currentTheme = null;
        this.initThemes();
    }

    initThemes() {
        // Tema Dark (padrão do Blender)
        this.themes.dark = {
            panel: {
                background: [0.22, 0.22, 0.22, 1.0],
                border: [0.3, 0.3, 0.3, 1.0]
            },
            header: {
                background: [0.25, 0.25, 0.25, 1.0]
            },
            tab: {
                active: [0.35, 0.35, 0.35, 1.0],
                inactive: [0.28, 0.28, 0.28, 1.0],
                hover: [0.32, 0.32, 0.32, 1.0]
            },
            text: {
                primary: [0.9, 0.9, 0.9, 1.0],
                secondary: [0.7, 0.7, 0.7, 1.0],
                disabled: [0.5, 0.5, 0.5, 1.0]
            },
            button: {
                normal: [0.3, 0.3, 0.3, 1.0],
                hover: [0.35, 0.35, 0.35, 1.0],
                pressed: [0.25, 0.25, 0.25, 1.0]
            },
            accent: [0.6, 0.4, 0.2, 1.0] // Laranja do Blender
        };

        // Tema Light
        this.themes.light = {
            panel: {
                background: [0.8, 0.8, 0.8, 1.0],
                border: [0.6, 0.6, 0.6, 1.0]
            },
            header: {
                background: [0.75, 0.75, 0.75, 1.0]
            },
            tab: {
                active: [0.9, 0.9, 0.9, 1.0],
                inactive: [0.85, 0.85, 0.85, 1.0],
                hover: [0.87, 0.87, 0.87, 1.0]
            },
            text: {
                primary: [0.1, 0.1, 0.1, 1.0],
                secondary: [0.3, 0.3, 0.3, 1.0],
                disabled: [0.5, 0.5, 0.5, 1.0]
            },
            button: {
                normal: [0.7, 0.7, 0.7, 1.0],
                hover: [0.75, 0.75, 0.75, 1.0],
                pressed: [0.65, 0.65, 0.65, 1.0]
            },
            accent: [0.2, 0.4, 0.8, 1.0] // Azul para tema light
        };
    }

    loadTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = this.themes[themeName];
            console.log('Loaded theme:', themeName);
        } else {
            console.warn('Theme not found:', themeName);
        }
    }

    getColor(path) {
        const parts = path.split('.');
        let current = this.currentTheme;

        for (const part of parts) {
            current = current[part];
            if (!current) return [0, 0, 0, 1]; // Cor padrão
        }

        return current;
    }
}

// Exportar classes para módulos ES
export { BlenderInterface };

// Exportar também no escopo global para compatibilidade
window.BlenderInterface = BlenderInterface;
window.GHOST = GHOST;
window.WindowManager = WindowManager;
window.Interface = Interface;
window.Theme = Theme;