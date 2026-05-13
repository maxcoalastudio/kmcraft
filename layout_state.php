<?php

// Caminho do arquivo de armazenamento do estado do layout
define('LAYOUT_STATE_FILE', __DIR__ . '/data/layout_state.json');

function ensureLayoutDataDirectory() {
    $dir = dirname(LAYOUT_STATE_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

function getDefaultLayoutState() {
    return [
        'version' => 1,
        'theme' => 'dark',
        'gridLayout' => [
            ['view3d', 'properties'],
            ['outliner', 'timeline']
        ],
        'columnWidths' => [50, 50],
        'rowHeights' => [60, 40],
        'panels' => [
            [
                'id' => 'view3d',
                'title' => '3D View',
                'type' => 'view',
                'tabs' => ['View', 'Animation', 'Scripting'],
                'activeTab' => 'View',
                'visible' => true,
                'row' => 0,
                'col' => 0
            ],
            [
                'id' => 'properties',
                'title' => 'Properties',
                'type' => 'properties',
                'tabs' => ['Tool', 'Render', 'Output', 'View Layer', 'Scene', 'World', 'Object', 'Modifier', 'Material', 'Texture'],
                'activeTab' => 'Tool',
                'visible' => true,
                'row' => 0,
                'col' => 1
            ],
            [
                'id' => 'outliner',
                'title' => 'Outliner',
                'type' => 'outliner',
                'tabs' => ['All Scenes', 'Current File', 'Scenes'],
                'activeTab' => 'All Scenes',
                'visible' => true,
                'row' => 1,
                'col' => 0
            ],
            [
                'id' => 'timeline',
                'title' => 'Timeline',
                'type' => 'timeline',
                'tabs' => ['Dope Sheet', 'Graph Editor', 'Drivers'],
                'activeTab' => 'Dope Sheet',
                'visible' => true,
                'row' => 1,
                'col' => 1
            ]
        ]
    ];
}

function readLayoutFromFile() {
    if (!file_exists(LAYOUT_STATE_FILE)) {
        return null;
    }

    $json = file_get_contents(LAYOUT_STATE_FILE);
    if ($json === false) {
        return null;
    }

    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return null;
    }

    return $data;
}

function writeLayoutToFile(array $layoutState) {
    ensureLayoutDataDirectory();
    $json = json_encode($layoutState, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    file_put_contents(LAYOUT_STATE_FILE, $json);
}

function getCurrentLayoutState() {
    if (isset($_SESSION['layout_state']) && is_array($_SESSION['layout_state'])) {
        return $_SESSION['layout_state'];
    }

    $savedState = readLayoutFromFile();
    if (is_array($savedState)) {
        $savedState = ensureLayoutStateStructure($savedState);
        $_SESSION['layout_state'] = $savedState;
        return $savedState;
    }

    $defaultState = getDefaultLayoutState();
    $_SESSION['layout_state'] = $defaultState;
    return $defaultState;
}

function ensureLayoutStateStructure(array $state) {
    $default = getDefaultLayoutState();
    
    if (!isset($state['gridLayout'])) {
        $state['gridLayout'] = $default['gridLayout'];
    }
    if (!isset($state['columnWidths'])) {
        $state['columnWidths'] = $default['columnWidths'];
    }
    if (!isset($state['rowHeights'])) {
        $state['rowHeights'] = $default['rowHeights'];
    }
    if (!isset($state['panels'])) {
        $state['panels'] = $default['panels'];
    }
    
    return $state;
}

function saveCurrentLayoutState(array $layoutState) {
    $_SESSION['layout_state'] = $layoutState;
    writeLayoutToFile($layoutState);
}
