<?php
/**
 * Kontact.php
 *
 * @author Lim Yuan Qing <hello@yuanqing.sg>
 * @license MIT
 * @link https://github.com/yuanqing/kontact
 */

use yuanqing\Kontact\Kontact;

class KontactExceptionTest extends PHPUnit_Framework_TestCase
{
  /**
   * @expectedException InvalidArgumentException
   */
  public function testInvalidSchema()
  {
    new Kontact(null, function() {});
  }

  /**
   * @expectedException InvalidArgumentException
   */
  public function testInvalidCallback()
  {
    new Kontact(array(), null);
  }

}
