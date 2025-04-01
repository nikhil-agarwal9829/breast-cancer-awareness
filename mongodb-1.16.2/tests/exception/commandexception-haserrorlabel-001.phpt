--TEST--
MongoDB\Driver\Exception\CommandException::hasErrorLabel()
--FILE--
<?php

$exception = new MongoDB\Driver\Exception\CommandException();
$labels = ['test', 'foo'];

$reflection = new ReflectionClass($exception);

$resultDocumentProperty = $reflection->getProperty('errorLabels');
$resultDocumentProperty->setAccessible(true);
$resultDocumentProperty->setValue($exception, $labels);

var_dump($exception->hasErrorLabel('foo'));
var_dump($exception->hasErrorLabel('bar'));

?>
===DONE===
<?php exit(0); ?>
--EXPECT--
bool(true)
bool(false)
===DONE===
