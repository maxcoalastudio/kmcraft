<?php
/**
 * KM Craft - Blender UPBGE 2.5 Clone com Three.js
 * @version 1.0.0
 */

session_start();
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

define('KM_VERSION', '1.0.0');
define('KM_NAME', 'KM Craft');
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>WAVE online - WAVE Online Motor</title>
    
    <!-- Styles -->
    <link rel="stylesheet" href="/assets/css/main.css">
    <link rel="stylesheet" href="/assets/css/blender-ui.css">
    <link rel="stylesheet" href="/assets/css/panels.css">
    <link rel="stylesheet" href="/assets/css/blender-themes.css">
    <link rel="stylesheet" href="/assets/css/blender-layout.css">
    <link rel="stylesheet" href="/assets/css/dynamic-windows.css">
    
    <!-- Import Map -->
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.128.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.128.0/examples/jsm/"
            }
        }
    </script>
</head>
<body>
    <div id="app" class="blender-interface blender-theme-dark">
        <header class="blender-header">
            <nav class="blender-topbar">
                <div class="menu-item" data-menu="File">File</div>
                <div class="menu-item" data-menu="Edit">Edit</div>
                <div class="menu-item" data-menu="Game">Game</div>
                <div class="menu-item" data-menu="Window">Window</div>
                <div class="menu-item" data-menu="Help">Help</div>
            </nav>
            <div id="window-control-bar-placeholder" class="window-control-bar"></div>
        </header>

        <article class="workspace">
            <main class="workspace-area">
                <div class="layout-grid-container" id="grid-container"></div>
            </main>
        </article>

        <footer class="blender-footer">
            <span id="status-message">✅ WAVE Online pronto - Dynamic Window Manager</span>
            <span id="footer-shortcuts">Shortcuts: N/T no painel ativo</span>
        </footer>

        <div id="loading-overlay" class="loading-overlay" style="display: none;">
            <div class="spinner"></div>
            <span>Carregando WAVE Online...</span>
        </div>
    </div>

    <script type="module" src="/assets/js/init-window-manager.js"></script>
</body>
</html>