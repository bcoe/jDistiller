var equal = require('assert').equal,
	fs = require('fs'),
	jDistiller = require('../lib').jDistiller;

var mockRequest = function(params, callback) {
	callback(null, {statusCode: 200}, fs.readFileSync('./fixtures/dog.html').toString() );
};

exports.tests = {
		'values can be a string reresenting a DOM selector': function(finished, prefix) {	
				new jDistiller(
					// The Parsing DSL.
					{
						title: '#firstHeading span',
						firstHeading: '.mw-headline:first'
					},
					
					// Mock the request library.
					{request: mockRequest}
				).distill('http://www.example.com', function(err, distilledPage) {
					equal(distilledPage.title, 'Dog', prefix + ' title was not parsed.');
					equal(distilledPage.firstHeading, 'Etymology and related terminology', prefix + ' first heading was not parsed.');
					finished();
				});
		},
		
		'you can nest selectors in objects': function(finished, prefix) {
				new jDistiller(
					// The Parsing DSL.
					{
						title: '#firstHeading span',
						headings: {
							firstHeading: '.mw-headline:first',
							lastHeading: '.mw-headline:last'
						}
					},
					
					// Mock the request library.
					{request: mockRequest}
				).distill('http://www.example.com', function(err, distilledPage) {
					equal(distilledPage.headings.firstHeading, 'Etymology and related terminology', prefix + ' first heading was not parsed.');
					equal(distilledPage.headings.lastHeading, 'External links', prefix + ' last heading was not parsed.');
					finished();
				});
		},
		
		'values can be a function rather than a DOM selector': function(finished, prefix) {
				new jDistiller(
					// The Parsing DSL.
					{
						title: function(element) {
							this.selector('#firstHeading span')
							this.value( element.text().split('').reverse().join('') )
						}
					},
					
					// Mock the request library.
					{request: mockRequest}
				).distill('http://www.example.com', function(err, distilledPage) {
					equal(distilledPage.title, 'goD', prefix + ' function for returning title not executed.');
					finished();
				});
		},
		
		'push() method within a closure creates an array of elements': function(finished, prefix) {
				new jDistiller(
					// The Parsing DSL.
					{
						headings: function(element) {
							this.selector('h3')
							this.push( element.text().trim() )
						}
					},
					
					// Mock the request library.
					{request: mockRequest}
				).distill('http://www.example.com', function(err, distilledPage) {
					equal(distilledPage.headings[0], 'DNA studies', prefix + ' list was not created.');
					finished();
				});
		},
		
		'inner functions apply a selector to the outer element': function(finished, prefix) {
				new jDistiller(
					// The Parsing DSL.
					{
						references: function(element) {
							this.selector('.reference')
							this.push({
								citation_number:  function(element2) {
									this.selector('a')
									this.value(element2.text().trim());
								}
							})
						}
					},
					
					// Mock the request library.
					{request: mockRequest}
				).distill('http://www.example.com', function(err, distilledPage) {
					equal(distilledPage.references[0].citation_number, '[1]', prefix + ' inner function not executed.');
					finished();
				});
		},
		'set() method within a closure allows an inner object to be created': function(finished, prefix) {
				new jDistiller(
					// The Parsing DSL.
					{
						sections: function(element) {
							this.selector('#content p,img,h1,h2,h3')
							
							if (element.is('h1') || element.is('h2') || element.is('h3')) {
								this.heading = element.text().trim()
								return
							}
							
							if (element.is('img') && element.attr('height') > 50) {
								this.set(this.heading, {
								  images: [element.attr('src').replace('//', 'http://')]
								});
								return
							}
							
							this.set(this.heading, {
								text: element.text()
							})
						}
					},
					
					// Mock the request library.
					{request: mockRequest}
				).distill('http://www.example.com', function(err, distilledPage) {
					equal(distilledPage.sections['Physical characteristics'].images.length > 0, true, prefix + ' text not parsed.');
					equal(distilledPage.sections['Physical characteristics'].text.length > 0, true, prefix + ' images not parsed.');
					finished();
				});
		}
}