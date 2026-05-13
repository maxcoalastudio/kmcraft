/**
 * Window/Grid Manager - Gerencia redimensionamento de janelas tipo UPBGE
 */

class WindowManager {
    constructor(containerSelector, apiUrl) {
        this.container = document.querySelector(containerSelector);
        this.apiUrl = apiUrl;
        this.isDragging = false;
        this.dragType = null;
        this.dragIndex = null;
        this.dragStartPos = 0;
        this.currentLayout = {
            columnWidths: [50, 50],
            rowHeights: [60, 40]
        };
        
        this.init();
    }

    init() {
        this.attachSplitterListeners();
    }

    attachSplitterListeners() {
        // Divisores horizontais (entre linhas)
        document.querySelectorAll('.layout-splitter-h').forEach((splitter) => {
            splitter.addEventListener('mousedown', (e) => this.startDragH(e));
        });

        // Divisores verticais (entre colunas)
        document.querySelectorAll('.layout-splitter-v').forEach((splitter) => {
            splitter.addEventListener('mousedown', (e) => this.startDragV(e));
        });

        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', () => this.endDrag());
    }

    startDragH(event) {
        const splitter = event.target;
        const rowSplit = parseInt(splitter.dataset.rowSplit, 10);
        
        const rows = document.querySelectorAll('.layout-grid-row');
        if (rowSplit >= 0 && rowSplit < rows.length - 1) {
            this.isDragging = true;
            this.dragType = 'horizontal';
            this.dragIndex = rowSplit;
            this.dragStartPos = event.clientY;
            
            this.row1 = rows[rowSplit];
            this.row2 = rows[rowSplit + 1];
            
            this.startFlex1 = parseFloat(this.row1.style.flex || 50);
            this.startFlex2 = parseFloat(this.row2.style.flex || 50);
            
            splitter.classList.add('dragging');
            this.container.classList.add('resizing');
            
            event.preventDefault();
        }
    }

    startDragV(event) {
        const splitter = event.target;
        const colSplit = parseInt(splitter.dataset.colSplit, 10);
        const row = parseInt(splitter.dataset.row, 10);
        
        const rowElement = document.querySelectorAll('.layout-grid-row')[row];
        if (!rowElement) return;
        
        const cells = rowElement.querySelectorAll('.layout-grid-cell');
        if (colSplit >= 0 && colSplit < cells.length - 1) {
            this.isDragging = true;
            this.dragType = 'vertical';
            this.dragIndex = colSplit;
            this.dragStartPos = event.clientX;
            
            this.col1 = cells[colSplit];
            this.col2 = cells[colSplit + 1];
            this.currentRow = rowElement;
            
            this.startFlex1 = parseFloat(this.col1.style.flex || 50);
            this.startFlex2 = parseFloat(this.col2.style.flex || 50);
            
            splitter.classList.add('dragging');
            this.container.classList.add('resizing');
            
            event.preventDefault();
        }
    }

    onDrag(event) {
        if (!this.isDragging) return;

        if (this.dragType === 'horizontal' && this.row1 && this.row2) {
            const deltaY = event.clientY - this.dragStartPos;
            const containerHeight = this.container.clientHeight;
            const deltaPct = (deltaY / containerHeight) * 100;

            const newFlex1 = Math.max(10, this.startFlex1 + deltaPct);
            const newFlex2 = Math.max(10, this.startFlex2 - deltaPct);

            this.row1.style.flex = newFlex1;
            this.row2.style.flex = newFlex2;
        } else if (this.dragType === 'vertical' && this.col1 && this.col2) {
            const deltaX = event.clientX - this.dragStartPos;
            const containerWidth = this.currentRow.clientWidth;
            const deltaPct = (deltaX / containerWidth) * 100;

            const newFlex1 = Math.max(10, this.startFlex1 + deltaPct);
            const newFlex2 = Math.max(10, this.startFlex2 - deltaPct);

            this.col1.style.flex = newFlex1;
            this.col2.style.flex = newFlex2;
        }
    }

    endDrag() {
        if (!this.isDragging) return;

        this.isDragging = false;
        document.querySelectorAll('.layout-splitter-h, .layout-splitter-v').forEach((s) => {
            s.classList.remove('dragging');
        });
        this.container.classList.remove('resizing');

        this.saveLayoutDimensions();
        
        this.row1 = null;
        this.row2 = null;
        this.col1 = null;
        this.col2 = null;
        this.currentRow = null;
    }

    saveLayoutDimensions() {
        const rows = document.querySelectorAll('.layout-grid-row');
        const rowHeights = Array.from(rows).map((r) => parseFloat(r.style.flex || 50));

        const columnWidths = [];
        const firstRow = rows[0];
        if (firstRow) {
            const cells = firstRow.querySelectorAll('.layout-grid-cell');
            cells.forEach((cell) => {
                columnWidths.push(parseFloat(cell.style.flex || 50));
            });
        }

        const data = {
            columnWidths: columnWidths,
            rowHeights: rowHeights
        };

        fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveGridLayout', gridLayout: data })
        }).catch((err) => console.error('Failed to save grid layout:', err));
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.windowManager = new WindowManager('#grid-container', '/layout_api.php');
});
