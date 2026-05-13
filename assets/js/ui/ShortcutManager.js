/**
 * ShortcutManager - Gerencia atalhos de teclado com context awareness
 */
export class ShortcutManager {
    constructor(engine, interfaceSystem) {
        this.engine = engine;
        this.interface = interfaceSystem; // Agora usa BlenderInterface
        this.shortcuts = new Map();
        this.activeMode = 'object'; // 'object' ou 'edit'
        this.isTransforming = false;
        this.transformMode = null; // 'move', 'rotate', 'scale'

        this.init();
    }

    init() {
        this.registerObjectModeShortcuts();
        this.registerEditModeShortcuts();
        this.registerGlobalShortcuts();
        this.setupKeyboardListener();
    }

    registerObjectModeShortcuts() {
        // Transformações
        this.register('g', () => this.startTransform('move'), 'Move');
        this.register('r', () => this.startTransform('rotate'), 'Rotate');
        this.register('s', () => this.startTransform('scale'), 'Scale');

        // Seleção
        this.register('a', () => this.selectAll(), 'Select All');
        this.register('x', () => this.deleteSelected(), 'Delete');
        this.register('shift+d', () => this.duplicateSelected(), 'Duplicate');

        // Modo
        this.register('tab', () => this.toggleEditMode(), 'Edit Mode');

        // Objeto novo
        this.register('shift+a', () => this.addObject(), 'Add Object');
    }

    registerEditModeShortcuts() {
        // Modos de seleção
        this.register('1', () => this.setEditMode('vertex'), 'Vertex Mode', true);
        this.register('2', () => this.setEditMode('edge'), 'Edge Mode', true);
        this.register('3', () => this.setEditMode('face'), 'Face Mode', true);

        // Transformações
        this.register('g', () => this.startTransform('move'), 'Move', true);
        this.register('r', () => this.startTransform('rotate'), 'Rotate', true);
        this.register('s', () => this.startTransform('scale'), 'Scale', true);

        // Edição
        this.register('e', () => this.extrudeSelection(), 'Extrude', true);
        this.register('b', () => this.boxSelect(), 'Box Select', true);
        this.register('c', () => this.circleSelect(), 'Circle Select', true);

        // Modo Object
        this.register('tab', () => this.toggleEditMode(), 'Object Mode', true);
    }

    registerGlobalShortcuts() {
        // 'N' - Toggle properties panel (context-aware)
        this.register('n', () => this.toggleNMenu(), 'Toggle N Menu');

        // 'T' - Toggle toolbar (context-aware)
        this.register('t', () => this.toggleTMenu(), 'Toggle T Menu');

        // Undo/Redo
        this.register('ctrl+z', () => this.undo(), 'Undo');
        this.register('ctrl+shift+z', () => this.redo(), 'Redo');

        // Save
        this.register('ctrl+s', () => this.saveScene(), 'Save Scene');
    }

    register(keys, callback, description, editModeOnly = false) {
        this.shortcuts.set(keys, {
            callback,
            description,
            editModeOnly
        });
    }

    setupKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            // Ignora quando digitando em input
            if (e.target.matches('input, textarea, [contenteditable]')) return;

            const keys = this.getKeyCombo(e);
            const shortcut = this.shortcuts.get(keys);

            if (!shortcut) return;

            // Verifica se é shortcut de edit mode e estamos em object mode
            if (shortcut.editModeOnly && this.activeMode !== 'edit') return;

