export class ObjectMode {
    constructor(sceneManager, transformGizmo, onStatusUpdate) {
        this.sceneManager = sceneManager;
        this.transformGizmo = transformGizmo;
        this.onStatusUpdate = onStatusUpdate;
        this.isActive = true;
    }
    
    enter() {
        this.isActive = true;
        const selected = this.sceneManager.getSelectedObject();
        if (selected) {
            this.transformGizmo.attachTo(selected);
            this.transformGizmo.show();
        }
        this.updateStatus();
    }
    
    exit() {
        this.isActive = false;
        this.transformGizmo.hide();
        this.updateStatus();
    }
    
    selectObject(object) {
        this.sceneManager.selectObject(object);
        this.transformGizmo.attachTo(object);
        this.updateStatus(`Selecionado: ${object.userData.name}`);
    }
    
    addObject(object) {
        this.sceneManager.addObject(object);
        this.updateStatus(`Objeto adicionado: ${object.userData.name}`);
        return object;
    }
    
    removeSelected() {
        const selected = this.sceneManager.getSelectedObject();
        if (selected) {
            const name = selected.userData.name;
            this.sceneManager.removeObject(selected);
            this.transformGizmo.detach();
            this.updateStatus(`Removido: ${name}`);
            return true;
        }
        return false;
    }
    
    updateStatus(message = null) {
        if (this.onStatusUpdate) {
            const count = this.sceneManager.getObjectCount();
            this.onStatusUpdate(message || `Modo Objeto | ${count} objeto(s) na cena`);
        }
    }
}