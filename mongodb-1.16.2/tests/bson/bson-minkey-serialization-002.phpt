--TEST--
MongoDB\BSON\MinKey serialization (__serialize and __unserialize)
--SKIPIF--
<?php require __DIR__ . "/../utils/basic-skipif.inc"; ?>
<?php skip_if_php_version('<', '7.4.0'); ?>
--FILE--
<?php

var_dump($minkey = new MongoDB\BSON\MinKey);
var_dump($s = serialize($minkey));
var_dump(unserialize($s));

?>
===DONE===
<?php exit(0); ?>
--EXPECTF--
object(MongoDB\BSON\MinKey)#%d (%d) {
}
string(31) "O:19:"MongoDB\BSON\MinKey":0:{}"
object(MongoDB\BSON\MinKey)#%d (%d) {
}
===DONE===
