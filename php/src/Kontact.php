<?php
/**
 * Kontact.php
 *
 * @author Lim Yuan Qing <hello@yuanqing.sg>
 * @license MIT
 * @link https://github.com/yuanqing/kontact
 */

namespace yuanqing\Kontact;

class Kontact
{
  private $schema;
  private $cb;
  private $header;

  public function __construct($schema, $cb)
  {
    if (!isset($schema) || !is_array($schema)) {
      throw new \InvalidArgumentException('$schema` must be an array');
    }
    if (!isset($cb) || !is_callable($cb)) {
      throw new \InvalidArgumentException('$cb must be callable');
    }
    $this->schema = $schema;
    $this->cb = $cb;
  }

  public function process($input, $origin)
  {
    $err = array();
    $data = array();
    $is_json = isset($input['json']);

    // decode input if it was JSON
    if ($is_json) {
      $input = json_decode($input['json'], true);
    }

    // check input against the schema, populate `$data`
    foreach ($this->schema as $k => $v) {
      if (empty($input[$k]) && (!isset($v['optional']) || $v['optional'] !== true)) {
        $err[$k] = isset($v['err']) ? $v['err'] : sprintf('Please enter a %s', $k);
      } else {
        // sanitise
        if (!empty($input[$k])) {
          $data[$k] = htmlspecialchars($input[$k]);
        }
        // validate
        $fn = isset($v['validate']) ? $v['validate'] : null;
        if ($fn !== null && is_callable($fn) && !call_user_func($fn, $input[$k])) {
          $err[$k] = isset($v['err']) ? $v['err'] : sprintf('Please enter a valid %s', $k);
        }
      }
    }

    if (empty($err)) {
      call_user_func($this->cb, $data);
    }

    // send response
    $response = array(
      'err' => empty($err) ? 0 : $err,
      'data' => $data
    );
    if ($is_json) {
      header('Content-Type: application/json');
      echo json_encode($response);
    } else {
      header('Location: ' . $origin . '?' . http_build_query($response));
    }
  }

}
