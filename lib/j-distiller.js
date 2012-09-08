var jQuery = require('jQuery'),
		request = require('request'),
		sexy = require('sexy-args');

function jDistiller(opts) {
	sexy.args([this, 'object1'], {
		'object1': {
			request: request,
			dsl: {}
		}
	}, function() {
		sexy.extend(this, opts);
	});
}

jDistiller.prototype.set = function(key, selector, munger) {
	var _this = this;
	
	this.dsl[key] = function(element, prev) {
		if (munger) {
			return munger.call(this, element, prev);
		} else {
			return element.text().trim();
		}
	};
	this.dsl[key].selector = selector;
	
	return this;
};

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
		callback(e, null);
	}
};

jDistiller.prototype._object = function(object, page, distilledPage) {
	for (var k in object) {
		if ( object.hasOwnProperty(k) ) {
			distilledPage[k] = this._parseValue(k, object[k], page);
		}
	}
	return distilledPage;
};

jDistiller.prototype._parseValue = function(key, value, page) {
	if (typeof value === 'string') {
		return this._string(value, page);
	}
	
	else if (typeof value === 'object') {
		return this._object(key, value, page, {});
	}

	else if (typeof value === 'function') {
		return this._function(key, value, page, {});
	}
	
	else if (typeof value === 'number') {
		return value;
	}
};

jDistiller.prototype._string = function(selector, page) {
	return page.find(selector).text().trim();
};

jDistiller.prototype._function = function(key, func, page) {
	var _this = this,
		scope = {
			___array: [],
			___object: {},
			___value: null
		},
		elements = page.find(func.selector);
	
	for (var i = 0, element; (element = elements[i]) != null; i++) {
		scope.___currentElement = jQuery(element);
		this._handleReturn( key, func.call(scope, scope.___currentElement, scope.___object), scope );
	}
	
	if (scope.___value) {
		return scope.___value;
	}
	
	else if (scope.___array.length > 0) {
		return scope.___array;
	}
	
	return scope.___object;
};

jDistiller.prototype._handleReturn = function( key, value, scope ) {
	// Handle the special case of setting variable named keys on an object value.
	if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'string' && typeof value[1] === 'object') {
		if (!scope.___object[value[0]]) {
			scope.___object[value[0]] = value[1];
		} else {
			scope.___object[value[0]] = this._smartMerge(scope.___object[value[0]], value[1]);
		}
	}
	
	else if (Array.isArray(value)) {
		scope.___array = scope.___array.concat(value);
	}
	
	else if (typeof(value) === 'object') {
		if (!scope.___object[key]) {
			scope.___object[key] = value;
		} else {
			scope.___object[key] = this._smartMerge(scope.___object[key], value);
		}
	}
	
	else if (value) {
		scope.___value = value;
	}
};

jDistiller.prototype._smartMerge = function(v1, v2) {
	if (Array.isArray(v1)) {
		return v1.concat(v2);
	}

	else if (typeof v1 === 'object') {
		for (var k in v2) {
			v1[k] = this._smartMerge(v1[k], v2[k]);
		}
		return v1;
	}
	
	return v2;
};

exports.jDistiller = jDistiller;