var equal = require('assert').equal,
  fs = require('fs'),
  jDistiller = require('../lib').jDistiller,
  jQuery = require('jquery');

var dogArticle = fs.readFileSync('./fixtures/dog.html').toString(),
  mockRequest = function(params, callback) {
    callback(null, {statusCode: 200}, dogArticle);
  },
  page = jQuery(dogArticle);

exports.tests = {
  'set() set with a DOM selector and no closure sets a value on the distlled page equal to text() of the selector': function(finished, prefix) {	
    new jDistiller({request: mockRequest})
      .set('title', '#firstHeading span')
      .set('firstHeadline', '.mw-headline:first')
      .distill('http://www.example.com', function(err, distilledPage) {
        equal(distilledPage.title, page.find('#firstHeading span').text(), prefix + ' title was not parsed.');
        equal(distilledPage.firstHeadline, page.find('.mw-headline:first').text(), prefix + ' first heading was not parsed.');
        finished();
      });
  },
  'set() with a DOM selector that matches multiple elements should combine text': function(finished, prefix) {
    new jDistiller({request: mockRequest})
      .set('h2Text', 'h2')
      .distill('http://www.example.com', function(err, distilledPage) {
        equal(distilledPage.h2Text.indexOf('Contents') > -1, true);
        equal(distilledPage.h2Text.indexOf('Etymology and related terminology') > -1, true);
        finished();
      });
  },
  'set() when an element is not found it should default to an empty string': function(finished, prefix) {
    new jDistiller({request: mockRequest})
      .set('h2Text', '.banana')
      .distill('http://www.example.com', function(err, distilledPage) {
        equal('', distilledPage.h2Text);
        finished();
      });
  },
  'set() with a closure returning strings sets a string value on the distilled page': function(finished, prefix) {
    new jDistiller({request: mockRequest})
      .set('headline3', '.mw-headline', function(element) {
        this.count = this.count || 0;
        this.count ++;
        // Grab the third headline.
        if (this.count === 3) {
          return element.text().trim();
        }
      })
      .distillURL('http://www.example.com', function(err, distilledPage) {
        equal(distilledPage.headline3, jQuery( page.find('.mw-headline')[2] ).text(), prefix + ' third headline not found.');
        finished();
      });
  },
  'set() with a closure returning an object merges object keys': function(finished, prefix) {
    new jDistiller({request: mockRequest})
      .set('headlines', '.mw-headline', function(element) {
        this.count = this.count || 0;
        this.count ++;
        if (this.count === 2) {
          return {
            'second_heading': element.text().trim()
          }
        }
        if (this.count === 3) {
          return {
            'third_heading': element.text().trim()
          }
        }
      })
      .distill('http://www.example.com', function(err, distilledPage) {
        equal(distilledPage.headlines['second_heading'], jQuery( page.find('.mw-headline')[1] ).text(), prefix + ' third headline not found.');
        equal(distilledPage.headlines['third_heading'], jQuery( page.find('.mw-headline')[2] ).text(), prefix + ' third headline not found.');
        finished();
      });
  },
  'set() with a closure returning an array merges arrays together and sets an array value on the distilled page': function(finished, prefix) {
    new jDistiller({request: mockRequest})
      .set('headlines', '.mw-headline', function(element) {
        return [element.text().trim()];
      })
      .distill('http://www.example.com', function(err, distilledPage) {
        equal(distilledPage.headlines.length, page.find('.mw-headline').length, prefix + ' did not parse all headlines.');
        finished();
      });
  },
  'set() with a closure returning an object merges objects together and sets an object value on the distilled page.': function(finished, prefix) {
    new jDistiller({request: mockRequest})
      .set('links', '#bodyContent p a', function(element) {
        return [element.attr('href'), {
          title: element.attr('title'),
          href: element.attr('href')
        }]
      })
      .distill('http://www.example.com', function(err, distilledPage) {
        equal(Object.keys(distilledPage.links).length, 482, prefix + ' did not pull all links from page.');
        finished();
      });
  },
  'the previous object manipulated is passed into the closure as a parameter': function(finished, prefix) {
    new jDistiller({request: mockRequest})
      .set('links', '#bodyContent p a', function(element, prev) {
        var key = element.attr('href');
        return [key, {
          title: element.attr('title'),
          href: key,
          occurrences: prev[key] ? prev[key].occurrences + 1 : 1
        }]
      })
      .distill('http://www.example.com', function(err, distilledPage) {
        var linkCount = 0;
        Object.keys(distilledPage.links).forEach(function(link) {
          linkCount += distilledPage.links[link].occurrences;
        });
        equal(linkCount, page.find('#bodyContent p a').length, prefix + ' previous object was not set.');
        finished();
      });
  },
  'distill() method accepts a buffer rather than a url': function(finished, prefix) {	
    new jDistiller({request: mockRequest})
      .set('title', '#firstHeading span')
      .set('firstHeadline', '.mw-headline:first')
      .distill(fs.readFileSync('./fixtures/dog.html'), function(err, distilledPage) {
        equal(distilledPage.title, page.find('#firstHeading span').text(), prefix + ' title was not parsed.');
        equal(distilledPage.firstHeadline, page.find('.mw-headline:first').text(), prefix + ' first heading was not parsed.');
        finished();
      });
  },
  'distill() method accepts a string rather than a url': function(finished, prefix) {
    new jDistiller({request: mockRequest})
      .set('title', '.title')
      .distill('<html><body><h1 class="title">Hello World!</h1></body></html>', function(err, distilledPage) {
        equal(distilledPage.title, 'Hello World!', prefix + ' title was not parsed.');
        finished();
      });
  },
  'distill() method accepts a jQuery object rather than a url': function(finished, prefix) {
    new jDistiller({request: mockRequest})
      .set('title', '.title')
      .distillJQuery(jQuery('<html><body><h1 class="title">Hello World!</h1></body></html>'), function(err, distilledPage) {
        equal(distilledPage.title, 'Hello World!', prefix + ' title was not parsed.');
        finished();
      });
  },
  'this.distilledSoFar() returns the partially distilled page': function(finished, prefix) {
    new jDistiller({request: mockRequest})
      .set('title', '#firstHeading span')
      .set('firstHeadline', '.mw-headline:first', function() {
        equal(this.distilledSoFar().title, page.find('#firstHeading span').text(), prefix + ' title was not parsed.');
      })
      .distill('http://www.example.com', function(err, distilledPage) {
        if (err) throw err;
        finished();
      });
  }
};
