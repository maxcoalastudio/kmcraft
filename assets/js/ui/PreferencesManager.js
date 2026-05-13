/**
 * PreferencesManager - Gerencia configurações e preferências do motor
 */
export class PreferencesManager {
    constructor() {
        this.preferences = {
            // Interface
            theme: 'dark',
            panelOpacity: 0.98,
            showGrid: true,
            showAxes: true,
            
            // Viewport
            viewportFOV: 75,
            viewportClipNear: 0.1,
            viewportClipFar: 1000,
            viewportShading: 'material',
            
            // Editor
            transformMode: 'translate',
            transformSnap: false,
            transformSnapValue: 0.1,
            selectionType: 'vertex',
            
            // Performance
            shadowsEnabled: true,
            maxShadowResolution: 2048,
            antiAliasing: true,
            maxFrameRate: 60,
            
            // Autosave
            autosaveEnabled: true,
            autosaveInterval: 300000, // 5 minutos
            
            // Other
            language: 'pt-BR',
            defaultProjectPath: './'
        };

        this.loadFromStorage();
    }

    loadFromStorage() {
        const stored = localStorage.getItem('wave_preferences');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.preferences = { ...this.preferences, ...parsed };
            } catch (e) {
                console.warn('Erro ao carregar preferências:', e);
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('wave_preferences', JSON.stringify(this.preferences));
    }

    get(key, defaultValue = undefined) {
        return this.preferences[key] ?? defaultValue;
    }

    set(key, value) {
        this.preferences[key] = value;
        this.saveToStorage();
    }

    reset() {
        localStorage.removeItem('wave_preferences');
        location.reload();
    }

    getPreferencesByCategory(category) {
        const categories = {
            interface: ['theme', 'panelOpacity', 'showGrid', 'showAxes'],
            viewport: ['viewportFOV', 'viewportClipNear', 'viewportClipFar', 'viewportShading'],
            editor: ['transformMode', 'transformSnap', 'transformSnapValue', 'selectionType'],
            performance: ['shadowsEnabled', 'maxShadowResolution', 'antiAliasing', 'maxFrameRate'],
            autosave: ['autosaveEnabled', 'autosaveInterval'],
            other: ['language', 'defaultProjectPath']
        };

        const keys = categories[category] || [];
        const result = {};
        keys.forEach(key => {
            result[key] = this.preferences[key];
        });
        return result;
    }
}

/**
 * AddonManager - Gerencia addons/plugins do motor
 */
export class AddonManager {
    constructor() {
        this.addons = new Map();
        this.enabledAddons = new Set();
        this.loadEnabledAddonsFromStorage();
    }

    registerAddon(id, addon) {
        this.addons.set(id, {
            id,
            name: addon.name,
            version: addon.version,
            description: addon.description,
            author: addon.author,
            enabled: this.enabledAddons.has(id),
            module: addon,
            dependencies: addon.dependencies || []
        });
    }

    enableAddon(id) {
        const addon = this.addons.get(id);
        if (!addon) {
            console.warn(`Addon ${id} não encontrado`);
            return false;
        }

        // Verificar dependências
        if (addon.dependencies && addon.dependencies.length > 0) {
            for (const depId of addon.dependencies) {
                if (!this.enabledAddons.has(depId)) {
                    console.warn(`Addon ${id} requer ${depId}`);
                    return false;
                }
            }
        }

        if (addon.module.enable) {
            addon.module.enable();
        }
        this.enabledAddons.add(id);
        addon.enabled = true;
        this.saveEnabledAddonsToStorage();
        return true;
    }

    disableAddon(id) {
        const addon = this.addons.get(id);
        if (!addon) return false;

        // Verificar dependências inversas
        for (const [otherId, other] of this.addons) {
            if (other.dependencies?.includes(id) && this.enabledAddons.has(otherId)) {
                console.warn(`${otherId} depende de ${id}`);
                return false;
            }
        }

        if (addon.module.disable) {
            addon.module.disable();
        }
        this.enabledAddons.delete(id);
        addon.enabled = false;
        this.saveEnabledAddonsToStorage();
        return true;
    }

    getAddon(id) {
        return this.addons.get(id);
    }

    getAllAddons() {
        return Array.from(this.addons.values());
    }

    getEnabledAddons() {
        return Array.from(this.enabledAddons).map(id => this.addons.get(id));
    }

    saveEnabledAddonsToStorage() {
        localStorage.setItem('wave_enabled_addons', JSON.stringify(Array.from(this.enabledAddons)));
    }

    loadEnabledAddonsFromStorage() {
        const stored = localStorage.getItem('wave_enabled_addons');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                parsed.forEach(id => this.enabledAddons.add(id));
            } catch (e) {
                console.warn('Erro ao carregar addons ativados:', e);
            }
        }
    }

    installAddon(id, addon) {
        this.registerAddon(id, addon);
    }

    uninstallAddon(id) {
        this.disableAddon(id);
        this.addons.delete(id);
    }
}
