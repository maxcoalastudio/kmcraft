<?php
session_start();
require_once __DIR__ . '/layout_state.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode(getCurrentLayoutState());
    exit;
}

if ($method === 'POST') {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'JSON inválido']);
        exit;
    }

    if (isset($data['action']) && $data['action'] === 'saveGridLayout') {
        $currentState = getCurrentLayoutState();
        if (isset($data['gridLayout']['columnWidths'])) {
            $currentState['columnWidths'] = $data['gridLayout']['columnWidths'];
        }
        if (isset($data['gridLayout']['rowHeights'])) {
            $currentState['rowHeights'] = $data['gridLayout']['rowHeights'];
        }
        saveCurrentLayoutState($currentState);
        echo json_encode(['success' => true, 'message' => 'Grid layout salvo']);
        exit;
    }

    saveCurrentLayoutState($data);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método não permitido']);
