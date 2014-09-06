'use strict';

var atomic = require('atomic/src/atomic.js')(window);
var serialize = require('form-serialize');

var kontact = function(form, cb) {

  var url = form.getAttribute('action');

  var fn = function(e) {
    e.preventDefault();
    atomic.post(url, 'json=' + JSON.stringify(serialize(form, true))).success(function(data) {
      cb(data.err, data.data);
    }).error(function() {
      cb(1);
    });
  };

  if (form.addEventListener) {
    form.addEventListener('submit', fn, false);
  } else {
    if (form.attachEvent) {
      form.attachEvent('onsubmit', fn);
    }
  }

};

module.exports = exports = kontact;
