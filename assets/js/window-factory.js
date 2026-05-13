class WindowType {
    constructor(id, name, icon, defaultTabs = []) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.defaultTabs = defaultTabs;
    }
}

class WindowFactory {
    static TYPES = {
        VIEW3D: new WindowType(
            '3dview',
            '3D View',
            '🎥',
            ['View', 'Animation', 'Scripting']
        ),
        OUTLINER: new WindowType(
            'outliner',
            'Outliner',
            '🌳',
            ['All Scenes', 'Current File', 'Scenes']
        ),
        PROPERTIES: new WindowType(
            'properties',
            'Properties',
            '📋',
            ['Tool', 'Render', 'Output', 'View Layer', 'Scene', 'World', 'Object', 'Modifier', 'Material', 'Texture']
        ),
        TIMELINE: new WindowType(
            'timeline',
            'Timeline',
            '⏱️',
            ['Dope Sheet', 'Graph Editor', 'Drivers']
        ),
        UV_EDITOR: new WindowType(
            'uv',
            'UV Editor',
            '🔲',
            ['Image', 'Overlays', 'Display']
        ),
        SHADER_EDITOR: new WindowType(
            'shader',
            'Shader Editor',
            '🎨',
            ['Shaders', 'Geometry', 'Texture']
        ),
        TEXT_EDITOR: new WindowType(
            'text',
            'Text Editor',
            '📝',
            ['Editor', 'Properties', 'Find']
        ),
        FILE_BROWSER: new WindowType(
            'file',
            'File Browser',
            '📁',
            ['Files', 'Favorites', 'Recent']
        ),
        CONSOLE: new WindowType(
            'console',
            'Console',
            '⌨️',
            ['Output', 'Python', 'Info']
        ),
        DOPE_SHEET: new WindowType(
            'dope',
            'Dope Sheet',
            '📊',
            ['Dope Sheet', 'Action Editor', 'Shape Key']
        ),
        GRAPH_EDITOR: new WindowType(
            'graph',
            'Graph Editor',
            '📈',
            ['F-Curve', 'Driver', 'Keyframe']
        ),
        SEQUENCE_EDITOR: new WindowType(
            'seq',
            'Sequence Editor',
            '🎬',
            ['Sequencer', 'Preview', 'Effect Strip']
        )
    };

    static getAllTypes() {
        return Object.values(this.TYPES);
    }

    static getTypeById(id) {
        for (const type of Object.values(this.TYPES)) {
            if (type.id === id) return type;
        }
        return null;
    }

    static createWindow(typeId, instanceId = null) {
        const type = this.getTypeById(typeId);
        if (!type) return null;

        const id = instanceId || `${typeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            id,
            typeId: type.id,
            name: type.name,
            icon: type.icon,
            tabs: [...type.defaultTabs],
            activeTab: type.defaultTabs[0] || '',
            visible: true,
            content: {}
        };
    }
}

export { WindowFactory, WindowType };
