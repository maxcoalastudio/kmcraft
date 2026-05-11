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
    <title>KM Craft - UPBGE 2.5 Clone</title>
    
    <!-- Styles -->
    <link rel="stylesheet" href="/assets/css/main.css">
    <link rel="stylesheet" href="/assets/css/blender-ui.css">
    <link rel="stylesheet" href="/assets/css/panels.css">
    
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
    <div id="app">
        <div id="canvas-container"></div>
        
        <!-- Status Bar -->
        <div id="status-bar" class="status-bar">
            <span>✅ Pronto</span>
            <span id="status-coords"></span>
        </div>
        
        <!-- Loading -->
        <div id="loading-overlay" class="loading-overlay" style="display: none;">
            <div class="spinner"></div>
            <span>Carregando...</span>
        </div>
    </div>
    
    <script type="module" src="/assets/js/main.js"></script>
</body>
</html>