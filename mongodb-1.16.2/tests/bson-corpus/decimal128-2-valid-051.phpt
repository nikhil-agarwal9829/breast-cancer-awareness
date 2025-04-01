--TEST--
Decimal128: [decq608] fold-down full sequence
--DESCRIPTION--
Generated by scripts/convert-bson-corpus-tests.php

DO NOT EDIT THIS FILE
--FILE--
<?php

require_once __DIR__ . '/../utils/basic.inc';

$canonicalBson = hex2bin('1800000013640000000040EAED7446D09C2C9F0C00FE5F00');
$canonicalExtJson = '{"d" : {"$numberDecimal" : "1.000000000000000000000000000000E+6141"}}';

// Canonical BSON -> Native -> Canonical BSON
echo bin2hex(fromPHP(toPHP($canonicalBson))), "\n";

// Canonical BSON -> BSON object -> Canonical BSON
echo bin2hex((string) MongoDB\BSON\Document::fromBSON($canonicalBson)), "\n";

// Canonical BSON -> Canonical extJSON
echo json_canonicalize(toCanonicalExtendedJSON($canonicalBson)), "\n";

// Canonical BSON -> BSON object -> Canonical extJSON
echo json_canonicalize(MongoDB\BSON\Document::fromBSON($canonicalBson)->toCanonicalExtendedJSON()), "\n";

// Canonical extJSON -> Canonical BSON
echo bin2hex(fromJSON($canonicalExtJson)), "\n";

// Canonical extJSON -> BSON object -> Canonical BSON
echo bin2hex((string) MongoDB\BSON\Document::fromJSON($canonicalExtJson)), "\n";

?>
===DONE===
<?php exit(0); ?>
--EXPECT--
1800000013640000000040eaed7446d09c2c9f0c00fe5f00
1800000013640000000040eaed7446d09c2c9f0c00fe5f00
{"d":{"$numberDecimal":"1.000000000000000000000000000000E+6141"}}
{"d":{"$numberDecimal":"1.000000000000000000000000000000E+6141"}}
1800000013640000000040eaed7446d09c2c9f0c00fe5f00
1800000013640000000040eaed7446d09c2c9f0c00fe5f00
===DONE===