var jDistiller = require('../lib').jDistiller,
	fs = require('fs');

new jDistiller()
	.set('title', '#firstHeading')
	.set('links', '#bodyContent p a', function(element, prev) {
		var href = element.attr('href'),
			key = href.replace('/wiki/', '');
		
		if ( key === href) return;
		
		element.replaceWith('[[' + key + ']]');
		
		return [key, {
			title: element.attr('title'),
			text: prev[key] ? prev[key].text : element.text(),
			occurrences: prev[key] ? prev[key].occurrences + 1 : 1
		}]
	})
	.set('sections', '#bodyContent p,#firstHeading,h2,h3,img', function(element, prev) {
		var images = [];
		
		if ( element.is('h1') || element.is('h2') ) {
			this.heading = element.text().trim();
			return
		}
		
		return [this.heading, {
			text: prev[this.heading] ? prev[this.heading].text + element.text() : element.text(),
			images: element.is('img') && element.attr('width') > 50 ? [element.attr('src').replace('//', 'http://')] : []
		}];
	})
	.distill('http://en.wikipedia.org/wiki/Dog', function(err, distilledPage) {
		console.log(JSON.stringify(distilledPage.sections));
	});
