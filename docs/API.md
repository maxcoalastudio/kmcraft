# WAVE Online API

Esta documentação descreve a API dos módulos principais do motor WAVE Online.
Atualize este arquivo sempre que fizer alterações relevantes em comportamentos ou nas interfaces.

## Estrutura do Motor

- `assets/js/engine/WAVEOnlineEngine.js`
- `assets/js/engine/SceneManager.js`
- `assets/js/editor/EditorManager.js`
- `assets/js/gameobjects/GameObject.js`
- `assets/js/engine/RenderManager.js`
- `assets/js/physics/PhysicsWorld.js`
- `assets/js/app.js`

---

## `WAVEOnlineEngine`

Classe principal do motor.

### Construtor

```js
new WAVEOnlineEngine(container)
```

- `container`: elemento DOM onde o canvas WebGL será inserido.

### Métodos

- `async init()`
  - Inicializa a cena, câmera, renderizador, editor e redimensionamento.
  - Retorna `true` quando concluído.

- `start()`
  - Inicia o loop principal de atualização e renderização.

- `stop()` / `pause()`
  - Para o loop de execução.

- `resume()`
  - Retoma o loop se estiver pausado.

- `switchMode(mode)`
  - Alterna entre `editor` e `runtime`.
  - No modo `runtime`, desabilita controles e gizmos de editor.

- `getEditorManager()`
  - Retorna a instância de `EditorManager`.

### Internos

- `createCamera()`
  - Cria `PerspectiveCamera` para a cena.

---

## `SceneManager`

Gerencia a cena Three.js e os `GameObject`s.

### Convenção de eixos

O projeto usa a convenção Z como eixo vertical (`up/down`) e Y como eixo frontal (`forward/back`).

- `Z` = cima/baixo
- `Y` = frente/trás
- `X` = eixo lateral

### Propriedades

- `scene`: instância de `THREE.Scene`
- `gameObjects`: lista de `GameObject`
- `selectedGameObject`: objeto atualmente selecionado

### Métodos

- `init()`
  - Cria a cena, configura o fundo, grid e luzes.
  - Retorna a cena.

- `setupGrid()`
  - Adiciona `GridHelper` à cena.

- `setupLights()`
  - Adiciona luzes ambiente, direcional e pontual.

- `configureCamera(camera)`
  - Ajusta `camera.up` e centraliza a câmera no alvo.

- `createDefaultScene()`
  - Cria e adiciona um `GameObject` padrão à cena.

- `addGameObject(gameObject)`
  - Adiciona `gameObject.mesh` à cena e registra em `gameObjects`.

- `removeGameObject(gameObject)`
  - Remove o `GameObject` da cena e da lista.

- `selectGameObject(gameObject)`
  - Define o `gameObject` como selecionado.

- `getSelectedGameObject()`
  - Retorna o `GameObject` selecionado.

- `getAllGameObjects()`
  - Retorna a lista de `GameObject`s.

- `getGameObjectCount()`
  - Retorna o número de objetos registrados.

- `update(deltaTime, inputManager, physicsWorld)`
  - Atualiza cada `GameObject` a cada frame.

---

## `EditorManager`

Gerencia controles de editor e modos de edição.

### Propriedades

- `orbitControls`: instância de `OrbitControls`
- `transformGizmo`: instância de `TransformControls`
- `editMode`: instância de `EditMode`
- `objectMode`: instância de `ObjectMode`
- `currentMode`: `object` ou `edit`

### Métodos

- `switchMode(mode)`
  - Alterna entre modo objeto e modo edição.

- `updateMode()`
  - Executa transição interna dos modos.

- `update(deltaTime)`
  - Atualiza os controles orbitais e o modo de edição.

- `updateStatus(message)`
  - Atualiza o texto do `status-bar`.

---

## `GameObject`

Representa um objeto de jogo com componentes e lógica.

### Construtor

```js
new GameObject(name, mesh)
```

- `name`: nome do objeto.
- `mesh`: `THREE.Mesh` opcional.

### Propriedades

- `mesh`: malha 3D
- `components`: `Map` de componentes
- `children`: lista de filhos
- `parent`: pai opcional
- `isActive`: ativo/desativado
- `userData`: dados personalizados
- `logicBricks`: sensores, controladores e atuadores
- `position`, `rotation`, `scale`

### Observações

- O `GameObject` escreve informações de edição em `mesh.userData` para compatibilidade com o editor.

---

## `RenderManager`

Cuida do `WebGLRenderer` e do redimensionamento.

