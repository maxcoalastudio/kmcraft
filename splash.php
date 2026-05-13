<?php
/**
 * KM Craft - Splash Screen
 * Exibido durante o carregamento inicial
 */
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KM Craft - Carregando...</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: #1a1a1a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .splash {
            text-align: center;
            animation: fadeIn 0.5s ease;
        }
        
        .logo {
            font-size: 80px;
            margin-bottom: 20px;
            animation: bounce 1s ease infinite;
        }
        
        .title {
            font-size: 36px;
            font-weight: bold;
            color: #00BFFF;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        
        .subtitle {
            font-size: 14px;
            color: #888;
            margin-bottom: 30px;
        }
        
        .progress-bar {
            width: 300px;
            height: 4px;
            background: #333;
            border-radius: 2px;
            overflow: hidden;
            margin: 20px auto;
        }
        
        .progress-fill {
            width: 0%;
            height: 100%;
            background: #00BFFF;
            border-radius: 2px;
            transition: width 0.3s ease;
        }
        
        .status {
            font-size: 12px;
            color: #aaa;
            font-family: monospace;
        }
        
        .version {
            position: fixed;
            bottom: 20px;
            left: 20px;
            font-size: 10px;
            color: #555;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    </style>
</head>
<body>
    <div class="splash">
        <div class="logo">🎨</div>
        <div class="title">WAVE Online</div>
        <div class="subtitle">WAVE online - Three.js Edition</div>
        <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div class="status" id="status-text">Inicializando...</div>
        <div class="version">v1.0.0 | Baseado no Blender UPBGE 2.5</div>
    </div>
    
    <script>
        const steps = [
            { text: "Inicializando Three.js...", progress: 10 },
            { text: "Configurando cena 3D...", progress: 25 },
            { text: "Carregando shaders...", progress: 40 },
            { text: "Inicializando Game Engine...", progress: 60 },
            { text: "Carregando módulos...", progress: 80 },
            { text: "Pronto!", progress: 100 }
        ];
        
        let currentStep = 0;
        const fill = document.getElementById('progress-fill');
        const statusText = document.getElementById('status-text');
        
        function updateProgress() {
            if (currentStep < steps.length) {
                const step = steps[currentStep];
                fill.style.width = step.progress + '%';
                statusText.textContent = step.text;
                currentStep++;
                setTimeout(updateProgress, step.progress === 100 ? 500 : 300);
            } else {
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
            }
        }
        
        updateProgress();
    </script>
</body>
</html>