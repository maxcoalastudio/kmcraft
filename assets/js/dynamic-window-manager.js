import { WindowFactory } from './window-factory.js';
import { WAVEOnlineEngine } from './engine/WAVEOnlineEngine.js';

class DynamicWindowManager {
    constructor(containerSelector, apiUrl) {
        this.container = document.querySelector(containerSelector);
        this.apiUrl = apiUrl;
        this.windows = new Map();
        this.activeWindow = null;
        this.windowOrder = [];
        this.resizeState = null;
        this.dragState = null;
        this.splitterState = null;
        this.viewEngines = new Map();
        this.viewResizeObservers = new Map();
        this.header = document.querySelector('.blender-header');
        this.statusMessage = document.querySelector('#status-message');
        this.footerShortcuts = document.querySelector('#footer-shortcuts');

        this.gridCols = [65, 35];
        this.gridRows = [70, 30];
        this.gridCells = [
            [null, null],
            [null, null]
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    createWindow(typeId, options = {}) {
        const windowData = WindowFactory.createWindow(typeId);
        if (!windowData) return null;

        windowData.context = windowData.context || {
            info: '',
            shortcuts: {},
            nPanelOpen: false,
            tPanelOpen: false
        };
        windowData.floating = Boolean(options.floating);
        windowData.x = options.x ?? 20 + (this.windows.size * 30);
        windowData.y = options.y ?? 20 + (this.windows.size * 30);
        windowData.width = options.width ?? 460;
        windowData.height = options.height ?? 320;
        windowData.zIndex = options.zIndex ?? (this.nextZIndex ? this.nextZIndex + 1 : 100);
        windowData.rowSpan = options.rowSpan ?? 1;
        windowData.colSpan = options.colSpan ?? 1;

        this.windows.set(windowData.id, windowData);
        this.windowOrder.push(windowData.id);
        this.activeWindow = windowData.id;
        this.nextZIndex = windowData.zIndex;

        if (!windowData.floating) {
            const emptySlot = this.findFirstEmptySlot();
            if (emptySlot) {
                windowData.slot = emptySlot;
                this.gridCells[emptySlot.row][emptySlot.col] = windowData.id;
            } else {
                const newRow = this.addGridRow();
                windowData.slot = { row: newRow, col: 0 };
                this.gridCells[newRow][0] = windowData.id;
            }
        }

        this.render();
        this.saveState();
        
        console.log(`✅ Window created: ${windowData.name} (${windowData.id})`);
        return windowData.id;
    }

    closeWindow(windowId) {
        if (!this.windows.has(windowId)) return;

        this.windows.delete(windowId);
        this.windowOrder = this.windowOrder.filter(id => id !== windowId);

        if (this.activeWindow === windowId) {
            this.activeWindow = this.windowOrder.length > 0 ? this.windowOrder[0] : null;
        }

        this.render();
        this.saveState();
        
        console.log(`❌ Window closed: ${windowId}`);
    }

    closeAllExcept(windowId) {
        const idsToClose = Array.from(this.windows.keys()).filter(id => id !== windowId);
        idsToClose.forEach(id => this.closeWindow(id));
        this.activeWindow = windowId;
        console.log(`🔒 Closed all windows except ${windowId}`);
    }

    closeAll() {
        this.windows.clear();
        this.windowOrder = [];
        this.activeWindow = null;
        this.render();
        this.saveState();
        console.log('🗑️ All windows closed');
    }

    setActiveWindow(windowId) {
        if (this.windows.has(windowId)) {
            this.activeWindow = windowId;
            this.bringToFront(windowId);
            this.render();
        }
    }

    bringToFront(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        this.nextZIndex = (this.nextZIndex || 100) + 1;
        windowData.zIndex = this.nextZIndex;
    }

    setActiveTab(windowId, tabName) {
        const window = this.windows.get(windowId);
        if (window && window.tabs.includes(tabName)) {
            window.activeTab = tabName;
            this.render();
            this.saveState();
        }
    }

    renderWindowManager() {
        const controlBar = document.createElement('div');
        controlBar.className = 'window-control-bar';
        controlBar.innerHTML = `
            <div class="window-buttons-group">
                <button class="window-btn-new" title="New Window">➕ New Window</button>
                <button class="window-btn-add-row" title="Add Grid Row">➕ Linha</button>
                <button class="window-btn-remove-row" title="Remove Empty Row">🗑️ Linha</button>
                <button class="window-btn-add-col" title="Add Grid Column">➕ Coluna</button>
                <button class="window-btn-remove-col" title="Remove Empty Column">🗑️ Coluna</button>
                <div class="window-dropdown">
                    <select id="window-type-select" class="window-type-select">
                        <option value="">Select window type...</option>
                        ${WindowFactory.getAllTypes().map(type => `
                            <option value="${type.id}">${type.icon} ${type.name}</option>
                        `).join('')}
                    </select>
                </div>
                <button class="window-btn-close-all" title="Close All">🗑️ Close All</button>
            </div>
            <div class="window-tabs-group">
                ${Array.from(this.windows.values()).map(window => `
                    <div class="window-tab ${this.activeWindow === window.id ? 'active' : ''}" data-window-id="${window.id}">
                        <span class="window-icon">${window.icon}</span>
                        <span class="window-name">${window.name}</span>
                        <button class="window-tab-close" data-window-id="${window.id}">✕</button>
                    </div>
                `).join('')}
            </div>
        `;

        const placeholder = this.header?.querySelector('#window-control-bar-placeholder');
        const existing = this.header?.querySelector('.window-control-bar');

        if (placeholder) {
            placeholder.replaceWith(controlBar);
        } else if (existing) {
            existing.replaceWith(controlBar);
        } else if (this.header) {
            this.header.appendChild(controlBar);
        }

        this.setupWindowControlListeners();
    }

    render() {
        const windowsList = Array.from(this.windows.values());
        
        if (windowsList.length === 0) {
            this.container.innerHTML = '<div class="no-windows">No windows open. Create a new window to start.</div>';
            this.renderWindowManager();
            return;
        }

        this.container.style.position = 'relative';
        this.container.style.display = 'block';
        this.container.style.padding = '10px';
        this.container.style.overflow = 'hidden';
        this.container.innerHTML = '';

        const gridWrapper = this.createGridWrapper();
        this.container.appendChild(gridWrapper);

        windowsList.forEach((window) => {
            if (window.floating || !window.slot) {
                const windowEl = this.createWindowElement(window);
                this.container.appendChild(windowEl);
            }
        });

        this.renderWindowManager();
        this.setupResizeHandles();
        this.setupWindowDragListeners();
        this.setupGridSplitterListeners();
        this.updateResizeHandles();
        this.setupThreeViews();
        this.updateStatusBar();
    }

    createGridWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = 'layout-grid';
        wrapper.style.display = 'grid';
        wrapper.style.gridTemplateColumns = this.gridCols.map(col => `${col}fr`).join(' ');
        wrapper.style.gridTemplateRows = this.gridRows.map(row => `${row}fr`).join(' ');
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.dataset.grid = 'true';

        for (let row = 0; row < this.gridRows.length; row++) {
            for (let col = 0; col < this.gridCols.length; col++) {
                const coveringWindow = this.getWindowCoveringSlot(row, col);
                if (coveringWindow && (coveringWindow.slot.row !== row || coveringWindow.slot.col !== col)) {
                    continue;
                }

                const cell = document.createElement('div');
                cell.className = 'layout-grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.slot = `${row}-${col}`;
                cell.style.gridRow = row + 1;
                cell.style.gridColumn = col + 1;
                cell.addEventListener('pointerenter', () => cell.classList.add('drop-hover'));
                cell.addEventListener('pointerleave', () => cell.classList.remove('drop-hover'));
                cell.addEventListener('pointerup', (event) => this.handleSlotDrop(event, row, col));
                cell.addEventListener('pointerdown', (event) => event.stopPropagation());

                const windowData = coveringWindow || null;
                if (windowData) {
                    cell.style.gridRowEnd = `span ${windowData.rowSpan || 1}`;
                    cell.style.gridColumnEnd = `span ${windowData.colSpan || 1}`;
                }

                const mergeControls = this.createMergeControls(row, col);
                cell.appendChild(mergeControls);

                if (windowData) {
                    const windowEl = this.createWindowElement(windowData);
                    cell.appendChild(windowEl);
                }

                wrapper.appendChild(cell);
            }
        }

        this.createSplitters(wrapper);
        return wrapper;
    }

    createSplitters(wrapper) {
        const totalRowWeight = this.gridRows.reduce((sum, value) => sum + value, 0);
        let rowOffset = 0;
        this.gridRows.forEach((weight, rowIndex) => {
            if (rowIndex === this.gridRows.length - 1) return;
            rowOffset += weight;
            const splitter = document.createElement('div');
            splitter.className = 'layout-splitter-h';
            splitter.dataset.rowSplit = rowIndex;
            splitter.style.top = `${(rowOffset / totalRowWeight) * 100}%`;
            splitter.style.left = '0';
            splitter.style.right = '0';
            wrapper.appendChild(splitter);
        });

        const totalColWeight = this.gridCols.reduce((sum, value) => sum + value, 0);
        let colOffset = 0;
        this.gridCols.forEach((weight, colIndex) => {
            if (colIndex === this.gridCols.length - 1) return;
            colOffset += weight;
            const splitter = document.createElement('div');
            splitter.className = 'layout-splitter-v';
            splitter.dataset.colSplit = colIndex;
            splitter.style.left = `${(colOffset / totalColWeight) * 100}%`;
            splitter.style.top = '0';
            splitter.style.bottom = '0';
            wrapper.appendChild(splitter);
        });
    }

    setupWindowDragListeners() {
        this.container.querySelectorAll('.dynamic-window .dynamic-window-header').forEach((header) => {
            const windowId = header.closest('.dynamic-window')?.dataset.windowId;
            if (!windowId) return;
            header.style.cursor = 'grab';
            header.onpointerdown = (event) => this.startWindowDrag(windowId, event);
        });
    }

    setupGridSplitterListeners() {
        const wrapper = this.container.querySelector('.layout-grid');
        if (!wrapper) return;

        wrapper.querySelectorAll('.layout-splitter-h, .layout-splitter-v').forEach((splitter) => {
            splitter.style.touchAction = 'none';
            splitter.onpointerdown = (event) => this.startGridSplitterDrag(splitter, event);
        });
    }

    createMergeControls(row, col) {
        const controls = document.createElement('div');
        controls.className = 'merge-controls';

        const directions = [
            { dir: 'up', icon: '⬆', title: 'Unir para cima' },
            { dir: 'down', icon: '⬇', title: 'Unir para baixo' },
            { dir: 'left', icon: '⬅', title: 'Unir à esquerda' },
            { dir: 'right', icon: '➡', title: 'Unir à direita' }
        ];

        directions.forEach(({ dir, icon, title }) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `merge-arrow merge-${dir}`;
            button.title = title;
            button.textContent = icon;
            button.disabled = !this.canMergeSlot(row, col, dir);
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                this.mergeSlot(row, col, dir);
            });
            controls.appendChild(button);
        });

        return controls;
    }

    getWindowCoveringSlot(row, col) {
        for (const windowData of this.windows.values()) {
            if (!windowData.slot) continue;
            const startRow = windowData.slot.row;
            const startCol = windowData.slot.col;
            const rowSpan = windowData.rowSpan || 1;
            const colSpan = windowData.colSpan || 1;
            if (row >= startRow && row < startRow + rowSpan && col >= startCol && col < startCol + colSpan) {
                return windowData;
            }
        }
        return null;
    }

    getWindowOriginAtSlot(row, col) {
        const windowId = this.gridCells[row]?.[col];
        return windowId ? this.windows.get(windowId) : null;
    }

    isSlotAvailable(row, col, ignoreWindowId = null) {
        const covering = this.getWindowCoveringSlot(row, col);
        return !covering || covering.id === ignoreWindowId;
    }

    getMergeTargets(windowData, direction) {
        const originRow = windowData.slot.row;
        const originCol = windowData.slot.col;
        const rowSpan = windowData.rowSpan || 1;
        const colSpan = windowData.colSpan || 1;
        const targets = [];

        if (direction === 'left') {
            if (originCol <= 0) return null;
            for (let r = originRow; r < originRow + rowSpan; r++) {
                targets.push({ row: r, col: originCol - 1 });
            }
        } else if (direction === 'right') {
            if (originCol + colSpan >= this.gridCols.length) return null;
            for (let r = originRow; r < originRow + rowSpan; r++) {
                targets.push({ row: r, col: originCol + colSpan });
            }
        } else if (direction === 'up') {
            if (originRow <= 0) return null;
            for (let c = originCol; c < originCol + colSpan; c++) {
                targets.push({ row: originRow - 1, col: c });
            }
        } else {
            if (originRow + rowSpan >= this.gridRows.length) return null;
            for (let c = originCol; c < originCol + colSpan; c++) {
                targets.push({ row: originRow + rowSpan, col: c });
            }
        }

        return targets;
    }

    canMergeSlot(row, col, direction) {
        const windowData = this.getWindowCoveringSlot(row, col);
        if (!windowData) return false;

        const targets = this.getMergeTargets(windowData, direction);
        if (!targets) return false;
        return targets.every(({ row, col }) => row >= 0 && col >= 0 && row < this.gridRows.length && col < this.gridCols.length);
    }

    mergeSlot(row, col, direction) {
        const windowData = this.getWindowCoveringSlot(row, col);
        if (!windowData) return;

        if (!this.canMergeSlot(row, col, direction)) return;

        const targets = this.getMergeTargets(windowData, direction);
        if (!targets) return;

        const otherWindowIds = new Set();
        targets.forEach(({ row, col }) => {
            const covering = this.getWindowCoveringSlot(row, col);
            if (covering && covering.id !== windowData.id) {
                otherWindowIds.add(covering.id);
            }
        });

        otherWindowIds.forEach((otherId) => {
            const otherWindow = this.windows.get(otherId);
            if (otherWindow) {
                this.detachWindowFromGrid(otherWindow);
            }
        });

        const originRow = windowData.slot.row;
        const originCol = windowData.slot.col;
        const rowSpan = windowData.rowSpan || 1;
        const colSpan = windowData.colSpan || 1;

        if (direction === 'left') {
            windowData.slot.col = originCol - 1;
            windowData.colSpan = colSpan + 1;
        } else if (direction === 'right') {
            windowData.colSpan = colSpan + 1;
        } else if (direction === 'up') {
            windowData.slot.row = originRow - 1;
            windowData.rowSpan = rowSpan + 1;
        } else if (direction === 'down') {
            windowData.rowSpan = rowSpan + 1;
        }

        this.updateGridCellsAfterMerge(windowData);
        this.render();
        this.saveState();
    }

    updateGridCellsAfterMerge(windowData) {
        for (let row = 0; row < this.gridRows.length; row++) {
            for (let col = 0; col < this.gridCols.length; col++) {
                if (this.gridCells[row][col] === windowData.id && (row !== windowData.slot.row || col !== windowData.slot.col)) {
                    this.gridCells[row][col] = null;
                }
            }
        }
        this.gridCells[windowData.slot.row][windowData.slot.col] = windowData.id;
    }

    detachWindowFromGrid(windowData) {
        if (!windowData || !windowData.slot) return;

        this.clearWindowOrigin(windowData);
        windowData.floating = true;
        windowData.x = windowData.x || 40;
        windowData.y = windowData.y || 40;
        delete windowData.slot;
        windowData.rowSpan = 1;
        windowData.colSpan = 1;
    }

    clearWindowOrigin(windowData) {
        for (let row = 0; row < this.gridRows.length; row++) {
            for (let col = 0; col < this.gridCols.length; col++) {
                if (this.gridCells[row][col] === windowData.id) {
                    this.gridCells[row][col] = null;
                }
            }
        }
    }

    startGridSplitterDrag(splitter, event) {
        event.preventDefault();
        event.stopPropagation();

        const type = splitter.classList.contains('layout-splitter-h') ? 'row' : 'col';
        const index = parseInt(splitter.dataset.rowSplit ?? splitter.dataset.colSplit, 10);
        const wrapper = this.container.querySelector('.layout-grid');
        if (!wrapper || Number.isNaN(index)) return;

        const rect = wrapper.getBoundingClientRect();
        this.splitterState = {
            type,
            index,
            startX: event.clientX,
            startY: event.clientY,
            rect,
            originalSizes: type === 'row' ? [...this.gridRows] : [...this.gridCols]
        };

        splitter.classList.add('dragging');
        document.addEventListener('pointermove', this.onGridSplitterMove);
        document.addEventListener('pointerup', this.endGridSplitterDrag);
    }

    onGridSplitterMove = (event) => {
        if (!this.splitterState) return;

        const { type, index, startX, startY, rect, originalSizes } = this.splitterState;
        if (type === 'col') {
            const deltaPx = event.clientX - startX;
            const total = rect.width;
            if (total <= 0) return;
            const delta = (deltaPx / total) * 100;
            const prev = originalSizes[index];
            const next = originalSizes[index + 1];
            const min = 5;
            const newPrev = Math.max(min, prev + delta);
            const newNext = Math.max(min, next - delta);
            const totalWeight = prev + next;
            const adjust = totalWeight - (newPrev + newNext);
            const finalPrev = newPrev + adjust * 0.5;
            const finalNext = newNext + adjust * 0.5;
            if (finalPrev >= min && finalNext >= min) {
                this.gridCols[index] = finalPrev;
                this.gridCols[index + 1] = finalNext;
            }
        } else {
            const deltaPx = event.clientY - startY;
            const total = rect.height;
            if (total <= 0) return;
            const delta = (deltaPx / total) * 100;
            const prev = originalSizes[index];
            const next = originalSizes[index + 1];
            const min = 5;
            const newPrev = Math.max(min, prev + delta);
            const newNext = Math.max(min, next - delta);
            const totalWeight = prev + next;
            const adjust = totalWeight - (newPrev + newNext);
            const finalPrev = newPrev + adjust * 0.5;
            const finalNext = newNext + adjust * 0.5;
            if (finalPrev >= min && finalNext >= min) {
                this.gridRows[index] = finalPrev;
                this.gridRows[index + 1] = finalNext;
            }
        }

        const wrapper = this.container.querySelector('.layout-grid');
        if (wrapper) {
            wrapper.style.gridTemplateColumns = this.gridCols.map(col => `${col}fr`).join(' ');
            wrapper.style.gridTemplateRows = this.gridRows.map(row => `${row}fr`).join(' ');
            wrapper.querySelectorAll('.layout-splitter-h, .layout-splitter-v').forEach(splitter => splitter.remove());
            this.createSplitters(wrapper);
            this.setupGridSplitterListeners();
        }
    }

    endGridSplitterDrag = () => {
        const wrapper = this.container.querySelector('.layout-grid');
        if (wrapper) {
            wrapper.querySelectorAll('.layout-splitter-h.dragging, .layout-splitter-v.dragging').forEach((splitter) => {
                splitter.classList.remove('dragging');
            });
        }

        document.removeEventListener('pointermove', this.onGridSplitterMove);
        document.removeEventListener('pointerup', this.endGridSplitterDrag);
        this.splitterState = null;
        this.saveState();
        this.render();
    }

    startWindowDrag(windowId, event) {
        event.preventDefault();
        event.stopPropagation();

        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        this.bringToFront(windowId);
        windowData.floating = true;
        if (windowData.slot) {
            this.gridCells[windowData.slot.row][windowData.slot.col] = null;
            delete windowData.slot;
        }

        this.dragState = {
            windowId,
            startX: event.clientX,
            startY: event.clientY,
            initialX: windowData.x,
            initialY: windowData.y,
            dragging: false
        };

        document.addEventListener('pointermove', this.onWindowDragMove);
        document.addEventListener('pointerup', this.onWindowDragEnd);
    }

    onWindowDragMove = (event) => {
        if (!this.dragState) return;
        const { windowId, startX, startY, initialX, initialY } = this.dragState;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        this.dragState.dragging = true;
        windowData.x = initialX + dx;
        windowData.y = initialY + dy;
        this.render();
    }

    onWindowDragEnd = (event) => {
        if (!this.dragState) return;

        const { windowId } = this.dragState;
        const slot = this.findGridSlotAtPoint(event.clientX, event.clientY);
        const windowData = this.windows.get(windowId);

        if (windowData) {
            if (slot) {
                windowData.floating = false;
                windowData.slot = slot;
                windowData.x = 0;
                windowData.y = 0;
                this.gridCells[slot.row][slot.col] = windowId;
            } else {
                const wrapperRect = this.getGridWrapperRect();
                if (wrapperRect) {
                    const threshold = 40;
                    if (event.clientX <= wrapperRect.left + threshold) {
                        const row = this.getRowForPointer(event.clientY, wrapperRect);
                        const newCol = this.addGridColumn(true);
                        windowData.floating = false;
                        windowData.slot = { row, col: 0 };
                        this.gridCells[row][0] = windowId;
                    } else if (event.clientX >= wrapperRect.right - threshold) {
                        const row = this.getRowForPointer(event.clientY, wrapperRect);
                        const newCol = this.addGridColumn(false);
                        windowData.floating = false;
                        windowData.slot = { row, col: this.gridCols.length - 1 };
                        this.gridCells[row][this.gridCols.length - 1] = windowId;
                    } else if (event.clientY <= wrapperRect.top + threshold) {
                        const newRow = this.addGridRow(true);
                        windowData.floating = false;
                        windowData.slot = { row: 0, col: 0 };
                        this.gridCells[0][0] = windowId;
                    } else if (event.clientY >= wrapperRect.bottom - threshold) {
                        const newRow = this.addGridRow(false);
                        windowData.floating = false;
                        windowData.slot = { row: this.gridRows.length - 1, col: 0 };
                        this.gridCells[this.gridRows.length - 1][0] = windowId;
                    }
                }
            }
        }

        this.dragState = null;
        document.removeEventListener('pointermove', this.onWindowDragMove);
        document.removeEventListener('pointerup', this.onWindowDragEnd);
        this.render();
        this.saveState();
    }

    handleSlotDrop(event, row, col) {
        if (!this.dragState) return;
        const windowId = this.dragState.windowId;
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.floating = false;
        windowData.slot = { row, col };
        this.gridCells[row][col] = windowId;
        this.dragState = null;
        this.render();
        this.saveState();
    }

    findFirstEmptySlot() {
        for (let row = 0; row < this.gridRows.length; row++) {
            for (let col = 0; col < this.gridCols.length; col++) {
                if (this.isSlotAvailable(row, col)) {
                    const windowAtOrigin = this.getWindowOriginAtSlot(row, col);
                    if (!windowAtOrigin) {
                        return { row, col };
                    }
                }
            }
        }
        return null;
    }

    getGridCellRects() {
        return Array.from(this.container.querySelectorAll('.layout-grid-cell')).map((cell) => ({
            row: parseInt(cell.dataset.row, 10),
            col: parseInt(cell.dataset.col, 10),
            rect: cell.getBoundingClientRect()
        }));
    }

    findGridSlotAtPoint(x, y) {
        const candidates = this.getGridCellRects();
        const hit = candidates.find((item) => {
            const { left, right, top, bottom } = item.rect;
            return x >= left && x <= right && y >= top && y <= bottom;
        });
        return hit ? { row: hit.row, col: hit.col } : null;
    }

    getGridWrapperRect() {
        const wrapper = this.container.querySelector('.layout-grid');
        return wrapper ? wrapper.getBoundingClientRect() : null;
    }

    getRowForPointer(y, wrapperRect) {
        const rowHeight = wrapperRect.height / this.gridRows.length;
        const relativeY = y - wrapperRect.top;
        const row = Math.floor(relativeY / rowHeight);
        return Math.max(0, Math.min(this.gridRows.length - 1, row));
    }

    addGridRow(index = null) {
        const newRow = Array(this.gridCols.length).fill(null);
        if (index === null || index >= this.gridRows.length) {
            this.gridCells.push(newRow);
            this.gridRows.push(20);
            return this.gridCells.length - 1;
        }
        index = Math.max(0, Math.min(index, this.gridRows.length));
        this.gridCells.splice(index, 0, newRow);
        this.gridRows.splice(index, 0, 20);
        this.windows.forEach((windowData) => {
            if (!windowData.slot) return;
            if (windowData.slot.row >= index) {
                windowData.slot.row += 1;
            }
        });
        return index;
    }

    addGridColumn(index = null) {
        if (index === null || index >= this.gridCols.length) {
            this.gridCells.forEach((row) => row.push(null));
            this.gridCols.push(20);
            return this.gridCols.length - 1;
        }
        index = Math.max(0, Math.min(index, this.gridCols.length));
        this.gridCells.forEach((row) => row.splice(index, 0, null));
        this.gridCols.splice(index, 0, 20);
        this.windows.forEach((windowData) => {
            if (!windowData.slot) return;
            if (windowData.slot.col >= index) {
                windowData.slot.col += 1;
            }
        });
        return index;
    }

    removeEmptyGridRow(index = null) {
        if (this.gridRows.length <= 1) return;
        const targetIndex = index !== null ? index : this.findEmptyRowIndex();
        if (targetIndex === null) return;
        this.gridRows.splice(targetIndex, 1);
        this.gridCells.splice(targetIndex, 1);
        this.windows.forEach((windowData) => {
            if (!windowData.slot) return;
            if (windowData.slot.row > targetIndex) {
                windowData.slot.row -= 1;
            }
        });
        this.render();
        this.saveState();
    }

    removeEmptyGridColumn(index = null) {
        if (this.gridCols.length <= 1) return;
        const targetIndex = index !== null ? index : this.findEmptyColumnIndex();
        if (targetIndex === null) return;
        this.gridCols.splice(targetIndex, 1);
        this.gridCells.forEach((row) => row.splice(targetIndex, 1));
        this.windows.forEach((windowData) => {
            if (!windowData.slot) return;
            if (windowData.slot.col > targetIndex) {
                windowData.slot.col -= 1;
            }
        });
        this.render();
        this.saveState();
    }

    findEmptyRowIndex() {
        for (let row = 0; row < this.gridRows.length; row++) {
            if (this.isRowEmpty(row)) {
                return row;
            }
        }
        return null;
    }

    findEmptyColumnIndex() {
        for (let col = 0; col < this.gridCols.length; col++) {
            if (this.isColumnEmpty(col)) {
                return col;
            }
        }
        return null;
    }

    isRowEmpty(row) {
        return this.gridCols.every((_, col) => !this.getWindowCoveringSlot(row, col));
    }

    isColumnEmpty(col) {
        return this.gridRows.every((_, row) => !this.getWindowCoveringSlot(row, col));
    }

    insertGridRowForActive() {
        const active = this.windows.get(this.activeWindow);
        const rowIndex = active?.slot?.row;
        const insertAt = rowIndex !== undefined ? rowIndex + 1 : this.gridRows.length;
        this.addGridRow(insertAt);
        this.render();
        this.saveState();
    }

    insertGridColumnForActive() {
        const active = this.windows.get(this.activeWindow);
        const colIndex = active?.slot?.col;
        const insertAt = colIndex !== undefined ? colIndex + 1 : this.gridCols.length;
        this.addGridColumn(insertAt);
        this.render();
        this.saveState();
    }

    createWindowElement(window) {
        const el = document.createElement('section');
        el.className = `dynamic-window ${this.activeWindow === window.id ? 'active' : ''}`;
        el.dataset.windowId = window.id;
        el.dataset.type = window.typeId;
        el.style.zIndex = window.zIndex || 100;

        if (window.floating || !window.slot) {
            el.style.position = 'absolute';
            el.style.left = `${window.x}px`;
            el.style.top = `${window.y}px`;
            el.style.width = `${window.width}px`;
            el.style.height = `${window.height}px`;
        } else {
            el.style.position = 'relative';
            el.style.left = '';
            el.style.top = '';
            el.style.width = '100%';
            el.style.height = '100%';
        }

        const nOpen = window.context?.nPanelOpen;
        const tOpen = window.context?.tPanelOpen;

        el.innerHTML = `
            <div class="dynamic-window-header">
                <span class="dynamic-window-title">${window.icon} ${window.name}</span>
                <div class="dynamic-window-tabs">
                    ${window.tabs.map(tab => `
                        <button class="window-content-tab ${tab === window.activeTab ? 'active' : ''}" data-tab="${tab}">
                            ${tab}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="dynamic-window-body ${nOpen ? 'has-n-panel' : ''} ${tOpen ? 'has-t-panel' : ''}">
                ${this.getWindowPanel(window, 't')}
                <div class="dynamic-window-main">
                    ${this.getWindowContent(window)}
                </div>
                ${this.getWindowPanel(window, 'n')}
            </div>
            <div class="resize-handle resize-right" data-dir="right"></div>
            <div class="resize-handle resize-bottom" data-dir="bottom"></div>
            <div class="resize-handle resize-corner" data-dir="corner"></div>
        `;

        el.addEventListener('click', () => this.setActiveWindow(window.id));
        
        el.querySelectorAll('.window-content-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setActiveTab(window.id, btn.dataset.tab);
            });
        });

        return el;
    }

    getWindowContent(window) {
        const contentMap = {
            '3dview': {
                'View': `<div class="three-view-host" data-three-view-host="${window.id}"></div>`,
                'Animation': '⏱️ Timeline de animação integrada',
                'Scripting': '📝 Console Python para scripting'
            },
            'outliner': {
                'All Scenes': '🌍 Todas as cenas do projeto',
                'Current File': '📄 Arquivo atual carregado',
                'Scenes': '🎬 Organiza cenas e coleções'
            },
            'properties': {
                'Tool': '🔧 Ferramenta ativa',
                'Render': '🎨 Opções de renderização',
                'Output': '💾 Configurações de saída',
                'View Layer': '👁️ Camadas de visualização',
                'Scene': '🌐 Configurações da cena',
                'World': '🌌 Ambiente e iluminação',
                'Object': '📦 Propriedades do objeto',
                'Modifier': '🔨 Modificadores',
                'Material': '🎨 Material e shaders',
                'Texture': '📸 Texturas e UVs'
            },
            'timeline': {
                'Dope Sheet': '📊 Dope Sheet para animação',
                'Graph Editor': '📈 Editor de curvas',
                'Drivers': '⚙️ Drivers e expressões'
            },
            'uv': {
                'Image': '🖼️ Imagem UV',
                'Overlays': '👁️ Sobreposições',
                'Display': '🎨 Opções de exibição'
            },
            'shader': {
                'Shaders': '🎨 Nós de shader',
                'Geometry': '🔷 Nós de geometria',
                'Texture': '📸 Nós de textura'
            },
            'text': {
                'Editor': '📝 Editor de texto',
                'Properties': '⚙️ Propriedades',
                'Find': '🔍 Buscar e substituir'
            },
            'file': {
                'Files': '📁 Navegador de arquivos',
                'Favorites': '⭐ Favoritos',
                'Recent': '🕐 Arquivos recentes'
            },
            'console': {
                'Output': '📤 Saída do console',
                'Python': '🐍 Console Python',
                'Info': 'ℹ️ Informações'
            },
            'dope': {
                'Dope Sheet': '📊 Dope Sheet',
                'Action Editor': '🎬 Editor de ações',
                'Shape Key': '🔑 Shape Keys'
            },
            'graph': {
                'F-Curve': '📈 Curvas F',
                'Driver': '⚙️ Drivers',
                'Keyframe': '🔑 Keyframes'
            },
            'seq': {
                'Sequencer': '🎬 Sequenciador',
                'Preview': '👁️ Preview',
                'Effect Strip': '✨ Effect Strips'
            }
        };

        const content = contentMap[window.typeId]?.[window.activeTab];
        if (window.typeId === '3dview' && window.activeTab === 'View') {
            return content || `<div class="three-view-host" data-three-view-host="${window.id}"></div>`;
        }
        return content ? `<p>${content}</p>` : `<p>Conteúdo de ${window.name}</p>`;
    }

    setupThreeViews() {
        const existingIds = new Set();

        Array.from(this.windows.values()).forEach((windowData) => {
            if (windowData.typeId !== '3dview') return;
            const viewHost = this.container.querySelector(`[data-window-id="${windowData.id}"] .three-view-host`);
            if (!viewHost) return;

            existingIds.add(windowData.id);
            const previousEngine = this.viewEngines.get(windowData.id);
            if (previousEngine) {
                // Check if the container is still the same
                if (previousEngine.container === viewHost) {
                    previousEngine.renderManager?.resize();
                    return;
                } else {
                    // Container changed, move the canvas to the new host
                    const canvas = previousEngine.renderManager?.renderer?.domElement;
                    if (canvas && canvas.parentElement) {
                        canvas.parentElement.removeChild(canvas);
                        viewHost.appendChild(canvas);
                    }
                    previousEngine.container = viewHost;
                    previousEngine.renderManager?.resize();
                    // Update resize observer
                    const oldObserver = this.viewResizeObservers.get(windowData.id);
                    if (oldObserver) {
                        oldObserver.disconnect();
                    }
                    if (window.ResizeObserver) {
                        const resizeObserver = new ResizeObserver(() => {
                            previousEngine.renderManager?.resize();
                        });
                        resizeObserver.observe(viewHost);
                        this.viewResizeObservers.set(windowData.id, resizeObserver);
                    }
                    return;
                }
            }

            const engine = new WAVEOnlineEngine(viewHost);
            engine.init().then(() => {
                engine.start();
                engine.renderManager?.resize();
                window.engine = engine;
            }).catch((error) => {
                console.error('Failed to initialize WAVEOnlineEngine for 3D view:', error);
            });

            if (window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(() => {
                    engine.renderManager?.resize();
                });
                resizeObserver.observe(viewHost);
                this.viewResizeObservers.set(windowData.id, resizeObserver);
            }

            this.viewEngines.set(windowData.id, engine);
        });

        this.viewEngines.forEach((engine, windowId) => {
            if (!existingIds.has(windowId)) {
                engine.dispose?.();
                this.viewEngines.delete(windowId);
                const observer = this.viewResizeObservers.get(windowId);
                if (observer) {
                    observer.disconnect();
                    this.viewResizeObservers.delete(windowId);
                }
            }
        });
    }

    disposeThreeViews() {
        this.viewEngines.forEach((engine, windowId) => {
            engine.dispose?.();
            const observer = this.viewResizeObservers.get(windowId);
            if (observer) {
                observer.disconnect();
                this.viewResizeObservers.delete(windowId);
            }
        });
        this.viewEngines.clear();
        this.viewResizeObservers.clear();
    }

    getWindowPanel(window, panelKey) {
        const open = panelKey === 'n' ? window.context?.nPanelOpen : window.context?.tPanelOpen;
        const panel = this.getShortcutPanel(window.typeId, panelKey);
        if (!open || !panel) return '';

        return `
            <aside class="dynamic-window-panel panel-${panelKey}">
                <h3>${panel.title}</h3>
                <ul>
                    ${panel.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </aside>
        `;
    }

    getShortcutPanel(typeId, panelKey = null) {
        const panels = {
            '3dview': {
                n: {
                    title: 'Painel N (Right Sidebar)',
                    items: [
                        'Transform: local/global, escala, rotação',
                        'View: camera, floor, grid, shading',
                        '3D Cursor: posição e alinhamento',
                        'Background Image: configurar referências'
                    ]
                },
                t: {
                    title: 'Painel T (Tool Shelf)',
                    items: [
                        'Modo de objeto: selecionar, mover, rotacionar',
                        'Ferramentas auxiliares: extrude, bevel, inset',
                        'Opções de transformação',
                        'Histórico rápido de operações'
                    ]
                }
            },
            'shader': {
                n: {
                    title: 'Pane N Shader',
                    items: ['Lista de nodes', 'Parâmetros de textura', 'Entradas/saídas de material']
                },
                t: {
                    title: 'Pane T Shader',
                    items: ['Nós auxiliares', 'Pré-visualização', 'Ajustes rápidos']
                }
            },
            'timeline': {
                n: {
                    title: 'Pane N Timeline',
                    items: ['Marcadores', 'Intervalos de tempo', 'Opções de exibição']
                },
                t: {
                    title: 'Pane T Timeline',
                    items: ['Ferramentas de edição', 'Snap', 'Keyframes']
                }
            }
        };

        if (!typeId || !panels[typeId]) return null;
        if (!panelKey) return panels[typeId];
        return panels[typeId][panelKey] || null;
    }

    handleShortcut(key) {
        const active = this.windows.get(this.activeWindow);
        if (!active) return;

        const panel = this.getShortcutPanel(active.typeId, key);
        if (!panel) return;

        active.context = active.context || {};
        if (key === 'n') {
            active.context.nPanelOpen = !active.context.nPanelOpen;
        }
        if (key === 't') {
            active.context.tPanelOpen = !active.context.tPanelOpen;
        }
        active.context.info = `${key.toUpperCase()}: ${panel.title}`;
        this.saveState();
        this.render();
        this.updateStatusBar();
    }

    setupResizeHandles() {
        const handles = this.container.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            handle.onmousedown = (event) => {
                event.stopPropagation();
                const windowEl = handle.closest('.dynamic-window');
                if (!windowEl) return;
                const windowId = windowEl.dataset.windowId;
                this.beginResize(windowId, handle.dataset.dir, event);
            };
        });
    }

    beginResize(windowId, dir, event) {
        const target = this.container.querySelector(`[data-window-id="${windowId}"]`);
        if (!target) return;

        this.resizeState = {
            windowId,
            dir,
            startX: event.clientX,
            startY: event.clientY,
            startWidth: target.offsetWidth,
            startHeight: target.offsetHeight,
            target
        };

        document.addEventListener('mousemove', this.onResizeMove);
        document.addEventListener('mouseup', this.endResize);
    }

    onResizeMove = (event) => {
        if (!this.resizeState) return;

        const state = this.resizeState;
        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        const minWidth = 220;
        const minHeight = 160;

        if (state.dir === 'right' || state.dir === 'corner') {
            state.target.style.width = `${Math.max(minWidth, state.startWidth + dx)}px`;
        }
        if (state.dir === 'bottom' || state.dir === 'corner') {
            state.target.style.height = `${Math.max(minHeight, state.startHeight + dy)}px`;
        }
    }

    endResize = (event) => {
        if (!this.resizeState) return;
        const state = this.resizeState;
        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;

        document.removeEventListener('mousemove', this.onResizeMove);
        document.removeEventListener('mouseup', this.endResize);

        const windowData = this.windows.get(state.windowId);
        if (windowData) {
            windowData.width = state.target.offsetWidth;
            windowData.height = state.target.offsetHeight;
        }

        if (state.dir === 'right' && dx > 120) {
            const active = this.windows.get(this.activeWindow);
            if (active) this.createWindow(active.typeId);
        }
        if (state.dir === 'bottom' && dy > 120) {
            const active = this.windows.get(this.activeWindow);
            if (active) this.createWindow(active.typeId);
        }

        this.resizeState = null;
        this.saveState();
    }

    updateResizeHandles() {
        const windows = Array.from(this.container.querySelectorAll('.dynamic-window'));
        const containerRect = this.container.getBoundingClientRect();
        windows.forEach(windowEl => {
            const rect = windowEl.getBoundingClientRect();
            const rightHandle = windowEl.querySelector('.resize-right');
            const bottomHandle = windowEl.querySelector('.resize-bottom');
            const corner = windowEl.querySelector('.resize-corner');

            if (rightHandle) {
                rightHandle.style.display = rect.right >= containerRect.right - 5 ? 'none' : 'block';
            }
            if (bottomHandle) {
                bottomHandle.style.display = rect.bottom >= containerRect.bottom - 5 ? 'none' : 'block';
            }
            if (corner) {
                corner.style.display = (rect.right >= containerRect.right - 5 && rect.bottom >= containerRect.bottom - 5) ? 'none' : 'block';
            }
        });
    }

    setupWindowControlListeners() {
        const root = this.header || this.container.parentElement;
        const newBtn = root.querySelector('.window-btn-new');
        const addRowBtn = root.querySelector('.window-btn-add-row');
        const removeRowBtn = root.querySelector('.window-btn-remove-row');
        const addColBtn = root.querySelector('.window-btn-add-col');
        const removeColBtn = root.querySelector('.window-btn-remove-col');
        const closeAllBtn = root.querySelector('.window-btn-close-all');
        const typeSelect = root.querySelector('#window-type-select');
        const windowTabs = root.querySelectorAll('.window-tab');
        const tabCloseButtons = root.querySelectorAll('.window-tab-close');

        newBtn?.addEventListener('click', () => {
            if (typeSelect.value) {
                this.createWindow(typeSelect.value);
                typeSelect.value = '';
            }
        });

        addRowBtn?.addEventListener('click', () => {
            this.insertGridRowForActive();
        });

        removeRowBtn?.addEventListener('click', () => {
            this.removeEmptyGridRow();
        });

        addColBtn?.addEventListener('click', () => {
            this.insertGridColumnForActive();
        });

        removeColBtn?.addEventListener('click', () => {
            this.removeEmptyGridColumn();
        });

        typeSelect?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.createWindow(e.target.value);
                e.target.value = '';
            }
        });

        closeAllBtn?.addEventListener('click', () => this.closeAll());

        windowTabs?.forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (!e.target.classList.contains('window-tab-close')) {
                    this.setActiveWindow(tab.dataset.windowId);
                }
            });
        });

        tabCloseButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeWindow(btn.dataset.windowId);
            });
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                const typeSelect = this.header?.querySelector('#window-type-select') || this.container.parentElement.querySelector('#window-type-select');
                typeSelect?.focus();
            }

            if (e.ctrlKey && e.key.toLowerCase() === 'w' && this.activeWindow) {
                e.preventDefault();
                this.closeWindow(this.activeWindow);
            }

            if (!e.ctrlKey && !e.metaKey && this.activeWindow && ['n', 't'].includes(e.key.toLowerCase())) {
                this.handleShortcut(e.key.toLowerCase());
            }

            if (e.key === 'Escape') {
                // Escape does not use a separate aside panel in this layout.
            }
        });
    }

    updateStatusBar() {
        if (!this.statusMessage || !this.footerShortcuts) return;

        const active = this.windows.get(this.activeWindow);
        this.statusMessage.textContent = active ? `${active.icon} ${active.name} ativo` : 'Nenhuma janela ativa';

        if (!active) {
            this.footerShortcuts.textContent = 'Use N/T para atalhos no painel ativo.';
            return;
        }

        const nPanel = this.getShortcutPanel(active.typeId, 'n');
        const tPanel = this.getShortcutPanel(active.typeId, 't');
        const nLabel = nPanel?.title || 'N';
        const tLabel = tPanel?.title || 'T';

        this.footerShortcuts.textContent = `N: ${nLabel} | T: ${tLabel}`;
    }

    saveState() {
        const state = {
            version: 2,
            windows: Array.from(this.windows.values()),
            activeWindow: this.activeWindow,
            windowOrder: this.windowOrder
        };

        fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        }).catch(err => console.warn('Failed to save window state:', err));
    }

    async loadState() {
        try {
            const response = await fetch(this.apiUrl);
            const state = await response.json();

            if (state.windows && state.windows.length > 0) {
                state.windows.forEach(windowData => {
                    windowData.rowSpan = windowData.rowSpan || 1;
                    windowData.colSpan = windowData.colSpan || 1;
                    this.windows.set(windowData.id, windowData);
                });
                this.windowOrder = state.windowOrder || Array.from(this.windows.keys());
                this.activeWindow = state.activeWindow || this.windowOrder[0];
                this.render();
                console.log('✅ Window state loaded');
            }
        } catch (err) {
            console.warn('Failed to load window state:', err);
        }
    }
}

export { DynamicWindowManager };
