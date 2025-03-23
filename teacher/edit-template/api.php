<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Ensure we're processing JSON
$_POST = json_decode(file_get_contents('php://input'), true) ?? $_POST;

// Define the data file path
$dataFile = 'siteData.json';

// Function to verify admin password
function verifyPassword($password) {
    // In a real app, use a secure hashing mechanism
    return $password === 'admin123';
}

// Route API requests
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        // Admin login
        $password = $_POST['password'] ?? '';
        $success = verifyPassword($password);
        
        echo json_encode([
            'success' => $success,
            'message' => $success ? 'Login successful' : 'Invalid password'
        ]);
        break;

    case 'getData':
        // Get site data
        if (file_exists($dataFile)) {
            echo file_get_contents($dataFile);
        } else {
            // Default site data if file doesn't exist
            echo json_encode([
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
            ]);
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
            'message' => 'Unknown action'
        ]);
} 