            e.preventDefault();
            shortcut.callback();
        });
    }

    getKeyCombo(event) {
        let combo = '';
        if (event.ctrlKey) combo += 'ctrl+';
        if (event.shiftKey) combo += 'shift+';
        if (event.altKey) combo += 'alt+';
        combo += event.key.toLowerCase();
        return combo;
    }

    // ===== TRANSFORMAÇÕES =====
    startTransform(mode) {
        const selected = this.engine.sceneManager.getSelectedGameObject();
        if (!selected) return;

        this.transformMode = mode;
        this.isTransforming = true;
        
        console.log(`[Transform] Starting ${mode} on`, selected.name);
        
        // Ativa o gizmo apropriado
        if (this.engine.editorManager) {
            this.engine.editorManager.setTransformMode(mode);
        }

        // Listener de mouse para completar transformação
        const onMouseMove = (e) => {
            if (!this.isTransforming) return;
            // A transformação será feita pelo gizmo
        };

        const onMouseUp = () => {
            this.isTransforming = false;
            this.transformMode = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    // ===== SELEÇÃO =====
    selectAll() {
        const gameObjects = this.engine.sceneManager.getGameObjects();
        gameObjects.forEach(obj => {
            this.engine.sceneManager.selectGameObject(obj);
        });
        console.log(`[Selection] Selected ${gameObjects.length} objects`);
    }

    deleteSelected() {
        const selected = this.engine.sceneManager.getSelectedGameObject();
        if (!selected) return;

        this.engine.sceneManager.removeGameObject(selected);
        console.log(`[Delete] Removed`, selected.name);
    }

    duplicateSelected() {
        const selected = this.engine.sceneManager.getSelectedGameObject();
        if (!selected) return;

        // Cria clone
        const cloned = selected.clone();
        cloned.position.x += 2; // Offset pequeno
        this.engine.sceneManager.addGameObject(cloned);
        this.engine.sceneManager.selectGameObject(cloned);
        console.log(`[Duplicate] Cloned`, selected.name);
    }

    // ===== MODO EDIÇÃO =====
    toggleEditMode() {
        if (this.activeMode === 'object') {
            this.activeMode = 'edit';
            console.log('[Mode] Entered EDIT MODE');
            if (this.engine.editorManager) {
                this.engine.editorManager.switchMode('edit');
            }
        } else {
            this.activeMode = 'object';
            console.log('[Mode] Entered OBJECT MODE');
            if (this.engine.editorManager) {
                this.engine.editorManager.switchMode('object');
            }
        }
    }

    setEditMode(mode) {
        if (this.activeMode !== 'edit') return;
        console.log(`[Edit] Set mode to ${mode}`);
        // Será implementado quando EditMode for mais desenvolvido
    }

    extrudeSelection() {
        console.log('[Extrude] Not yet implemented');
    }

    boxSelect() {
        console.log('[Box Select] Not yet implemented');
    }

    circleSelect() {
        console.log('[Circle Select] Not yet implemented');
    }

    // ===== ADIÇÃO DE OBJETOS =====
    addObject() {
        const types = ['cube', 'sphere', 'cylinder', 'cone'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Cria primitiva
        const go = this.engine.sceneManager.createPrimitive(type);
        go.position.y = 2;
        this.engine.sceneManager.selectGameObject(go);
        console.log(`[Add] Created ${type}`);
    }

    // ===== MENUS CONTEXT-AWARE (N e T) =====
    toggleNMenu() {
        const context = this.interface.getActiveContext();
        console.log(`[N-Menu] Toggled in context: ${context || 'none'}`);

        // Se está em 3D View, abre Properties painel
        if (context === '3d') {
            // No BlenderInterface, Properties é uma área separada
            // Podemos ativar a aba apropriada no painel Properties
            this.activatePropertiesTab('Object');
        }
        // Se está em Properties, fecha ou alterna
        else if (context === 'properties') {
            // Pode minimizar ou fechar
        }
    }

    toggleTMenu() {
        const context = this.interface.getActiveContext();
        console.log(`[T-Menu] Toggled in context: ${context || 'none'}`);

        // Se está em 3D View, mostra toolbar de transformação
        if (context === '3d') {
            console.log('[T-Menu] Would show transform toolbar');
            // Implementar toolbar de transformação
        }
    }

    // ===== ARQUIVO =====
    saveScene() {
        const sceneName = document.getElementById('scene-name')?.value || 'Scene';
        const gameObjects = this.engine.sceneManager.getGameObjects();
        
        const data = {
            name: sceneName,
            objects: gameObjects.map(obj => ({
                name: obj.name,
                position: obj.position,
                rotation: obj.rotation,
                scale: obj.scale,
                type: obj.type || 'generic'
            }))
        };

        localStorage.setItem(`wave_scene_${sceneName}`, JSON.stringify(data));
        console.log(`[Save] Scene saved as "${sceneName}"`);
    }

    undo() {
        console.log('[Undo] Not yet implemented');
    }

    redo() {
        console.log('[Redo] Not yet implemented');
    }

    // ===== GETTERS =====
    getMode() {
        return this.activeMode;
    }

    isInObjectMode() {
        return this.activeMode === 'object';
    }

    isInEditMode() {
        return this.activeMode === 'edit';
    }

    // ===== MÉTODOS PARA BLENDER INTERFACE =====
    activatePropertiesTab(tabName) {
        // Encontra o painel Properties e ativa a aba especificada
        const propertiesArea = this.findAreaByName('Properties');
        if (propertiesArea) {
            const tab = propertiesArea.tabs.find(t => t.name === tabName);
            if (tab) {
                propertiesArea.activeTab = tab;
                console.log(`[Properties] Activated tab: ${tabName}`);
            }
        }
    }

    findAreaByName(name) {
        if (!this.interface || !this.interface.windows) return null;

        for (const window of this.interface.windows) {
            for (const area of window.areas) {
                if (area.name === name) {
                    return area;
                }
            }
        }
        return null;
    }
}
