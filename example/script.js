'use strict';

var form = document.querySelectorAll('.kontact')[0];
kontact(form, function(err, data) {
  if (err) {
    // do stuff with `err`, eg. manipulate the DOM to show error messages
    return;
  }
});
