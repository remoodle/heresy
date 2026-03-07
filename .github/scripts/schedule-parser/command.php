<?php

declare(strict_types=1);

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Pool;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Psr\Http\Message\RequestInterface;

require_once __DIR__ . '/vendor/autoload.php';

$token = $argv[1];
$files = scandir($argv[2]);

$groups = [];
foreach ($files as $file) {
    if($file === '.' || $file === '..') {
        continue;
    }
    $parser = new \Smalot\PdfParser\Parser();
    $pdfFile = $parser->parseFile($argv[2] . '/' . $file);
    foreach (explode("\n", $pdfFile->getText()) as $line) {
        if(strpos($line, 'Group ') === 0) {
            $groups[explode(' ', $line)[1]] = true;
        }
    }
}
$groups = array_keys($groups);

$client = new Client([
    'base_uri' => 'https://du.astanait.edu.kz:8765',
    'headers' => [
        'Authorization' => 'Bearer ' . trim($token)
    ]
]);

$groupScheduleRaw = [];

$requests = array_map(
    fn (string $groupName): RequestInterface => new Request('GET', '/astanait-schedule-module/api/v1/schedule/groupName/' . $groupName),
    $groups
);
$pool = new Pool(
    $client,
    $requests,
    [
        'concurrency' => 10,
        'fulfilled' => function (Response $response, $index) use (&$groupScheduleRaw) {
            $body = json_decode($response->getBody()->getContents(), true)['body'];
            if(count($body) > 0) {
                $groupScheduleRaw[$body[0]['group']] = $body;
            }

            return true;
        },
        'rejected' => function (RequestException $reason, $index) use (&$requests) {
            $requests[] = $reason->getRequest();
            echo "\nUnable to fetch " . $reason->getRequest()->getUri()->__toString();
            return false;
        },
    ]
);

$promise = $pool->promise();
$promise->wait();

$formattedSchedule = [];

foreach ($groupScheduleRaw as $groupName => $schedule) {
    $formattedSchedule[$groupName] = [];
    foreach ($schedule as $lesson) {
        $timeStart = null;
        $timeFinish = null;

        $classTimeDay = $lesson['classtime_day'];
        $daysMetaInfo = json_decode($lesson['days'], true);
        $dayIndex = array_search($classTimeDay, $daysMetaInfo['days'], true);
        $weekDay = $daysMetaInfo['daysname'][$dayIndex];

        $classTimeTime = $lesson['classtime_time'];
        foreach ($daysMetaInfo['time'] as $timeMetaInfo) {
            if($timeMetaInfo['id'] === $classTimeTime) {
                $timeStart = $timeMetaInfo['start'];
                $timeFinish = $timeMetaInfo['finish'];
            }
        }

        if($timeStart === null || $timeFinish === null) {
            continue;
        }

        $lessonObj = [
            'id' => uniqid(),
            'start' => "$weekDay " . $timeStart,
            'end' => "$weekDay " . $timeFinish,
            'courseName' => $lesson['subject'],
            'location' => $lesson['room'],
            'isOnline' => $lesson['room'] === 'online',
            'teacher' => $lesson['tutor'],
            'type' => $lesson['lesson_type'],
        ];
        $formattedSchedule[$groupName][] = $lessonObj;
    }
}

$lessonsByLocation = [];
$lessonsByTeacher = [];
foreach ($formattedSchedule as $groupLessons) {
    foreach ($groupLessons as $lesson) {
        if (!$lesson['isOnline']) {
            $lessonsByLocation[$lesson['location']][] = $lesson;
        }
        if (!str_contains($lesson['teacher'], 'learn.astanait.edu.kz')) {
            $lessonsByTeacher[$lesson['teacher']][] = $lesson;
        }
    }
}

$output = [
    'lessonsByGroupname' => $formattedSchedule,
    'lessonsByLocation' => $lessonsByLocation,
    'lessonsByTeacher' => $lessonsByTeacher,
];

file_put_contents($argv[3], json_encode($output, JSON_PRETTY_PRINT));
