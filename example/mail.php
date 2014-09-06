<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once dirname(__DIR__) . '/php/Kontact.php';

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
  function($err, $data) {
    $response = array(
      'err' => $err,
      'data' => $data
    );
    if (isset($_POST['json'])) {
      echo json_encode($response);
    } else {
      header('Location: example.php?' . http_build_query($response));
      exit();
    }
  }
);
$k->process($_POST);
