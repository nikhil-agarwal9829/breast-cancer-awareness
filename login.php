<?php
// Start secure session
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1);
session_start();

// Include database connection
require_once 'config.php';

// Function to sanitize input
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Function to generate CSRF token
function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Function to verify CSRF token
function verify_csrf_token($token) {
    if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
        return false;
    }
    return true;
}

// Handle login request
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Verify CSRF token
    if (!verify_csrf_token($_POST['csrf_token'])) {
        die('CSRF token validation failed');
    }

    // Get and sanitize input
    $username = sanitize_input($_POST['username']);
    $password = $_POST['password'];

    // Check login attempts
    if (!check_login_attempts($username)) {
        $error = "Too many failed attempts. Please try again later.";
    } else {
        // Find user in MongoDB
        $user = $db->users->findOne(['username' => $username]);
        
        if ($user && password_verify($password, $user->password_hash)) {
            // Update successful login
            update_login_attempts($username, true);
            
            // Set secure session variables
            $_SESSION['user_id'] = (string) $user->_id;
            $_SESSION['username'] = $user->username;
            $_SESSION['last_activity'] = time();

            // Regenerate session ID to prevent session fixation
            session_regenerate_id(true);

            // Set secure cookie
            setcookie('session_id', session_id(), [
                'expires' => time() + 3600,
                'path' => '/',
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Strict'
            ]);

            // Redirect to dashboard
            header("Location: dashboard.php");
            exit();
        } else {
            // Update failed login attempt
            update_login_attempts($username, false);
            $error = "Invalid username or password";
        }
    }
}

// Generate new CSRF token for the form
$csrf_token = generate_csrf_token();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Login</title>
    <link rel="stylesheet" href="login.css">
</head>
<body>
    <div class="login-container">
        <h2>Secure Login</h2>
        <?php if (isset($error)) echo "<p class='error'>$error</p>"; ?>
        
        <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
            <input type="hidden" name="csrf_token" value="<?php echo $csrf_token; ?>">
            
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required 
                       pattern="[a-zA-Z0-9_]+" title="Only letters, numbers and underscore allowed">
            </div>
            
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required 
                       minlength="8" title="Password must be at least 8 characters long">
            </div>
            
            <button type="submit">Login</button>
        </form>
    </div>
</body>
</html> 