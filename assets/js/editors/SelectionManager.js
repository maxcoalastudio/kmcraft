export class SelectionManager {
    constructor() {
        this.selection = {
            vertices: new Set(),
            edges: new Set(),
            faces: new Set()
        };
        this.selectionType = 'vertex';
    }
    
    clear() {
        this.selection.vertices.clear();
        this.selection.edges.clear();
        this.selection.faces.clear();
    }
    
    clearType(type) {
        this.selection[type + 's'].clear();
    }
    
    add(type, index) {
        this.selection[type + 's'].add(index);
    }
    
    remove(type, index) {
        this.selection[type + 's'].delete(index);
    }
    
    toggle(type, index) {
        if (this.selection[type + 's'].has(index)) {
            this.selection[type + 's'].delete(index);
            return false;
        } else {
            this.selection[type + 's'].add(index);
            return true;
        }
    }
    
    has(type, index) {
        return this.selection[type + 's'].has(index);
    }
    
    getCount(type) {
        return this.selection[type + 's'].size;
    }
    
    getTotalCount() {
        return this.selection.vertices.size + this.selection.edges.size + this.selection.faces.size;
    }
    
    setType(type) {
        this.selectionType = type;
    }
    
    getType() {
        return this.selectionType;
    }
    
    selectAll(type, count) {
        this.clearType(type);
        for (let i = 0; i < count; i++) {
            this.add(type, i);
        }
    }
    
    toJSON() {
        return {
            vertices: Array.from(this.selection.vertices),
            edges: Array.from(this.selection.edges),
            faces: Array.from(this.selection.faces),
            type: this.selectionType
        };
    }
    
    fromJSON(data) {
        this.selection.vertices = new Set(data.vertices);
        this.selection.edges = new Set(data.edges);
        this.selection.faces = new Set(data.faces);
        this.selectionType = data.type;
    }
}