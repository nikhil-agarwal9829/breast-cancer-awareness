--TEST--
Top-level document validity: Bad $numberLong (extra field)
--DESCRIPTION--
Generated by scripts/convert-bson-corpus-tests.php

DO NOT EDIT THIS FILE
--FILE--
<?php

require_once __DIR__ . '/../utils/basic.inc';

throws(function() {
    fromJSON('{"a" : {"$numberLong" : "42", "unrelated": true}}');
}, 'MongoDB\Driver\Exception\UnexpectedValueException');

?>
===DONE===
<?php exit(0); ?>
--EXPECT--
OK: Got MongoDB\Driver\Exception\UnexpectedValueException
===DONE===