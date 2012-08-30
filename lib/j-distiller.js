var jQuery = require('jQuery'),
		request = require('request'),
		sexy = require('sexy-args');

function jDistiller(dsl, opts) {
	sexy.args([this, 'object1', 'object2'], {
		'object2': {
			request: request
		}
	}, function() {
		this.dsl = dsl;
		sexy.extend(this, opts);
	});
}

jDistiller.prototype.distill = function(url, callback) {
	var _this = this;
	
	this.request({
		url: url
	}, function(err, res, rawPage) {
		var error = err || (res.statusCode != 200 ? res.statusCode : false),
			page = null;
			
		if (error) {
			callback(error, null);
			return;
		}
		
		try {
		 	page = jQuery(rawPage);
		} catch (e) {
			callback(e, null);
			return;
		}
		
		_this._applyDSL(page, callback);
	});
};

jDistiller.prototype._applyDSL = function(page, callback) {
	var distilledPage = {};
	try {
		callback( null, this._object(this.dsl, page, distilledPage) );
	} catch (e) {
		console.warn(e);
		callback(e, null);
	}
};

jDistiller.prototype._object = function(object, page, distilledPage) {
	for (k in object) {
		if ( object.hasOwnProperty(k) ) {
			distilledPage[k] = this._interpretValue(object[k], page);
		}
	}
	return distilledPage;
};

jDistiller.prototype._interpretValue = function(value, page) {
	if (typeof value === 'string') {
		return this._string(value, page);
	}
	
	else if (typeof value === 'object') {
		return this._object(value, page, {});
	}

	else if (typeof value === 'function') {
		return this._function(value, page, {});
	}
	
	else if (typeof value === 'number') {
		return value;
	}
};

jDistiller.prototype._string = function(selector, page) {
	return page.find(selector).text().trim();
};

jDistiller.prototype._function = function(func, page, distilledPage) {
	var _this = this,
		scope = {
			selector: function(selector) {
				if (!this.___selector) {
					this.___selector = selector;
					throw 'selector extracted, stop execution.'
				}
			},
			get: function(k) {
				return this.___object[k];
			},
			push: function(v) {
				this.___array.push(_this._interpretValueWithinClosure(v, this.___currentElement));
			},
			set: function(k, v) {
				if (!this.___object[k]) {
					this.___object[k] = _this._interpretValueWithinClosure(v, this.___currentElement);
				} else {
					this.___object[k] = _this._smartMerge(this.___object[k], _this._interpretValueWithinClosure(v, this.___currentElement));
				}
			},
			value: function(v) {
				this.___value = v;
			},
			___selector: null,
			___array: [],
			___object: {},
			___value: null
		};
		
	// Fetch the selector from the function.
	try {
		func.call(scope);
	} catch (e) {
	// ignore errors during the selector fetching step.
	}
	
	// Actually apply the function.
	// we grabbed the selector in the previous invokation.
	var elements = page.find(scope.___selector)
	
	for (var i = 0, element; (element = elements[i]) != null; i++) {
		scope.___currentElement = jQuery(element);
		func.call(scope, scope.___currentElement);
	}
		
	if (scope.___value) {
		return scope.___value;
	}
	
	else if (scope.___array.length > 0) {
		return scope.___array;
	}
	
	return scope.___object;
};

jDistiller.prototype._interpretValueWithinClosure = function(value, element) {
	if (typeof value === 'string' || typeof value === 'number') {
		return value;
	}
	
	else if (Array.isArray(value)) {
		return value;
	}
	
	else if (typeof value === 'object') {
		var object = {};
		for (k in value) {
			if ( value.hasOwnProperty(k) ) {
				object[k] = this._interpretValueWithinClosure(value[k], element, {});
			}
		}
		return object;
	}
	
	else if (typeof value === 'function') {
		return this._function(value, element, {});
	}
};

jDistiller.prototype._smartMerge = function(v1, v2) {
		if (!v1) {
			return v2;
		}
		
		else if (Array.isArray(v1)) {
			return v1.concat(v2);
		}

		else if (typeof v1 === 'object') {
			for (var k in v2) {
				v1[k] = this._smartMerge(v1[k], v2[k]);
			}
			return v1;
		}
	
		else if (typeof v1 === 'string') {
			v1 += v2;
			return v1;
		}
		
		else if (typeof v2 === 'number') {
			return v2;
		}
};

exports.jDistiller = jDistiller;