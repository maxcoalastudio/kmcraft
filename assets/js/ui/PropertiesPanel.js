export class PropertiesPanel {
    constructor(container, onTransformChange) {
        this.container = container;
        this.onTransformChange = onTransformChange;
        this.panel = null;
        this.width = 280;
        this.isResizing = false;
        this.startX = 0;
        this.startWidth = 0;
        
        this.init();
    }
    
    init() {
        this.panel = document.createElement('div');
        this.panel.className = 'properties-panel visible';
        this.panel.style.width = `${this.width}px`;
        this.panel.style.position = 'absolute';
        this.panel.style.right = '0';
        this.panel.style.top = '0';
        this.panel.style.height = '100vh';
        this.panel.style.backgroundColor = 'rgba(30,30,30,0.96)';
        this.panel.style.backdropFilter = 'blur(12px)';
        this.panel.style.borderLeft = '1px solid #3a3a3a';
        this.panel.style.display = 'flex';
        this.panel.style.zIndex = '150';
        this.panel.style.transition = 'right 0.25s ease';
        
        this.panel.innerHTML = `
            <div class="panel-resize" style="position: absolute; left: -4px; top: 0; width: 8px; height: 100%; cursor: ew-resize; background: transparent; z-index: 160;"></div>
            <div class="panel-tabs" style="display: flex; flex-direction: column; gap: 4px; padding: 12px 8px; background: #252525; border-right: 1px solid #3a3a3a; width: 48px; flex-shrink: 0;">
                <button class="panel-tab active" data-tab="object" title="Object" style="display: flex; align-items: center; justify-content: center; padding: 10px 0; background: transparent; border: none; color: #aaa; cursor: pointer; border-radius: 10px; font-size: 20px;">📦</button>
                <button class="panel-tab" data-tab="render" title="Render" style="display: flex; align-items: center; justify-content: center; padding: 10px 0; background: transparent; border: none; color: #aaa; cursor: pointer; border-radius: 10px; font-size: 20px;">🎨</button>
                <button class="panel-tab" data-tab="material" title="Material" style="display: flex; align-items: center; justify-content: center; padding: 10px 0; background: transparent; border: none; color: #aaa; cursor: pointer; border-radius: 10px; font-size: 20px;">🎨</button>
                <button class="panel-tab" data-tab="physics" title="Physics" style="display: flex; align-items: center; justify-content: center; padding: 10px 0; background: transparent; border: none; color: #aaa; cursor: pointer; border-radius: 10px; font-size: 20px;">⚡</button>
            </div>
            <div class="panel-content" style="flex: 1; overflow-y: auto; padding: 16px;">
                <div id="tab-object" class="prop-section">
                    <div class="prop-header" style="font-size: 11px; font-weight: 600; color: #00BFFF; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #3a3a3a;">📦 Transform</div>
                    <div class="prop-group" style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 6px;">📍 Posição</label>
                        <div class="prop-row" style="display: flex; align-items: center; gap: 8px; background: #1a1a1a; padding: 6px 10px; border-radius: 6px; border: 1px solid #3a3a3a;">
                            <span class="prop-label X" style="font-size: 11px; font-weight: 600; width: 22px; color: #ff6666;">X</span>
                            <input type="number" id="pos-x" class="prop-input" step="0.01" value="0" style="flex: 1; background: #252525; border: 1px solid #444; color: #ddd; padding: 5px 8px; border-radius: 4px; font-size: 11px;">
                            <span class="prop-label Y" style="font-size: 11px; font-weight: 600; width: 22px; color: #66ff66;">Y</span>
                            <input type="number" id="pos-y" class="prop-input" step="0.01" value="0" style="flex: 1; background: #252525; border: 1px solid #444; color: #ddd; padding: 5px 8px; border-radius: 4px; font-size: 11px;">
                            <span class="prop-label Z" style="font-size: 11px; font-weight: 600; width: 22px; color: #6666ff;">Z</span>
                            <input type="number" id="pos-z" class="prop-input" step="0.01" value="0" style="flex: 1; background: #252525; border: 1px solid #444; color: #ddd; padding: 5px 8px; border-radius: 4px; font-size: 11px;">
                        </div>
                    </div>
                    <div class="prop-group" style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 6px;">🔄 Rotação</label>
                        <div class="prop-row" style="display: flex; align-items: center; gap: 8px; background: #1a1a1a; padding: 6px 10px; border-radius: 6px; border: 1px solid #3a3a3a;">
                            <span class="prop-label X" style="font-size: 11px; font-weight: 600; width: 22px; color: #ff6666;">X</span>
                            <input type="number" id="rot-x" class="prop-input" step="1" value="0" style="flex: 1; background: #252525; border: 1px solid #444; color: #ddd; padding: 5px 8px; border-radius: 4px; font-size: 11px;">
                            <span class="prop-label Y" style="font-size: 11px; font-weight: 600; width: 22px; color: #66ff66;">Y</span>
                            <input type="number" id="rot-y" class="prop-input" step="1" value="0" style="flex: 1; background: #252525; border: 1px solid #444; color: #ddd; padding: 5px 8px; border-radius: 4px; font-size: 11px;">
                            <span class="prop-label Z" style="font-size: 11px; font-weight: 600; width: 22px; color: #6666ff;">Z</span>
                            <input type="number" id="rot-z" class="prop-input" step="1" value="0" style="flex: 1; background: #252525; border: 1px solid #444; color: #ddd; padding: 5px 8px; border-radius: 4px; font-size: 11px;">
                        </div>
                    </div>
                    <div class="prop-group" style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 6px;">📐 Escala</label>
                        <div class="prop-row" style="display: flex; align-items: center; gap: 8px; background: #1a1a1a; padding: 6px 10px; border-radius: 6px; border: 1px solid #3a3a3a;">
                            <span class="prop-label X" style="font-size: 11px; font-weight: 600; width: 22px; color: #ff6666;">X</span>
                            <input type="number" id="scl-x" class="prop-input" step="0.01" value="1" style="flex: 1; background: #252525; border: 1px solid #444; color: #ddd; padding: 5px 8px; border-radius: 4px; font-size: 11px;">
                            <span class="prop-label Y" style="font-size: 11px; font-weight: 600; width: 22px; color: #66ff66;">Y</span>
                            <input type="number" id="scl-y" class="prop-input" step="0.01" value="1" style="flex: 1; background: #252525; border: 1px solid #444; color: #ddd; padding: 5px 8px; border-radius: 4px; font-size: 11px;">
                            <span class="prop-label Z" style="font-size: 11px; font-weight: 600; width: 22px; color: #6666ff;">Z</span>
                            <input type="number" id="scl-z" class="prop-input" step="0.01" value="1" style="flex: 1; background: #252525; border: 1px solid #444; color: #ddd; padding: 5px 8px; border-radius: 4px; font-size: 11px;">
                        </div>
                    </div>
                </div>
                <div id="tab-render" class="prop-section" style="display:none"><div class="prop-header">🎨 Render</div><p>Configurações de render</p></div>
                <div id="tab-material" class="prop-section" style="display:none"><div class="prop-header">🎨 Material</div><p>Configurações de material</p></div>
                <div id="tab-physics" class="prop-section" style="display:none"><div class="prop-header">⚡ Physics</div><p>Configurações de física</p></div>
            </div>
        `;
        
        this.container.appendChild(this.panel);
        this.setupResize();
        this.setupTabs();
        this.setupInputs();
        this.setupKeyboardShortcut();
    }
    
    setupResize() {
        const resizeHandle = this.panel.querySelector('.panel-resize');
        
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isResizing = true;
            this.startX = e.clientX;
            this.startWidth = this.panel.offsetWidth;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isResizing) return;
            
            const delta = this.startX - e.clientX;
            let newWidth = this.startWidth + delta;
            
            // Limites: mínimo 200px, máximo 500px
            newWidth = Math.max(200, Math.min(500, newWidth));
            
            this.panel.style.width = `${newWidth}px`;
            this.width = newWidth;
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isResizing) {
                this.isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }
    
    setupTabs() {
        const tabs = this.panel.querySelectorAll('.panel-tab');
        const contents = {
            object: this.panel.querySelector('#tab-object'),
            render: this.panel.querySelector('#tab-render'),
            material: this.panel.querySelector('#tab-material'),
            physics: this.panel.querySelector('#tab-physics')
        };
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                Object.values(contents).forEach(c => { if (c) c.style.display = 'none'; });
                if (contents[tabId]) contents[tabId].style.display = 'block';
            });
        });
    }
    
    setupInputs() {
        const inputs = ['pos-x', 'pos-y', 'pos-z', 'rot-x', 'rot-y', 'rot-z', 'scl-x', 'scl-y', 'scl-z'];
        inputs.forEach(id => {
            const input = this.panel.querySelector(`#${id}`);
            if (input) {
                input.addEventListener('change', () => {
                    if (this.onTransformChange) {
                        const values = {
                            position: {
                                x: parseFloat(this.panel.querySelector('#pos-x')?.value) || 0,
                                y: parseFloat(this.panel.querySelector('#pos-y')?.value) || 0,
                                z: parseFloat(this.panel.querySelector('#pos-z')?.value) || 0
                            },
                            rotation: {
                                x: (parseFloat(this.panel.querySelector('#rot-x')?.value) || 0) * Math.PI / 180,
                                y: (parseFloat(this.panel.querySelector('#rot-y')?.value) || 0) * Math.PI / 180,
                                z: (parseFloat(this.panel.querySelector('#rot-z')?.value) || 0) * Math.PI / 180
                            },
                            scale: {
                                x: parseFloat(this.panel.querySelector('#scl-x')?.value) || 1,
                                y: parseFloat(this.panel.querySelector('#scl-y')?.value) || 1,
                                z: parseFloat(this.panel.querySelector('#scl-z')?.value) || 1
                            }
                        };
                        this.onTransformChange(values);
                    }
                });
            }
        });
    }
    
    setupKeyboardShortcut() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'n' && !e.ctrlKey) {
                e.preventDefault();
                this.panel.classList.toggle('visible');
            }
        });
    }
    
    updateTransform(position, rotation, scale) {
        const posX = this.panel.querySelector('#pos-x');
        const posY = this.panel.querySelector('#pos-y');
        const posZ = this.panel.querySelector('#pos-z');
        const rotX = this.panel.querySelector('#rot-x');
        const rotY = this.panel.querySelector('#rot-y');
        const rotZ = this.panel.querySelector('#rot-z');
        const sclX = this.panel.querySelector('#scl-x');
        const sclY = this.panel.querySelector('#scl-y');
        const sclZ = this.panel.querySelector('#scl-z');
        
        if (posX) posX.value = position.x.toFixed(3);
        if (posY) posY.value = position.y.toFixed(3);
        if (posZ) posZ.value = position.z.toFixed(3);
        if (rotX) rotX.value = (rotation.x * 180 / Math.PI).toFixed(1);
        if (rotY) rotY.value = (rotation.y * 180 / Math.PI).toFixed(1);
        if (rotZ) rotZ.value = (rotation.z * 180 / Math.PI).toFixed(1);
        if (sclX) sclX.value = scale.x.toFixed(3);
        if (sclY) sclY.value = scale.y.toFixed(3);
        if (sclZ) sclZ.value = scale.z.toFixed(3);
    }
    
    show() {
        this.panel.classList.add('visible');
    }
    
    hide() {
        this.panel.classList.remove('visible');
    }
    
    toggle() {
        this.panel.classList.toggle('visible');
    }
}