<?php

declare(strict_types=1);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    fprintf(STDERR, "%s\n", $errstr);
    exit(1);
});

set_exception_handler(function($e) {
    fprintf(STDERR, "%s: %s\n", get_class($e), $e->getMessage());
    exit(1);
});

function getId(string $config): string {
    $config = json_decode($config, null, 512, JSON_THROW_ON_ERROR);

    if (!isset($config->id) || !is_string($config->id)) {
        throw new UnexpectedValueException('Could not determine id');
    }

    return $config->id;
}

function getTopology(string $file): string {
    $topology = basename(dirname($file));

    if (!in_array($topology, ['servers', 'replica_sets', 'sharded_clusters'])) {
        throw new UnexpectedValueException('Unsupported topology: ' . $topology);
    }

    return $topology;
}

function request(string $uri, array $options = []): stdClass {
    $options += [
        'method' => 'GET',
        'header' => 'Accept: application/json',
        'ignore_errors' => true,
    ];
    $response = file_get_contents($uri, false, stream_context_create(['http' => $options]));

    if (preg_match('#HTTP/1.[01] ([0-9]+)#', $http_response_header[0], $matches) !== 1) {
        throw new UnexpectedValueException('Could not determine HTTP response code');
    }

    $code = (int) $matches[1];

    if ($code !== 200) {
        throw new UnexpectedValueException(sprintf("%s %s returned HTTP response code: %d\n\n%s", $options['method'] ?? 'GET', $uri, $code, $response));
    }

    return json_decode($response, null, 512, JSON_THROW_ON_ERROR);
}

function start(string $uri, string $config): void {
    $options = [
        'method' => 'POST',
        'header' => "Accept: application/json\r\n" .
                    "Content-type: application/x-www-form-urlencoded",
        'content' => $config,
        'timeout' => 120,
    ];

    printf("%s\n", json_encode(request($uri, $options), JSON_PRETTY_PRINT));
}

function status(string $uri): void {
    printf("%s\n", json_encode(request($uri), JSON_PRETTY_PRINT));
}

function stop(string $uri): void {
    $options = [
        'method' => 'DELETE',
        'header' => "Accept: application/json\r\n" .
                    "Content-type: application/x-www-form-urlencoded",
        'content' => $config,
        'timeout' => 120,
    ];

    printf("%s\n", json_encode(request($uri, $options), JSON_PRETTY_PRINT));
}

function usage(): void {
    global $argv;

    fprintf(STDERR, "usage: %s <action> <id>|<path/to/config.json>\n", $argv[0]);
    fprintf(STDERR, "action: start|status|stop\n");
    exit(1);
}

$tools = getenv('DRIVER_TOOLS') ?: '/home/jmikola/workspace/mongodb/drivers-evergreen-tools';
$server = getenv('MONGO_ORCHESTRATION_URI') ?: 'http://localhost:8889';

if ($argc < 2) {
    usage();
}

$action = $argv[1] ?? null;

switch ($action) {
    case 'start':
        $file = $argv[2];

        if (!is_readable($file)) {
            throw new UnexpectedValueException('Cannot read input file');
        }

        $topology = getTopology($file);

        $config = file_get_contents($file);
        $config = str_replace('ABSOLUTE_PATH_REPLACEMENT_TOKEN', $tools, $config);
        start(sprintf('%s/v1/%s', $server, $topology), $config);
        break;

    case 'status':
        $topology = $argv[2];
        $id = $argv[3];
        status(sprintf('%s/v1/%s/%s', $server, $topology, $id));
        break;

    case 'stop':
        $topology = $argv[2];
        $id = $argv[3];
        stop(sprintf('%s/v1/%s/%s', $server, $topology, $id));
        break;

    case 'list':
        foreach (['servers', 'replica_sets', 'sharded_clusters'] as $topology) {
            $response = request(sprintf('%s/v1/%s', $server, $topology));
            printf("%s:\n", $topology);
            printf("%s\n\n", json_encode($response->$topology, JSON_PRETTY_PRINT));
        }
        break;

    default:
        usage();
}
