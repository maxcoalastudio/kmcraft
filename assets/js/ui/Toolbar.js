export class Toolbar {
    constructor(container, callbacks) {
        this.container = container;
        this.callbacks = callbacks;
        this.toolbar = null;
        
        this.init();
    }
    
    init() {
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'top-toolbar';
        this.toolbar.style.cssText = `
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
        `;
        
        this.toolbar.innerHTML = `
            <button id="tool-move" class="toolbar-btn" title="Mover (G)" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; color: #aaa;">📍</button>
            <button id="tool-rotate" class="toolbar-btn" title="Rotacionar (R)" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; color: #aaa;">🔄</button>
            <button id="tool-scale" class="toolbar-btn" title="Escalar (S)" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; color: #aaa;">📏</button>
            <div class="toolbar-separator" style="width: 1px; height: 28px; background: #3a3a3a; margin: 0 6px;"></div>
            <button id="tool-vertex" class="toolbar-btn" title="Vértices (1)" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; color: #aaa;">⚫</button>
            <button id="tool-edge" class="toolbar-btn" title="Arestas (2)" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; color: #aaa;">📐</button>
            <button id="tool-face" class="toolbar-btn" title="Faces (3)" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; color: #aaa;">🔷</button>
            <div class="toolbar-separator" style="width: 1px; height: 28px; background: #3a3a3a; margin: 0 6px;"></div>
            <button id="tool-object" class="toolbar-btn" title="Modo Objeto (Tab)" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; color: #aaa;">🔲</button>
            <button id="tool-edit" class="toolbar-btn" title="Modo Edição (Tab)" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; color: #aaa;">✏️</button>
            <div class="toolbar-separator" style="width: 1px; height: 28px; background: #3a3a3a; margin: 0 6px;"></div>
            <button id="tool-add-cube" class="toolbar-btn" title="Adicionar Cubo" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; color: #aaa;">➕</button>
            <div class="toolbar-separator" style="width: 1px; height: 28px; background: #3a3a3a; margin: 0 6px;"></div>
            <div class="object-counter" style="margin-left: 12px; padding: 0 12px; font-size: 11px; color: #00BFFF; font-family: monospace; background: #252525; border-radius: 20px; height: 30px; display: flex; align-items: center;">0 objetos</div>
        `;
        
        this.container.appendChild(this.toolbar);
        this.bindEvents();
    }
    
    bindEvents() {
        document.getElementById('tool-move')?.addEventListener('click', () => this.callbacks.onTransformMode('translate'));
        document.getElementById('tool-rotate')?.addEventListener('click', () => this.callbacks.onTransformMode('rotate'));
        document.getElementById('tool-scale')?.addEventListener('click', () => this.callbacks.onTransformMode('scale'));
        
        document.getElementById('tool-vertex')?.addEventListener('click', () => this.callbacks.onSelectionType('vertex'));
        document.getElementById('tool-edge')?.addEventListener('click', () => this.callbacks.onSelectionType('edge'));
        document.getElementById('tool-face')?.addEventListener('click', () => this.callbacks.onSelectionType('face'));
        
        document.getElementById('tool-object')?.addEventListener('click', () => this.callbacks.onModeChange('object'));
        document.getElementById('tool-edit')?.addEventListener('click', () => this.callbacks.onModeChange('edit'));
        
        document.getElementById('tool-add-cube')?.addEventListener('click', () => this.callbacks.onAddCube());
    }
    
    updateObjectCount(count) {
        const counter = this.toolbar.querySelector('.object-counter');
        if (counter) {
            counter.textContent = `${count} ${count === 1 ? 'objeto' : 'objetos'}`;
        }
    }
    
    setActiveButton(buttonId, active) {
        const btn = document.getElementById(`tool-${buttonId}`);
        if (btn) {
            if (active) {
                btn.style.background = '#00BFFF';
                btn.style.color = 'white';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = '#aaa';
            }
        }
    }
    
    setTransformMode(mode) {
        this.setActiveButton('move', mode === 'translate');
        this.setActiveButton('rotate', mode === 'rotate');
        this.setActiveButton('scale', mode === 'scale');
    }
    
    setSelectionType(type) {
        this.setActiveButton('vertex', type === 'vertex');
        this.setActiveButton('edge', type === 'edge');
        this.setActiveButton('face', type === 'face');
    }
    
    setMode(mode) {
        this.setActiveButton('object', mode === 'object');
        this.setActiveButton('edit', mode === 'edit');
    }
}