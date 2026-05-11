import * as THREE from 'three';

/**
 * TransformController - Controla transformações via teclado
 * Gerencia G (mover), R (rotacionar), S (escalar) com eixos e valores numéricos
 */
export class TransformController {
    constructor(camera, domElement, ui) {
        this.camera = camera;
        this.domElement = domElement;
        this.ui = ui;
        
        this.isTransforming = false;
        this.mode = null;
        this.axis = null;
        this.startValues = null;
        this.currentDelta = 0;
        this.numericBuffer = '';
        
        this.onTransformStart = null;
        this.onTransformChange = null;
        this.onTransformEnd = null;
        
        this.init();
    }
    
    init() {
        this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
    }
    
    startTransform(mode, startPositions = null, applyCallback = null, getCenter = null) {
        if (this.isTransforming) return false;
        
        this.mode = mode;
        this.axis = null;
        this.numericBuffer = '';
        this.currentDelta = 0;
        
        this.getStartPositions = startPositions ? () => startPositions : this.getStartPositions;
        this.applyCallback = applyCallback;
        this.getCenter = getCenter;
        
        if (!this.getStartPositions) {
            console.warn('TransformController: startPositions não fornecido');
            return false;
        }
        
        this.startValues = {
            positions: this.getStartPositions().map(p => p.clone()),
            center: this.getCenter ? this.getCenter() : null
        };
        
        this.isTransforming = true;
        
        if (this.onTransformStart) this.onTransformStart(mode);
        
        const modeNames = { translate: 'Mover', rotate: 'Rotacionar', scale: 'Escalar' };
        if (this.ui) {
            this.ui.showMessage(`📐 ${modeNames[mode]} - Arraste | Enter=OK, Esc=Cancelar | X/Y/Z=Eixo`, 'info');
        }
        
        return true;
    }
    
    setAxis(axis) {
        this.axis = axis;
        if (this.ui) this.ui.showMessage(`📍 Eixo: ${axis?.toUpperCase() || 'LIVRE'}`, 'info');
    }
    
    setNumericValue(value) {
        this.numericBuffer += value;
        if (this.ui) this.ui.showMessage(`📐 Valor: ${this.numericBuffer}`, 'info');
    }
    
    applyNumeric() {
        if (!this.numericBuffer) return;
        const value = parseFloat(this.numericBuffer);
        if (!isNaN(value) && this.applyCallback) {
            const sensitivity = this.mode === 'rotate' ? 1 : 0.01;
            const finalDelta = value * sensitivity;
            
            this.applyCallback({
                delta: finalDelta,
                axis: this.axis,
                startPositions: this.startValues.positions,
                center: this.startValues.center,
                mode: this.mode
            });
            
            if (this.onTransformChange) this.onTransformChange(finalDelta);
        }
        this.numericBuffer = '';
        this.endTransform(true);
    }
    
    onMouseMove(e) {
        if (!this.isTransforming) return;
        
        const deltaX = e.movementX;
        const deltaY = e.movementY;
        
        if (deltaX === 0 && deltaY === 0) return;
        
        const sensitivity = this.mode === 'translate' ? 0.005 : 
                           (this.mode === 'rotate' ? 0.5 : 0.003);
        
        let delta = (deltaX + deltaY) * sensitivity;
        
        if (this.applyCallback) {
            this.applyCallback({
                delta: delta,
                axis: this.axis,
                startPositions: this.startValues.positions,
                center: this.startValues.center,
                mode: this.mode
            });
            this.currentDelta = delta;
            if (this.onTransformChange) this.onTransformChange(this.currentDelta);
        }
    }
    
    onMouseUp(e) {
        if (!this.isTransforming) return;
        this.endTransform(true);
    }
    
    onKeyDown(e) {
        if (!this.isTransforming) return;
        
        if (e.key === 'x') { e.preventDefault(); this.setAxis('x'); }
        else if (e.key === 'y') { e.preventDefault(); this.setAxis('y'); }
        else if (e.key === 'z') { e.preventDefault(); this.setAxis('z'); }
        else if (e.key >= '0' && e.key <= '9') { e.preventDefault(); this.setNumericValue(e.key); }
        else if (e.key === '-') { e.preventDefault(); this.setNumericValue('-'); }
        else if (e.key === 'Enter') { e.preventDefault(); this.applyNumeric(); }
        else if (e.key === 'Escape') { e.preventDefault(); this.endTransform(false); }
    }
    
    endTransform(accept) {
        if (!this.isTransforming) return;
        
        if (!accept && this.startValues && this.applyCallback) {
            this.applyCallback({
                delta: 0,
                axis: null,
                startPositions: this.startValues.positions,
                center: this.startValues.center,
                mode: this.mode,
                isRestore: true
            });
        }
        
        this.isTransforming = false;
        this.mode = null;
        this.axis = null;
        this.startValues = null;
        this.numericBuffer = '';
        
        if (this.onTransformEnd) this.onTransformEnd(accept);
        
        if (this.ui) {
            this.ui.showMessage(accept ? '✅ Transformação aplicada' : '❌ Transformação cancelada', accept ? 'success' : 'info');
        }
    }
    
    isActive() {
        return this.isTransforming;
    }
    
    getMode() {
        return this.mode;
    }
    
    getAxis() {
        return this.axis;
    }
    
    setTransformSpace(space) {
        // Implementar se necessário
        console.log(`Transform space: ${space}`);
    }
}