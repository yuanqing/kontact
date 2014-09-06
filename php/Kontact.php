<?php
/**
 * Kontact.php
 *
 * @author Lim Yuan Qing <hello@yuanqing.sg>
 * @license MIT
 * @link https://github.com/yuanqing/kontact
 */

namespace yuanqing\Kontact;

class Kontact {

  private $schema;
  private $cb;

  public function __construct($schema, $cb) {

    if (!isset($schema) || !is_array($schema)) {
      throw new \InvalidArgumentException('`schema` must be an array');
    }
    if (!isset($cb) || !is_callable($cb)) {
      throw new \InvalidArgumentException('`cb` must be callable');
    }

    $this->schema = $schema;
    $this->cb = $cb;

  }

  public function process($input) {

    $err = array();
    $data = array();

    if (isset($input['json'])) {
      $input = json_decode($input['json'], true);
    }

    foreach ($this->schema as $k => $v) {
      if (!empty($input[$k])) {
        $fn = isset($v['validate']) ? $v['validate'] : null;
        if ($fn !== null && is_callable($fn) && !call_user_func($fn, $input[$k])) {
          $err[$k] = isset($v['err']) ? $v['err'] : sprintf('Please enter a valid %s', $k);
        }
        $data[$k] = htmlspecialchars($input[$k]);
      } else {
        if (isset($v['optional']) && $v['optional'] === true) {
          $data[$k] = null;
        } else {
          $err[$k] = isset($v['err']) ? $v['err'] : sprintf('Please enter a %s', $k);
        }
      }
    }

    return call_user_func($this->cb, empty($err) ? null : $err, $data);

  }

}
