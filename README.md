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

The __set()__ method is used on an instance of jDistiller, to specify __Key/CSS Selector__ pairs.

When the __distill()__ method is called, a JavaScript object will be returned populated with the text values of the CSS selectors.

Key/CSS Selector Pairs
----------------------

**DSL**

```javascript
var jDistiller = require('./lib').jDistiller;

new jDistiller()
	.set('headline', '#article h1.articleHeadline')
	.set('firstParagraph', '#article .articleBody p:first')
	.distill('http://www.nytimes.com/2012/09/09/us/politics/obama-and-romney-battle-for-votes-in-2-swing-states.html?_r=1&hp', function(err, distilledPage) {
		console.log(JSON.stringify(distilledPage))
	});
```

**Output**

```json
{"headline":"Obama Tries to Turn Focus to Medicare From Jobs Figures","firstParagraph":"SEMINOLE, Fla. — President Obama on Saturday began hammering away at the Republican ticket’s plans for Medicare, using a campaign swing through Florida, with its large number of retired and elderly voters, to try to turn the page from anemic employment growth, his biggest weakness, to entitlements, a Democratic strength."}
```

An Optional Closure for Value
--------------------------

A closure can optionally be provided as the third parameter to the __set()__ method.

If a closure is given, the return value of the closure will be set as a key's value. rather than the text value of the selector.

**DSL**

```javascript
var jDistiller = require('./lib').jDistiller;

new jDistiller()
	.set('headline', '#article h1.articleHeadline')
	.set('firstParagraph', '#article .articleBody p:first')
	.set('image', '#article .articleBody .articleSpanImage img', function(element, prev) {
		return element.attr('src')
	})
	.distill('http://www.nytimes.com/2012/09/09/us/politics/obama-and-romney-battle-for-votes-in-2-swing-states.html?_r=1&hp', function(err, distilledPage) {
		console.log(JSON.stringify(distilledPage))
	});
```

**Output**

```json
{"headline":"Obama Tries to Turn Focus to Medicare From Jobs Figures","firstParagraph":"SEMINOLE, Fla. — President Obama on Saturday began hammering away at the Republican ticket’s plans for Medicare, using a campaign swing through Florida, with its large number of retired and elderly voters, to try to turn the page from anemic employment growth, his biggest weakness, to entitlements, a Democratic strength.","image":"http://graphics8.nytimes.com/images/2012/09/09/us/JP-CANDIDATE-1/JP-CANDIDATE-1-articleLarge.jpg"}
```

Closure Inputs
--------------

* **element**
* **prev**
* **this**
