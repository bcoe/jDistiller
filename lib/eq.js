'use strict';

var regex = /^(.*?)(?:(?:\:(first))|(?:\:(last))|(?:\:eq\((\d+)\)))(.*)/;

var cheerioEq = function ($, selector) {
  var parts = [];
  var match;

  while (match = selector.match(regex)) {
    parts.push(match[1]);
    if (match[2]) parts.push(0);
    else if (match[3]) parts.push(-1);
    else parts.push(parseInt(match[4], 10));
    selector = match[5].trim();
  }
  parts.push(selector);

  var cursor = $(parts.shift());
  parts
    .filter(function (selector) {
      return selector !== '';
    })
    .forEach(function (selector) {
      cursor = typeof selector === 'number' ? cursor.eq(selector) : cursor.find(selector);
    });

  return cursor;
};

// wrap cheerio, exposing the new API.
cheerioEq.wrap = function($) {
  var original = $.load;

  $.load = function(body) {
    var parsed = original(body);

    return function(selector) {
      return cheerioEq(parsed, selector);
    }
  }

  return $;
}

module.exports = cheerioEq;
