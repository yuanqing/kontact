<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once dirname(__DIR__) . '/php/src/Kontact.php';

use yuanqing\Kontact\Kontact;

$schema = array(
  'name' => array(
    'optional' => true,
    'err' => 'Please enter your name'
  ),
  'email' => array(
    'validate' => function($input) {
      return filter_var($input, FILTER_VALIDATE_EMAIL);
    },
    'err' => 'Please enter a valid email'
  ),
  'message' => array()
);
$cb = function($err, $data) {
  if (!$err) {
    // do stuff with `$data`, eg. send mail($to, $subject, $message)
    return;
  }
};

$kontact = new Kontact($schema, $cb);

$kontact->process($_POST, 'example.php');