### Construtor

```js
new RenderManager(container, scene, camera)
```

### Métodos

- `resize()`
  - Ajusta tamanho do renderer ao container.

- `render(deltaTime)`
  - Renderiza a cena.

---

## Uso inicial

No `index.php`:

```html
<script type="module" src="/assets/js/app.js"></script>
```

No `app.js`:

```js
import { WAVEOnlineEngine } from './engine/WAVEOnlineEngine.js';
import { UIDockManager } from './ui/UIDockManager.js';

const container = document.getElementById('canvas-container');
const engine = new WAVEOnlineEngine(container);
const uiManager = new UIDockManager(container, engine);

window.addEventListener('DOMContentLoaded', async () => {
  await engine.init();
  engine.start();
});
```

---

## `UIDockManager`

Gerencia a interface dockable com painéis redimensionáveis estilo Blender.

### Propriedades

- `container`: elemento DOM do canvas
- `engine`: instância do motor
- `selectedContext`: categoria selecionada
- `selectedSubContext`: subcategoria selecionada
- `shortcutManager`: instância de `ShortcutManager`
- `preferencesManager`: instância de `PreferencesManager`
- `addonManager`: instância de `AddonManager`

### Métodos

- `init()`
  - Inicializa layout, painéis e listeners.

- `toggleCategory(categoryId)`
  - Abre/fecha uma categoria no menu esquerdo.

- `selectSubContext(categoryId, subId)`
  - Seleciona uma subcategoria.

- `renderContent()`
  - Renderiza o conteúdo dinâmico do painel direito.

### Categorias Disponíveis

- `scene`: Background, Grid, Lights, Environment
- `object`: Transform, Material, Physics
- `render`: Render Settings, Post Processing
- `game`: Logic Bricks, Physics
- `shortcuts`: Modo Objeto, Modo Edição
- `preferences`: Interface, Viewport, Editor, Performance, Autosave
- `addons`: Instalados, Disponíveis

---

## `SmartLayout`

Sistema de layout inteligente tipo Blender com hierarquia e redimensionamento dinâmico.

### Construtor

```js
new SmartLayout(container, engine)
```

- `container`: elemento DOM do canvas
- `engine`: instância do motor

### Propriedades

- `minSize`: `{ width: 200, height: 150 }` - Tamanho mínimo em pixels
- `maxSize`: `{ width: 0.8, height: 0.8 }` - Tamanho máximo (% do viewport)
- `panels`: Map de painéis com hierarquia
- `activePanel`: Painel onde o mouse está (context-aware)

### Métodos

- `createPanel(panelId, config)`
  - Cria painel com configuração de hierarquia
  - `config`: `{ x, y, width, height, hierarchy, tabs }`

- `activateTab(panelId, tabType)`
  - Ativa aba específica em um painel

- `addTabToPanel(panelId, tab)`
  - Adiciona nova aba a um painel existente

- `closeTab(panelId, tabType)`
  - Fecha aba (contexto salvo se houver outras)

- `startResize(event, panelId, direction)`
  - Inicia redimensionamento com limites hierárquicos

- `updateLayout()`
  - Redistribui espaço baseado na hierarquia

- `update3DViewAspectRatio()`
  - Atualiza aspect ratio da câmera 3D automaticamente

- `getActiveContext()`
  - Retorna contexto da aba ativa onde mouse está

- `saveLayoutToStorage()`
  - Salva layout em localStorage

- `loadLayoutFromStorage()`
  - Carrega layout salvo ou padrão

### Sistema de Hierarquia

Painéis têm níveis de hierarquia (0 = principal, 1+ = subordinados):

- **Hierarquia 0**: 3D View (azul) - não pode ser redimensionado por inferiores
- **Hierarquia 1**: Outliner/Properties (laranja) - pode redimensionar dentro dos limites
- **Hierarquia 2+**: Vermelho - máxima flexibilidade

### Redimensionamento Inteligente

- **Limites Mín/Máx**: Respeita `minSize` e `maxSize`
- **Hierarquia**: Painéis inferiores não afetam superiores
- **Aspect Ratio**: 3D View atualiza câmera automaticamente
- **Responsividade**: CSS Grid se adapta ao tamanho da tela

### Layout Padrão

```
┌─────────────────────┬──────────────────┐
│ 3D View (H:0)       │ Outliner (H:1)   │
│ ├─ Canvas 3D        │ Properties (H:1) │
│                     │                  │
└─────────────────────┴──────────────────┘
```

### Persistência

