# Changelog de Desenvolvimento

## 2026-05-13

### Sistema BlenderInterface (Interface Nativa WebGL)
- Criado `assets/js/ui/BlenderInterface.js` (1200+ linhas)
  - **GHOST**: Gerenciamento de contexto WebGL, eventos e entrada de dispositivos
  - **WindowManager**: Gerencia janelas, eventos, mapas de teclado
  - **Interface**: Renderiza UI elements usando WebGL (botões, layouts, menus)
  - **Theme**: Sistema de temas Dark/Light igual ao Blender

### Componentes Principais (igual Blender)
- **GHOST**: Responsável por WebGL context, janelas, eventos e entrada
- **WindowManager**: Gerencia janelas, eventos e mudanças de dados
- **Interface**: Desenha botões, manipula eventos, layouts e menus
- **Theme**: Alterna entre temas "Blender Dark" e "Blender Light"

### Funcionalidades WebGL
- ✅ **Interface nativa**: Desenhada diretamente com WebGL (igual Blender)
- ✅ **Mesma aparência**: Visual idêntico ao Blender em Windows/Linux/macOS
- ✅ **Flexibilidade total**: Subdividir áreas, arrastar janelas, layouts personalizáveis
- ✅ **Temas nativos**: Dark (padrão) e Light como no Blender
- ✅ **Janelas nomeadas**: Cada área tem nome e abas com propriedades

### Layout Padrão Blender
```
┌─────────────────────────────────────────────────────────┐
│ File  Edit  Game  Window  Help              [Templates] │ ← Top Bar
├─────────────────┬─────────────────────┬─────────────────┤
│ 3D View         │ Outliner            │ Properties      │
│ 🎥 Canvas 3D    │ 🌳 Lista objetos    │ 📋 Props        │
│ View Animation  │ Current File        │ Tool Render     │
│ Scripting       │ Scenes              │ Output View     │
│                 │                     │ Layer Scene     │
│                 │                     │ World Object    │
│                 │                     │ Modifier        │
│                 │                     │ Material        │
│                 │                     │ Texture         │
├─────────────────┴─────────────────────┴─────────────────┤
│ Timeline                                            ▶️  │ ← Timeline
│ Dope Sheet  Graph Editor  Drivers                      │
└─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
  Status Bar: coordenadas, modo, etc.
```

### Temas CSS Completos
- Criado `assets/css/blender-themes.css` (500+ linhas)
- **Tema Dark**: Cores idênticas ao Blender Dark
- **Tema Light**: Cores idênticas ao Blender Light
- **Responsividade**: Adapta automaticamente ao tamanho da tela
- **High DPI**: Suporte a displays de alta resolução
- **Animações**: Transições suaves igual ao Blender

### Integração com Three.js
- Canvas 3D integrado como textura na área 3D View
- Aspect ratio automático da câmera
- Eventos coordenados entre interface WebGL e Three.js
- Context awareness para shortcuts N/T

### Atualizações do Sistema
- Atualizado `app.js` para usar `BlenderInterface` em vez de `SmartLayout`
- Atualizado `ShortcutManager` para trabalhar com interface WebGL
- Atualizado `index.php` com classes CSS do Blender
- Mantido `ShortcutManager` com context awareness completo

---

## 2026-05-12

### Sistema SmartLayout (Layout Inteligente Tipo Blender)
- Criado `assets/js/ui/SmartLayout.js` (700+ linhas)
  - **Hierarquia de painéis**: 0=principal (azul), 1+=subordinados (laranja/vermelho)
  - **Redimensionamento inteligente**: limites min/max, hierarquia respeitada
  - **Aspect ratio automático**: 3D View atualiza câmera Three.js dinamicamente
  - **CSS Grid responsivo**: se adapta ao tamanho da tela automaticamente
  - **Context-aware completo**: shortcuts funcionam baseado na posição do mouse
  - **Persistência robusta**: localStorage com fallback para padrão

### Funcionalidades do SmartLayout
- ✅ **Hierarquia visual**: cores diferentes por nível (azul/laranja/vermelho)
- ✅ **Limites de redimensionamento**: min 200x150px, max 80% viewport
- ✅ **Redimensionamento hierárquico**: aba posterior não afeta anterior
- ✅ **Aspect ratio 3D**: câmera se ajusta automaticamente ao painel
- ✅ **Layout dinâmico**: CSS Grid inteligente distribui espaço
- ✅ **Responsividade**: se adapta a telas menores automaticamente
- ✅ **Context awareness**: N/T funcionam onde mouse está
- ✅ **Abas inteligentes**: + button adiciona abas sem quebrar layout

### CSS Inteligente
- Adicionado `.smart-layout-container` com CSS Grid automático
- Adicionado `.smart-panel` com hierarquia visual
- Adicionado `.smart-resize-handle` com cores por hierarquia
- Media queries para responsividade automática
- Animações suaves para redimensionamento

### Integração
- Atualizado `app.js` para usar `SmartLayout` em vez de `DynamicLayout`
- Mantido `ShortcutManager` com context awareness
- Canvas Three.js integrado ao painel 3D View com aspect ratio dinâmico

---

## 2026-05-11

### Sistema de Janelas Dockables (UPBGE Style)
- Criado `assets/js/ui/WindowLayout.js`
  - Layout de janelas redimensionáveis estilo UPBGE 0.2.5
  - Headers com contexto dropdown em cascata
  - Redimensionamento por qualquer lado (top, bottom, left, right)
  - Botão X para fechar (contexto salvo em localStorage)
  - Layout padrão: 3D View (70%x60%), Text Editor (70%x40%), Outliner (30%x30%), Properties (30%x30%)
  - Menu top bar com File, Edit, Game, Window, Help
  - Templates selector e scene name input no topo

### UI e Interação (Continuação)
- Criado `assets/js/ui/ShortcutManager.js` com atalhos de teclado
  - Modo Objeto: G(mover), R(rotacionar), S(escalar), X(deletar), Tab(editar), etc
  - Modo Edição: 1(vértice), 2(aresta), 3(face), Tab(objeto), E(extrude), etc
- Criado `assets/js/ui/PreferencesManager.js` com preferências persistentes
  - Salvo em localStorage
- Criado `assets/js/ui/AddonManager.js` para sistema de addons

### Estilos
- Adicionado `.wave-topbar` com menu horizontal
- Adicionado `.dockable-window` com header estilo UPBGE
- Adicionado `.resize-handle` para redimensionamento em 4 direções
- Context menu em cascata para trocar tipo de janela

### Motor
- Ajustado `assets/js/engine/SceneManager.js` para Z-up orientation
- Ajustado `assets/js/engine/WAVEOnlineEngine.js` com camera.up = (0,0,1)
- GameObject com propriedades editáveis

---

## Pautas de documentação

- Sempre descreva novos métodos e classes em `docs/API.md`.
- Sempre registre mudanças de comportamento em `docs/CHANGELOG.md`.
