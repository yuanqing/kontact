<?php

error_reporting(E_ALL);
ini_set('display_errs', 1);

require_once dirname(__DIR__) . '/php/src/Kontact.php';

use yuanqing\Kontact\Kontact;

$k = new Kontact(
  array(
    'name' => array(
      'optional' => true,
      'err' => 'Please enter your name'
    ),
    'email' => array(
      'validate' => function($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
      },
      'err' => 'Please enter a valid email'
    ),
    'message' => array()
  ),
  function($data) {
    // do stuff with $data
  }
);
$k->process($_POST, 'example.php');
