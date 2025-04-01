<?php
require 'vendor/autoload.php';

try {
    $client = new MongoDB\Client("mongodb://localhost:27017");
    $db = $client->test;
    echo "MongoDB connection successful!";
} catch (Exception $e) {
    echo "MongoDB connection failed: " . $e->getMessage();
}
?> 