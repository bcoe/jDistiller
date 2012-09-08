jDistiller
=========

Over my past couple years in the industry, there have been many times where I need to scrape structured information from (relatively) unstructured XHTML websites.

My approach to doing this has gradually evolved to include the following technologies:

* [Node.js](http://nodejs.org/).
* [jQuery](http://jquery.com/).
* [Request](https://github.com/mikeal/request).

I was starting to notice a lot of code duplication in my scraping scripts. enter jDistiller:

What is jDistiller?
------------------

* jDistiller is a slick DSL for extracting structured information from XHTML websites.
* it is built on jQuery and Node.js.
* it grows out of my experiences, having built several one-off page scrapers.

The DSL
-------

The __set()__ method is used on an instance of jDistiller, to specify __key/CSS Selector__ pairs.

When the __distill()__ method is called, a JavaScript object will be returned populated with the values of the CSS selector.

**Key/CSS Selector Pairs**

```javascript
var jDistiller = require('./lib').jDistiller;

new jDistiller()
	.set('headline', '#article h1.articleHeadline')
	.set('firstParagraph', '#article .articleBody p:first')
	.distill('http://www.nytimes.com/2012/09/09/us/politics/obama-and-romney-battle-for-votes-in-2-swing-states.html?_r=1&hp', function(err, distilledPage) {
		console.log(JSON.stringify(distilledPage))
	});
```