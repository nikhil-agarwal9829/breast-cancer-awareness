<?php
// This is a simple example of server-side OTP generation and sending
// In a production environment, you would use a proper SMS gateway

// Start session to store OTP
session_start();

// Function to generate OTP
function generateOTP($length = 6) {
    $digits = '0123456789';
    $otp = '';
    
    for ($i = 0; $i < $length; $i++) {
        $otp .= $digits[rand(0, 9)];
    }
    
    return $otp;
}

// Get phone number from AJAX request
$phone = isset($_POST['phone']) ? $_POST['phone'] : '';
$email = isset($_POST['email']) ? $_POST['email'] : '';

if (empty($phone)) {
    echo json_encode(['status' => 'error', 'message' => 'Phone number is required']);
    exit;
}

// Generate OTP
$otp = generateOTP();

// Store OTP in session with expiry time (5 minutes from now)
$_SESSION['otp'] = [
    'code' => $otp,
    'expires' => time() + (5 * 60), // 5 minutes
    'phone' => $phone
];

// In a real application, you would use an SMS gateway service
// Example with a fictional SMS API:
/*
$apiKey = 'your_api_key';
$smsGatewayUrl = 'https://example-sms-gateway.com/api/send';

$postData = [
    'apiKey' => $apiKey,
    'to' => $phone,
    'message' => 'Your OTP for Breast Cancer Awareness login: ' . $otp . '. Valid for 5 minutes.'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $smsGatewayUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
*/

// For demonstration, just return success (in production, check SMS gateway response)
echo json_encode([
    'status' => 'success', 
    'message' => 'OTP sent successfully',
    'debug_otp' => $otp // Remove this in production!
]);
?>