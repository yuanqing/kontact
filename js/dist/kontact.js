!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.kontact=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var atomic = _dereq_('atomic/src/atomic.js')(window);
var serialize = _dereq_('form-serialize');

var kontact = function(form, cb) {

  var action = form.getAttribute('action');
  var fn = function(e) {
    e.preventDefault();
    atomic.post(action, 'json=' + JSON.stringify(serialize(form, true))).success(function(data) {
      cb(data.err, data.data);
    }).error(function() {
      cb(1, null);
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

},{"atomic/src/atomic.js":2,"form-serialize":3}],2:[function(_dereq_,module,exports){
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory;
  } else {
    root.atomic = factory(root);
  }
})(this, function (root) {

  'use strict';

  var exports = {};

  var parse = function (req) {
    var result;
    try {
      result = JSON.parse(req.responseText);
    } catch (e) {
      result = req.responseText;
    }
    return [result, req];
  };

  var xhr = function (type, url, data) {
    var methods = {
      success: function () {},
      error: function () {}
    };
    var XHR = root.XMLHttpRequest || ActiveXObject;
    var request = new XHR('MSXML2.XMLHTTP.3.0');
    request.open(type, url, true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        if (request.status >= 200 && request.status < 300) {
          methods.success.apply(methods, parse(request));
        } else {
          methods.error.apply(methods, parse(request));
        }
      }
    };
    request.send(data);
    var callbacks = {
      success: function (callback) {
        methods.success = callback;
        return callbacks;
      },
      error: function (callback) {
        methods.error = callback;
        return callbacks;
      }
    };

    return callbacks;
  };

  exports['get'] = function (src) {
    return xhr('GET', src);
  };

  exports['put'] = function (url, data) {
    return xhr('PUT', url, data);
  };

  exports['post'] = function (url, data) {
    return xhr('POST', url, data);
  };

  exports['delete'] = function (url) {
    return xhr('DELETE', url);
  };

  return exports;

});

},{}],3:[function(_dereq_,module,exports){
// get successful control from form and assemble into object
// http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2

// types which indicate a submit action and are not successful controls
// these will be ignored
var k_r_submitter = /^(?:submit|button|image|reset|file)$/i;

// node names which could be successful controls
var k_r_success_contrls = /^(?:input|select|textarea|keygen)/i;

// keys with brackets for hash keys
var brackets_regex = /\[(.+?)\]/g;
var brackeks_prefix_regex = /^(.+?)\[/;

// serializes form fields
// @param form MUST be an HTMLForm element
// @param options is an optional argument to configure the serialization. Default output
// with no options specified is a url encoded string
//    - hash: [true | false] Configure the output type. If true, the output will
//    be a js object.
//    - serializer: [function] Optional serializer function to override the default one.
//    The function takes 3 arguments (result, key, value) and should return new result
//    hash and url encoded str serializers are provided with this module
//    - disabled: [true | false]. If true serialize disabled fields.
function serialize(form, options) {
    if (typeof options != 'object') {
        options = { hash: !!options };
    }
    else if (options.hash === undefined) {
        options.hash = true;
    }

    var result = (options.hash) ? {} : '';
    var serializer = options.serializer || (options.hash) ? hash_serializer : str_serialize;

    var elements = form.elements || [];

    for (var i=0 ; i<elements.length ; ++i) {
        var element = elements[i];

        // ingore disabled fields
        if ((!options.disabled && element.disabled) || !element.name) {
            continue;
        }
        // ignore anyhting that is not considered a success field
        if (!k_r_success_contrls.test(element.nodeName) ||
            k_r_submitter.test(element.type)) {
            continue;
        }

        var key = element.name;
        var val = element.value;

        // we can't just use element.value for checkboxes cause some browsers lie to us
        // they say "on" for value when the box isn't checked
        if ((element.type === 'checkbox' || element.type === 'radio') && !element.checked) {
            val = undefined;
        }

        // value-less fields are ignored
        if (!val) {
            continue;
        }

        // multi select boxes
        if (element.type === 'select-multiple') {
            val = [];

            var options = element.options;
            for (var i=0 ; i<options.length ; ++i) {
                var option = options[i];
                if (option.selected) {
                    result = serializer(result, key, option.value);
                }
            }

            continue;
        }

        result = serializer(result, key, val);
    }

    return result;
}

// obj/hash encoding serializer
function hash_serializer(result, key, value) {
    if (key in result) {
        var existing = result[key];
        if (!Array.isArray(existing)) {
            result[key] = [existing];
        }
        result[key].push(value);
    }
    else {
        if (has_brackets(key)) {
          extract_from_brackets(result, key, value);
        }
        else {
          result[key] = value;
        }
    }

    return result;
};

// urlform encoding serializer
function str_serialize(result, key, value) {
    // encode newlines as \r\n cause the html spec says so
    value = value.replace(/(\r)?\n/g, '\r\n');
    value = encodeURIComponent(value);

    // spaces should be '+' rather than '%20'.
    value = value.replace(/%20/g, '+');
    return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + value;
};

function has_brackets(string) {
  return string.match(brackets_regex);
};

function matches_between_brackets(string) {
    // Make sure to isolate brackets_regex from .exec() calls
    var regex = new RegExp(brackets_regex);
    var matches = [];
    var match;

    while (match = regex.exec(string)) {
      matches.push(match[1]);
    }

    return matches;
};

function extract_from_brackets(result, key, value) {
    var prefix = key.match(brackeks_prefix_regex)[1];

    // Set the key if it doesn't exist
    if (! result[prefix]) result[prefix] = {};

    var parent = result[prefix];
    var matches_between = matches_between_brackets(key);
    var length = matches_between.length;

    for (var i = 0; i < length; i++) {
        var child = matches_between[i];
        var isLast = (length === i + 1);

        if (isLast) {
            var existing = parent[child];

            if (existing) {
                if (! Array.isArray(existing)) {
                    parent[child] = [ existing ];
                }

                parent[child].push(value);
            }
            else {
                // Finally make the assignment
                parent[child] = value;
            }

        }
        else {
            // This is a nested key, set it properly for the next iteration
            parent[child] = {};
            parent = parent[child];
        }
    }

    parent = value;
};

module.exports = serialize;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy95dWFucWluZy9TaXRlcy9rb250YWN0L25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy95dWFucWluZy9TaXRlcy9rb250YWN0L2pzL3NyYy9mYWtlX2JmMTg1MjBjLmpzIiwiL1VzZXJzL3l1YW5xaW5nL1NpdGVzL2tvbnRhY3Qvbm9kZV9tb2R1bGVzL2F0b21pYy9zcmMvYXRvbWljLmpzIiwiL1VzZXJzL3l1YW5xaW5nL1NpdGVzL2tvbnRhY3Qvbm9kZV9tb2R1bGVzL2Zvcm0tc2VyaWFsaXplL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBhdG9taWMgPSByZXF1aXJlKCdhdG9taWMvc3JjL2F0b21pYy5qcycpKHdpbmRvdyk7XG52YXIgc2VyaWFsaXplID0gcmVxdWlyZSgnZm9ybS1zZXJpYWxpemUnKTtcblxudmFyIGtvbnRhY3QgPSBmdW5jdGlvbihmb3JtLCBjYikge1xuXG4gIHZhciBhY3Rpb24gPSBmb3JtLmdldEF0dHJpYnV0ZSgnYWN0aW9uJyk7XG4gIHZhciBmbiA9IGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgYXRvbWljLnBvc3QoYWN0aW9uLCAnanNvbj0nICsgSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplKGZvcm0sIHRydWUpKSkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICBjYihkYXRhLmVyciwgZGF0YS5kYXRhKTtcbiAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgIGNiKDEsIG51bGwpO1xuICAgIH0pO1xuICB9O1xuXG4gIGlmIChmb3JtLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGZuLCBmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGZvcm0uYXR0YWNoRXZlbnQpIHtcbiAgICAgIGZvcm0uYXR0YWNoRXZlbnQoJ29uc3VibWl0JywgZm4pO1xuICAgIH1cbiAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBrb250YWN0O1xuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICB9IGVsc2Uge1xuICAgIHJvb3QuYXRvbWljID0gZmFjdG9yeShyb290KTtcbiAgfVxufSkodGhpcywgZnVuY3Rpb24gKHJvb3QpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGV4cG9ydHMgPSB7fTtcblxuICB2YXIgcGFyc2UgPSBmdW5jdGlvbiAocmVxKSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXEucmVzcG9uc2VUZXh0KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXN1bHQgPSByZXEucmVzcG9uc2VUZXh0O1xuICAgIH1cbiAgICByZXR1cm4gW3Jlc3VsdCwgcmVxXTtcbiAgfTtcblxuICB2YXIgeGhyID0gZnVuY3Rpb24gKHR5cGUsIHVybCwgZGF0YSkge1xuICAgIHZhciBtZXRob2RzID0ge1xuICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge30sXG4gICAgICBlcnJvcjogZnVuY3Rpb24gKCkge31cbiAgICB9O1xuICAgIHZhciBYSFIgPSByb290LlhNTEh0dHBSZXF1ZXN0IHx8IEFjdGl2ZVhPYmplY3Q7XG4gICAgdmFyIHJlcXVlc3QgPSBuZXcgWEhSKCdNU1hNTDIuWE1MSFRUUC4zLjAnKTtcbiAgICByZXF1ZXN0Lm9wZW4odHlwZSwgdXJsLCB0cnVlKTtcbiAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKTtcbiAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgaWYgKHJlcXVlc3Quc3RhdHVzID49IDIwMCAmJiByZXF1ZXN0LnN0YXR1cyA8IDMwMCkge1xuICAgICAgICAgIG1ldGhvZHMuc3VjY2Vzcy5hcHBseShtZXRob2RzLCBwYXJzZShyZXF1ZXN0KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWV0aG9kcy5lcnJvci5hcHBseShtZXRob2RzLCBwYXJzZShyZXF1ZXN0KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIHJlcXVlc3Quc2VuZChkYXRhKTtcbiAgICB2YXIgY2FsbGJhY2tzID0ge1xuICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIG1ldGhvZHMuc3VjY2VzcyA9IGNhbGxiYWNrO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2tzO1xuICAgICAgfSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgbWV0aG9kcy5lcnJvciA9IGNhbGxiYWNrO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2tzO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gY2FsbGJhY2tzO1xuICB9O1xuXG4gIGV4cG9ydHNbJ2dldCddID0gZnVuY3Rpb24gKHNyYykge1xuICAgIHJldHVybiB4aHIoJ0dFVCcsIHNyYyk7XG4gIH07XG5cbiAgZXhwb3J0c1sncHV0J10gPSBmdW5jdGlvbiAodXJsLCBkYXRhKSB7XG4gICAgcmV0dXJuIHhocignUFVUJywgdXJsLCBkYXRhKTtcbiAgfTtcblxuICBleHBvcnRzWydwb3N0J10gPSBmdW5jdGlvbiAodXJsLCBkYXRhKSB7XG4gICAgcmV0dXJuIHhocignUE9TVCcsIHVybCwgZGF0YSk7XG4gIH07XG5cbiAgZXhwb3J0c1snZGVsZXRlJ10gPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgcmV0dXJuIHhocignREVMRVRFJywgdXJsKTtcbiAgfTtcblxuICByZXR1cm4gZXhwb3J0cztcblxufSk7XG4iLCIvLyBnZXQgc3VjY2Vzc2Z1bCBjb250cm9sIGZyb20gZm9ybSBhbmQgYXNzZW1ibGUgaW50byBvYmplY3Rcbi8vIGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw0MDEvaW50ZXJhY3QvZm9ybXMuaHRtbCNoLTE3LjEzLjJcblxuLy8gdHlwZXMgd2hpY2ggaW5kaWNhdGUgYSBzdWJtaXQgYWN0aW9uIGFuZCBhcmUgbm90IHN1Y2Nlc3NmdWwgY29udHJvbHNcbi8vIHRoZXNlIHdpbGwgYmUgaWdub3JlZFxudmFyIGtfcl9zdWJtaXR0ZXIgPSAvXig/OnN1Ym1pdHxidXR0b258aW1hZ2V8cmVzZXR8ZmlsZSkkL2k7XG5cbi8vIG5vZGUgbmFtZXMgd2hpY2ggY291bGQgYmUgc3VjY2Vzc2Z1bCBjb250cm9sc1xudmFyIGtfcl9zdWNjZXNzX2NvbnRybHMgPSAvXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxrZXlnZW4pL2k7XG5cbi8vIGtleXMgd2l0aCBicmFja2V0cyBmb3IgaGFzaCBrZXlzXG52YXIgYnJhY2tldHNfcmVnZXggPSAvXFxbKC4rPylcXF0vZztcbnZhciBicmFja2Vrc19wcmVmaXhfcmVnZXggPSAvXiguKz8pXFxbLztcblxuLy8gc2VyaWFsaXplcyBmb3JtIGZpZWxkc1xuLy8gQHBhcmFtIGZvcm0gTVVTVCBiZSBhbiBIVE1MRm9ybSBlbGVtZW50XG4vLyBAcGFyYW0gb3B0aW9ucyBpcyBhbiBvcHRpb25hbCBhcmd1bWVudCB0byBjb25maWd1cmUgdGhlIHNlcmlhbGl6YXRpb24uIERlZmF1bHQgb3V0cHV0XG4vLyB3aXRoIG5vIG9wdGlvbnMgc3BlY2lmaWVkIGlzIGEgdXJsIGVuY29kZWQgc3RyaW5nXG4vLyAgICAtIGhhc2g6IFt0cnVlIHwgZmFsc2VdIENvbmZpZ3VyZSB0aGUgb3V0cHV0IHR5cGUuIElmIHRydWUsIHRoZSBvdXRwdXQgd2lsbFxuLy8gICAgYmUgYSBqcyBvYmplY3QuXG4vLyAgICAtIHNlcmlhbGl6ZXI6IFtmdW5jdGlvbl0gT3B0aW9uYWwgc2VyaWFsaXplciBmdW5jdGlvbiB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvbmUuXG4vLyAgICBUaGUgZnVuY3Rpb24gdGFrZXMgMyBhcmd1bWVudHMgKHJlc3VsdCwga2V5LCB2YWx1ZSkgYW5kIHNob3VsZCByZXR1cm4gbmV3IHJlc3VsdFxuLy8gICAgaGFzaCBhbmQgdXJsIGVuY29kZWQgc3RyIHNlcmlhbGl6ZXJzIGFyZSBwcm92aWRlZCB3aXRoIHRoaXMgbW9kdWxlXG4vLyAgICAtIGRpc2FibGVkOiBbdHJ1ZSB8IGZhbHNlXS4gSWYgdHJ1ZSBzZXJpYWxpemUgZGlzYWJsZWQgZmllbGRzLlxuZnVuY3Rpb24gc2VyaWFsaXplKGZvcm0sIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgIT0gJ29iamVjdCcpIHtcbiAgICAgICAgb3B0aW9ucyA9IHsgaGFzaDogISFvcHRpb25zIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKG9wdGlvbnMuaGFzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG9wdGlvbnMuaGFzaCA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9IChvcHRpb25zLmhhc2gpID8ge30gOiAnJztcbiAgICB2YXIgc2VyaWFsaXplciA9IG9wdGlvbnMuc2VyaWFsaXplciB8fCAob3B0aW9ucy5oYXNoKSA/IGhhc2hfc2VyaWFsaXplciA6IHN0cl9zZXJpYWxpemU7XG5cbiAgICB2YXIgZWxlbWVudHMgPSBmb3JtLmVsZW1lbnRzIHx8IFtdO1xuXG4gICAgZm9yICh2YXIgaT0wIDsgaTxlbGVtZW50cy5sZW5ndGggOyArK2kpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBlbGVtZW50c1tpXTtcblxuICAgICAgICAvLyBpbmdvcmUgZGlzYWJsZWQgZmllbGRzXG4gICAgICAgIGlmICgoIW9wdGlvbnMuZGlzYWJsZWQgJiYgZWxlbWVudC5kaXNhYmxlZCkgfHwgIWVsZW1lbnQubmFtZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWdub3JlIGFueWh0aW5nIHRoYXQgaXMgbm90IGNvbnNpZGVyZWQgYSBzdWNjZXNzIGZpZWxkXG4gICAgICAgIGlmICgha19yX3N1Y2Nlc3NfY29udHJscy50ZXN0KGVsZW1lbnQubm9kZU5hbWUpIHx8XG4gICAgICAgICAgICBrX3Jfc3VibWl0dGVyLnRlc3QoZWxlbWVudC50eXBlKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIga2V5ID0gZWxlbWVudC5uYW1lO1xuICAgICAgICB2YXIgdmFsID0gZWxlbWVudC52YWx1ZTtcblxuICAgICAgICAvLyB3ZSBjYW4ndCBqdXN0IHVzZSBlbGVtZW50LnZhbHVlIGZvciBjaGVja2JveGVzIGNhdXNlIHNvbWUgYnJvd3NlcnMgbGllIHRvIHVzXG4gICAgICAgIC8vIHRoZXkgc2F5IFwib25cIiBmb3IgdmFsdWUgd2hlbiB0aGUgYm94IGlzbid0IGNoZWNrZWRcbiAgICAgICAgaWYgKChlbGVtZW50LnR5cGUgPT09ICdjaGVja2JveCcgfHwgZWxlbWVudC50eXBlID09PSAncmFkaW8nKSAmJiAhZWxlbWVudC5jaGVja2VkKSB7XG4gICAgICAgICAgICB2YWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWx1ZS1sZXNzIGZpZWxkcyBhcmUgaWdub3JlZFxuICAgICAgICBpZiAoIXZhbCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtdWx0aSBzZWxlY3QgYm94ZXNcbiAgICAgICAgaWYgKGVsZW1lbnQudHlwZSA9PT0gJ3NlbGVjdC1tdWx0aXBsZScpIHtcbiAgICAgICAgICAgIHZhbCA9IFtdO1xuXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IGVsZW1lbnQub3B0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGk9MCA7IGk8b3B0aW9ucy5sZW5ndGggOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9uID0gb3B0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9uLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHNlcmlhbGl6ZXIocmVzdWx0LCBrZXksIG9wdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdCA9IHNlcmlhbGl6ZXIocmVzdWx0LCBrZXksIHZhbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gb2JqL2hhc2ggZW5jb2Rpbmcgc2VyaWFsaXplclxuZnVuY3Rpb24gaGFzaF9zZXJpYWxpemVyKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIGlmIChrZXkgaW4gcmVzdWx0KSB7XG4gICAgICAgIHZhciBleGlzdGluZyA9IHJlc3VsdFtrZXldO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZXhpc3RpbmcpKSB7XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IFtleGlzdGluZ107XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0W2tleV0ucHVzaCh2YWx1ZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoaGFzX2JyYWNrZXRzKGtleSkpIHtcbiAgICAgICAgICBleHRyYWN0X2Zyb21fYnJhY2tldHMocmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8vIHVybGZvcm0gZW5jb2Rpbmcgc2VyaWFsaXplclxuZnVuY3Rpb24gc3RyX3NlcmlhbGl6ZShyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICAvLyBlbmNvZGUgbmV3bGluZXMgYXMgXFxyXFxuIGNhdXNlIHRoZSBodG1sIHNwZWMgc2F5cyBzb1xuICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvKFxccik/XFxuL2csICdcXHJcXG4nKTtcbiAgICB2YWx1ZSA9IGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG5cbiAgICAvLyBzcGFjZXMgc2hvdWxkIGJlICcrJyByYXRoZXIgdGhhbiAnJTIwJy5cbiAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoLyUyMC9nLCAnKycpO1xuICAgIHJldHVybiByZXN1bHQgKyAocmVzdWx0ID8gJyYnIDogJycpICsgZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyAnPScgKyB2YWx1ZTtcbn07XG5cbmZ1bmN0aW9uIGhhc19icmFja2V0cyhzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5tYXRjaChicmFja2V0c19yZWdleCk7XG59O1xuXG5mdW5jdGlvbiBtYXRjaGVzX2JldHdlZW5fYnJhY2tldHMoc3RyaW5nKSB7XG4gICAgLy8gTWFrZSBzdXJlIHRvIGlzb2xhdGUgYnJhY2tldHNfcmVnZXggZnJvbSAuZXhlYygpIGNhbGxzXG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChicmFja2V0c19yZWdleCk7XG4gICAgdmFyIG1hdGNoZXMgPSBbXTtcbiAgICB2YXIgbWF0Y2g7XG5cbiAgICB3aGlsZSAobWF0Y2ggPSByZWdleC5leGVjKHN0cmluZykpIHtcbiAgICAgIG1hdGNoZXMucHVzaChtYXRjaFsxXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoZXM7XG59O1xuXG5mdW5jdGlvbiBleHRyYWN0X2Zyb21fYnJhY2tldHMocmVzdWx0LCBrZXksIHZhbHVlKSB7XG4gICAgdmFyIHByZWZpeCA9IGtleS5tYXRjaChicmFja2Vrc19wcmVmaXhfcmVnZXgpWzFdO1xuXG4gICAgLy8gU2V0IHRoZSBrZXkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgIGlmICghIHJlc3VsdFtwcmVmaXhdKSByZXN1bHRbcHJlZml4XSA9IHt9O1xuXG4gICAgdmFyIHBhcmVudCA9IHJlc3VsdFtwcmVmaXhdO1xuICAgIHZhciBtYXRjaGVzX2JldHdlZW4gPSBtYXRjaGVzX2JldHdlZW5fYnJhY2tldHMoa2V5KTtcbiAgICB2YXIgbGVuZ3RoID0gbWF0Y2hlc19iZXR3ZWVuLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gbWF0Y2hlc19iZXR3ZWVuW2ldO1xuICAgICAgICB2YXIgaXNMYXN0ID0gKGxlbmd0aCA9PT0gaSArIDEpO1xuXG4gICAgICAgIGlmIChpc0xhc3QpIHtcbiAgICAgICAgICAgIHZhciBleGlzdGluZyA9IHBhcmVudFtjaGlsZF07XG5cbiAgICAgICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgICAgIGlmICghIEFycmF5LmlzQXJyYXkoZXhpc3RpbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFtjaGlsZF0gPSBbIGV4aXN0aW5nIF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcGFyZW50W2NoaWxkXS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEZpbmFsbHkgbWFrZSB0aGUgYXNzaWdubWVudFxuICAgICAgICAgICAgICAgIHBhcmVudFtjaGlsZF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIG5lc3RlZCBrZXksIHNldCBpdCBwcm9wZXJseSBmb3IgdGhlIG5leHQgaXRlcmF0aW9uXG4gICAgICAgICAgICBwYXJlbnRbY2hpbGRdID0ge307XG4gICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnRbY2hpbGRdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGFyZW50ID0gdmFsdWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNlcmlhbGl6ZTtcbiJdfQ==
(1)
});
