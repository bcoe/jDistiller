jDistiller
=========

**Author:** [@benjamincoe](https://twitter.com/#/benjamincoe)

Over my past couple years in the industry, there have been several times where I need to scrape structured information from (relatively) unstructured XHTML websites.

My approach to doing this has gradually evolved to include the following technologies:

* [Node.js](http://nodejs.org/)
* [jQuery](http://jquery.com/)
* [Request](https://github.com/mikeal/request)

I was starting to notice a lot of code duplication in my scraping scripts, enter jDistiller:

What is jDistiller?
------------------

* jDistiller is a simple and powerful DSL for scraping structured information from XHTML websites.
* it is built on jQuery and Node.js.
* it grows out of my experiences, having built several one-off page scrapers.

The DSL
-------

* first you create an instance of the __jDistiller__ object.

```javascript
var jDistiller = require('./lib').jDistiller;
new jDistiller()
```

* the __set()__ method is used to specify key/css-selector pairs to scrape data from.

```javascript
new jDistiller()
	.set('headline', '#article h1.articleHeadline')
	.set('firstParagraph', '#article .articleBody p:first');
```

* when the __distill()__ method is called, with an URL as input, a JavaScript object will be returned populated with the scraped data.

**Simple Example (New York Times)**

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

An Optional Closure can be Provided for Setting Value
--------------------------

A closure can optionally be provided as the third parameter for the __set()__ method.

If a closure is given, the return value of the closure will be set as a key's value, rather than the text value of the selector.

**DSL Using Optional Closure**

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
The closure will be passed the following values:

* **element:** a jQuery element matching the CSS selector specified in __set()__.
* **prev:** if multiple elements on the page match the selector, the closure is will be executed once for each. __prev__ can be used to interact with the object created by previous executions of the closure. As an example, we might want to increment a counter if the same link occurs multiple times on the same page.
* **this:** the state is shared between multiple executions of the same closure (see __examples/wikipedia.js__, to get an idea of why this is useful).

Closure Return Types
-------------------

* **strings** the last string returned for a selector will be used as the value.
* **numbers** the last number returned for a selector will be used as the value.
* **arrays** when an array is returned, it will be merged with all other arrays returned for the given key. The final merged array will be set as value.

**Array Merging Example**

```javascript
var jDistiller = require('./lib').jDistiller;

new jDistiller()
	.set('paragraphs', '#article .articleBody p', function(element) {
		return [element.text()]
	})
	.distill('http://www.nytimes.com/2012/09/09/us/politics/obama-and-romney-battle-for-votes-in-2-swing-states.html?_r=1&hp', function(err, distilledPage) {
		console.log(JSON.stringify(distilledPage))
	});
```

**output**

```json
{"paragraphs": ["SEMINOLE, Fla. — President Obama on Saturday began hammering away at the Republican ticket’s...", "Kicking off a two-day bus tour through...", ...]}
```

* **objects** when an object is returned, the object will be merged with all other objects returned. The final object will be used as the value.

**Object Merging Example**

```javascript
var jDistiller = require('./lib').jDistiller;

new jDistiller()
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
	.distill('http://en.wikipedia.org/wiki/Dog', function(err, distilledPage) {
		console.log(JSON.stringify(distilledPage));
	});
```

**Output**

```json
{"headlines":{"second_heading":"Taxonomy","third_heading":"History and evolution"}}
```

* **key/object-pair** this special return type allows value to be populated with an object that has dynamically generated key names.

**Key Object Pair Example**

```javascript
var jDistiller = require('./lib').jDistiller;

new jDistiller()
	.set('links', '#bodyContent p a', function(element, prev) {
		var key = element.attr('href');
		return [key, {
			title: element.attr('title'),
			href: key,
			occurrences: prev[key] ? prev[key].occurrences + 1 : 1
		}]
	})
	.distill('http://en.wikipedia.org/wiki/Dog', function(err, distilledPage) {
		console.log(JSON.stringify(distilledPage));
	});
```

**Output**

```json
{"links":{"#cite_note-MSW3_Lupus-1":{"title":"","href":"#cite_note-MSW3_Lupus-1","occurrences":1},"#cite_note-ADW-2":{"title":"","href":"#cite_note-ADW-2","occurrences":1},"/wiki/Gray_wolf_subspecies":{"title":"Gray wolf subspecies","href":"/wiki/Gray_wolf_subspecies","occurrences":1},"/wiki/Gray_wolf":{"title":"Gray wolf","href":"/wiki/Gray_wolf","occurrences":1},"/wiki/Canidae":{"title":"Canidae","href":"/wiki/Canidae","occurrences":1}}}
```

Conclusion
----------

I'm excited about jDistiller, I think it has the potential to solve an annoying class of problems. 

Don't be shy with your feedback and/or contributions.

-- Ben [@benjamincoe](https://twitter.com/#/benjamincoe)
