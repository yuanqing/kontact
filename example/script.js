'use strict';

var form = document.querySelectorAll('.kontact')[0];
kontact(form, function(err, data) {
  console.log(err, data);
});
