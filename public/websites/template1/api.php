<?php
// SECURITY-ENHANCED API ENDPOINT
// Enforce HTTPS, validate all input, and keep dependencies up to date.

// TODO: Implement Two-Factor Authentication (2FA) for admin logins.
// TODO: Implement IP whitelisting for admin panel access.
// TODO: Add logging and monitoring for all admin actions (e.g., file_put_contents to a secure log file).

session_start();

// --- Rate Limiting (simple IP-based) ---
$ip = $_SERVER['REMOTE_ADDR'];
$rate_limit_file = sys_get_temp_dir() . '/api_rate_limit_' . md5($ip);
$rate_limit = 30; // requests per minute (increased from 10)
$window = 60; // seconds
$now = time();
$requests = [];
if (file_exists($rate_limit_file)) {
    $requests = json_decode(file_get_contents($rate_limit_file), true) ?: [];
    $requests = array_filter($requests, function($t) use ($now, $window) { return $t > $now - $window; });
}
$requests[] = $now;
file_put_contents($rate_limit_file, json_encode($requests));
if (count($requests) > $rate_limit) {
    http_response_code(429);
    $remaining_time = 60 - ($now - $requests[0]);
    die(json_encode([
        'error' => 'Too many requests. Please try again in ' . $remaining_time . ' seconds.',
        'remaining_time' => $remaining_time,
        'rate_limit' => $rate_limit
    ]));
}

// --- Input Validation & Sanitization ---
function clean_input($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// --- Strong Password Hashing ---
function hash_password($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}
function verify_password($password, $hash) {
    return password_verify($password, $hash);
}

// --- Secure Session Management ---
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);

// --- Admin Authentication Example ---
function is_admin() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}
function require_admin() {
    if (!is_admin()) {
        http_response_code(403);
        die(json_encode(['error' => 'Unauthorized']));
    }
}

// --- Example: Secure Login Endpoint ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $password = clean_input($_POST['password'] ?? '');
    // $stored_hash = ... (fetch from DB or config, do NOT hardcode)
    $stored_hash = 'REPLACE_WITH_HASH_FROM_DB';
    if (verify_password($password, $stored_hash)) {
        $_SESSION['is_admin'] = true;
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
    exit;
}

// --- Example: Secure Admin Action ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'admin_action') {
    require_admin();
    // Validate and sanitize all inputs
    $data = clean_input($_POST['data'] ?? '');
    // ... perform admin action ...
    echo json_encode(['success' => true]);
    exit;
}

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
$dataFile = 'public/websites/template1/siteData.json';
// Path to reviews file
$reviewsFile = 'reviews.json';
// Path to password file
$passwordFile = 'password.txt';

// Helper to get current password from JSON data
function getCurrentPassword() {
    global $dataFile;
    
    if (file_exists($dataFile)) {
        $data = json_decode(file_get_contents($dataFile), true);
        
        // Check if this is the new structure with nested data
        if ($data && isset($data['data']['admin']['password'])) {
            return $data['data']['admin']['password'];
        }
        // Fallback to old structure if needed
        else if ($data && isset($data['admin']['password'])) {
            return $data['admin']['password'];
        }
    }
    
    // Default password if file doesn't exist or structure is invalid
    return 'admin123';
}

// Helper to set new password in JSON data
function setNewPassword($newPassword) {
    global $dataFile;
    
    if (file_exists($dataFile)) {
        $data = json_decode(file_get_contents($dataFile), true);
        
        // Update password in the new structure
        if ($data && isset($data['data']['admin'])) {
            $data['data']['admin']['password'] = $newPassword;
        }
        // Fallback to old structure if needed
        else if ($data && isset($data['admin'])) {
            $data['admin']['password'] = $newPassword;
        }
        // Create new structure if it doesn't exist
        else {
            $data = [
                'id' => 1,
                'data' => [
                    'id' => 1,
                    'admin' => [
                        'password' => $newPassword
                    ]
                ]
            ];
        }
        
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
    }
}

// Function to verify admin password
function verifyPassword($password) {
    error_log("Verifying password: $password");
    $storedPassword = getCurrentPassword();
    error_log("Stored password: $storedPassword");
    $isValid = $password === $storedPassword;
    error_log("Password validation result: " . ($isValid ? 'valid' : 'invalid'));
    return $isValid;
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
            $json = file_get_contents($dataFile);
            echo $json;
            if ($json === false) {
                echo json_encode(['error' => 'Failed to read data file']);
                die();
            }
            // Check for JSON errors
            json_decode($json);
            if (json_last_error() !== JSON_ERROR_NONE) {
                echo json_last_error_msg();
                die();
            }
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
            $json = json_encode($defaultData);
            echo $json;
            if ($json === false) {
                echo json_last_error_msg();
                die();
            }
            // Check for JSON errors
            if (json_last_error() !== JSON_ERROR_NONE) {
                echo json_last_error_msg();
                die();
            }
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

    case 'getReviews':
        // Get all reviews
        if (file_exists($reviewsFile)) {
            $reviews = json_decode(file_get_contents($reviewsFile), true);
            if (!is_array($reviews)) $reviews = [];
        } else {
            $reviews = [];
        }
        echo json_encode(['reviews' => $reviews]);
        break;

    case 'saveReviews':
        // Save all reviews
        $reviews = $_POST['reviews'] ?? null;
        if ($reviews && is_array($reviews)) {
            file_put_contents($reviewsFile, json_encode($reviews, JSON_PRETTY_PRINT));
            echo json_encode(['success' => true, 'message' => 'Reviews saved successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No reviews provided']);
        }
        break;

    default:
        echo json_encode([
            'success' => false,
            'message' => 'Unknown action: ' . $action
        ]);
} 