export class StatusBar {
    constructor(container) {
        this.container = container;
        this.bar = null;
        this.init();
    }
    
    init() {
        this.bar = document.createElement('div');
        this.bar.id = 'status-bar';
        this.bar.className = 'status-bar';
        this.bar.innerHTML = `
            <span>✅ Pronto</span>
            <span id="status-coords"></span>
        `;
        this.container.appendChild(this.bar);
    }
    
    update(message, coords = null) {
        const mainSpan = this.bar.querySelector('span:first-child');
        if (mainSpan) {
            mainSpan.innerHTML = `✅ ${message}`;
        }
        
        if (coords) {
            const coordsSpan = document.getElementById('status-coords');
            if (coordsSpan) {
                coordsSpan.innerHTML = `📍 ${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}, ${coords.z.toFixed(2)}`;
            }
        }
    }
}