- `localStorage['wave_smart_layout']`: Layout completo com hierarquia
- Carrega automaticamente ao iniciar
- Fallback para layout padrão se corrompido

---

Gerencia o layout de janelas dockables estilo UPBGE 0.2.5.

### Construtor

```js
new WindowLayout(container, engine)
```

- `container`: elemento DOM do canvas
- `engine`: instância do motor

### Métodos

- `createWindow(id, title, icon, options)`
  - Cria uma nova janela dockable.
  - `options`: `{ x, y, width, height, type, hidden }`

- `changeWindowType(windowId, newType)`
  - Muda o tipo/contexto de uma janela.
  - Tipos: `3d`, `outliner`, `properties`, `text-editor`, `uv-editor`, `timeline`, `console`

- `closeWindow(windowId)`
  - Fecha uma janela (contexto salvo).

- `openWindow(windowId)`
  - Reabre uma janela fechada.

- `saveLayoutToStorage()`
  - Salva o layout em localStorage.

- `loadLayoutFromStorage()`
  - Carrega layout salvo.

### Layout Padrão

- **3D View**: 70% largura × 60% altura (topo-esquerda)
- **Text Editor**: 70% largura × 40% altura (embaixo do 3D View)
- **Outliner**: 30% largura × 30% altura (topo-direita)
- **Properties**: 30% largura × 30% altura (abaixo do Outliner)
- **UV Editor**: escondido por padrão
- **Timeline**: escondido por padrão

### Menu Top Bar

- **File, Edit, Game, Window, Help**: menus principais
- **Templates**: seletor de templates de cena
- **Scene Name**: input para nomear a cena

---

Gerencia atalhos de teclado para modos objeto e edição.

### Construtor

```js
new ShortcutManager(engine)
```

### Métodos

- `setMode(mode)`
  - Define o modo ativo (`object` ou `edit`).

- `getShortcuts(mode)`
  - Retorna lista de atalhos do modo.

### Atalhos Padrão - Modo Objeto

- `G` — Mover (Translate)
- `R` — Rotacionar (Rotate)
- `S` — Escalar (Scale)
- `X` — Deletar
- `D` — Duplicar
- `Tab` — Modo Edição
- `Ctrl+A` — Selecionar Tudo
- `Ctrl+Shift+A` — Desselecionar Tudo

### Atalhos Padrão - Modo Edição

- `1` — Modo Vértice
- `2` — Modo Aresta
- `3` — Modo Face
- `A` — Selecionar Tudo
- `Alt+A` — Desselecionar Tudo
- `G` — Mover
- `R` — Rotacionar
- `S` — Escalar
- `E` — Extrude
- `Tab` — Modo Objeto

---

## `PreferencesManager`

Gerencia preferências e configurações persistentes do motor.

### Construtor

```js
new PreferencesManager()
```

### Métodos

- `get(key, defaultValue)`
  - Retorna valor de uma preferência.

- `set(key, value)`
  - Define e salva uma preferência.

- `getPreferencesByCategory(category)`
  - Retorna todas as preferências de uma categoria.

- `reset()`
  - Restaura preferências padrão.

### Categorias de Preferências

- **interface**: theme, panelOpacity, showGrid, showAxes
- **viewport**: viewportFOV, viewportClipNear, viewportClipFar, viewportShading
- **editor**: transformMode, transformSnap, transformSnapValue, selectionType
- **performance**: shadowsEnabled, maxShadowResolution, antiAliasing, maxFrameRate
- **autosave**: autosaveEnabled, autosaveInterval
- **other**: language, defaultProjectPath

---

## `AddonManager`

Gerencia addons/plugins do motor.

### Construtor

```js
new AddonManager()
```

### Métodos

- `registerAddon(id, addon)`
  - Registra um novo addon.

- `enableAddon(id)`
  - Ativa um addon (verifica dependências).

- `disableAddon(id)`
  - Desativa um addon.

- `getAddon(id)`
  - Retorna instância de um addon.

- `getAllAddons()`
  - Retorna lista de todos os addons.

- `getEnabledAddons()`
  - Retorna lista de addons ativados.

### Estrutura de um Addon

```js
const meuAddon = {
  name: 'Meu Addon',
  version: '1.0.0',
  description: 'Descrição do addon',
  author: 'Seu Nome',
  dependencies: ['outro-addon'],
  enable() {
    // Executado quando o addon é ativado
  },
  disable() {
    // Executado quando o addon é desativado
  }
};

addonManager.registerAddon('meu-addon', meuAddon);
```
