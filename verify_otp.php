<?php
// Start session to retrieve stored OTP
session_start();

// Get the OTP entered by the user
$enteredOTP = isset($_POST['otp']) ? $_POST['otp'] : '';

if (empty($enteredOTP)) {
    echo json_encode(['status' => 'error', 'message' => 'OTP is required']);
    exit;
}

// Check if OTP exists in session
if (!isset($_SESSION['otp']) || !isset($_SESSION['otp']['code']) || !isset($_SESSION['otp']['expires'])) {
    echo json_encode(['status' => 'error', 'message' => 'No OTP was generated or session expired']);
    exit;
}

// Check if OTP has expired
if (time() > $_SESSION['otp']['expires']) {
    echo json_encode(['status' => 'error', 'message' => 'OTP has expired']);
    exit;
}

// Verify OTP
if ($enteredOTP === $_SESSION['otp']['code']) {
    // OTP is valid
    
    // In a real application, you would:
    // 1. Create a user session or JWT token
    // 2. Store login information in database
    // 3. Set cookies/session variables for authentication
    
    // Clear the OTP from session for security
    unset($_SESSION['otp']);
    
    // Start user session (simplified example)
    $_SESSION['authenticated'] = true;
    $_SESSION['user_phone'] = $_SESSION['otp']['phone'];
    
    echo json_encode(['status' => 'success', 'message' => 'OTP verified successfully']);
} else {
    // Invalid OTP
    echo json_encode(['status' => 'error', 'message' => 'Invalid OTP']);
}
?>