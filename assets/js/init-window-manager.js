const initWindowManager = async () => {
    const container = document.getElementById('grid-container');
    if (!container) {
        console.error('Grid container not found: #grid-container');
        return;
    }

    try {
        console.log('init-window-manager: starting');
        const [{ DynamicWindowManager }, { WindowFactory }] = await Promise.all([
            import('/assets/js/dynamic-window-manager.js'),
            import('/assets/js/window-factory.js')
        ]);

        window.WindowFactory = WindowFactory;
        window.DynamicWindowManager = DynamicWindowManager;

        const windowManager = new DynamicWindowManager('#grid-container', '/layout_api.php');
        await windowManager.loadState();

        if (windowManager.windows.size === 0) {
            const rect = windowManager.container.getBoundingClientRect();
            const leftWidth = Math.max(420, Math.round(rect.width * 0.65));
            const rightWidth = Math.max(320, rect.width - leftWidth - 24);
            const halfHeight = Math.max(240, Math.round(rect.height * 0.5) - 12);

            windowManager.createWindow('3dview', {
                x: 10,
                y: 10,
                width: leftWidth,
                height: rect.height - 20
            });

            windowManager.createWindow('properties', {
                x: leftWidth + 20,
                y: 10,
                width: rightWidth,
                height: halfHeight
            });

            windowManager.createWindow('outliner', {
                x: leftWidth + 20,
                y: halfHeight + 20,
                width: rightWidth,
                height: rect.height - halfHeight - 30
            });
        }

        window.windowManager = windowManager;
        console.log('✅ Dynamic Window Manager ready!');
    } catch (error) {
        console.error('Failed to initialize Dynamic Window Manager:', error);
        const errorContainer = document.getElementById('grid-container');
        if (errorContainer) {
            errorContainer.innerHTML = `<div class="init-error">Erro ao inicializar o window manager: ${error?.message || 'unknown'}</div>`;
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWindowManager);
} else {
    initWindowManager();
}
