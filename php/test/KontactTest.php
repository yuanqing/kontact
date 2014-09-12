<?php
/**
 * Kontact.php
 *
 * @author Lim Yuan Qing <hello@yuanqing.sg>
 * @license MIT
 * @link https://github.com/yuanqing/kontact
 */

use yuanqing\Kontact\Kontact;

class KontactTest extends PHPUnit_Framework_TestCase
{
  public $schema;
  public $cb;
  public $cb_args;

  public function setUp()
  {
    $this->schema = array(
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
    );
    $this->cb = function() {
      $this->cb_args = func_get_args();
    };
  }

  public function post($data, $expected)
  {
    $this->cb_args = array();
    $post = array(
      'json' => json_encode($data)
    );
    $kontact = new Kontact($this->schema, $this->cb);
    ob_start();
    $kontact->process($post, null);
    $response = json_decode(ob_get_clean(), true);
    $this->assertEquals($expected, $response);
  }

  /**
   * @runInSeparateProcess
   */
  public function testEmptyOptionalField()
  {
    $data = array(
      'name' => '', // empty optional field
      'email' => 'foo@bar.com',
      'message' => 'baz'
    );
    $expected_data = array(
      'email' => 'foo@bar.com',
      'message' => 'baz'
    );
    $expected = array(
      'err' => 0,
      'data' => $expected_data
    );
    $this->post($data, $expected);
    $this->assertEquals(array($expected_data), $this->cb_args);
  }

  /**
   * @runInSeparateProcess
   */
  public function testEmptyRequiredField()
  {
    $data = array(
      'name' => 'foo',
      'email' => 'foo@bar.com',
      'message' => '' // empty required field
    );
    $expected = array(
      'err' => array(
        'message' => 'Please enter a message'
      ),
      'data' => array(
        'name' => 'foo',
        'email' => 'foo@bar.com'
      )
    );
    $this->post($data, $expected);
    $this->assertEquals(array(), $this->cb_args); // `$cb` not called
  }

  /**
   * @runInSeparateProcess
   */
  public function testInvalidField()
  {
    $data = array(
      'name' => 'foo',
      'email' => 'foo', // invalid field
      'message' => 'bar'
    );
    $expected = array(
      'err' => array(
        'email' => $this->schema['email']['err']
      ),
      'data' => $data
    );
    $this->post($data, $expected);
    $this->assertEquals(array(), $this->cb_args); // `$cb` not called
  }

  /**
   * @runInSeparateProcess
   */
  public function testRedirect()
  {
    $data = array(
      'name' => 'foo',
      'email' => 'foo@bar.com',
      'message' => 'baz'
    );
    $this->cb_args = array();
    $kontact = new Kontact($this->schema, $this->cb);
    $kontact->process($data, 'qux');
    $this->assertEquals(array('Location: qux?err=0&data%5Bname%5D=foo&data%5Bemail%5D=foo%40bar.com&data%5Bmessage%5D=baz'), xdebug_get_headers());
    $this->assertEquals(array($data), $this->cb_args);
  }

}
