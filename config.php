<?php
require 'vendor/autoload.php';

// MongoDB configuration
define('MONGODB_URI', 'mongodb://localhost:27017');
define('DB_NAME', 'secure_login_db');

// Security configurations
define('HASH_COST', 12); // For password_hash()
define('SESSION_LIFETIME', 3600); // 1 hour
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_TIMEOUT', 900); // 15 minutes

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1); // Set to 0 in production
ini_set('log_errors', 1);
ini_set('error_log', 'error.log');

// MongoDB connection with error handling
try {
    $client = new MongoDB\Client(MONGODB_URI);
    $db = $client->selectDatabase(DB_NAME);
    
    // Create indexes for security
    $db->users->createIndex(['username' => 1], ['unique' => true]);
    $db->login_attempts->createIndex(['username' => 1]);
    $db->login_attempts->createIndex(['last_attempt' => 1], ['expireAfterSeconds' => LOGIN_TIMEOUT]);
    
} catch (Exception $e) {
    error_log("MongoDB connection error: " . $e->getMessage());
    die("A database error occurred. Please try again later.");
}

// Security functions
function check_login_attempts($username) {
    global $db;
    
    $attempt = $db->login_attempts->findOne(['username' => $username]);
    
    if ($attempt) {
        if ($attempt->attempts >= MAX_LOGIN_ATTEMPTS) {
            $time_diff = time() - $attempt->last_attempt->toDateTime()->getTimestamp();
            if ($time_diff < LOGIN_TIMEOUT) {
                return false;
            }
        }
    }
    return true;
}

function update_login_attempts($username, $success) {
    global $db;
    
    if ($success) {
        // Reset attempts on successful login
        $db->login_attempts->deleteOne(['username' => $username]);
    } else {
        // Increment failed attempts
        $db->login_attempts->updateOne(
            ['username' => $username],
            [
                '$inc' => ['attempts' => 1],
                '$set' => ['last_attempt' => new MongoDB\BSON\UTCDateTime()]
            ],
            ['upsert' => true]
        );
    }
}

// Create collections if they don't exist
$db->createCollection('users');
$db->createCollection('login_attempts'); 