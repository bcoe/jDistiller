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
					.distill('http://www.example.com', function(err, distilledPage) {
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
		}
}