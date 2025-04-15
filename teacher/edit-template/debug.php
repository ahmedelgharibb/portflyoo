<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set appropriate headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Supabase API configuration
$supabaseUrl = 'https://bqpchhitrbyfleqpyydz.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGNoaGl0cmJ5ZmxlcXB5eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTU4ODgsImV4cCI6MjA1OTAzMTg4OH0.Yworu_EPLewJJGBFnW5W7GUsNZIONc3qOEJMTwJMzzQ';

// Function to call Supabase API
function callSupabase($endpoint, $method = 'GET', $data = null) {
    global $supabaseUrl, $supabaseKey;
    
    $ch = curl_init("$supabaseUrl/rest/v1/$endpoint");
    
    $headers = [
        'Content-Type: application/json',
        "apikey: $supabaseKey",
        "Authorization: Bearer $supabaseKey"
    ];
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    if ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $status,
        'data' => json_decode($response, true),
        'raw' => $response
    ];
}

// Get tables information
function getTables() {
    // Query the information_schema to get table information
    return callSupabase('site_data?select=id,created_at&limit=1');
}

// Get table schemas
function getTableSchema($table) {
    // Just check if we can read the table
    return callSupabase("$table?limit=1");
}

// Check storage buckets
function getStorageBuckets() {
    // This endpoint doesn't exist in Supabase REST API, but we'll try to access bucket content
    return callSupabase('storage/buckets/website-images/objects?limit=10');
}

// Run checks
$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'checks' => []
];

// Check site_data table
$tableCheck = getTables();
$result['checks']['site_data_table'] = [
    'status' => $tableCheck['status'],
    'exists' => $tableCheck['status'] === 200,
    'data' => $tableCheck['data']
];

// Check site_data schema
$schemaCheck = getTableSchema('site_data');
$result['checks']['site_data_schema'] = [
    'status' => $schemaCheck['status'],
    'accessible' => $schemaCheck['status'] === 200,
    'data' => $schemaCheck['data']
];

// Check storage buckets
$bucketCheck = getStorageBuckets();
$result['checks']['storage_bucket'] = [
    'status' => $bucketCheck['status'],
    'exists' => $bucketCheck['status'] === 200,
    'data' => $bucketCheck['data']
];

// Overall status
$result['status'] = 'ok';
if ($tableCheck['status'] !== 200 || $schemaCheck['status'] !== 200 || $bucketCheck['status'] !== 200) {
    $result['status'] = 'error';
    $result['message'] = 'One or more database checks failed. Please run the reset-database.sql script.';
}

// Output the result
echo json_encode($result, JSON_PRETTY_PRINT); 