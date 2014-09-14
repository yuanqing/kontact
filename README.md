# kontact [![npm Version](http://img.shields.io/npm/v/kontact.svg?style=flat)](https://www.npmjs.org/package/kontact) [![Packagist Version](http://img.shields.io/packagist/v/yuanqing/kontact.svg?style=flat)](https://packagist.org/packages/yuanqing/kontact) [![Build Status](https://img.shields.io/travis/yuanqing/kontact.svg?style=flat)](https://travis-ci.org/yuanqing/kontact)

> An extensible contact form in PHP and vanilla JavaScript/AJAX.

## Quick start

1. Clone this repo into a location accessible via [`localhost`](http://localhost/). For example, do:

  ```bash
  $ cd ~/Sites
  $ git clone https://github.com/yuanqing/kontact
  $ cd kontact/example
  ```

  Or simply upload [this repo](https://github.com/yuanqing/kontact/archive/master.zip) onto a web server that can run PHP.

2. Open [`example/index.php`](https://github.com/yuanqing/kontact/blob/master/example/index.php) on a web browser, break out your JavaScript console, and have a go at submitting the contact form.

## Usage

Our contact form is composed of the following:

### &bull; [example/index.php](https://github.com/yuanqing/kontact/blob/master/example/index.php)

This is the HTML for the contact form itself.

```html
<body>
  <form action="mail.php" method="post" class="kontact">
    <div><label for="name">Name</label><input type="text" name="name" id="name" value="<?php echo @$_GET['data']['name']; ?>" /></div>
    <div><label for="email">Email</label><input type="text" name="email" id="email" value="<?php echo @$_GET['data']['email']; ?>" /></div>
    <div><label for="message">Message</label><textarea name="message" id="message"><?php echo @$_GET['data']['message']; ?></textarea></div>
    <div><input type="submit" value="Send" /></div>
  </form>
  <script src="../js/dist/kontact.min.js"></script>
  <script src="script.js"></script>
</body>
```

1. The `js/dist/kontact.min.js` and `script.js` JavaScript files are to be placed just before the closing `body` tag.

2. The `action` attribute of the `form` is `mail.php`.

### &bull; [example/script.js](https://github.com/yuanqing/kontact/blob/master/example/script.js)

This is the JavaScript that sends the user input via AJAX to `mail.php`.

```js
var form = document.querySelectorAll('.kontact')[0];
kontact(form, function(err, data) {
  console.log(err, data);
  if (err) {
    // do stuff with `err`, eg. manipulate the DOM to show error messages
    return;
  }
});
```

#### kontact(form, cb)

Listens to the `submit` event on the given `form`, and sends the user input for validation.

1. `form` is a DOM element. User input is sent to the URL specified in its `action` attribute. (In our example, `action` is `mail.php`.)

2. Form validation results are returned via the `cb(err, data)` callback. The value of `err` may be one of:

  - `0` &mdash; No error in user input.
  - `array` &mdash; There was an error in the user input. Each element in the array corresponds to a form field where there had been an error.

  `data` is an array containing the user input.

### &bull; [example/mail.php](https://github.com/yuanqing/kontact/blob/master/example/mail.php)

This is the PHP script that processes the submitted form, and returns a response. It requires the file `php/src/Kontact.php`.

```php
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
```

#### Kontact::__construct($schema, $cb)

Constructs a new `Kontact` instance.

1. `$schema` is an `array`, with each element corresponding to a form field. The key is the name of the form field. The value is an `array` containing the following:
  - `optional` &mdash; Set to `true` if the form field can be empty. Defaults to `false`.
  - `validate` &mdash; A `callable` for validating user input. It must return `false` if the user input is invalid.
  - `err` &mdash; The error message (a `string`) that is returned if `optional` is `false` but the field was empty, or if the `validate` callaback returned `false` for the given user input.

2. `$cb` is a `callable` that is passed the results of the form validation (namely, the `$err` messages and the user input `$data`). Do server-side stuff in `$cb`, eg. send email, or add `$data` to a database.

#### Kontact::process($input, $origin)

Validates the user `$input`. The user is redirected to `$origin` if the form was submitted with JavaScript disabled.

## Installation

Install via [npm](https://www.npmjs.org/package/kontact):

```bash
$ npm i --save kontact
```

Or via [composer](https://packagist.org/packages/yuanqing/kontact):

```bash
$ composer require yuanqing/kontact
```

## License

[MIT license](https://github.com/yuanqing/kontact/blob/master/LICENSE)
