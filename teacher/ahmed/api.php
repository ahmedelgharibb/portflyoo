<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set appropriate headers for API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request method and log it
$method = $_SERVER['REQUEST_METHOD'];
error_log("API Request Method: $method");

// Parse JSON input for POST requests
$rawInput = file_get_contents('php://input');
error_log("Raw input: $rawInput");

// Ensure we're processing JSON input correctly
if ($method === 'POST') {
    $_POST = json_decode($rawInput, true) ?? $_POST;
    error_log("Parsed POST data: " . print_r($_POST, true));
}

// Define the data file path
$dataFile = 'siteData.json';

// Function to verify admin password
function verifyPassword($password) {
    error_log("Verifying password: $password");
    // In a real app, use a secure hashing mechanism
    return $password === 'admin123';
}

// Route API requests
$action = $_GET['action'] ?? '';
error_log("API Action: $action");

switch ($action) {
    case 'login':
        // Admin login
        $password = $_POST['password'] ?? '';
        error_log("Login attempt with password: $password");
        
        $success = verifyPassword($password);
        error_log("Login success: " . ($success ? 'true' : 'false'));
        
        $response = [
            'success' => $success,
            'message' => $success ? 'Login successful' : 'Invalid password'
        ];
        
        echo json_encode($response);
        error_log("Login response: " . json_encode($response));
        break;

    case 'getData':
        // Get site data
        if (file_exists($dataFile)) {
            echo file_get_contents($dataFile);
        } else {
            // Default site data if file doesn't exist
            $defaultData = [
                'personalInfo' => [
                    'name' => 'Dr. Ahmed Mahmoud',
                    'title' => 'Mathematics Educator',
                    'qualifications' => [
                        'Ph.D. in Mathematics Education',
                        'Master\'s in Applied Mathematics',
                        'Bachelor\'s in Mathematics'
                    ],
                    'experience' => '15+ years of teaching experience'
                ],
                'experience' => [
                    'schools' => [
                        'International School of Mathematics',
                        'Elite Academy',
                        'Science High School'
                    ],
                    'centers' => [
                        'Math Excellence Center',
                        'Advanced Learning Institute',
                        'STEM Education Hub'
                    ],
                    'onlinePlatforms' => [
                        'MathPro Online',
                        'EduTech Academy',
                        'Virtual Learning Center'
                    ]
                ],
                'results' => [
                    'subjects' => [
                        ['name' => 'Mathematics', 'score' => 85],
                        ['name' => 'Physics', 'score' => 78],
                        ['name' => 'Chemistry', 'score' => 82],
                        ['name' => 'Biology', 'score' => 75]
                    ]
                ],
                'contact' => [
                    'email' => 'teacher@example.com',
                    'formUrl' => 'https://forms.google.com/your-form-link'
                ]
            ];
            
            echo json_encode($defaultData);
            
            // Also save the default data to the file for future use
            file_put_contents($dataFile, json_encode($defaultData, JSON_PRETTY_PRINT));
        }
        break;

    case 'saveData':
        // Save site data
        $data = $_POST['data'] ?? null;
        
        if ($data) {
            file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
            echo json_encode([
                'success' => true,
                'message' => 'Data saved successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No data provided'
            ]);
        }
        break;

    default:
        echo json_encode([
            'success' => false,
            'message' => 'Unknown action: ' . $action
        ]);
} 