(function(require) {

  var jQuery = require('jquery') || window.jQuery,
    request = require('request') || window.request,
    sexy = require('sexy-args') || window.sexy;

  jDistiller = function(opts) {
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
    
    this.dsl[key] = function(element, prev) {
      if (munger) {
        //this.dsl[key] is executed with a special scope, we mainain this by using another .call(this).
        return munger.call(this, element, prev);
      } else {
        
        // If no munger is provided combine
        // all the text for the elments that match
        // the selector.
        if (prev.content) {
          prev.content += ' ';
        } else {
          prev.content = '';
        }

        prev.content += element.text().trim();
        return prev.content;
      }
    };
    this.dsl[key].selector = selector;
    
    return this;
  };

  jDistiller.prototype.distill = function(url, callback) {
    if (this._isURL(url)) {
      this.distillURL(url, callback);
    }
    else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(url)) {
      this.distillBuffer(url, callback);
    }
    else if (typeof url === 'string') {
      this.distillString(url, callback);
    }
    else if (typeof url === 'object') {
      this.distillJQuery(url, callback);
    }
  };

  jDistiller.prototype._isURL = function(string) {
    if (typeof string !== 'string') return false;
    
    var match = string.match(/https?:/);
    
    if (match && match.index === 0) {
      return true;
    }
  };

  jDistiller.prototype.distillURL = function(url, callback) {
    var _this = this;
    
    this.request({
      url: url,
      followAllRedirects: true
    }, function(err, res, page) {
      
      if (!res) {
        err = new Error('empty response');
      } else if (res.statusCode < 200 || res.statusCode >= 300) {
        err = new Error('http status ', res.statusCode)	
      }
      
      if (err) {
        callback(err, null);
        return;
      }
      
      _this._applyDSL(_this._getJQueryObject(page), callback);
    });
  };

  jDistiller.prototype.distillBuffer = function(url, callback) {
    this._applyDSL(this._getJQueryObject(url.toString(), callback), callback);
  };

  jDistiller.prototype.distillString = function(url, callback) {
    this._applyDSL(this._getJQueryObject(url, callback), callback);
  };

  jDistiller.prototype.distillJQuery = function(url, callback) {
    this._applyDSL(url, callback);
  };

  jDistiller.prototype._getJQueryObject = function(rawPage, callback) {
    try {
      return jQuery(rawPage);
    } catch (e) {
      callback(e, null);
    }
  };

  jDistiller.prototype._applyDSL = function(page, callback) {
    var distilledPage = {},
      _this = this;

    try {
      
      Object.keys(this.dsl).forEach(function(k) {
        distilledPage[k] = _this._function(k, _this.dsl[k], page, distilledPage);
      });

      callback( null, distilledPage );

    } catch (e) {
      callback(e, null);
    }
  };

  jDistiller.prototype._function = function(key, func, page, distilledPage) {
    var scope = {
      distilledSoFar: function() {
        return distilledPage;
      },
      ___array: [],
      ___object: {},
      ___value: null
      },
      elements = page.find(func.selector);
    
    if (!elements.length) {
      scope.___value = ''; // Default to returning an empty string if no elements mat the selector.
    } else {
      for (var i = 0, element; (element = elements[i]) != null; i++) {
        scope.___currentElement = jQuery(element);
        this._handleReturn( key, func.call(scope, scope.___currentElement, scope.___object), scope );
      }
    }
    
    if (typeof scope.___value === 'string' || scope.___value) {
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
      scope.___object = this._smartMerge(scope.___object, value);
    }
    
    else if (value) {
      scope.___value = value;
    }
  };

  jDistiller.prototype._smartMerge = function(v1, v2) {
    var _this = this;
    
    if (Array.isArray(v1)) {
      return v1.concat(v2);
    }
    
    else if (typeof v1 === 'object') {
      Object.keys(v2).forEach(function(k) {
        v1[k] = _this._smartMerge(v1[k], v2[k]);
      });
      return v1;
    }
    
    return v2;
  };

  if (typeof exports !== 'undefined') exports.jDistiller = jDistiller;
})(typeof window === 'undefined' ? require : function() {});
