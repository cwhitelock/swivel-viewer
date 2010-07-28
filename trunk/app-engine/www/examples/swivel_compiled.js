// Input 0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 */

/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 */
var goog = goog || {}; // Check to see if already defined in current scope


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Creates object stubs for a namespace. When present in a file, goog.provide
 * also indicates that the file defines the indicated object. Calls to
 * goog.provide are resolved by the compiler if --closure_pass is set.
 * @param {string} name name of the object that this file defines.
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


if (!COMPILED) {
  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {Object} The object or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (cur[part]) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};


/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @param {string} rule Rule to include, in the form goog.package.part.
 */
goog.require = function(rule) {

  // if the object already exists we do not need do do anything
  // TODO: If we start to support require based on file name this has
  //            to change
  // TODO: If we allow goog.foo.* this has to change
  // TODO: If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.getObjectByName(rule)) {
      return;
    }
    var path = goog.getPathFromDeps_(rule);
    if (path) {
      goog.included_[path] = true;
      goog.writeScripts_();
    } else {
      var errorMessage = 'goog.require could not find: ' + rule;
      if (goog.global.console) {
        goog.global.console['error'](errorMessage);
      }

        throw Error(errorMessage);
    }
  }
};


/**
 * Whether goog.require should throw an exception if it fails.
 * @type {boolean}
 */
goog.useStrictRequires = false;


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * Null function used for default values of callbacks, etc.
 * @type {!Function}
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {...*} var_args The arguments of the function.
 * @return {*} The first argument.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(var_args) {
  return arguments[0];
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor());
  };
};


if (!COMPILED) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    visited: {}, // used when resolving dependencies to prevent us from
                 // visiting the file twice
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    }
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var l = src.length;
      if (src.substr(l - 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Writes a script tag if, and only if, that script hasn't already been added
   * to the document.  (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_() &&
        !goog.dependencies_.written[src]) {
      goog.dependencies_.written[src] = true;
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' +
                src + '"></' + 'script>');
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls writeScriptTag_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          if (requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName]);
          } else if (!goog.getObjectByName(requireName)) {
            // If the required name is defined, we assume that this
            // dependency was bootstapped by other means. Otherwise,
            // throw an exception.
            throw Error('Undefined nameToPath for ' + requireName);
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.writeScriptTag_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.writeScriptTag_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // We cannot use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if (value instanceof Array ||  // Works quickly in same execution context.
          // If value is from a different execution context then
          // !(value instanceof Object), which lets us early out in the common
          // case when value is from the same context but not an array.
          // The {if (value)} check above means we don't have to worry about
          // undefined behavior of Object.prototype.toString on null/undefined.
          //
          // HACK: In order to use an Object prototype method on the arbitrary
          //   value, the compiler requires the value be cast to type Object,
          //   even though the ECMA spec explicitly allows it.
          (!(value instanceof Object) &&
           (Object.prototype.toString.call(
               /** @type {Object} */ (value)) == '[object Array]') ||

           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if (!(value instanceof Object) &&
          (Object.prototype.toString.call(
              /** @type {Object} */ (value)) == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  // In Safari typeof nodeList returns 'function', and on Firefox
  // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
  // and RegExps.  We would like to return object for those and we can
  // detect an invalid function by making sure that the function
  // object has a call method.
  } else if (s == 'function' && typeof value.call == 'undefined') {
    return 'object';
  }
  return s;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE). Does not use browser native
 * Object.propertyIsEnumerable.
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  // KJS in Safari 2 is not ECMAScript compatible and lacks crucial methods
  // such as propertyIsEnumerable.  We therefore use a workaround.
  // Does anyone know a more efficient work around?
  if (propName in object) {
    for (var key in object) {
      if (key == propName &&
          Object.prototype.hasOwnProperty.call(object, propName)) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE).
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerable_ = function(object, propName) {
  // In IE if object is from another window, cannot use propertyIsEnumerable
  // from this window's Object. Will raise a 'JScript object expected' error.
  if (object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName);
  } else {
    return goog.propertyIsEnumerableCustom_(object, propName);
  }
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == 'object' || type == 'array' || type == 'function';
};


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 */
goog.getHashCode = function(obj) {
  // In IE, DOM nodes do not extend Object so they do not have this method.
  // we need to check hasOwnProperty because the proto might have this set.

  // TODO: There is a proposal to add hashcode as a global function to JS2
  //            we should keep track of this process so we can use that whenever
  //            it starts to show up in the real world.
  if (obj.hasOwnProperty && obj.hasOwnProperty(goog.HASH_CODE_PROPERTY_)) {
    return obj[goog.HASH_CODE_PROPERTY_];
  }
  if (!obj[goog.HASH_CODE_PROPERTY_]) {
    obj[goog.HASH_CODE_PROPERTY_] = ++goog.hashCodeCounter_;
  }
  return obj[goog.HASH_CODE_PROPERTY_];
};


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 */
goog.removeHashCode = function(obj) {
  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.HASH_CODE_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.HASH_CODE_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for hash code property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.HASH_CODE_PROPERTY_ = 'closure_hashCode_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for hash codes.
 * @type {number}
 * @private
 */
goog.hashCodeCounter_ = 0;


/**
 * Clone an object/array (recursively)
 * @param {Object} proto Object to clone.
 * @return {Object} Clone of x;.
 */
goog.cloneObject = function(proto) {
  var type = goog.typeOf(proto);
  if (type == 'object' || type == 'array') {
    if (proto.clone) {
      // TODO Change to proto.clone() once # args warn is removed
      return proto.clone.call(proto);
    }
    var clone = type == 'array' ? [] : {};
    for (var key in proto) {
      clone[key] = goog.cloneObject(proto[key]);
    }
    return clone;
  }

  return proto;
};


/**
 * Forward declaration for the clone method. This is necessary until the
 * compiler can better support duck-typing constructs as used in
 * goog.cloneObject.
 *
 * TODO: Remove once the JSCompiler can infer that the check for
 * proto.clone is safe in goog.cloneObject.
 *
 * @type {Function}
 */
Object.prototype.clone;


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run. If the value is null or undefined, it
 *     will default to the global object.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 *
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.bind = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs);
    };

  } else {
    return function() {
      return fn.apply(context, arguments);
    };
  }
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // NOTE: can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * A macro for defining composite types.
 *
 * By assigning goog.typedef to a name, this tells JSCompiler that this is not
 * the name of a class, but rather it's the name of a composite type.
 *
 * For example,
 * /** @type {Array|NodeList} / goog.ArrayLike = goog.typedef;
 * will tell JSCompiler to replace all appearances of goog.ArrayLike in type
 * definitions with the union of Array and NodeList.
 *
 * Does nothing in uncompiled code.
 */
goog.typedef = true;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * Without JS Compiler the arguments are simple joined with a hyphen and passed
 * through unaltered.
 *
 * With the JS Compiler the arguments are inlined, e.g:
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If a CSS renaming map is passed to the compiler it will replace symbols in
 * the classname.  If one argument is passed it will be processed, if two are
 * passed only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * Names are split on 'hyphen' and processed in parts such that the following
 * are equivalent:
 *   var base = goog.getCssName('baseclass');
 *   goog.getCssName(base, 'modifier');
 *   goog.getCSsName('baseclass-modifier');
 *
 * If any part does not appear in the renaming map a warning is logged and the
 * original, unobfuscated class name is inlined.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var cssName = className + (opt_modifier ? '-' + opt_modifier : '');
  return (goog.cssNameMapping_ && (cssName in goog.cssNameMapping_)) ?
      goog.cssNameMapping_[cssName] : cssName;
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog-menu": "a",
 *   "goog-menu-disabled": "a-b",
 *   "CSS_LOGO": "b",
 *   "hidden": "c"
 * });
 *
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog-menu') + ' ' + goog.getCssName('goog-menu', 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 */
goog.setCssNameMapping = function(mapping) {
  goog.cssNameMapping_ = mapping;
};


/**
 * Abstract implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), values[key]);
  }
  return str;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   ParentClass.call(this, a, b);
 * }
 *
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};



// Input 1
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Utilities for manipulating arrays.
 *
 */


goog.provide('goog.array');


/**
 * @type {Array|NodeList|Arguments|{length: number}}
 */
goog.array.ArrayLike = goog.typedef;


/**
 * Returns the last element in an array without removing it.
 * @param {goog.array.ArrayLike} array The array.
 * @return {*} Last item in array.
 */
goog.array.peek = function(array) {
  return array[array.length - 1];
};


/**
 * Reference to the original {@code Array.prototype}.
 * @private
 */
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;


// NOTE: Since most of the array functions are generic it allows you to
// pass an array-like object. Strings have a length and are considered array-
// like. However, the 'in' operator does not work on strings so we cannot just
// use the array path even if the browser supports indexing into strings. We
// therefore end up splitting the string.


/**
 * Returns the index of the first element of an array with a specified
 * value, or -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-indexof}
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at index 0.
 * @return {number} The index of the first matching array element.
 */
goog.array.indexOf = goog.array.ARRAY_PROTOTYPE_.indexOf ?
    function(arr, obj, opt_fromIndex) {
      return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ?
          0 : (opt_fromIndex < 0 ?
               Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex);

      if (goog.isString(arr)) {
        // Array.prototype.indexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.indexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i < arr.length; i++) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Returns the index of the last element of an array with a specified value, or
 * -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-lastindexof}
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {?number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at the end of the array.
 * @return {number} The index of the last matching array element.
 */
goog.array.lastIndexOf = goog.array.ARRAY_PROTOTYPE_.lastIndexOf ?
    function(arr, obj, opt_fromIndex) {
      // Firefox treats undefined and null as 0 in the fromIndex argument which
      // leads it to always return -1
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
      return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;

      if (fromIndex < 0) {
        fromIndex = Math.max(0, arr.length + fromIndex);
      }

      if (goog.isString(arr)) {
        // Array.prototype.lastIndexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.lastIndexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i >= 0; i--) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Calls a function for each element in an array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-foreach}
 *
 * @param {goog.array.ArrayLike} arr Array or array like object over
 *     which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored. The function is called only for indexes of the array
 *     which have assigned values; it is not called for indexes which have
 *     been deleted or which have never been assigned values.
 *
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 */
goog.array.forEach = goog.array.ARRAY_PROTOTYPE_.forEach ?
    function(arr, f, opt_obj) {
      goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          f.call(opt_obj, arr2[i], i, arr);
        }
      }
    };


/**
 * Calls a function for each element in an array, starting from the last
 * element rather than the first.
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 */
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; --i) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};


/**
 * Calls a function for each element in an array, and if the function returns
 * true adds the element to a new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-filter}
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array in which only elements that passed the test are
 *     present.
 */
goog.array.filter = goog.array.ARRAY_PROTOTYPE_.filter ?
    function(arr, f, opt_obj) {
      return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = [];
      var resLength = 0;
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          var val = arr2[i];  // in case f mutates arr2
          if (f.call(opt_obj, val, i, arr)) {
            res[resLength++] = val;
          }
        }
      }
      return res;
    };


/**
 * Calls a function for each element in an array and inserts the result into a
 * new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-map}
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return something. The result will be inserted into a new array.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array with the results from f.
 */
goog.array.map = goog.array.ARRAY_PROTOTYPE_.map ?
    function(arr, f, opt_obj) {
      return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = new Array(l);
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          res[i] = f.call(opt_obj, arr2[i], i, arr);
        }
      }
      return res;
    };


/**
 * Passes every element of an array into a function and accumulates the result.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduce}
 *
 * For example:
 * var a = [1, 2, 3, 4];
 * goog.array.reduce(a, function(r, v, i, arr) {return r + v;}, 0);
 * returns 10
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {*} val The initial value to pass into the function on the first call.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {*} Result of evaluating f repeatedly across the values of the array.
 */
goog.array.reduce = function(arr, f, val, opt_obj) {
  if (arr.reduce) {
    if (opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduce(f, val);
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * Passes every element of an array into a function and accumulates the result,
 * starting from the last element and working towards the first.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduceright}
 *
 * For example:
 * var a = ['a', 'b', 'c'];
 * goog.array.reduceRight(a, function(r, v, i, arr) {return r + v;}, '');
 * returns 'cba'
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {*} val The initial value to pass into the function on the first call.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {*} Object returned as a result of evaluating f repeatedly across the
 *     values of the array.
 */
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if (arr.reduceRight) {
    if (opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduceRight(f, val);
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * Calls f for each element of an array. If any call returns true, some()
 * returns true (without checking the remaining elements). If all calls
 * return false, some() returns false.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-some}
 *
 * @param {goog.array.ArrayLike} arr The array to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} true if any element passes the test.
 */
goog.array.some = goog.array.ARRAY_PROTOTYPE_.some ?
    function(arr, f, opt_obj) {
      return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
          return true;
        }
      }
      return false;
    };


/**
 * Call f for each element of an array. If all calls return true, every()
 * returns true. If any call returns false, every() returns false and
 * does not continue to check the remaining elements.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-every}
 *
 * @param {goog.array.ArrayLike} arr The array to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} false if any element fails the test.
 */
goog.array.every = goog.array.ARRAY_PROTOTYPE_.every ?
    function(arr, f, opt_obj) {
      return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
          return false;
        }
      }
      return true;
    };


/**
 * Search an array for the first element that satisfies a given condition and
 * return that element.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {*} The first array element that passes the test, or null if no
 *     element is found.
 */
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array for the first element that satisfies a given condition and
 * return its index.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the first array element that passes the test,
 *     or -1 if no element is found.
 */
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = 0; i < l; i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return that element.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {*} The last array element that passes the test, or null if no
 *     element is found.
 */
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return its index.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the last array element that passes the test,
 *     or -1 if no element is found.
 */
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Whether the array contains the given object.
 * @param {goog.array.ArrayLike} arr The array to test for the presence of the
 *     element.
 * @param {*} obj The object for which to test.
 * @return {boolean} true if obj is present.
 */
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0;
};


/**
 * Whether the array is empty.
 * @param {goog.array.ArrayLike} arr The array to test.
 * @return {boolean} true if empty.
 */
goog.array.isEmpty = function(arr) {
  return arr.length == 0;
};


/**
 * Clears the array.
 * @param {goog.array.ArrayLike} arr Array or array like object to clear.
 */
goog.array.clear = function(arr) {
  // For non real arrays we don't have the magic length so we delete the
  // indices.
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1; i >= 0; i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};


/**
 * Pushes an item into an array, if it's not already in the array.
 * @param {Array} arr Array into which to insert the item.
 * @param {*} obj Value to add.
 */
goog.array.insert = function(arr, obj) {
  if (!goog.array.contains(arr, obj)) {
    arr.push(obj);
  }
};


/**
 * Inserts an object at the given index of the array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {*} obj The object to insert.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};


/**
 * Inserts at the given index of the array, all elements of another array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {goog.array.ArrayLike} elementsToAdd The array of elements to add.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};


/**
 * Inserts an object into an array before a specified object.
 * @param {Array} arr The array to modify.
 * @param {*} obj The object to insert.
 * @param {*=} opt_obj2 The object before which obj should be inserted. If obj2
 *     is omitted or not found, obj is inserted at the end of the array.
 */
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj);
  } else {
    goog.array.insertAt(arr, obj, i);
  }
};


/**
 * Removes the first occurrence of a particular value from an array.
 * @param {goog.array.ArrayLike} arr Array from which to remove value.
 * @param {*} obj Object to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if ((rv = i >= 0)) {
    goog.array.removeAt(arr, i);
  }
  return rv;
};


/**
 * Removes from an array the element at index i
 * @param {goog.array.ArrayLike} arr Array or array like object from which to
 *     remove value.
 * @param {number} i The index to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.removeAt = function(arr, i) {
  // use generic form of splice
  // splice returns the removed items and if successful the length of that
  // will be 1
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1;
};


/**
 * Removes the first value that satisfies the given condition.
 * @param {goog.array.ArrayLike} arr Array from which to remove value.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {boolean} True if an element was removed.
 */
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};


/**
 * Returns a new array that is the result of joining the arguments.  If arrays
 * are passed then their items are added, however, if non-arrays are passed they
 * will be added to the return array as is.
 *
 * Note that ArrayLike objects will be added as is, rather than having their
 * items added.
 *
 * goog.array.concat([1, 2], [3, 4]) -> [1, 2, 3, 4]
 * goog.array.concat(0, [1, 2]) -> [0, 1, 2]
 * goog.array.concat([1, 2], null) -> [1, 2, null]
 *
 * There is bug in all current versions of IE (6, 7 and 8) where arrays created
 * in an iframe become corrupted soon (not immediately) after the iframe is
 * destroyed. This is common if loading data via goog.net.IframeIo, for example.
 * This corruption only affects the concat method which will start throwing
 * Catastrophic Errors (#-2147418113).
 *
 * See http://endoflow.com/scratch/corrupted-arrays.html for a test case.
 *
 * Internally goog.array should use this, so that all methods will continue to
 * work on these broken array objects.
 *
 * @param {...*} var_args Items to concatenate.  Arrays will have each item
 *     added, while primitives and objects will be added as is.
 * @return {!Array} The new resultant array.
 */
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(
      goog.array.ARRAY_PROTOTYPE_, arguments);
};


/**
 * Does a shallow copy of an array.
 * @param {goog.array.ArrayLike} arr  Array or array-like object to clone.
 * @return {!Array} Clone of the input array.
 */
goog.array.clone = function(arr) {
  if (goog.isArray(arr)) {
    return goog.array.concat(/** @type {!Array} */ (arr));
  } else { // array like
    // Concat does not work with non arrays.
    var rv = [];
    for (var i = 0, len = arr.length; i < len; i++) {
      rv[i] = arr[i];
    }
    return rv;
  }
};


/**
 * Converts an object to an array.
 * @param {goog.array.ArrayLike} object  The object to convert to an array.
 * @return {!Array} The object converted into an array. If object has a
 *     length property, every property indexed with a non-negative number
 *     less than length will be included in the result. If object does not
 *     have a length property, an empty array will be returned.
 */
goog.array.toArray = function(object) {
  if (goog.isArray(object)) {
    // This fixes the JS compiler warning and forces the Object to an Array type
    return goog.array.concat(/** @type {!Array} */ (object));
  }
  // Clone what we hope to be an array-like object to an array.
  // We could check isArrayLike() first, but no check we perform would be as
  // reliable as simply making the call.
  return goog.array.clone(/** @type {Array} */ (object));
};


/**
 * Extends an array with another array, element, or "array like" object.
 * This function operates 'in-place', it does not create a new Array.
 *
 * Example:
 * var a = [];
 * goog.array.extend(a, [0, 1]);
 * a; // [0, 1]
 * goog.array.extend(a, 2);
 * a; // [0, 1, 2]
 *
 * @param {Array} arr1  The array to modify.
 * @param {...*} var_args The elements or arrays of elements to add to arr1.
 */
goog.array.extend = function(arr1, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var arr2 = arguments[i];
    // If we have an Array or an Arguments object we can just call push
    // directly.
    var isArrayLike;
    if (goog.isArray(arr2) ||
        // Detect Arguments. ES5 says that the [[Class]] of an Arguments object
        // is "Arguments" but only V8 and JSC/Safari gets this right. We instead
        // detect Arguments by checking for array like and presence of "callee".
        (isArrayLike = goog.isArrayLike(arr2)) &&
            // The getter for callee throws an exception in strict mode
            // according to section 10.6 in ES5 so check for presence instead.
            arr2.hasOwnProperty('callee')) {
      arr1.push.apply(arr1, arr2);

    // Otherwise loop over arr2 to prevent copying the object.
    } else if (isArrayLike) {
      var len1 = arr1.length;
      var len2 = arr2.length;
      for (var j = 0; j < len2; j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};


/**
 * Adds or removes elements from an array. This is a generic version of Array
 * splice. This means that it might work on other objects similar to arrays,
 * such as the arguments object.
 *
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {number|undefined} index The index at which to start changing the
 *     array. If not defined, treated as 0.
 * @param {number} howMany How many elements to remove (0 means no removal. A
 *     value below 0 is treated as zero and so is any other non number. Numbers
 *     are floored).
 * @param {...*} var_args Optional, additional elements to insert into the
 *     array.
 * @return {!Array} the removed elements.
 */
goog.array.splice = function(arr, index, howMany, var_args) {
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(
      arr, goog.array.slice(arguments, 1));
};


/**
 * Returns a new array from a segment of an array. This is a generic version of
 * Array slice. This means that it might work on other objects similar to
 * arrays, such as the arguments object.
 *
 * @param {goog.array.ArrayLike} arr The array from which to copy a segment.
 * @param {number} start The index of the first element to copy.
 * @param {number=} opt_end The index after the last element to copy.
 * @return {!Array} A new array containing the specified segment of the original
 *     array.
 */
goog.array.slice = function(arr, start, opt_end) {
  // passing 1 arg to slice is not the same as passing 2 where the second is
  // null or undefined (in that case the second argument is treated as 0).
  // we could use slice on the arguments object and then use apply instead of
  // testing the length
  if (arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
  } else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
  }
};


/**
 * Removes all duplicates from an array (retaining only the first
 * occurrence of each array element).  This function modifies the
 * array in place and doesn't change the order of the non-duplicate items.
 *
 * For objects, duplicates are identified as having the same hash code property
 * as defined by {@link goog.getHashCode}.
 *
 * Runtime: N,
 * Worstcase space: 2N (no dupes)
 *
 * @param {goog.array.ArrayLike} arr The array from which to remove duplicates.
 * @param {Array=} opt_rv An optional array in which to return the results,
 *     instead of performing the removal inplace.  If specified, the original
 *     array will remain unchanged.
 */
goog.array.removeDuplicates = function(arr, opt_rv) {
  var rv = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var hc = goog.isObject(current) ? goog.getHashCode(current) : current;
    if (!Object.prototype.hasOwnProperty.call(seen, hc)) {
      seen[hc] = true;
      rv[cursorInsert++] = current;
    }
  }
  rv.length = cursorInsert;
};


/**
 * Searches the specified array for the specified target using the binary
 * search algorithm.  If no opt_compareFn is specified, elements are compared
 * using <code>goog.array.defaultCompare</code>, which compares the elements
 * using the built in < and > operators.  This will produce the expected
 * behavior for homogeneous arrays of String(s) and Number(s). The array
 * specified <b>must</b> be sorted in ascending order (as defined by the
 * comparison function).  If the array is not sorted, results are undefined.
 * If the array contains multiple instances of the specified target value, any
 * of these instances may be found.
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} target The sought value.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative integer, zero, or a positive integer depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {number} Index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 */
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  var left = 0;
  var right = arr.length - 1;
  var compareFn = opt_compareFn || goog.array.defaultCompare;
  while (left <= right) {
    var mid = (left + right) >> 1;
    var compareResult = compareFn(target, arr[mid]);
    if (compareResult > 0) {
      left = mid + 1;
    } else if (compareResult < 0) {
      right = mid - 1;
    } else {
      return mid;
    }
  }
  // Not found, left is the insertion point.
  return -(left + 1);
};


/**
 * Sorts the specified array into ascending order.  If no opt_compareFn is
 * specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s).
 *
 * This sort is not guaranteed to be stable.
 *
 * Runtime: Same as <code>Array.prototype.sort</code>
 *
 * @param {Array} arr The array to be sorted.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is to be ordered. Should take 2 arguments to compare, and return a
 *     negative integer, zero, or a positive integer depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 */
goog.array.sort = function(arr, opt_compareFn) {
  goog.array.ARRAY_PROTOTYPE_.sort.call(
      arr, opt_compareFn || goog.array.defaultCompare);
};


/**
 * Sorts the specified array into ascending order in a stable way.  If no
 * opt_compareFn is specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s).
 *
 * Runtime: Same as <code>Array.prototype.sort</code>, plus an additional
 * O(n) overhead of copying the array twice.
 *
 * @param {Array} arr The array to be sorted.
 * @param {function(*, *): number=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative integer, zero, or a positive integer depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 */
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var i = 0; i < arr.length; i++) {
    arr[i] = {index: i, value: arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  };
  goog.array.sort(arr, stableCompareFn);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].value;
  }
};


/**
 * Sorts an array of objects by the specified object key and compare
 * function. If no compare function is provided, the key values are
 * compared in ascending order using <code>goog.array.defaultCompare</code>.
 * This won't work for keys that get renamed by the compiler. So use
 * {'foo': 1, 'bar': 2} rather than {foo: 1, bar: 2}.
 * @param {Array.<Object>} arr An array of objects to sort.
 * @param {string} key The object key to sort by.
 * @param {Function=} opt_compareFn The function to use to compare key
 *     values.
 */
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key]);
  });
};


/**
 * Compares two arrays for equality. Two arrays are considered equal if they
 * have the same length and their corresponding elements are equal according to
 * the comparison function.
 *
 * @param {goog.array.ArrayLike} arr1 The first array to compare.
 * @param {goog.array.ArrayLike} arr2 The second array to compare.
 * @param {Function=} opt_equalsFn Optional comparison function.
 *     Should take 2 arguments to compare, and return true if the arguments
 *     are equal. Defaults to {@link goog.array.defaultCompareEquality} which
 *     compares the elements using the built-in '===' operator.
 * @return {boolean} Whether the two arrays are equal.
 */
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) ||
      arr1.length != arr2.length) {
    return false;
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for (var i = 0; i < l; i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};


/**
 * @deprecated Use {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr1 See {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr2 See {@link goog.array.equals}.
 * @param {Function=} opt_equalsFn See {@link goog.array.equals}.
 * @return {boolean} See {@link goog.array.equals}.
 */
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn);
};


/**
 * Compares its two arguments for order, using the built in < and >
 * operators.
 * @param {*} a The first object to be compared.
 * @param {*} b The second object to be compared.
 * @return {number} a negative integer, zero, or a positive integer
 *     as the first argument is less than, equal to, or greater than the
 *     second.
 */
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};


/**
 * Compares its two arguments for equality, using the built in === operator.
 * @param {*} a The first object to compare.
 * @param {*} b The second object to compare.
 * @return {boolean} True if the two arguments are equal, false otherwise.
 */
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};


/**
 * Inserts a value into a sorted array. The array is not modified if the
 * value is already present.
 * @param {Array} array The array to modify.
 * @param {*} value The object to insert.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and
 *     return a negative integer, zero, or a positive integer depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @return {boolean} True if an element was inserted.
 */
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true;
  }
  return false;
};


/**
 * Removes a value from a sorted array.
 * @param {Array} array The array to modify.
 * @param {*} value The object to remove.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and
 *     return a negative integer, zero, or a positive integer depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @return {boolean} True if an element was removed.
 */
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return (index >= 0) ? goog.array.removeAt(array, index) : false;
};


/**
 * Splits an array into disjoint buckets according to a splitting function.
 * @param {Array} array The array.
 * @param {Function} sorter Function to call for every element.  This
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a valid object key (a string, number, etc), or undefined, if
 *     that object should not be placed in a bucket.
 * @return {!Object} An object, with keys being all of the unique return values
 *     of sorter, and values being arrays containing the items for
 *     which the splitter returned that key.
 */
goog.array.bucket = function(array, sorter) {
  var buckets = {};

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if (goog.isDef(key)) {
      // Push the value to the right bucket, creating it if necessary.
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }

  return buckets;
};


/**
 * Returns an array consisting of the given value repeated N times.
 *
 * @param {*} value The value to repeat.
 * @param {number} n The repeat count.
 * @return {!Array.<*>} An array with the repeated value.
 */
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
};


/**
 * Returns an array consisting of every argument with all arrays
 * expanded in-place recursively.
 *
 * @param {...*} var_args The values to flatten.
 * @return {!Array.<*>} An array containing the flattened values.
 */
goog.array.flatten = function(var_args) {
  var result = [];
  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element));
    } else {
      result.push(element);
    }
  }
  return result;
};


/**
 * Rotates an array in-place. After calling this method, the element at
 * index i will be the element previously at index (i - n) %
 * array.length, for all values of i between 0 and array.length - 1,
 * inclusive.
 *
 * For example, suppose list comprises [t, a, n, k, s]. After invoking
 * rotate(array, 1) (or rotate(array, -4)), array will comprise [s, t, a, n, k].
 *
 * @param {!Array.<*>} array The array to rotate.
 * @param {number} n The amount to rotate.
 * @return {!Array.<*>} The array.
 */
goog.array.rotate = function(array, n) {
  if (array.length) {
    n %= array.length;
    if (n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n));
    } else if (n < 0) {
      goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n));
    }
  }
  return array;
};

// Input 2
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2007 Google Inc. All Rights Reserved.

/**
 * @fileoverview Defines the goog.dom.TagName enum.  This enumerates
 * all html tag names specified by the W3C HTML 4.01 Specification.
 * Reference http://www.w3.org/TR/html401/index/elements.html.
 */
goog.provide('goog.dom.TagName');

/**
 * Enum of all html tag names specified by the W3C HTML 4.01 Specification.
 * Reference http://www.w3.org/TR/html401/index/elements.html
 * @enum {string}
 */
goog.dom.TagName = {
  A: 'A',
  ABBR: 'ABBR',
  ACRONYM: 'ACRONYM',
  ADDRESS: 'ADDRESS',
  APPLET: 'APPLET',
  AREA: 'AREA',
  B: 'B',
  BASE: 'BASE',
  BASEFONT: 'BASEFONT',
  BDO: 'BDO',
  BIG: 'BIG',
  BLOCKQUOTE: 'BLOCKQUOTE',
  BODY: 'BODY',
  BR: 'BR',
  BUTTON: 'BUTTON',
  CAPTION: 'CAPTION',
  CENTER: 'CENTER',
  CITE: 'CITE',
  CODE: 'CODE',
  COL: 'COL',
  COLGROUP: 'COLGROUP',
  DD: 'DD',
  DEL: 'DEL',
  DFN: 'DFN',
  DIR: 'DIR',
  DIV: 'DIV',
  DL: 'DL',
  DT: 'DT',
  EM: 'EM',
  FIELDSET: 'FIELDSET',
  FONT: 'FONT',
  FORM: 'FORM',
  FRAME: 'FRAME',
  FRAMESET: 'FRAMESET',
  H1: 'H1',
  H2: 'H2',
  H3: 'H3',
  H4: 'H4',
  H5: 'H5',
  H6: 'H6',
  HEAD: 'HEAD',
  HR: 'HR',
  HTML: 'HTML',
  I: 'I',
  IFRAME: 'IFRAME',
  IMG: 'IMG',
  INPUT: 'INPUT',
  INS: 'INS',
  ISINDEX: 'ISINDEX',
  KBD: 'KBD',
  LABEL: 'LABEL',
  LEGEND: 'LEGEND',
  LI: 'LI',
  LINK: 'LINK',
  MAP: 'MAP',
  MENU: 'MENU',
  META: 'META',
  NOFRAMES: 'NOFRAMES',
  NOSCRIPT: 'NOSCRIPT',
  OBJECT: 'OBJECT',
  OL: 'OL',
  OPTGROUP: 'OPTGROUP',
  OPTION: 'OPTION',
  P: 'P',
  PARAM: 'PARAM',
  PRE: 'PRE',
  Q: 'Q',
  S: 'S',
  SAMP: 'SAMP',
  SCRIPT: 'SCRIPT',
  SELECT: 'SELECT',
  SMALL: 'SMALL',
  SPAN: 'SPAN',
  STRIKE: 'STRIKE',
  STRONG: 'STRONG',
  STYLE: 'STYLE',
  SUB: 'SUB',
  SUP: 'SUP',
  TABLE: 'TABLE',
  TBODY: 'TBODY',
  TD: 'TD',
  TEXTAREA: 'TEXTAREA',
  TFOOT: 'TFOOT',
  TH: 'TH',
  THEAD: 'THEAD',
  TITLE: 'TITLE',
  TR: 'TR',
  TT: 'TT',
  U: 'U',
  UL: 'UL',
  VAR: 'VAR'
};

// Input 3
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Utilities for adding, removing and setting classes.
 *
 */


goog.provide('goog.dom.classes');

goog.require('goog.array');


/**
 * Sets the entire class name of an element.
 * @param {Node} element DOM node to set class of.
 * @param {string} className Class name(s) to apply to element.
 */
goog.dom.classes.set = function(element, className) {
  element.className = className;
};


/**
 * Gets an array of class names on an element
 * @param {Node} element DOM node to get class of.
 * @return {Array} Class names on {@code element}.
 */
goog.dom.classes.get = function(element) {
  var className = element.className;
  // Some types of elements don't have a className in IE (e.g. iframes).
  // Furthermore, in Firefox, className is not a string when the element is
  // an SVG element.
  return className && typeof className.split == 'function' ?
      className.split(/\s+/) : [];
};


/**
 * Adds a class or classes to an element. Does not add multiples of class names.
 * @param {Node} element DOM node to add class to.
 * @param {...string} var_args Class names to add.
 * @return {boolean} Whether class was added (or all classes were added).
 */
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);

  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(' ');

  return b;
};


/**
 * Removes a class or classes from an element.
 * @param {Node} element DOM node to remove class from.
 * @param {...string} var_args Class name(s) to remove.
 * @return {boolean} Whether all classes in {@code var_args} were found and
 *     removed.
 */
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);

  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(' ');

  return b;
};


/**
 * Helper method for {@link goog.dom.classes.add} and
 * {@link goog.dom.classes.addRemove}. Adds one or more classes to the supplied
 * classes array.
 * @param {Array.<string>} classes All class names for the element, will be
 *     updated to have the classes supplied in {@code args} added.
 * @param {Array.<string>} args Class names to add.
 * @return {boolean} Whether all classes in were added.
 * @private
 */
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for (var i = 0; i < args.length; i++) {
    if (!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++;
    }
  }
  return rv == args.length;
};


/**
 * Helper method for {@link goog.dom.classes.remove} and
 * {@link goog.dom.classes.addRemove}. Removes one or more classes from the
 * supplied classes array.
 * @param {Array.<string>} classes All class names for the element, will be
 *     updated to have the classes supplied in {@code args} removed.
 * @param {Array.<string>} args Class names to remove.
 * @return {boolean} Whether all classes in were found and removed.
 * @private
 */
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for (var i = 0; i < classes.length; i++) {
    if (goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++;
    }
  }
  return rv == args.length;
};


/**
 * Switches a class on an element from one to another without disturbing other
 * classes. If the fromClass isn't removed, the toClass won't be added.
 * @param {Node} element DOM node to swap classes on.
 * @param {string} fromClass Class to remove.
 * @param {string} toClass Class to add.
 * @return {boolean} Whether classes were switched.
 */
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);

  var removed = false;
  for (var i = 0; i < classes.length; i++) {
    if (classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true;
    }
  }

  if (removed) {
    classes.push(toClass);
    element.className = classes.join(' ');
  }

  return removed;
};


/**
 * Adds zero or more classes to and element and and removes zero or more as a
 * single operation. Unlike calling {@link goog.dom.classes.add} and
 * {@link goog.dom.classes.remove} separately this is more efficient as it only
 * parses the class property once.
 * @param {Node} element DOM node to swap classes on.
 * @param {string|Array.<string>|null} classesToRemove Class or classes to
 *     remove, if null no classes are removed.
 * @param {string|Array.<string>|null} classesToAdd Class or classes to add, if
 *     null no classes are added.
 */
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if (goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove);
  } else if (goog.isArray(classesToRemove)) {
    goog.dom.classes.remove_(classes, classesToRemove);
  }

  if (goog.isString(classesToAdd) &&
      !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd);
  } else if (goog.isArray(classesToAdd)) {
    goog.dom.classes.add_(classes, classesToAdd);
  }

  element.className = classes.join(' ');
};


/**
 * Returns true if an element has a class.
 * @param {Node} element DOM node to test.
 * @param {string} className Class name to test for.
 * @return {boolean} Whether element has the class.
 */
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className);
};


/**
 * Adds or removes a class depending on the enabled argument.
 * @param {Node} element DOM node to add or remove the class on.
 * @param {string} className Class name to add or remove.
 * @param {boolean} enabled Whether to add or remove the class (true adds,
 *     false removes).
 */
goog.dom.classes.enable = function(element, className, enabled) {
  if (enabled) {
    goog.dom.classes.add(element, className);
  } else {
    goog.dom.classes.remove(element, className);
  }
};


/**
 * Removes a class if an element has it, and adds it the element doesn't have
 * it.  Won't affect other classes on the node.
 * @param {Node} element DOM node to toggle class on.
 * @param {string} className Class to toggle.
 * @return {boolean} True if class was added, false if it was removed
 *     (in other words, whether element has the class after this function has
 *     been called).
 */
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add;
};

// Input 4
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview A utility class for representing two-dimensional positions.
 */


goog.provide('goog.math.Coordinate');


/**
 * Class for representing coordinates and positions.
 * @param {number=} opt_x Left, defaults to 0.
 * @param {number=} opt_y Top, defaults to 0.
 * @constructor
 */
goog.math.Coordinate = function(opt_x, opt_y) {
  /**
   * X-value
   * @type {number}
   */
  this.x = goog.isDef(opt_x) ? opt_x : 0;

  /**
   * Y-value
   * @type {number}
   */
  this.y = goog.isDef(opt_y) ? opt_y : 0;
};


/**
 * Returns a new copy of the coordinate.
 * @return {!goog.math.Coordinate} A clone of this coordinate.
 */
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing the coordinate.
   * @return {string} In the form (50, 73).
   */
  goog.math.Coordinate.prototype.toString = function() {
    return '(' + this.x + ', ' + this.y + ')';
  };
}


/**
 * Compares coordinates for equality.
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {boolean} True iff the coordinates are equal, or if both are null.
 */
goog.math.Coordinate.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.x == b.x && a.y == b.y;
};


/**
 * Returns the distance between two coordinates.
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {number} The distance between {@code a} and {@code b}.
 */
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};


/**
 * Returns the squared distance between two coordinates. Squared distances can
 * be used for comparisons when the actual value is not required.
 *
 * Performance note: eliminating the square root is an optimization often used
 * in lower-level languages, but the speed difference is not nearly as
 * pronounced in JavaScript (only a few percent.)
 *
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {number} The squared distance between {@code a} and {@code b}.
 */
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy;
};


/**
 * Returns the difference between two coordinates as a new
 * goog.math.Coordinate.
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {goog.math.Coordinate} A Coordinate representing the difference
 *     between {@code a} and {@code b}.
 */
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y);
};


/**
 * Returns the sum of two coordinates as a new goog.math.Coordinate.
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {goog.math.Coordinate} A Coordinate representing the sum of the two
 *     coordinates.
 */
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y);
};

// Input 5
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2007 Google Inc. All Rights Reserved.

/**
 * @fileoverview A utility class for representing two-dimensional sizes.
 */


goog.provide('goog.math.Size');



/**
 * Class for representing sizes consisting of a width and height. Undefined
 * width and height support is deprecated and results in compiler warning.
 * @param {number} width Width.
 * @param {number} height Height.
 * @constructor
 */
goog.math.Size = function(width, height) {
  /**
   * Width
   * @type {number}
   */
  this.width = width;

  /**
   * Height
   * @type {number}
   */
  this.height = height;
};


/**
 * Compares sizes for equality.
 * @param {goog.math.Size} a A Size.
 * @param {goog.math.Size} b A Size.
 * @return {boolean} True iff the sizes have equal widths and equal
 *     heights, or if both are null.
 */
goog.math.Size.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.width == b.width && a.height == b.height;
};


/**
 * @return {goog.math.Size} A new copy of the Size.
 */
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing size.
   * @return {string} In the form (50 x 73).
   */
  goog.math.Size.prototype.toString = function() {
    return '(' + this.width + ' x ' + this.height + ')';
  };
}


/**
 * @return {number} The longer of the two dimensions in the size.
 */
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height);
};


/**
 * @return {number} The shorter of the two dimensions in the size.
 */
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height);
};


/**
 * @return {number} The area of the size (width * height).
 */
goog.math.Size.prototype.area = function() {
  return this.width * this.height;
};


/**
 * @return {number} The ratio of the size's width to its height.
 */
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height;
};


/**
 * @return {boolean} True if the size has zero area, false if both dimensions
 *     are non-zero numbers.
 */
goog.math.Size.prototype.isEmpty = function() {
  return !this.area();
};


/**
 * Clamps the width and height parameters upward to integer values.
 * @return {goog.math.Size} This size with ceil'd components.
 */
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this;
};


/**
 * @param {goog.math.Size} target The target size.
 * @return {boolean} True if this Size is the same size or smaller than the
 *     target size in both dimensions.
 */
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height;
};


/**
 * Clamps the width and height parameters downward to integer values.
 * @return {goog.math.Size} This size with floored components.
 */
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this;
};


/**
 * Rounds the width and height parameters to integer values.
 * @return {goog.math.Size} This size with rounded components.
 */
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this;
};


/**
 * Scales the size uniformly by a factor.
 * @param {number} s The scale factor.
 * @return {goog.math.Size} This Size object after scaling.
 */
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this;
};


/**
 * Uniformly scales the size to fit inside the dimensions of a given size. The
 * original aspect ratio will be preserved.
 *
 * This function assumes that both Sizes contain strictly positive dimensions.
 * @param {goog.math.Size} target The target size.
 * @return {goog.math.Size} This Size object, after optional scaling.
 */
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ?
      target.width / this.width :
      target.height / this.height;

  return this.scale(s);
};

// Input 6
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Utilities for manipulating objects/maps/hashes.
 */

goog.provide('goog.object');


/**
 * Calls a function for each element in an object/map/hash.
 *
 * @param {Object} obj The object over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object)
 *     and the return value is irrelevant.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 */
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};


/**
 * Calls a function for each element in an object/map/hash. If that call returns
 * true, adds the element to a new object.
 *
 * @param {Object} obj The object over which to iterate.
 * @param {Function} f The function to call for every element. This
 *     function takes 3 arguments (the element, the index and the object)
 *     and should return a boolean. If the return value is true the
 *     element is added to the result object. If it is false the
 *     element is not included.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {!Object} a new object in which only elements that passed the test
 *     are present.
 */
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key];
    }
  }
  return res;
};


/**
 * For every element in an object/map/hash calls a function and inserts the
 * result into a new object.
 *
 * @param {Object} obj The object over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object)
 *     and should return something. The result will be inserted
 *     into a new object.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {!Object} a new object with the results from f.
 */
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};


/**
 * Calls a function for each element in an object/map/hash. If any
 * call returns true, returns true (without checking the rest). If
 * all calls return false, returns false.
 *
 * @param {Object} obj The object to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} true if any element passes the test.
 */
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return true;
    }
  }
  return false;
};


/**
 * Calls a function for each element in an object/map/hash. If
 * all calls return true, returns true. If any call returns false, returns
 * false at this point and does not continue to check the remaining elements.
 *
 * @param {Object} obj The object to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} false if any element fails the test.
 */
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return false;
    }
  }
  return true;
};


/**
 * Returns the number of key-value pairs in the object map.
 *
 * @param {Object} obj The object for which to get the number of key-value
 *     pairs.
 * @return {number} The number of key-value pairs in the object map.
 */
goog.object.getCount = function(obj) {
  // JS1.5 has __count__ but it has been deprecated so it raises a warning...
  // in other words do not use. Also __count__ only includes the fields on the
  // actual object and not in the prototype chain.
  var rv = 0;
  for (var key in obj) {
    rv++;
  }
  return rv;
};


/**
 * Returns one key from the object map, if any exists.
 * For map literals the returned key will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object} obj The object to pick a key from.
 * @return {string|undefined} The key or undefined if the object is empty.
 */
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};


/**
 * Returns one value from the object map, if any exists.
 * For map literals the returned value will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object} obj The object to pick a value from.
 * @return {*} The value or undefined if the object is empty.
 */
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};


/**
 * Whether the object/hash/map contains the given object as a value.
 * An alias for goog.object.containsValue(obj, val).
 *
 * @param {Object} obj The object in which to look for val.
 * @param {*} val The object for which to check.
 * @return {boolean} true if val is present.
 */
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};


/**
 * Returns the values of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the values.
 * @return {!Array} The values in the object/map/hash.
 */
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = obj[key];
  }
  return res;
};


/**
 * Returns the keys of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the keys.
 * @return {!Array.<string>} Array of property keys.
 */
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = key;
  }
  return res;
};


/**
 * Whether the object/map/hash contains the given key.
 *
 * @param {Object} obj The object in which to look for key.
 * @param {*} key The key for which to check.
 * @return {boolean} true If the map contains the key.
 */
goog.object.containsKey = function(obj, key) {
  return key in obj;
};


/**
 * Whether the object/map/hash contains the given value. This is O(n).
 *
 * @param {Object} obj The object in which to look for val.
 * @param {*} val The value for which to check.
 * @return {boolean} true If the map contains the value.
 */
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its key.
 * @param {Object} obj The object to search in.
 * @param {function(*, string, Object): boolean} f The function to call for
 *     every element. Takes 3 arguments (the value, the key and the object) and
 *     should return a boolean.
 * @param {Object=} opt_this An optional "this" context for the function.
 * @return {string|undefined} The key of an element for which the function
 *     returns true or undefined if no such element is found.
 */
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
  return undefined;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its value.
 * @param {Object} obj The object to search in.
 * @param {function(*, string, Object): boolean} f The function to call for
 *     every element. Takes 3 arguments (the value, the key and the object) and
 *     should return a boolean.
 * @param {Object=} opt_this An optional "this" context for the function.
 * @return {*} The value of an element for which the function returns true or
 *     undefined if no such element is found.
 */
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};


/**
 * Whether the object/map/hash is empty.
 *
 * @param {Object} obj The object to test.
 * @return {boolean} true if obj is empty.
 */
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};


/**
 * Removes all key value pairs from the object/map/hash.
 *
 * @param {Object} obj The object to clear.
 */
goog.object.clear = function(obj) {
  // Some versions of IE has problems if we delete keys from the beginning
  var keys = goog.object.getKeys(obj);
  for (var i = keys.length - 1; i >= 0; i--) {
    goog.object.remove(obj, keys[i]);
  }
};


/**
 * Removes a key-value pair based on the key.
 *
 * @param {Object} obj The object from which to remove the key.
 * @param {*} key The key to remove.
 * @return {boolean} Whether an element was removed.
 */
goog.object.remove = function(obj, key) {
  var rv;
  if ((rv = key in obj)) {
    delete obj[key];
  }
  return rv;
};


/**
 * Adds a key-value pair to the object. Throws an exception if the key is
 * already in use. Use set if you want to change an existing pair.
 *
 * @param {Object} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {*} val The value to add.
 */
goog.object.add = function(obj, key, val) {
  if (key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};


/**
 * Returns the value for the given key.
 *
 * @param {Object} obj The object from which to get the value.
 * @param {string} key The key for which to get the value.
 * @param {*=} opt_val The value to return if no item is found for the given
 *     key (default is undefined).
 * @return {*} The value for the given key.
 */
goog.object.get = function(obj, key, opt_val) {
  if (key in obj) {
    return obj[key];
  }
  return opt_val;
};


/**
 * Adds a key-value pair to the object/map/hash.
 *
 * @param {Object} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {*} value The value to add.
 */
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};


/**
 * Adds a key-value pair to the object/map/hash if it doesn't exist yet.
 *
 * @param {Object} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {*} value The value to add if the key wasn't present.
 * @return {*} The value of the entry at the end of the function.
 */
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : (obj[key] = value);
};


/**
 * Does a flat clone of the object.
 *
 * @param {Object} obj Object to clone.
 * @return {!Object} Clone of the input object.
 */
goog.object.clone = function(obj) {
  // We cannot use the prototype trick because a lot of methods depend on where
  // the actual key is set.

  var res = {};
  for (var key in obj) {
    res[key] = obj[key];
  }
  return res;
  // We could also use goog.mixin but I wanted this to be independent from that.
};


/**
 * Returns a new object in which all the keys and values are interchanged
 * (keys become values and values become keys). If multiple keys map to the
 * same value, the chosen transposed value is implementation-dependent.
 *
 * @param {Object} obj The object to transpose.
 * @return {!Object} The transposed object.
 */
goog.object.transpose = function(obj) {
  var transposed = {};
  for (var key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};


/**
 * The names of the fields that are defined on Object.prototype.
 * @type {Array.<string>}
 * @private
 */
goog.object.PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/**
 * Extends an object with another object.
 * This operates 'in-place'; it does not create a new Object.
 *
 * Example:
 * var o = {};
 * goog.object.extend(o, {a: 0, b: 1});
 * o; // {a: 0, b: 1}
 * goog.object.extend(o, {c: 2});
 * o; // {a: 0, b: 1, c: 2}
 *
 * @param {Object} target  The object to modify.
 * @param {...Object} var_args The objects from which values will be copied.
 */
goog.object.extend = function(target, var_args) {
  var key, source;
  for (var i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }

    // For IE the for-in-loop does not contain any properties that are not
    // enumerable on the prototype object (for example isPrototypeOf from
    // Object.prototype) and it will also not include 'replace' on objects that
    // extend String and change 'replace' (not that it is common for anyone to
    // extend anything except Object).

    for (var j = 0; j < goog.object.PROTOTYPE_FIELDS_.length; j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};


/**
 * Creates a new object built from the key-value pairs provided as arguments.
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise even arguments are used as
 *     the property names and odd arguments are used as the property values.
 * @return {!Object} The new object.
 * @throws {Error} If there are uneven number of arguments or there is only one
 *     non array argument.
 */
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }

  if (argLength % 2) {
    throw Error('Uneven number of arguments');
  }

  var rv = {};
  for (var i = 0; i < argLength; i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};


/**
 * Creates a new object where the property names come from the arguments but
 * the value is always set to true
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise the arguments are used
 *     as the property names.
 * @return {!Object} The new object.
 */
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }

  var rv = {};
  for (var i = 0; i < argLength; i++) {
    rv[arguments[i]] = true;
  }
  return rv;
};

// Input 7
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Utilities for string manipulation.
 */


/**
 * Namespace for string utilities
 */
goog.provide('goog.string');
goog.provide('goog.string.Unicode');


/**
 * Common Unicode string characters.
 * @enum {string}
 */
goog.string.Unicode = {
  NBSP: '\xa0'
};


/**
 * Fast prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix A string to look for at the start of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix}.
 */
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
};


/**
 * Fast suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix}.
 */
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
};


/**
 * Case-insensitive prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix  A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(
      prefix, str.substr(0, prefix.length)) == 0;
};


/**
 * Case-insensitive suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(
      suffix, str.substr(str.length - suffix.length, suffix.length)) == 0;
};


/**
 * Does simple python-style string substitution.
 * subs("foo%s hot%s", "bar", "dog") becomes "foobar hotdog".
 * @param {string} str The string containing the pattern.
 * @param {...*} var_args The items to substitute into the pattern.
 * @return {string} A copy of {@code str} in which each occurrence of
 *     {@code %s} has been replaced an argument from {@code var_args}.
 */
goog.string.subs = function(str, var_args) {
  // This appears to be slow, but testing shows it compares more or less
  // equivalent to the regex.exec method.
  for (var i = 1; i < arguments.length; i++) {
    // We cast to String in case an argument is a Function.  Replacing $&, for
    // example, with $$$& stops the replace from subsituting the whole match
    // into the resultant string.  $$$& in the first replace becomes $$& in the
    //  second, which leaves $& in the resultant string.  Also:
    // $$, $`, $', $n $nn
    var replacement = String(arguments[i]).replace(/\$/g, '$$$$');
    str = str.replace(/\%s/, replacement);
  }
  return str;
};


/**
 * Converts multiple whitespace chars (spaces, non-breaking-spaces, new lines
 * and tabs) to a single space, and strips leading and trailing whitespace.
 * @param {string} str Input string.
 * @return {string} A copy of {@code str} with collapsed whitespace.
 */
goog.string.collapseWhitespace = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');
};


/**
 * Checks if a string is empty or contains only whitespaces.
 * @param {string} str The string to check.
 * @return {boolean} True if {@code str} is empty or whitespace only.
 */
goog.string.isEmpty = function(str) {
  // testing length == 0 first is actually slower in all browsers (about the
  // same in Opera).
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return /^[\s\xa0]*$/.test(str);
};


/**
 * Checks if a string is null, empty or contains only whitespaces.
 * @param {*} str The string to check.
 * @return {boolean} True if{@code str} is null, empty, or whitespace only.
 */
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str));
};


/**
 * Checks if a string is all breaking whitespace.
 * @param {string} str The string to check.
 * @return {boolean} Whether the string is all breaking whitespace.
 */
goog.string.isBreakingWhitespace = function(str) {
  return !/[^\t\n\r ]/.test(str);
};


/**
 * Checks if a string contains all letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} consists entirely of letters.
 */
goog.string.isAlpha = function(str) {
  return !/[^a-zA-Z]/.test(str);
};


/**
 * Checks if a string contains only numbers.
 * @param {*} str string to check. If not a string, it will be
 *     casted to one.
 * @return {boolean} True if {@code str} is numeric.
 */
goog.string.isNumeric = function(str) {
  return !/[^0-9]/.test(str);
};


/**
 * Checks if a string contains only numbers or letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} is alphanumeric.
 */
goog.string.isAlphaNumeric = function(str) {
  return !/[^a-zA-Z0-9]/.test(str);
};


/**
 * Checks if a character is a space character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a space.
 */
goog.string.isSpace = function(ch) {
  return ch == ' ';
};


/**
 * Checks if a character is a valid unicode character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a valid unicode character.
 */
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= ' ' && ch <= '~' ||
         ch >= '\u0080' && ch <= '\uFFFD';
};


/**
 * Takes a string and replaces newlines with a space. Multiple lines are
 * replaced with a single space.
 * @param {string} str The string from which to strip newlines.
 * @return {string} A copy of {@code str} stripped of newlines.
 */
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, ' ');
};


/**
 * Replaces Windows and Mac new lines with unix style: \r or \r\n with \n.
 * @param {string} str The string to in which to canonicalize newlines.
 * @return {string} {@code str} A copy of {@code} with canonicalized newlines.
 */
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, '\n');
};


/**
 * Normalizes whitespace in a string, replacing all whitespace chars with
 * a space.
 * @param {string} str The string in which to normalize whitespace.
 * @return {string} A copy of {@code str} with all whitespace normalized.
 */
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, ' ');
};


/**
 * Normalizes spaces in a string, replacing all consecutive spaces and tabs
 * with a single space. Replaces non-breaking space with a space.
 * @param {string} str The string in which to normalize spaces.
 * @return {string} A copy of {@code str} with all consecutive spaces and tabs
 *    replaced with a single space.
 */
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, ' ');
};


/**
 * Trims white spaces to the left and right of a string.
 * @param {string} str The string to trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trim = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
};


/**
 * Trims whitespaces at the left end of a string.
 * @param {string} str The string to left trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimLeft = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+/, '');
};


/**
 * Trims whitespaces at the right end of a string.
 * @param {string} str The string to right trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimRight = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+$/, '');
};


/**
 * A string comparator that ignores case.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @param {string} str1 The string to compare.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} The comparator result, as described above.
 */
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();

  if (test1 < test2) {
    return -1;
  } else if (test1 == test2) {
    return 0;
  } else {
    return 1;
  }
};


/**
 * Regular expression used for splitting a string into substrings of fractional
 * numbers, integers, and non-numeric characters.
 * @type {RegExp}
 * @private
 */
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;


/**
 * String comparison function that handles numbers in a way humans might expect.
 * Using this function, the string "File 2.jpg" sorts before "File 10.jpg". The
 * comparison is mostly case-insensitive, though strings that are identical
 * except for case are sorted with the upper-case strings before lower-case.
 *
 * This comparison function is significantly slower (about 500x) than either
 * the default or the case-insensitive compare. It should not be used in
 * time-critical code, but should be fast enough to sort several hundred short
 * strings (like filenames) with a reasonable delay.
 *
 * @param {string} str1 The string to compare in a numerically sensitive way.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} less than 0 if str1 < str2, 0 if str1 == str2, greater than
 *     0 if str1 > str2.
 */
goog.string.numerateCompare = function(str1, str2) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }

  // Using match to split the entire string ahead of time turns out to be faster
  // for most inputs than using RegExp.exec or iterating over each character.
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);

  var count = Math.min(tokens1.length, tokens2.length);

  for (var i = 0; i < count; i++) {
    var a = tokens1[i];
    var b = tokens2[i];

    // Compare pairs of tokens, returning if one token sorts before the other.
    if (a != b) {

      // Only if both tokens are integers is a special comparison required.
      // Decimal numbers are sorted as strings (e.g., '.09' < '.1').
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }

  // If one string is a substring of the other, the shorter string sorts first.
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }

  // The two strings must be equivalent except for case (perfect equality is
  // tested at the head of the function.) Revert to default ASCII-betical string
  // comparison to stablize the sort.
  return str1 < str2 ? -1 : 1;
};


/**
 * Regular expression used for determining if a string needs to be encoded.
 * @type {RegExp}
 * @private
 */
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;

/**
 * URL-encodes a string
 * @param {*} str The string to url-encode.
 * @return {string} An encoded copy of {@code str} that is safe for urls.
 *     Note that '#', ':', and other characters used to delimit portions
 *     of URLs *will* be encoded.
 */
goog.string.urlEncode = function(str) {
  str = String(str);
  // Checking if the search matches before calling encodeURIComponent avoids an
  // extra allocation in IE6. This adds about 10us time in FF and a similiar
  // over head in IE6 for lower working set apps, but for large working set
  // apps like Gmail, it saves about 70us per call.
  if (!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str);
  }
  return str;
};


/**
 * URL-decodes the string. We need to specially handle '+'s because
 * the javascript library doesn't convert them to spaces.
 * @param {string} str The string to url decode.
 * @return {string} The decoded {@code str}.
 */
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, ' '));
};


/**
 * Converts \n to <br>s or <br />s.
 * @param {string} str The string in which to convert newlines.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} A copy of {@code str} with converted newlines.
 */
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? '<br />' : '<br>');
};


/**
 * Escape double quote '"' characters in addition to '&', '<', and '>' so that a
 * string can be included in an HTML tag attribute value within double quotes.
 *
 * It should be noted that > doesn't need to be escaped for the HTML or XML to
 * be valid, but it has been decided to escape it for consistency with other
 * implementations.
 *
 * NOTE:
 * HtmlEscape is often called during the generation of large blocks of HTML.
 * Using statics for the regular expressions and strings is an optimization
 * that can more than half the amount of time IE spends in this function for
 * large apps, since strings and regexes both contribute to GC allocations.
 *
 * Testing for the presence of a character before escaping increases the number
 * of function calls, but actually provides a speed increase for the average
 * case -- since the average case often doesn't require the escaping of all 4
 * characters and indexOf() is much cheaper than replace().
 * The worst case does suffer slightly from the additional calls, therefore the
 * opt_isLikelyToContainHtmlChars option has been included for situations
 * where all 4 HTML entities are very likely to be present and need escaping.
 *
 * Some benchmarks (times tended to fluctuate +-0.05ms):
 *                                     FireFox                     IE6
 * (no chars / average (mix of cases) / all 4 chars)
 * no checks                     0.13 / 0.22 / 0.22         0.23 / 0.53 / 0.80
 * indexOf                       0.08 / 0.17 / 0.26         0.22 / 0.54 / 0.84
 * indexOf + re test             0.07 / 0.17 / 0.28         0.19 / 0.50 / 0.85
 *
 * An additional advantage of checking if replace actually needs to be called
 * is a reduction in the number of object allocations, so as the size of the
 * application grows the difference between the various methods would increase.
 *
 * @param {string} str string to be escaped.
 * @param {boolean=} opt_isLikelyToContainHtmlChars Don't perform a check to see
 *     if the character needs replacing - use this option if you expect each of
 *     the characters to appear often. Leave false if you expect few html
 *     characters to occur in your strings, such as if you are escaping HTML.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {

  if (opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, '&amp;')
          .replace(goog.string.ltRe_, '&lt;')
          .replace(goog.string.gtRe_, '&gt;')
          .replace(goog.string.quotRe_, '&quot;');

  } else {
    // quick test helps in the case when there are no chars to replace, in
    // worst case this makes barely a difference to the time taken
    if (!goog.string.allRe_.test(str)) return str;

    // str.indexOf is faster than regex.test in this case
    if (str.indexOf('&') != -1) {
      str = str.replace(goog.string.amperRe_, '&amp;');
    }
    if (str.indexOf('<') != -1) {
      str = str.replace(goog.string.ltRe_, '&lt;');
    }
    if (str.indexOf('>') != -1) {
      str = str.replace(goog.string.gtRe_, '&gt;');
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, '&quot;');
    }
    return str;
  }
};


/**
 * Regular expression that matches an ampersand, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.amperRe_ = /&/g;


/**
 * Regular expression that matches a less than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.ltRe_ = /</g;


/**
 * Regular expression that matches a greater than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.gtRe_ = />/g;


/**
 * Regular expression that matches a double quote, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.quotRe_ = /\"/g;


/**
 * Regular expression that matches any character that needs to be escaped.
 * @type {RegExp}
 * @private
 */
goog.string.allRe_ = /[&<>\"]/;


/**
 * Unescapes an HTML string.
 *
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapeEntities = function(str) {
  if (goog.string.contains(str, '&')) {
    // We are careful not to use a DOM if we do not have one. We use the []
    // notation so that the JSCompiler will not complain about these objects and
    // fields in the case where we have no DOM.
    // If the string contains < then there could be a script tag in there and in
    // that case we fall back to a non DOM solution as well.
    if ('document' in goog.global && !goog.string.contains(str, '<')) {
      return goog.string.unescapeEntitiesUsingDom_(str);
    } else {
      // Fall back on pure XML entities
      return goog.string.unescapePureXmlEntities_(str);
    }
  }
  return str;
};


/**
 * Unescapes an HTML string using a DOM. Don't use this function directly, it
 * should only be used by unescapeEntities. If used directly you will be
 * vulnerable to XSS attacks.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} The unescaped {@code str} string.
 */
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global['document']['createElement']('a');
  el['innerHTML'] = str;
  // Accesing the function directly triggers some virus scanners.
  if (el[goog.string.NORMALIZE_FN_]) {
    el[goog.string.NORMALIZE_FN_]();
  }
  str = el['firstChild']['nodeValue'];
  el['innerHTML'] = '';
  return str;
};


/**
 * Unescapes XML entities.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch (entity) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'quot':
        return '"';
      default:
        if (entity.charAt(0) == '#') {
          var n = Number('0' + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        // For invalid entities we just return the entity
        return s;
    }
  });
};

/**
 * String name for the node.normalize function. Anti-virus programs use this as
 * a signature for some viruses so we need a work around (temporary).
 * @private
 * @type {string}
 */
goog.string.NORMALIZE_FN_ = 'normalize';

/**
 * Do escaping of whitespace to preserve spatial formatting. We use character
 * entity #160 to make it safer for xml.
 * @param {string} str The string in which to escape whitespace.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, ' &#160;'), opt_xml);
};


/**
 * Strip quote characters around a string.  The second argument is a string of
 * characters to treat as quotes.  This can be a single character or a string of
 * multiple character and in that case each of those are treated as possible
 * quote characters. For example:
 *
 * <pre>
 * goog.string.stripQuotes('"abc"', '"`') --> 'abc'
 * goog.string.stripQuotes('`abc`', '"`') --> 'abc'
 * </pre>
 *
 * @param {string} str The string to strip.
 * @param {string} quoteChars The quote characters to strip.
 * @return {string} A copy of {@code str} without the quotes.
 *
 */
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for (var i = 0; i < length; i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};


/**
 * Truncates a string to a certain length and adds '...' if necessary.  The
 * length also accounts for the ellipsis, so a maximum length of 10 and a string
 * 'Hello World!' produces 'Hello W...'.
 * @param {string} str The string to truncate.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cut off in the middle.
 * @return {string} The truncated {@code str} string.
 */
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    str = str.substring(0, chars - 3) + '...';
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Truncate a string in the middle, adding "..." if necessary,
 * and favoring the beginning of the string.
 * @param {string} str The string to truncate the middle of.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cutoff in the middle.
 * @return {string} A truncated copy of {@code str}.
 */
goog.string.truncateMiddle = function(str, chars,
    opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    // Favor the beginning of the string:
    var half = Math.floor(chars / 2);
    var endPos = str.length - half;
    half += chars % 2;
    str = str.substring(0, half) + '...' + str.substring(endPos);
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Character mappings used internally for goog.string.quote.
 * @private
 * @type {Object}
 */
goog.string.jsEscapeCache_ = {
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\x0B': '\\x0B', // '\v' is not supported in JScript
  '"': '\\"',
  '\'': '\\\'',
  '\\': '\\\\'
};


/**
 * Encloses a string in double quotes and escapes characters so that the
 * string is a valid JS string.
 * @param {string} s The string to quote.
 * @return {string} A copy of {@code s} surrounded by double quotes.
 */
goog.string.quote = function(s) {
  s = String(s);
  if (s.quote) {
    return s.quote();
  } else {
    var sb = ['"'];
    for (var i = 0; i < s.length; i++) {
      sb[i + 1] = goog.string.escapeChar(s.charAt(i));
    }
    sb.push('"');
    return sb.join('');
  }
};


/**
 * Takes a character and returns the escaped string for that character. For
 * example escapeChar(String.fromCharCode(15)) -> "\\x0E".
 * @param {string} c The character to escape.
 * @return {string} An escaped string representing {@code c}.
 */
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    // tab is 9 but handled above
    if (cc < 256) {
      rv = '\\x';
      if (cc < 16 || cc > 256) {
        rv += '0';
      }
    } else {
      rv = '\\u';
      if (cc < 4096) { // \u1000
        rv += '0';
      }
    }
    rv += cc.toString(16).toUpperCase();
  }

  return goog.string.jsEscapeCache_[c] = rv;
};


/**
 * Takes a string and creates a map (Object) in which the keys are the
 * characters in the string. The value for the key is set to true. You can
 * then use goog.object.map or goog.array.map to change the values.
 * @param {string} s The string to build the map from.
 * @return {Object} The map of characters used.
 */
// TODO: It seems like we should have a generic goog.array.toMap. But do
//            we want a dependency on goog.array in goog.string?
goog.string.toMap = function(s) {
  var rv = {};
  for (var i = 0; i < s.length; i++) {
    rv[s.charAt(i)] = true;
  }
  return rv;
};


/**
 * Checks whether a string contains a given character.
 * @param {string} s The string to test.
 * @param {string} ss The substring to test for.
 * @return {boolean} True if {@code s} contains {@code ss}.
 */
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1;
};


/**
 * Removes a substring of a specified length at a specific
 * index in a string.
 * @param {string} s The base string from which to remove.
 * @param {number} index The index at which to remove the substring.
 * @param {number} stringLength The length of the substring to remove.
 * @return {string} A copy of {@code s} with the substring removed or the full
 *     string if nothing is removed or the input is invalid.
 */
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  // If the index is greater or equal to 0 then remove substring
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) +
        s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
};


/**
 *  Removes the first occurrence of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), '');
  return s.replace(re, '');
};


/**
 *  Removes all occurrences of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), 'g');
  return s.replace(re, '');
};


/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * @param {*} s The string to escape. If not a string, it will be casted
 *     to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
                   replace(/\x08/g, '\\x08');
};


/**
 * Repeats a string n times.
 * @param {string} string The string to repeat.
 * @param {number} length The number of times to repeat.
 * @return {string} A string containing {@code length} repetitions of
 *     {@code string}.
 */
goog.string.repeat = function(string, length) {
  return new Array(length + 1).join(string);
};


/**
 * Pads number to given length and optionally rounds it to a given precision.
 * For example:
 * <pre>padNumber(1.25, 2, 3) -> '01.250'
 * padNumber(1.25, 2) -> '01.25'
 * padNumber(1.25, 2, 1) -> '01.3'
 * padNumber(1.25, 0) -> '1.25'</pre>
 *
 * @param {number} num The number to pad.
 * @param {number} length The desired length.
 * @param {number=} opt_precision The desired precision.
 * @return {string} {@code num} as a string with the given options.
 */
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf('.');
  if (index == -1) {
    index = s.length;
  }
  return goog.string.repeat('0', Math.max(0, length - index)) + s;
};


/**
 * Returns a string representation of the given object, with
 * null and undefined being returned as the empty string.
 *
 * @param {*} obj The object to convert.
 * @return {string} A string representation of the {@code obj}.
 */
goog.string.makeSafe = function(obj) {
  return obj == null ? '' : String(obj);
};


/**
 * Concatenates string expressions. This is useful
 * since some browsers are very inefficient when it comes to using plus to
 * concat strings. Be careful when using null and undefined here since
 * these will not be included in the result. If you need to represent these
 * be sure to cast the argument to a String first.
 * For example:
 * <pre>buildString('a', 'b', 'c', 'd') -> 'abcd'
 * buildString(null, undefined) -> ''
 * </pre>
 * @param {...*} var_args A list of strings to concatenate. If not a string,
 *     it will be casted to one.
 * @return {string} The concatenation of {@code var_args}.
 */
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, '');
};


/**
 * Returns a string with at least 64-bits of randomness.
 *
 * Doesn't trust Javascript's random function entirely. Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return {string} A random string, e.g. sn1s7vb4gcic.
 */
goog.string.getRandomString = function() {
  return Math.floor(Math.random() * 2147483648).toString(36) +
         (Math.floor(Math.random() * 2147483648) ^ goog.now()).toString(36);
};


/**
 * Compares two version numbers.
 *
 * @param {string|number} version1 Version of first item.
 * @param {string|number} version2 Version of second item.
 *
 * @return {number}  1 if {@code version1} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = goog.string.trim(String(version1)).split('.');
  var v2Subs = goog.string.trim(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier. Next,
      // the qualifiers are compared as strings.
      order = goog.string.compareElements_(v1CompNum, v2CompNum) ||
          goog.string.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          goog.string.compareElements_(v1Comp[2], v2Comp[2]);
    // Stop as soon as an inequality is discovered.
    } while (order == 0);
  }

  return order;
};


/**
 * Compares elements of a version number.
 *
 * @param {string|number|boolean} left An element from a version number.
 * @param {string|number|boolean} right An element from a version number.
 *
 * @return {number}  1 if {@code left} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 * @private
 */
goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};


/**
 * Maximum value of #goog.string.hashCode, exclusive. 2^32.
 * @type {number}
 * @private
 */
goog.string.HASHCODE_MAX_ = 0x100000000;


/**
 * String hash function similar to java.lang.String.hashCode().
 * The hash code for a string is computed as
 * s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
 * where s[i] is the ith character of the string and n is the length of
 * the string. We mod the result to make it between 0 (inclusive) and 2^32
 * (exclusive).
 * @param {string} str A string.
 * @return {number} Hash value for {@code str}, between 0 (inclusive) and 2^32
 *  (exclusive). The empty string returns 0.
 */
goog.string.hashCode = function(str) {
  var result = 0;
  for (var i = 0; i < str.length; ++i) {
    result = 31 * result + str.charCodeAt(i);
    // Normalize to 4 byte range, 0 ... 2^32.
    result %= goog.string.HASHCODE_MAX_;
  }
  return result;
};


/**
 * The most recent globally unique ID.
 * @type {number}
 * @private
 */
goog.string.uniqueStringCounter_ = goog.now();


/**
 * Generates and returns a unique string based on the current date so strings
 * remain unique between sessions.  This is useful, for example, to create
 * unique IDs for DOM elements.
 * @return {string} A unique id.
 */
goog.string.createUniqueString = function() {
  return 'goog_' + goog.string.uniqueStringCounter_++;
};


/**
 * Converts the supplied string to a number, which may be Ininity or NaN.
 * This function strips whitespace: (toNumber(' 123') === 123)
 * This function accepts scientific notation: (toNumber('1e1') === 10)
 *
 * This is better than Javascript's built-in conversions because, sadly:
 *     (Number(' ') === 0) and (parseFloat('123a') === 123)
 *
 * @param {string} str The string to convert.
 * @return {number} The number the supplied string represents, or NaN.
 */
goog.string.toNumber = function(str) {
  var num = Number(str);
  if (num == 0 && goog.string.isEmpty(str)) {
    return NaN;
  }
  return num;
};

// Input 8
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Rendering engine detection.
 * @see <a href="http://www.useragentstring.com/">User agent strings</a>
 * For information on the browser brand (such as Safari versus Chrome), see
 * goog.userAgent.product.
 * @see ../demos/useragent.html
 */

goog.provide('goog.userAgent');

goog.require('goog.string');


/**
 * @define {boolean} Whether we know at compile-time that the browser is IE.
 */
goog.userAgent.ASSUME_IE = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is GECKO.
 */
goog.userAgent.ASSUME_GECKO = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is WEBKIT.
 */
goog.userAgent.ASSUME_WEBKIT = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is a
 *     mobile device running WebKit e.g. iPhone or Android.
 */
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is OPERA.
 */
goog.userAgent.ASSUME_OPERA = false;


/**
 * Whether we know the browser engine at compile-time.
 * @type {boolean}
 * @private
 */
goog.userAgent.BROWSER_KNOWN_ =
    goog.userAgent.ASSUME_IE ||
    goog.userAgent.ASSUME_GECKO ||
    goog.userAgent.ASSUME_MOBILE_WEBKIT ||
    goog.userAgent.ASSUME_WEBKIT ||
    goog.userAgent.ASSUME_OPERA;


/**
 * Returns the userAgent string for the current browser.
 * Some user agents (I'm thinking of you, Gears WorkerPool) do not expose a
 * navigator object off the global scope.  In that case we return null.
 *
 * @return {?string} The userAgent string or null if there is none.
 */
goog.userAgent.getUserAgentString = function() {
  return goog.global['navigator'] ? goog.global['navigator'].userAgent : null;
};


/**
 * @return {Object} The native navigator object.
 */
goog.userAgent.getNavigator = function() {
  // Need a local navigator reference instead of using the global one,
  // to avoid the rare case where they reference different objects.
  // (goog.gears.FakeWorkerPool, for example).
  return goog.global['navigator'];
};


/**
 * Initializer for goog.userAgent.
 *
 * This is a named function so that it can be stripped via the jscompiler
 * option for stripping types.
 * @private
 */
goog.userAgent.init_ = function() {
  /**
   * Whether the user agent string denotes Opera.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedOpera_ = false;

  /**
   * Whether the user agent string denotes Internet Explorer. This includes
   * other browsers using Trident as its rendering engine. For example AOL
   * and Netscape 8
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedIe_ = false;

  /**
   * Whether the user agent string denotes WebKit. WebKit is the rendering
   * engine that Safari, Android and others use.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedWebkit_ = false;

  /**
   * Whether the user agent string denotes a mobile device.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedMobile_ = false;

  /**
   * Whether the user agent string denotes Gecko. Gecko is the rendering
   * engine used by Mozilla, Mozilla Firefox, Camino and many more.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedGecko_ = false;

  var ua;
  if (!goog.userAgent.BROWSER_KNOWN_ &&
      (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf('Opera') == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ &&
        ua.indexOf('MSIE') != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ &&
        ua.indexOf('WebKit') != -1;
    // WebKit also gives navigator.product string equal to 'Gecko'.
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ &&
        ua.indexOf('Mobile') != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ &&
        !goog.userAgent.detectedWebkit_ && navigator.product == 'Gecko';
  }
};


if (!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_();
}


/**
 * Whether the user agent is Opera.
 * @type {boolean}
 */
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;


/**
 * Whether the user agent is Internet Explorer. This includes other browsers
 * using Trident as its rendering engine. For example AOL and Netscape 8
 * @type {boolean}
 */
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;


/**
 * Whether the user agent is Gecko. Gecko is the rendering engine used by
 * Mozilla, Mozilla Firefox, Camino and many more.
 * @type {boolean}
 */
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_GECKO :
    goog.userAgent.detectedGecko_;


/**
 * Whether the user agent is WebKit. WebKit is the rendering engine that
 * Safari, Android and others use.
 * @type {boolean}
 */
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT :
    goog.userAgent.detectedWebkit_;


/**
 * Whether the user agent is running on a mobile device.
 * @type {boolean}
 */
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT ||
                        goog.userAgent.detectedMobile_;


/**
 * Used while transitioning code to use WEBKIT instead.
 * @type {boolean}
 * @deprecated Use {@link goog.userAgent.product.SAFARI} instead.
 * TODO: Delete this from goog.userAgent.
 */
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;


/**
 * @return {string} the platform (operating system) the user agent is running
 *     on. Default to empty string because navigator.platform may not be defined
 *     (on Rhino, for example).
 * @private
 */
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || '';
};


/**
 * The platform (operating system) the user agent is running on. Default to
 * empty string because navigator.platform may not be defined (on Rhino, for
 * example).
 * @type {string}
 */
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();


/**
 * @define {boolean} Whether the user agent is running on a Macintosh operating
 *     system.
 */
goog.userAgent.ASSUME_MAC = false;


/**
 * @define {boolean} Whether the user agent is running on a Windows operating
 *     system.
 */
goog.userAgent.ASSUME_WINDOWS = false;


/**
 * @define {boolean} Whether the user agent is running on a Linux operating
 *     system.
 */
goog.userAgent.ASSUME_LINUX = false;


/**
 * @define {boolean} Whether the user agent is running on a X11 windowing
 *     system.
 */
goog.userAgent.ASSUME_X11 = false;


/**
 * @type {boolean}
 * @private
 */
goog.userAgent.PLATFORM_KNOWN_ =
    goog.userAgent.ASSUME_MAC ||
    goog.userAgent.ASSUME_WINDOWS ||
    goog.userAgent.ASSUME_LINUX ||
    goog.userAgent.ASSUME_X11;


/**
 * Initialize the goog.userAgent constants that define which platform the user
 * agent is running on.
 * @private
 */
goog.userAgent.initPlatform_ = function() {
  /**
   * Whether the user agent is running on a Macintosh operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Mac');

  /**
   * Whether the user agent is running on a Windows operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedWindows_ = goog.string.contains(
      goog.userAgent.PLATFORM, 'Win');

  /**
   * Whether the user agent is running on a Linux operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Linux');

  /**
   * Whether the user agent is running on a X11 windowing system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() &&
      goog.string.contains(goog.userAgent.getNavigator()['appVersion'] || '',
          'X11');
};


if (!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_();
}


/**
 * Whether the user agent is running on a Macintosh operating system.
 * @type {boolean}
 */
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;


/**
 * Whether the user agent is running on a Windows operating system.
 * @type {boolean}
 */
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;


/**
 * Whether the user agent is running on a Linux operating system.
 * @type {boolean}
 */
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;


/**
 * Whether the user agent is running on a X11 windowing system.
 * @type {boolean}
 */
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;


/**
 * @return {string} The string that describes the version number of the user
 *     agent.
 * @private
 */
goog.userAgent.determineVersion_ = function() {
  // All browsers have different ways to detect the version and they all have
  // different naming schemes.

  // version is a string rather than a number because it may contain 'b', 'a',
  // and so on.
  var version = '', re;

  if (goog.userAgent.OPERA && goog.global['opera']) {
    var operaVersion = goog.global['opera'].version;
    version = typeof operaVersion == 'function' ? operaVersion() : operaVersion;
  } else {
    if (goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/;
    } else if (goog.userAgent.IE) {
      re = /MSIE\s+([^\);]+)(\)|;)/;
    } else if (goog.userAgent.WEBKIT) {
      // WebKit/125.4
      re = /WebKit\/(\S+)/;
    }
    if (re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : '';
    }
  }
  return version;
};


/**
 * The version of the user agent. This is a string because it might contain
 * 'b' (as in beta) as well as multiple dots.
 * @type {string}
 */
goog.userAgent.VERSION = goog.userAgent.determineVersion_();


/**
 * Compares two version numbers.
 *
 * @param {string} v1 Version of first item.
 * @param {string} v2 Version of second item.
 *
 * @return {number}  1 if first argument is higher
 *                   0 if arguments are equal
 *                  -1 if second argument is higher.
 * @deprecated Use goog.string.compareVersions.
 */
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2);
};


/**
 * Cache for {@link goog.userAgent.isVersion}. Calls to compareVersions are
 * surprisingly expensive and as a browsers version number is unlikely to change
 * during a session we cache the results.
 * @type {Object}
 * @private
 */
goog.userAgent.isVersionCache_ = {};


/**
 * Whether the user agent version is higher or the same as the given version.
 * NOTE: When checking the version numbers for Firefox and Safari, be sure to
 * use the engine's version, not the browser's version number.  For example,
 * Firefox 3.0 corresponds to Gecko 1.9 and Safari 3.0 to Webkit 522.11.
 * Opera and Internet Explorer versions match the product release number.<br>
 * @see <a href="http://en.wikipedia.org/wiki/Safari_(web_browser)">Webkit</a>
 * @see <a href="http://en.wikipedia.org/wiki/Gecko_engine">Gecko</a>
 *
 * @param {string|number} version The version to check.
 * @return {boolean} Whether the user agent version is higher or the same as
 *     the given version.
 */
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] ||
      (goog.userAgent.isVersionCache_[version] =
          goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0);
};

// Input 9
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Utilities for manipulating the browser's Document Object Model
 * Inspiration taken *heavily* from mochikit (http://mochikit.com/).
 *
 * You can use {@link goog.dom.DomHelper} to create new dom helpers that refer
 * to a different document object.  This is useful if you are working with
 * frames or multiple windows.
 *
 */


// TODO: Rename/refactor getTextContent and getRawTextContent. The problem
// is that getTextContent should mimic the DOM3 textContent. We should add a
// getInnerText (or getText) which tries to return the visible text, innerText.


goog.provide('goog.dom');
goog.provide('goog.dom.DomHelper');
goog.provide('goog.dom.NodeType');

goog.require('goog.array');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.userAgent');


/**
 * @define {boolean} Whether we know at compile time that the browser is in
 * quirks mode.
 */
goog.dom.ASSUME_QUIRKS_MODE = false;


/**
 * @define {boolean} Whether we know at compile time that the browser is in
 * standards compliance mode.
 */
goog.dom.ASSUME_STANDARDS_MODE = false;


/**
 * Whether we know the compatibility mode at compile time.
 * @type {boolean}
 * @private
 */
goog.dom.COMPAT_MODE_KNOWN_ =
    goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;


/**
 * Enumeration for DOM node types (for reference)
 * @enum {number}
 */
goog.dom.NodeType = {
  ELEMENT: 1,
  ATTRIBUTE: 2,
  TEXT: 3,
  CDATA_SECTION: 4,
  ENTITY_REFERENCE: 5,
  ENTITY: 6,
  PROCESSING_INSTRUCTION: 7,
  COMMENT: 8,
  DOCUMENT: 9,
  DOCUMENT_TYPE: 10,
  DOCUMENT_FRAGMENT: 11,
  NOTATION: 12
};


/**
 * Gets the DomHelper object for the document where the element resides.
 * @param {Node|Window=} opt_element If present, gets the DomHelper for this
 *     element.
 * @return {!goog.dom.DomHelper} The DomHelper.
 */
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ?
    new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) :
    (goog.dom.defaultDomHelper_ ||
        (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper()));
};


/**
 * Cached default DOM helper.
 * @type {goog.dom.DomHelper}
 * @private
 */
goog.dom.defaultDomHelper_;


/**
 * Gets the document object being used by the dom library.
 * @return {!Document} Document object.
 */
goog.dom.getDocument = function() {
  return document;
};


/**
 * Alias for getElementById. If a DOM node is passed in then we just return
 * that.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 */
goog.dom.getElement = function(element) {
  return goog.isString(element) ?
      document.getElementById(element) : element;
};


/**
 * Alias for getElement.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 * @deprecated Use {@link goog.dom.getElement} instead.
 */
goog.dom.$ = goog.dom.getElement;


/**
 * Looks up elements by both tag and class name, using browser native functions
 * ({@code querySelectorAll}, {@code getElementsByTagName} or
 * {@code getElementsByClassName}) where possible. This function
 * is a useful, if limited, way of collecting a list of DOM elements
 * with certain characteristics.  {@code goog.dom.query} offers a
 * more powerful and general solution which allows matching on CSS3
 * selector expressions, but at increased cost in code size. If all you
 * need is particular tags belonging to a single class, this function
 * is fast and sleek.
 *
 * @see goog.dom.query
 *
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class,
                                                opt_el);
};


/**
 * Helper for {@code getElementsByTagNameAndClass}.
 * @param {!Document} doc The document to get the elements in.
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 * @private
 */
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class,
                                                  opt_el) {
  var parent = opt_el || doc;
  var tagName = (opt_tag && opt_tag != '*') ? opt_tag.toUpperCase() : '';

  // Prefer the standardized (http://www.w3.org/TR/selectors-api/), native and
  // fast W3C Selectors API. However, the version of WebKit that shipped with
  // Safari 3.1 and Chrome has a bug where it will not correctly match mixed-
  // case class name selectors in quirks mode.
  if (parent.querySelectorAll &&
      (tagName || opt_class) &&
      (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(doc) ||
        goog.userAgent.isVersion('528'))) {
    var query = tagName + (opt_class ? '.' + opt_class : '');
    return parent.querySelectorAll(query);
  }

  // Use the native getElementsByClassName if available, under the assumption
  // that even when the tag name is specified, there will be fewer elements to
  // filter through when going by class than by tag name
  if (opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);

    if (tagName) {
      var arrayLike = {};
      var len = 0;

      // Filter for specific tags if requested.
      for (var i = 0, el; el = els[i]; i++) {
        if (tagName == el.nodeName) {
          arrayLike[len++] = el;
        }
      }
      arrayLike.length = len;

      return arrayLike;
    } else {
      return els;
    }
  }

  var els = parent.getElementsByTagName(tagName || '*');

  if (opt_class) {
    var arrayLike = {};
    var len = 0;
    for (var i = 0, el; el = els[i]; i++) {
      var className = el.className;
      // Check if className has a split function since SVG className does not.
      if (typeof className.split == 'function' &&
          goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el;
      }
    }
    arrayLike.length = len;
    return arrayLike;
  } else {
    return els;
  }
};


/**
 * Alias for {@code getElementsByTagNameAndClass}.
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 * @deprecated Use {@link goog.dom.getElementsByTagNameAndClass} instead.
 */
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;


/**
 * Sets multiple properties on a node.
 * @param {Element} element DOM node to set properties on.
 * @param {Object} properties Hash of property:value pairs.
 */
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if (key == 'style') {
      element.style.cssText = val;
    } else if (key == 'class') {
      element.className = val;
    } else if (key == 'for') {
      element.htmlFor = val;
    } else if (key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
      element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val);
    } else {
      element[key] = val;
    }
  });
};


/**
 * Map of attributes that should be set using
 * element.setAttribute(key, val) instead of element[key] = val.  Used
 * by goog.dom.setProperties.
 *
 * @type {Object}
 * @private
 */
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'colspan': 'colSpan',
  'rowspan': 'rowSpan',
  'valign': 'vAlign',
  'height': 'height',
  'width': 'width',
  'usemap': 'useMap',
  'frameborder': 'frameBorder',
  'type': 'type'
};


/**
 * Gets the dimensions of the viewport.
 *
 * Gecko Standards mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Width of viewport including scrollbar.
 * body.clientWidth   Width of body element.
 *
 * docEl.clientHeight Height of viewport excluding scrollbar.
 * win.innerHeight    Height of viewport including scrollbar.
 * body.clientHeight  Height of document.
 *
 * Gecko Backwards compatible mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Width of viewport including scrollbar.
 * body.clientWidth   Width of viewport excluding scrollbar.
 *
 * docEl.clientHeight Height of document.
 * win.innerHeight    Height of viewport including scrollbar.
 * body.clientHeight  Height of viewport excluding scrollbar.
 *
 * IE6/7 Standards mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Undefined.
 * body.clientWidth   Width of body element.
 *
 * docEl.clientHeight Height of viewport excluding scrollbar.
 * win.innerHeight    Undefined.
 * body.clientHeight  Height of document element.
 *
 * IE5 + IE6/7 Backwards compatible mode:
 * docEl.clientWidth  0.
 * win.innerWidth     Undefined.
 * body.clientWidth   Width of viewport excluding scrollbar.
 *
 * docEl.clientHeight 0.
 * win.innerHeight    Undefined.
 * body.clientHeight  Height of viewport excluding scrollbar.
 *
 * Opera 9 Standards and backwards compatible mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Width of viewport including scrollbar.
 * body.clientWidth   Width of viewport excluding scrollbar.
 *
 * docEl.clientHeight Height of document.
 * win.innerHeight    Height of viewport including scrollbar.
 * body.clientHeight  Height of viewport excluding scrollbar.
 *
 * WebKit:
 * Safari 2
 * docEl.clientHeight Same as scrollHeight.
 * docEl.clientWidth  Same as innerWidth.
 * win.innerWidth     Width of viewport excluding scrollbar.
 * win.innerHeight    Height of the viewport including scrollbar.
 * frame.innerHeight  Height of the viewport exluding scrollbar.
 *
 * Safari 3 (tested in 522)
 *
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * docEl.clientHeight Height of viewport excluding scrollbar in strict mode.
 * body.clientHeight  Height of viewport excluding scrollbar in quirks mode.
 *
 * @param {Window=} opt_window Optional window element to test.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 */
goog.dom.getViewportSize = function(opt_window) {
  // TODO: This should not take an argument
  return goog.dom.getViewportSize_(opt_window || window);
};


/**
 * Helper for {@code getViewportSize}.
 * @param {Window} win The window to get the view port size for.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 * @private
 */
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;

  if (goog.userAgent.WEBKIT && !goog.userAgent.isVersion('500') &&
      !goog.userAgent.MOBILE) {
    // TODO: Sometimes we get something that isn't a valid window
    // object. In this case we just revert to the current window. We need to
    // figure out when this happens and find a real fix for it.
    // See the comments on goog.dom.getWindow.
    if (typeof win.innerHeight == 'undefined') {
      win = window;
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;

    if (win == win.top) {
      if (scrollHeight < innerHeight) {
        innerHeight -= 15; // Scrollbars are 15px wide on Mac
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight);
  }

  var el = goog.dom.isCss1CompatMode_(doc) &&
      // Older versions of Opera used to read from document.body, but this
      // changed with 9.5
      (!goog.userAgent.OPERA ||
          goog.userAgent.OPERA && goog.userAgent.isVersion('9.50')) ?
              doc.documentElement : doc.body;

  return new goog.math.Size(el.clientWidth, el.clientHeight);
};


/**
 * Calculates the height of the document.
 *
 * @return {number} The height of the current document.
 */
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window);
};

/**
 * Calculates the height of the document of the given window.
 *
 * Function code copied from the opensocial gadget api:
 *   gadgets.window.adjustHeight(opt_height)
 *
 * @private
 * @param {Window} win The window whose document height to retrieve.
 * @return {number} The height of the document of the given window.
 */
goog.dom.getDocumentHeight_ = function(win) {
  // NOTE: This method will return the window size rather than the document
  // size in webkit quirks mode.
  var doc = win.document;
  var height = 0;

  if (doc) {
    // Calculating inner content height is hard and different between
    // browsers rendering in Strict vs. Quirks mode.  We use a combination of
    // three properties within document.body and document.documentElement:
    // - scrollHeight
    // - offsetHeight
    // - clientHeight
    // These values differ significantly between browsers and rendering modes.
    // But there are patterns.  It just takes a lot of time and persistence
    // to figure out.

    // Get the height of the viewport
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if (goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      // In Strict mode:
      // The inner content height is contained in either:
      //    document.documentElement.scrollHeight
      //    document.documentElement.offsetHeight
      // Based on studying the values output by different browsers,
      // use the value that's NOT equal to the viewport height found above.
      height = docEl.scrollHeight != vh ?
          docEl.scrollHeight : docEl.offsetHeight;
    } else {
      // In Quirks mode:
      // documentElement.clientHeight is equal to documentElement.offsetHeight
      // except in IE.  In most browsers, document.documentElement can be used
      // to calculate the inner content height.
      // However, in other browsers (e.g. IE), document.body must be used
      // instead.  How do we know which one to use?
      // If document.documentElement.clientHeight does NOT equal
      // document.documentElement.offsetHeight, then use document.body.
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if (docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight;
      }

      // Detect whether the inner content height is bigger or smaller
      // than the bounding box (viewport).  If bigger, take the larger
      // value.  If smaller, take the smaller value.
      if (sh > vh) {
        // Content is larger
        height = sh > oh ? sh : oh;
      } else {
        // Content is smaller
        height = sh < oh ? sh : oh;
      }
    }
  }

  return height;
};


/**
 * Gets the page scroll distance as a coordinate object.
 *
 * @param {Window=} opt_window Optional window element to test.
 * @return {!goog.math.Coordinate} Object with values 'x' and 'y'.
 * @deprecated Use {@link goog.dom.getDocumentScroll} instead.
 */
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll();
};


/**
 * Gets the document scroll distance as a coordinate object.
 *
 * @return {!goog.math.Coordinate} Object with values 'x' and 'y'.
 */
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document);
};


/**
 * Helper for {@code getDocumentScroll}.
 *
 * @param {!Document} doc The document to get the scroll for.
 * @return {!goog.math.Coordinate} Object with values 'x' and 'y'.
 * @private
 */
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  return new goog.math.Coordinate(el.scrollLeft, el.scrollTop);
};


/**
 * Gets the document scroll element.
 * @return {Element} Scrolling element.
 */
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document);
};


/**
 * Helper for {@code getDocumentScrollElement}.
 * @param {!Document} doc The document to get the scroll element for.
 * @return {Element} Scrolling element.
 * @private
 */
goog.dom.getDocumentScrollElement_ = function(doc) {
  // Safari (2 and 3) needs body.scrollLeft in both quirks mode and strict mode.
  return !goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ?
      doc.documentElement : doc.body;
};


/**
 * Gets the window object associated with the given document.
 *
 * @param {Document=} opt_doc  Document object to get window for.
 * @return {Window} The window associated with the given document.
 */
goog.dom.getWindow = function(opt_doc) {
  // TODO: This should not take an argument.
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window;
};


/**
 * Helper for {@code getWindow}.
 *
 * @param {!Document} doc  Document object to get window for.
 * @return {!Window} The window associated with the given document.
 * @private
 */
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView;
};


/**
 * Returns a dom node with a set of attributes.  This function accepts varargs
 * for subsequent nodes to be added.  Subsequent nodes will be added to the
 * first node as childNodes.
 *
 * So:
 * <code>createDom('div', null, createDom('p'), createDom('p'));</code>
 * would return a div with two child paragraphs
 *
 * @param {string} tagName Tag to create.
 * @param {Object|string=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...Object|string|Array|NodeList} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,i
 *     its elements will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 */
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments);
};

/**
 * Helper for {@code createDom}.
 * @param {!Document} doc The document to create the DOM in.
 * @param {Arguments} args Argument object passed from the callers. See
 *     {@code goog.dom.createDom} for details.
 * @return {!Element} Reference to a DOM node.
 * @private
 */
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];

  // Internet Explorer is dumb: http://msdn.microsoft.com/workshop/author/
  //                            dhtml/reference/properties/name_2.asp
  // Also does not allow setting of 'type' attribute on 'input' or 'button'.
  if (goog.userAgent.IE && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ['<', tagName];
    if (attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name),
                      '"');
    }
    if (attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type),
                      '"');
      // Create copy of attribute map to remove 'type' without mutating argument
      attributes = goog.cloneObject(attributes);
      delete attributes.type;
    }
    tagNameArr.push('>');
    tagName = tagNameArr.join('');
  }

  var element = doc.createElement(tagName);

  if (attributes) {
    if (goog.isString(attributes)) {
      element.className = attributes;
    } else {
      goog.dom.setProperties(element, attributes);
    }
  }

  if (args.length > 2) {
    var childHandler = function(child) {
      // TODO: More coercion, ala MochiKit?
      if (child) {
        element.appendChild(goog.isString(child) ?
            doc.createTextNode(child) : child);
      }
    };

    for (var i = 2; i < args.length; i++) {
      var arg = args[i];
      // TODO: Fix isArrayLike to return false for a text node.
      if (goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
        // If the argument is a node list, not a real array, use a clone,
        // because forEach can't be used to mutate a NodeList.
        goog.array.forEach(goog.dom.isNodeList(arg) ?
            goog.array.clone(arg) : arg,
            childHandler);
      } else {
        childHandler(arg);
      }
    }
  }

  return element;
};

/**
 * Alias for {@code createDom}.
 * @param {string} tagName Tag to create.
 * @param {string|Object=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...Object|string|Array|NodeList} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array, its
 *     children will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 * @deprecated Use {@link goog.dom.createDom} instead.
 */
goog.dom.$dom = goog.dom.createDom;


/**
 * Creates a new element.
 * @param {string} name Tag name.
 * @return {!Element} The new element.
 */
goog.dom.createElement = function(name) {
  return document.createElement(name);
};


/**
 * Creates a new text node.
 * @param {string} content Content.
 * @return {!Text} The new text node.
 */
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content);
};


/**
 * Create a table.
 * @param {number} rows The number of rows in the table.  Must be >= 1.
 * @param {number} columns The number of columns in the table.  Must be >= 1.
 * @param {boolean=} opt_fillWithNbsp If true, fills table entries with nsbps.
 * @return {!Element} The created table.
 */
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp);
};


/**
 * Create a table.
 * @param {!Document} doc Document object to use to create the table.
 * @param {number} rows The number of rows in the table.  Must be >= 1.
 * @param {number} columns The number of columns in the table.  Must be >= 1.
 * @param {boolean} fillWithNbsp If true, fills table entries with nsbps.
 * @return {!Element} The created table.
 * @private
 */
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ['<tr>'];
  for (var i = 0; i < columns; i++) {
    rowHtml.push(fillWithNbsp ? '<td>&nbsp;</td>' : '<td></td>');
  }
  rowHtml.push('</tr>');
  rowHtml = rowHtml.join('');
  var totalHtml = ['<table>'];
  for (i = 0; i < rows; i++) {
    totalHtml.push(rowHtml);
  }
  totalHtml.push('</table>');

  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join('');
  return /** @type {!Element} */ (elem.removeChild(elem.firstChild));
};


/**
 * Converts an HTML string into a document fragment.
 *
 * @param {string} htmlString The HTML string to convert.
 * @return {!Node} The resulting document fragment.
 */
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString);
};


/**
 * Helper for {@code htmlToDocumentFragment}.
 *
 * @param {!Document} doc The document.
 * @param {string} htmlString The HTML string to convert.
 * @return {!Node} The resulting document fragment.
 * @private
 */
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement('div');
  tempDiv.innerHTML = htmlString;
  if (tempDiv.childNodes.length == 1) {
    return /** @type {!Node} */ (tempDiv.removeChild(tempDiv.firstChild));
  } else {
    var fragment = doc.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    return fragment;
  }
};


/**
 * Returns the compatMode of the document.
 * @return {string} The result is either CSS1Compat or BackCompat.
 * @deprecated use goog.dom.isCss1CompatMode instead.
 */
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? 'CSS1Compat' : 'BackCompat';
};


/**
 * Returns true if the browser is in "CSS1-compatible" (standards-compliant)
 * mode, false otherwise.
 * @return {boolean} True if in CSS1-compatible mode.
 */
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document);
};


/**
 * Returns true if the browser is in "CSS1-compatible" (standards-compliant)
 * mode, false otherwise.
 * @param {Document} doc The document to check.
 * @return {boolean} True if in CSS1-compatible mode.
 * @private
 */
goog.dom.isCss1CompatMode_ = function(doc) {
  if (goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE;
  }

  return doc.compatMode == 'CSS1Compat';
};


/**
 * Determines if the given node can contain children.
 * @param {Node} node The node to check.
 * @return {boolean} Whether the node can contain children.
 */
goog.dom.canHaveChildren = function(node) {
  if (node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false;
  }
  if ('canHaveChildren' in node) {
    // IE supports this natively.
    return node.canHaveChildren;
  }
  switch (node.tagName) {
    case goog.dom.TagName.APPLET:
    case goog.dom.TagName.AREA:
    case goog.dom.TagName.BASE:
    case goog.dom.TagName.BR:
    case goog.dom.TagName.COL:
    case goog.dom.TagName.FRAME:
    case goog.dom.TagName.HR:
    case goog.dom.TagName.IMG:
    case goog.dom.TagName.INPUT:
    case goog.dom.TagName.IFRAME:
    case goog.dom.TagName.ISINDEX:
    case goog.dom.TagName.LINK:
    case goog.dom.TagName.NOFRAMES:
    case goog.dom.TagName.NOSCRIPT:
    case goog.dom.TagName.META:
    case goog.dom.TagName.OBJECT:
    case goog.dom.TagName.PARAM:
    case goog.dom.TagName.SCRIPT:
    case goog.dom.TagName.STYLE:
      return false;
  }
  return true;
};


/**
 * Appends a child to a node.
 * @param {Node} parent Parent.
 * @param {Node} child Child.
 */
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child);
};


/**
 * Removes all the child nodes on a DOM node.
 * @param {Node} node Node to remove children from.
 */
goog.dom.removeChildren = function(node) {
  // Note: Iterations over live collections can be slow, this is the fastest
  // we could find. The double parenthesis are used to prevent JsCompiler and
  // strict warnings.
  var child;
  while ((child = node.firstChild)) {
    node.removeChild(child);
  }
};


/**
 * Inserts a new node before an existing reference node (i.e. as the previous
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert before.
 */
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if (refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode);
  }
};


/**
 * Inserts a new node after an existing reference node (i.e. as the next
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert after.
 */
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if (refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
  }
};


/**
 * Removes a node from its parent.
 * @param {Node} node The node to remove.
 * @return {Node} The node removed if removed; else, null.
 */
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
};


/**
 * Replaces a node in the DOM tree. Will do nothing if {@code oldNode} has no
 * parent.
 * @param {Node} newNode Node to insert.
 * @param {Node} oldNode Node to replace.
 */
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if (parent) {
    parent.replaceChild(newNode, oldNode);
  }
};


/**
 * Flattens an element. That is, removes it and replace it with its children.
 * Does nothing if the element is not in the document.
 * @param {Element} element The element to flatten.
 * @return {Element|undefined} The original element, detached from the document
 *     tree, sans children; or undefined, if the element was not in the
 *     document to begin with.
 */
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if (parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    // Use IE DOM method (supported by Opera too) if available
    if (element.removeNode) {
      return /** @type {Element} */ (element.removeNode(false));
    } else {
      // Move all children of the original node up one level.
      while ((child = element.firstChild)) {
        parent.insertBefore(child, element);
      }

      // Detach the original element.
      return /** @type {Element} */ (goog.dom.removeNode(element));
    }
  }
};


/**
 * Returns the first child node that is an element.
 * @param {Node} node The node to get the first child element of.
 * @return {Element} The first child node of {@code node} that is an element.
 */
goog.dom.getFirstElementChild = function(node) {
  return goog.dom.getNextElementNode_(node.firstChild, true);
};


/**
 * Returns the last child node that is an element.
 * @param {Node} node The node to get the last child element of.
 * @return {Element} The last child node of {@code node} that is an element.
 */
goog.dom.getLastElementChild = function(node) {
  return goog.dom.getNextElementNode_(node.lastChild, false);
};


/**
 * Returns the first next sibling that is an element.
 * @param {Node} node The node to get the next sibling element of.
 * @return {Element} The next sibling of {@code node} that is an element.
 */
goog.dom.getNextElementSibling = function(node) {
  return goog.dom.getNextElementNode_(node.nextSibling, true);
};


/**
 * Returns the first previous sibling that is an element.
 * @param {Node} node The node to get the previous sibling element of.
 * @return {Element} The first previous sibling of {@code node} that is
 *     an element.
 */
goog.dom.getPreviousElementSibling = function(node) {
  return goog.dom.getNextElementNode_(node.previousSibling, false);
};


/**
 * Returns the first node that is an element in the specified direction,
 * starting with {@code node}.
 * @param {Node} node The node to get the next element from.
 * @param {boolean} forward Whether to look forwards or backwards.
 * @return {Element} The first element.
 * @private
 */
goog.dom.getNextElementNode_ = function(node, forward) {
  while (node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling;
  }

  return /** @type {Element} */ (node);
};


/**
 * Returns the next node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The next node in the DOM tree, or null if this was the last
 *     node.
 */
goog.dom.getNextNode = function(node) {
  if (!node) {
    return null;
  }

  if (node.firstChild) {
    return node.firstChild;
  }

  while (node && !node.nextSibling) {
    node = node.parentNode;
  }

  return node ? node.nextSibling : null;
};


/**
 * Returns the previous node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The previous node in the DOM tree, or null if this was the
 *     first node.
 */
goog.dom.getPreviousNode = function(node) {
  if (!node) {
    return null;
  }

  if (!node.previousSibling) {
    return node.parentNode;
  }

  node = node.previousSibling;
  while (node && node.lastChild) {
    node = node.lastChild;
  }

  return node;
};


/**
 * Whether the object looks like a DOM node.
 * @param {*} obj The object being tested for node likeness.
 * @return {boolean} Whether the object looks like a DOM node.
 */
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0;
};


/**
 * Whether a node contains another node.
 * @param {Node} parent The node that should contain the other node.
 * @param {Node} descendant The node to test presence of.
 * @return {boolean} Whether the parent node contains the descendent node.
 */
goog.dom.contains = function(parent, descendant) {
  // We use browser specific methods for this if available since it is faster
  // that way.

  // IE DOM
  if (parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant);
  }

  // W3C DOM Level 3
  if (typeof parent.compareDocumentPosition != 'undefined') {
    return parent == descendant ||
        Boolean(parent.compareDocumentPosition(descendant) & 16);
  }

  // W3C DOM Level 1
  while (descendant && parent != descendant) {
    descendant = descendant.parentNode;
  }
  return descendant == parent;
};


/**
 * Compares the document order of two nodes, returning 0 if they are the same
 * node, a negative number if node1 is before node2, and a positive number if
 * node2 is before node1.  Note that we compare the order the tags appear in the
 * document so in the tree <b><i>text</i></b> the B node is considered to be
 * before the I node.
 *
 * @param {Node} node1 The first node to compare.
 * @param {Node} node2 The second node to compare.
 * @return {number} 0 if the nodes are the same node, a negative number if node1
 *     is before node2, and a positive number if node2 is before node1.
 */
goog.dom.compareNodeOrder = function(node1, node2) {
  // Fall out quickly for equality.
  if (node1 == node2) {
    return 0;
  }

  // Use compareDocumentPosition where available
  if (node1.compareDocumentPosition) {
    // 4 is the bitmask for FOLLOWS.
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1;
  }

  // Process in IE using sourceIndex - we check to see if the first node has
  // a source index or if its parent has one.
  if ('sourceIndex' in node1 ||
      (node1.parentNode && 'sourceIndex' in node1.parentNode)) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;

    if (isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex;
    } else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;

      if (parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2);
      }

      if (!isElement1 && goog.dom.contains(parent1, node2)) {
        return -1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2);
      }


      if (!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1);
      }

      return (isElement1 ? node1.sourceIndex : parent1.sourceIndex) -
             (isElement2 ? node2.sourceIndex : parent2.sourceIndex);
    }
  }

  // For Safari, we compare ranges.
  var doc = goog.dom.getOwnerDocument(node1);

  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);

  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);

  return range1.compareBoundaryPoints(goog.global['Range'].START_TO_END,
      range2);
};


/**
 * Utility function to compare the position of two nodes, when
 * {@code textNode}'s parent is an ancestor of {@code node}.  If this entry
 * condition is not met, this function will attempt to reference a null object.
 * @param {Node} textNode The textNode to compare.
 * @param {Node} node The node to compare.
 * @return {number} -1 if node is before textNode, +1 otherwise.
 * @private
 */
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if (parent == node) {
    // If textNode is a child of node, then node comes first.
    return -1;
  }
  var sibling = node;
  while (sibling.parentNode != parent) {
    sibling = sibling.parentNode;
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode);
};


/**
 * Utility function to compare the position of two nodes known to be non-equal
 * siblings.
 * @param {Node} node1 The first node to compare.
 * @param {Node} node2 The second node to compare.
 * @return {number} -1 if node1 is before node2, +1 otherwise.
 * @private
 */
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while ((s = s.previousSibling)) {
    if (s == node1) {
      // We just found node1 before node2.
      return -1;
    }
  }

  // Since we didn't find it, node1 must be after node2.
  return 1;
};


/**
 * Find the deepest common ancestor of the given nodes.
 * @param {...Node} var_args The nodes to find a common ancestor of.
 * @return {Node} The common ancestor of the nodes, or null if there is none.
 *     null will only be returned if two or more of the nodes are from different
 *     documents.
 */
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if (!count) {
    return null;
  } else if (count == 1) {
    return arguments[0];
  }

  var paths = [];
  var minLength = Infinity;
  for (i = 0; i < count; i++) {
    // Compute the list of ancestors.
    var ancestors = [];
    var node = arguments[i];
    while (node) {
      ancestors.unshift(node);
      node = node.parentNode;
    }

    // Save the list for comparison.
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length);
  }
  var output = null;
  for (i = 0; i < minLength; i++) {
    var first = paths[0][i];
    for (var j = 1; j < count; j++) {
      if (first != paths[j][i]) {
        return output;
      }
    }
    output = first;
  }
  return output;
};


/**
 * Returns the owner document for a node.
 * @param {Node|Window} node The node to get the document for.
 * @return {!Document} The document owning the node.
 */
goog.dom.getOwnerDocument = function(node) {
  // TODO: Remove IE5 code.
  // IE5 uses document instead of ownerDocument
  return /** @type {!Document} */ (
      node.nodeType == goog.dom.NodeType.DOCUMENT ? node :
      node.ownerDocument || node.document);
};


/**
 * Cross-browser function for getting the document element of a frame or iframe.
 * @param {Element} frame Frame element.
 * @return {!Document} The frame content document.
 */
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if (goog.userAgent.WEBKIT) {
    doc = (frame.document || frame.contentWindow.document);
  } else {
    doc = (frame.contentDocument || frame.contentWindow.document);
  }
  return doc;
};


/**
 * Cross-browser function for getting the window of a frame or iframe.
 * @param {HTMLIFrameElement|HTMLFrameElement} frame Frame element.
 * @return {Window} The window associated with the given frame.
 */
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow ||
      goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame));
};


/**
 * Cross-browser function for setting the text content of an element.
 * @param {Element} element The element to change the text content of.
 * @param {string} text The string that should replace the current element
 *     content.
 */
goog.dom.setTextContent = function(element, text) {
  if ('textContent' in element) {
    element.textContent = text;
  } else if (element.firstChild &&
             element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
    // If the first child is a text node we just change its data and remove the
    // rest of the children.
    while (element.lastChild != element.firstChild) {
      element.removeChild(element.lastChild);
    }
    element.firstChild.data = text;
  } else {
    goog.dom.removeChildren(element);
    var doc = goog.dom.getOwnerDocument(element);
    element.appendChild(doc.createTextNode(text));
  }
};


/**
 * Gets the outerHTML of a node, which islike innerHTML, except that it
 * actually contains the HTML of the node itself.
 * @param {Element} element The element to get the HTML of.
 * @return {string} The outerHTML of the given element.
 */
goog.dom.getOuterHtml = function(element) {
  // IE, Opera and WebKit all have outerHTML.
  if ('outerHTML' in element) {
    return element.outerHTML;
  } else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement('div');
    div.appendChild(element.cloneNode(true));
    return div.innerHTML;
  }
};


/**
 * Finds the first descendant node that matches the filter function, using
 * a depth first search. This function offers the most general purpose way
 * of finding a matching element. You may also wish to consider
 * {@code goog.dom.query} which can express many matching criteria using
 * CSS selector expressions. These expressions often result in a more
 * compact representation of the desired result.
 * @see goog.dom.query
 *
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Node|undefined} The found node or undefined if none is found.
 */
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined;
};


/**
 * Finds all the descendant nodes that match the filter function, using a
 * a depth first search. This function offers the most general-purpose way
 * of finding a set of matching elements. You may also wish to consider
 * {@code goog.dom.query} which can express many matching criteria using
 * CSS selector expressions. These expressions often result in a more
 * compact representation of the desired result.

 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Array.<Node>} The found nodes or an empty array if none are found.
 */
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv;
};


/**
 * Finds the first or all the descendant nodes that match the filter function,
 * using a depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @param {Array.<Node>} rv The found nodes are added to this array.
 * @param {boolean} findOne If true we exit after the first found node.
 * @return {boolean} Whether the search is complete or not. True in case findOne
 *     is true and the node is found. False otherwise.
 * @private
 */
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if (root != null) {
    for (var i = 0, child; child = root.childNodes[i]; i++) {
      if (p(child)) {
        rv.push(child);
        if (findOne) {
          return true;
        }
      }
      if (goog.dom.findNodes_(child, p, rv, findOne)) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Map of tags whose content to ignore when calculating text length.
 * @type {Object}
 * @private
 */
goog.dom.TAGS_TO_IGNORE_ = {
  'SCRIPT': 1,
  'STYLE': 1,
  'HEAD': 1,
  'IFRAME': 1,
  'OBJECT': 1
};


/**
 * Map of tags which have predefined values with regard to whitespace.
 * @type {Object}
 * @private
 */
goog.dom.PREDEFINED_TAG_VALUES_ = {'IMG': ' ', 'BR': '\n'};


/**
 * Returns true if the element has a tab index that allows it to receive
 * keyboard focus (tabIndex >= 0), false otherwise.  Note that form elements
 * natively support keyboard focus, even if they have no tab index.  See
 * http://go/tabindex for more info.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element has a tab index that allows keyboard
 *     focus.
 */
goog.dom.isFocusableTabIndex = function(element) {
  // IE returns 0 for an unset tabIndex, so we must use getAttributeNode(),
  // which returns an object with a 'specified' property if tabIndex is
  // specified.  This works on other browsers, too.
  var attrNode = element.getAttributeNode('tabindex'); // Must be lowercase!
  if (attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0;
  }
  return false;
};


/**
 * Enables or disables keyboard focus support on the element via its tab index.
 * Only elements for which {@link goog.dom.isFocusableTabIndex} returns true
 * (or elements that natively support keyboard focus, like form elements) can
 * receive keyboard focus.  See http://go/tabindex for more info.
 * @param {Element} element Element whose tab index is to be changed.
 * @param {boolean} enable Whether to set or remove a tab index on the element
 *     that supports keyboard focus.
 */
goog.dom.setFocusableTabIndex = function(element, enable) {
  if (enable) {
    element.tabIndex = 0;
  } else {
    element.removeAttribute('tabIndex'); // Must be camelCase!
  }
};


/**
 * Returns the text content of the current node, without markup and invisible
 * symbols. New lines are stripped and whitespace is collapsed,
 * such that each character would be visible.
 *
 * In browsers that support it, innerText is used.  Other browsers attempt to
 * simulate it via node traversal.  Line breaks are canonicalized in IE.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The text content.
 */
goog.dom.getTextContent = function(node) {
  var textContent;
  // NOTE: Both Opera and Safara 3 supports innerText but they include
  // text nodes in script tags. So we revert to use a user agent test here.
  if (goog.userAgent.IE && ('innerText' in node)) {
    textContent = goog.string.canonicalizeNewlines(node.innerText);
    // Unfortunately .innerText() returns text with &shy; symbols
    // We need to filter it out and then remove duplicate whitespaces
  } else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join('');
  }

  // Strip &shy; entities. goog.format.insertWordBreaks inserts them in Opera.
  textContent = textContent.replace(/\xAD/g, '');

  textContent = textContent.replace(/ +/g, ' ');
  if (textContent != ' ') {
    textContent = textContent.replace(/^\s*/, '');
  }

  return textContent;
};


/**
 * Returns the text content of the current node, without markup.
 *
 * Unlike {@code getTextContent} this method does not collapse whitespaces
 * or normalize lines breaks.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The raw text content.
 */
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);

  return buf.join('');
};


/**
 * Recursive support function for text content retrieval.
 *
 * @param {Node} node The node from which we are getting content.
 * @param {Array} buf string buffer.
 * @param {boolean} normalizeWhitespace Whether to normalize whitespace.
 * @private
 */
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if (node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    // ignore certain tags
  } else if (node.nodeType == goog.dom.NodeType.TEXT) {
    if (normalizeWhitespace) {
      buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ''));
    } else {
      buf.push(node.nodeValue);
    }
  } else if (node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
    buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName]);
  } else {
    var child = node.firstChild;
    while (child) {
      goog.dom.getTextContent_(child, buf, normalizeWhitespace);
      child = child.nextSibling;
    }
  }
};


/**
 * Returns the text length of the text contained in a node, without markup. This
 * is equivalent to the selection length if the node was selected, or the number
 * of cursor movements to traverse the node. Images & BRs take one space.  New
 * lines are ignored.
 *
 * @param {Node} node The node whose text content length is being calculated.
 * @return {number} The length of {@code node}'s text content.
 */
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length;
};


/**
 * Returns the text offset of a node relative to one of its ancestors. The text
 * length is the same as the length calculated by goog.dom.getNodeTextLength.
 *
 * @param {Node} node The node whose offset is being calculated.
 * @param {Node=} opt_offsetParent The node relative to which the offset will
 *     be calculated. Defaults to the node's owner document's body.
 * @return {number} The text offset.
 */
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while (node && node != root) {
    var cur = node;
    while ((cur = cur.previousSibling)) {
      buf.unshift(goog.dom.getTextContent(cur));
    }
    node = node.parentNode;
  }
  // Trim left to deal with FF cases when there might be line breaks and empty
  // nodes at the front of the text
  return goog.string.trimLeft(buf.join('')).replace(/ +/g, ' ').length;
};


/**
 * Returns the node at a given offset in a parent node.  If an object is
 * provided for the optional third parameter, the node and the remainder of the
 * offset will stored as properties of this object.
 * @param {Node} parent The parent node.
 * @param {number} offset The offset into the parent node.
 * @param {Object=} opt_result Object to be used to store the return value. The
 *     return value will be stored in the form {node: Node, remainder: number}
 *     if this object is provided.
 * @return {Node} The node at the given offset.
 */
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while (stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if (cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
      // ignore certain tags
    } else if (cur.nodeType == goog.dom.NodeType.TEXT) {
      var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, '').replace(/ +/g, ' ');
      pos += text.length;
    } else if (cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
      pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length;
    } else {
      for (var i = cur.childNodes.length - 1; i >= 0; i--) {
        stack.push(cur.childNodes[i]);
      }
    }
  }
  if (goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur;
  }

  return cur;
};


/**
 * Returns true if the object is a {@code NodeList}.  To qualify as a NodeList,
 * the object must have a numeric length property and an item function (which
 * has type 'string' on IE for some reason).
 * @param {Object} val Object to test.
 * @return {boolean} Whether the object is a NodeList.
 */
goog.dom.isNodeList = function(val) {
  // TODO: Now the isNodeList is part of goog.dom we can use
  // goog.userAgent to make this simpler.
  // A NodeList must have a length property of type 'number' on all platforms.
  if (val && typeof val.length == 'number') {
    // A NodeList is an object everywhere except Safari, where it's a function.
    if (goog.isObject(val)) {
      // A NodeList must have an item function (on non-IE platforms) or an item
      // property of type 'string' (on IE).
      return typeof val.item == 'function' || typeof val.item == 'string';
    } else if (goog.isFunction(val)) {
      // On Safari, a NodeList is a function with an item property that is also
      // a function.
      return typeof val.item == 'function';
    }
  }

  // Not a NodeList.
  return false;
};


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * tag name and/or class name. If the passed element matches the specified
 * criteria, the element itself is returned.
 * @param {Node} element The DOM node to start with.
 * @param {?string=} opt_tag The tag name to match (or null/undefined to match
 *     any node regardless of tag name). Must be uppercase (goog.dom.TagName).
 * @param {?string=} opt_class The class name to match (or null/undefined to
 *     match any node regardless of class name).
 * @return {Node} The first ancestor that matches the passed criteria, or
 *     null if none match.
 */
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element,
      function(node) {
        return (!tagName || node.nodeName == tagName) &&
               (!opt_class || goog.dom.classes.has(node, opt_class));
      }, true);
};


/**
 * Walks up the DOM hierarchy returning the first ancestor that passes the
 * matcher function.
 * @param {Node} element The DOM node to start with.
 * @param {function(Node) : boolean} matcher A function that returns true if the
 *     passed node matches the desired criteria.
 * @param {boolean=} opt_includeNode If true, the node itself is included in
 *     the search (the first call to the matcher will pass startElement as
 *     the node to test).
 * @param {number=} opt_maxSearchSteps Maximum number of levels to search up the
 *     dom.
 * @return {Node} DOM node that matched the matcher, or null if there was
 *     no match.
 */
goog.dom.getAncestor = function(
    element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if (!opt_includeNode) {
    element = element.parentNode;
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while (element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if (matcher(element)) {
      return element;
    }
    element = element.parentNode;
    steps++;
  }
  // Reached the root of the DOM without a match
  return null;
};


/**
 * Create an instance of a DOM helper with a new document object.
 * @param {Document=} opt_document Document object to associate with this
 *     DOM helper.
 * @constructor
 */
goog.dom.DomHelper = function(opt_document) {
  /**
   * Reference to the document object to use
   * @type {!Document}
   * @private
   */
  this.document_ = opt_document || goog.global.document || document;
};


/**
 * Gets the dom helper object for the document where the element resides.
 * @param {Node=} opt_node If present, gets the DomHelper for this node.
 * @return {!goog.dom.DomHelper} The DomHelper.
 */
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;


/**
 * Sets the document object.
 * @param {!Document} document Document object.
 */
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document;
};


/**
 * Gets the document object being used by the dom library.
 * @return {!Document} Document object.
 */
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_;
};


/**
 * Alias for {@code getElementById}. If a DOM node is passed in then we just
 * return that.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 */
goog.dom.DomHelper.prototype.getElement = function(element) {
  if (goog.isString(element)) {
    return this.document_.getElementById(element);
  } else {
    return element;
  }
};


/**
 * Alias for {@code getElement}.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 * @deprecated Use {@link goog.dom.DomHelper.prototype.getElement} instead.
 */
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;


/**
 * Looks up elements by both tag and class name, using browser native functions
 * ({@code querySelectorAll}, {@code getElementsByTagName} or
 * {@code getElementsByClassName}) where possible. The returned array is a live
 * NodeList or a static list depending on the code path taken.
 *
 * @see goog.dom.query
 *
 * @param {?string=} opt_tag Element tag name or * for all tags.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag,
                                                                     opt_class,
                                                                     opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag,
                                                opt_class, opt_el);
};


/**
 * Alias for {@code getElementsByTagNameAndClass}.
 * @deprecated Use DomHelper getElementsByTagNameAndClass.
 * @see goog.dom.query
 *
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.DomHelper.prototype.$$ =
    goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;


/**
 * Sets a number of properties on a node.
 * @param {Element} element DOM node to set properties on.
 * @param {Object} properties Hash of property:value pairs.
 */
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;


/**
 * Gets the dimensions of the viewport.
 * @param {Window=} opt_window Optional window element to test. Defaults to
 *     the window of the Dom Helper.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 */
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  // TODO: This should not take an argument. That breaks the rule of a
  // a DomHelper representing a single frame/window/document.
  return goog.dom.getViewportSize(opt_window || this.getWindow());
};


/**
 * Calculates the height of the document.
 *
 * @return {number} The height of the document.
 */
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow());
};


/**
 * Returns a dom node with a set of attributes.  This function accepts varargs
 * for subsequent nodes to be added.  Subsequent nodes will be added to the
 * first node as childNodes.
 *
 * So:
 * <code>createDom('div', null, createDom('p'), createDom('p'));</code>
 * would return a div with two child paragraphs
 *
 * An easy way to move all child nodes of an existing element to a new parent
 * element is:
 * <code>createDom('div', null, oldElement.childNodes);</code>
 * which will remove all child nodes from the old element and add them as
 * child nodes of the new DIV.
 *
 * @param {string} tagName Tag to create.
 * @param {Object|string=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...Object|string|Array|NodeList} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or
 *     NodeList, its elements will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 */
goog.dom.DomHelper.prototype.createDom = function(tagName,
                                                  opt_attributes,
                                                  var_args) {
  return goog.dom.createDom_(this.document_, arguments);
};


/**
 * Alias for {@code createDom}.
 * @param {string} tagName Tag to create.
 * @param {Object|string=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...Object|string|Array|NodeList} var_args Further DOM nodes
 *     or strings for text nodes.  If one of the var_args is an array, its
 *     children will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 * @deprecated Use {@link goog.dom.DomHelper.prototype.createDom} instead.
 */
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;


/**
 * Creates a new element.
 * @param {string} name Tag name.
 * @return {!Element} The new element.
 */
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name);
};


/**
 * Creates a new text node.
 * @param {string} content Content.
 * @return {!Text} The new text node.
 */
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content);
};


/**
 * Create a table.
 * @param {number} rows The number of rows in the table.  Must be >= 1.
 * @param {number} columns The number of columns in the table.  Must be >= 1.
 * @param {boolean=} opt_fillWithNbsp If true, fills table entries with nsbps.
 * @return {!Element} The created table.
 */
goog.dom.DomHelper.prototype.createTable = function(rows, columns,
    opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns,
      !!opt_fillWithNbsp);
};


/**
 * Converts an HTML string into a node or a document fragment.  A single Node
 * is used if the {@code htmlString} only generates a single node.  If the
 * {@code htmlString} generates multiple nodes then these are put inside a
 * {@code DocumentFragment}.
 *
 * @param {string} htmlString The HTML string to convert.
 * @return {!Node} The resulting node.
 */
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString);
};


/**
 * Returns the compatMode of the document.
 * @return {string} The result is either CSS1Compat or BackCompat.
 * @deprecated use goog.dom.DomHelper.prototype.isCss1CompatMode instead.
 */
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? 'CSS1Compat' : 'BackCompat';
};


/**
 * Returns true if the browser is in "CSS1-compatible" (standards-compliant)
 * mode, false otherwise.
 * @return {boolean} True if in CSS1-compatible mode.
 */
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_);
};


/**
 * Gets the window object associated with the document.
 * @return {!Window} The window associated with the given document.
 */
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_);
};


/**
 * Gets the document scroll element.
 * @return {Element} Scrolling element.
 */
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_);
};


/**
 * Gets the document scroll distance as a coordinate object.
 * @return {!goog.math.Coordinate} Object with properties 'x' and 'y'.
 */
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_);
};


/**
 * Appends a child to a node.
 * @param {Node} parent Parent.
 * @param {Node} child Child.
 */
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;


/**
 * Removes all the child nodes on a DOM node.
 * @param {Node} node Node to remove children from.
 */
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;


/**
 * Inserts a new node before an existing reference node (i.e., as the previous
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert before.
 */
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;


/**
 * Inserts a new node after an existing reference node (i.e., as the next
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert after.
 */
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;


/**
 * Removes a node from its parent.
 * @param {Node} node The node to remove.
 * @return {Node} The node removed if removed; else, null.
 */
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;


/**
 * Replaces a node in the DOM tree. Will do nothing if {@code oldNode} has no
 * parent.
 * @param {Node} newNode Node to insert.
 * @param {Node} oldNode Node to replace.
 */
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;


/**
 * Flattens an element. That is, removes it and replace it with its children.
 * @param {Element} element The element to flatten.
 * @return {Element|undefined} The original element, detached from the document
 *     tree, sans children, or undefined if the element was already not in the
 *     document.
 */
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;


/**
 * Returns the first child node that is an element.
 * @param {Node} node The node to get the first child element of.
 * @return {Element} The first child node of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getFirstElementChild =
    goog.dom.getFirstElementChild;


/**
 * Returns the last child node that is an element.
 * @param {Node} node The node to get the last child element of.
 * @return {Element} The last child node of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;


/**
 * Returns the first next sibling that is an element.
 * @param {Node} node The node to get the next sibling element of.
 * @return {Element} The next sibling of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getNextElementSibling =
    goog.dom.getNextElementSibling;


/**
 * Returns the first previous sibling that is an element.
 * @param {Node} node The node to get the previous sibling element of.
 * @return {Element} The first previous sibling of {@code node} that is
 *     an element.
 */
goog.dom.DomHelper.prototype.getPreviousElementSibling =
    goog.dom.getPreviousElementSibling;


/**
 * Returns the next node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The next node in the DOM tree, or null if this was the last
 *     node.
 */
goog.dom.DomHelper.prototype.getNextNode =
    goog.dom.getNextNode;


/**
 * Returns the previous node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The previous node in the DOM tree, or null if this was the
 *     first node.
 */
goog.dom.DomHelper.prototype.getPreviousNode =
    goog.dom.getPreviousNode;


/**
 * Whether the object looks like a DOM node.
 * @param {*} obj The object being tested for node likeness.
 * @return {boolean} Whether the object looks like a DOM node.
 */
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;


/**
 * Whether a node contains another node.
 * @param {Node} parent The node that should contain the other node.
 * @param {Node} descendant The node to test presence of.
 * @return {boolean} Whether the parent node contains the descendent node.
 */
goog.dom.DomHelper.prototype.contains = goog.dom.contains;


/**
 * Returns the owner document for a node.
 * @param {Node} node The node to get the document for.
 * @return {!Document} The document owning the node.
 */
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;


/**
 * Cross browser function for getting the document element of an iframe.
 * @param {HTMLIFrameElement|HTMLFrameElement} iframe Iframe element.
 * @return {!HTMLDocument} The frame content document.
 */
goog.dom.DomHelper.prototype.getFrameContentDocument =
    goog.dom.getFrameContentDocument;


/**
 * Cross browser function for getting the window of a frame or iframe.
 * @param {HTMLIFrameElement|HTMLFrameElement} frame Frame element.
 * @return {Window} The window associated with the given frame.
 */
goog.dom.DomHelper.prototype.getFrameContentWindow =
    goog.dom.getFrameContentWindow;


/**
 * Cross browser function for setting the text content of an element.
 * @param {Element} element The element to change the text content of.
 * @param {string} text The string that should replace the current element
 *     content with.
 */
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;


/**
 * Finds the first descendant node that matches the filter function. This does
 * a depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {(Node, undefined)} The found node or undefined if none is found.
 */
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;


/**
 * Finds all the descendant nodes that matches the filter function. This does a
 * depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Array.<Node>} The found nodes or an empty array if none are found.
 */
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;


/**
 * Returns the text contents of the current node, without markup. New lines are
 * stripped and whitespace is collapsed, such that each character would be
 * visible.
 *
 * In browsers that support it, innerText is used.  Other browsers attempt to
 * simulate it via node traversal.  Line breaks are canonicalized in IE.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The text content.
 */
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;


/**
 * Returns the text length of the text contained in a node, without markup. This
 * is equivalent to the selection length if the node was selected, or the number
 * of cursor movements to traverse the node. Images & BRs take one space.  New
 * lines are ignored.
 *
 * @param {Node} node The node whose text content length is being calculated.
 * @return {number} The length of {@code node}'s text content.
 */
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;


/**
 * Returns the text offset of a node relative to one of its ancestors. The text
 * length is the same as the length calculated by
 * {@code goog.dom.getNodeTextLength}.
 *
 * @param {Node} node The node whose offset is being calculated.
 * @param {Node=} opt_offsetParent Defaults to the node's owner document's body.
 * @return {number} The text offset.
 */
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * tag name and/or class name. If the passed element matches the specified
 * criteria, the element itself is returned.
 * @param {Node} element The DOM node to start with.
 * @param {?string=} opt_tag The tag name to match (or null/undefined to match
 *     any node regardless of tag name). Must be uppercase (goog.dom.TagName).
 * @param {?string=} opt_class The class name to match (or null/undefined to
 *     match any node regardless of class name).
 * @return {Node} The first ancestor that matches the passed criteria, or
 *     null if none match.
 */
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass =
    goog.dom.getAncestorByTagNameAndClass;


/**
 * Walks up the DOM hierarchy returning the first ancestor that passes the
 * matcher function.
 * @param {Node} element The DOM node to start with.
 * @param {function(Node) : boolean} matcher A function that returns true if the
 *     passed node matches the desired criteria.
 * @param {boolean=} opt_includeNode If true, the node itself is included in
 *     the search (the first call to the matcher will pass startElement as
 *     the node to test).
 * @param {number=} opt_maxSearchSteps Maximum number of levels to search up the
 *     dom.
 * @return {Node} DOM node that matched the matcher, or null if there was
 *     no match.
 */
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;

// Input 10
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2008 Google Inc. All Rights Reserved.

/**
 * @fileoverview File which defines dummy object to work around undefined
 * properties compiler warning for weak dependencies on
 * {@link goog.debug.ErrorHandler#protectEntryPoint}.
 *
 */

goog.provide('goog.debug.errorHandlerWeakDep');

/**
 * Dummy object to work around undefined properties compiler warning.
 * @type {Object}
 */
goog.debug.errorHandlerWeakDep = {
  /**
   * @param {Function} fn An entry point function to be protected.
   * @param {boolean=} opt_tracers Whether to install tracers around the
   *     fn.
   * @return {Function} A protected wrapper function that calls the
   *     entry point function.
   */
  protectEntryPoint: function(fn, opt_tracers) { return fn; }
};

// Input 11
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2005 Google Inc. All Rights Reserved.

/**
 * @fileoverview Implements the disposable interface. The dispose method is used
 * to clean up references and resources.
 */


goog.provide('goog.Disposable');
goog.provide('goog.dispose');


/**
 * Class that provides the basic implementation for disposable objects. If your
 * class holds one or more references to COM objects, DOM nodes, or other
 * disposable objects, it should extend this class or implement the disposable
 * interface.
 * @constructor
 */
goog.Disposable = function() {};


/**
 * Whether the object has been disposed of.
 * @type {boolean}
 * @private
 */
goog.Disposable.prototype.disposed_ = false;


/**
 * @return {boolean} Whether the object has been disposed of.
 */
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_;
};


/**
 * @return {boolean} Whether the object has been disposed of.
 * @deprecated Use {@link #isDisposed} instead.
 */
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;


/**
 * Disposes of the object. If the object hasn't already been disposed of, calls
 * {@link #disposeInternal}. Classes that extend {@code goog.Disposable} should
 * override {@link #disposeInternal} in order to delete references to COM
 * objects, DOM nodes, and other disposable objects.
 */
goog.Disposable.prototype.dispose = function() {
  if (!this.disposed_) {
    // Set disposed_ to true first, in case during the chain of disposal this
    // gets disposed recursively.
    this.disposed_ = true;
    this.disposeInternal();
  }
};


/**
 * Deletes or nulls out any references to COM objects, DOM nodes, or other
 * disposable objects. Classes that extend {@code goog.Disposable} should
 * override this method.  For example:
 * <pre>
 *   mypackage.MyClass = function() {
 *     goog.Disposable.call(this);
 *     // Constructor logic specific to MyClass.
 *     ...
 *   };
 *   goog.inherits(mypackage.MyClass, goog.Disposable);
 *
 *   mypackage.MyClass.prototype.disposeInternal = function() {
 *     mypackage.MyClass.superClass_.disposeInternal.call(this);
 *     // Dispose logic specific to MyClass.
 *     ...
 *   };
 * </pre>
 * @protected
 */
goog.Disposable.prototype.disposeInternal = function() {
  // No-op in the base class.
};


/**
 * Calls {@code dispose} on the argument if it supports it. If obj is not an
 *     object with a dispose() method, this is a no-op.
 * @param {*} obj The object to dispose of.
 */
goog.dispose = function(obj) {
  if (obj && typeof obj.dispose == 'function') {
    obj.dispose();
  }
};

// Input 12
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2005 Google Inc. All Rights Reserved.

/**
 * @fileoverview A base class for event objects.
 *
 */


goog.provide('goog.events.Event');

goog.require('goog.Disposable');


/**
 * A base class for event objects, so that they can support preventDefault and
 * stopPropagation.
 *
 * @param {string} type Event Type.
 * @param {Object=} opt_target Reference to the object that is the target of
 *     this event.
 * @constructor
 * @extends {goog.Disposable}
 */
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);

  /**
   * Event type.
   * @type {string}
   */
  this.type = type;

  /**
   * Target of the event.
   * @type {Object|undefined}
   */
  this.target = opt_target;

  /**
   * Object that had the listener attached.
   * @type {Object|undefined}
   */
  this.currentTarget = this.target;
};
goog.inherits(goog.events.Event, goog.Disposable);


/** @inheritDoc */
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget;
};


/**
 * Whether to cancel the event in internal capture/bubble processing for IE.
 * @type {boolean}
 * @private
 */
goog.events.Event.prototype.propagationStopped_ = false;


/**
 * Return value for in internal capture/bubble processing for IE.
 * @type {boolean}
 * @private
 */
goog.events.Event.prototype.returnValue_ = true;


/**
 * Stops event propagation.
 */
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true;
};


/**
 * Prevents the default action, for example a link redirecting to a url.
 */
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false;
};


/**
 * Stops the propagation of the event. It is equivalent to
 * {@code e.stopPropagation()}, but can be used as the callback argument of
 * {@link goog.events.listen} without declaring another function.
 * @param {!goog.events.Event} e An event.
 */
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation();
};


/**
 * Prevents the default action. It is equivalent to
 * {@code e.preventDefault()}, but can be used as the callback argument of
 * {@link goog.events.listen} without declaring another function.
 * @param {!goog.events.Event} e An event.
 */
goog.events.Event.preventDefault = function(e) {
  e.preventDefault();
};

// Input 13
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2005 Google Inc. All Rights Reserved.

/**
 * @fileoverview A patched, standardized event object for browser events.
 *
 * <pre>
 * The patched event object contains the following members:
 * - type           {string}    Event type, e.g. 'click'
 * - timestamp      {Date}      A date object for when the event was fired
 * - target         {Object}    The element that actually triggered the event
 * - currentTarget  {Object}    The element the listener is attached to
 * - relatedTarget  {Object}    For mouseover and mouseout, the previous object
 * - offsetX        {number}    X-coordinate relative to target
 * - offsetY        {number}    Y-coordinate relative to target
 * - clientX        {number}    X-coordinate relative to viewport
 * - clientY        {number}    Y-coordinate relative to viewport
 * - screenX        {number}    X-coordinate relative to the edge of the screen
 * - screenY        {number}    Y-coordinate relative to the edge of the screen
 * - button         {number}    Mouse button. Use isButton() to test.
 * - keyCode        {number}    Key-code
 * - ctrlKey        {boolean}   Was ctrl key depressed
 * - altKey         {boolean}   Was alt key depressed
 * - shiftKey       {boolean}   Was shift key depressed
 * - metaKey        {boolean}   Was meta key depressed
 *
 * NOTE: The keyCode member contains the raw browser keyCode. For normalized
 * key and character code use {@link goog.events.KeyHandler}.
 * </pre>
 *
 */

goog.provide('goog.events.BrowserEvent');
goog.provide('goog.events.BrowserEvent.MouseButton');

goog.require('goog.events.Event');
goog.require('goog.userAgent');



/**
 * Accepts a browser event object and creates a patched, cross browser event
 * object.
 * The content of this object will not be initialized if no event object is
 * provided. If this is the case, init() needs to be invoked separately.
 * @param {Event=} opt_e Browser event object.
 * @param {Node=} opt_currentTarget Current target for event.
 * @constructor
 * @extends {goog.events.Event}
 */
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
 if (opt_e) {
   this.init(opt_e, opt_currentTarget);
 }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);


/**
 * Normalized button constants for the mouse.
 * @enum {number}
 */
goog.events.BrowserEvent.MouseButton = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
};


/**
 * Static data for mapping mouse buttons.
 * @type {Array.<number>}
 * @private
 */
goog.events.BrowserEvent.IEButtonMap_ = [
  1, // LEFT
  4, // MIDDLE
  2  // RIGHT
];


/**
 * Target that fired the event.
 * @override
 * @type {Node}
 */
goog.events.BrowserEvent.prototype.target = null;


/**
 * Node that had the listener attached.
 * @override
 * @type {Node|undefined}
 */
goog.events.BrowserEvent.prototype.currentTarget;


/**
 * For mouseover and mouseout events, the related object for the event.
 * @type {Node}
 */
goog.events.BrowserEvent.prototype.relatedTarget = null;


/**
 * X-coordinate relative to target.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.offsetX = 0;


/**
 * Y-coordinate relative to target.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.offsetY = 0;


/**
 * X-coordinate relative to the window.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.clientX = 0;


/**
 * Y-coordinate relative to the window.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.clientY = 0;


/**
 * X-coordinate relative to the monitor.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.screenX = 0;


/**
 * Y-coordinate relative to the monitor.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.screenY = 0;


/**
 * Which mouse button was pressed.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.button = 0;


/**
 * Keycode of key press.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.keyCode = 0;


/**
 * Keycode of key press.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.charCode = 0;


/**
 * Whether control was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.ctrlKey = false;


/**
 * Whether alt was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.altKey = false;


/**
 * Whether shift was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.shiftKey = false;


/**
 * Whether the meta key was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.metaKey = false;


/**
 * Whether the deafault platform modifier key was pressed at time of event.
 * (This is control for all platformes except Mac, where it's Meta.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.platformModifierKey = false;


/**
 * The browser event object.
 * @type {Event}
 * @private
 */
goog.events.BrowserEvent.prototype.event_ = null;


/**
 * Accepts a browser event object and creates a patched, cross browser event
 * object.
 * @param {Event} e Browser event object.
 * @param {Node=} opt_currentTarget Current target for event.
 */
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;

  var relatedTarget = /** @type {Node} */ (e.relatedTarget);
  if (relatedTarget) {
    // There's a bug in FireFox where sometimes, relatedTarget will be a
    // chrome element, and accessing any property of it will get a permission
    // denied exception. See:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=497780
    if (goog.userAgent.GECKO) {
      /** @preserveTry */
      try {
        relatedTarget = relatedTarget.nodeName && relatedTarget;
      } catch (err) {
        relatedTarget = null;
      }
    }
    // TODO: Use goog.events.EventType when it has been refactored into its
    // own file.
  } else if (type == 'mouseover') {
    relatedTarget = e.fromElement;
  } else if (type == 'mouseout') {
    relatedTarget = e.toElement;
  }

  this.relatedTarget = relatedTarget;

  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;

  this.button = e.button;

  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == 'keypress' ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_;
};

/**
 * Tests to see which button was pressed during the event. This is really only
 * useful in IE and Gecko browsers. And in IE, it's only useful for
 * mousedown/mouseup events, because click only fires for the left mouse button.
 *
 * Safari 2 only reports the left button being clicked, and uses the value '1'
 * instead of 0. Opera only reports a mousedown event for the middle button, and
 * no mouse events for the right button. Opera has default behavior for left and
 * middle click that can only be overridden via a configuration setting.
 *
 * There's a nice table of this mess at http://www.unixpapa.com/js/mouse.html.
 *
 * @param {goog.events.BrowserEvent.MouseButton} button The button
 *     to test for.
 * @return {boolean} True if button was pressed.
 */
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if (goog.userAgent.IE) {
    if (this.type == 'click') {
      return button == goog.events.BrowserEvent.MouseButton.LEFT;
    } else {
      return !!(this.event_.button &
          goog.events.BrowserEvent.IEButtonMap_[button]);
    }
  } else {
    return this.event_.button == button;
  }
};


/**
 * @inheritDoc
 */
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  this.propagationStopped_ = true;
  if (this.event_.stopPropagation) {
    this.event_.stopPropagation();
  } else {
    this.event_.cancelBubble = true;
  }
};


/**
 * To prevent default in IE7 for certain keydown events we need set the keyCode
 * to -1.
 * @type {boolean}
 * @private
 */
goog.events.BrowserEvent.IE7_SET_KEY_CODE_TO_PREVENT_DEFAULT_ =
    goog.userAgent.IE && !goog.userAgent.isVersion('8')


/**
 * @inheritDoc
 */
goog.events.BrowserEvent.prototype.preventDefault = function() {
  this.returnValue_ = false;
  var be = this.event_;
  if (!be.preventDefault) {
    be.returnValue = false;
    if (goog.events.BrowserEvent.IE7_SET_KEY_CODE_TO_PREVENT_DEFAULT_) {
      /** @preserveTry */
      try {
        // Most keys can be prevented using returnValue, just like in IE8 but
        // some special keys require setting the keyCode to -1 as well:
        //
        // F3, F5, F10, F11, Ctrl+P, Crtl+O, Ctrl+F (these are taken from IE6)
        //
        // We therefore do this for all function keys as well as when Ctrl key
        // is pressed.
        var VK_F1 = 112;
        var VK_F12 = 123;
        if (be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1;
        }
      } catch (ex) {
        // IE throws an 'access denied' exception when trying to change
        // keyCode in some situations (e.g. srcElement is input[type=file],
        // or srcElement is an anchor tag rewritten by parent's innerHTML).
        // Do nothing in this case.
      }
    }
  } else {
    be.preventDefault();
  }
};


/**
 * @return {Event} The underlying browser event object.
 */
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_;
};


/**
 * @inheritDoc
 */
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null;
};

// Input 14
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2009 Google Inc. All Rights Reserved.

/**
 * @fileoverview Definition of the goog.events.EventWrapper interface.
 *
 */

goog.provide('goog.events.EventWrapper');


/**
 * Interface for event wrappers.
 * @interface
 */
goog.events.EventWrapper = function() {
};


/**
 * Adds an event listener using the wrapper on a DOM Node or an object that has
 * implemented {@link goog.events.EventTarget}. A listener can only be added
 * once to an object.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_scope Element in whose scope to call the listener.
 * @param {goog.events.EventHandler=} opt_eventHandler Event handler to add
 *     listener to.
 */
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt,
    opt_scope, opt_eventHandler) {
};


/**
 * Removes an event listener added using goog.events.EventWrapper.listen.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to remove listener
 *    from.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_scope Element in whose scope to call the listener.
 * @param {goog.events.EventHandler=} opt_eventHandler Event handler to remove
 *     listener from.
 */
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt,
    opt_scope, opt_eventHandler) {
};

// Input 15
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2005 Google Inc. All Rights Reserved.

/**
 * @fileoverview Listener object.
 * @see ../demos/events.html
 */

/**
 * Namespace for events
 */
goog.provide('goog.events.Listener');

/**
 * Simple class that stores information about a listener
 * @constructor
 */
goog.events.Listener = function() {
};


/**
 * Counter used to create a unique key
 * @type {number}
 * @private
 */
goog.events.Listener.counter_ = 0;


/**
 * Whether the listener is a function or an object that implements handleEvent.
 * @type {boolean}
 * @private
 */
goog.events.Listener.prototype.isFunctionListener_;


/**
 * Call back function or an object with a handleEvent function.
 * @type {Function|Object|null}
 */
goog.events.Listener.prototype.listener;


/**
 * Proxy for callback that passes through {@link goog.events#HandleEvent_}
 * @type {Function}
 */
goog.events.Listener.prototype.proxy;


/**
 * Object or node that callback is listening to
 * @type {Object|goog.events.EventTarget}
 */
goog.events.Listener.prototype.src;


/**
 * Type of event
 * @type {string}
 */
goog.events.Listener.prototype.type;


/**
 * Whether the listener is being called in the capture or bubble phase
 * @type {boolean}
 */
goog.events.Listener.prototype.capture;


/**
 * Optional object whose context to execute the listener in
 * @type {Object|undefined}
 */
goog.events.Listener.prototype.handler;


/**
 * The key of the listener.
 * @type {number}
 */
goog.events.Listener.prototype.key = 0;


/**
 * Whether the listener has been removed.
 * @type {boolean}
 */
goog.events.Listener.prototype.removed = false;


/**
 * Whether to remove the listener after it has been called.
 * @type {boolean}
 */
goog.events.Listener.prototype.callOnce = false;


/**
 * Initializes the listener.
 * @param {Function|Object} listener Callback function, or an object with a
 *     handleEvent function.
 * @param {Function} proxy Wrapper for the listener that patches the event.
 * @param {Object} src Source object for the event.
 * @param {string} type Event type.
 * @param {boolean} capture Whether in capture or bubble phase.
 * @param {Object=} opt_handler Object in whose context to execute the callback.
 */
goog.events.Listener.prototype.init = function(listener, proxy, src, type,
                                               capture, opt_handler) {
  // we do the test of the listener here so that we do  not need to
  // continiously do this inside handleEvent
  if (goog.isFunction(listener)) {
    this.isFunctionListener_ = true;
  } else if (listener && listener.handleEvent &&
      goog.isFunction(listener.handleEvent)) {
    this.isFunctionListener_ = false;
  } else {
    throw Error('Invalid listener argument');
  }

  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false;
};


/**
 * Calls the internal listener
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} The result of the internal listener call.
 */
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if (this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject);
  }
  return this.listener.handleEvent.call(this.listener, eventObject);
};

// Input 16
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2007 Google Inc. All Rights Reserved.

/**
 * @fileoverview Datastructure: Pool.
 *
 *
 * A generic class for handling pools of objects that is more efficient than
 * goog.structs.Pool because it doesn't maintain a list of objects that are in
 * use. See constructor comment.
 */


goog.provide('goog.structs.SimplePool');

goog.require('goog.Disposable');


/**
 * A generic pool class. Simpler and more efficient than goog.structs.Pool
 * because it doesn't maintain a list of objects that are in use. This class
 * has constant overhead and doesn't create any additional objects as part of
 * the pool management after construction time.
 *
 * IMPORTANT: If the objects being pooled are arrays or maps that can have
 * unlimited number of properties, they need to be cleaned before being
 * returned to the pool.
 *
 * Also note that {@see goog.object.clean} actually allocates an array to clean
 * the object passed to it, so simply using this function would defy the
 * purpose of using the pool.
 *
 * @param {number} initialCount Initial number of objects to populate the
 *     free pool at construction time.
 * @param {number} maxCount Maximum number of objects to keep in the free pool.
 * @constructor
 * @extends {goog.Disposable}
 *
 */
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);

  /**
   * Maximum number of objects allowed
   * @type {number}
   * @private
   */
  this.maxCount_ = maxCount;

  /**
   * Queue used to store objects that are currently in the pool and available
   * to be used.
   * @type {Array}
   * @private
   */
  this.freeQueue_ = [];

  this.createInitial_(initialCount);
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);


/**
 * Function for overriding createObject. The avoids a common case requiring
 * subclassing this class.
 * @type {Function}
 * @private
 */
goog.structs.SimplePool.prototype.createObjectFn_ = null;


/**
 * Function for overriding disposeObject. The avoids a common case requiring
 * subclassing this class.
 * @type {Function}
 * @private
 */
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;


/**
 * Sets the {@code createObject} function which is used for creating a new
 * object in the pool.
 * @param {Function} createObjectFn Create object function which returns the
 *     newly createrd object.
 */
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn;
};


/**
 * Sets the {@code disposeObject} function which is used for disposing of an
 * object in the pool.
 * @param {Function} disposeObjectFn Dispose object function which takes the
 *     object to dispose as a parameter.
 */
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(
    disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn;
};


/**
 * Gets a new object from the the pool, if there is one available, otherwise
 * returns null.
 * @return {Object} An object from the pool or a new one if necessary.
 */
goog.structs.SimplePool.prototype.getObject = function() {
  if (this.freeQueue_.length) {
    return this.freeQueue_.pop();
  }
  return this.createObject();
};


/**
 * Releases the space in the pool held by a given object -- i.e., remove it from
 * the pool and frees up its space.
 * @param {Object} obj The object to release.
 */
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if (this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj);
  } else {
    this.disposeObject(obj);
  }
};


/**
 * Populates the pool with initialCount objects.
 * @param {number} initialCount The number of objects to add to the pool.
 * @private
 */
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if (initialCount > this.maxCount_) {
    throw Error('[goog.structs.SimplePool] Initial cannot be greater than max');
  }
  for (var i = 0; i < initialCount; i++) {
    this.freeQueue_.push(this.createObject());
  }
};


/**
 * Should be overriden by sub-classes to return an instance of the object type
 * that is expected in the pool.
 * @return {Object} The created object.
 */
goog.structs.SimplePool.prototype.createObject = function() {
  if (this.createObjectFn_) {
    return this.createObjectFn_();
  } else {
    return {};
  }
};


/**
 * Should be overriden to dispose of an object. Default implementation is to
 * remove all of the object's members, which should render it useless. Calls the
 *  object's dispose method, if available.
 * @param {Object} obj The object to dispose.
 */
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if (this.disposeObjectFn_) {
    this.disposeObjectFn_(obj);
  } else {
    if (goog.isFunction(obj.dispose)) {
      obj.dispose();
    } else {
      for (var i in obj) {
        delete obj[i];
      }
    }
  }
};


/**
 * Disposes of the pool and all objects currently held in the pool.
 */
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  // Call disposeObject on each object held by the pool.
  var freeQueue = this.freeQueue_;
  while (freeQueue.length) {
    this.disposeObject(freeQueue.pop());
  }
  delete this.freeQueue_;
};

// Input 17
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2007 Google Inc. All Rights Reserved.

/**
 * @fileoverview Detection of JScript version.
 *
 */


goog.provide('goog.userAgent.jscript');

goog.require('goog.string');


/**
 * @define {boolean} True if it is known at compile time that the runtime
 *     environment will not be using JScript.
 */
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;


/**
 * Initializer for goog.userAgent.jscript.  Detects if the user agent is using
 * Microsoft JScript and which version of it.
 *
 * This is a named function so that it can be stripped via the jscompiler
 * option for stripping types.
 * @private
 */
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = 'ScriptEngine' in goog.global;

  /**
   * @type {boolean}
   * @private
   */
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ =
      hasScriptEngine && goog.global['ScriptEngine']() == 'JScript';

  /**
   * @type {string}
   * @private
   */
  goog.userAgent.jscript.DETECTED_VERSION_ =
      goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ?
      (goog.global['ScriptEngineMajorVersion']() + '.' +
       goog.global['ScriptEngineMinorVersion']() + '.' +
       goog.global['ScriptEngineBuildVersion']()) :
      '0';
};

if (!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_();
}

/**
 * Whether we detect that the user agent is using Microsoft JScript.
 * @type {boolean}
 */
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ?
    false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;


/**
 * The installed version of JScript.
 * @type {string}
 */
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ?
    '0' : goog.userAgent.jscript.DETECTED_VERSION_;


/**
 * Whether the installed version of JScript is as new or newer than a given
 * version.
 * @param {string} version The version to check.
 * @return {boolean} Whether the installed version of JScript is as new or
 *     newer than the given version.
 */
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION,
                                     version) >= 0;
};

// Input 18
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2005 Google Inc. All Rights Reserved

/**
 * @fileoverview Helper object to manage the event system pools. This should not
 * be used by itself and there should be no reason for you to depend on this
 * library.
 *
 * JScript 5.6 has some serious issues with GC so we use object pools to reduce
 * the number of object allocations.
 *
 */

goog.provide('goog.events.pools');


goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Listener');
goog.require('goog.structs.SimplePool');
goog.require('goog.userAgent.jscript');


/**
 * Helper function for returning an object that is used for the lookup trees.
 * This might use an object pool depending on the script engine.
 * @return { {count_: number, remaining_: number} } A new or reused object.
 */
goog.events.pools.getObject;


/**
 * Helper function for releasing an object that was returned by
 * {@code goog.events.pools.getObject}. In case an object pool was used the
 * object is returned to the pool.
 * @param { {count_: number, remaining_: number} } obj The object to release.
 */
goog.events.pools.releaseObject;


/**
 * Helper function for returning an array.
 * This might use an object pool depending on the script engine.
 * @return {Array} A new or reused array.
 */
goog.events.pools.getArray;


/**
 * Helper function for releasing an array that was returned by
 * {@code goog.events.pools.getArray}. In case an object pool was used the
 * array is returned to the pool.
 * @param {Array} arr The array to release.
 */
goog.events.pools.releaseArray;


/**
 * Helper function for returning a proxy function as needed by
 * {@code goog.events}. This might use an object pool depending on the script
 * engine.
 * @return {Function} A new or reused function object.
 */
goog.events.pools.getProxy;


/**
 * Sets the callback function to use in the proxy.
 * @param {Function} cb The callback function to use.
 */
goog.events.pools.setProxyCallbackFunction;


/**
 * Helper function for releasing a function that was returned by
 * {@code goog.events.pools.getProxy}. In case an object pool was used the
 * function is returned to the pool.
 * @param {Function} f The function to release.
 */
goog.events.pools.releaseProxy;


/**
 * Helper function for returning a listener object as needed by
 * {@code goog.events}. This might use an object pool depending on the script
 * engine.
 * @return {goog.events.Listener} A new or reused listener object.
 */
goog.events.pools.getListener;


/**
 * Helper function for releasing a listener object that was returned by
 * {@code goog.events.pools.getListener}. In case an object pool was used the
 * listener object is returned to the pool.
 * @param {goog.events.Listener} listener The listener object to release.
 */
goog.events.pools.releaseListener;


/**
 * Helper function for returning a {@code goog.events.BrowserEvent} object as
 * needed by {@code goog.events}. This might use an object pool depending on the
 * script engine.
 * @return {!goog.events.BrowserEvent} A new or reused event object.
 */
goog.events.pools.getEvent;


/**
 * Helper function for releasing a browser event object that was returned by
 * {@code goog.events.pools.getEvent}. In case an object pool was used the
 * browser event object is returned to the pool.
 * @param {goog.events.BrowserEvent} event The event object to release.
 */
goog.events.pools.releaseEvent;


(function() {
  var BAD_GC = goog.userAgent.jscript.HAS_JSCRIPT &&
      !goog.userAgent.jscript.isVersion('5.7');

  // These functions are shared between the pools' createObject functions and
  // the non pooled versions.

  function getObject() {
    return {count_: 0, remaining_: 0};
  }

  function getArray() {
    return [];
  }

  /**
   * This gets set to {@code goog.events.handleBrowserEvent_} by events.js.
   * @type {function(string, (Event|undefined))}
   */
  var proxyCallbackFunction;

  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb;
  };

  function getProxy() {
    // Use a local var f to prevent one allocation.
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject);
    };
    return f;
  }

  function getListener() {
    return new goog.events.Listener();
  }

  function getEvent() {
    return new goog.events.BrowserEvent();
  }

  if (!BAD_GC) {

    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;

    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;

    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;

    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;

    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction;

  } else {

    goog.events.pools.getObject = function() {
      return objectPool.getObject();
    };

    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj);
    };

    goog.events.pools.getArray = function() {
      return /** @type {Array} */ (arrayPool.getObject());
    };

    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj);
    };

    goog.events.pools.getProxy = function() {
      return /** @type {Function} */ (proxyPool.getObject());
    };

    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy());
    };

    goog.events.pools.getListener = function() {
      return /** @type {goog.events.Listener} */ (
          listenerPool.getObject());
    };

    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj);
    };

    goog.events.pools.getEvent = function() {
      return /** @type {goog.events.BrowserEvent} */ (eventPool.getObject());
    };

    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj);
    };

    /**
     * Initial count for the objectPool
     */
    var OBJECT_POOL_INITIAL_COUNT = 0;


    /**
     * Max count for the objectPool_
     */
    var OBJECT_POOL_MAX_COUNT = 600;


    /**
     * SimplePool to cache the lookup objects. This was implemented to make IE6
     * performance better and removed an object allocation in goog.events.listen
     * when in steady state.
     */
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT,
                                                 OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);


    /**
     * Initial count for the arrayPool
     */
    var ARRAY_POOL_INITIAL_COUNT = 0;


    /**
     * Max count for the arrayPool
     */
    var ARRAY_POOL_MAX_COUNT = 600;


    /**
     * SimplePool to cache the type arrays. This was implemented to make IE6
     * performance better and removed an object allocation in goog.events.listen
     * when in steady state.
     * @type {goog.structs.SimplePool}
     */
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT,
                                                ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);


    /**
     * Initial count for the proxyPool
     */
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;


    /**
     * Max count for the proxyPool
     */
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;


    /**
     * SimplePool to cache the handle event proxy. This was implemented to make
     * IE6 performance better and removed an object allocation in
     * goog.events.listen when in steady state.
     */
    var proxyPool = new goog.structs.SimplePool(
        HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT,
        HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);


    /**
     * Initial count for the listenerPool
     */
    var LISTENER_POOL_INITIAL_COUNT = 0;


    /**
     * Max count for the listenerPool
     */
    var LISTENER_POOL_MAX_COUNT = 600;


    /**
     * SimplePool to cache the listener objects. This was implemented to make
     * IE6 performance better and removed an object allocation in
     * goog.events.listen when in steady state.
     */
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT,
                                                   LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);


    /**
     * Initial count for the eventPool
     */
    var EVENT_POOL_INITIAL_COUNT = 0;


    /**
     * Max count for the eventPool
     */
    var EVENT_POOL_MAX_COUNT = 600;


    /**
     * SimplePool to cache the event objects. This was implemented to make IE6
     * performance better and removed an object allocation in
     * goog.events.handleBrowserEvent_ when in steady state.
     * This pool is only used for IE events.
     */
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT,
                                                EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent);
  }
})();

// Input 19
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2005 Google Inc. All Rights Reserved.

/**
 * @fileoverview Event Manager.
 *
 * Provides an abstracted interface to the browsers' event
 * systems. This uses an indirect lookup of listener functions to avoid circular
 * references between DOM (in IE) or XPCOM (in Mozilla) objects which leak
 * memory. This makes it easier to write OO Javascript/DOM code.
 *
 * It simulates capture & bubble in Internet Explorer.
 *
 * The listeners will also automagically have their event objects patched, so
 * your handlers don't need to worry about the browser.
 *
 * Example usage:
 * <pre>
 * goog.events.listen(myNode, 'click', function(e) { alert('woo') });
 * goog.events.listen(myNode, 'mouseover', mouseHandler, true);
 * goog.events.unlisten(myNode, 'mouseover', mouseHandler, true);
 * goog.events.removeAll(myNode);
 * goog.events.removeAll();
 * </pre>
 *
 *                                            in IE and event object patching]
 *
 * @supported IE6+, FF1.5+, WebKit, Opera.
 * @see ../demos/events.html
 * @see ../demos/event-propagation.html
 * @see ../demos/stopevent.html
 */


// This uses 3 lookup tables/trees.
// listenerTree_ is a tree of type -> capture -> src hash code -> [Listener]
// listeners_ is a map of key -> [Listener]
//
// The key is a field of the Listener. The Listener class also has the type,
// capture and the src so one can always trace back in the tree
//
// sources_: src hc -> [Listener]


goog.provide('goog.events');
goog.provide('goog.events.EventType');

goog.require('goog.array');
goog.require('goog.debug.errorHandlerWeakDep');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Event');
goog.require('goog.events.EventWrapper');
goog.require('goog.events.pools');
goog.require('goog.object');
goog.require('goog.userAgent');



/**
 * Container for storing event listeners and their proxies
 * @private
 * @type {Object.<goog.events.Listener>}
 */
goog.events.listeners_ = {};


/**
 * The root of the listener tree
 * @private
 * @type {Object}
 */
goog.events.listenerTree_ = {};


/**
 * Lookup for mapping source hash codes to listeners
 * @private
 * @type {Object}
 */
goog.events.sources_ = {};


/**
 * String used to prepend to IE event types.  Not a constant so that it is not
 * inlined.
 * @type {string}
 * @private
 */
goog.events.onString_ = 'on';


/**
 * Map of computed on strings for IE event types. Caching this removes an extra
 * object allocation in goog.events.listen which improves IE6 performance.
 * @type {Object}
 * @private
 */
goog.events.onStringMap_ = {};

/**
 * Separator used to split up the various parts of an event key, to help avoid
 * the possibilities of collisions.
 * @type {string}
 * @private
 */
goog.events.keySeparator_ = '_';


/**
 * Adds an event listener for a specific event on a DOM Node or an object that
 * has implemented {@link goog.events.EventTarget}. A listener can only be
 * added once to an object and if it is added again the key for the listener
 * is returned.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {string|Array.<string>} type Event type or array of event types.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?number} Unique key for the listener.
 */
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if (!type) {
    throw Error('Invalid event type');
  } else if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listen(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  } else {
    var capture = !!opt_capt;
    var map = goog.events.listenerTree_;

    if (!(type in map)) {
      map[type] = goog.events.pools.getObject();
    }
    map = map[type];

    if (!(capture in map)) {
      map[capture] = goog.events.pools.getObject();
      map.count_++;
    }
    map = map[capture];

    var srcHashCode = goog.getHashCode(src);
    var listenerArray, listenerObj;

    // The remaining_ property is used to be able to short circuit the iteration
    // of the event listeners.
    //
    // Increment the remaining event listeners to call even if this event might
    // already have been fired. At this point we do not know if the event has
    // been fired and it is too expensive to find out. By incrementing it we are
    // guaranteed that we will not skip any event listeners.
    map.remaining_++;

    // Do not use srcHashCode in map here since that will cast the number to a
    // string which will allocate one string object.
    if (!map[srcHashCode]) {
      listenerArray = map[srcHashCode] = goog.events.pools.getArray();
      map.count_++;
    } else {
      listenerArray = map[srcHashCode];
      // Ensure that the listeners do not already contain the current listener
      for (var i = 0; i < listenerArray.length; i++) {
        listenerObj = listenerArray[i];
        if (listenerObj.listener == listener &&
            listenerObj.handler == opt_handler) {

          // If this listener has been removed we should not return its key. It
          // is OK that we create new listenerObj below since the removed one
          // will be cleaned up later.
          if (listenerObj.removed) {
            break;
          }

          // We already have this listener. Return its key.
          return listenerArray[i].key;
        }
      }
    }

    var proxy = goog.events.pools.getProxy();
    proxy.src = src;
    listenerObj = goog.events.pools.getListener();
    listenerObj.init(listener, proxy, src, type, capture, opt_handler);
    var key = listenerObj.key;
    proxy.key = key;

    listenerArray.push(listenerObj);
    goog.events.listeners_[key] = listenerObj;

    if (!goog.events.sources_[srcHashCode]) {
      goog.events.sources_[srcHashCode] = goog.events.pools.getArray();
    }
    goog.events.sources_[srcHashCode].push(listenerObj);


    // Attach the proxy through the browser's API
    if (src.addEventListener) {
      if (src == goog.global || !src.customEvent_) {
        src.addEventListener(type, proxy, capture);
      }
    } else {
      // The else above used to be else if (src.attachEvent) and then there was
      // another else statement that threw an exception warning the developer
      // they made a mistake. This resulted in an extra object allocation in IE6
      // due to a wrapper object that had to be implemented around the element
      // and so was removed.
      src.attachEvent(goog.events.getOnString_(type), proxy);
    }

    return key;
  }
};


/**
 * Adds an event listener for a specific event on a DomNode or an object that
 * has implemented {@link goog.events.EventTarget}. After the event has fired
 * the event listener is removed from the target.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {string|Array.<string>} type Event type or array of event types.
 * @param {Function|Object} listener Callback method.
 * @param {boolean=} opt_capt Fire in capture phase?.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?number} Unique key for the listener.
 */
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }

  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key;
};


/**
 * Adds an event listener with a specific event wrapper on a DOM Node or an
 * object that has implemented {@link goog.events.EventTarget}. A listener can
 * only be added once to an object.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 */
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt,
    opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler);
};


/**
 * Removes an event listener which was added with listen().
 *
 * @param {EventTarget|goog.events.EventTarget} src The target to stop
 *     listening to events on.
 * @param {string|Array.<string>} type The name of the event without the 'on'
 *     prefix.
 * @param {Function|Object} listener The listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase of the
 *     event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?boolean} indicating whether the listener was there to remove.
 */
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }

  var capture = !!opt_capt;

  var listenerArray = goog.events.getListeners_(src, type, capture);
  if (!listenerArray) {
    return false;
  }

  for (var i = 0; i < listenerArray.length; i++) {
    if (listenerArray[i].listener == listener &&
        listenerArray[i].capture == capture &&
        listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key);
    }
  }

  return false;
};


/**
 * Removes an event listener which was added with listen() by the key
 * returned by listen().
 *
 * @param {?number} key The key returned by listen() for this event listener.
 * @return {boolean} indicating whether the listener was there to remove.
 */
goog.events.unlistenByKey = function(key) {
  // Do not use key in listeners here since that will cast the number to a
  // string which will allocate one string object.
  if (!goog.events.listeners_[key]) {
    return false;
  }
  var listener = goog.events.listeners_[key];

  if (listener.removed) {
    return false;
  }

  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;

  if (src.removeEventListener) {
    // EventTarget calls unlisten so we need to ensure that the source is not
    // an event target to prevent re-entry.
    // TODO: What is this goog.global for? Why would anyone listen to
    // events on the [[Global]] object? Is it supposed to be window? Why would
    // we not want to allow removing event listeners on the window?
    if (src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture);
    }
  } else if (src.detachEvent) {
    src.detachEvent(goog.events.getOnString_(type), proxy);
  }

  var srcHashCode = goog.getHashCode(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcHashCode];

  // In a perfect implementation we would decrement the remaining_ field here
  // but then we would need to know if the listener has already been fired or
  // not. We therefore skip doing this and in this uncommon case the entire
  // ancestor chain will need to be traversed as before.

  // Remove from sources_
  if (goog.events.sources_[srcHashCode]) {
    var sourcesArray = goog.events.sources_[srcHashCode];
    goog.array.remove(sourcesArray, listener);
    if (sourcesArray.length == 0) {
      delete goog.events.sources_[srcHashCode];
    }
  }

  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcHashCode, listenerArray);

  delete goog.events.listeners_[key];

  return true;
};


/**
 * Removes an event listener which was added with listenWithWrapper().
 *
 * @param {EventTarget|goog.events.EventTarget} src The target to stop
 *     listening to events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {Function|Object} listener The listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase of the
 *     event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 */
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt,
    opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler);
};


/**
 * Cleans up the listener array as well as the listener tree
 * @param {string} type  The type of the event.
 * @param {boolean} capture Whether to clean up capture phase listeners instead
 *     bubble phase listeners.
 * @param {number} srcHashCode  The hash code of the source.
 * @param {Array.<goog.events.Listener>} listenerArray The array being cleaned.
 * @private
 */
goog.events.cleanUp_ = function(type, capture, srcHashCode, listenerArray) {
  // The listener array gets locked during the dispatch phase so that removals
  // of listeners during this phase does not screw up the indeces. This method
  // is called after we have removed a listener as well as after the dispatch
  // phase in case any listeners were removed.
  if (!listenerArray.locked_) { // catches both 0 and not set
    if (listenerArray.needsCleanup_) {
      // Loop over the listener array and remove listeners that have removed set
      // to true. This could have been done with filter or something similar but
      // we want to change the array in place and we want to minimize
      // allocations. Adding a listener during this phase adds to the end of the
      // array so that works fine as long as the length is rechecked every in
      // iteration.
      for (var oldIndex = 0, newIndex = 0;
           oldIndex < listenerArray.length;
           oldIndex++) {
        if (listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue;
        }
        if (oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex];
        }
        newIndex++;
      }
      listenerArray.length = newIndex;

      listenerArray.needsCleanup_ = false;

      // In case the length is now zero we release the object.
      if (newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcHashCode];
        goog.events.listenerTree_[type][capture].count_--;

        if (goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(
              goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--;
        }

        if (goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type];
        }
      }

    }
  }
};


/**
 * Removes all listeners from an object, if no object is specified it will
 * remove all listeners that have been registered.  You can also optionally
 * remove listeners of a particular type or capture phase.
 *
 * @param {Object=} opt_obj Object to remove listeners from.
 * @param {string=} opt_type Type of event to, default is all types.
 * @param {boolean=} opt_capt Whether to remove the listeners from the capture
 *     or bubble phase.  If unspecified, will remove both.
 * @return {number} Number of listeners removed.
 */
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;

  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;

  if (!noObj) {
    var srcHashCode = goog.getHashCode(/** @type {Object} */ (opt_obj));
    if (goog.events.sources_[srcHashCode]) {
      var sourcesArray = goog.events.sources_[srcHashCode];
      for (var i = sourcesArray.length - 1; i >= 0; i--) {
        var listener = sourcesArray[i];
        if ((noType || opt_type == listener.type) &&
            (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++;
        }
      }
    }
  } else {
    // Loop over the sources_ map instead of over the listeners_ since it is
    // smaller which results in fewer allocations.
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for (var i = listeners.length - 1; i >= 0; i--) {
        var listener = listeners[i];
        if ((noType || opt_type == listener.type) &&
            (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++;
        }
      }
    });
  }

  return count;
};


/**
 * Gets the listeners for a given object, type and capture phase.
 *
 * @param {Object} obj Object to get listeners for.
 * @param {string} type Event type.
 * @param {boolean} capture Capture phase?.
 * @return {Array.<goog.events.Listener>} Array of listener objects.
 */
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || [];
};


/**
 * Gets the listeners for a given object, type and capture phase.
 *
 * @param {Object} obj Object to get listeners for.
 * @param {?string} type Event type.
 * @param {boolean} capture Capture phase?.
 * @return {Array.<goog.events.Listener>?} Array of listener objects.
 *     Returns null if object has no lsiteners of that type.
 * @private
 */
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if (type in map) {
    map = map[type];
    if (capture in map) {
      map = map[capture];
      var objHashCode = goog.getHashCode(obj);
      if (map[objHashCode]) {
        return map[objHashCode];
      }
    }
  }

  return null;
};


/**
 * Gets the goog.events.Listener for the event or null if no such listener is
 * in use.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to stop
 *     listening to events on.
 * @param {?string} type The name of the event without the 'on' prefix.
 * @param {Function|Object} listener The listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *                            whether the listener is fired during the
 *                            capture or bubble phase of the event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.Listener?} the found listener or null if not found.
 */
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if (listenerArray) {
    for (var i = 0; i < listenerArray.length; i++) {
      if (listenerArray[i].listener == listener &&
          listenerArray[i].capture == capture &&
          listenerArray[i].handler == opt_handler) {
        // We already have this listener. Return its key.
        return listenerArray[i];
      }
    }
  }
  return null;
};


/**
 * Returns whether an event target has any active listeners matching the
 * specified signature. If either the type or capture parameters are
 * unspecified, the function will match on the remaining criteria.
 *
 * @param {EventTarget|goog.events.EventTarget} obj Target to get listeners for.
 * @param {string=} opt_type Event type.
 * @param {boolean=} opt_capture Whether to check for capture or bubble-phase
 *     listeners.
 * @return {boolean} Whether an event target has one or more listeners matching
 *     the requested type and/or capture phase.
 */
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objHashCode = goog.getHashCode(obj)
  var listeners = goog.events.sources_[objHashCode];

  if (listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);

    if (hasType && hasCapture) {
      // Lookup in the listener tree whether the specified listener exists.
      var map = goog.events.listenerTree_[opt_type]
      return !!map && !!map[opt_capture] && objHashCode in map[opt_capture];

    } else if (!(hasType || hasCapture)) {
      // Simple check for whether the event target has any listeners at all.
      return true;

    } else {
      // Iterate through the listeners for the event target to find a match.
      return goog.array.some(listeners, function(listener) {
          return (hasType && listener.type == opt_type) ||
            (hasCapture && listener.capture == opt_capture);
      });
    }
  }

  return false;
};


/**
 * Provides a nice string showing the normalized event objects public members
 * @param {Object} e Event Object.
 * @return {string} String of the public members of the normalized event object.
 */
goog.events.expose = function(e) {
  var str = [];
  for (var key in e) {
    if (e[key] && e[key].id) {
      str.push(key + ' = ' + e[key] + ' (' + e[key].id + ')');
    } else {
      str.push(key + ' = ' + e[key]);
    }
  }
  return str.join('\n');
};


/**
 * Constants for event names.
 * @enum {string}
 */
// TODO: Move to its own file.
goog.events.EventType = {
  // Mouse events
  CLICK: 'click',
  DBLCLICK: 'dblclick',
  MOUSEDOWN: 'mousedown',
  MOUSEUP: 'mouseup',
  MOUSEOVER: 'mouseover',
  MOUSEOUT: 'mouseout',
  MOUSEMOVE: 'mousemove',
  SELECTSTART: 'selectstart', // IE, Safari, Chrome

  // Key events
  KEYPRESS: 'keypress',
  KEYDOWN: 'keydown',
  KEYUP: 'keyup',

  // Focus
  BLUR: 'blur',
  FOCUS: 'focus',
  DEACTIVATE: 'deactivate', // IE only
  // TODO: Test these. I experienced problems with DOMFocusIn, the event
  // just wasn't firing.
  FOCUSIN: goog.userAgent.IE ? 'focusin' : 'DOMFocusIn',
  FOCUSOUT: goog.userAgent.IE ? 'focusout' : 'DOMFocusOut',

  // Forms
  CHANGE: 'change',
  SELECT: 'select',
  SUBMIT: 'submit',

  // Misc
  CONTEXTMENU: 'contextmenu',
  DRAGSTART: 'dragstart',
  ERROR: 'error',
  HASHCHANGE: 'hashchange',
  HELP: 'help',
  LOAD: 'load',
  LOSECAPTURE: 'losecapture',
  READYSTATECHANGE: 'readystatechange',
  RESIZE: 'resize',
  SCROLL: 'scroll',
  UNLOAD: 'unload'
};


/**
 * Returns a string wth on prepended to the specified type. This is used for IE
 * which expects "on" to be prepended. This function caches the string in order
 * to avoid extra allocations in steady state.
 * @param {string} type Event type strng.
 * @return {string} The type string with 'on' prepended.
 * @private
 */
goog.events.getOnString_ = function(type) {
  if (type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type];
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type;
};


/**
 * Fires an object's listeners of a particular type and phase
 *
 * @param {Object} obj Object whose listeners to call.
 * @param {string} type Event type.
 * @param {boolean} capture Which event phase.
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} True if all listeners returned true else false.
 */
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if (type in map) {
    map = map[type];
    if (capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type,
                                        capture, eventObject);
    }
  }
  return true;
};


/**
 * Fires an object's listeners of a particular type and phase.
 *
 * @param {Object} map Object with listeners in it.
 * @param {Object} obj Object whose listeners to call.
 * @param {string} type Event type.
 * @param {boolean} capture Which event phase.
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} True if all listeners returned true else false.
 * @private
 */
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;

  var objHashCode = goog.getHashCode(obj);
  if (map[objHashCode]) {
    map.remaining_--;
    var listenerArray = map[objHashCode];

    // If locked_ is not set (and if already 0) initialize it to 1.
    if (!listenerArray.locked_) {
      listenerArray.locked_ = 1;
    } else {
      listenerArray.locked_++;
    }

    try {
      // Events added in the dispatch phase should not be dispatched in
      // the current dispatch phase. They will be included in the next
      // dispatch phase though.
      var length = listenerArray.length;
      for (var i = 0; i < length; i++) {
        var listener = listenerArray[i];
        // We might not have a listener if the listener was removed.
        if (listener && !listener.removed) {
          retval &=
              goog.events.fireListener(listener, eventObject) !== false;
        }
      }
    } finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objHashCode, listenerArray);
    }
  }

  return Boolean(retval);
};


/**
 * Fires a listener with a set of arguments
 *
 * @param {goog.events.Listener} listener The listener object to call.
 * @param {Object} eventObject The event object to pass to the listener.
 * @return {boolean} Result of listener.
 */
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if (listener.callOnce) {
    goog.events.unlistenByKey(listener.key);
  }
  return rv;
};


/**
 * Gets the total number of listeners currently in the system.
 * @return {number} Number of listeners.
 */
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_);
};


/**
 * Dispatches an event (or event like object) and calls all listeners
 * listening for events of this type. The type of the event is decided by the
 * type property on the event object.
 *
 * If any of the listeners returns false OR calls preventDefault then this
 * function will return false.  If one of the capture listeners calls
 * stopPropagation, then the bubble listeners won't fire.
 *
 * @param {goog.events.EventTarget} src  The event target.
 * @param {string|Object|goog.events.Event} e Event object.
 * @return {boolean} If anyone called preventDefault on the event object (or
 *     if any of the handlers returns false) this will also return false.
 *     If there are no handlers, or if all handlers return true, this returns
 *     true.
 */
goog.events.dispatchEvent = function(src, e) {
  // If accepting a string or object, create a custom event object so that
  // preventDefault and stopPropagation work with the event.
  if (goog.isString(e)) {
    e = new goog.events.Event(e, src);
  } else if (!(e instanceof goog.events.Event)) {
    var oldEvent = e;
    e = new goog.events.Event(e.type, src);
    goog.object.extend(e, oldEvent);
  } else {
    e.target = e.target || src;
  }

  var rv = 1, ancestors;

  var type = e.type;
  var map = goog.events.listenerTree_;

  if (!(type in map)) {
    return true;
  }

  map = map[type];
  var hasCapture = true in map;
  var targetsMap;

  if (hasCapture) {
    // Build ancestors now
    ancestors = [];
    for (var parent = src; parent; parent = parent.getParentEventTarget()) {
      ancestors.push(parent);
    }

    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;

    // Call capture listeners
    for (var i = ancestors.length - 1;
         !e.propagationStopped_ && i >= 0 && targetsMap.remaining_;
         i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type,
                                       true, e) &&
            e.returnValue_ != false;
    }
  }

  var hasBubble = false in map;
  if (hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;

    if (hasCapture) { // We have the ancestors.

      // Call bubble listeners
      for (var i = 0; !e.propagationStopped_ && i < ancestors.length &&
           targetsMap.remaining_;
           i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type,
                                         false, e) &&
              e.returnValue_ != false;
      }
    } else {
      // In case we don't have capture we don't have to build up the
      // ancestors array.

      for (var current = src;
           !e.propagationStopped_ && current && targetsMap.remaining_;
           current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type,
                                         false, e) &&
              e.returnValue_ != false;
      }
    }
  }

  return Boolean(rv);
};


/**
 * Installs exception protection for the browser event entry point using the
 * given error handler.
 *
 * @param {goog.debug.ErrorHandler} errorHandler Error handler with which to
 *     protect the entry point.
 * @param {boolean=} opt_tracers Whether to install tracers around the browser
 *     event entry point.
 */
goog.events.protectBrowserEventEntryPoint = function(
    errorHandler, opt_tracers) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(
      goog.events.handleBrowserEvent_, opt_tracers);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
};


/**
 * Handles an event and dispatches it to the correct listeners. This
 * function is a proxy for the real listener the user specified.
 *
 * @param {string} key Unique key for the listener.
 * @param {Event=} opt_evt Optional event object that gets passed in via the
 *     native event handlers.
 * @return {boolean} Result of the event handler.
 * @this {goog.events.EventTarget|Object} The object or Element that
 *     fired the event.
 * @private
 */
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  // If the listener isn't there it was probably removed when processing
  // another listener on the same event (e.g. the later listener is
  // not managed by closure so that they are both fired under IE)
  if (!goog.events.listeners_[key]) {
    return true;
  }

  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;

  if (!(type in map)) {
    return true;
  }
  map = map[type];
  var retval, targetsMap;
  if (goog.userAgent.IE) {
    var ieEvent = opt_evt ||
        /** @type {Event} */ (goog.getObjectByName('window.event'));

    // Check if we have any capturing event listeners for this type.
    var hasCapture = true in map;
    var hasBubble = false in map;

    if (hasCapture) {
      if (goog.events.isMarkedIeEvent_(ieEvent)) {
        return true;
      }

      goog.events.markIeEvent_(ieEvent);
    }

    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);

    retval = true;
    try {
      if (hasCapture) {
        var ancestors = goog.events.pools.getArray();

        for (var parent = evt.currentTarget;
             parent;
             parent = parent.parentNode) {
          ancestors.push(parent);
        }

        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;

        // Call capture listeners
        for (var i = ancestors.length - 1;
             !evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;
             i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type,
                                               true, evt);
        }

        if (hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;

          // Call bubble listeners
          for (var i = 0;
               !evt.propagationStopped_ && i < ancestors.length &&
               targetsMap.remaining_;
               i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type,
                                                 false, evt);
          }
        }

      } else {
        // Bubbling, let IE handle the propagation.
        retval = goog.events.fireListener(listener, evt);
      }

    } finally {
      if (ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors);
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt);
    }
    return retval;
  } // IE

  // Caught a non-IE DOM event. 1 additional argument which is the event object
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be);
  } finally {
    be.dispose();
  }
  return retval;
};


// Set the callback for the proxy pool. This is done here to prevent circular
// dependencies.
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);


/**
 * This is used to mark the IE event object so we do not do the Closure pass
 * twice for a bubbling event.
 * @param {Event} e The IE browser event.
 * @private
 */
goog.events.markIeEvent_ = function(e) {
  // Only the keyCode and the returnValue can be changed. We use keyCode for
  // non keyboard events.
  // event.returnValue is a bit more tricky. It is undefined by default. A
  // boolean false prevents the default action. In a window.onbeforeunload and
  // the returnValue is non undefined it will be alerted. However, we will only
  // modify the returnValue for keyboard events. We can get a problem if non
  // closure events sets the keyCode or the returnValue

  var useReturnValue = false;

  if (e.keyCode == 0) {
    // We cannot change the keyCode in case that srcElement is input[type=file].
    // We could test that that is the case but that would allocate 3 objects.
    // If we use try/catch we will only allocate extra objects in the case of a
    // failure.
    /** @preserveTry */
    try {
      e.keyCode = -1;
      return;
    } catch (ex) {
      useReturnValue = true;
    }
  }

  if (useReturnValue ||
      /** @type {boolean|undefined} */ (e.returnValue) == undefined) {
    e.returnValue = true;
  }
};


/**
 * This is used to check if an IE event has already been handled by the Closure
 * system so we do not do the Closure pass twice for a bubbling event.
 * @param {Event} e  The IE browser event.
 * @return {boolean} True if the event object has been marked.
 * @private
 * @notypecheck TODO: Fix this.
 */
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined;
};


/**
 * Counter to create unique event ids.
 * @type {number}
 * @private
 */
goog.events.uniqueIdCounter_ = 0;


/**
 * Creates a unique event id.
 *
 * @param {string} identifier The identifier.
 * @return {string} A unique identifier.
 */
goog.events.getUniqueId = function(identifier) {
  return identifier + '_' + goog.events.uniqueIdCounter_++;
};

// Input 20
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2005 Google Inc. All Rights Reserved.

/**
 * @fileoverview Implementation of EventTarget as defined by W3C DOM 2/3.
 *
 * @see ../demos/eventtarget.html
 */

/**
 * Namespace for events
 */
goog.provide('goog.events.EventTarget');

goog.require('goog.Disposable');
goog.require('goog.events');


/**
 * This implements the EventTarget interface as defined by W3C DOM 2/3. The
 * main difference from the spec is that the this does not know about event
 * propagation and therefore the flag whether to use bubbling or capturing is
 * not used.
 *
 * Another difference is that event objects do not really have to implement
 * the Event interface. An object is treated as an event object if it has a
 * type property.
 *
 * It also allows you to pass a string instead of an event object and in that
 * case an event like object is created with the type set to the string value.
 *
 * Unless propagation is stopped, events dispatched by an EventTarget bubble
 * to its parent event target, returned by <code>getParentEventTarget</code>.
 * To set the parent event target, call <code>setParentEventTarget</code> or
 * override <code>getParentEventTarget</code> in a subclass.  Subclasses that
 * don't support changing the parent event target should override the setter
 * to throw an error.
 *
 * Example usage:
 * <pre>
 *   var et = new goog.events.EventTarget;
 *   function f(e) {
 *      alert("Type: " + e.type + "\nTarget: " + e.target);
 *   }
 *   et.addEventListener("foo", f);
 *   ...
 *   et.dispatchEvent({type: "foo"}); // will call f
 *   // or et.dispatchEvent("foo");
 *   ...
 *   et.removeEventListener("foo", f);
 *
 *  // You can also use the EventHandler interface:
 *  var eh = {
 *    handleEvent: function(e) {
 *      ...
 *    }
 *  };
 *  et.addEventListener("bar", eh);
 * </pre>
 *
 * @constructor
 * @extends {goog.Disposable}
 */
goog.events.EventTarget = function() {
  goog.Disposable.call(this);
};
goog.inherits(goog.events.EventTarget, goog.Disposable);


/**
 * Used to tell if an event is a real event in goog.events.listen() so we don't
 * get listen() calling addEventListener() and vice-versa.
 * @type {boolean}
 * @private
 */
goog.events.EventTarget.prototype.customEvent_ = true;


/**
 * Parent event target, used during event bubbling.
 * @type {goog.events.EventTarget?}
 * @private
 */
goog.events.EventTarget.prototype.parentEventTarget_ = null;


/**
 * Returns the parent of this event target to use for bubbling.
 *
 * @return {goog.events.EventTarget} The parent EventTarget or null if there
 * is no parent.
 */
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_;
};


/**
 * Sets the parent of this event target to use for bubbling.
 *
 * @param {goog.events.EventTarget?} parent Parent EventTarget (null if none).
 */
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent;
};


/**
 * Adds an event listener to the event target. The same handler can only be
 * added once per the type. Even if you add the same handler multiple times
 * using the same type then it will only be called once when the event is
 * dispatched.
 *
 * Supported for legacy but use goog.events.listen(src, type, handler) instead.
 *
 * @param {string} type The type of the event to listen for.
 * @param {Function|Object} handler The function to handle the event. The
 *     handler can also be an object that implements the handleEvent method
 *     which takes the event object as argument.
 * @param {boolean=} opt_capture In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase
 *     of the event.
 * @param {Object=} opt_handlerScope Object in whose scope to call the listener.
 */
goog.events.EventTarget.prototype.addEventListener = function(
    type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope);
};


/**
 * Removes an event listener from the event target. The handler must be the
 * same object as the one added. If the handler has not been added then
 * nothing is done.
 * @param {string} type The type of the event to listen for.
 * @param {Function|Object} handler The function to handle the event. The
 *     handler can also be an object that implements the handleEvent method
 *     which takes the event object as argument.
 * @param {boolean=} opt_capture In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase
 *     of the event.
 * @param {Object=} opt_handlerScope Object in whose scope to call the listener.
 */
goog.events.EventTarget.prototype.removeEventListener = function(
    type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope);
};


/**
 * Dispatches an event (or event like object) and calls all listeners
 * listening for events of this type. The type of the event is decided by the
 * type property on the event object.
 *
 * If any of the listeners returns false OR calls preventDefault then this
 * function will return false.  If one of the capture listeners calls
 * stopPropagation, then the bubble listeners won't fire.
 *
 * @param {string|Object|goog.events.Event} e Event object.
 * @return {boolean} If anyone called preventDefault on the event object (or
 *     if any of the handlers returns false this will also return false.
 */
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e);
};


/**
 * Unattach listeners from this object.  Classes that extend EventTarget may
 * need to override this method in order to remove references to DOM Elements
 * and additional listeners, it should be something like this:
 * <pre>
 * MyClass.prototype.disposeInternal = function() {
 *   MyClass.superClass_.disposeInternal.call(this);
 *   // Dispose logic for MyClass
 * };
 * </pre>
 * @protected
 */
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null;
};

// Input 21
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview A utility class for representing a numeric box.
 */


goog.provide('goog.math.Box');

goog.require('goog.math.Coordinate');



/**
 * Class for representing a box. A box is specified as a top, right, bottom,
 * and left. A box is useful for representing margins and padding.
 *
 * @param {number} top Top.
 * @param {number} right Right.
 * @param {number} bottom Bottom.
 * @param {number} left Left.
 * @constructor
 */
goog.math.Box = function(top, right, bottom, left) {
  /**
   * Top
   * @type {number}
   */
  this.top = top;

  /**
   * Right
   * @type {number}
   */
  this.right = right;

  /**
   * Bottom
   * @type {number}
   */
  this.bottom = bottom;

  /**
   * Left
   * @type {number}
   */
  this.left = left;
};


/**
 * Creates a Box by bounding a collection of goog.math.Coordinate objects
 * @param {...goog.math.Coordinate} var_args Coordinates to be included inside
 *     the box.
 * @return {goog.math.Box} A Box containing all the specified Coordinates.
 */
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x,
                              arguments[0].y, arguments[0].x);
  for (var i = 1; i < arguments.length; i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x);
  }
  return box;
};


/**
 * Creates a copy of the box with the same dimensions.
 * @return {goog.math.Box} A clone of this Box.
 */
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing the box.
   * @return {string} In the form (50t, 73r, 24b, 13l).
   */
  goog.math.Box.prototype.toString = function() {
    return '(' + this.top + 't, ' + this.right + 'r, ' + this.bottom + 'b, ' +
           this.left + 'l)';
  };
}


/**
 * Returns whether the box contains a coordinate or another box.
 *
 * @param {goog.math.Coordinate|goog.math.Box} other A Coordinate or a Box.
 * @return {boolean} Whether the box contains the coordinate or other box.
 */
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other);
};


/**
 * Expands box with the given margins.
 *
 * @param {number|goog.math.Box} top Top margin or box with all margins.
 * @param {number=} opt_right Right margin.
 * @param {number=} opt_bottom Bottom margin.
 * @param {number=} opt_left Left margin.
 * @return {goog.math.Box} A reference to this Box.
 */
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom,
    opt_left) {
  if (goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left;
  } else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left;
  }

  return this;
};


/**
 * Compares boxes for equality.
 * @param {goog.math.Box} a A Box.
 * @param {goog.math.Box} b A Box.
 * @return {boolean} True iff the boxes are equal, or if both are null.
 */
goog.math.Box.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.top == b.top && a.right == b.right &&
         a.bottom == b.bottom && a.left == b.left;
};


/**
 * Returns whether a box contains a coordinate or another box.
 *
 * @param {goog.math.Box} box A Box.
 * @param {goog.math.Coordinate|goog.math.Box} other A Coordinate or a Box.
 * @return {boolean} Whether the box contains the coordinate or other box.
 */
goog.math.Box.contains = function(box, other) {
  if (!box || !other) {
    return false;
  }

  if (other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right &&
      other.top >= box.top && other.bottom <= box.bottom;
  }

  // other is a Coordinate.
  return other.x >= box.left && other.x <= box.right &&
         other.y >= box.top && other.y <= box.bottom;
};


/**
 * Returns the distance between a coordinate and the nearest corner/side of a
 * box. Returns zero if the coordinate is inside the box.
 *
 * @param {goog.math.Box} box A Box.
 * @param {goog.math.Coordinate} coord A Coordinate.
 * @return {number} The distance between {@code coord} and the nearest
 *     corner/side of {@code box}, or zero if {@code coord} is inside
 *     {@code box}.
 */
goog.math.Box.distance = function(box, coord) {
  if (coord.x >= box.left && coord.x <= box.right) {
    if (coord.y >= box.top && coord.y <= box.bottom) {
      return 0;
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom;
  }

  if (coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right;
  }

  return goog.math.Coordinate.distance(coord,
      new goog.math.Coordinate(coord.x < box.left ? box.left : box.right,
                               coord.y < box.top ? box.top : box.bottom));
};


/**
 * Returns whether two boxes intersect.
 *
 * @param {goog.math.Box} a A Box.
 * @param {goog.math.Box} b A second Box.
 * @return {boolean} Whether the boxes intersect.
 */
goog.math.Box.intersects = function(a, b) {
  return (a.left <= b.right && b.left <= a.right &&
          a.top <= b.bottom && b.top <= a.bottom);
};

// Input 22
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview A utility class for representing a numeric range.
 */


goog.provide('goog.math.Range');


/**
 * A number range.
 * @param {number} a One end of the range.
 * @param {number} b The other end of the range.
 * @constructor
 */
goog.math.Range = function(a, b) {
  a = Number(a);
  b = Number(b);

  /**
   * The lowest value in the range.
   * @type {number}
   */
  this.start = a < b ? a : b;

  /**
   * The highest value in the range.
   * @type {number}
   */
  this.end = a < b ? b : a;
};


/**
 * @return {goog.math.Range} A clone of this Range.
 */
goog.math.Range.prototype.clone = function() {
  return new goog.math.Range(this.start, this.end);
};


if (goog.DEBUG) {
  /**
   * Returns a string representing the range.
   * @return {string} In the form [-3.5, 8.13].
   */
  goog.math.Range.prototype.toString = function() {
    return '[' + this.start + ', ' + this.end + ']';
  };
}


/**
 * Compares ranges for equality.
 * @param {goog.math.Range} a A Range.
 * @param {goog.math.Range} b A Range.
 * @return {boolean} True iff both the starts and the ends of the ranges are
 *     equal, or if both ranges are null.
 */
goog.math.Range.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.start == b.start && a.end == b.end;
};


/**
 * Given two ranges on the same dimension, this method returns the intersection
 * of those ranges.
 * @param {goog.math.Range} a A Range.
 * @param {goog.math.Range} b A Range.
 * @return {goog.math.Range?} A new Range representing the intersection of two
 *     ranges, or null if there is no intersection. Ranges are assumed to
 *     include their end points, and the intersection can be a point.
 */
goog.math.Range.intersection = function(a, b) {
  var c0 = Math.max(a.start, b.start);
  var c1 = Math.min(a.end, b.end);
  return (c0 <= c1) ? new goog.math.Range(c0, c1) : null;
};


/**
 * Given two ranges on the same dimension, determines whether they intersect.
 * @param {goog.math.Range} a A Range.
 * @param {goog.math.Range} b A Range.
 * @return {boolean} Whether they intersect.
 */
goog.math.Range.hasIntersection = function(a, b) {
  return Math.max(a.start, b.start) <= Math.min(a.end, b.end);
};


/**
 * Given two ranges on the same dimension, this returns a range that covers
 * both ranges.
 * @param {goog.math.Range} a A Range.
 * @param {goog.math.Range} b A Range.
 * @return {goog.math.Range} A new Range representing the bounding range.
 */
goog.math.Range.boundingRange = function(a, b) {
  return new goog.math.Range(Math.min(a.start, b.start),
                             Math.max(a.end, b.end));
};


/**
 * Given two ranges, returns true if the first range completely overlaps the
 * second.
 * @param {goog.math.Range} a The first Range.
 * @param {goog.math.Range} b The second Range.
 * @return {boolean} True if b is contained inside a, false otherwise.
 */
goog.math.Range.contains = function(a, b) {
  return a.start <= b.start && a.end >= b.end;
};


/**
 * Given a range and a point, returns true if the range contains the point.
 * @param {goog.math.Range} range The range.
 * @param {number} p The point.
 * @return {boolean} True if p is contained inside range, false otherwise.
 */
goog.math.Range.containsPoint = function(range, p) {
  return range.start <= p && range.end >= p;
};

// Input 23
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview A utility class for representing rectangles.
 */


goog.provide('goog.math.Rect');

goog.require('goog.math.Box');
goog.require('goog.math.Size');

/**
 * Class for representing rectangular regions.
 * @param {number} x Left.
 * @param {number} y Top.
 * @param {number} w Width.
 * @param {number} h Height.
 * @constructor
 */
goog.math.Rect = function(x, y, w, h) {
  /**
   * Left
   * @type {number}
   */
  this.left = x;

  /**
   * Top
   * @type {number}
   */
  this.top = y;

  /**
   * Width
   * @type {number}
   */
  this.width = w;

  /**
   * Height
   * @type {number}
   */
  this.height = h;
};


/**
 * Returns a new copy of the rectangle.
 * @return {goog.math.Rect} A clone of this Rectangle.
 */
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height);
};


/**
 * Returns a new Box object with the same position and dimensions as this
 * rectangle.
 * @return {goog.math.Box} A new Box representation of this Rectangle.
 */
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top,
                           right,
                           bottom,
                           this.left);
};


/**
 * Creates a new Rect object with the same position and dimensions as a given
 * Box.  Note that this is only the inverse of toBox if left/top are defined.
 * @param {goog.math.Box} box A box.
 * @return {goog.math.Rect} A new Rect initialized with the box's position
 *     and size.
 */
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top,
      box.right - box.left, box.bottom - box.top);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing size and dimensions of rectangle.
   * @return {string} In the form (50, 73 - 75w x 25h).
   */
  goog.math.Rect.prototype.toString = function() {
    return '(' + this.left + ', ' + this.top + ' - ' + this.width + 'w x ' +
           this.height + 'h)';
  };
}


/**
 * Compares rectangles for equality.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {boolean} True iff the rectangles have the same left, top, width,
 *     and height, or if both are null.
 */
goog.math.Rect.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.left == b.left && a.width == b.width &&
         a.top == b.top && a.height == b.height;
};


/**
 * Computes the intersection of this rectangle and the rectangle parameter.  If
 * there is no intersection, returns false and leaves this rectangle as is.
 * @param {goog.math.Rect} rect A Rectangle.
 * @return {boolean} True iff this rectangle intersects with the parameter.
 */
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);

  if (x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);

    if (y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;

      return true;
    }
  }
  return false;
};


/**
 * Returns the intersection of two rectangles. Two rectangles intersect if they
 * touch at all, for example, two zero width and height rectangles would
 * intersect if they had the same top and left.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {goog.math.Rect?} A new intersection rect (even if width and height
 *     are 0), or null if there is no intersection.
 */
goog.math.Rect.intersection = function(a, b) {
  // There is no nice way to do intersection via a clone, because any such
  // clone might be unnecessary if this function returns null.  So, we duplicate
  // code from above.

  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);

  if (x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);

    if (y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0);
    }
  }
  return null;
};


/**
 * Returns whether two rectangles intersect. Two rectangles intersect if they
 * touch at all, for example, two zero width and height rectangles would
 * intersect if they had the same top and left.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {boolean} Whether a and b intersect.
 */
goog.math.Rect.intersects = function(a, b) {
  return (a.left <= b.left + b.width && b.left <= a.left + a.width &&
      a.top <= b.top + b.height && b.top <= a.top + a.height);
};


/**
 * Returns whether a rectangle intersects this rectangle.
 * @param {goog.math.Rect} rect A rectangle.
 * @return {boolean} Whether rect intersects this rectangle.
 */
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect);
};


/**
 * Computes the difference regions between two rectangles. The return value is
 * an array of 0 to 4 rectangles defining the remaining regions of the first
 * rectangle after the second has been subtracted.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {Array.<goog.math.Rect>} An array with 0 to 4 rectangles which
 *     together define the difference area of rectangle a minus rectangle b.
 */
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if (!intersection || !intersection.height || !intersection.width) {
    return [a.clone()];
  }

  var result = [];

  var top = a.top;
  var height = a.height;

  var ar = a.left + a.width;
  var ab = a.top + a.height;

  var br = b.left + b.width;
  var bb = b.top + b.height;

  // Subtract off any area on top where A extends past B
  if (b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    // If we're moving the top down, we also need to subtract the height diff.
    height -= b.top - a.top;
  }
  // Subtract off any area on bottom where A extends past B
  if (bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top;
  }
  // Subtract any area on left where A extends past B
  if (b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height));
  }
  // Subtract any area on right where A extends past B
  if (br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height));
  }

  return result;
};


/**
 * Computes the difference regions between this rectangle and {@code rect}. The
 * return value is an array of 0 to 4 rectangles defining the remaining regions
 * of this rectangle after the other has been subtracted.
 * @param {goog.math.Rect} rect A Rectangle.
 * @return {Array.<goog.math.Rect>} An array with 0 to 4 rectangles which
 *     together define the difference area of rectangle a minus rectangle b.
 */
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect);
};


/**
 * Expand this rectangle to also include the area of the given rectangle.
 * @param {goog.math.Rect} rect The other rectangle.
 */
goog.math.Rect.prototype.boundingRect = function(rect) {
  // We compute right and bottom before we change left and top below.
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);

  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);

  this.width = right - this.left;
  this.height = bottom - this.top;
};


/**
 * Returns a new rectangle which completely contains both input rectangles.
 * @param {goog.math.Rect} a A rectangle.
 * @param {goog.math.Rect} b A rectangle.
 * @return {goog.math.Rect?} A new bounding rect, or null if either rect is
 *     null.
 */
goog.math.Rect.boundingRect = function(a, b) {
  if (!a || !b) {
    return null;
  }

  var clone = a.clone();
  clone.boundingRect(b);

  return clone;
};

/**
 * Tests whether this rectangle entirely contains another rectangle or
 * coordinate.
 *
 * @param {goog.math.Rect|goog.math.Coordinate} another The rectangle or
 *     coordinate to test for containment.
 * @return {boolean} Whether this rectangle contains given rectangle or
 *     coordinate.
 */
goog.math.Rect.prototype.contains = function(another) {
  if (another instanceof goog.math.Rect) {
    return this.left <= another.left &&
           this.left + this.width >= another.left + another.width &&
           this.top <= another.top &&
           this.top + this.height >= another.top + another.height;
  } else { // (another instanceof goog.math.Coordinate)
    return another.x >= this.left &&
           another.x <= this.left + this.width &&
           another.y >= this.top &&
           another.y <= this.top + this.height;
  }
};


/**
 * Returns the size of this rectangle.
 * @return {goog.math.Size} The size of this rectangle.
 */
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height);
};

// Input 24
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Additional mathematical functions.
 */


goog.provide('goog.math');


goog.require('goog.array');
// TODO: Remove this require once all dependant files require the
// correct subclasses instead of just goog.math.
goog.require('goog.math.Box');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Range');
goog.require('goog.math.Rect');
goog.require('goog.math.Size');


/**
 * Returns a random integer greater than or equal to 0 and less than {@code a}.
 * @param {number} a  The upper bound for the random integer (exclusive).
 * @return {number} A random integer N such that 0 <= N < a.
 */
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a);
};


/**
 * Returns a random number greater than or equal to {@code a} and less than
 * {@code b}.
 * @param {number} a  The lower bound for the random number (inclusive).
 * @param {number} b  The upper bound for the random number (exclusive).
 * @return {number} A random number N such that a <= N < b.
 */
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a);
};


/**
 * Takes a number and clamps it to within the provided bounds.
 * @param {number} value The input number.
 * @param {number} min The minimum value to return.
 * @param {number} max The maximum value to return.
 * @return {number} The input number if it is within bounds, or the nearest
 *     number within the bounds.
 */
goog.math.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
};


/**
 * The % operator in JavaScript returns the remainder of a / b, but differs from
 * some other languages in that the result will have the same sign as the
 * dividend. For example, -1 % 8 == -1, whereas in some other languages
 * (such as Python) the result would be 7. This function emulates the more
 * correct modulo behavior, which is useful for certain applications such as
 * calculating an offset index in a circular list.
 *
 * @param {number} a The dividend.
 * @param {number} b The divisor.
 * @return {number} a % b where the result is between 0 and b (either 0 <= x < b
 *     or b < x <= 0, depending on the sign of b).
 */
goog.math.modulo = function(a, b) {
  var r = a % b;
  // If r and b differ in sign, add b to wrap the result to the correct sign.
  return (r * b < 0) ? r + b : r;
};


/**
 * Performs linear interpolation between values a and b. Returns the value
 * between a and b proportional to x (when x is between 0 and 1. When x is
 * outside this range, the return value is a linear extrapolation).
 * @param {number} a A number.
 * @param {number} b A number.
 * @param {number} x The proportion between a and b.
 * @return {number} The interpolated value between a and b.
 */
goog.math.lerp = function(a, b, x) {
  return a + x * (b - a);
};


/**
 * Tests whether the two values are equal to each other, within a certain
 * tolerance to adjust for floating pount errors.
 * @param {number} a A number.
 * @param {number} b A number.
 * @param {number=} opt_tolerance Optional tolerance range. Defaults
 *     to 0.000001. If specified, should be greater than 0.
 * @return {boolean} Whether {@code a} and {@code b} are nearly equal.
 */
goog.math.nearlyEquals = function(a, b, opt_tolerance) {
  return Math.abs(a - b) <= (opt_tolerance || 0.000001);
};


/**
 * Standardizes an angle to be in range [0-360). Negative angles become
 * positive, and values greater than 360 are returned modulo 360.
 * @param {number} angle Angle in degrees.
 * @return {number} Standardized angle.
 */
goog.math.standardAngle = function(angle) {
  return goog.math.modulo(angle, 360);
};


/**
 * Converts degrees to radians.
 * @param {number} angleDegrees Angle in degrees.
 * @return {number} Angle in radians.
 */
goog.math.toRadians = function(angleDegrees) {
  return angleDegrees * Math.PI / 180;
};


/**
 * Converts radians to degrees.
 * @param {number} angleRadians Angle in radians.
 * @return {number} Angle in degrees.
 */
goog.math.toDegrees = function(angleRadians) {
  return angleRadians * 180 / Math.PI;
};


/**
 * For a given angle and radius, finds the X portion of the offset.
 * @param {number} degrees Angle in degrees (zero points in +X direction).
 * @param {number} radius Radius.
 * @return {number} The x-distance for the angle and radius.
 */
goog.math.angleDx = function(degrees, radius) {
  return radius * Math.cos(goog.math.toRadians(degrees));
};


/**
 * For a given angle and radius, finds the Y portion of the offset.
 * @param {number} degrees Angle in degrees (zero points in +X direction).
 * @param {number} radius Radius.
 * @return {number} The y-distance for the angle and radius.
 */
goog.math.angleDy = function(degrees, radius) {
  return radius * Math.sin(goog.math.toRadians(degrees));
};


/**
 * Computes the angle between two points (x1,y1) and (x2,y2).
 * Angle zero points in the +X direction, 90 degrees points in the +Y
 * direction (down) and from there we grow clockwise towards 360 degrees.
 * @param {number} x1 x of first point.
 * @param {number} y1 y of first point.
 * @param {number} x2 x of second point.
 * @param {number} y2 y of second point.
 * @return {number} Standardized angle in degrees of the vector from
 *     x1,y1 to x2,y2.
 */
goog.math.angle = function(x1, y1, x2, y2) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(y2 - y1,
                                                                x2 - x1)));
};


/**
 * Computes the difference between startAngle and endAngle (angles in degrees).
 * @param {number} startAngle  Start angle in degrees.
 * @param {number} endAngle  End angle in degrees.
 * @return {number} The number of degrees that when added to
 *     startAngle will result in endAngle. Positive numbers mean that the
 *     direction is clockwise. Negative numbers indicate a counter-clockwise
 *     direction.
 *     The shortest route (clockwise vs counter-clockwise) between the angles
 *     is used.
 *     When the difference is 180 degrees, the function returns 180 (not -180)
 *     angleDifference(30, 40) is 10, and angleDifference(40, 30) is -10.
 *     angleDifference(350, 10) is 20, and angleDifference(10, 350) is -20.
 */
goog.math.angleDifference = function(startAngle, endAngle) {
  var d = goog.math.standardAngle(endAngle) -
          goog.math.standardAngle(startAngle);
  if (d > 180) {
    d = d - 360;
  } else if (d <= -180) {
    d = 360 + d;
  }
  return d;
};


/**
 * Returns the sign of a number as per the "sign" or "signum" function.
 * @param {number} x The number to take the sign of.
 * @return {number} -1 when negative, 1 when positive, 0 when 0.
 */
goog.math.sign = function(x) {
  return x == 0 ? 0 : (x < 0 ? -1 : 1);
};


/**
 * JavaScript implementation of Longest Common Subsequence problem.
 * http://en.wikipedia.org/wiki/Longest_common_subsequence
 *
 * Returns the longest possible array that is subarray of both of given arrays.
 *
 * @param {Array.<Object>} array1 First array of objects.
 * @param {Array.<Object>} array2 Second array of objects.
 * @param {Function=} opt_compareFn Function that acts as a custom comparator
 *     for the array ojects. Function should return true if objects are equal,
 *     otherwise false.
 * @param {Function=} opt_collectorFn Function used to decide what to return
 *     as a result subsequence. It accepts 2 arguments: index of common element
 *     in the first array and index in the second. The default function returns
 *     element from the first array.
 * @return {Array.<Object>} A list of objects that are common to both arrays
 *     such that there is no common subsequence with size greater than the
 *     length of the list.
 */
goog.math.longestCommonSubsequence = function(
    array1, array2, opt_compareFn, opt_collectorFn) {

  var compare = opt_compareFn || function(a, b) {
    return a == b;
  };

  var collect = opt_collectorFn || function(i1, i2) {
    return array1[i1];
  };

  var length1 = array1.length;
  var length2 = array2.length;

  var arr = [];
  for (var i = 0; i < length1 + 1; i++) {
    arr[i] = [];
    arr[i][0] = 0;
  }

  for (var j = 0; j < length2 + 1; j++) {
    arr[0][j] = 0;
  }

  for (i = 1; i <= length1; i++) {
    for (j = 1; j <= length1; j++) {
      if (compare(array1[i - 1], array2[j - 1])) {
        arr[i][j] = arr[i - 1][j - 1] + 1;
      } else {
        arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1]);
      }
    }
  }

  // Backtracking
  var result = [];
  var i = length1, j = length2;
  while (i > 0 && j > 0) {
    if (compare(array1[i - 1], array2[j - 1])) {
      result.unshift(collect(i - 1, j - 1));
      i--;
      j--;
    } else {
      if (arr[i - 1][j] > arr[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
  }

  return result;
};


/**
 * Returns the sum of the arguments.
 * @param {...number} var_args Numbers to add.
 * @return {number} The sum of the arguments (0 if no arguments were provided,
 *     {@code NaN} if any of the arguments is not a valid number).
 */
goog.math.sum = function(var_args) {
  return /** @type {number} */ (goog.array.reduce(arguments,
      function(sum, value) {
    return sum + value;
  }, 0));
};


/**
 * Returns the arithmetic mean of the arguments.
 * @param {...number} var_args Numbers to average.
 * @return {number} The average of the arguments ({@code NaN} if no arguments
 *     were provided or any of the arguments is not a valid number).
 */
goog.math.average = function(var_args) {
  return goog.math.sum.apply(null, arguments) / arguments.length;
};


/**
 * Returns the sample standard deviation of the arguments.  For a definition of
 * sample standard deviation, see e.g.
 * http://en.wikipedia.org/wiki/Standard_deviation
 * @param {...number} var_args Number samples to analyze.
 * @return {number} The sample standard deviation of the arguments (0 if fewer
 *     than two samples were provided, or {@code NaN} if any of the samples is
 *     not a valid number).
 */
goog.math.standardDeviation = function(var_args) {
  var sampleSize = arguments.length;
  if (sampleSize < 2) {
    return 0;
  }

  var mean = goog.math.average.apply(null, arguments);
  var variance = goog.math.sum.apply(null, goog.array.map(arguments,
      function(val) {
        return Math.pow(val - mean, 2);
      })) / (sampleSize - 1);

  return Math.sqrt(variance);
};


/**
 * Returns whether the supplied number represents an integer, i.e. that is has
 * no fractional component.  No range-checking is performed on the number.
 * @param {number} num The number to test.
 * @return {boolean} Whether {@code num} is an integer.
 */
goog.math.isInt = function(num) {
  return isFinite(num) && num % 1 == 0;
};


/**
 * Returns whether the supplied number is finite and not NaN.
 * @param {number} num The number to test.
 * @return {boolean} Whether {@code num} is a finite number.
 */
goog.math.isFiniteNumber = function(num) {
  return isFinite(num) && !isNaN(num);
};

// Input 25
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview This event wrapper will dispatch an event when the user uses
 * the mouse wheel to scroll an element. You can get the direction by checking
 * the deltaX and deltaY properties of the event.
 *
 * This class aims to smooth out inconsistencies between browser platforms with
 * regards to mousewheel events, but we do not cover every possible
 * software/hardware combination out there, some of which occasionally produce
 * very large deltas in mousewheel events. If your application wants to guard
 * against extremely large deltas, use the setMaxDeltaX and setMaxDeltaY APIs
 * to set maximum values that make sense for your application.
 *
 * @see ../demos/mousewheelhandler.html
 */

goog.provide('goog.events.MouseWheelEvent');
goog.provide('goog.events.MouseWheelHandler');
goog.provide('goog.events.MouseWheelHandler.EventType');

goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.EventTarget');
goog.require('goog.math');
goog.require('goog.userAgent');


/**
 * This event handler allows you to catch mouse wheel events in a consistent
 * manner.
 * @param {Element|Document} element  The element to listen to the mouse wheel
 *     event on.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
goog.events.MouseWheelHandler = function(element) {
  goog.events.EventTarget.call(this);

  /**
   * This is the element that we will listen to the real mouse wheel events on.
   * @type {Element|Document}
   * @private
   */
  this.element_ = element;

  var type = goog.userAgent.GECKO ? 'DOMMouseScroll' : 'mousewheel';

  /**
   * The key returned from the goog.events.listen.
   * @type {?number}
   * @private
   */
  this.listenKey_ = goog.events.listen(this.element_, type, this);
};
goog.inherits(goog.events.MouseWheelHandler, goog.events.EventTarget);


/**
 * Enum type for the events fired by the mouse wheel handler.
 * @enum {string}
 */
goog.events.MouseWheelHandler.EventType = {
  MOUSEWHEEL: 'mousewheel'
};


/**
 * Optional maximum magnitude for x delta on each mousewheel event.
 * @type {number|undefined}
 * @private
 */
goog.events.MouseWheelHandler.prototype.maxDeltaX_;


/**
 * Optional maximum magnitude for y delta on each mousewheel event.
 * @type {number|undefined}
 * @private
 */
goog.events.MouseWheelHandler.prototype.maxDeltaY_;


/**
 * @param {number} maxDeltaX Maximum magnitude for x delta on each mousewheel
 *     event. Should be non-negative.
 */
goog.events.MouseWheelHandler.prototype.setMaxDeltaX = function(maxDeltaX) {
  this.maxDeltaX_ = maxDeltaX;
};


/**
 * @param {number} maxDeltaY Maximum magnitude for y delta on each mousewheel
 *     event. Should be non-negative.
 */
goog.events.MouseWheelHandler.prototype.setMaxDeltaY = function(maxDeltaY) {
  this.maxDeltaY_ = maxDeltaY;
};


/**
 * Handles the events on the element.
 * @param {goog.events.BrowserEvent} e The underlying browser event.
 */
goog.events.MouseWheelHandler.prototype.handleEvent = function(e) {
  var deltaX = 0;
  var deltaY = 0;
  var detail = 0;
  var be = e.getBrowserEvent();
  if (be.type == 'mousewheel') {
    var wheelDeltaScaleFactor = 1;
    if (goog.userAgent.IE ||
        goog.userAgent.WEBKIT &&
        (goog.userAgent.WINDOWS || goog.userAgent.isVersion('532.0'))) {
      // In IE we get a multiple of 120; we adjust to a multiple of 3 to
      // represent number of lines scrolled (like Gecko).
      // Newer versions of Webkit match IE behavior, and WebKit on
      // Windows also matches IE behavior.
      // See bug https://bugs.webkit.org/show_bug.cgi?id=24368
      wheelDeltaScaleFactor = 40;
    }

    detail = -be.wheelDelta / wheelDeltaScaleFactor;
    if (goog.isDef(be.wheelDeltaX)) {
      // Webkit has two properties to indicate directional scroll, and
      // can scroll both directions at once.
      deltaX = -be.wheelDeltaX / wheelDeltaScaleFactor;
      deltaY = -be.wheelDeltaY / wheelDeltaScaleFactor;
    } else {
      deltaY = detail;
    }

    // Historical note: Opera (pre 9.5) used to negate the detail value.
  } else { // Gecko
    // Gecko returns multiple of 3 (representing the number of lines scrolled)
    detail = be.detail;

    // Gecko sometimes returns really big values if the user changes settings to
    // scroll a whole page per scroll
    if (detail > 100) {
      detail = 3;
    } else if (detail < -100) {
      detail = -3;
    }

    // Firefox 3.1 adds an axis field to the event to indicate direction of
    // scroll.  See https://developer.mozilla.org/en/Gecko-Specific_DOM_Events
    if (goog.isDef(be.axis) && be.axis === be.HORIZONTAL_AXIS) {
      deltaX = detail;
    } else {
      deltaY = detail;
    }
  }

  if (goog.isNumber(this.maxDeltaX_)) {
    deltaX = goog.math.clamp(deltaX, -this.maxDeltaX_, this.maxDeltaX_);
  }
  if (goog.isNumber(this.maxDeltaY_)) {
    deltaY = goog.math.clamp(deltaY, -this.maxDeltaY_, this.maxDeltaY_);
  }
  // Don't clamp 'detail', since it could be ambiguous which axis it refers to
  // and because it's informally deprecated anyways.

  var newEvent = new goog.events.MouseWheelEvent(detail, be, deltaX, deltaY);
  try {
    this.dispatchEvent(newEvent);
  } finally {
    newEvent.dispose();
  }
};


/**
 * Stops listening to the underlying mouse wheel event, and cleans up state.
 */
goog.events.MouseWheelHandler.prototype.disposeInternal = function() {
  goog.events.MouseWheelHandler.superClass_.disposeInternal.call(this);
  goog.events.unlistenByKey(this.listenKey_);
  delete this.listenKey_;
};


/**
 * A base class for mouse wheel events. This is used with the
 * MouseWheelHandler.
 *
 * @param {number} detail The number of rows the user scrolled.
 * @param {Event} browserEvent Browser event object.
 * @param {number} deltaX The number of rows the user scrolled in the X
 *     direction.
 * @param {number} deltaY The number of rows the user scrolled in the Y
 *     direction.
 * @constructor
 * @extends {goog.events.BrowserEvent}
 */
goog.events.MouseWheelEvent = function(detail, browserEvent, deltaX, deltaY) {
  goog.events.BrowserEvent.call(this, browserEvent);

  this.type = goog.events.MouseWheelHandler.EventType.MOUSEWHEEL;

  /**
   * The number of lines the user scrolled
   * @type {number}
   * NOTE: Informally deprecated. Use deltaX and deltaY instead, they provide
   * more information.
   */
  this.detail = detail;

  /**
   * The number of "lines" scrolled in the X direction.
   *
   * Note that not all browsers provide enough information to distinguish
   * horizontal and vertical scroll events, so for these unsupported browsers,
   * we will always have a deltaX of 0, even if the user scrolled their mouse
   * wheel or trackpad sideways.
   *
   * Currently supported browsers are Webkit and Firefox 3.1 or later.
   *
   * @type {number}
   */
  this.deltaX = deltaX;

  /**
   * The number of lines scrolled in the Y direction.
   * @type {number}
   */
  this.deltaY = deltaY;
};
goog.inherits(goog.events.MouseWheelEvent, goog.events.BrowserEvent);

// Input 26
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Names of standard colors with their associated hex values.
 */

goog.provide('goog.color.names');


/**
 * A map that contains a lot of colors that are recognised by various browsers.
 * This list is way larger than the minimal one dictated by W3C.
 * The keys of this map are the lowercase "readable" names of the colors, while
 * the values are the "hex" values.
 */
goog.color.names = {
  'aliceblue': '#f0f8ff',
  'antiquewhite': '#faebd7',
  'aqua': '#00ffff',
  'aquamarine': '#7fffd4',
  'azure': '#f0ffff',
  'beige': '#f5f5dc',
  'bisque': '#ffe4c4',
  'black': '#000000',
  'blanchedalmond': '#ffebcd',
  'blue': '#0000ff',
  'blueviolet': '#8a2be2',
  'brown': '#a52a2a',
  'burlywood': '#deb887',
  'cadetblue': '#5f9ea0',
  'chartreuse': '#7fff00',
  'chocolate': '#d2691e',
  'coral': '#ff7f50',
  'cornflowerblue': '#6495ed',
  'cornsilk': '#fff8dc',
  'crimson': '#dc143c',
  'cyan': '#00ffff',
  'darkblue': '#00008b',
  'darkcyan': '#008b8b',
  'darkgoldenrod': '#b8860b',
  'darkgray': '#a9a9a9',
  'darkgreen': '#006400',
  'darkgrey': '#a9a9a9',
  'darkkhaki': '#bdb76b',
  'darkmagenta': '#8b008b',
  'darkolivegreen': '#556b2f',
  'darkorange': '#ff8c00',
  'darkorchid': '#9932cc',
  'darkred': '#8b0000',
  'darksalmon': '#e9967a',
  'darkseagreen': '#8fbc8f',
  'darkslateblue': '#483d8b',
  'darkslategray': '#2f4f4f',
  'darkslategrey': '#2f4f4f',
  'darkturquoise': '#00ced1',
  'darkviolet': '#9400d3',
  'deeppink': '#ff1493',
  'deepskyblue': '#00bfff',
  'dimgray': '#696969',
  'dimgrey': '#696969',
  'dodgerblue': '#1e90ff',
  'firebrick': '#b22222',
  'floralwhite': '#fffaf0',
  'forestgreen': '#228b22',
  'fuchsia': '#ff00ff',
  'gainsboro': '#dcdcdc',
  'ghostwhite': '#f8f8ff',
  'gold': '#ffd700',
  'goldenrod': '#daa520',
  'gray': '#808080',
  'green': '#008000',
  'greenyellow': '#adff2f',
  'grey': '#808080',
  'honeydew': '#f0fff0',
  'hotpink': '#ff69b4',
  'indianred': '#cd5c5c',
  'indigo': '#4b0082',
  'ivory': '#fffff0',
  'khaki': '#f0e68c',
  'lavender': '#e6e6fa',
  'lavenderblush': '#fff0f5',
  'lawngreen': '#7cfc00',
  'lemonchiffon': '#fffacd',
  'lightblue': '#add8e6',
  'lightcoral': '#f08080',
  'lightcyan': '#e0ffff',
  'lightgoldenrodyellow': '#fafad2',
  'lightgray': '#d3d3d3',
  'lightgreen': '#90ee90',
  'lightgrey': '#d3d3d3',
  'lightpink': '#ffb6c1',
  'lightsalmon': '#ffa07a',
  'lightseagreen': '#20b2aa',
  'lightskyblue': '#87cefa',
  'lightslategray': '#778899',
  'lightslategrey': '#778899',
  'lightsteelblue': '#b0c4de',
  'lightyellow': '#ffffe0',
  'lime': '#00ff00',
  'limegreen': '#32cd32',
  'linen': '#faf0e6',
  'magenta': '#ff00ff',
  'maroon': '#800000',
  'mediumaquamarine': '#66cdaa',
  'mediumblue': '#0000cd',
  'mediumorchid': '#ba55d3',
  'mediumpurple': '#9370d8',
  'mediumseagreen': '#3cb371',
  'mediumslateblue': '#7b68ee',
  'mediumspringgreen': '#00fa9a',
  'mediumturquoise': '#48d1cc',
  'mediumvioletred': '#c71585',
  'midnightblue': '#191970',
  'mintcream': '#f5fffa',
  'mistyrose': '#ffe4e1',
  'moccasin': '#ffe4b5',
  'navajowhite': '#ffdead',
  'navy': '#000080',
  'oldlace': '#fdf5e6',
  'olive': '#808000',
  'olivedrab': '#6b8e23',
  'orange': '#ffa500',
  'orangered': '#ff4500',
  'orchid': '#da70d6',
  'palegoldenrod': '#eee8aa',
  'palegreen': '#98fb98',
  'paleturquoise': '#afeeee',
  'palevioletred': '#d87093',
  'papayawhip': '#ffefd5',
  'peachpuff': '#ffdab9',
  'peru': '#cd853f',
  'pink': '#ffc0cb',
  'plum': '#dda0dd',
  'powderblue': '#b0e0e6',
  'purple': '#800080',
  'red': '#ff0000',
  'rosybrown': '#bc8f8f',
  'royalblue': '#4169e1',
  'saddlebrown': '#8b4513',
  'salmon': '#fa8072',
  'sandybrown': '#f4a460',
  'seagreen': '#2e8b57',
  'seashell': '#fff5ee',
  'sienna': '#a0522d',
  'silver': '#c0c0c0',
  'skyblue': '#87ceeb',
  'slateblue': '#6a5acd',
  'slategray': '#708090',
  'slategrey': '#708090',
  'snow': '#fffafa',
  'springgreen': '#00ff7f',
  'steelblue': '#4682b4',
  'tan': '#d2b48c',
  'teal': '#008080',
  'thistle': '#d8bfd8',
  'tomato': '#ff6347',
  'turquoise': '#40e0d0',
  'violet': '#ee82ee',
  'wheat': '#f5deb3',
  'white': '#ffffff',
  'whitesmoke': '#f5f5f5',
  'yellow': '#ffff00',
  'yellowgreen': '#9acd32'
};

// Input 27
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Utilities related to color and color conversion.
 */

goog.provide('goog.color');

goog.require('goog.color.names');
goog.require('goog.math');


/**
 * Parses a color out of a string.
 * @param {string} str Color in some format.
 * @return {Object} Contains two properties: 'hex', which is a string containing
 *     a hex representation of the color, as well as 'type', which is a string
 *     containing the type of color format passed in ('hex', 'rgb', 'named').
 */
goog.color.parse = function(str) {
  var result = {};
  str = String(str);

  var maybeHex = goog.color.prependPoundIfNecessary_(str);
  if (goog.color.isValidHexColor_(maybeHex)) {
    result.hex = goog.color.normalizeHex(maybeHex);
    result.type = 'hex';
    return result;
  } else {
    var rgb = goog.color.isValidRgbColor_(str);
    if (rgb.length) {
      result.hex = goog.color.rgbArrayToHex(rgb);
      result.type = 'rgb';
      return result;
    } else if (goog.color.names) {
      var hex = goog.color.names[str.toLowerCase()];
      if (hex) {
        result.hex = hex;
        result.type = 'named';
        return result;
      }
    }
  }
  throw Error(str + ' is not a valid color string');
};


/**
 * Parses red, green, blue components out of a valid rgb color string.
 * @param {string} str RGB representation of a color.
 *    {@see goog.color.isValidRgbColor_}.
 * @return {!Array.<number>} array containing [r, g, b], each an int in
 *    [0, 255].
 */
goog.color.parseRgb = function(str) {
  var rgb = goog.color.isValidRgbColor_(str);
  if (!rgb.length) {
    throw Error(str + ' is not a valid RGB color');
  }
  return rgb;
};


/**
 * Converts a hex representation of a color to RGB.
 * @param {string} hexColor Color to convert.
 * @return {string} string of the form 'rgb(R,G,B)' which can be used in
 *    styles.
 */
goog.color.hexToRgbStyle = function(hexColor) {
  return goog.color.rgbStyle_(goog.color.hexToRgb(hexColor));
};


/**
 * Regular expression for extracting the digits in a hex color triplet.
 * @type {RegExp}
 * @private
 */
goog.color.hexTripletRe_ = /#(.)(.)(.)/;


/**
 * Normalize an hex representation of a color
 * @param {string} hexColor an hex color string.
 * @return {string} hex color in the format '#rrggbb' with all lowercase
 *     literals.
 */
goog.color.normalizeHex = function(hexColor) {
  if (!goog.color.isValidHexColor_(hexColor)) {
    throw Error("'" + hexColor + "' is not a valid hex color");
  }
  if (hexColor.length == 4) { // of the form #RGB
    hexColor = hexColor.replace(goog.color.hexTripletRe_, '#$1$1$2$2$3$3');
  }
  return hexColor.toLowerCase();
};


/**
 * Converts a hex representation of a color to RGB.
 * @param {string} hexColor Color to convert.
 * @return {!Array} array containing [r, g, b] as ints in [0, 255].
 */
goog.color.hexToRgb = function(hexColor) {
  hexColor = goog.color.normalizeHex(hexColor);
  var r = parseInt(hexColor.substr(1, 2), 16);
  var g = parseInt(hexColor.substr(3, 2), 16);
  var b = parseInt(hexColor.substr(5, 2), 16);

  return [r, g, b];
};


/**
 * Converts a color from RGB to hex representation.
 * @param {number} r Amount of red, int between 0 and 255.
 * @param {number} g Amount of green, int between 0 and 255.
 * @param {number} b Amount of blue, int between 0 and 255.
 * @return {string} hex representation of the color.
 */
goog.color.rgbToHex = function(r, g, b) {
  r = Number(r);
  g = Number(g);
  b = Number(b);
  if (isNaN(r) || r < 0 || r > 255 ||
      isNaN(g) || g < 0 || g > 255 ||
      isNaN(b) || b < 0 || b > 255) {
    throw Error('"(' + r + ',' + g + ',' + b + '") is not a valid RGB color');
  }
  var hexR = goog.color.prependZeroIfNecessary_(r.toString(16));
  var hexG = goog.color.prependZeroIfNecessary_(g.toString(16));
  var hexB = goog.color.prependZeroIfNecessary_(b.toString(16));
  return '#' + hexR + hexG + hexB;
};


/**
 * Converts a color from RGB to hex representation.
 * @param {Array.<number>} rgb Array of [r, g, b], with each value in [0, 255].
 * @return {string} hex representation of the color.
 */
goog.color.rgbArrayToHex = function(rgb) {
  return goog.color.rgbToHex(rgb[0], rgb[1], rgb[2]);
};


/**
 * Converts a color from RGB color space to HSL color space.
 * Modified from {@link http://en.wikipedia.org/wiki/HLS_color_space}.
 * @param {number} r Value of red, in [0, 255].
 * @param {number} g Value of green, in [0, 255].
 * @param {number} b Value of blue, in [0, 255].
 * @return {!Array.<number>} [h, s, l] values for the color, with h an int in
 *    [0, 360] and s and l in [0, 1].
 */
goog.color.rgbToHsl = function(r, g, b) {
  // First must normalize r, g, b to be between 0 and 1.
  var normR = r / 255;
  var normG = g / 255;
  var normB = b / 255;
  var max = Math.max(normR, normG, normB);
  var min = Math.min(normR, normG, normB);
  var h = 0;
  var s = 0;

  // Luminosity is the average of the max and min rgb color intensities.
  var l = 0.5 * (max + min);

  // The hue and saturation are dependent on which color intensity is the max.
  // If max and min are equal, the color is gray and h and s should be 0.
  if (max != min) {
    if (max == normR) {
      h = 60 * (normG - normB) / (max - min);
    } else if (max == normG) {
      h = 60 * (normB - normR) / (max - min) + 120;
    } else if (max == normB) {
      h = 60 * (normR - normG) / (max - min) + 240;
    }

    if (0 < l && l <= 0.5) {
      s = (max - min) / (2 * l);
    } else {
      s = (max - min) / (2 - 2 * l);
    }
  }

  // Make sure the hue falls between 0 and 360.
  return [Math.round(h + 360) % 360, s, l];
};


/**
 * Converts a color from RGB color space to HSL color space.
 * @param {Array.<number>} rgb [r, g, b] values for the color, each in [0, 255].
 * @return {!Array.<number>} [h, s, l] values for the color, with h in [0, 360]
 *    and s and l in [0, 1].
 */
goog.color.rgbArrayToHsl = function(rgb) {
  return goog.color.rgbToHsl(rgb[0], rgb[1], rgb[2]);
};

/**
 * Helper for hslToRgb.
 * @param {number} v1 Helper variable 1.
 * @param {number} v2 Helper variable 2.
 * @param {number} vH Helper variable 3.
 * @return {number} Appropriate RGB value, given the above.
 * @private
 */
goog.color.hueToRgb_ = function(v1, v2, vH) {
  if (vH < 0) {
    vH += 1;
  } else if (vH > 1) {
    vH -= 1;
  }
  if ((6 * vH) < 1) {
    return (v1 + (v2 - v1) * 6 * vH);
  } else if (2 * vH < 1) {
    return v2;
  } else if (3 * vH < 2) {
    return (v1 + (v2 - v1) * ((2 / 3) - vH) * 6);
  }
  return v1;
};


/**
 * Converts a color from HSL color space to RGB color space.
 * Modified from {@link http://www.easyrgb.com/math.html}
 * @param {number} h Hue, in [0, 360].
 * @param {number} s Saturation, in [0, 1].
 * @param {number} l Luminosity, in [0, 1].
 * @return {!Array.<number>} [r, g, b] values for the color, with each an int in
 *    [0, 255].
 */
goog.color.hslToRgb = function(h, s, l) {
  var r = 0;
  var g = 0;
  var b = 0;
  var normH = h / 360; // normalize h to fall in [0, 1]

  if (s == 0) {
    r = g = b = l * 255;
  } else {
    var temp1 = 0;
    var temp2 = 0;
    if (l < 0.5) {
      temp2 = l * (1 + s);
    } else {
      temp2 = l + s - (s * l);
    }
    temp1 = 2 * l - temp2;
    r = 255 * goog.color.hueToRgb_(temp1, temp2, normH + (1 / 3));
    g = 255 * goog.color.hueToRgb_(temp1, temp2, normH);
    b = 255 * goog.color.hueToRgb_(temp1, temp2, normH - (1 / 3));
  }

  return [Math.round(r), Math.round(g), Math.round(b)];
};


/**
 * Converts a color from HSL color space to RGB color space.
 * @param {Array.<number>} hsl HSL values for the color, h in [0, 360], s and l
 *    in [0, 1].
 * @return {!Array.<number>} [r, g, b] values for the color, with each an int in
 *    [0, 255].
 */
goog.color.hslArrayToRgb = function(hsl) {
  return goog.color.hslToRgb(hsl[0], hsl[1], hsl[2]);
};


/**
 * Helper for isValidHexColor_.
 * @type {RegExp}
 * @private
 */
goog.color.validHexColorRe_ = /^#(?:[0-9a-f]{3}){1,2}$/i;

/**
 * Checks if a string is a valid hex color.  We expect strings of the format
 * #RRGGBB (ex: #1b3d5f) or #RGB (ex: #3CA == #33CCAA).
 * @param {string} str String to check.
 * @return {boolean} Whether the string is a valid hex color.
 * @private
 */
goog.color.isValidHexColor_ = function(str) {
  return goog.color.validHexColorRe_.test(str);
};

/**
 * Helper for isNormalizedHexColor_.
 * @type {RegExp}
 * @private
 */
goog.color.normalizedHexColorRe_ = /^#[0-9a-f]{6}$/;

/**
 * Checks if a string is a normalized hex color.
 * We expect strings of the format #RRGGBB (ex: #1b3d5f)
 * using only lowercase letters.
 * @param {string} str String to check.
 * @return {boolean} Whether the string is a normalized hex color.
 * @private
 */
goog.color.isNormalizedHexColor_ = function(str) {
  return goog.color.normalizedHexColorRe_.test(str);
};


/**
 * Regular expression for matching and capturing RGB style strings. Helper for
 * isValidRgbColor_.
 * @type {RegExp}
 * @private
 */
goog.color.rgbColorRe_ =
   /^(?:rgb)?\((0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2})\)$/i;

/**
 * Checks if a string is a valid rgb color.  We expect strings of the format
 * '(r, g, b)', or 'rgb(r, g, b)', where each color component is an int in
 * [0, 255].
 * @param {string} str String to check.
 * @return {!Array.<number>} the integers [r, g, b] for valid colors or the
 *    empty array for invalid colors.
 * @private
 */
goog.color.isValidRgbColor_ = function(str) {
  // Each component is separate (rather than using a repeater) so we can
  // capture the match. Also, we explicitly set each component to be either 0,
  // or start with a non-zero, to prevent octal numbers from slipping through.
  var regExpResultArray = str.match(goog.color.rgbColorRe_);
  if (regExpResultArray) {
    var r = Number(regExpResultArray[1]);
    var g = Number(regExpResultArray[2]);
    var b = Number(regExpResultArray[3]);
    if (r >= 0 && r <= 255 &&
        g >= 0 && g <= 255 &&
        b >= 0 && b <= 255) {
      return [r, g, b];
    }
  }
  return [];
};


/**
 * Takes a hex value and prepends a zero if it's a single digit.
 * @param {string} hex Hex value to prepend if single digit.
 * @return {string} hex value prepended with zero if it was single digit,
 *    otherwise the same value that was passed in.
 * @private
 */
goog.color.prependZeroIfNecessary_ = function(hex) {
  return hex.length == 1 ? '0' + hex : hex;
};


/**
 * Takes a string a prepends a '#' sign if one doesn't exist.
 * @param {string} str String to check.
 * @return {string} The value passed in, prepended with a '#' if it didn't
 *    already have one.
 * @private
 */
goog.color.prependPoundIfNecessary_ = function(str) {
  return str.charAt(0) == '#' ? str : '#' + str;
};


/**
 * Takes an array of [r, g, b] and converts it into a string appropriate for
 * CSS styles.
 * @param {Array.<number>} rgb [r, g, b] with each value in [0, 255].
 * @return {string} string of the form 'rgb(r,g,b)'.
 * @private
 */
goog.color.rgbStyle_ = function(rgb) {
  return 'rgb(' + rgb.join(',') + ')';
};


/**
 * Converts an HSV triplet to an RGB array.  V is brightness because b is
 *   reserved for blue in RGB.
 * @param {number} h Hue value in [0, 1].
 * @param {number} s Saturation value in [0, 1].
 * @param {number} brightness brightness in [0, 255].
 * @return {!Array.<number>} Array of r,g,b values.
 */
goog.color.hsvToRgb = function(h, s, brightness) {
  var red = 0;
  var green = 0;
  var blue = 0;
  if (s == 0) {
    red = brightness;
    green = brightness;
    blue = brightness;
  } else {
    var sextant = Math.floor(h / 60);
    var remainder = (h / 60) - sextant;
    var val1 = brightness * (1 - s);
    var val2 = brightness * (1 - (s * remainder));
    var val3 = brightness * (1 - (s * (1 - remainder)));
    switch (sextant) {
      case 1:
        red = val2;
        green = brightness;
        blue = val1;
        break;
      case 2:
        red = val1;
        green = brightness;
        blue = val3;
        break;
      case 3:
        red = val1;
        green = val2;
        blue = brightness;
        break;
      case 4:
        red = val3;
        green = val1;
        blue = brightness;
        break;
      case 5:
        red = brightness;
        green = val1;
        blue = val2;
        break;
      case 6:
      case 0:
        red = brightness;
        green = val3;
        blue = val1;
        break;
    }
  }

  return [Math.floor(red), Math.floor(green), Math.floor(blue)];
};

/**
 * Converts from RGB values to an array of HSV values.
 * @param {number} red Red value.
 * @param {number} green Green value.
 * @param {number} blue Blue value.
 * @return {!Array.<number>} array of HSV values.
 */
goog.color.rgbToHsv = function(red, green, blue) {

  var max = Math.max(Math.max(red, green), blue);
  var min = Math.min(Math.min(red, green), blue);
  var hue;
  var saturation;
  var value = max;
  if (min == max) {
    hue = 0;
    saturation = 0;
  } else {
    var delta = (max - min);
    saturation = delta / max;

    if (red == max) {
      hue = (green - blue) / delta;
    } else if (green == max) {
      hue = 2 + ((blue - red) / delta);
    } else {
      hue = 4 + ((red - green) / delta);
    }
    hue *= 60;
    if (hue < 0) {
      hue += 360;
    }
    if (hue > 360) {
      hue -= 360;
    }
  }

  return [hue, saturation, value];
};

/**
 * Converts from r,g,b values to an array of HSV values
 * @param {Array.<number>} rgb RGB array.
 * @return {!Array.<number>} array of HSV values.
 */
goog.color.rgbArrayToHsv = function(rgb) {
  return goog.color.rgbToHsv(rgb[0], rgb[1], rgb[2]);
};

/**
 * Converts an HSV triplet to an RGB array
 * @param {Array.<number>} hsv Array of HSV values.
 * @return {!Array.<number>} Array of r,g,b values.
 */
goog.color.hsvArrayToRgb = function(hsv) {
  return goog.color.hsvToRgb(hsv[0], hsv[1], hsv[2]);
};

/**
 * Converts a hex representation of a color to HSL.
 * @param {string} hex Color to convert.
 * @return {!Array.<number>} [h, s, l] values for the color, with h an int in
 *    [0, 360] and s and l in [0, 1].
 */
goog.color.hexToHsl = function(hex) {
  var rgb = goog.color.hexToRgb(hex);
  return goog.color.rgbToHsl(rgb[0], rgb[1], rgb[2]);
};

/**
 * Converts from h,s,l values to a hex string
 * @param {number} h Hue, in [0, 360].
 * @param {number} s Saturation, in [0, 1].
 * @param {number} l Luminosity, in [0, 1].
 * @return {string} hex representation of the color.
 */
goog.color.hslToHex = function(h, s, l) {
  return goog.color.rgbArrayToHex(goog.color.hslToRgb(h, s, l));
};

/**
 * Converts from an hsl array to a hex string
 * @param {Array.<number>} hsl Array of [h, s, l], in
 *     [[0, 360], [0, 1], [0, 1]].
 * @return {string} hex representation of the color.
 */
goog.color.hslArrayToHex = function(hsl) {
  return goog.color.rgbArrayToHex(goog.color.hslToRgb(hsl[0], hsl[1], hsl[2]));
};

/**
 * Converts a hex representation of a color to HSV
 * @param {string} hex Color to convert.
 * @return {!Array.<number>} [h, s, v] in [[0, 1], [0, 1], [0, 255]].
 */
goog.color.hexToHsv = function(hex) {
  return goog.color.rgbArrayToHsv(goog.color.hexToRgb(hex));
};

/**
 * Converts from h,s,v values to a hex string
 * @param {number} h Hue, in [0, 1].
 * @param {number} s Saturation, in [0, 1].
 * @param {number} v Value, in [0, 255].
 * @return {string} hex representation of the color.
 */
goog.color.hsvToHex = function(h, s, v) {
  return goog.color.rgbArrayToHex(goog.color.hsvToRgb(h, s, v));
};

/**
 * Converts from an HSV array to a hex string
 * @param {Array} hsv Array of [h, s, v] in [[0, 1], [0, 1], [0, 255]].
 * @return {string} hex representation of the color.
 */
goog.color.hsvArrayToHex = function(hsv) {
  return goog.color.hsvToHex(hsv[0], hsv[1], hsv[2]);
};


/**
 * Calculates the Euclidean distance between two color vectors on an HSL sphere.
 * A demo of the sphere can be found at:
 * http://en.wikipedia.org/wiki/HSL_color_space
 * In short, a vector for color (H, S, L) in this system can be expressed as
 * (S*L'*cos(2*PI*H), S*L'*sin(2*PI*H), L), where L' = abs(L - 0.5), and we
 * simply calculate the 1-2 distance using these coordinates
 * @param {Array.<number>} hsl1 First color represented by a 3-element array
 *     with hue in range [0, 360], and saturation and luminance values in the
 *     range[0, 1].
 * @param {Array.<number>} hsl2 Second color represented by a 3-element array
 *     with hue in range [0, 360], and saturation and luminance values in the
 *     range[0, 1].
 * @return {number} Distance between the two colors, in the range [0, 1].
 */
goog.color.hslDistance = function(hsl1, hsl2) {
  var sl1, sl2;
  if (hsl1[2] <= 0.5) {
    sl1 = hsl1[1] * hsl1[2];
  } else {
    sl1 = hsl1[1] * (1.0 - hsl1[2]);
  }

  if (hsl2[2] <= 0.5) {
    sl2 = hsl2[1] * hsl2[2];
  } else {
    sl2 = hsl2[1] * (1.0 - hsl2[2]);
  }

  var h1 = hsl1[0] / 360.0;
  var h2 = hsl2[0] / 360.0;
  var dh = (h1 - h2) * 2.0 * Math.PI;
  return (hsl1[2] - hsl2[2]) * (hsl1[2] - hsl2[2]) +
      sl1 * sl1 + sl2 * sl2 - 2 * sl1 * sl2 * Math.cos(dh);
};


/**
 * Blend two colors together, using the specified factor to indicate the weight
 * given to the first color
 * @param {Array.<number>} rgb1 First color represented by a 3-element array
 *     with red, green, and blue values respectively, in the range [0, 255].
 * @param {Array.<number>} rgb2 Second color represented by a 3-element array
 *     with red, green, and blue values respectively, in the range [0, 255].
 * @param {number} factor The weight to be given to rgb1 over rgb2. Values
 *     should be in the range [0, 1]. If less than 0, factor will be set to 0.
 *     If greater than 1, factor will be set to 1.
 * @return {!Array.<number>} Combined color represented by a 3-element
 *     array with red, green, and blue values respectively, in the
 *     range [0, 255].
 */
goog.color.blend = function(rgb1, rgb2, factor) {
  factor = goog.math.clamp(factor, 0, 1);

  return [
    Math.round(factor * rgb1[0] + (1.0 - factor) * rgb2[0]),
    Math.round(factor * rgb1[1] + (1.0 - factor) * rgb2[1]),
    Math.round(factor * rgb1[2] + (1.0 - factor) * rgb2[2])
  ];
};


/**
 * Adds black to the specified color, darkening it
 * @param {Array.<number>} rgb Color represented by a 3-element array with
 *     red, green, and blue values respectively, in the range [0, 255].
 * @param {number} factor Number in the range [0, 1]. 0 will do nothing, while
 *     1 will return black. If less than 0, factor will be set to 0. If greater
 *     than 1, factor will be set to 1.
 * @return {!Array.<number>} Combined color represented by a 3-element array
 *     with red, green, and blue values respectively, in the range [0, 255].
 */
goog.color.darken = function(rgb, factor) {
  var black = [0, 0, 0];
  return goog.color.blend(black, rgb, factor);
};


/**
 * Adds white to the specified color, lightening it
 * @param {Array.<number>} rgb Color represented by a 3-element array with
 *     red, green, and blue values respectively, in the range [0, 255].
 * @param {number} factor Number in the range [0, 1].  0 will do nothing, while
 *     1 will return white. If less than 0, factor will be set to 0. If greater
 *     than 1, factor will be set to 1.
 * @return {!Array.<number>} Combined color represented by a 3-element array
 *     with red, green, and blue values respectively, in the range [0, 255].
 */
goog.color.lighten = function(rgb, factor) {
  var white = [255, 255, 255];
  return goog.color.blend(white, rgb, factor);
};


/**
 * Find the "best" (highest-contrast) of the suggested colors for the prime
 * color. Uses W3C formula for judging readability and visual accessibility:
 * http://www.w3.org/TR/AERT#color-contrast
 * @param {Array.<number>} prime Color represented by a 3-element array with
 *     red, green, and blue values respectively, in the range [0, 255].
 * @param {Array.<Array>} suggestions Array of colors, each a 3-element array
 *     with red, green, and blue values respectively, in the range [0, 255].
 * @return {!Array.<number>} Highest-contrast color represented by a 3-element
 *     array with red, green and blue values respectively, in the range
 *     [0, 255].
 */
goog.color.highContrast = function(prime, suggestions) {
  var suggestionsWithDiff = [];
  for (var i = 0; i < suggestions.length; i++) {
    suggestionsWithDiff.push({
      color: suggestions[i],
      diff: goog.color.yiqBrightnessDiff_(suggestions[i], prime) +
          goog.color.colorDiff_(suggestions[i], prime)
    });
  }
  suggestionsWithDiff.sort(function(a, b) {
    return b.diff - a.diff;
  });
  return suggestionsWithDiff[0].color;
};


/**
 * Calculate brightness of a color according to YIQ formula (brightness is Y).
 * More info on YIQ here: http://en.wikipedia.org/wiki/YIQ. Helper method for
 * goog.color.highContrast()
 * @param {Array.<number>} rgb Color represented by a 3-element array with
 *     red, green, and blue values respectively, in the range [0, 255].
 * @return {number} brightness (Y).
 * @private
 */
goog.color.yiqBrightness_ = function(rgb) {
  return Math.round((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000);
};


/**
 * Calculate difference in brightness of two colors. Helper method for
 * goog.color.highContrast()
 * @param {Array.<number>} rgb1 Color represented by a 3-element array with
 *     red, green, and blue values respectively, in the range [0, 255].
 * @param {Array.<number>} rgb2 Color represented by a 3-element array with
 *     red, green, and blue values respectively, in the range [0, 255].
 * @return {number} Brightness difference.
 * @private
 */
goog.color.yiqBrightnessDiff_ = function(rgb1, rgb2) {
  return Math.abs(goog.color.yiqBrightness_(rgb1) -
                  goog.color.yiqBrightness_(rgb2));
};


/**
 * Calculate color difference between two colors. Helper method for
 * goog.color.highContrast()
 * @param {Array.<number>} rgb1 Color represented by a 3-element array with
 *     red, green, and blue values respectively, in the range [0, 255].
 * @param {Array.<number>} rgb2 Color represented by a 3-element array with
 *     red, green, and blue values respectively, in the range [0, 255].
 * @return {number} Color difference.
 * @private
 */
goog.color.colorDiff_ = function(rgb1, rgb2) {
  return Math.abs(rgb1[0] - rgb2[0]) + Math.abs(rgb1[1] - rgb2[1]) +
      Math.abs(rgb1[2] - rgb2[2]);
};

// Input 28
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview A timer class to which other classes and objects can
 * listen on.  This is only an abstraction above setInterval.
 *
 * @see ../demos/timers.html
 */

goog.provide('goog.Timer');

goog.require('goog.events.EventTarget');



/**
 * Class for handling timing events.
 *
 * @param {number=} opt_interval Number of ms between ticks (Default: 1ms).
 * @param {Object=} opt_timerObject  An object that has setTimeout, setInterval,
 *     clearTimeout and clearInterval (eg Window).
 * @constructor
 * @extends {goog.events.EventTarget}
 */
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);

  /**
   * Number of ms between ticks
   * @type {number}
   * @private
   */
  this.interval_ = opt_interval || 1;

  /**
   * An object that implements setTimout, setInterval, clearTimeout and
   * clearInterval. We default to the window object. Changing this on
   * goog.Timer.prototype changes the object for all timer instances which can
   * be useful if your environment has some other implementation of timers than
   * the window object.
   * @type {Object}
   * @private
   */
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;

  /**
   * Cached tick_ bound to the object for later use in the timer.
   * @type {Function}
   * @private
   */
  this.boundTick_ = goog.bind(this.tick_, this);

 /**
  * Firefox browser often fires the timer event sooner
  * (sometimes MUCH sooner) than the requested timeout. So we
  * compare the time to when the event was last fired, and
  * reschedule if appropriate. See also goog.Timer.intervalScale
  * @type {number}
  * @private
  */
  this.last_ = goog.now();
};
goog.inherits(goog.Timer, goog.events.EventTarget);


/**
 * Maximum timeout value.
 *
 * Timeout values too big to fit into a signed 32-bit integer may cause
 * overflow in FF, Safari, and Chrome, resulting in the timeout being
 * scheduled immediately.  It makes more sense simply not to schedule these
 * timeouts, since 24.8 days is beyond a reasonable expectation for the
 * browser to stay open.
 *
 * @type {number}
 * @private
 */
goog.Timer.MAX_TIMEOUT_ = 2147483647;


/**
 * Whether this timer is enabled
 * @type {boolean}
 */
goog.Timer.prototype.enabled = false;


/**
 * An object that implements setTimout, setInterval, clearTimeout and
 * clearInterval. We default to the window object. Changing this on
 * goog.Timer.prototype changes the object for all timer instances which can be
 * useful if your environment has some other implementation of timers than the
 * window object.
 * @type {Object}
 */
goog.Timer.defaultTimerObject = goog.global['window'];


/**
 * A variable that controls the timer error correction. If the
 * timer is called before the requested interval times
 * intervalScale, which often happens on mozilla, the timer is
 * rescheduled. See also this.last_
 * @type {number}
 */
goog.Timer.intervalScale = 0.8;


/**
 * Variable for storing the result of setInterval
 * @type {?number}
 * @private
 */
goog.Timer.prototype.timer_ = null;


/**
 * Gets the interval of the timer.
 * @return {number} interval Number of ms between ticks.
 */
goog.Timer.prototype.getInterval = function() {
  return this.interval_;
};


/**
 * Sets the interval of the timer.
 * @param {number} interval Number of ms between ticks.
 */
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if (this.timer_ && this.enabled) {
    // Stop and then start the timer to reset the interval.
    this.stop();
    this.start();
  } else if (this.timer_) {
    this.stop();
  }
};


/**
 * Callback for the setInterval used by the timer
 * @private
 */
goog.Timer.prototype.tick_ = function() {
  if (this.enabled) {
    var elapsed = goog.now() - this.last_;
    if (elapsed > 0 &&
        elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_,
          this.interval_ - elapsed);
      return;
    }

    this.dispatchTick();
    // The timer could be stopped in the timer event handler.
    if (this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_,
          this.interval_);
      this.last_ = goog.now();
    }
  }
};


/**
 * Dispatches the TICK event. This is its own method so subclasses can override.
 */
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK);
};


/**
 * Starts the timer.
 */
goog.Timer.prototype.start = function() {
  this.enabled = true;

  // If there is no interval already registered, start it now
  if (!this.timer_) {
    // IMPORTANT!
    // window.setInterval in FireFox has a bug - it fires based on
    // absolute time, rather than on relative time. What this means
    // is that if a computer is sleeping/hibernating for 24 hours
    // and the timer interval was configured to fire every 1000ms,
    // then after the PC wakes up the timer will fire, in rapid
    // succession, 3600*24 times.
    // This bug is described here and is already fixed, but it will
    // take time to propagate, so for now I am switching this over
    // to setTimeout logic.
    //     https://bugzilla.mozilla.org/show_bug.cgi?id=376643
    //
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_,
        this.interval_);
    this.last_ = goog.now();
  }
};


/**
 * Stops the timer.
 */
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if (this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null;
  }
};


/**
 * Disposes of the timer.
 */
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_;
};


/**
 * Constant for the timer's event type
 * @type {string}
 */
goog.Timer.TICK = 'tick';


/**
 * Calls the given function once, after the optional pause
 * @param {Function} listener Function or object that has a handleEvent method.
 * @param {number=} opt_interval Number of ms between ticks (Default: 1ms).
 * @param {Object=} opt_handler Object in whose scope to call the listener.
 * @return {number} A handle to the timer ID.
 */
goog.Timer.callOnce = function(listener, opt_interval, opt_handler) {
  if (goog.isFunction(listener)) {
    if (opt_handler) {
      listener = goog.bind(listener, opt_handler);
    }
  } else if (listener && typeof listener.handleEvent == 'function') {
    // using typeof to prevent strict js warning
    listener = goog.bind(listener.handleEvent, listener);
  } else {
   throw Error('Invalid listener argument');
  }

  if (opt_interval > goog.Timer.MAX_TIMEOUT_) {
    // Timeouts greater than MAX_INT return immediately due to integer
    // overflow in many browsers.  Since MAX_INT is 24.8 days, just don't
    // schedule anything at all.
    return -1;
  } else {
    return goog.Timer.defaultTimerObject.setTimeout(
        listener, opt_interval || 0);
  }
};


/**
 * Clears a timeout initiated by callOnce
 * @param {?number} timerId a timer ID.
 */
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId);
};

// Input 29
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Set of objects that allow animation and visual effects to be
 * easily achieved.
 *
 * (Based loosly on my animation code for 13thparallel.org, with extra
 * inspiration from the DojoToolkit's modifications to my code)
 */

goog.provide('goog.fx');
goog.provide('goog.fx.Animation');
goog.provide('goog.fx.Animation.EventType');
goog.provide('goog.fx.Animation.State');
goog.provide('goog.fx.AnimationEvent');
goog.provide('goog.fx.easing');

goog.require('goog.Timer');
goog.require('goog.array');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.object');


//==============================================================================
// Constants
//==============================================================================


/**
 * Default timeout for animations (in milliseconds).
 * @type {number}
 */
goog.fx.TIMEOUT = 20;



/**
 * Ease in - Start slow and speed up.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 */
goog.fx.easing.easeIn = function(t) {
  return t * t * t;
};

/**
 * Ease out - Start fastest and slows to a stop.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 */
goog.fx.easing.easeOut = function(t) {
  return 1 - Math.pow(1 - t, 3);
};


/**
 * Ease in and out - Start slow, speed up, then slow down.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 */
goog.fx.easing.inAndOut = function(t) {
  return 3 * t * t - 2 * t * t * t;
};



/**
 * Constructor for an animation object.
 * @param {Array.<number>} start Array for start coordinates.
 * @param {Array.<number>} end Array for end coordinates.
 * @param {number} duration Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
goog.fx.Animation = function(start, end, duration, opt_acc) {
  goog.events.EventTarget.call(this);

  if (!goog.isArray(start) || !goog.isArray(end)) {
    throw Error('Start and end parameters must be arrays');
  }

  if (start.length != end.length) {
    throw Error('Start and end points must be the same length');
  }

  /**
   * Start point.
   * @type {Array.<number>}
   * @protected
   */
  this.startPoint = start;

  /**
   * End point.
   * @type {Array.<number>}
   * @protected
   */
  this.endPoint = end;

  /**
   * Duration of animation in milliseconds.
   * @type {number}
   * @protected
   */
  this.duration = duration;

  /**
   * Acceleration function, which must return a number between 0 and 1 for
   * inputs between 0 and 1.
   * @type {Function|undefined}
   * @private
   */
  this.accel_ = opt_acc;

  /**
   * Current coordinate for animation.
   * @type {Array.<number>}
   * @protected
   */
  this.coords = [];
};
goog.inherits(goog.fx.Animation, goog.events.EventTarget);


/**
 * Events fired by the animation.
 * @enum {string}
 */
goog.fx.Animation.EventType = {
  /**
   * Dispatched when played for the first time OR when it is resumed.
   */
  PLAY: 'play',

  /**
   * Dispatched only when the animation starts from the beginning.
   */
  BEGIN: 'begin',

  /**
   * Dispatched only when animation is restarted after a pause.
   */
  RESUME: 'resume',

  /**
   * Dispatched when animation comes to the end of its duration OR stop
   * is called.
   */
  END: 'end',

  /**
   * Dispatched only when stop is called.
   */
  STOP: 'stop',

  /**
   * Dispatched only when animation comes to its end naturally.
   */
  FINISH: 'finish',

  /**
   * Dispatched when an animation is paused.
   */
  PAUSE: 'pause',

  /**
   * Dispatched each frame of the animation.  This is where the actual animator
   * will listen.
   */
  ANIMATE: 'animate',

  /**
   * Dispatched when the animation is destroyed.
   */
  DESTROY: 'destroy'
};


/**
 * Enum for the possible states of an animation.
 * @enum {number}
 */
goog.fx.Animation.State = {
  STOPPED: 0,
  PAUSED: -1,
  PLAYING: 1
};


/**
 * A map of animations which should be cycled on the global timer.
 * @type {Object}
 * @private
 */
goog.fx.Animation.activeAnimations_ = {};


/**
 * An interval ID for the global timer.
 * @type {?number}
 * @private
 */
goog.fx.Animation.globalTimer_ = null;


/**
 * Cycle all registered animations.
 * @private
 */
goog.fx.Animation.cycleAnimations_ = function() {
  goog.Timer.defaultTimerObject.clearTimeout(goog.fx.Animation.globalTimer_);

  // Cycle all animations at the "same time".
  var now = goog.now();

  for (var hc in goog.fx.Animation.activeAnimations_) {
    goog.fx.Animation.activeAnimations_[hc].cycle(now);
  }

  goog.fx.Animation.globalTimer_ =
      goog.object.isEmpty(goog.fx.Animation.activeAnimations_) ?
        null :
        goog.Timer.defaultTimerObject.setTimeout(
            goog.fx.Animation.cycleAnimations_, goog.fx.TIMEOUT);
};


/**
 * Register an animation to be cycled on the global timer.
 * @param {Object} animation The animation to register.
 */
goog.fx.Animation.registerAnimation = function(animation) {
  var hc = goog.getHashCode(animation);
  if (!(hc in goog.fx.Animation.activeAnimations_)) {
    goog.fx.Animation.activeAnimations_[hc] = animation;
  }

  // If the timer is not already started, start it now.
  if (!goog.fx.Animation.globalTimer_) {
    goog.fx.Animation.globalTimer_ = goog.Timer.defaultTimerObject.setTimeout(
        goog.fx.Animation.cycleAnimations_, goog.fx.TIMEOUT);
  }
};


/**
 * Remove an animation from the list of animations which are cycled on the
 * global timer.
 * @param {Object} animation The animation to unregister.
 */
goog.fx.Animation.unregisterAnimation = function(animation) {
  var hc = goog.getHashCode(animation);
  delete goog.fx.Animation.activeAnimations_[hc];

  // If a timer is running and we no longer have any active timers we stop the
  // timers.
  if (goog.fx.Animation.globalTimer_ &&
      goog.object.isEmpty(goog.fx.Animation.activeAnimations_)) {
    goog.Timer.defaultTimerObject.clearTimeout(goog.fx.Animation.globalTimer_);
    goog.fx.Animation.globalTimer_ = null;
  }
};


/**
 * Current state of the animation.
 * @type {goog.fx.Animation.State}
 * @private
 */
goog.fx.Animation.prototype.state_ = goog.fx.Animation.State.STOPPED;


/**
 * Current frame rate.
 * @type {number}
 * @private
 */
goog.fx.Animation.prototype.fps_ = 0;


/**
 * Percent of the way through the animation.
 * @type {number}
 * @protected
 */
goog.fx.Animation.prototype.progress = 0;


/**
 * Timestamp for when animation was started.
 * @type {?number}
 * @protected
 */
goog.fx.Animation.prototype.startTime = null;


/**
 * Timestamp for when animation was started.
 * @type {?number}
 * @protected
 */
goog.fx.Animation.prototype.endTime = null;


/**
 * Timestamp for when last frame was run.
 * @type {?number}
 * @protected
 */
goog.fx.Animation.prototype.lastFrame = null;


/**
 * Starts or resumes an animation.
 * @param {boolean=} opt_restart Whether to restart the
 *     animation from the beginning if it has been paused.
 * @return {boolean} Whether animation was started.
 */
goog.fx.Animation.prototype.play = function(opt_restart) {
  if (opt_restart || this.state_ == goog.fx.Animation.State.STOPPED) {
    this.progress = 0;
    this.coords = this.startPoint;
  } else if (this.state_ == goog.fx.Animation.State.PLAYING) {
    return false;
  }

  goog.fx.Animation.unregisterAnimation(this);

  this.startTime = /** @type {number} */ (goog.now());

  if (this.state_ == goog.fx.Animation.State.PAUSED) {
    this.startTime -= this.duration * this.progress;
  }

  this.endTime = this.startTime + this.duration;
  this.lastFrame = this.startTime;

  if (!this.progress) {
    this.onBegin();
  }

  this.onPlay();

  if (this.state_ == goog.fx.Animation.State.PAUSED) {
    this.onResume();
  }

  this.state_ = goog.fx.Animation.State.PLAYING;

  goog.fx.Animation.registerAnimation(this);
  this.cycle(this.startTime);

  return true;
};


/**
 * Stops the animation.
 * @param {boolean} gotoEnd If true the animation will move to the end coords.
 */
goog.fx.Animation.prototype.stop = function(gotoEnd) {
  goog.fx.Animation.unregisterAnimation(this);
  this.state_ = goog.fx.Animation.State.STOPPED;

  if (gotoEnd) {
    this.progress = 1;
  }

  this.updateCoords_(this.progress);

  this.onStop();
  this.onEnd();
};


/**
 * Pauses the animation (iff it's playing).
 */
goog.fx.Animation.prototype.pause = function() {
  if (this.state_ == goog.fx.Animation.State.PLAYING) {
    goog.fx.Animation.unregisterAnimation(this);
    this.state_ = goog.fx.Animation.State.PAUSED;
    this.onPause();
  }
};


/**
 * Disposes of the animation.  Stops an animation, fires a 'destroy' event and
 * then removes all the event handlers to clean up memory.
 */
goog.fx.Animation.prototype.disposeInternal = function() {
  if (this.state_ != goog.fx.Animation.State.STOPPED) {
    this.stop(false);
  }
  this.onDestroy();
  goog.fx.Animation.superClass_.disposeInternal.call(this);
};


/**
 * Stops an animation, fires a 'destroy' event and then removes all the event
 * handlers to clean up memory.
 * @deprecated Use dispose() instead.
 */
goog.fx.Animation.prototype.destroy = function() {
  this.dispose();
};


/**
 * Handles the actual iteration of the animation in a timeout
 * @param {number} now The current time.
 */
goog.fx.Animation.prototype.cycle = function(now) {
  this.progress = (now - this.startTime) / (this.endTime - this.startTime);

  if (this.progress >= 1) {
    this.progress = 1;
  }

  this.fps_ = 1000 / (now - this.lastFrame);
  this.lastFrame = now;

  if (goog.isFunction(this.accel_)) {
    this.updateCoords_(this.accel_(this.progress));
  } else {
    this.updateCoords_(this.progress);
  }

  // Animation has finished.
  if (this.progress == 1) {
    this.state_ = goog.fx.Animation.State.STOPPED;
    goog.fx.Animation.unregisterAnimation(this);

    this.onFinish();
    this.onEnd();

  // Animation is still under way.
  } else if (this.state_ == goog.fx.Animation.State.PLAYING) {
    this.onAnimate();
  }
};


/**
 * Calculates current coordinates, based on the current state.
 * @param {number} t Percentage of the way through the animation as a decimal.
 * @private
 */
goog.fx.Animation.prototype.updateCoords_ = function(t) {
  this.coords = new Array(this.startPoint.length);
  for (var i = 0; i < this.startPoint.length; i++) {
    this.coords[i] = (this.endPoint[i] - this.startPoint[i]) * t +
        this.startPoint[i];
  }
};


/**
 * Dispatches the ANIMATE event. Sub classes should override this instead
 * of listening to the event.
 * @protected
 */
goog.fx.Animation.prototype.onAnimate = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.ANIMATE);
};



/**
 * Dispatches the BEGIN event. Sub classes should override this instead
 * of listening to the event.
 * @protected
 */
goog.fx.Animation.prototype.onBegin = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.BEGIN);
};


/**
 * Dispatches the DESTROY event. Sub classes should override this instead
 * of listening to the event.
 * @protected
 */
goog.fx.Animation.prototype.onDestroy = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.DESTROY);
};


/**
 * Dispatches the END event. Sub classes should override this instead
 * of listening to the event.
 * @protected
 */
goog.fx.Animation.prototype.onEnd = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.END);
};


/**
 * Dispatches the FINISH event. Sub classes should override this instead
 * of listening to the event.
 * @protected
 */
goog.fx.Animation.prototype.onFinish = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.FINISH);
};


/**
 * Dispatches the PAUSE event. Sub classes should override this instead
 * of listening to the event.
 * @protected
 */
goog.fx.Animation.prototype.onPause = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.PAUSE);
};


/**
 * Dispatches the PLAY event. Sub classes should override this instead
 * of listening to the event.
 * @protected
 */
goog.fx.Animation.prototype.onPlay = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.PLAY);
};

/**
 * Dispatches the RESUME event. Sub classes should override this instead
 * of listening to the event.
 * @protected
 */
goog.fx.Animation.prototype.onResume = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.RESUME);
};


/**
 * Dispatches the STOP event. Sub classes should override this instead
 * of listening to the event.
 * @protected
 */
goog.fx.Animation.prototype.onStop = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.STOP);
};


/**
 * Returns an event object for the current animation.
 * @param {string} type Event type that will be dispatched.
 * @private
 */
goog.fx.Animation.prototype.dispatchAnimationEvent_ = function(type) {
  this.dispatchEvent(new goog.fx.AnimationEvent(type, this));
};



/**
 * Class for an animation event object.
 * @param {string} type Event type.
 * @param {goog.fx.Animation} anim An animation object.
 * @constructor
 * @extends {goog.events.Event}
 */
goog.fx.AnimationEvent = function(type, anim) {
  goog.events.Event.call(this, type);

  /**
   * The current coordinates.
   * @type {Array.<number>}
   */
  this.coords = anim.coords;

  /**
   * The x coordinate.
   * @type {number}
   */
  this.x = anim.coords[0];

  /**
   * The y coordinate.
   * @type {number}
   */
  this.y = anim.coords[1];

  /**
   * The z coordinate.
   * @type {number}
   */
  this.z = anim.coords[2];

  /**
   * The current duration.
   * @type {number}
   */
  this.duration = anim.duration;

  /**
   * The current progress.
   * @type {number}
   */
  this.progress = anim.progress;

  /**
   * Frames per second so far.
   */
  this.fps = anim.fps_;

  /**
   * The state of the animation.
   * @type {number}
   */
  this.state = anim.state_;

  /**
   * The animation object.
   * @type {goog.fx.Animation}
   */
  // TODO: This can be removed as this is the same as the target
  this.anim = anim;
};
goog.inherits(goog.fx.AnimationEvent, goog.events.Event);


/**
 * Returns the coordinates as integers (rounded to nearest integer).
 * @return {Array.<number>} An array of the coordinates rounded to
 *     the nearest integer.
 */
goog.fx.AnimationEvent.prototype.coordsAsInts = function() {
  return goog.array.map(this.coords, Math.round);
};

// Input 30
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Utilities for element styles.
 *
 * @see ../demos/inline_block_quirks.html
 * @see ../demos/inline_block_standards.html
 * @see ../demos/style_viewport.html
 */

goog.provide('goog.style');


goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.math.Box');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Rect');
goog.require('goog.math.Size');
goog.require('goog.object');
goog.require('goog.userAgent');


/**
 * Sets a style value on an element.
 *
 * This function is not indended to patch issues in the browser's style
 * handling, but to allow easy programmatic access to setting dash-separated
 * style properties.  An example is setting a batch of properties from a data
 * object without overwriting old styles.  When possible, use native APIs:
 * elem.style.propertyKey = 'value' or (if obliterating old styles is fine)
 * elem.style.cssText = 'property1: value1; property2: value2'.
 *
 * @param {Element} element The element to change.
 * @param {string|Object} style If a string, a style name. If an object, a hash
 *     of style names to style values.
 * @param {string|number|boolean=} opt_value If style was a string, then this
 *     should be the value.
 */
goog.style.setStyle = function(element, style, opt_value) {
  if (goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style);
  } else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element));
  }
};


/**
 * Sets a style value on an element, with parameters swapped to work with
 * {@code goog.object.forEach()}.
 * @param {Element} element The element to change.
 * @param {string|number|boolean|undefined} value Style value.
 * @param {string|number|boolean} style Style name.
 * @private
 */
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.style.toCamelCase(style)] = value;
};


/**
 * Retrieves an explicitly-set style value of a node. This returns '' if there
 * isn't a style attribute on the element or if this style property has not been
 * explicitly set in script.
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get, css-style (if you have a camel-case
 * property, use element.style[style]).
 * @return {string} Style value.
 */
goog.style.getStyle = function(element, style) {
  return element.style[goog.style.toCamelCase(style)];
};


/**
 * Retrieves a computed style value of a node, or null if the value cannot be
 * computed (which will be the case in Internet Explorer).
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get (camel-case).
 * @return {?string} Style value.
 */
goog.style.getComputedStyle = function(element, style) {
  var doc = goog.dom.getOwnerDocument(element);
  if (doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, '');
    if (styles) {
      return styles[style];
    }
  }

  return null;
};


/**
 * Gets the cascaded style value of a node, or null if the value cannot be
 * computed (only Internet Explorer can do this).
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get (camel-case).
 * @return {string} Style value.
 */
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null;
};


/**
 * Cross-browser pseudo get computed style. It returns the computed style where
 * available. If not available it tries the cascaded style value (IE
 * currentStyle) and in worst case the inline style value.  It shouldn't be
 * called directly, see http://wiki/Main/ComputedStyleVsCascadedStyle for
 * discussion.
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get (must be camelCase, not css-style.).
 * @return {string} Style value.
 * @private
 */
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) ||
         goog.style.getCascadedStyle(element, style) ||
         element.style[style];
};


/**
 * Retrieves the computed value of the position CSS attribute.
 * @param {Element} element The element to get the position of.
 * @return {string} Position value.
 */
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, 'position');
};


/**
 * Retrieves the computed background color string for a given element. The
 * string returned is suitable for assigning to another element's
 * background-color, but is not guaranteed to be in any particular string
 * format. Accessing the color in a numeric form may not be possible in all
 * browsers or with all input.
 *
 * If the background color for the element is defined as a hexadecimal value,
 * the resulting string can be parsed by goog.color.parse in all supported
 * browsers.
 *
 * Whether named colors like "red" or "lightblue" get translated into a
 * format which can be parsed is browser dependent. Calling this function on
 * transparent elements will return "transparent" in most browsers or
 * "rgba(0, 0, 0, 0)" in Safari.
 * @param {Element} element The element to get the background color of.
 * @return {string} The computed string value of the background color.
 */
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, 'backgroundColor');
};


/**
 * Retrieves the computed value of the overflow-x CSS attribute.
 * @param {Element} element The element to get the overflow-x of.
 * @return {string} The computed string value of the overflow-x attribute.
 */
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, 'overflowX');
};


/**
 * Retrieves the computed value of the overflow-y CSS attribute.
 * @param {Element} element The element to get the overflow-y of.
 * @return {string} The computed string value of the overflow-y attribute.
 */
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, 'overflowY');
};


/**
 * Retrieves the computed value of the z-index CSS attribute.
 * @param {Element} element The element to get the z-index of.
 * @return {string|number} The computed value of the z-index attribute.
 */
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, 'zIndex');
};


/**
 * Retrieves the computed value of the text-align CSS attribute.
 * @param {Element} element The element to get the text-align of.
 * @return {string} The computed string value of the text-align attribute.
 */
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, 'textAlign');
};


/**
 * Retrieves the computed value of the cursor CSS attribute.
 * @param {Element} element The element to get the cursor of.
 * @return {string} The computed string value of the cursor attribute.
 */
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, 'cursor');
};


/**
 * Sets the top/left values of an element.  If no unit is specified in the
 * argument then it will add px.
 * @param {Element} el Element to move.
 * @param {string|number|goog.math.Coordinate} arg1 Left position or coordinate.
 * @param {string|number=} opt_arg2 Top position.
 */
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO &&
      (goog.userAgent.MAC || goog.userAgent.X11) &&
      goog.userAgent.isVersion('1.9');

  if (arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y;
  } else {
    x = arg1;
    y = opt_arg2;
  }

  el.style.left = typeof x == 'number' ?
      (buggyGeckoSubPixelPos ? Math.round(x) : x) + 'px' :
      /** @type {string} */ (x);
  el.style.top = typeof y == 'number' ?
      (buggyGeckoSubPixelPos ? Math.round(y) : y) + 'px' :
      /** @type {string} */ (y);
};


/**
 * Gets the offsetLeft and offsetTop properties of an element and returns them
 * in a Coordinate object
 * @param {Element} element Element.
 * @return {!goog.math.Coordinate} The position.
 */
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop);
};


/**
 * Returns the viewport element for a particular document
 * @param {Node=} opt_node DOM node (Document is OK) to get the viewport element
 *     of.
 * @return {Element} document.documentElement or document.body.
 */
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if (opt_node) {
    if (opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node;
    } else {
      doc = goog.dom.getOwnerDocument(opt_node);
    }
  } else {
    doc = goog.dom.getDocument();
  }

  // In old IE versions the document.body represented the viewport
  if (goog.userAgent.IE && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body;
  }
  return doc.documentElement;
};


/**
 * Gets the client rectangle of the DOM element.
 *
 * getBoundingClientRect is part of a new CSS object model draft (with a
 * long-time presence in IE), replacing the error-prone parent offset
 * computation and the now-deprecated Gecko getBoxObjectFor.
 *
 * This utility patches common browser bugs in getClientBoundingRect. It
 * will fail if getClientBoundingRect is unsupported.
 *
 * If the element is not in the DOM, the result is undefined, and an error may
 * be thrown depending on user agent.
 *
 * @param {Element} el The element whose bounding rectangle is being queried.
 * @return {Object} A native bounding rectangle with numerical left, top,
 *     right, and bottom.  Reported by Firefox to be of object type ClientRect.
 * @private
 */
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  // Patch the result in IE only, so that this function can be inlined if
  // compiled for non-IE.
  if (goog.userAgent.IE) {

    // In IE, most of the time, 2 extra pixels are added to the top and left
    // due to the implicit 2-pixel inset border.  In IE6/7 quirks mode and
    // IE6 standards mode, this border can be overridden by setting the
    // document element's border to zero -- thus, we cannot rely on the
    // offset always being 2 pixels.

    // In quirks mode, the offset can be determined by querying the body's
    // clientLeft/clientTop, but in standards mode, it is found by querying
    // the document element's clientLeft/clientTop.  Since we already called
    // getClientBoundingRect we have already forced a reflow, so it is not
    // too expensive just to query them all.

    // See: http://msdn.microsoft.com/en-us/library/ms536433(VS.85).aspx
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop;
  }
  return /** @type {Object} */ (rect);
};


/**
 * Returns the first parent that could affect the position of a given element.
 * @param {Element} element The element to get the offset parent for.
 * @return {Element} The first offset parent or null if one cannot be found.
 */
goog.style.getOffsetParent = function(element) {
  // element.offsetParent does the right thing in IE, in other browser it
  // only includes elements with position absolute, relative or fixed, not
  // elements with overflow set to auto or scroll.
  if (goog.userAgent.IE) {
    return element.offsetParent;
  }

  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, 'position');
  var skipStatic = positionStyle == 'fixed' || positionStyle == 'absolute';
  for (var parent = element.parentNode; parent && parent != doc;
       parent = parent.parentNode) {
    positionStyle =
        goog.style.getStyle_(/** @type {!Element} */ (parent), 'position');
    skipStatic = skipStatic && positionStyle == 'static' &&
                 parent != doc.documentElement && parent != doc.body;
    if (!skipStatic && (parent.scrollWidth > parent.clientWidth ||
                        parent.scrollHeight > parent.clientHeight ||
                        positionStyle == 'fixed' ||
                        positionStyle == 'absolute')) {
      return /** @type {!Element} */ (parent);
    }
  }
  return null;
};


/**
 * Calculates and returns the visible rectangle for a given element. Returns a
 * box describing the visible portion of the nearest scrollable ancestor.
 * Coordinates are given relative to the document.
 *
 * @param {Element} element Element to get the visible rect for.
 * @return {goog.math.Box} Bounding elementBox describing the visible rect or
 *     null if scrollable ancestor isn't inside the visible viewport.
 */
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;

  // Determine the size of the visible rect by climbing the dom accounting for
  // all scrollable containers.
  for (var el = element; el = goog.style.getOffsetParent(el); ) {
    // clientWidth is zero for inline block elements in IE.
    // on WEBKIT, body element can have clientHeight = 0 and scrollHeight > 0
    if ((!goog.userAgent.IE || el.clientWidth != 0) &&
        (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) &&
        (el.scrollWidth != el.clientWidth ||
         el.scrollHeight != el.clientHeight) &&
        goog.style.getStyle_(el, 'overflow') != 'visible') {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;

      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right,
                                   pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom,
                                    pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl;
    }
  }

  // Compensate for document scroll in non webkit browsers.
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if (goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY;
  } else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY);
  }
  if (!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY;
  }

  // Clip by the window's viewport.
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);

  return visibleRect.top >= 0 && visibleRect.left >= 0 &&
         visibleRect.bottom > visibleRect.top &&
         visibleRect.right > visibleRect.left ?
         visibleRect : null;
};


/**
 * Changes the scroll position of {@code container} with the minimum amount so
 * that the content and the borders of the given {@code element} become visible.
 * If the element is bigger than the container, its top left corner will be
 * aligned to the container's top left corner.
 *
 * @param {Element} element The element to make visible.
 * @param {Element} container The container to scroll.
 * @param {boolean=} opt_center Whether to center the element in the container.
 *     Defaults to false.
 */
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  // Absolute position of the element's border's top left corner.
  var elementPos = goog.style.getPageOffset(element);
  // Absolute position of the container's border's top left corner.
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  // Relative pos. of the element's border box to the container's content box.
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  // How much the element can move in the container, i.e. the difference between
  // the element's bottom-right-most and top-left-most position where it's
  // fully visible.
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;

  if (opt_center) {
    // All browsers round non-integer scroll positions down.
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2;
  } else {
    // This formula was designed to give the correct scroll values in the
    // following cases:
    // - element is higher than container (spaceY < 0) => scroll down by relY
    // - element is not higher that container (spaceY >= 0):
    //   - it is above container (relY < 0) => scroll up by abs(relY)
    //   - it is below container (relY > spaceY) => scroll down by relY - spaceY
    //   - it is in the container => don't scroll
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0));
  }
};


/**
 * Returns clientLeft (width of the left border and, if the directionality is
 * right to left, the vertical scrollbar) and clientTop as a coordinate object.
 *
 * @param {Element} el Element to get clientLeft for.
 * @return {!goog.math.Coordinate} Client left and top.
 */
goog.style.getClientLeftTop = function(el) {
  // NOTE: Gecko prior to 1.9 doesn't support clientTop/Left, see
  // https://bugzilla.mozilla.org/show_bug.cgi?id=111207
  if (goog.userAgent.GECKO && !goog.userAgent.isVersion('1.9')) {
    var left = parseFloat(goog.style.getComputedStyle(el, 'borderLeftWidth'));
    if (goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left -
          parseFloat(goog.style.getComputedStyle(el, 'borderRightWidth'));
      left += scrollbarWidth;
    }
    return new goog.math.Coordinate(left,
        parseFloat(goog.style.getComputedStyle(el, 'borderTopWidth')));
  }

  return new goog.math.Coordinate(el.clientLeft, el.clientTop);
};


/**
 * Returns a Coordinate object relative to the top-left of the HTML document.
 * Implemented as a single function to save having to do two recursive loops in
 * opera and safari just to get both coordinates.  If you just want one value do
 * use goog.style.getPageOffsetLeft() and goog.style.getPageOffsetTop(), but
 * note if you call both those methods the tree will be analysed twice.
 *
 * @param {Element} el Element to get the page offset for.
 * @return {!goog.math.Coordinate} The page offset.
 */
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, 'position');

  // NOTE: Gecko pre 1.9 normally use getBoxObjectFor to calculate the
  // position. When invoked for an element with position absolute and a negative
  // position though it can be off by one. Therefor the recursive implementation
  // is used in those (relatively rare) cases.
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor &&
      !el.getBoundingClientRect && positionStyle == 'absolute' &&
      (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);

  // NOTE: If element is hidden (display none or disconnected or any the
  // ancestors are hidden) we get (0,0) by default but we still do the
  // accumulation of scroll position.

  // TODO: Should we check if the node is disconnected and in that case
  //            return (0,0)?

  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if (el == viewportElement) {
    // viewport is always at 0,0 as that defined the coordinate system for this
    // function - this avoids special case checks in the code below
    return pos;
  }

  // IE and Gecko 1.9+.
  if (el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    // Must add the scroll coordinates in to get the absolute page offset
    // of element since getBoundingClientRect returns relative coordinates to
    // the viewport.
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y;

  // Gecko prior to 1.9.
  } else if (doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
    // Gecko ignores the scroll values for ancestors, up to 1.9.  See:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=328881 and
    // https://bugzilla.mozilla.org/show_bug.cgi?id=330619

    box = doc.getBoxObjectFor(el);
    // TODO: Fix the off-by-one error when window is scrolled down
    // or right more than 1 pixel. The viewport offset does not move in lock
    // step with the window scroll; it moves in increments of 2px and at
    // somewhat random intervals.
    var vpBox = doc.getBoxObjectFor(viewportElement);
    pos.x = box.screenX - vpBox.screenX;
    pos.y = box.screenY - vpBox.screenY;

  // Safari, Opera and Camino up to 1.0.4.
  } else {
    var parent = el;
    do {
      pos.x += parent.offsetLeft;
      pos.y += parent.offsetTop;
      // For safari/chrome, we need to add parent's clientLeft/Top as well.
      if (parent != el) {
        pos.x += parent.clientLeft || 0;
        pos.y += parent.clientTop || 0;
      }
      // In Safari when hit a position fixed element the rest of the offsets
      // are not correct.
      if (goog.userAgent.WEBKIT &&
          goog.style.getComputedPosition(parent) == 'fixed') {
        pos.x += doc.body.scrollLeft;
        pos.y += doc.body.scrollTop;
        break;
      }
      parent = parent.offsetParent;
    } while (parent && parent != el)

    // Opera & (safari absolute) incorrectly account for body offsetTop.
    if (goog.userAgent.OPERA || (goog.userAgent.WEBKIT &&
        positionStyle == 'absolute')) {
      pos.y -= doc.body.offsetTop;
    }

    for (parent = el; (parent = goog.style.getOffsetParent(parent)) &&
        parent != doc.body && parent != viewportElement; ) {
      pos.x -= parent.scrollLeft;
      // Workaround for a bug in Opera 9.2 (and earlier) where table rows may
      // report an invalid scroll top value. The bug was fixed in Opera 9.5
      // however as that version supports getBoundingClientRect it won't
      // trigger this code path. https://bugs.opera.com/show_bug.cgi?id=249965
      if (!goog.userAgent.OPERA || parent.tagName != 'TR') {
        pos.y -= parent.scrollTop;
      }
    }
  }

  return pos;
};


/**
 * Returns the left coordinate of an element relative to the HTML document
 * @param {Element} el Elements.
 * @return {number} The left coordinate.
 */
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x;
};


/**
 * Returns the top coordinate of an element relative to the HTML document
 * @param {Element} el Elements.
 * @return {number} The top coordinate.
 */
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y;
};


/**
 * Returns a Coordinate object relative to the top-left of an HTML document
 * in an ancestor frame of this element. Used for measuring the position of
 * an element inside a frame relative to a containing frame.
 *
 * @param {Element} el Element to get the page offset for.
 * @param {Window} relativeWin The window to measure relative to. If relativeWin
 *     is not in the ancestor frame chain of the element, we measure relative to
 *     the top-most window.
 * @return {!goog.math.Coordinate} The page offset.
 */
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);

  // Iterate up the ancestor frame chain, keeping track of the current window
  // and the current element in that window.
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    // if we're at the top window, we want to get the page offset.
    // if we're at an inner frame, we only want to get the window position
    // so that we can determine the actual page offset in the context of
    // the outer window.
    var offset = currentWin == relativeWin ?
        goog.style.getPageOffset(currentEl) :
        goog.style.getClientPosition(currentEl);

    position.x += offset.x;
    position.y += offset.y;
  } while (currentWin && currentWin != relativeWin &&
      (currentEl = currentWin.frameElement) &&
      (currentWin = currentWin.parent));

  return position;
};


/**
 * Translates the specified rect relative to origBase page, for newBase page.
 * If origBase and newBase are the same, this function does nothing.
 *
 * @param {goog.math.Rect} rect The source rectangle relative to origBase page,
 *     and it will have the translated result.
 * @param {goog.dom.DomHelper} origBase The DomHelper for the input rectangle.
 * @param {goog.dom.DomHelper} newBase The DomHelper for the resultant
 *     coordinate.  This must be a DOM for an ancestor frame of origBase
 *     or the same as origBase.
 */
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if (origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());

    // Adjust Body's margin.
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));

    if (goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll());
    }

    rect.left += pos.x;
    rect.top += pos.y;
  }
};


/**
 * Returns the position of an element relative to another element in the
 * document.  A relative to B
 * @param {Element|Event|goog.events.Event} a Element or mouse event whose
 *     position we're calculating.
 * @param {Element|Event|goog.events.Event} b Element or mouse event position
 *     is relative to.
 * @return {!goog.math.Coordinate} The relative position.
 */
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y);
};


/**
 * Returns the position relative to the client viewport.
 * @param {Element|Event|goog.events.Event} el Element or a mouse event object.
 * @return {!goog.math.Coordinate} The position.
 */
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if (el.nodeType == goog.dom.NodeType.ELEMENT) {
    if (el.getBoundingClientRect) {  // IE and Gecko 1.9+
      var box = goog.style.getBoundingClientRect_(/** @type {Element} */ (el));
      pos.x = box.left;
      pos.y = box.top;
    } else {
      var scrollCoord = goog.dom.getDomHelper(/** @type {Element} */ (el))
          .getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(/** @type {Element} */ (el));
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y;
    }
  } else {
    pos.x = el.clientX;
    pos.y = el.clientY;
  }

  return pos;
};


/**
 * Sets the top and left of an element such that it will have a
 *
 * @param {Element} el The element to set page offset for.
 * @param {number|goog.math.Coordinate} x Left position or coordinate obj.
 * @param {number=} opt_y Top position.
 */
goog.style.setPageOffset = function(el, x, opt_y) {
  // Get current pageoffset
  var cur = goog.style.getPageOffset(el);

  if (x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x;
  }

  // NOTE: We cannot allow strings for x and y. We could but that would
  // require us to manually transform between different units

  // Work out deltas
  var dx = x - cur.x;
  var dy = opt_y - cur.y;

  // Set position to current left/top + delta
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy);
};


/**
 * Sets the width/height values of an element.  If an argument is numeric,
 * or a goog.math.Size is passed, it is assumed to be pixels and will add
 * 'px' after converting it to an integer in string form. (This just sets the
 * CSS width and height properties so it might set content-box or border-box
 * size depending on the box model the browser is using.)
 *
 * @param {Element} element Element to move.
 * @param {string|number|goog.math.Size} w Width of the element, or a
 *     size object.
 * @param {string|number=} opt_h Height of the element. Required if w is not a
 *     size object.
 */
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if (w instanceof goog.math.Size) {
    h = w.height;
    w = w.width;
  } else {
    if (opt_h == undefined) {
      throw Error('missing height argument');
    }
    h = opt_h;
  }

  element.style.width = typeof w == 'number' ? Math.round(w) + 'px' :
                                               /** @type {string} */(w);
  element.style.height = typeof h == 'number' ? Math.round(h) + 'px' :
                                                /** @type {string} */(h);
};


/**
 * Gets the height and width of an element, even if its display is none.
 * Specifically, this returns the height and width of the border box,
 * irrespective of the box model in effect.
 * @param {Element} element Element to get width of.
 * @return {!goog.math.Size} Object with width/height properties.
 */
goog.style.getSize = function(element) {
  var hasOperaBug = goog.userAgent.OPERA && !goog.userAgent.isVersion('10');
  if (goog.style.getStyle_(element, 'display') != 'none') {
    if (hasOperaBug) {
      return new goog.math.Size(element.offsetWidth || element.clientWidth,
                                element.offsetHeight || element.clientHeight);
    } else {
      return new goog.math.Size(element.offsetWidth, element.offsetHeight);
    }
  }

  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;

  style.visibility = 'hidden';
  style.position = 'absolute';
  style.display = 'inline';

  var originalWidth, originalHeight;
  if (hasOperaBug) {
    originalWidth = element.offsetWidth || element.clientWidth;
    originalHeight = element.offsetHeight || element.clientHeight;
  } else {
    originalWidth = element.offsetWidth;
    originalHeight = element.offsetHeight;
  }

  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;

  return new goog.math.Size(originalWidth, originalHeight);
};


/**
 * Returns a bounding rectangle for a given element in page space.
 * @param {Element} element Element to get bounds of.
 * @return {!goog.math.Rect} Bounding rectangle for the element.
 */
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height);
};


/**
 * A memoized cache for goog.style.toCamelCase.
 * @type {Object}
 * @private
 */
goog.style.toCamelCaseCache_ = {};


/**
 * Converts a CSS selector in the form style-property to styleProperty
 * @param {*} selector CSS Selector.
 * @return {string} Camel case selector.
 */
goog.style.toCamelCase = function(selector) {
  return goog.style.toCamelCaseCache_[selector] ||
    (goog.style.toCamelCaseCache_[selector] =
        String(selector).replace(/\-([a-z])/g, function(all, match) {
          return match.toUpperCase();
        }));
};


/**
 * Converts a CSS selector in the form styleProperty to style-property
 * @param {string} selector Camel case selector.
 * @return {string} Selector cased.
 */
goog.style.toSelectorCase = function(selector) {
  return selector.replace(/([A-Z])/g, '-$1').toLowerCase();
};


/**
 * Gets the opacity of a node (x-browser). This gets the inline style opacity
 * of the node, and does not take into account the cascaded or the computed
 * style for this node.
 * @param {Element} el Element whose opacity has to be found.
 * @return {number|string} Opacity between 0 and 1 or an empty string {@code ''}
 *     if the opacity is not set.
 */
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = '';
  if ('opacity' in style) {
    result = style.opacity;
  } else if ('MozOpacity' in style) {
    result = style.MozOpacity;
  } else if ('filter' in style) {
    var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
    if (match) {
      result = String(match[1] / 100);
    }
  }
  return result == '' ? result : Number(result);
};


/**
 * Sets the opacity of a node (x-browser).
 * @param {Element} el Elements whose opacity has to be set.
 * @param {number|string} alpha Opacity between 0 and 1 or an empty string
 *     {@code ''} to clear the opacity.
 */
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if ('opacity' in style) {
    style.opacity = alpha;
  } else if ('MozOpacity' in style) {
    style.MozOpacity = alpha;
  } else if ('filter' in style) {
    // TODO: Overwriting the filter might have undesired side effects.
    if (alpha === '') {
      style.filter = '';
    } else {
      style.filter = 'alpha(opacity=' + alpha * 100 + ')';
    }
  }
};


/**
 * Sets the background of an element to a transparent image in a browser-
 * independent manner.
 *
 * This function does not support repeating backgrounds or alternate background
 * positions to match the behavior of Internet Explorer. It also does not
 * support sizingMethods other than crop since they cannot be replicated in
 * browsers other than Internet Explorer.
 *
 * @param {Element} el The element to set background on.
 * @param {string} src The image source URL.
 */
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  // It is safe to use the style.filter in IE only. In Safari 'filter' is in
  // style object but access to style.filter causes it to throw an exception.
  // Note: IE8 supports images with an alpha channel.
  if (goog.userAgent.IE && !goog.userAgent.isVersion('8')) {
    // See TODO in setOpacity.
    style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(' +
        'src="' + src + '", sizingMethod="crop")';
  } else {
    // Set style properties individually instead of using background shorthand
    // to prevent overwriting a pre-existing background color.
    style.backgroundImage = 'url(' + src + ')';
    style.backgroundPosition = 'top left';
    style.backgroundRepeat = 'no-repeat';
  }
};


/**
 * Clears the background image of an element in a browser independent manner.
 * @param {Element} el The element to clear background image for.
 */
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if ('filter' in style) {
    // See TODO in setOpacity.
    style.filter = '';
  } else {
    // Set style properties individually instead of using background shorthand
    // to prevent overwriting a pre-existing background color.
    style.backgroundImage = 'none';
  }
};


/**
 * Shows or hides an element from the page. Hiding the element is done by
 * setting the display property to "none", removing the element from the
 * rendering hierarchy so it takes up no space. To show the element, the default
 * inherited display property is restored (defined either in stylesheets or by
 * the browser's default style rules.)
 *
 * Caveat 1: if the inherited display property for the element is set to "none"
 * by the stylesheets, that is the property that will be restored by a call to
 * showElement(), effectively toggling the display between "none" and "none".
 *
 * Caveat 2: if the element display style is set inline (by setting either
 * element.style.display or a style attribute in the HTML), a call to
 * showElement will clear that setting and defer to the inherited style in the
 * stylesheet.
 * @param {Element} el Element to show or hide.
 * @param {*} display True to render the element in its default style,
 * false to disable rendering the element.
 */
goog.style.showElement = function(el, display) {
  el.style.display = display ? '' : 'none';
};


/**
 * Test whether the given element has been shown or hidden via a call to
 * {@link #showElement}.
 *
 * Note this is strictly a companion method for a call
 * to {@link #showElement} and the same caveats apply; in particular, this
 * method does not guarantee that the return value will be consistent with
 * whether or not the element is actually visible.
 *
 * @param {Element} el The element to test.
 * @return {boolean} Whether the element has been shown.
 * @see #showElement
 */
goog.style.isElementShown = function(el) {
  return el.style.display != 'none';
};


/**
 * Installs the styles string into the window that contains opt_element.  If
 * opt_element is null, the main window is used.
 * @param {string} stylesString The style string to install.
 * @param {Node=} opt_node Node whose parent document should have the
 *     styles installed.
 * @return {Element|StyleSheet} The style element created.
 */
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;

  if (goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString);
  } else {
    var head = dh.getElementsByTagNameAndClass('head')[0];

    // In opera documents are not guaranteed to have a head element, thus we
    // have to make sure one exists before using it.
    if (!head) {
      var body = dh.getElementsByTagNameAndClass('body')[0];
      head = dh.createDom('head');
      body.parentNode.insertBefore(head, body);
    }
    styleSheet = dh.createDom('style');
    // NOTE: Setting styles after the style element has been appended
    // to the head results in a nasty Webkit bug in certain scenarios. Please
    // refer to https://bugs.webkit.org/show_bug.cgi?id=26307 for additional
    // details.
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet);
  }
  return styleSheet;
};


/**
 * Removes the styles added by {@link #installStyles}.
 * @param {Element|StyleSheet} styleSheet The value returned by
 *     {@link #installStyles}.
 */
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement ||
      /** @type {Element} */ (styleSheet);
  goog.dom.removeNode(node);
};


/**
 * Sets the content of a style element.  The style element can be any valid
 * style element.  This element will have its content completely replaced by
 * the new stylesString.
 * @param {Element|StyleSheet} element A stylesheet element as returned by
 *     installStyles.
 * @param {string} stylesString The new content of the stylesheet.
 */
goog.style.setStyles = function(element, stylesString) {
  if (goog.userAgent.IE) {
    // Adding the selectors individually caused the browser to hang if the
    // selector was invalid or there were CSS comments.  Setting the cssText of
    // the style node works fine and ignores CSS that IE doesn't understand
    element.cssText = stylesString;
  } else {
    var propToSet = goog.userAgent.WEBKIT ? 'innerText' : 'innerHTML';
    element[propToSet] = stylesString;
  }
};


/**
 * Sets 'white-space: pre-wrap' for a node (x-browser).
 *
 * There are as many ways of specifying pre-wrap as there are browsers.
 *
 * CSS3/IE8: white-space: pre-wrap;
 * Mozilla:  white-space: -moz-pre-wrap;
 * Opera:    white-space: -o-pre-wrap;
 * IE6/7:    white-space: pre; word-wrap: break-word;
 *
 * @param {Element} el Element to enable pre-wrap for.
 */
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if (goog.userAgent.IE && !goog.userAgent.isVersion('8')) {
    style.whiteSpace = 'pre';
    style.wordWrap = 'break-word';
  } else if (goog.userAgent.GECKO) {
    style.whiteSpace = '-moz-pre-wrap';
  } else if (goog.userAgent.OPERA) {
    style.whiteSpace = '-o-pre-wrap';
  } else {
    style.whiteSpace = 'pre-wrap';
  }
};


/**
 * Sets 'display: inline-block' for an element (cross-browser).
 * @param {Element} el Element to which the inline-block display style is to be
 *    applied.
 * @see ../demos/inline_block_quirks.html
 * @see ../demos/inline_block_standards.html
 */
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  // Without position:relative, weirdness ensues.  Just accept it and move on.
  style.position = 'relative';

  if (goog.userAgent.IE && !goog.userAgent.isVersion('8')) {
    // IE8 supports inline-block so fall through to the else
    // Zoom:1 forces hasLayout, display:inline gives inline behavior.
    style.zoom = '1';
    style.display = 'inline';
  } else if (goog.userAgent.GECKO) {
    // Pre-Firefox 3, Gecko doesn't support inline-block, but -moz-inline-box
    // is close enough.
    style.display = goog.userAgent.isVersion('1.9a') ? 'inline-block' :
        '-moz-inline-box';
  } else {
    // Opera, Webkit, and Safari seem to do OK with the standard inline-block
    // style.
    style.display = 'inline-block';
  }
};


/**
 * Returns true if the element is using right to left (rtl) direction.
 * @param {Element} el  The element to test.
 * @return {boolean} True for right to left, false for left to right.
 */
goog.style.isRightToLeft = function(el) {
  return 'rtl' == goog.style.getStyle_(el, 'direction');
};


/**
 * The CSS style property corresponding to an element being
 * unselectable on the current browser platform (null if none).
 * Opera and IE instead use a DOM attribute 'unselectable'.
 * @type {?string}
 * @private
 */
goog.style.unselectableStyle_ =
    goog.userAgent.GECKO ? 'MozUserSelect' :
    goog.userAgent.WEBKIT ? 'WebkitUserSelect' :
    null;


/**
 * Returns true if the element is set to be unselectable, false otherwise.
 * Note that on some platforms (e.g. Mozilla), even if an element isn't set
 * to be unselectable, it will behave as such if any of its ancestors is
 * unselectable.
 * @param {Element} el  Element to check.
 * @return {boolean}  Whether the element is set to be unselectable.
 */
goog.style.isUnselectable = function(el) {
  if (goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == 'none';
  } else if (goog.userAgent.IE || goog.userAgent.OPERA) {
    return el.getAttribute('unselectable') == 'on';
  }
  return false;
};


/**
 * Makes the element and its descendants selectable or unselectable.  Note
 * that on some platforms (e.g. Mozilla), even if an element isn't set to
 * be unselectable, it will behave as such if any of its ancestors is
 * unselectable.
 * @param {Element} el  The element to alter.
 * @param {boolean} unselectable  Whether the element and its descendants
 *     should be made unselectable.
 * @param {boolean=} opt_noRecurse  Whether to only alter the element's own
 *     selectable state, and leave its descendants alone; defaults to false.
 */
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  // TODO: Do we need all of TR_DomUtil.makeUnselectable() in Closure?
  var descendants = !opt_noRecurse ? el.getElementsByTagName('*') : null;
  var name = goog.style.unselectableStyle_;
  if (name) {
    // Add/remove the appropriate CSS style to/from the element and its
    // descendants.
    var value = unselectable ? 'none' : '';
    el.style[name] = value;
    if (descendants) {
      for (var i = 0, descendant; descendant = descendants[i]; i++) {
        descendant.style[name] = value;
      }
    }
  } else if (goog.userAgent.IE || goog.userAgent.OPERA) {
    // Toggle the 'unselectable' attribute on the element and its descendants.
    var value = unselectable ? 'on' : '';
    el.setAttribute('unselectable', value);
    if (descendants) {
      for (var i = 0, descendant; descendant = descendants[i]; i++) {
        descendant.setAttribute('unselectable', value);
      }
    }
  }
};


/**
 * Gets the border box size for an element.
 * @param {Element} element  The element to get the size for.
 * @return {!goog.math.Size} The border box size.
 */
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight);
};


/**
 * Sets the border box size of an element. This is potentially expensive in IE
 * if the document is CSS1Compat mode
 * @param {Element} element  The element to set the size on.
 * @param {goog.math.Size} size  The new size.
 */
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();

  if (goog.userAgent.IE &&
      (!isCss1CompatMode || !goog.userAgent.isVersion('8'))) {
    var style = element.style;
    if (isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left -
                         paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top -
                          paddingBox.bottom - borderBox.bottom;
    } else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height;
    }
  } else {
    goog.style.setBoxSizingSize_(element, size, 'border-box');
  }
};


/**
 * Gets the content box size for an element.  This is potentially expensive in
 * all browsers.
 * @param {Element} element  The element to get the size for.
 * @return {!goog.math.Size} The content box size.
 */
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if (ieCurrentStyle &&
      goog.dom.getDomHelper(doc).isCss1CompatMode() &&
      ieCurrentStyle.width != 'auto' && ieCurrentStyle.height != 'auto' &&
      !ieCurrentStyle.boxSizing) {
    // If IE in CSS1Compat mode than just use the width and height.
    // If we have a boxSizing then fall back on measuring the borders etc.
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width,
                                            'width', 'pixelWidth');
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height,
                                             'height', 'pixelHeight');
    return new goog.math.Size(width, height);
  } else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width -
                              borderBox.left - paddingBox.left -
                              paddingBox.right - borderBox.right,
                              borderBoxSize.height -
                              borderBox.top - paddingBox.top -
                              paddingBox.bottom - borderBox.bottom);
  }
};


/**
 * Sets the content box size of an element. This is potentially expensive in IE
 * if the document is BackCompat mode.
 * @param {Element} element  The element to set the size on.
 * @param {goog.math.Size} size  The new size.
 */
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if (goog.userAgent.IE &&
      (!isCss1CompatMode || !goog.userAgent.isVersion('8'))) {
    var style = element.style;
    if (isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height;
    } else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left +
                         paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top +
                          paddingBox.bottom + borderBox.bottom;
    }
  } else {
    goog.style.setBoxSizingSize_(element, size, 'content-box');
  }
};


/**
 * Helper function that sets the box sizing as well as the width and height
 * @param {Element} element  The element to set the size on.
 * @param {goog.math.Size} size  The new size to set.
 * @param {string} boxSizing  The box-sizing value.
 * @private
 */
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if (goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing;
  } else if (goog.userAgent.WEBKIT) {
    style.WebkitBoxSizing = boxSizing;
  } else if (goog.userAgent.OPERA && !goog.userAgent.isVersion('9.50')) {
    // Opera pre-9.5 does not have CSSStyleDeclaration::boxSizing, but
    // box-sizing can still be set via CSSStyleDeclaration::setProperty.
    if (boxSizing) {
      style.setProperty('box-sizing', boxSizing);
    } else {
      style.removeProperty('box-sizing');
    }
  } else {
    // Includes IE8
    style.boxSizing = boxSizing;
  }
  style.width = size.width + 'px';
  style.height = size.height + 'px';
};


/**
 * IE specific function that converts a non pixel unit to pixels.
 * @param {Element} element  The element to convert the value for.
 * @param {string} value  The current value as a string. The value must not be
 *     ''.
 * @param {string} name  The CSS property name to use for the converstion. This
 *     should be 'left', 'top', 'width' or 'height'.
 * @param {string} pixelName  The CSS pixel property name to use to get the
 *     value in pixels.
 * @return {number} The value in pixels.
 * @private
 */
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  // Try if we already have a pixel value. IE does not do half pixels so we
  // only check if it matches a number followed by 'px'.
  if (/^\d+px?$/.test(value)) {
    return parseInt(value, 10);
  } else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    // set runtime style to prevent changes
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    // restore
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue;
  }
};


/**
 * Helper function for getting the pixel padding or margin for IE.
 * @param {Element} element  The element to get the padding for.
 * @param {string} propName  The property name.
 * @return {number} The pixel padding.
 * @private
 */
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element,
      goog.style.getCascadedStyle(element, propName),
      'left', 'pixelLeft');
};


/**
 * Gets the computed paddings or margins (on all sides) in pixels.
 * @param {Element} element  The element to get the padding for.
 * @param {string} stylePrefix  Pass 'padding' to retrieve the padding box,
 *     or 'margin' to retrieve the margin box.
 * @return {!goog.math.Box} The computed paddings or margins.
 * @private
 */
goog.style.getBox_ = function(element, stylePrefix) {
  if (goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + 'Left');
    var right = goog.style.getIePixelDistance_(element, stylePrefix + 'Right');
    var top = goog.style.getIePixelDistance_(element, stylePrefix + 'Top');
    var bottom = goog.style.getIePixelDistance_(
        element, stylePrefix + 'Bottom');
    return new goog.math.Box(top, right, bottom, left);
  } else {
    // On non-IE browsers, getComputedStyle is always non-null.
    var left = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Left'));
    var right = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Right'));
    var top = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Top'));
    var bottom = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Bottom'));

    // NOTE: Gecko can return floating point numbers for the computed
    // style values.
    return new goog.math.Box(parseFloat(top),
                             parseFloat(right),
                             parseFloat(bottom),
                             parseFloat(left));
  }
};


/**
 * Gets the computed paddings (on all sides) in pixels.
 * @param {Element} element  The element to get the padding for.
 * @return {!goog.math.Box} The computed paddings.
 */
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, 'padding');
};


/**
 * Gets the computed margins (on all sides) in pixels.
 * @param {Element} element  The element to get the margins for.
 * @return {!goog.math.Box} The computed margins.
 */
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, 'margin');
};


/**
 * A map used to map the border width keywords to a pixel width.
 * @type {Object}
 * @private
 */
goog.style.ieBorderWidthKeywords_ = {
  'thin': 2,
  'medium': 4,
  'thick': 6
};


/**
 * Helper function for IE to get the pixel border.
 * @param {Element} element  The element to get the pixel border for.
 * @param {string} prop  The part of the property name.
 * @return {number} The value in pixels.
 * @private
 */
goog.style.getIePixelBorder_ = function(element, prop) {
  if (goog.style.getCascadedStyle(element, prop + 'Style') == 'none') {
    return 0;
  }
  var width = goog.style.getCascadedStyle(element, prop + 'Width');
  if (width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width];
  }
  return goog.style.getIePixelValue_(element, width, 'left', 'pixelLeft');
};


/**
 * Gets the computed border widths (on all sides) in pixels
 * @param {Element} element  The element to get the border widths for.
 * @return {!goog.math.Box} The computed border widths.
 */
goog.style.getBorderBox = function(element) {
  if (goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, 'borderLeft');
    var right = goog.style.getIePixelBorder_(element, 'borderRight');
    var top = goog.style.getIePixelBorder_(element, 'borderTop');
    var bottom = goog.style.getIePixelBorder_(element, 'borderBottom');
    return new goog.math.Box(top, right, bottom, left);
  } else {
    // On non-IE browsers, getComputedStyle is always non-null.
    var left = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderLeftWidth'));
    var right = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderRightWidth'));
    var top = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderTopWidth'));
    var bottom = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderBottomWidth'));

    return new goog.math.Box(parseFloat(top),
                             parseFloat(right),
                             parseFloat(bottom),
                             parseFloat(left));
  }
};


/**
 * Returns the font face applied to a given node. Opera and IE should return
 * the font actually displayed. Firefox returns the author's most-preferred
 * font (whether the browser is capable of displaying it or not.)
 * @param {Element} el  The element whose font family is returned.
 * @return {string} The font family applied to el.
 */
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = '';
  if (doc.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    font = range.queryCommandValue('FontName');
  }
  if (!font) {
    // Note if for some reason IE can't derive FontName with a TextRange, we
    // fallback to using currentStyle
    font = goog.style.getStyle_(el, 'fontFamily');
    // Opera on Linux provides the font vendor's name in square-brackets.
    if (goog.userAgent.OPERA && goog.userAgent.LINUX) {
      font = font.replace(/ \[[^\]]*\]/, '');
    }
  }

  // Firefox returns the applied font-family string (author's list of
  // preferred fonts.) We want to return the most-preferred font, in lieu of
  // the *actually* applied font.
  var fontsArray = font.split(',');
  if (fontsArray.length > 1) font = fontsArray[0];

  // Sanitize for x-browser consistency:
  // Strip quotes because browsers aren't consistent with how they're
  // applied; Opera always encloses, Firefox sometimes, and IE never.
  return goog.string.stripQuotes(font, '"\'');
};


/**
 * Regular expression used for getLengthUnits.
 * @type {RegExp}
 * @private
 */
goog.style.lengthUnitRegex_ = /[^\d]+$/;


/**
 * Returns the units used for a CSS length measurement.
 * @param {string} value  A CSS length quantity.
 * @return {?string} The units of measurement.
 */
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null;
};


/**
 * Map of absolute CSS length units
 * @type {Object}
 * @private
 */
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {
  'cm' : 1,
  'in' : 1,
  'mm' : 1,
  'pc' : 1,
  'pt' : 1
};


/**
 * Map of relative CSS length units that can be accurately converted to px
 * font-size values using getIePixelValue_. Only units that are defined in
 * relation to a font size are convertible (%, small, etc. are not).
 * @type {Object}
 * @private
 */
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {
  'em' : 1,
  'ex' : 1
};


/**
 * Returns the font size, in pixels, of text in an element.
 * @param {Element} el  The element whose font size is returned.
 * @return {number} The font size (in pixels).
 */
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, 'fontSize');
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if (fontSize && 'px' == sizeUnits) {
    // NOTE: This could be parseFloat instead, but IE doesn't return
    // decimal fractions in getStyle_ and Firefox reports the fractions, but
    // ignores them when rendering. Interestingly enough, when we force the
    // issue and size something to e.g., 50% of 25px, the browsers round in
    // opposite directions with Firefox reporting 12px and IE 13px. I punt.
    return parseInt(fontSize, 10);
  }

  // In IE, we can convert absolute length units to a px value using
  // goog.style.getIePixelValue_. Units defined in relation to a font size
  // (em, ex) are applied relative to the element's parentNode and can also
  // be converted.
  if (goog.userAgent.IE) {
    if (sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el,
                                         fontSize,
                                         'left',
                                         'pixelLeft');
    } else if (el.parentNode &&
               el.parentNode.nodeType == goog.dom.NodeType.ELEMENT &&
               sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
      // Check the parent size - if it is the same it means the relative size
      // value is inherited and we therefore don't want to count it twice.  If
      // it is different, this element either has explicit style or has a CSS
      // rule applying to it.
      var parentElement = /** @type {Element} */ (el.parentNode);
      var parentSize = goog.style.getStyle_(parentElement, 'fontSize');
      return goog.style.getIePixelValue_(parentElement,
                                         fontSize == parentSize ?
                                             '1em' : fontSize,
                                         'left',
                                         'pixelLeft');
    }
  }

  // Sometimes we can't cleanly find the font size (some units relative to a
  // node's parent's font size are difficult: %, smaller et al), so we create
  // an invisible, absolutely-positioned span sized to be the height of an 'M'
  // rendered in its parent's (i.e., our target element's) font size. This is
  // the definition of CSS's font size attribute.
  var sizeElement = goog.dom.createDom(
      'span',
      {'style': 'visibility:hidden;position:absolute;' +
                'line-height:0;padding:0;margin:0;border:0;height:1em;'});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);

  return fontSize;
};


/**
 * Parses a style attribute value.  Converts CSS property names to camel case.
 * @param {string} value The style attribute value.
 * @return {!Object} Map of CSS properties to string values.
 */
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if (keyValue.length == 2) {
      result[goog.style.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1];
    }
  });
  return result;
};


/**
 * Reverse of parseStyleAttribute; that is, takes a style object and returns the
 * corresponding attribute value.  Converts camel case property names to proper
 * CSS selector names.
 * @param {Object} obj Map of CSS properties to values.
 * @return {string} The style attribute value.
 */
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.style.toSelectorCase(key), ':', value, ';');
  });
  return buffer.join('');
};


/**
 * Sets CSS float property on an element.
 * @param {Element} el The element to set float property on.
 * @param {string} value The value of float CSS property to set on this element.
 */
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? 'styleFloat' : 'cssFloat'] = value;
};


/**
 * Gets value of explicitly-set float CSS property on an element.
 * @param {Element} el The element to get float property of.
 * @return {string} The value of explicitly-set float CSS property on this
 *     element.
 */
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? 'styleFloat' : 'cssFloat'] || '';
};


/**
 * Returns the scroll bar width (represents the width of both horizontal
 * and vertical scroll).
 *
 * @return {number} The scroll bar width in px.
 */
goog.style.getScrollbarWidth = function() {
  // Add a div outside of the viewport.
  var mockElement = goog.dom.createElement('div');
  mockElement.style.cssText = 'visibility:hidden;overflow:scroll;' +
      'position:absolute;top:0;width:100px;height:100px';
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width;
};

// Input 31
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2005 Google Inc. All Rights Reserved.

/**
 * @fileoverview Predefined DHTML animations such as slide, resize and fade.
 *
 * @see ../demos/effects.html
 */

goog.provide('goog.fx.dom');
goog.provide('goog.fx.dom.BgColorTransform');
goog.provide('goog.fx.dom.ColorTransform');
goog.provide('goog.fx.dom.Fade');
goog.provide('goog.fx.dom.FadeIn');
goog.provide('goog.fx.dom.FadeInAndShow');
goog.provide('goog.fx.dom.FadeOut');
goog.provide('goog.fx.dom.FadeOutAndHide');
goog.provide('goog.fx.dom.PredefinedEffect');
goog.provide('goog.fx.dom.Resize');
goog.provide('goog.fx.dom.ResizeHeight');
goog.provide('goog.fx.dom.ResizeWidth');
goog.provide('goog.fx.dom.Scroll');
goog.provide('goog.fx.dom.Slide');
goog.provide('goog.fx.dom.SlideFrom');
goog.provide('goog.fx.dom.Swipe');

goog.require('goog.color');
goog.require('goog.events');
goog.require('goog.fx.Animation');
goog.require('goog.fx.Animation.EventType');
goog.require('goog.style');


/**
 * Abstract class that provides reusable functionality for predefined animations
 * that manipulate a single DOM element
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {Array.<number>} start Array for start coordinates.
 * @param {Array.<number>} end Array for end coordinates.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.Animation}
 * @constructor
 */
goog.fx.dom.PredefinedEffect = function(element, start, end, time, opt_acc) {
  goog.fx.Animation.call(this, start, end, time, opt_acc);

  /**
   * DOM Node that will be used in the animation
   * @type {Element}
   */
  this.element = element;
};
goog.inherits(goog.fx.dom.PredefinedEffect, goog.fx.Animation);


/**
 * Called to update the style of the element.
 * @protected
 */
goog.fx.dom.PredefinedEffect.prototype.updateStyle = goog.nullFunction;


/** @inheritDoc */
goog.fx.dom.PredefinedEffect.prototype.onAnimate = function() {
  this.updateStyle();
  goog.fx.dom.PredefinedEffect.superClass_.onAnimate.call(this);
};


/** @inheritDoc */
goog.fx.dom.PredefinedEffect.prototype.onEnd = function() {
  this.updateStyle();
  goog.fx.dom.PredefinedEffect.superClass_.onEnd.call(this);
};


/** @inheritDoc */
goog.fx.dom.PredefinedEffect.prototype.onBegin = function() {
  this.updateStyle();
  goog.fx.dom.PredefinedEffect.superClass_.onBegin.call(this);
};



/**
 * Creates an animation object that will slide an element from A to B.  (This
 * in effect automatically sets up the onanimate event for an Animation object)
 *
 * Start and End should be 2 dimensional arrays
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {Array.<number>} start 2D array for start coordinates (X, Y).
 * @param {Array.<number>} end 2D array for end coordinates (X, Y).
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.PredefinedEffect}
 * @constructor
 */
goog.fx.dom.Slide = function(element, start, end, time, opt_acc) {
  if (start.length != 2 || end.length != 2) {
    throw Error('Start and end points must be 2D');
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments);
};
goog.inherits(goog.fx.dom.Slide, goog.fx.dom.PredefinedEffect);


/** @inheritDoc */
goog.fx.dom.Slide.prototype.updateStyle = function() {
  this.element.style.left = Math.round(this.coords[0]) + 'px';
  this.element.style.top = Math.round(this.coords[1]) + 'px';
};



/**
 * Slides an element from its current position.
 *
 * @param {Element} element DOM node to be used in the animation.
 * @param {Array.<number>} end 2D array for end coordinates (X, Y).
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.Slide}
 * @constructor
 */
goog.fx.dom.SlideFrom = function(element, end, time, opt_acc) {
  var start = [element.offsetLeft, element.offsetTop];
  goog.fx.dom.Slide.call(this, element, start, end, time, opt_acc);
};
goog.inherits(goog.fx.dom.SlideFrom, goog.fx.dom.Slide);


/** @inheritDoc */
goog.fx.dom.SlideFrom.prototype.onBegin = function() {
  this.startPoint = [this.element.offsetLeft, this.element.offsetTop];
  goog.fx.dom.SlideFrom.superClass_.onBegin.call(this);
};



/**
 * Creates an animation object that will slide an element into its final size.
 * Requires that the element is absolutely positioned.
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {Array.<number>} start 2D array for start size (W, H).
 * @param {Array.<number>} end 2D array for end size (W, H).
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.PredefinedEffect}
 * @constructor
 */
goog.fx.dom.Swipe = function(element, start, end, time, opt_acc) {
  if (start.length != 2 || end.length != 2) {
    throw Error('Start and end points must be 2D');
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments);

  /*
   * Maximum width for element.
   * @type {number}
   * @private
   */
  this.maxWidth_ = Math.max(this.endPoint[0], this.startPoint[0]);

  /*
   * Maximum height for element.
   * @type {number}
   * @private
   */
  this.maxHeight_ = Math.max(this.endPoint[1], this.startPoint[1]);
};
goog.inherits(goog.fx.dom.Swipe, goog.fx.dom.PredefinedEffect);


/**
 * Animation event handler that will resize an element by setting its width,
 * height and clipping.
 * @protected
 * @override
 */
goog.fx.dom.Swipe.prototype.updateStyle = function() {
  var x = this.coords[0];
  var y = this.coords[1];
  this.clip_(Math.round(x), Math.round(y), this.maxWidth_, this.maxHeight_);
  this.element.style.width = Math.round(x) + 'px'
  this.element.style.marginLeft = Math.round(x) - this.maxWidth_ + 'px';
  this.element.style.marginTop = Math.round(y) - this.maxHeight_ + 'px';
};


/**
 * Helper function for setting element clipping.
 * @param {number} x Current element width.
 * @param {number} y Current element height.
 * @param {number} w Maximum element width.
 * @param {number} h Maximum element height.
 * @private
 */
goog.fx.dom.Swipe.prototype.clip_ = function(x, y, w, h) {
  this.element.style.clip =
      'rect(' + (h - y) + 'px ' + w + 'px ' + h + 'px ' + (w - x) + 'px)';
};



/**
 * Creates an animation object that will scroll an element from A to B.
 *
 * Start and End should be 2 dimensional arrays
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {Array.<number>} start 2D array for start scroll left and top.
 * @param {Array.<number>} end 2D array for end scroll left and top.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.PredefinedEffect}
 * @constructor
 */
goog.fx.dom.Scroll = function(element, start, end, time, opt_acc) {
  if (start.length != 2 || end.length != 2) {
    throw Error('Start and end points must be 2D');
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments);
};
goog.inherits(goog.fx.dom.Scroll, goog.fx.dom.PredefinedEffect);


/**
 * Animation event handler that will set the scroll posiiton of an element
 * @protected
 * @override
 */
goog.fx.dom.Scroll.prototype.updateStyle = function() {
  this.element.scrollLeft = Math.round(this.coords[0]);
  this.element.scrollTop = Math.round(this.coords[1]);
};



/**
 * Creates an animation object that will resize an element between two widths
 * and heights.
 *
 * Start and End should be 2 dimensional arrays
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {Array.<number>} start 2D array for start width and height.
 * @param {Array.<number>} end 2D array for end width and height.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.PredefinedEffect}
 * @constructor
 */
goog.fx.dom.Resize = function(element, start, end, time, opt_acc) {
  if (start.length != 2 || end.length != 2) {
    throw Error('Start and end points must be 2D');
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments);
};
goog.inherits(goog.fx.dom.Resize, goog.fx.dom.PredefinedEffect);


/**
 * Animation event handler that will resize an element by setting its width and
 * height.
 * @protected
 * @override
 */
goog.fx.dom.Resize.prototype.updateStyle = function() {
  this.element.style.width = Math.round(this.coords[0]) + 'px'
  this.element.style.height = Math.round(this.coords[1]) + 'px';
};



/**
 * Creates an animation object that will resize an element between two widths
 *
 * Start and End should be numbers
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {number} start Start width.
 * @param {number} end End width.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.PredefinedEffect}
 * @constructor
 */
goog.fx.dom.ResizeWidth = function(element, start, end, time, opt_acc) {
  goog.fx.dom.PredefinedEffect.call(this, element, [start],
                                    [end], time, opt_acc);
};
goog.inherits(goog.fx.dom.ResizeWidth, goog.fx.dom.PredefinedEffect);


/**
 * Animation event handler that will resize an element by setting its width.
 * @protected
 * @override
 */
goog.fx.dom.ResizeWidth.prototype.updateStyle = function() {
  this.element.style.width = Math.round(this.coords[0]) + 'px';
};



/**
 * Creates an animation object that will resize an element between two heights
 *
 * Start and End should be numbers
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {number} start Start height.
 * @param {number} end End height.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.PredefinedEffect}
 * @constructor
 */
goog.fx.dom.ResizeHeight = function(element, start, end, time, opt_acc) {
  goog.fx.dom.PredefinedEffect.call(this, element, [start],
                                    [end], time, opt_acc);
};
goog.inherits(goog.fx.dom.ResizeHeight, goog.fx.dom.PredefinedEffect);


/**
 * Animation event handler that will resize an element by setting its height.
 * @protected
 * @override
 */
goog.fx.dom.ResizeHeight.prototype.updateStyle = function() {
  this.element.style.height = Math.round(this.coords[0]) + 'px';
};



/**
 * Creates an animation object that fades the opacity of an element between two
 * limits.
 *
 * Start and End should be floats between 0 and 1
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {Array.<number>|number} start 1D Array or Number with start opacity.
 * @param {Array.<number>|number} end 1D Array or Number for end opacity.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.PredefinedEffect}
 * @constructor
 */
goog.fx.dom.Fade = function(element, start, end, time, opt_acc) {
  if (goog.isNumber(start)) start = [start];
  if (goog.isNumber(end)) end = [end];

  goog.fx.dom.PredefinedEffect.call(this, element, start, end, time, opt_acc);

  if (start.length != 1 || end.length != 1) {
    throw Error('Start and end points must be 1D');
  }
};
goog.inherits(goog.fx.dom.Fade, goog.fx.dom.PredefinedEffect);


/**
 * Animation event handler that will set the opacity of an element.
 * @protected
 * @override
 */
goog.fx.dom.Fade.prototype.updateStyle = function() {
  goog.style.setOpacity(this.element, this.coords[0]);
};


/**
 * Animation event handler that will show the element.
 */
goog.fx.dom.Fade.prototype.show = function() {
  this.element.style.display = '';
};


/**
 * Animation event handler that will hide the element
 */
goog.fx.dom.Fade.prototype.hide = function() {
  this.element.style.display = 'none';
};



/**
 * Fades an element out from full opacity to completely transparent.
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.Fade}
 * @constructor
 */
goog.fx.dom.FadeOut = function(element, time, opt_acc) {
  goog.fx.dom.Fade.call(this, element, 1, 0, time, opt_acc);
};
goog.inherits(goog.fx.dom.FadeOut, goog.fx.dom.Fade);



/**
 * Fades an element in from completely transparent to fully opacity.
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.Fade}
 * @constructor
 */
goog.fx.dom.FadeIn = function(element, time, opt_acc) {
  goog.fx.dom.Fade.call(this, element, 0, 1, time, opt_acc);
};
goog.inherits(goog.fx.dom.FadeIn, goog.fx.dom.Fade);


/**
 * Fades an element out from full opacity to completely transparent and then
 * sets the display to 'none'
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.Fade}
 * @constructor
 */
goog.fx.dom.FadeOutAndHide = function(element, time, opt_acc) {
  goog.fx.dom.Fade.call(this, element, 1, 0, time, opt_acc);
};
goog.inherits(goog.fx.dom.FadeOutAndHide, goog.fx.dom.Fade);


/** @inheritDoc */
goog.fx.dom.FadeOutAndHide.prototype.onBegin = function() {
  this.show();
  goog.fx.dom.FadeOutAndHide.superClass_.onBegin.call(this);
};


/** @inheritDoc */
goog.fx.dom.FadeOutAndHide.prototype.onEnd = function() {
  this.hide();
  goog.fx.dom.FadeOutAndHide.superClass_.onEnd.call(this);
};



/**
 * Sets an element's display to be visible and then fades an element in from
 * completely transparent to fully opacity
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.Fade}
 * @constructor
 */
goog.fx.dom.FadeInAndShow = function(element, time, opt_acc) {
  goog.fx.dom.Fade.call(this, element, 0, 1, time, opt_acc);
};
goog.inherits(goog.fx.dom.FadeInAndShow, goog.fx.dom.Fade);


/** @inheritDoc */
goog.fx.dom.FadeInAndShow.prototype.onBegin = function() {
  this.show();
  goog.fx.dom.FadeInAndShow.superClass_.onBegin.call(this);
};



/**
 * Provides a transformation of an elements background-color.
 *
 * Start and End should be 3D arrays representing R,G,B
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {Array.<number>} start 3D Array for RGB of start color.
 * @param {Array.<number>} end 3D Array for RGB of end color.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @extends {goog.fx.dom.PredefinedEffect}
 * @constructor
 */
goog.fx.dom.BgColorTransform = function(element, start, end, time, opt_acc) {
  if (start.length != 3 || end.length != 3) {
    throw Error('Start and end points must be 3D');
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments);
};
goog.inherits(goog.fx.dom.BgColorTransform, goog.fx.dom.PredefinedEffect);

/**
 * Animation event handler that will set the background-color of an element
 */
goog.fx.dom.BgColorTransform.prototype.setColor = function() {
  var coordsAsInts = [];
  for (var i = 0; i < this.coords.length; i++) {
    coordsAsInts[i] = Math.round(this.coords[i]);
  }
  var color = 'rgb(' + coordsAsInts.join(',') + ')';
  this.element.style.backgroundColor = color;
};


/** @inheritDoc */
goog.fx.dom.BgColorTransform.prototype.updateStyle = function() {
  this.setColor();
};


/**
 * Fade elements background color from start color to the element's current
 * background color.
 *
 * Start should be a 3D array representing R,G,B
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {Array.<number>} start 3D Array for RGB of start color.
 * @param {number} time Length of animation in milliseconds.
 */
goog.fx.dom.bgColorFadeIn = function(element, start, time) {
  var initialBgColor = element.style.backgroundColor || '';
  var computedBgColor = goog.style.getBackgroundColor(element);
  var end;

  if (computedBgColor != 'transparent' &&
      computedBgColor != 'rgba(0, 0, 0, 0)') {
    end = goog.color.hexToRgb(goog.color.parse(computedBgColor).hex);
  } else {
    end = [255, 255, 255];
  }

  var anim = new goog.fx.dom.BgColorTransform(element, start, end, time);
  goog.events.listen(anim, goog.fx.Animation.EventType.END, function() {
    element.style.backgroundColor = initialBgColor;
  });
  anim.play();
};


/**
 * Provides a transformation of an elements color.
 *
 * @param {Element} element Dom Node to be used in the animation.
 * @param {Array.<number>} start 3D Array representing R,G,B.
 * @param {Array.<number>} end 3D Array representing R,G,B.
 * @param {number} time Length of animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 * @constructor
 * @extends {goog.fx.dom.PredefinedEffect}
 */
goog.fx.dom.ColorTransform = function(element, start, end, time, opt_acc) {
  if (start.length != 3 || end.length != 3) {
    throw Error('Start and end points must be 3D');
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments);
};
goog.inherits(goog.fx.dom.ColorTransform, goog.fx.dom.PredefinedEffect);


/**
 * Animation event handler that will set the color of an element.
 * @protected
 * @override
 */
goog.fx.dom.ColorTransform.prototype.updateStyle = function() {
  var coordsAsInts = [];
  for (var i = 0; i < this.coords.length; i++) {
    coordsAsInts[i] = Math.round(this.coords[i]);
  }
  var color = 'rgb(' + coordsAsInts.join(',') + ')';
  this.element.style.color = color;
};

// Input 32
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Generics method for collection-like classes and objects.
 *
 *
 * This file contains functions to work with collections. It supports using
 * Map, Set, Array and Object and other classes that implement collection-like
 * methods.
 *
 */


goog.provide('goog.structs');

goog.require('goog.array');
goog.require('goog.object');


// We treat an object as a dictionary if it has getKeys or it is an object that
// isn't arrayLike.


/**
 * Returns the number of values in the collection-like object.
 * @param {Object} col The collection-like object.
 * @return {number} The number of values in the collection-like object.
 */
goog.structs.getCount = function(col) {
  if (typeof col.getCount == 'function') {
    return col.getCount();
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return col.length;
  }
  return goog.object.getCount(col);
};


/**
 * Returns the values of the collection-like object.
 * @param {Object} col The collection-like object.
 * @return {!Array} The values in the collection-like object.
 */
goog.structs.getValues = function(col) {
  if (typeof col.getValues == 'function') {
    return col.getValues();
  }
  if (goog.isString(col)) {
    return col.split('');
  }
  if (goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for (var i = 0; i < l; i++) {
      rv.push(col[i]);
    }
    return rv;
  }
  return goog.object.getValues(col);
};


/**
 * Returns the keys of the collection. Some collections have no notion of
 * keys/indexes and this function will return undefined in those cases.
 * @param {Object} col The collection-like object.
 * @return {!Array|undefined} The keys in the collection.
 */
goog.structs.getKeys = function(col) {
  if (typeof col.getKeys == 'function') {
    return col.getKeys();
  }
  // if we have getValues but no getKeys we know this is a key-less collection
  if (typeof col.getValues == 'function') {
    return undefined;
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for (var i = 0; i < l; i++) {
      rv.push(i);
    }
    return rv;
  }

  return goog.object.getKeys(col);
};


/**
 * Whether the collection contains the given value. This is O(n) and uses
 * equals (==) to test the existence.
 * @param {Object} col The collection-like object.
 * @param {*} val The value to check for.
 * @return {boolean} True if the map contains the value.
 */
goog.structs.contains = function(col, val) {
  if (typeof col.contains == 'function') {
    return col.contains(val);
  }
  if (typeof col.containsValue == 'function') {
    return col.containsValue(val);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(/** @type {Array} */ (col), val);
  }
  return goog.object.containsValue(col, val);
};


/**
 * Whether the collection is empty.
 * @param {Object} col The collection-like object.
 * @return {boolean} True if empty.
 */
goog.structs.isEmpty = function(col) {
  if (typeof col.isEmpty == 'function') {
    return col.isEmpty();
  }

  // We do not use goog.string.isEmpty because here we treat the string as
  // collection and as such even whitespace matters

  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(/** @type {Array} */ (col));
  }
  return goog.object.isEmpty(col);
};


/**
 * Removes all the elements from the collection.
 * @param {Object} col The collection-like object.
 */
goog.structs.clear = function(col) {
  // NOTE: This should not contain strings because strings are immutable
  if (typeof col.clear == 'function') {
    col.clear();
  } else if (goog.isArrayLike(col)) {
    goog.array.clear((/** @type {goog.array.ArrayLike} */ col));
  } else {
    goog.object.clear(col);
  }
};


/**
 * Calls a function for each value in a collection. The function takes
 * three arguments; the value, the key and the collection.
 *
 * @param {Object} col The collection-like object.
 * @param {Function} f The function to call for every value. This function takes
 *     3 arguments (the value, the key or undefined if the collection has no
 *     notion of keys, and the collection) and the return value is irrelevant.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within {@code f}.
 */
goog.structs.forEach = function(col, f, opt_obj) {
  if (typeof col.forEach == 'function') {
    col.forEach(f, opt_obj);
  } else if (goog.isArrayLike(col) || goog.isString(col)) {
    goog.array.forEach(/** @type {Array} */ (col), f, opt_obj);
  } else {
    var keys = goog.structs.getKeys(col);
    var values = goog.structs.getValues(col);
    var l = values.length;
    for (var i = 0; i < l; i++) {
      f.call(opt_obj, values[i], keys && keys[i], col);
    }
  }
};


/**
 * Calls a function for every value in the collection. When a call returns true,
 * adds the value to a new collection (Array is returned by default).
 *
 * @param {Object} col The collection-like object.
 * @param {Function} f The function to call for every value. This function takes
 *     3 arguments (the value, the key or undefined if the collection has no
 *     notion of keys, and the collection) and should return a Boolean. If the
 *     return value is true the value is added to the result collection. If it
 *     is false the value is not included.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {!Object|!Array} A new collection where the passed values are
 *     present. If col is a key-less collection an array is returned.  If col
 *     has keys and values a plain old JS object is returned.
 */
goog.structs.filter = function(col, f, opt_obj) {
  if (typeof col.filter == 'function') {
    return col.filter(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(/** @type {!Array} */ (col), f, opt_obj);
  }

  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if (keys) {
    rv = {};
    for (var i = 0; i < l; i++) {
      if (f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i];
      }
    }
  } else {
    // We should not use goog.array.filter here since we want to make sure that
    // the index is undefined as well as make sure that col is passed to the
    // function.
    rv = [];
    for (var i = 0; i < l; i++) {
      if (f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i]);
      }
    }
  }
  return rv;
};


/**
 * Calls a function for every value in the collection and adds the result into a
 * new collection (defaults to creating a new Array).
 *
 * @param {Object} col The collection-like object.
 * @param {Function} f The function to call for every value. This function
 *     takes 3 arguments (the value, the key or undefined if the collection has
 *     no notion of keys, and the collection) and should return something. The
 *     result will be used as the value in the new collection.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {!Object|!Array} A new collection with the new values.  If col is a
 *     key-less collection an array is returned.  If col has keys and values a
 *     plain old JS object is returned.
 */
goog.structs.map = function(col, f, opt_obj) {
  if (typeof col.map == 'function') {
    return col.map(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(/** @type {!Array} */ (col), f, opt_obj);
  }

  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if (keys) {
    rv = {};
    for (var i = 0; i < l; i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col);
    }
  } else {
    // We should not use goog.array.map here since we want to make sure that
    // the index is undefined as well as make sure that col is passed to the
    // function.
    rv = [];
    for (var i = 0; i < l; i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col);
    }
  }
  return rv;
};


/**
 * Calls f for each value in a collection. If any call returns true this returns
 * true (without checking the rest). If all returns false this returns false.
 *
 * @param {Object|Array|string} col The collection-like object.
 * @param {Function} f The function to call for every value. This function takes
 *     3 arguments (the value, the key or undefined if the collection has no
 *     notion of keys, and the collection) and should return a Boolean.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {boolean} True if any value passes the test.
 */
goog.structs.some = function(col, f, opt_obj) {
  if (typeof col.some == 'function') {
    return col.some(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(/** @type {!Array} */ (col), f, opt_obj);
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for (var i = 0; i < l; i++) {
    if (f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true;
    }
  }
  return false;
};


/**
 * Calls f for each value in a collection. If all calls return true this return
 * true this returns true. If any returns false this returns false at this point
 *  and does not continue to check the remaining values.
 *
 * @param {Object} col The collection-like object.
 * @param {Function} f The function to call for every value. This function takes
 *     3 arguments (the value, the key or undefined if the collection has no
 *     notion of keys, and the collection) and should return a Boolean.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {boolean} True if all key-value pairs pass the test.
 */
goog.structs.every = function(col, f, opt_obj) {
  if (typeof col.every == 'function') {
    return col.every(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(/** @type {!Array} */ (col), f, opt_obj);
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for (var i = 0; i < l; i++) {
    if (!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false;
    }
  }
  return true;
};

// Input 33
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2007 Google Inc. All Rights Reserved.

/**
 * @fileoverview Python style iteration utilities.
 */


goog.provide('goog.iter');
goog.provide('goog.iter.Iterator');
goog.provide('goog.iter.StopIteration');

goog.require('goog.array');


/**
 * @type {goog.iter.Iterator|{length:number}|{__iterator__}}
 */
goog.iter.Iterable = goog.typedef;


// For script engines that already support iterators.
if ('StopIteration' in goog.global) {
  /**
   * Singleton Error object that is used to terminate iterations.
   * @type {Error}
   */
  goog.iter.StopIteration = goog.global['StopIteration'];
} else {
  /**
   * Singleton Error object that is used to terminate iterations.
   * @type {Error}
   * @suppress {duplicate}
   */
  goog.iter.StopIteration = Error('StopIteration');
}



/**
 * Class/interface for iterators.  An iterator needs to implement a {@code next}
 * method and it needs to throw a {@code goog.iter.StopIteration} when the
 * iteration passes beyond the end.  Iterators have no {@code hasNext} method.
 * It is recommended to always use the helper functions to iterate over the
 * iterator or in case you are only targeting JavaScript 1.7 for in loops.
 * @constructor
 */
goog.iter.Iterator = function() {};


/**
 * Returns the next value of the iteration.  This will throw the object
 * {@see goog.iter#StopIteration} when the iteration passes the end.
 * @return {*} Any object or value.
 */
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};


/**
 * Returns the {@code Iterator} object itself.  This is used to implement
 * the iterator protocol in JavaScript 1.7
 * @param {boolean=} opt_keys  Whether to return the keys or values. Default is
 *     to only return the values.  This is being used by the for-in loop (true)
 *     and the for-each-in loop (false).  Even though the param gives a hint
 *     about what the iterator will return there is no guarantee that it will
 *     return the keys when true is passed.
 * @return {!goog.iter.Iterator} The object itself.
 */
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this;
};



/**
 * Returns an iterator that knows how to iterate over the values in the object.
 * @param {goog.iter.Iterable} iterable  If the object is an iterator it
 *     will be returned as is.  If the object has a {@code __iterator__} method
 *     that will be called to get the value iterator.  If the object is an
 *     array-like object we create an iterator for that.
 * @return {!goog.iter.Iterator} An iterator that knows how to iterate over the
 *     values in {@code iterable}.
 */
goog.iter.toIterator = function(iterable) {
  if (iterable instanceof goog.iter.Iterator) {
    return iterable;
  }
  if (typeof iterable.__iterator__ == 'function') {
    return iterable.__iterator__(false);
  }
  if (goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while (true) {
        if (i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        // Don't include deleted elements.
        if (!(i in iterable)) {
          i++;
          continue;
        }
        return iterable[i++];
      }
    };
    return newIter;
  }


  // TODO: Should we fall back on goog.structs.getValues()?
  throw Error('Not implemented');
};


/**
 * Calls a function for each element in the iterator with the element of the
 * iterator passed as argument.
 *
 * @param {goog.iter.Iterable} iterable  The iterator to iterate
 *     over.  If the iterable is an object {@code toIterator} will be called on
 *     it.
 * @param {Function} f  The function to call for every element.  This function
 *     takes 3 arguments (the element, undefined, and the iterator) and the
 *     return value is irrelevant.  The reason for passing undefined as the
 *     second argument is so that the same function can be used in
 *     {@see goog.array#forEach} as well as others.
 * @param {Object=} opt_obj  The object to be used as the value of 'this' within
 *     {@code f}.
 */
goog.iter.forEach = function(iterable, f, opt_obj) {
  if (goog.isArrayLike(iterable)) {
    /** @preserveTry */
    try {
      goog.array.forEach((/** @type {goog.array.ArrayLike} */ iterable), f,
                         opt_obj);
    } catch (ex) {
      if (ex !== goog.iter.StopIteration) {
       throw ex;
      }
    }
  } else {
    iterable = goog.iter.toIterator(iterable);
    /** @preserveTry */
    try {
      while (true) {
        f.call(opt_obj, iterable.next(), undefined, iterable);
      }
    } catch (ex) {
      if (ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};


/**
 * Calls a function for every element in the iterator, and if the function
 * returns true adds the element to a new iterator.
 *
 * @param {goog.iter.Iterable} iterable The iterator to iterate over.
 * @param {Function} f The function to call for every element.  This function
 *     takes 3 arguments (the element, undefined, and the iterator) and should
 *     return a boolean.  If the return value is true the element will be
 *     included  in the returned iteror.  If it is false the element is not
 *     included.
 * @param {Object=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {!goog.iter.Iterator} A new iterator in which only elements that
 *     passed the test are present.
 */
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while (true) {
      var val = iterable.next();
      if (f.call(opt_obj, val, undefined, iterable)) {
        return val;
      }
    }
  };
  return newIter;
};


/**
 * Creates a new iterator that returns the values in a range.  This function
 * can take 1, 2 or 3 arguments:
 * <pre>
 * range(5) same as range(0, 5, 1)
 * range(2, 5) same as range(2, 5, 1)
 * </pre>
 *
 * @param {number} startOrStop  The stop value if only one argument is provided.
 *     The start value if 2 or more arguments are provided.  If only one
 *     argument is used the start value is 0.
 * @param {number=} opt_stop  The stop value.  If left out then the first
 *     argument is used as the stop value.
 * @param {number=} opt_step  The number to increment with between each call to
 *     next.  This can be negative.
 * @return {!goog.iter.Iterator} A new iterator that returns the values in the
 *     range.
 */
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if (arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop;
  }
  if (step == 0) {
    throw Error('Range step argument must not be zero');
  }

  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if (step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv;
  };
  return newIter;
};


/**
 * Joins the values in a iterator with a delimiter.
 * @param {goog.iter.Iterable} iterable  The iterator to get the values from.
 * @param {string} deliminator  The text to put between the values.
 * @return {string} The joined value string.
 */
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator);
};


/**
 * For every element in the iterator call a function and return a new iterator
 * with that value.
 *
 * @param {goog.iter.Iterable} iterable The iterator to iterate over.
 * @param {Function} f The function to call for every element.  This function
 *     takes 3 arguments (the element, undefined, and the iterator) and should
 *     return a new value.
 * @param {Object=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {!goog.iter.Iterator} A new iterator that returns the results of
 *     applying the function to each element in the original iterator.
 */
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while (true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable);
    }
  };
  return newIter;
};


/**
 * Passes every element of an iterator into a function and accumulates the
 * result.
 *
 * @param {goog.iter.Iterable} iterable The iterator to iterate over.
 * @param {Function} f The function to call for every element. This function
 *     takes 2 arguments (the function's previous result or the initial value,
 *     and the value of the current element).
 *     function(previousValue, currentElement) : newValue.
 * @param {*} val The initial value to pass into the function on the first call.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {*} Result of evaluating f repeatedly across the values of
 *     the iterator.
 */
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val);
  });
  return rval;
};


/**
 * Goes through the values in the iterator. Calls f for each these and if any of
 * them returns true, this returns true (without checking the rest). If all
 * return false this will return false.
 *
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {Function} f  The function to call for every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {Object=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {boolean} true if any value passes the test.
 */
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  /** @preserveTry */
  try {
    while (true) {
      if (f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false;
};


/**
 * Goes through the values in the iterator. Calls f for each these and if any of
 * them returns false this returns false (without checking the rest). If all
 * return true this will return true.
 *
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {Function} f  The function to call for every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {Object=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {boolean} true if every value passes the test.
 */
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  /** @preserveTry */
  try {
    while (true) {
      if (!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true;
};


/**
 * Takes zero or more iterators and returns one iterator that will iterate over
 * them in the order chained.
 * @param {...goog.iter.Iterator} var_args  Any number of iterator objects.
 * @return {!goog.iter.Iterator} Returns a new iterator that will iterate over
 *     all the given iterators' contents.
 */
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    /** @preserveTry */
    try {
      if (i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next();
    } catch (ex) {
      if (ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      } else {
        // In case we got a StopIteration increment counter and try again.
        i++;
        return this.next();
      }
    }
  };
  return newIter;
};


/**
 * Builds a new iterator that iterates over the original, but skips elements as
 * long as a supplied function returns true.
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {Function} f  The function to call for every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {Object=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {!goog.iter.Iterator} A new iterator that drops elements from the
 *     original iterator as long as {@code f} is true.
 */
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while (true) {
      var val = iterable.next();
      if (dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue;
      } else {
        dropping = false;
      }
      return val;
    }
  };
  return newIter;
};


/**
 * Builds a new iterator that iterates over the original, but only as long as a
 * supplied function returns true.
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {Function} f  The function to call for every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {Object=} opt_obj This is used as the 'this' object in f when called.
 * @return {!goog.iter.Iterator} A new iterator that keeps elements in the
 *     original iterator as long as the function is true.
 */
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while (true) {
      if (taking) {
        var val = iterable.next();
        if (f.call(opt_obj, val, undefined, iterable)) {
          return val;
        } else {
          taking = false;
        }
      } else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter;
};


/**
 * Converts the iterator to an array
 * @param {goog.iter.Iterable} iterable  The iterator to convert to an array.
 * @return {!Array} An array of the elements the iterator iterates over.
 */
goog.iter.toArray = function(iterable) {
  // Fast path for array-like.
  if (goog.isArrayLike(iterable)) {
    return goog.array.toArray((/** @type {!goog.array.ArrayLike} */ iterable));
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val);
  });
  return array;
};


/**
 * Iterates over 2 iterators and returns true if they contain the same sequence
 * of elements and have the same length.
 * @param {goog.iter.Iterable} iterable1  The first iterable object.
 * @param {goog.iter.Iterable} iterable2  The second iterable object.
 * @return {boolean} true if the iterators contain the same sequence of
 *     elements and have the same length.
 */
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  /** @preserveTry */
  try {
    while (true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if (val1 != val2) {
        return false;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    } else {
      if (b1 && !b2) {
        // iterable1 done but iterable2 is not done.
        return false;
      }
      if (!b2) {
        /** @preserveTry */
        try {
          // iterable2 not done?
          val2 = iterable2.next();
          // iterable2 not done but iterable1 is done
          return false;
        } catch (ex1) {
          if (ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          // iterable2 done as well... They are equal
          return true;
        }
      }
    }
  }
  return false;
};


/**
 * Advances the iterator to the next position, returning the given default value
 * instead of throwing an exception if the iterator has no more entries.
 * @param {goog.iter.Iterable} iterable The iterable object.
 * @param {*} defaultValue The value to return if the iterator is empty.
 * @return {*} The next item in the iteration, or defaultValue if the iterator
 *     was empty.
 */
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next();
  } catch (e) {
    if (e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue;
  }
};

// Input 34
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Datastructure: Hash Map.
 *
 *
 * This file contains an implementation of a Map structure. It implements a lot
 * of the methods used in goog.structs so those functions work on hashes.  For
 * convenience with common usage the methods accept any type for the key, though
 * internally they will be cast to strings.
 */


goog.provide('goog.structs.Map');

goog.require('goog.iter.Iterator');
goog.require('goog.iter.StopIteration');
goog.require('goog.object');
goog.require('goog.structs');


/**
 * Class for Hash Map datastructure.
 * @param {*=} opt_map Map or Object to initialize the map with.
 * @param {...*} var_args If 2 or more arguments are present then they
 *     will be used as key-value pairs.
 * @constructor
 */
goog.structs.Map = function(opt_map, var_args) {

  /**
   * Underlying JS object used to implement the map.
   * @type {!Object}
   * @private
   */
  this.map_ = {};

  /**
   * An array of keys. This is necessary for two reasons:
   *   1. Iterating the keys using for (var key in this.map_) allocates an
   *      object for every key in IE which is really bad for IE6 GC perf.
   *   2. Without a side data structure, we would need to escape all the keys
   *      as that would be the only way we could tell during iteration if the
   *      key was an internal key or a property of the object.
   *
   * This array can contain deleted keys so it's necessary to check the map
   * as well to see if the key is still in the map (this doesn't require a
   * memory allocation in IE).
   * @type {!Array.<string>}
   * @private
   */
  this.keys_ = [];

  var argLength = arguments.length;

  if (argLength > 1) {
    if (argLength % 2) {
      throw Error('Uneven number of arguments');
    }
    for (var i = 0; i < argLength; i += 2) {
      this.set(arguments[i], arguments[i + 1]);
    }
  } else if (opt_map) {
    this.addAll(/** @type {Object} */ (opt_map));
  }
};


/**
 * The number of key value pairs in the map.
 * @private
 * @type {number}
 */
goog.structs.Map.prototype.count_ = 0;


/**
 * Version used to detect changes while iterating.
 * @private
 * @type {number}
 */
goog.structs.Map.prototype.version_ = 0;

/**
 * @return {number} The number of key-value pairs in the map.
 */
goog.structs.Map.prototype.getCount = function() {
  return this.count_;
};


/**
 * Returns the values of the map.
 * @return {!Array} The values in the map.
 */
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();

  var rv = [];
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key]);
  }
  return rv;
};


/**
 * Returns the keys of the map.
 * @return {!Array.<string>} Array of string values.
 */
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return /** @type {!Array.<string>} */ (this.keys_.concat());
};


/**
 * Whether the map contains the given key.
 * @param {*} key The key to check for.
 * @return {boolean} Whether the map contains the key.
 */
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key);
};


/**
 * Whether the map contains the given value. This is O(n).
 * @param {*} val The value to check for.
 * @return {boolean} Whether the map contains the value.
 */
goog.structs.Map.prototype.containsValue = function(val) {
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    if (goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * Whether this map is equal to the argument map.
 * @param {goog.structs.Map} otherMap The map against which to test equality.
 * @param {function(*, *) : boolean=} opt_equalityFn Optional equality function
 *     to test equality of values. If not specified, this will test whether
 *     the values contained in each map are identical objects.
 * @return {boolean} Whether the maps are equal.
 */
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if (this === otherMap) {
    return true;
  }

  if (this.count_ != otherMap.getCount()) {
    return false;
  }

  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;

  this.cleanupKeysArray_();
  for (var key, i = 0; key = this.keys_[i]; i++) {
    if (!equalityFn(this.get(key), otherMap.get(key))) {
      return false;
    }
  }

  return true;
};


/**
 * Default equality test for values.
 * @param {*} a The first value.
 * @param {*} b The second value.
 * @return {boolean} Whether a and b reference the same object.
 */
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b;
};


/**
 * @return {boolean} Whether the map is empty.
 */
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0;
};


/**
 * Removes all key-value pairs from the map.
 */
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0;
};

/**
 * Removes a key-value pair based on the key. This is O(logN) amortized due to
 * updating the keys array whenever the count becomes half the size of the keys
 * in the keys array.
 * @param {*} key  The key to remove.
 * @return {boolean} Whether object was removed.
 */
goog.structs.Map.prototype.remove = function(key) {
  if (goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;

    // clean up the keys array if the threshhold is hit
    if (this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_();
    }

    return true;
  }
  return false;
};


/**
 * Cleans up the temp keys array by removing entries that are no longer in the
 * map.
 * @private
 */
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if (this.count_ != this.keys_.length) {
    // First remove keys that are no longer in the map.
    var srcIndex = 0;
    var destIndex = 0;
    while (srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if (goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key;
      }
      srcIndex++;
    }
    this.keys_.length = destIndex;
  }

  if (this.count_ != this.keys_.length) {
    // If the count still isn't correct, that means we have duplicates. This can
    // happen when the same key is added and removed multiple times. Now we have
    // to allocate one extra Object to remove the duplicates. This could have
    // been done in the first pass, but in the common case, we can avoid
    // allocating an extra object by only doing this when necessary.
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while (srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if (!(goog.structs.Map.hasKey_(seen, key))) {
        this.keys_[destIndex++] = key;
        seen[key] = 1;
      }
      srcIndex++;
    }
    this.keys_.length = destIndex;
  }
};


/**
 * Returns the value for the given key.  If the key is not found and the default
 * value is not given this will return {@code undefined}.
 * @param {*} key The key to get the value for.
 * @param {*=} opt_val The value to return if no item is found for the given
 *     key, defaults to undefined.
 * @return {*} The value for the given key.
 */
goog.structs.Map.prototype.get = function(key, opt_val) {
  if (goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key];
  }
  return opt_val;
};


/**
 * Adds a key-value pair to the map.
 * @param {*} key The key.
 * @param {*} value The value to add.
 */
goog.structs.Map.prototype.set = function(key, value) {
  if (!(goog.structs.Map.hasKey_(this.map_, key))) {
    this.count_++;
    this.keys_.push(key);
    // Only change the version if we add a new key.
    this.version_++;
  }
  this.map_[key] = value;
};


/**
 * Adds multiple key-value pairs from another goog.structs.Map or Object.
 * @param {Object} map  Object containing the data to add.
 */
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if (map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues();
  } else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map);
  }
  // we could use goog.array.forEach here but I don't want to introduce that
  // dependency just for this.
  for (var i = 0; i < keys.length; i++) {
    this.set(keys[i], values[i]);
  }
};


/**
 * Clones a map and returns a new map.
 * @return {!goog.structs.Map} A new map with the same key-value pairs.
 */
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this);
};


/**
 * Returns a new map in which all the keys and values are interchanged
 * (keys become values and values become keys). If multiple keys map to the
 * same value, the chosen transposed value is implementation-dependent.
 *
 * It acts very similarly to {goog.object.transpose(Object)}.
 *
 * @return {!goog.structs.Map} The transposed map.
 */
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map();
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key);
  }

  return transposed;
};


/**
 * Returns an iterator that iterates over the keys in the map.  Removal of keys
 * while iterating might have undesired side effects.
 * @return {!goog.iter.Iterator} An iterator over the keys in the map.
 */
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true);
};


/**
 * Returns an iterator that iterates over the values in the map.  Removal of
 * keys while iterating might have undesired side effects.
 * @return {!goog.iter.Iterator} An iterator over the values in the map.
 */
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false);
};


/**
 * Returns an iterator that iterates over the values or the keys in the map.
 * This throws an exception if the map was mutated since the iterator was
 * created.
 * @param {boolean=} opt_keys True to iterate over the keys. False to iterate
 *     over the values.  The default value is false.
 * @return {!goog.iter.Iterator} An iterator over the values or keys in the map.
 */
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  // Clean up keys to minimize the risk of iterating over dead keys.
  this.cleanupKeysArray_();

  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;

  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while (true) {
      if (version != selfObj.version_) {
        throw Error('The map has changed since the iterator was created');
      }
      if (i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key];
    }
  };
  return newIter;
};


/**
 * Safe way to test for hasOwnProperty.  It even allows testing for
 * 'hasOwnProperty'.
 * @param {Object} obj The object to test for presence of the given key.
 * @param {*} key The key to check for.
 * @return {boolean} Whether the object has the key.
 * @private
 */
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

// Input 35
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2009 Google Inc. All Rights Reserved.

/**
 * @fileoverview Provides a base class for custom Error objects such that the
 * stack is corectly maintained.
 *
 */

goog.provide('goog.debug.Error');



/**
 * Base class for custom error objects.
 * @param {*=} opt_msg The message associated with the error.
 * @constructor
 * @extends {Error}
 */
goog.debug.Error = function(opt_msg) {

  // Ensure there is a stack trace.
  this.stack = new Error().stack || '';

  if (opt_msg) {
    this.message = String(opt_msg);
  }
};
goog.inherits(goog.debug.Error, Error);


/** @inheritDoc */
goog.debug.Error.prototype.name = 'CustomError';

// Input 36
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2008 Google Inc. All Rights Reserved.

/**
 * @fileoverview Utilities to check the preconditions, postconditions and
 * invariants runtime.
 *
 * Methods in this package should be given special treatment by the compiler
 * for type-inference. For example, <code>goog.asserts.assert(foo)</code>
 * will restrict <code>foo</code> to a truthy value.
 *
 */

goog.provide('goog.asserts');
goog.provide('goog.asserts.AssertionError');

goog.require('goog.debug.Error');
goog.require('goog.string');

// TODO: Add return values for all these functions, so that they
// can be chained like:
// eatNumber(goog.asserts.isNumber(foo));
// for more lisp-y asserts.

/**
 * @define {boolean} Whether to strip out asserts or to leave them in.
 */
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;


/**
 * Error object for failed assertions.
 * @param {string} messagePattern The pattern that was used to form message.
 * @param {!Array.<*>} messageArgs The items to substitute into the pattern.
 * @constructor
 * @extends {goog.debug.Error}
 */
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  // Remove the messagePattern afterwards to avoid permenantly modifying the
  // passed in array.
  messageArgs.shift();

  /**
   * The message pattern used to format the error message. Error handlers can
   * use this to uniquely identify the assertion.
   * @type {string}
   */
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);


/** @inheritDoc */
goog.asserts.AssertionError.prototype.name = 'AssertionError';


/**
 * Throws an exception with the given message and "Assertion failed" prefixed
 * onto it.
 * @param {string} defaultMessage The message to use if givenMessage is empty.
 * @param {Array.<*>} defaultArgs The substitution arguments for defaultMessage.
 * @param {string|undefined} givenMessage Message supplied by the caller.
 * @param {Array.<*>} givenArgs The substitution arguments for givenMessage.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 * @private
 */
goog.asserts.doAssertFailure_ =
    function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = 'Assertion failed';
  if (givenMessage) {
    message += ': ' + givenMessage;
    var args = givenArgs;
  } else if (defaultMessage) {
    message += ': ' + defaultMessage;
    args = defaultArgs;
  }
  // The '' + works around an Opera 10 bug in the unit tests. Without it,
  // a stack trace is added to var message above. With this, a stack trace is
  // not added until this line (it causes the extra garbage to be added after
  // the assertion message instead of in the middle of it).
  throw new goog.asserts.AssertionError('' + message, args || []);
};


/**
 * Checks if the condition evaluates to true if goog.asserts.ENABLE_ASSERTS is
 * true.
 * @param {*} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
goog.asserts.assert = function(condition, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_('', null, opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
};


/**
 * Fails if goog.asserts.ENABLE_ASSERTS is true. This function is useful in case
 * when we want to add a check in the unreachable area like switch-case
 * statement:
 *
 * <pre>
 *  switch(type) {
 *    case FOO: doSomething(); break;
 *    case BAR: doSomethingElse(); break;
 *    default: goog.assert.fail('Unrecognized type: ' + type);
 *      // We have only 2 types - "default:" section is unreachable code.
 *  }
 * </pre>
 *
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} Failure.
 */
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError(
        'Failure' + (opt_message ? ': ' + opt_message : ''),
        Array.prototype.slice.call(arguments, 1));
  }
};


/**
 * Checks if the value is a number if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {number} The value, guaranteed to be a number when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 */
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_('Expected number but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {number} */ (value);
};


/**
 * Checks if the value is a string if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {string} The value, guaranteed to be a string when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a string.
 */
goog.asserts.assertString = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_('Expected string but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {string} */ (value);
};


/**
 * Checks if the value is a function if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Function} The value, guaranteed to be a function when asserts
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a function.
 */
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_('Expected function but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Function} */ (value);
};


/**
 * Checks if the value is an Object if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Object} The value, guaranteed to be a non-null object.
 * @throws {goog.asserts.AssertionError} When the value is not an object.
 */
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_('Expected object but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Object} */ (value);
};


/**
 * Checks if the value is an Array if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Array} The value, guaranteed to be a non-null array.
 * @throws {goog.asserts.AssertionError} When the value is not an array.
 */
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_('Expected array but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Array} */ (value);
};


/**
 * Checks if the value is an instance of the user-defined type if
 * goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {!Function} type A user-defined constructor.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the value is not an instance of
 *     type.
 */
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_('instanceof check failed.', null,
         opt_message, Array.prototype.slice.call(arguments, 3));
  }
};


// Input 37
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2008 Google Inc. All rights reserved.

/**
 * @fileoverview Simple utilities for dealing with URI strings.
 *
 * This is intended to be a lightweight alternative to constructing goog.Uri
 * objects.  Whereas goog.Uri adds several kilobytes to the binary regardless
 * of how much of its functionality you use, this is designed to be a set of
 * mostly-independent utilities so that the compiler includes only what is
 * necessary for the task.  Estimated savings of porting is 5k pre-gzip and
 * 1.5k post-gzip.  To ensure the savings remain, future developers should
 * avoid adding new functionality to existing functions, but instead create
 * new ones and factor out shared code.
 *
 * Many of these utilities have limited functionality, tailored to common
 * cases.  The query parameter utilities assume that the parameter keys are
 * already encoded, since most keys are compile-time alphanumeric strings.  The
 * query parameter mutation utilities also do not tolerate fragment identifiers.
 *
 * By design, these functions can be slower than goog.Uri equivalents.
 * Repeated calls to some of functions may be quadratic in behavior for IE,
 * although the effect is somewhat limited given the 2kb limit.
 *
 * One advantage of the limited functionality here is that this approach is
 * less sensitive to differences in URI encodings than goog.Uri, since these
 * functions modify the strings in place, rather than decoding and
 * re-encoding.
 *
 * Uses features of RFC 3986 for parsing/formatting URIs:
 *   http://gbiv.com/protocols/uri/rfc/rfc3986.html
 *
 */

goog.provide('goog.uri.utils');
goog.provide('goog.uri.utils.ComponentIndex');

goog.require('goog.asserts');
goog.require('goog.string');


/**
 * Character codes inlined to avoid object allocations due to charCode.
 * @enum {number}
 * @private
 */
goog.uri.utils.CharCode_ = {
  AMPERSAND: 38,
  EQUAL: 61,
  HASH: 35,
  QUESTION: 63
};


/**
 * Builds a URI string from already-encoded parts.
 *
 * No encoding is performed.  Any component may be omitted as either null or
 * undefined.
 *
 * @param {?string=} opt_scheme The scheme such as 'http'.
 * @param {?string=} opt_userInfo The user name before the '@'.
 * @param {?string=} opt_domain The domain such as 'www.google.com', already
 *     URI-encoded.
 * @param {(string|number|null)=} opt_port The port number.
 * @param {?string=} opt_path The path, already URI-encoded.  If it is not
 *     empty, it must begin with a slash.
 * @param {?string=} opt_queryData The URI-encoded query data.
 * @param {?string=} opt_fragment The URI-encoded fragment identifier.
 * @return {string} The fully combined URI.
 */
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo,
    opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = [];

  if (opt_scheme) {
    out.push(opt_scheme, ':');
  }

  if (opt_domain) {
    out.push('//');

    if (opt_userInfo) {
      out.push(opt_userInfo, '@');
    }

    out.push(opt_domain);

    if (opt_port) {
      out.push(':', opt_port);
    }
  }

  if (opt_path) {
    out.push(opt_path);
  }

  if (opt_queryData) {
    out.push('?', opt_queryData);
  }

  if (opt_fragment) {
    out.push('#', opt_fragment);
  }

  return out.join('');
};


/**
 * A regular expression for breaking a URI into its component parts.
 *
 * {@link http://www.gbiv.com/protocols/uri/rfc/rfc3986.html#RFC2234} says
 * As the "first-match-wins" algorithm is identical to the "greedy"
 * disambiguation method used by POSIX regular expressions, it is natural and
 * commonplace to use a regular expression for parsing the potential five
 * components of a URI reference.
 *
 * The following line is the regular expression for breaking-down a
 * well-formed URI reference into its components.
 *
 * <pre>
 * ^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?
 *  12            3  4          5       6  7        8 9
 * </pre>
 *
 * The numbers in the second line above are only to assist readability; they
 * indicate the reference points for each subexpression (i.e., each paired
 * parenthesis). We refer to the value matched for subexpression <n> as $<n>.
 * For example, matching the above expression to
 * <pre>
 *     http://www.ics.uci.edu/pub/ietf/uri/#Related
 * </pre>
 * results in the following subexpression matches:
 * <pre>
 *    $1 = http:
 *    $2 = http
 *    $3 = //www.ics.uci.edu
 *    $4 = www.ics.uci.edu
 *    $5 = /pub/ietf/uri/
 *    $6 = <undefined>
 *    $7 = <undefined>
 *    $8 = #Related
 *    $9 = Related
 * </pre>
 * where <undefined> indicates that the component is not present, as is the
 * case for the query component in the above example. Therefore, we can
 * determine the value of the five components as
 * <pre>
 *    scheme    = $2
 *    authority = $4
 *    path      = $5
 *    query     = $7
 *    fragment  = $9
 * </pre>
 *
 * The regular expression has been modified slightly to expose the
 * userInfo, domain, and port separately from the authority.
 * The modified version yields
 * <pre>
 *    $1 = http              scheme
 *    $2 = <undefined>       userInfo -\
 *    $3 = www.ics.uci.edu   domain     | authority
 *    $4 = <undefined>       port     -/
 *    $5 = /pub/ietf/uri/    path
 *    $6 = <undefined>       query without ?
 *    $7 = Related           fragment without #
 * </pre>
 * @type {!RegExp}
 * @private
 */
goog.uri.utils.splitRe_ = new RegExp(
    '^' +
    '(?:' +
      '([^:/?#.]+)' +                     // scheme - ignore special characters
                                          // used by other URL parts such as :,
                                          // ?, /, #, and .
    ':)?' +
    '(?://' +
      '(?:([^/?#]*)@)?' +                 // userInfo
      '([\\w\\d\\-\\u0100-\\uffff.%]*)' + // domain - restrict to letters,
                                          // digits, dashes, dots, percent
                                          // escapes, and unicode characters.
      '(?::([0-9]+))?' +                  // port
    ')?' +
    '([^?#]+)?' +                         // path
    '(?:\\?([^#]*))?' +                   // query
    '(?:#(.*))?' +                        // fragment
    '$');


/**
 * The index of each URI component in the return value of goog.uri.utils.split.
 * @enum {number}
 */
goog.uri.utils.ComponentIndex = {
  SCHEME: 1,
  USER_INFO: 2,
  DOMAIN: 3,
  PORT: 4,
  PATH: 5,
  QUERY_DATA: 6,
  FRAGMENT: 7
};


/**
 * Splits a URI into its component parts.
 *
 * Each component can be accessed via the component indices; for example:
 * <pre>
 * goog.uri.utils.split(someStr)[goog.uri.utils.CompontentIndex.QUERY_DATA];
 * </pre>
 *
 * @param {string} uri The URI string to examine.
 * @return {!Array.<string|undefined>} Each component still URI-encoded.
 *     Each component that is present will contain the encoded value, whereas
 *     components that are not present will be undefined or empty, depending
 *     on the browser's regular expression implementation.  Never null, since
 *     arbitrary strings may still look like path names.
 */
goog.uri.utils.split = function(uri) {
  // See @return comment -- never null.
  return /** @type {!Array.<string|undefined>} */ (
      uri.match(goog.uri.utils.splitRe_));
};


/**
 * @param {?string} uri A possibly null string.
 * @return {?string} The string URI-decoded, or null if uri is null.
 * @private
 */
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri);
};


/**
 * Gets a URI component by index.
 *
 * It is preferred to use the getPathEncoded() variety of functions ahead,
 * since they are more readable.
 *
 * @param {goog.uri.utils.ComponentIndex} componentIndex The component index.
 * @param {string} uri The URI to examine.
 * @return {?string} The still-encoded component, or null if the component
 *     is not present.
 * @private
 */
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  // Convert undefined, null, and empty string into null.
  return goog.uri.utils.split(uri)[componentIndex] || null;
};


/**
 * @param {string} uri The URI to examine.
 * @return {?string} The protocol or scheme, or null if none.  Does not
 *     include trailing colons or slashes.
 */
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(
      goog.uri.utils.ComponentIndex.SCHEME, uri);
};


/**
 * @param {string} uri The URI to examine.
 * @return {?string} The user name still encoded, or null if none.
 */
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(
      goog.uri.utils.ComponentIndex.USER_INFO, uri);
};


/**
 * @param {string} uri The URI to examine.
 * @return {?string} The decoded user info, or null if none.
 */
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(
      goog.uri.utils.getUserInfoEncoded(uri));
};


/**
 * @param {string} uri The URI to examine.
 * @return {?string} The domain name still encoded, or null if none.
 */
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(
      goog.uri.utils.ComponentIndex.DOMAIN, uri);
};


/**
 * @param {string} uri The URI to examine.
 * @return {?string} The decoded domain, or null if none.
 */
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri));
};


/**
 * @param {string} uri The URI to examine.
 * @return {?number} The port number, or null if none.
 */
goog.uri.utils.getPort = function(uri) {
  // Coerce to a number.  If the result of getComponentByIndex_ is null or
  // non-numeric, the number coersion yields NaN.  This will then return
  // null for all non-numeric cases (though also zero, which isn't a relevant
  // port number).
  return Number(goog.uri.utils.getComponentByIndex_(
      goog.uri.utils.ComponentIndex.PORT, uri)) || null;
};


/**
 * @param {string} uri The URI to examine.
 * @return {?string} The path still encoded, or null if none. Includes the
 *     leading slash, if any.
 */
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(
      goog.uri.utils.ComponentIndex.PATH, uri);
};


/**
 * @param {string} uri The URI to examine.
 * @return {?string} The decoded path, or null if none.  Includes the leading
 *     slash, if any.
 */
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri));
};


/**
 * @param {string} uri The URI to examine.
 * @return {?string} The query data still encoded, or null if none.  Does not
 *     include the question mark itself.
 */
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(
      goog.uri.utils.ComponentIndex.QUERY_DATA, uri);
};


/**
 * @param {string} uri The URI to examine.
 * @return {?string} The fragment identifier, or null if none.  Does not
 *     include the hash mark itself.
 */
goog.uri.utils.getFragmentEncoded = function(uri) {
  // The hash mark may not appear in any other part of the URL.
  var hashIndex = uri.indexOf('#');
  return hashIndex < 0 ? null : uri.substr(hashIndex + 1);
};


/**
 * @param {string} uri The URI to examine.
 * @return {?string} The decoded fragment identifier, or null if none.  Does
 *     not include the hash mark.
 */
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(
      goog.uri.utils.getFragmentEncoded(uri));
};


/**
 * Extracts everything up to the port of the URI.
 * @param {string} uri The URI string.
 * @return {string} Everything up to and including the port.
 */
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(
      pieces[goog.uri.utils.ComponentIndex.SCHEME],
      pieces[goog.uri.utils.ComponentIndex.USER_INFO],
      pieces[goog.uri.utils.ComponentIndex.DOMAIN],
      pieces[goog.uri.utils.ComponentIndex.PORT]);
};


/**
 * Extracts the path of the URL and everything after.
 * @param {string} uri The URI string.
 * @return {?string} The URI, starting at the path and including the query
 *     parameters and fragment identifier.
 */
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null,
      pieces[goog.uri.utils.ComponentIndex.PATH],
      pieces[goog.uri.utils.ComponentIndex.QUERY_DATA],
      pieces[goog.uri.utils.ComponentIndex.FRAGMENT]);
};


/**
 * Gets the URI with the fragment identifier removed.
 * @param {string} uri The URI to examine.
 * @return {string} Everything preceding the hash mark.
 */
goog.uri.utils.removeFragment = function(uri) {
  // The hash mark may not appear in any other part of the URL.
  var hashIndex = uri.indexOf('#');
  return hashIndex < 0 ? uri : uri.substr(0, hashIndex);
};


/**
 * Ensures that two URI's have the exact same domain, scheme, and port.
 *
 * Unlike the version in goog.Uri, this checks protocol, and therefore is
 * suitable for checking against the browser's same-origin policy.
 *
 * @param {string} uri1 The first URI.
 * @param {string} uri2 The second URI.
 * @return {boolean} Whether they have the same domain and port.
 */
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1);
  var pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] ==
             pieces2[goog.uri.utils.ComponentIndex.DOMAIN] &&
         pieces1[goog.uri.utils.ComponentIndex.SCHEME] ==
             pieces2[goog.uri.utils.ComponentIndex.SCHEME] &&
         pieces1[goog.uri.utils.ComponentIndex.PORT] ==
             pieces2[goog.uri.utils.ComponentIndex.PORT];
};


/**
 * Asserts that there are no fragment or query identifiers, only in uncompiled
 * mode.
 * @param {string} uri The URI to examine.
 * @private
 */
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  // NOTE: would use goog.asserts here, but jscompiler doesn't know that
  // indexOf has no side effects.
  if (goog.DEBUG && (uri.indexOf('#') >= 0 || uri.indexOf('?') >= 0)) {
    throw Error('goog.uri.utils: Fragment or query identifiers are not ' +
        'supported: [' + uri + ']');
  }
};


/**
 * Supported query parameter values by the parameter serializing utilities.
 *
 * If a value is null or undefined, the key-value pair is skipped, as an easy
 * way to omit parameters conditionally.  Non-array parameters are converted
 * to a string and URI encoded.  Array values are expanded into multiple
 * &key=value pairs, with each element stringized and URI-encoded.
 *
 * @type {*}
 */
goog.uri.utils.QueryValue = goog.typedef;


/**
 * An array representing a set of query parameters with alternating keys
 * and values.
 *
 * Keys are assumed to be URI encoded already and live at even indices.  See
 * goog.uri.utils.QueryValue for details on how parameter values are encoded.
 *
 * Example:
 * <pre>
 * var data = [
 *   // Simple param: ?name=BobBarker
 *   'name', 'BobBarker',
 *   // Conditional param -- may be omitted entirely.
 *   'specialDietaryNeeds', hasDietaryNeeds() ? getDietaryNeeds() : null,
 *   // Multi-valued param: &house=LosAngeles&house=NewYork&house=null
 *   'house', ['LosAngeles', 'NewYork', null]
 * ];
 * </pre>
 *
 * @type {!Array.<string|goog.uri.utils.QueryValue>}
 */
goog.uri.utils.QueryArray = goog.typedef;


/**
 * Appends a URI and query data in a string buffer with special preconditions.
 *
 * Internal implementation utility, performing very few object allocations.
 *
 * @param {!Array.<string|undefined>} buffer A string buffer.  The first element
 *     must be the base URI, and may have a fragment identifier.  If the array
 *     contains more than one element, the second element must be an ampersand,
 *     and may be overwritten, depending on the base URI.  Undefined elements
 *     are treated as empty-string.
 * @return {string} The concatenated URI and query data.
 * @private
 */
goog.uri.utils.appendQueryData_ = function(buffer) {
  if (buffer[1]) {
    // At least one query parameter was added.  We need to check the
    // punctuation mark, which is currently an ampersand, and also make sure
    // there aren't any interfering fragment identifiers.
    var baseUri = /** @type {string} */ (buffer[0]);
    var hashIndex = baseUri.indexOf('#');
    if (hashIndex >= 0) {
      // Move the fragment off the base part of the URI into the end.
      buffer.push(baseUri.substr(hashIndex));
      buffer[0] = baseUri = baseUri.substr(0, hashIndex);
    }
    var questionIndex = baseUri.indexOf('?');
    if (questionIndex < 0) {
      // No question mark, so we need a question mark instead of an ampersand.
      buffer[1] = '?';
    } else if (questionIndex == baseUri.length - 1) {
      // Question mark is the very last character of the existing URI, so don't
      // append an additional delimiter.
      buffer[1] = undefined;
    }
  }

  return buffer.join('');
};


/**
 * Appends key=value pairs to an array, supporting multi-valued objects.
 * @param {string} key The key prefix.
 * @param {goog.uri.utils.QueryValue} value The value to serialize.
 * @param {!Array.<string>} pairs The array to which the 'key=value' strings
 *     should be appended.
 * @private
 */
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if (goog.isArray(value)) {
    // It's an array, so append all elements.  Here, we must convince
    // jscompiler that it is, indeed, an array.
    value = /** @type {Array} */ (value);
    for (var j = 0; j < value.length; j++) {
      pairs.push('&', key, '=', goog.string.urlEncode(value[j]));
    }
  } else if (value != null) {
    // Not null or undefined, so safe to append.
    pairs.push('&', key, '=', goog.string.urlEncode(value));
  }
};


/**
 * Builds a buffer of query data from a sequence of alternating keys and values.
 *
 * @param {!Array.<string|undefined>} buffer A string buffer to append to.  The
 *     first element appended will be an '&', and may be replaced by the caller.
 * @param {goog.uri.utils.QueryArray|Arguments} keysAndValues An array with
 *     alternating keys and values -- see the typedef.
 * @param {number=} opt_startIndex A start offset into the arary, defaults to 0.
 * @return {!Array.<string|undefined>} The buffer argument.
 * @private
 */
goog.uri.utils.buildQueryDataBuffer_ = function(
    buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(Math.max(keysAndValues.length - (opt_startIndex || 0),
      0) % 2 == 0, 'goog.uri.utils: Key/value lists must be even in length.');

  for (var i = opt_startIndex || 0; i < keysAndValues.length; i += 2) {
    goog.uri.utils.appendKeyValuePairs_(
        keysAndValues[i], keysAndValues[i + 1], buffer);
  }

  return buffer;
};


/**
 * Builds a query data string from a sequence of alternating keys and values.
 *
 * Currently generates "&key=&" for empty args; there is no way to generate
 * "&key&" arguments with no equal sign.
 *
 * @param {goog.uri.utils.QueryArray} keysAndValues Alternating keys and
 *     values.  See the typedef.
 * @param {number=} opt_startIndex A start offset into the arary, defaults to 0.
 * @return {string} The encoded query string, in the for 'a=1&b=2'.
 */
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_(
      [], keysAndValues, opt_startIndex);
  buffer[0] = ''; // Remove the leading ampersand.
  return buffer.join('');
};


/**
 * Builds a buffer of query data from a map.
 *
 * @param {!Array.<string|undefined>} buffer A string buffer to append to.  The
 *     first element appended will be an '&', and may be replaced by the caller.
 * @param {Object.<goog.uri.utils.QueryValue>} map An object where keys are
 *     URI-encoded parameter keys, and the values conform to the contract
 *     specified in the goog.uri.utils.QueryValue typedef.
 * @return {!Array.<string|undefined>} The buffer argument.
 * @private
 */
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for (var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer);
  }

  return buffer;
};


/**
 * Builds a query data string from a map.
 *
 * Currently generates "&key=&" for empty args; there is no way to generate
 * "&key&" arguments with no equal sign.
 *
 * @param {Object} map An object where keys are URI-encoded parameter keys,
 *     and the values are arbitrary types or arrays.  Keys with a null value
 *     are dropped.
 * @return {string} The encoded query string, in the for 'a=1&b=2'.
 */
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = '';
  return buffer.join('');
};


/**
 * Appends URI parameters to an existing URI.
 *
 * The variable arguments may contain alternating keys and values.  Keys are
 * assumed to be already URI encoded.  The values should not be URI-encoded,
 * and will instead be encoded by this function.
 * <pre>
 * appendParams('http://www.foo.com?existing=true',
 *     'key1', 'value1',
 *     'key2', 'value?willBeEncoded',
 *     'key3', ['valueA', 'valueB', 'valueC'],
 *     'key4', null);
 * result: 'http://www.foo.com?existing=true&' +
 *     'key1=value1&' +
 *     'key2=value%3FwillBeEncoded&' +
 *     'key3=valueA&key3=valueB&key3=valueC'
 * </pre>
 *
 * A single call to this function will not exhibit quadratic behavior in IE,
 * whereas multiple repeated calls may, although the effect is limited by
 * fact that URL's generally can't exceed 2kb.
 *
 * @param {string} uri The original URI, which may already have query data.
 * @param {...(goog.uri.utils.QueryArray|string|goog.uri.utils.QueryValue)} var_args
 *     An array or argument list conforming to goog.uri.utils.QueryArray.
 * @return {string} The URI with all query parameters added.
 */
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(
      arguments.length == 2 ?
      goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) :
      goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1));
};


/**
 * Appends query parameters from a map.
 *
 * @param {string} uri The original URI, which may already have query data.
 * @param {Object} map An object where keys are URI-encoded parameter keys,
 *     and the values are arbitrary types or arrays.  Keys with a null value
 *     are dropped.
 * @return {string} The new parameters.
 */
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(
      goog.uri.utils.buildQueryDataBufferFromMap_([uri], map));
};


/**
 * Appends a single URI parameter.
 *
 * Repeated calls to this can exhibit quadratic behavior in IE6 due to the
 * way string append works, though it should be limited given the 2kb limit.
 *
 * @param {string} uri The original URI, which may already have query data.
 * @param {string} key The key, which must already be URI encoded.
 * @param {*} value The value, which will be stringized and encoded (assumed
 *     not already to be encoded).
 * @return {string} The URI with the query parameter added.
 */
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_(
      [uri, '&', key, '=', goog.string.urlEncode(value)]);
};


/**
 * Finds the next instance of a query parameter with the specified name.
 *
 * Does not instantiate any objects.
 *
 * @param {string} uri The URI to search.  May contain a fragment identifier
 *     if opt_hashIndex is specified.
 * @param {number} startIndex The index to begin searching for the key at.  A
 *     match may be found even if this is one character after the ampersand.
 * @param {string} keyEncoded The URI-encoded key.
 * @param {number} hashOrEndIndex Index to stop looking at.  If a hash
 *     mark is present, it should be its index, otherwise it should be the
 *     length of the string.
 * @return {number} The position of the first character in the key's name,
 *     immediately after either a question mark or a dot.
 * @private
 */
goog.uri.utils.findParam_ = function(
    uri, startIndex, keyEncoded, hashOrEndIndex) {
  var index = startIndex;
  var keyLength = keyEncoded.length;

  // Search for the key itself and post-filter for surronuding punctuation,
  // rather than expensively building a regexp.
  while ((index = uri.indexOf(keyEncoded, index)) >= 0 &&
      index < hashOrEndIndex) {
    var precedingChar = uri.charCodeAt(index - 1);
    // Ensure that the preceding character is '&' or '?'.
    if (precedingChar == goog.uri.utils.CharCode_.AMPERSAND ||
        precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      // Ensure the following character is '&', '=', '#', or NaN
      // (end of string).
      var followingChar = uri.charCodeAt(index + keyLength);
      if (!followingChar ||
          followingChar == goog.uri.utils.CharCode_.EQUAL ||
          followingChar == goog.uri.utils.CharCode_.AMPERSAND ||
          followingChar == goog.uri.utils.CharCode_.HASH) {
        return index;
      }
    }
    index += keyLength + 1;
  }

  return -1;
};


/**
 * Regular expression for finding a hash mark or end of string.
 * @type {RegExp}
 * @private
 */
goog.uri.utils.hashOrEndRe_ = /#|$/;


/**
 * Determines if the URI contains a specific key.
 *
 * Performs no object instantiations.
 *
 * @param {string} uri The URI to process.  May contain a fragment
 *     identifier.
 * @param {string} keyEncoded The URI-encoded key.  Case-sensitive.
 * @return {boolean} Whether the key is present.
 */
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return goog.uri.utils.findParam_(uri, 0, keyEncoded,
      uri.search(goog.uri.utils.hashOrEndRe_)) >= 0;
};


/**
 * Gets the first value of a query parameter.
 * @param {string} uri The URI to process.  May contain a fragment.
 * @param {string} keyEncoded The URI-encoded key.  Case-sensitive.
 * @return {?string} The first value of the parameter (URI-decoded), or null
 *     if the parameter is not found.
 */
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var foundIndex = goog.uri.utils.findParam_(
      uri, 0, keyEncoded, hashOrEndIndex);

  if (foundIndex < 0) {
    return null;
  } else {
    var endPosition = uri.indexOf('&', foundIndex);
    if (endPosition < 0 || endPosition > hashOrEndIndex) {
      endPosition = hashOrEndIndex;
    }
    // Progress forth to the end of the "key=" or "key&" substring.
    foundIndex += keyEncoded.length + 1;
    // Use substr, because it (unlike substring) will return empty string
    // if foundIndex > endPosition.
    return goog.string.urlDecode(
        uri.substr(foundIndex, endPosition - foundIndex));
  }
};


/**
 * Gets all values of a query parameter.
 * @param {string} uri The URI to process.  May contain a framgnet.
 * @param {string} keyEncoded The URI-encoded key.  Case-snsitive.
 * @return {!Array.<string>} All URI-decoded values with the given key.
 *     If the key is not found, this will have length 0, but never be null.
 */
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var result = [];

  while ((foundIndex = goog.uri.utils.findParam_(
      uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    // Find where this parameter ends, either the '&' or the end of the
    // query parameters.
    position = uri.indexOf('&', foundIndex);
    if (position < 0 || position > hashOrEndIndex) {
      position = hashOrEndIndex;
    }

    // Progress forth to the end of the "key=" or "key&" substring.
    foundIndex += keyEncoded.length + 1;
    // Use substr, because it (unlike substring) will return empty string
    // if foundIndex > position.
    result.push(goog.string.urlDecode(uri.substr(
        foundIndex, position - foundIndex)));
  }

  return result;
};


/**
 * Regexp to find trailing question marks and ampersands.
 * @type {RegExp}
 * @private
 */
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;


/**
 * Removes all instances of a query parameter.
 * @param {string} uri The URI to process.  Must not contain a fragment.
 * @param {string} keyEncoded The URI-encoded key.
 * @return {string} The URI with all instances of the parameter removed.
 */
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var buffer = [];

  // Look for a query parameter.
  while ((foundIndex = goog.uri.utils.findParam_(
      uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    // Get the portion of the query string up to, but not including, the ?
    // or & starting the parameter.
    buffer.push(uri.substring(position, foundIndex));
    // Progress to immediately after the '&'.  If not found, go to the end.
    // Avoid including the hash mark.
    position = Math.min((uri.indexOf('&', foundIndex) + 1) || hashOrEndIndex,
        hashOrEndIndex);
  }

  // Append everything that is remaining.
  buffer.push(uri.substr(position));

  // Join the buffer, and remove trailing punctuation that remains.
  return buffer.join('').replace(
      goog.uri.utils.trailingQueryPunctuationRe_, '$1');
};


/**
 * Replaces all existing definitions of a parameter with a single definition.
 *
 * Repeated calls to this can exhibit quadratic behavior in IE6 due to the
 * way string append works, though it should be limited given the 2kb limit.
 *
 * @param {string} uri The original URI, which may already have query data.
 * @param {string} keyEncoded The key, which must already be URI encoded.
 * @param {*} value The value, which will be stringized and encoded (assumed
 *     not already to be encoded).
 * @return {string} The URI with the query parameter added.
 */
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(
      goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value);
};


/**
 * Generates a URI path using a given URI and a path with checks to
 * prevent consecutive "//". The baseUri passed in must not contain
 * query or fragment identifiers. The path to append may not contain query or
 * fragment identifiers.
 *
 * @param {string} baseUri URI to use as the base.
 * @param {string} path Path to append.
 * @return {string} Updated URI.
 */
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);

  // Remove any trailing '/'
  if (goog.string.endsWith(baseUri, '/')) {
    baseUri = baseUri.substr(0, baseUri.length - 1);
  }
  // Remove any leading '/'
  if (goog.string.startsWith(path, '/')) {
    path = path.substr(1);
  }
  return goog.string.buildString(baseUri, '/', path);
};


/**
 * Standard supported query parameters.
 * @enum {string}
 */
goog.uri.utils.StandardQueryParam = {

  /** Unused parameter for unique-ifying. */
  RANDOM: 'zx'
};


/**
 * Sets the zx parameter of a URI to a random value.
 * @param {string} uri Any URI.
 * @return {string} That URI with the "zx" parameter added or replaced to
 *     contain a random string.
 */
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri,
      goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString());
};

// Input 38
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2006 Google Inc. All Rights Reserved.

/**
 * @fileoverview Class for parsing and formatting URIs.
 *
 * Use goog.Uri(string) to parse a URI string.  Use goog.Uri.create(...) to
 * create a new instance of the goog.Uri object from Uri parts.
 *
 * e.g: <code>var myUri = new goog.Uri(window.location);</code>
 *
 * Implements RFC 3986 for parsing/formatting URIs.
 * http://gbiv.com/protocols/uri/rfc/rfc3986.html
 *
 * Some changes have been made to the interface (more like .NETs), though the
 * internal representation is now of un-encoded parts, this will change the
 * behavior slightly.
 *
 */

goog.provide('goog.Uri');
goog.provide('goog.Uri.QueryData');

goog.require('goog.array');
goog.require('goog.string');
goog.require('goog.structs');
goog.require('goog.structs.Map');
goog.require('goog.uri.utils');
goog.require('goog.uri.utils.ComponentIndex');


/**
 * This class contains setters and getters for the parts of the URI.
 * The <code>getXyz</code>/<code>setXyz</code> methods return the decoded part
 * -- so<code>goog.Uri.parse('/foo%20bar').getPath()</code> will return the
 * decoded path, <code>/foo bar</code>.
 *
 * The constructor accepts an optional unparsed, raw URI string.  The parser
 * is relaxed, so special characters that aren't escaped but don't cause
 * ambiguities will not cause parse failures.
 *
 * All setters return <code>this</code> and so may be chained, a la
 * <code>goog.Uri.parse('/foo').setFragment('part').toString()</code>.
 *
 * @param {*=} opt_uri Optional string URI to parse
 *        (use goog.Uri.create() to create a URI from parts), or if
 *        a goog.Uri is passed, a clone is created.
 * @param {boolean=} opt_ignoreCase If true, #getParameterValue will ignore
 * the case of the parameter name.
 *
 * @constructor
 */
goog.Uri = function(opt_uri, opt_ignoreCase) {
  // Parse in the uri string
  var m;
  if (opt_uri instanceof goog.Uri) {
    this.setIgnoreCase(opt_ignoreCase == null ?
        opt_uri.getIgnoreCase() : opt_ignoreCase);
    this.setScheme(opt_uri.getScheme());
    this.setUserInfo(opt_uri.getUserInfo());
    this.setDomain(opt_uri.getDomain());
    this.setPort(opt_uri.getPort());
    this.setPath(opt_uri.getPath());
    this.setQueryData(opt_uri.getQueryData().clone());
    this.setFragment(opt_uri.getFragment());
  } else if (opt_uri && (m = goog.uri.utils.split(String(opt_uri)))) {
    // Set the parts -- decoding as we do so.
    this.setIgnoreCase(!!opt_ignoreCase);
    // COMPATABILITY NOTE - In IE, unmatched fields may be empty strings,
    // whereas in other browsers they will be undefined.
    this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || '', true);
    this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || '', true);
    this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || '', true);
    this.setPort(m[goog.uri.utils.ComponentIndex.PORT]);
    this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || '', true);

    this.setQuery(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || '', true);

    this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || '', true);

  } else {
    this.setIgnoreCase(!!opt_ignoreCase);
    this.queryData_ = new goog.Uri.QueryData(null, this, this.ignoreCase_);
  }
};


/**
 * Parameter name added to stop caching.
 * @type {string}
 */
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;


/**
 * Scheme such as "http".
 * @type {string}
 * @private
 */
goog.Uri.prototype.scheme_ = '';


/**
 * User credentials in the form "username:password".
 * @type {string}
 * @private
 */
goog.Uri.prototype.userInfo_ = '';


/**
 * Domain part, e.g. "www.google.com".
 * @type {string}
 * @private
 */
goog.Uri.prototype.domain_ = '';


/**
 * Port, e.g. 8080.
 * @type {?number}
 * @private
 */
goog.Uri.prototype.port_ = null;


/**
 * Path, e.g. "/tests/img.png".
 * @type {string}
 * @private
 */
goog.Uri.prototype.path_ = '';


/**
 * Object representing query data.
 * @type {goog.Uri.QueryData}
 * @private
 */
goog.Uri.prototype.queryData_;


/**
 * The fragment without the #.
 * @type {string}
 * @private
 */
goog.Uri.prototype.fragment_ = '';


/**
 * Whether or not this Uri should be treated as Read Only.
 * @type {boolean}
 * @private
 */
goog.Uri.prototype.isReadOnly_ = false;


/**
 * Whether or not to ignore case when comparing query params.
 * @type {boolean}
 * @private
 */
goog.Uri.prototype.ignoreCase_ = false;


/**
 * @return {string} The string form of the url.
 */
goog.Uri.prototype.toString = function() {
  if (this.cachedToString_) {
    return this.cachedToString_;
  }

  var out = [];

  if (this.scheme_) {
    out.push(goog.Uri.encodeSpecialChars_(
        this.scheme_, goog.Uri.reDisallowedInSchemeOrUserInfo_), ':');
  }

  if (this.domain_) {
    out.push('//');

    if (this.userInfo_) {
      out.push(goog.Uri.encodeSpecialChars_(
          this.userInfo_, goog.Uri.reDisallowedInSchemeOrUserInfo_), '@');
    }

    out.push(goog.Uri.encodeString_(this.domain_));

    if (this.port_ != null) {
      out.push(':', String(this.getPort()));
    }
  }

  if (this.path_) {
    out.push(goog.Uri.encodeSpecialChars_(
        this.path_, goog.Uri.reDisallowedInPath_));
  }

  var query = String(this.queryData_);
  if (query) {
    out.push('?', query);
  }

  if (this.fragment_) {
    out.push('#', goog.Uri.encodeSpecialChars_(
        this.fragment_, goog.Uri.reDisallowedInFragment_));
  }
  return this.cachedToString_ = out.join('');
};


/**
 * Resolves a relative url string to a this base uri.
 *
 * There are several kinds of relative urls:<br>
 * 1. foo - replaces the last part of the path, the whole query and fragment<br>
 * 2. /foo - replaces the the path, the query and fragment<br>
 * 3. //foo - replaces everything from the domain on.  foo is a domain name<br>
 * 4. ?foo - replace the query and fragment<br>
 * 5. #foo - replace the fragment only
 *
 * Additionally, if relative url has a non-empty path, all ".." and "."
 * segments will be resolved, as described in RFC 3986.
 *
 * @param {goog.Uri} relativeUri The relative url to resolve.
 * @return {goog.Uri} The resolved URI.
 */
goog.Uri.prototype.resolve = function(relativeUri) {

  var absoluteUri = this.clone();

  // we satisfy these conditions by looking for the first part of relativeUri
  // that is not blank and applying defaults to the rest

  var overridden = relativeUri.hasScheme();

  if (overridden) {
    absoluteUri.setScheme(relativeUri.getScheme());
  } else {
    overridden = relativeUri.hasUserInfo();
  }

  if (overridden) {
    absoluteUri.setUserInfo(relativeUri.getUserInfo());
  } else {
    overridden = relativeUri.hasDomain();
  }

  if (overridden) {
    absoluteUri.setDomain(relativeUri.getDomain());
  } else {
    overridden = relativeUri.hasPort();
  }

  var path = relativeUri.getPath();
  if (overridden) {
    absoluteUri.setPort(relativeUri.getPort());
  } else {
    overridden = relativeUri.hasPath();
    if (overridden) {
      // resolve path properly
      if (path.charAt(0) != '/') {
        // path is relative
        if (this.hasDomain() && !this.hasPath()) {
          // RFC 3986, section 5.2.3, case 1
          path = '/' + path;
        } else {
          // RFC 3986, section 5.2.3, case 2
          var lastSlashIndex = absoluteUri.getPath().lastIndexOf('/');
          if (lastSlashIndex != -1) {
            path = absoluteUri.getPath().substr(0, lastSlashIndex + 1) + path;
          }
        }
      }
      path = goog.Uri.removeDotSegments(path);
    }
  }

  if (overridden) {
    absoluteUri.setPath(path);
  } else {
    overridden = relativeUri.hasQuery();
  }

  if (overridden) {
    absoluteUri.setQuery(relativeUri.getDecodedQuery());
  } else {
    overridden = relativeUri.hasFragment();
  }

  if (overridden) {
    absoluteUri.setFragment(relativeUri.getFragment());
  }

  return absoluteUri;
};


/**
 * Clones the URI instance.
 * @return {goog.Uri} New instance of the URI objcet.
 */
goog.Uri.prototype.clone = function() {
  return goog.Uri.create(this.scheme_, this.userInfo_, this.domain_,
                         this.port_, this.path_, this.queryData_.clone(),
                         this.fragment_, this.ignoreCase_);
};


/**
 * @return {string} The encoded scheme/protocol for the URI.
 */
goog.Uri.prototype.getScheme = function() {
  return this.scheme_;
};


/**
 * Sets the scheme/protocol.
 * @param {string} newScheme New scheme value.
 * @param {boolean=} opt_decode Optional param for whether to decode new value.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.setScheme = function(newScheme, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme) : newScheme;

  // remove an : at the end of the scheme so somebody can pass in
  // window.location.protocol
  if (this.scheme_) {
    this.scheme_ = this.scheme_.replace(/:$/, '');
  }
  return this;
};


/**
 * @return {boolean} Whether the scheme has been set.
 */
goog.Uri.prototype.hasScheme = function() {
  return !!this.scheme_;
};


/**
 * @return {string} The decoded user info.
 */
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_;
};


/**
 * Sets the userInfo.
 * @param {string} newUserInfo New userInfo value.
 * @param {boolean=} opt_decode Optional param for whether to decode new value.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.setUserInfo = function(newUserInfo, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.userInfo_ = opt_decode ? goog.Uri.decodeOrEmpty_(newUserInfo) :
                   newUserInfo;
  return this;
};


/**
 * @return {boolean} Whether the user info has been set.
 */
goog.Uri.prototype.hasUserInfo = function() {
  return !!this.userInfo_;
};


/**
 * @return {string} The decoded domain.
 */
goog.Uri.prototype.getDomain = function() {
  return this.domain_;
};


/**
 * Sets the domain.
 * @param {string} newDomain New domain value.
 * @param {boolean=} opt_decode Optional param for whether to decode new value.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain) : newDomain;
  return this;
};


/**
 * @return {boolean} Whether the domain has been set.
 */
goog.Uri.prototype.hasDomain = function() {
  return !!this.domain_;
};


/**
 * @return {?number} The port number.
 */
goog.Uri.prototype.getPort = function() {
  return this.port_;
};


/**
 * Sets the port number.
 * @param {*} newPort Port number. Will be explicitly casted to a number.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.setPort = function(newPort) {
  this.enforceReadOnly();
  delete this.cachedToString_;

  if (newPort) {
    newPort = Number(newPort);
    if (isNaN(newPort) || newPort < 0) {
     throw Error('Bad port number ' + newPort);
    }
    this.port_ = newPort;
  } else {
    this.port_ = null;
  }

  return this;
};


/**
 * @return {boolean} Whether the port has been set.
 */
goog.Uri.prototype.hasPort = function() {
  return this.port_ != null;
};


/**
  * @return {string} The decoded path.
 */
goog.Uri.prototype.getPath = function() {
  return this.path_;
};


/**
 * Sets the path.
 * @param {string} newPath New path value.
 * @param {boolean=} opt_decode Optional param for whether to decode new value.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.setPath = function(newPath, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath) : newPath;
  return this;
};


/**
 * @return {boolean} Whether the path has been set.
 */
goog.Uri.prototype.hasPath = function() {
  return !!this.path_;
};


/**
 * @return {boolean} Whether the query string has been set.
 */
goog.Uri.prototype.hasQuery = function() {
  return this.queryData_.toString() !== '';
};


/**
 * Sets the query data.
 * @param {goog.Uri.QueryData|string|undefined} queryData QueryData object.
 * @param {boolean=} opt_decode Optional param for whether to decode new value.
 *     Applies only if queryData is a string.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.setQueryData = function(queryData, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;

  if (queryData instanceof goog.Uri.QueryData) {
    this.queryData_ = queryData;
    this.queryData_.uri_ = this;
    this.queryData_.setIgnoreCase(this.ignoreCase_);
  } else {
    // QueryData accepts encoded query string,
    // so encode it if opt_decode flag is not true.
    if (!opt_decode) {
      queryData = goog.Uri.encodeSpecialChars_(queryData,
                                               goog.Uri.reDisallowedInQuery_);
    }
    this.queryData_ =
        new goog.Uri.QueryData(queryData, this, this.ignoreCase_);
  }

  return this;
};


/**
 * Sets the URI query.
 * @param {string} newQuery New query value.
 * @param {boolean=} opt_decode Optional param for whether to decode new value.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.setQuery = function(newQuery, opt_decode) {
  return this.setQueryData(newQuery, opt_decode);
};


/**
 * @return {string} The encoded URI query, not including the ?.
 */
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString();
};


/**
 * @return {string} The decoded URI query, not including the ?.
 */
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString();
};


/**
 * Returns the query data.
 * @return {goog.Uri.QueryData} QueryData object.
 */
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_;
};


/**
 * @return {string} The encoded URI query, not including the ?.
 *
 * Warning: This method, unlike other getter methods, returns encoded
 * value, instead of decoded one.
 */
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery();
};


/**
 * Sets the value of the named query parameters, clearing previous values for
 * that key.
 *
 * @param {string} key The parameter to set.
 * @param {*} value The new value.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.setParameterValue = function(key, value) {
  this.enforceReadOnly();
  delete this.cachedToString_;

  this.queryData_.set(key, value);
  return this;
};


/**
 * Sets the values of the named query parameters, clearing previous values for
 * that key.  Not new values will currently be moved to the end of the query
 * string.
 *
 * So, <code>goog.Uri.parse('foo?a=b&c=d&e=f').setParameterValues('c', ['new'])
 * </code> yields <tt>foo?a=b&e=f&c=new</tt>.</p>
 *
 * @param {string} key The parameter to set.
 * @param {*} values The new values. If values is a single
 *     string then it will be treated as the sole value.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.setParameterValues = function(key, values) {
  this.enforceReadOnly();
  delete this.cachedToString_;

  if (!goog.isArray(values)) {
    values = [String(values)];
  }

  // TODO: This cast shouldn't be necessary.
  this.queryData_.setValues(key, /** @type {Array} */ (values));

  return this;
};


/**
 * Returns the value<b>s</b> for a given cgi parameter as a list of decoded
 * query parameter values.
 * @param {string} name The parameter to get values for.
 * @return {Array} The values for a given cgi parameter as a list of
 *     decoded query parameter values.
 */
goog.Uri.prototype.getParameterValues = function(name) {
    return this.queryData_.getValues(name);
};


/**
 * Returns the first value for a given cgi parameter or undefined if the given
 * parameter name does not appear in the query string.
 * @param {string} paramName Unescaped parameter name.
 * @return {*} The first value for a given cgi parameter or
 *     undefined if the given parameter name does not appear in the query
 *     string.
 */
goog.Uri.prototype.getParameterValue = function(paramName) {
  return this.queryData_.get(paramName);
};


/**
 * @return {string} The URI fragment, not including the #.
 */
goog.Uri.prototype.getFragment = function() {
  return this.fragment_;
};


/**
 * Sets the URI fragment.
 * @param {string} newFragment New fragment value.
 * @param {boolean=} opt_decode Optional param for whether to decode new value.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.setFragment = function(newFragment, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.fragment_ = opt_decode ? goog.Uri.decodeOrEmpty_(newFragment) :
                   newFragment;
  return this;
};


/**
 * @return {boolean} Whether the URI has a fragment set.
 */
goog.Uri.prototype.hasFragment = function() {
  return !!this.fragment_;
};


/**
 * Returns true if this has the same domain as that of uri2.
 * @param {goog.Uri} uri2 The URI object to compare to.
 * @return {boolean} true if same domain; false otherwise.
 */
goog.Uri.prototype.hasSameDomainAs = function(uri2) {
  return ((!this.hasDomain() && !uri2.hasDomain()) ||
          this.getDomain() == uri2.getDomain()) &&
      ((!this.hasPort() && !uri2.hasPort()) ||
          this.getPort() == uri2.getPort());
};


/**
 * Adds a random parameter to the Uri.
 * @return {goog.Uri} Reference to this Uri object.
 */
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());

  return this;
};


/**
 * Removes the named query parameter.
 *
 * @param {string} key The parameter to remove.
 * @return {goog.Uri} Reference to this URI object.
 */
goog.Uri.prototype.removeParameter = function(key) {
  this.enforceReadOnly();
  this.queryData_.remove(key);
  return this;
};


/**
 * Sets whether Uri is read only. If this goog.Uri is read-only,
 * enforceReadOnly_ will be called at the start of any function that may modify
 * this Uri.
 * @param {boolean} isReadOnly whether this goog.Uri should be read only.
 */
goog.Uri.prototype.setReadOnly = function(isReadOnly) {
  this.isReadOnly_ = isReadOnly;
};


/**
 * @return {boolean} Whether the URI is read only.
 */
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_;
};


/**
 * Checks if this Uri has been marked as read only, and if so, throws an error.
 * This should be called whenever any modifying function is called.
 */
goog.Uri.prototype.enforceReadOnly = function() {
  if (this.isReadOnly_) {
    throw Error('Tried to modify a read-only Uri');
  }
};


/**
 * Sets whether to ignore case.
 * NOTE: If there are already key/value pairs in the QueryData, and
 * ignoreCase_ is set to false, the keys will all be lower-cased.
 * @param {boolean} ignoreCase whether this goog.Uri should ignore case.
 */
goog.Uri.prototype.setIgnoreCase = function(ignoreCase) {
  this.ignoreCase_ = ignoreCase;
  if (this.queryData_) {
    this.queryData_.setIgnoreCase(ignoreCase);
  }
};


/**
 * @return {boolean} Whether to ignore case.
 */
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_;
};


//==============================================================================
// Static members
//==============================================================================


/**
 * Creates a uri from the string form.  Basically an alias of new goog.Uri().
 * If a Uri object is passed to parse then it will return a clone of the object.
 *
 * @param {*} uri Raw URI string or instance of Uri
 *     object.
 * @param {boolean=} opt_ignoreCase Whether to ignore the case of parameter
 * names in #getParameterValue.
 * @return {goog.Uri} The new URI object.
 */
goog.Uri.parse = function(uri, opt_ignoreCase) {
  return uri instanceof goog.Uri ?
         uri.clone() : new goog.Uri(uri, opt_ignoreCase);
};


/**
 * Creates a new goog.Uri object from unencoded parts.
 *
 * @param {?string=} opt_scheme Scheme/protocol or full URI to parse.
 * @param {?string=} opt_userInfo username:password.
 * @param {?string=} opt_domain www.google.com.
 * @param {?number=} opt_port 9830.
 * @param {?string=} opt_path /some/path/to/a/file.html.
 * @param {string|goog.Uri.QueryData=} opt_query a=1&b=2.
 * @param {?string=} opt_fragment The fragment without the #.
 * @param {boolean=} opt_ignoreCase Whether to ignore parameter name case in
 *     #getParameterValue.
 *
 * @return {goog.Uri} The new URI object.
 */
goog.Uri.create = function(opt_scheme, opt_userInfo, opt_domain, opt_port,
                           opt_path, opt_query, opt_fragment, opt_ignoreCase) {

  var uri = new goog.Uri(null, opt_ignoreCase);

  // Only set the parts if they are defined and not empty strings.
  opt_scheme && uri.setScheme(opt_scheme);
  opt_userInfo && uri.setUserInfo(opt_userInfo);
  opt_domain && uri.setDomain(opt_domain);
  opt_port && uri.setPort(opt_port);
  opt_path && uri.setPath(opt_path);
  opt_query && uri.setQueryData(opt_query);
  opt_fragment && uri.setFragment(opt_fragment);

  return uri;
};


/**
 * Resolves a relative Uri against a base Uri, accepting both strings and
 * Uri objects.
 *
 * @param {*} base Base Uri.
 * @param {*} rel Relative Uri.
 * @return {goog.Uri} Resolved uri.
 */
goog.Uri.resolve = function(base, rel) {
  if (!(base instanceof goog.Uri)) {
    base = goog.Uri.parse(base);
  }

  if (!(rel instanceof goog.Uri)) {
    rel = goog.Uri.parse(rel);
  }

  return base.resolve(rel);
};


/**
 * Removes dot segments in given path component, as described in
 * RFC 3986, section 5.2.4.
 *
 * @param {string} path A non-empty path component.
 * @return {string} Path component with removed dot segments.
 */
goog.Uri.removeDotSegments = function(path) {
  if (path == '..' || path == '.') {
    return '';

  } else if (!goog.string.contains(path, './') &&
             !goog.string.contains(path, '/.')) {
    // This optimization detects uris which do not contain dot-segments,
    // and as a consequence do not require any processing.
    return path;

  } else {
    var leadingSlash = goog.string.startsWith(path, '/');
    var segments = path.split('/');
    var out = [];

    for (var pos = 0; pos < segments.length; ) {
      var segment = segments[pos++];

      if (segment == '.') {
        if (leadingSlash && pos == segments.length) {
          out.push('');
        }
      } else if (segment == '..') {
        if (out.length > 1 || out.length == 1 && out[0] != '') {
          out.pop();
        }
        if (leadingSlash && pos == segments.length) {
          out.push('');
        }
      } else {
        out.push(segment);
        leadingSlash = true;
      }
    }

    return out.join('/');
  }
};


/**
 * Decodes a value or returns the empty string if it isn't defined or empty.
 * @param {string|undefined} val Value to decode.
 * @return {string} Decoded value.
 * @private
 */
goog.Uri.decodeOrEmpty_ = function(val) {
  // Don't use UrlDecode() here because val is not a query parameter.
  return val ? decodeURIComponent(val) : '';
};


/**
 * URI encode a string, or return null if it's not a string.
 * @param {*} unescapedPart Unescaped string.
 * @return {?string} Escaped string.
 * @private
 */
goog.Uri.encodeString_ = function(unescapedPart) {
  if (goog.isString(unescapedPart)) {
    return encodeURIComponent(unescapedPart);
  }
  return null;
};


/**
 * Regular expression used for determining if a string needs to be encoded.
 * @type {RegExp}
 * @private
 */
goog.Uri.encodeSpecialRegExp_ = /^[a-zA-Z0-9\-_.!~*'():\/;?]*$/;


/**
 * If unescapedPart is non null, then escapes any characters in it that aren't
 * valid characters in a url and also escapes any special characters that
 * appear in extra.
 *
 * @param {*} unescapedPart The string to encode.
 * @param {RegExp} extra A character set of characters in [\01-\177].
 * @return {?string} null iff unescapedPart == null.
 * @private
 */
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra) {
  var ret = null;
  if (goog.isString(unescapedPart)) {
    ret = unescapedPart;
    // Checking if the search matches before calling encodeURI avoids an extra
    // allocation in IE6
    if (!goog.Uri.encodeSpecialRegExp_.test(ret)) {
      ret = encodeURI(unescapedPart);
    }
    // Checking if the search matches before calling replace avoids an extra
    // allocation in IE6
    if (ret.search(extra) >= 0) {
      ret = ret.replace(extra, goog.Uri.encodeChar_);
    }
  }
  return ret;
};


/**
 * Converts a character in [\01-\177] to its unicode character equivalent.
 * @param {string} ch One character string.
 * @return {string} Encoded string.
 * @private
 */
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return '%' + ((n >> 4) & 0xf).toString(16) + (n & 0xf).toString(16);
};


/**
 * Regular expression for characters that are disallowed in the scheme or
 * userInfo part of the URI.
 * @type {RegExp}
 * @private
 */
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;


/**
 * Regular expression for characters that are disallowed in the path.
 * @type {RegExp}
 * @private
 */
goog.Uri.reDisallowedInPath_ = /[\#\?]/g;


/**
 * Regular expression for characters that are disallowed in the query.
 * @type {RegExp}
 * @private
 */
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;


/**
 * Regular expression for characters that are disallowed in the fragment.
 * @type {RegExp}
 * @private
 */
goog.Uri.reDisallowedInFragment_ = /#/g;


/**
 * Checks whether two URIs have the same domain.
 * @param {string} uri1String First URI string.
 * @param {string} uri2String Second URI string.
 * @return {boolean} true if the two URIs have the same domain; false otherwise.
 */
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  // Differs from goog.uri.utils.haveSameDomain, since this ignores scheme.
  // TODO: Have this just call goog.uri.util.haveSameDomain.
  var pieces1 = goog.uri.utils.split(uri1String);
  var pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] ==
             pieces2[goog.uri.utils.ComponentIndex.DOMAIN] &&
         pieces1[goog.uri.utils.ComponentIndex.PORT] ==
             pieces2[goog.uri.utils.ComponentIndex.PORT];
};




/**
 * Class used to represent URI query parameters.  It is essentially a hash of
 * name-value pairs, though a name can be present more than once.
 *
 * Has the same interface as the collections in goog.structs.
 *
 * @param {?string=} opt_query Optional encoded query string to parse into
 *     the object.
 * @param {goog.Uri=} opt_uri Optional uri object that should have its cache
 *     invalidated when this object updates.
 * @param {boolean=} opt_ignoreCase If true, ignore the case of the parameter
 *     name in #get.
 * @constructor
 */
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  /**
   * Encoded query string, or null if it requires computing from the key map.
   * @type {?string}
   * @private
   */
  this.encodedQuery_ = opt_query || null;

  /**
   * Reference to a uri object which uses the query data.  This allows the
   * QueryData object to invalidate the cache.
   * @type {goog.Uri}
   * @private
   */
  this.uri_ = opt_uri || null;

  /**
   * If true, ignore the case of the parameter name in #get.
   * @type {boolean}
   * @private
   */
  this.ignoreCase_ = !!opt_ignoreCase;
};


/**
 * If the underlying key map is not yet initialized, it parses the
 * query string and fills the map with parsed data.
 * @private
 */
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if (!this.keyMap_) {
    this.keyMap_ = new goog.structs.Map();

    if (this.encodedQuery_) {
      var pairs = this.encodedQuery_.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var indexOfEquals = pairs[i].indexOf('=');
        var name = null;
        var value = null;
        if (indexOfEquals >= 0) {
          name = pairs[i].substring(0, indexOfEquals);
          value = pairs[i].substring(indexOfEquals + 1);
        } else {
          name = pairs[i];
        }
        name = goog.string.urlDecode(name);
        name = this.getKeyName_(name);
        this.add(name, value ? goog.string.urlDecode(value) : '');
      }
    }
  }
};


/**
 * Creates a new query data instance from a map of names and values.
 *
 * @param {!goog.structs.Map|!Object} map Map of string parameter names to
 *     string parameter values.
 * @param {goog.Uri=} opt_uri URI object that should have its cache
 *     invalidated when this object updates.
 * @param {boolean=} opt_ignoreCase If true, ignore the case of the parameter
 *     name in #get.
 * @return {!goog.Uri.QueryData} The populated query data instance.
 */
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if (typeof keys == 'undefined'){
    throw Error('Keys are undefined');
  }
  return goog.Uri.QueryData.createFromKeysValues(
      keys,
      goog.structs.getValues(map),
      opt_uri,
      opt_ignoreCase);
};


/**
 * Creates a new query data instance from parallel arrays of parameter names
 * and values. Allows for duplicate parameter names. Throws an error if the
 * lengths of the arrays differ.
 *
 * @param {Array.<string>} keys Parameter names.
 * @param {Array} values Parameter values.
 * @param {goog.Uri=} opt_uri URI object that should have its cache
 *     invalidated when this object updates.
 * @param {boolean=} opt_ignoreCase If true, ignore the case of the parameter
 *     name in #get.
 * @return {!goog.Uri.QueryData} The populated query data instance.
 */
goog.Uri.QueryData.createFromKeysValues = function(
    keys, values, opt_uri, opt_ignoreCase) {
  if (keys.length != values.length) {
    throw Error('Mismatched lengths for keys/values');
  }
  var queryData = new goog.Uri.QueryData(null, opt_uri, opt_ignoreCase);
  for (var i = 0; i < keys.length; i++) {
    queryData.add(keys[i], values[i]);
  }
  return queryData;
};


/**
 * The map containing name/value or name/array-of-values pairs.
 * May be null if it requires parsing from the query string.
 *
 * We need to use a Map because we cannot guarantee that the key names will
 * not be problematic for IE.
 *
 * @type {Object}
 * @private
 */
goog.Uri.QueryData.prototype.keyMap_ = null;


/**
 * The number of params, or null if it requires computing.
 * @type {?number}
 * @private
 */
goog.Uri.QueryData.prototype.count_ = null;


/**
 * Decoded query string, or null if it requires computing.
 * @type {?string}
 * @private
 */
goog.Uri.QueryData.decodedQuery_ = null;


/**
 * @return {?number} The number of parameters.
 */
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_;
};


/**
 * Adds a key value pair.
 * @param {string} key Name.
 * @param {*} value Value.
 * @return {goog.Uri.QueryData} Instance of this object.
 */
goog.Uri.QueryData.prototype.add = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();

  key = this.getKeyName_(key);
  if (!this.containsKey(key)) {
    this.keyMap_.set(key, value);
  } else {
    var current = this.keyMap_.get(key);
    if (goog.isArray(current)) {
      current.push(value);
    } else {
      this.keyMap_.set(key, [current, value]);
    }
  }

  this.count_++;

  return this;
};


/**
 * Removes all the params with the given key.
 * @param {string} key Name.
 * @return {boolean} Whether any parameter was removed.
 */
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();

  key = this.getKeyName_(key);
  if (this.keyMap_.containsKey(key)) {
    this.invalidateCache_();

    // we need to get it to know how many to decrement the count with
    var old = this.keyMap_.get(key);
    if (goog.isArray(old)) {
      this.count_ -= old.length;
    } else {
      this.count_--;
    }
    return this.keyMap_.remove(key);
  }
  return false;
};


/**
 * Clears the parameters.
 */
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  if (this.keyMap_) {
    this.keyMap_.clear();
  }
  this.count_ = 0;
};


/**
 * @return {boolean} Whether we have any parameters.
 */
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return this.count_ == 0;
};


/**
 * Whether there is a parameter with the given name
 * @param {string} key The parameter name to check for.
 * @return {boolean} Whether there is a parameter with the given name.
 */
goog.Uri.QueryData.prototype.containsKey = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key);
};


/**
 * Whether there is a parameter with the given value.
 * @param {*} value The value to check for.
 * @return {boolean} Whether there is a parameter with the given value.
 */
goog.Uri.QueryData.prototype.containsValue = function(value) {
  // NOTE: This solution goes through all the params even if it was the
  // first param. We can get around this by not reusing code or by switching to
  // iterators.
  var vals = this.getValues();
  return goog.array.contains(vals, value);
};


/**
 * Returns all the keys of the parameters. If a key is used multiple times
 * it will be included multiple times in the returned array
 * @return {Array} All the keys of the parameters.
 */
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  // We need to get the values to know how many keys to add.
  var vals = this.keyMap_.getValues(); // Array.<Array|String>
  var keys = this.keyMap_.getKeys(); // Array.<String>
  var rv = [];
  for (var i = 0; i < keys.length; i++) {
    var val = vals[i];
    if (goog.isArray(val)) {
      for (var j = 0; j < val.length; j++) {
        rv.push(keys[i]);
      }
    } else {
      rv.push(keys[i]);
    }
  }
  return rv;
};


/**
 * Returns all the values of the parameters with the given name. If the query
 * data has no such key this will return an empty array. If no key is given
 * all values wil be returned.
 * @param {string=} opt_key The name of the parameter to get the values for.
 * @return {Array} All the values of the parameters with the given name.
 */
goog.Uri.QueryData.prototype.getValues = function(opt_key) {
  this.ensureKeyMapInitialized_();
  var rv;
  if (opt_key) {
    var key = this.getKeyName_(opt_key);
    if (this.containsKey(key)) {
      var value = this.keyMap_.get(key);
      if (goog.isArray(value)) {
        return value;
      } else {
        rv = [];
        rv.push(value);
      }
    } else {
      rv = [];
    }
  } else {
    // return all values
    var vals = this.keyMap_.getValues(); // Array.<Array|String>
    rv = [];
    for (var i = 0; i < vals.length; i++) {
      var val = vals[i];
      if (goog.isArray(val)) {
        goog.array.extend(rv, val);
      } else {
        rv.push(val);
      }
    }
  }
  return rv;
};


/**
 * Sets a key value pair and removes all other keys with the same value.
 *
 * @param {string} key Name.
 * @param {*} value Value.
 * @return {goog.Uri.QueryData} Instance of this object.
 */
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();

  key = this.getKeyName_(key);
  if (this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if (goog.isArray(old)) {
      this.count_ -= old.length;
    } else {
      this.count_--;
    }
  }

  this.keyMap_.set(key, value);
  this.count_++;
  return this;
};


/**
 * Returns the first value associated with the key. If the query data has no
 * such key this will return undefined or the optional default.
 * @param {string} key The name of the parameter to get the value for.
 * @param {*=} opt_default The default value to return if the query data
 *     has no such key.
 * @return {*} The first value associated with the key.
 */
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if (this.containsKey(key)) {
    var val = this.keyMap_.get(key);
    if (goog.isArray(val)) {
      return val[0];
    } else {
      return val;
    }
  } else {
    return opt_default;
  }
};


/**
 * Sets the values for a key, if the key has already got values defined, this
 * will override the existing values then remove any left over
 * @param {string} key The key to set values for.
 * @param {Array} values The values to set.
 */
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();

  key = this.getKeyName_(key);
  if (this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if (goog.isArray(old)) {
      this.count_ -= old.length;
    } else {
      this.count_--;
    }
  }

  if (values.length > 0) {
    this.keyMap_.set(key, values);
    this.count_ += values.length;
  }
};


/**
 * @return {string} Encoded query string.
 */
goog.Uri.QueryData.prototype.toString = function() {
  if (this.encodedQuery_) {
    return this.encodedQuery_;
  }

  if (!this.keyMap_) {
    return '';
  }

  var sb = [];

  // this used to use this.getKeys and this.getVals but that generates a lot
  // allocations than just iterating over the keys
  var count = 0;
  var keys = this.keyMap_.getKeys();
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var encodedKey = goog.string.urlEncode(key);
    var val = this.keyMap_.get(key);
    if (goog.isArray(val)) {
      for (var j = 0; j < val.length; j++) {
        if (count > 0) {
          sb.push('&');
        }
        sb.push(encodedKey, '=', goog.string.urlEncode(val[j]));
        count++;
      }
    } else {
      if (count > 0) {
        sb.push('&');
      }
      sb.push(encodedKey, '=', goog.string.urlEncode(val));
      count++;
    }
  }

  return this.encodedQuery_ = sb.join('');
};


/**
 * @return {string} Decoded query string.
 */
goog.Uri.QueryData.prototype.toDecodedString = function() {
  if (!this.decodedQuery_) {
    this.decodedQuery_ = goog.Uri.decodeOrEmpty_(this.toString());
  }

  return this.decodedQuery_;
};


/**
 * Invalidate the cache.
 * @private
 */
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  delete this.decodedQuery_;
  delete this.encodedQuery_;
  if (this.uri_) {
    delete this.uri_.cachedToString_;
  }
};


/**
 * Removes all keys that are not in the provided list. (Modifies this object.)
 * @param {Array.<string>} keys The desired keys.
 * @return {goog.Uri.QueryData} a reference to this object.
 */
goog.Uri.QueryData.prototype.filterKeys = function(keys) {
  this.ensureKeyMapInitialized_();
  goog.structs.forEach(this.keyMap_, function(value, key, map) {
    if (!goog.array.contains(keys, key)) {
      this.remove(key);
    }
  }, this);
  return this;
};


/**
 * Clone the query data instance.
 * @return {goog.Uri.QueryData} New instance of the QueryData object.
 */
goog.Uri.QueryData.prototype.clone = function() {
  var rv = new goog.Uri.QueryData();
  if (this.decodedQuery_) {
    rv.decodedQuery_ = this.decodedQuery_;
  }
  if (this.encodedQuery_) {
    rv.encodedQuery_ = this.encodedQuery_;
  }
  if (this.keyMap_) {
    rv.keyMap_ = this.keyMap_.clone();
  }
  return rv;
};


/**
 * Helper function to get the key name from a JavaScript object. Converts
 * the object to a string, and to lower case if necessary.
 * @private
 * @param {*} arg The object to get a key name from.
 * @return {string} valid key name which can be looked up in #keyMap_.
 */
goog.Uri.QueryData.prototype.getKeyName_ = function(arg) {
  var keyName = String(arg);
  if (this.ignoreCase_) {
    keyName = keyName.toLowerCase();
  }
  return keyName;
};


/**
 * Ignore case in parameter names.
 * NOTE: If there are already key/value pairs in the QueryData, and
 * ignoreCase_ is set to false, the keys will all be lower-cased.
 * @param {boolean} ignoreCase whether this goog.Uri should ignore case.
 */
goog.Uri.QueryData.prototype.setIgnoreCase = function(ignoreCase) {
  var resetKeys = ignoreCase && !this.ignoreCase_;
  if (resetKeys) {
    this.ensureKeyMapInitialized_();
    this.invalidateCache_();
    goog.structs.forEach(this.keyMap_, function(value, key, map) {
      var lowerCase = key.toLowerCase();
      if (key != lowerCase) {
        this.remove(key);
        this.add(lowerCase, value);
      }
    }, this);
  }
  this.ignoreCase_ = ignoreCase;
};


/**
 * Extends a query data object with another query data or map like object. This
 * operates 'in-place', it does not create a new QueryData object.
 *
 * @param {...(goog.Uri.QueryData|goog.structs.Map|Object)} var_args The object
 *     from which key value pairs will be copied.
 */
goog.Uri.QueryData.prototype.extend = function(var_args) {
  for (var i = 0; i < arguments.length; i++) {
    var data = arguments[i];
    goog.structs.forEach(data, function(value, key) {
      this.add(key, value);
    }, this);
  }
};

// Input 39
/*
Copyright 2010 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * @fileoverview A simple javascript image viewer that allows the user to drag
 *               left and right to flip through images, or use the scroll
 *               wheel to zoom in and out.
 *
 */

goog.provide('swivel_viewer.Swivel');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.math.Size');
goog.require('goog.fx.dom.FadeOutAndHide');
goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.Uri');

/**
 * Constructor for the Swivel object.  If containerDiv is NULL, appends
 * the viewer DIV to the DOM.  Otherwise, puts it inside the specified element.
 *
 * @param {element} containerDiv if not NULL, append to this DIV
 * @param {Array} imageUrls set of image urls for displaying swivel images.
 * @param {number} width width of the swivel view.
 * @param {number} height height of the swivel view.
 * @constructor
 */
swivel_viewer.Swivel = function(containerDiv, imageUrls, width, height) {

  if (containerDiv == null) {
    this.swivelContents_ = document.createElement('div');
    this.swivelContents_.id = "SwivelContents";
    this.swivelContents_.style.width = width + "px";
    this.swivelContents_.style.height = height + "px";
    this.swivelContents_.style.position = "relative";
    document.body.appendChild(this.swivelContents_);
  } else {
    this.swivelContents_ = containerDiv;
  }

  this.doc_ = document;
  this.nPreloadImages_ = 6;
  // IE counts ',' instead of fields.
  var last = imageUrls.pop();
  if (last != null)
    imageUrls.push(last);
  this.imageUrls_ = imageUrls;
  this.swivelWidth_ = width;
  this.swivelHeight_ = height;
  this.imageWidth_ = width;
  this.imageHeight_ = height;
  this.swivelSize_ = new goog.math.Size(width, height);
  this.imageSize_ = new goog.math.Size(width, height);
  this.mouseWheelHandler_ = null;
  this.autoSpin_ = true;
  // Useful if you're loading images from picasa; rewrites image
  // URLs to load the most appropriate size for the current zoom
  // level:
  this.rewriteURLs_ = false;
  this.showImageIsWaitingForATimeout_ = false;

  this.initImages();
};

/**
 * A closure animation for fading out the zoom amount.
 * @type {goog.fx.dom.FadeOutAndHide}
 * @private
 */
swivel_viewer.Swivel.prototype.zoomFadeFx_ = null;

/**
 * Time (ms) to delay before trying to re-display an image.
 */
swivel_viewer.Swivel.REDISPLAY_IMAGE_DELAY = 1000;

/**
 * Number of re-tries for display of image before giving up.
 */
swivel_viewer.Swivel.IMAGE_DISPLAY_RETRIES = 10;

/**
 * Size of the help icon, so that it can be centered.
 */
swivel_viewer.Swivel.HELP_ICON_WIDTH = 200;
swivel_viewer.Swivel.HELP_ICON_HEIGHT = 90;

/**
 * Amount (percentage) to scale the canvas incrementally (ie., when the user
 * uses shift + wheel to grow or shrink the viewer window).
 */
swivel_viewer.Swivel.SCALE_INCREMENT = 0.1;

/**
 * The minimum window size, as a fraction of the original size.
 */
swivel_viewer.Swivel.MIN_SCALE = 0.25;

/**
 * The maximum window size, as a fraction of the original size.
 */
swivel_viewer.Swivel.MAX_SCALE = 10;

/**
 * Amount to scale images on each zoom step.
 */
swivel_viewer.Swivel.ZOOM_INCREMENT = 0.25;

/**
 * The minimum allowed zoom factor. Most images start to disappear any smaller
 * than this.
 */
swivel_viewer.Swivel.MIN_ZOOM = 1;

/**
 * The maximum allowed zoom factor, so that users don't get stuck at absurd
 * zoom levels.
 */ 
swivel_viewer.Swivel.MAX_ZOOM = 8;

/**
 * In addition to limiting by zoom level, limit by the maximum image size to
 * request.  That lets the user zoom a 100px viewer up to the full 1600px,
 * and limits an 800px viewer from trying to zoom in 10x.
 * Picasa serves images up to 1600px tall or wide.
 */
swivel_viewer.Swivel.MAX_IMAGE_DIMENSION = 1600;

/**
 * Duration (in ms) of the fade-out effect on the zoom indicator after each
 * zoom action.
 */
swivel_viewer.Swivel.ZOOM_FADE_TIMEOUT = 1200;

/**
 * Adjust image size and offset in initialization.
 * @private
 */
swivel_viewer.Swivel.prototype.initializeSizeAndOffset = function() {
  // Scale the images if they are too large for the view. This will scale
  // them down to fit, but never scale up.
  if (!this.imageSize_.fitsInside(this.swivelSize_)) {
    this.imageSize_ = this.imageSize_.scaleToFit(this.swivelSize_);
  }

  // Center the images within the view.
  this.leftIncrement_ = 0;
  var horizontalDiff = this.swivelSize_.width - this.imageSize_.width;
  if (horizontalDiff > 0) {
    this.leftIncrement_ = Math.floor(horizontalDiff / 2);
  }
  this.topIncrement_ = 0;
  var verticalDiff = this.swivelSize_.height - this.imageSize_.height;
  if (verticalDiff > 0) {
    this.topIncrement_ = Math.floor(verticalDiff / 2);
  }
};

/**
 * Initializes loading and display of the swivel images. Creates an Image object
 * for each image url. Creates an array that's the appropriate size to hold all
 * of the images. Starts loading every nth image. Once these are loaded, fill in
 * the gaps with the rest of the images. When a user tries to swivel, we will
 * check whether the image at that position has been loaded yet. If not, we'll
 * find the closest image that has been loaded.
 */
swivel_viewer.Swivel.prototype.initImages = function() {
  var imageCount = this.imageUrls_.length;
  this.imageArray_ = new Array(imageCount);

  this.initializeSizeAndOffset();
  // load up the imageArray with the sketchUp images
  var i = 0;
  var remainingIndices = new Array();
  // We preload nPreloadImages_. Calculate how many images to skip (incr) during
  // the pre-load, which is the total number of images over the number of
  // preloaded images.
  var incr = imageCount / this.nPreloadImages_;
  while (i < imageCount) {
    this.createImage(i);
    i++;

    if (i >= imageCount) {
      break;
    }

    // Skip images that will be loaded later. Count up to 'incr', incrementing
    // the index each time, and keep track of the indices we skipped.
    for ( var skip = 1; skip < incr; skip++) {
      remainingIndices.push(i);
      this.imageArray_[i] = null;
      i++;
      if (i >= imageCount) {
        break;
      }
    }
  }
  // Initialize the display based on the full count of images.
  this.initDisplay(remainingIndices);
};

swivel_viewer.Swivel.prototype.autoRotate = function() {
  if (!this.autoSpin_) {
    return false;
  }
  var imageCount = this.imageUrls_.length;
  this.addToPos_ = 1;
  // handle wrap around
  var wrap = (this.currentPos_ + this.addToPos_) % imageCount;

  var newPos = (wrap < 0) ? imageCount + wrap : wrap;
  // If the image at newPos exists, hide all the others and show that image.
  var img = this.imageArray_[newPos];
  if (this.hasLoadedInBrowser(img)) {
    for ( var i = 0; i < imageCount; i++) {
      if (this.imageArray_[i] != null) {
        this.hideImage(this.imageArray_[i]);
      }
    }
    this.showImage(newPos, 1);
  }
  this.currentPos_ += this.addToPos_;
  return true;
}


swivel_viewer.Swivel.prototype.updateURLs = function(img_width,
                                                 img_height) {
  if (!this.rewriteURLs_) {
    return;
  }

  var size_list = [32, 48, 64, 72, 94, 104, 110, 128, 144, 150, 160, 200,
                   220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024,
                   1152, 1280, 1440, 1600
                   ];
  // Grab size that is the smallest one larger than or equal to
  // width or height.
  var url_size = size_list[size_list.length - 1];
  for (var n = 0; n < size_list.length; n++) {
    var size = size_list[n];
    var thumb_width, thumb_height;
    if (img_width == img_height) {
      thumb_width = size;
      thumb_height = size;
    } else if (img_width > img_height) {
      thumb_width = size;
      thumb_height = parseInt((size * img_height) / img_width, 10);
    } else {
      thumb_width = parseInt((size * img_width) / img_height, 10);
      thumb_height = size;
    }
    if ((thumb_width >= img_width) || (thumb_height >= img_height)) {
      url_size = size;
      break;
    }
  }

  for (var n = 0; n < this.imageUrls_.length; n++) {
    var url_split = this.imageUrls_[n].split('/');
    var image_name = url_split.pop();
    url_split.pop();
    url_split.push('s' + url_size);
    url_split.push(image_name);
    this.imageUrls_[n] = url_split.join('/');
  }
};

/**
 * Create an Image object and add it to the image array. If the image size is
 * greater than the view size, scale the image.
 * 
 * @param {number} indx Index of the image to be created.
 */
swivel_viewer.Swivel.prototype.createImage = function(indx) {
  // Create an image object. Once the src is set, the browser will begin
  // to load the image.
  var dom = new goog.dom.DomHelper(this.doc_);
  var image = dom.createDom('img', {
    'src' :this.imageUrls_[indx]
  });
  this.imageArray_[indx] = image;
  this.resizeImage_(indx);
  // Hide the image until we swivel to it.
  this.hideImage(image);
  goog.dom.appendChild(this.swivelContents_, image);
};

swivel_viewer.Swivel.prototype.reloadImages_ = function() {
  for (var indx = 0; indx < this.imageArray_.length; ++indx) {
    var image = this.imageArray_[indx];
    image.src = this.imageUrls_[indx];
  }
};

/**
 * Resize the sheet by swivelSize_.
 * @private
 */
swivel_viewer.Swivel.prototype.resizeSheet_ = function(sheet) {
  sheet.style.width = this.swivelSize_.width + "px";
  sheet.style.height = this.swivelSize_.height + "px";
  sheet.style.position = 'absolute';
  sheet.style.zIndex = '5';
  sheet.style.top = 0 + "px";
  sheet.style.left = 0 + "px";
};

/**
 * Resize the indx-th image by imageSize_ and offsets.
 * @private
 */
swivel_viewer.Swivel.prototype.resizeImage_ = function(indx) {
  var image = this.imageArray_[indx];
  image.style.width = this.imageSize_.width;
  image.style.height = this.imageSize_.height;
  image.style.left = this.leftIncrement_ + "px";
  image.style.top = this.topIncrement_ + "px";
  image.style.overflow = "hidden";
  image.style.position = "relative";
  image.style.zIndex = "2";
};

/**
 * Once the images are loaded, sets the sketchUpImageArray to the temporary
 * array and initialize swivel parameters.
 * 
 * @param {Array} remainingIndices Indices for images that have not yet been
 *     created.
 */
swivel_viewer.Swivel.prototype.initDisplay = function(remainingIndices) {
  // Create a help message display that is shown until the user's first mouse
  // down.
  this.initHelpIcon();
  this.initZoomIndicator();

  var imageCount = this.imageArray_.length;

  this.currentPos_ = 0;
  this.addToPos_ = 0;
  this.mouseXOrig_ = 0;
  this.mouseX_ = 0;
  this.mouseY_ = 0;
  this.mouseIsDown_ = false;
  this.currentZoom_ = 1;
  this.currentScale_ = 1;

  // create a transparent sheet over the images so that the mouse
  // events go to it
  var dom = new goog.dom.getDomHelper(this.doc_);
  var sheet = dom.createDom('div', {'class' :'sheet'});
  sheet.id = "sheet";
  this.resizeSheet_(sheet);
  goog.style.setOpacity(sheet, 0);

  goog.dom.appendChild(this.swivelContents_, sheet);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEMOVE,
      this.doMouseMove, true, this);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEDOWN,
      this.doMouseDown, false, this);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEUP,
      this.doMouseUp, true, this);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEOVER,
      this.doMouseIn, false, this);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEOUT,
      this.doMouseOut, false, this);
  this.mouseWheelHandler_ = new goog.events.MouseWheelHandler(
      this.swivelContents_);
  goog.events.listen(this.mouseWheelHandler_,
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.zoom, false,
      this);
  this.currentPos_ = 0;
  
  // Add the remaining images.
  for (var n = 0; n < remainingIndices.length; n++) {
    this.createImage(remainingIndices[n]);
  }

  this.showImage(this.currentPos_, 1);
};

/**
 * Shows or hides the given element, identified by ID.
 *
 * @param {string} id the ID of the element to show or hide.
 * @param {boolean} show if true, the element will be shown; otherwise, hidden.
 */
swivel_viewer.Swivel.prototype.showHideElement = function(id, show) {
  var element = goog.dom.getElement(id);
  goog.style.showElement(element, show);
};

/**
 * Initialize the help icon. This is in a separate method so we can override it
 * for unit tests.
 */
swivel_viewer.Swivel.prototype.initHelpIcon = function() {
  var imageSrc = "images/arrows_curved_small.png";
  
  // The png image looks better, but IE6 doesn't properly display png
  // transparency and IE7 doesn't properly show the png with a css
  // opacity setting; so show a gif with altered opacity for ie.
  if (goog.userAgent.IE) {
    imageSrc = "images/arrows_curved_small.gif";
  }
  var dom = new goog.dom.getDomHelper(this.doc_);
  this.helpIcon_ = dom.createDom('img', {
    'src' : imageSrc,
    'class' :"helpIcon"
  });
  this.helpIcon_.id = "helpIcon";

  this.resizeHelpIcon_();
  goog.dom.appendChild(this.swivelContents_, this.helpIcon_);
};

/**
 * Resize the HelpIcon properly according to the Swivel size.
 * @private
 */
swivel_viewer.Swivel.prototype.resizeHelpIcon_ = function() {
  // Center the icon in the view; if it is larger than the view,
  // scale it down proportionally first.
  var helpIconSize
      = new goog.math.Size(swivel_viewer.Swivel.HELP_ICON_WIDTH,
          swivel_viewer.Swivel.HELP_ICON_HEIGHT);
  if (!helpIconSize.fitsInside(this.swivelSize_)) {
    helpIconSize = helpIconSize.scaleToFit(this.swivelSize_);
  }
  this.helpIcon_.style.position = 'absolute';
  this.helpIcon_.style.zIndex = '4';
  this.helpIcon_.style.width = helpIconSize.width + 'px';
  this.helpIcon_.style.height = helpIconSize.height + 'px';
  this.helpIcon_.style.left
      = Math.floor((this.swivelSize_.width - helpIconSize.width) / 2);
  this.helpIcon_.style.top
      = Math.floor((this.swivelSize_.height - helpIconSize.height) / 2);
};

/**
 * Create a span to hold the zoom indicator.
 */
swivel_viewer.Swivel.prototype.initZoomIndicator = function() {
  // note this has a z-index of 3, so that it will stay on top of the image;
  // and an explicit background color for IE6 to avoid blur when changing
  // opacity.
  var style = 'color:gray;position:absolute;top:0;left:0;z-index:3;';
  if (goog.userAgent.IE && !goog.userAgent.isVersion("7")) {
    style += 'background-color:white;'
  }
  var dom = new goog.dom.getDomHelper(this.doc_);
  this.zoomIndicator_ = dom.createDom('span', {
    'style' : style
  });
  goog.dom.appendChild(this.swivelContents_, this.zoomIndicator_);
};

/**
 * When the mouse comes in to the frame, show the swivel cursor
 * 
 * @param {Event} e mouse-in event
 */
swivel_viewer.Swivel.prototype.doMouseIn = function(e) {
  if (this.mouseIsDown_) {
    e.stopPropagation();
    e.preventDefault();
    return;
  }
  this.cursorSwivel(e);
};

/**
 * When the mouse leaves the frame, show the default cursor then notify mouseUp.
 * 
 * @param {Event} e mouse-out event
 */
swivel_viewer.Swivel.prototype.doMouseOut = function(e) {
  // Treat this as a mouse up, which will stop any current action.
  this.doMouseUp(e);
  
  // Reset to the default cursor in case the mouse up changed it.
  this.cursorDefault();
};

/**
 * When the mouse goes down, start rotating the image
 * 
 * @param {Event} e mouse-down event
 */
swivel_viewer.Swivel.prototype.doMouseDown = function(e) {
  e.stopPropagation();
  e.preventDefault();

  // Hide the help image
  this.showHideElement(this.helpIcon_, false);

  // Set the cursor
  this.cursorSwivel(e);

  // Start tracking mouse state
  this.getMouseXY(e);
  this.mouseXOrig_ = this.mouseX_;
  this.mouseYOrig_ = this.mouseY_;
  this.addToPos_ = 0;
  this.mouseIsDown_ = true;
};

/**
 * When the mouse goes up, stop rotating the image On mouseUp, adjust the
 * current position to the "addToPos", which is the number of the image that we
 * last swiveled to.
 * 
 * @param {Event} e mouse-up event
 */
swivel_viewer.Swivel.prototype.doMouseUp = function(e) {
  e.stopPropagation();
  e.preventDefault();

  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEOVER,
      this.doMouseIn, false, this);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEOUT,
      this.doMouseOut, false, this);
  this.currentPos_ += this.addToPos_;

  this.mouseIsDown_ = false;
  this.cursorSwivel(e);
};

/**
 * Handle mouse movements by rotating or panning if the mouse is down.
 * 
 * @param {Event} e mouse-move event
 */
swivel_viewer.Swivel.prototype.doMouseMove = function(e) {
  if (!this.mouseIsDown_) {
    this.cursorSwivel(e);
    return;
  }

  // This is an event we'll handle, so stop it here.
  e.stopPropagation();
  e.preventDefault();

  // If the shift key is down, this is a pan; otherwise it is a rotation.
  if (e.shiftKey) {
    this.doPan(e);
  } else {
    this.autoSpin_ = false;
    this.doRotate(e);
  }
};

/**
 * Divide the width of the html object by the number of images. As the mouse
 * moves over the html object, show the appropriate image giving the illusion
 * that the user is spinning the object.
 * 
 * @param {Event} e mouse-move event
 */
swivel_viewer.Swivel.prototype.doRotate = function(e) {
  this.getMouseXY(e);

  var imageCount = this.imageUrls_.length;

  // step is how many pixels equals an image swap
  var step = this.swivelSize_.width / imageCount;
  var delta = this.mouseX_ - this.mouseXOrig_;

  // addToPos represents how many positions we add to the current position
  // (e.g., if current position is 2 and addToPos is 5, we will next show the
  // image at position 7).
  this.addToPos_ = Math.round(delta / step);

  if (this.addToPos_ != 0) {
    // handle wrap around
    var wrap = (this.currentPos_ + this.addToPos_) % imageCount;
    var newPos = (wrap < 0) ? imageCount + wrap : wrap;

    // If the image at newPos exists, hide all the others and show that image.
    var img = this.imageArray_[newPos];
    if (this.hasLoadedInBrowser(img)) {
      for ( var i = 0; i < imageCount; i++) {
        if (this.imageArray_[i] != null) {
          this.hideImage(this.imageArray_[i]);
        }
      }

      this.showImage(newPos, 1);
    }
  }

  return false;
};

/**
 * Resize the whole Swivel object, including images.
 * @param {Event} event The mouse wheel event trigger.
 */
swivel_viewer.Swivel.prototype.doScale = function(event) {
  var inc = (event.detail > 0 ? -swivel_viewer.Swivel.SCALE_INCREMENT
             : +swivel_viewer.Swivel.SCALE_INCREMENT);
  var scale = this.currentScale_ + inc;
  if (inc > 0 && scale > swivel_viewer.Swivel.MAX_SCALE)
    return;
  if (inc < 0 && scale < swivel_viewer.Swivel.MIN_SCALE)
    return;
  // Scale frame first
  this.swivelContents_.resizeCallback(this.swivelWidth_ * scale,
                                      this.swivelHeight_ * scale);
  this.swivelSize_ = new goog.math.Size(this.swivelWidth_ * scale,
                                        this.swivelHeight_ * scale);
  this.imageSize_ = new goog.math.Size(this.imageWidth_ * scale,
                                       this.imageHeight_ * scale);
  this.removeSwivelListeners();
  goog.dom.removeChildren(this.swivelContents_);
  this.swivelContents_.style.width = this.swivelWidth_ * scale + 'px';
  this.swivelContents_.style.height = this.swivelHeight_ * scale + 'px';
  this.updateURLs(this.imageSize_.width, this.imageSize_.height);
  this.initImages();
  this.currentScale_ = scale;
};

/**
 * Pan the image by moving it the same number of pixels that the mouse has moved
 * since the click event.
 * 
 * @param {Event} e mouse-move event
 */
swivel_viewer.Swivel.prototype.doPan = function(e) {
  this.mouseXOrig_ = this.mouseX_;
  this.mouseYOrig_ = this.mouseY_;

  this.getMouseXY(e);

  this.leftIncrement_ -= (this.mouseXOrig_ - this.mouseX_);
  this.topIncrement_ -= (this.mouseYOrig_ - this.mouseY_);

  var width = Math.floor(this.imageSize_.width * this.currentZoom_);
  var height = Math.floor(this.imageSize_.height * this.currentZoom_);

  // Do not let the image go too far out of the frame.
  if (this.swivelSize_.width <= width) {
    this.leftIncrement_ = goog.math.clamp(this.leftIncrement_,
                                          this.swivelSize_.width - width,
                                          0);
  } else {
    this.leftIncrement_ = goog.math.clamp(this.leftIncrement_,
                                          0,
                                          this.swivelSize_.width - width);
  }
  if (this.swivelSize_.height <= height) {
    this.topIncrement_  = goog.math.clamp(this.topIncrement_,
                                          this.swivelSize_.height - height,
                                          0);
  }
  else {
    this.topIncrement_  = goog.math.clamp(this.topIncrement_,
                                          0,
                                          this.swivelSize_.height - height);
  }

  var imageCount = this.imageArray_.length;
  for ( var i = 0; i < imageCount; i++) {
    var image = this.imageArray_[i];
    image.style.top = this.topIncrement_ + 'px';
    image.style.left = this.leftIncrement_ + 'px';
  }
};

/**
 * Determines whether the given image has actually been loaded into the browser
 * (versus just created as an image object in javascript).
 * 
 * @param {Image} img The image to be checked.
 */
swivel_viewer.Swivel.prototype.hasLoadedInBrowser = function(img) {
  if (!img || !img.complete) {
    return false;
  }
  if (typeof img.naturalWidth != "undefined" && img.naturalWidth == 0) {
    return false;
  }

  return true;
};

/**
 * Get the mouse position from the event e. This works around some event
 * issues that closure doesn't handle:
 * - ff2 reports mouse wheel event clientXY as screen relative, but mouse
 *   move events as relative to the target.
 * - ie (6 & 7) resizes the swivel container as the images zoom, so offsetXY
 *   becomes useless, and we need to use the coords relative to the viewport. 
 * 
 * Rather than special casing for different event types this will always use
 * viewport relative coords for IE, and target offset coords for everything
 * else.
 * 
 * @param {Event} e mouse move event
 */
swivel_viewer.Swivel.prototype.getMouseXY = function(e) {
  if (goog.userAgent.IE) {
    this.mouseX_ = e.clientX + document.body.scrollLeft;
    this.mouseY_ = e.clientY + document.body.scrollTop;
  
    if (this.mouseX_ < 0) {
      this.mouseX_ = 0;
    }
    if (this.mouseY_ < 0) {
      this.mouseY_ = 0;
    }
  } else {
    this.mouseX_ = e.offsetX;
    this.mouseY_ = e.offsetY;
  }
};

/**
 * Gets the left coordinate of the element.
 * 
 * @param {Object} element The element for which the left-alignment is being
 *     found.
 */
swivel_viewer.Swivel.prototype.getLeft = function(element) {
  var x = 0;
  while (element) {
    x += element.offsetLeft;
    element = element.offsetParent;
  }
  return x;
};

/**
 * Hides the image.
 * 
 * @param {Image} img The image to be hidden.
 */
swivel_viewer.Swivel.prototype.hideImage = function(img) {
  this.showHideElement(img, false);
};

/**
 * Shows the image. If the image hasn't been loaded yet, go into a loop and keep
 * checking until it is loaded.
 * 
 * @param {number} indx Index of the image to be shown.
 * @param {number} attempt Number of the attempt to show the message. Stops
 *     after IMAGE_DISPLAY_RETRIES attempts to show the image.
 */
swivel_viewer.Swivel.prototype.showImage = function(indx, attempt) {
  var img = this.imageArray_[indx];

  // initDisplay calls showImage(0, 1), which often times out, since we just
  // got instantiated.  But before the timeout fires, autospin (or something
  // else) may call showImage.  In that case, we should ignore the timed call
  // to showImage(X, Y), which we can recognize by attempt being > 1.
  // It might be easier to use clearTimeout() with the timer ID returned by
  // setTimeout(), but I can't find a formal spec for the function, so I don't
  // want to mess with it.
  if (attempt > 1 && !this.showImageIsWaitingForATimeout_) {
    return;
  }
  this.showImageIsWaitingForATimeout_ = false;

  if (this.hasLoadedInBrowser(img)) {
    this.showHideElement(img, true);
    this.cursorSwivel();
  } else if (attempt < (swivel_viewer.Swivel.IMAGE_DISPLAY_RETRIES + 1)) {
    this.cursorWait();
    attempt++;
    // Set a timeout and try again.

    this.showImageIsWaitingForATimeout_ = true;

    goog.global.setTimeout(goog.bind(this.showImage, this, indx, attempt),
        swivel_viewer.Swivel.REDISPLAY_IMAGE_DELAY);
  } else {
    // Reset the cursor and bail out.
    this.cursorSwivel();
  }
};

/**
 * Changes the cursor to a wait cursor.
 */
swivel_viewer.Swivel.prototype.cursorWait = function() {
  document.body.style.cursor = 'wait';
};

/**
 * Changes the cursor to a swivel cursor, or a move cursor if the shift key is
 * down.
 * @param {Event} opt_event An optional event that this is in response to.
 */
swivel_viewer.Swivel.prototype.cursorSwivel = function(opt_event) {
  if (opt_event && opt_event.shiftKey) {
    document.body.style.cursor = 'move';
  } else {
    document.body.style.cursor = 'col-resize';
  }
};

/**
 * Changes the cursor to the default cursor.
 */
swivel_viewer.Swivel.prototype.cursorDefault = function() {
  document.body.style.cursor = 'default';
};

/**
 * On unload of the swivel page, clean up the listeners.
 */
swivel_viewer.Swivel.prototype.removeSwivelListeners = function() {
  goog.events.unlisten(this.swivelContents_, goog.events.EventType.MOUSEMOVE,
      this.doRotate, true, this);
  goog.events.unlisten(this.swivelContents_, goog.events.EventType.MOUSEDOWN,
      this.doMouseDown, false, this);
  goog.events.unlisten(this.swivelContents_, goog.events.EventType.MOUSEUP,
      this.doMouseUp, true, this);
  goog.events.unlisten(this.swivelContents_, goog.events.EventType.MOUSEOVER,
      this.doMouseIn, false, this);
  goog.events.unlisten(this.swivelContents_, goog.events.EventType.MOUSEOUT,
      this.doMouseOut, false, this);
  goog.events.removeAll(this.mouseWheelHandler_,goog.events.EventType.MOUSEWHEEL);
};

swivel_viewer.Swivel.prototype.getCropRatio = function() {
  var ratio = new Array();
  var imageWidth = Math.floor(this.imageSize_.width * this.currentZoom_);
  var imageHeight = Math.floor(this.imageSize_.height * this.currentZoom_);
  ratio["left"] = Math.abs(this.leftIncrement_) / imageWidth;
  ratio["right"] = 1 - ratio.left - this.swivelSize_.width / imageWidth;
  ratio["top"] = Math.abs(this.topIncrement_) / imageHeight;
  ratio["bottom"] = 1 - ratio.top - this.swivelSize_.height / imageHeight;
  return ratio;
}

/**
 * Responds to mouse wheel events by zooming the images. Since mouse wheel
 * increments are uneven we just zoom by the same increment for with each event.
 * While zooming in, the point under the mouse cursor remains stationary to
 * approximate the SketchUp zoom tools.
 * However, zoom out is performed around a weighted combination of the center
 * of frame and the center of image, with weight 1 (purely image center) when
 * zoom is at its maximum to 0 (purely frame center) when zoom goes to minimum.
 *
 * @param {Event} event The mouse wheel event.
 */
swivel_viewer.Swivel.prototype.zoom = function(event) {
  event.stopPropagation();
  event.preventDefault();

  if (event.shiftKey) {
    this.doScale(event);
    return;
  }

  // Positive mouse wheel is zoom in, negative is zoom out. Stop at a min and
  // max zoom level so the image won't "disappear" or get too pixelated.
  var inc = (event.detail > 0
      ? -swivel_viewer.Swivel.ZOOM_INCREMENT : swivel_viewer.Swivel.ZOOM_INCREMENT);
  if ((this.currentZoom_ == swivel_viewer.Swivel.MIN_ZOOM && inc < 0) ||
      (this.currentZoom_ == swivel_viewer.Swivel.MAX_ZOOM && inc > 0)) {
    return;
  }

  var width = Math.floor(this.imageSize_.width * this.currentZoom_);
  var height = Math.floor(this.imageSize_.height * this.currentZoom_);

  // Disallow zooming past the MAX_IMAGE_DIMENSION
  if (inc > 0 &&
      (width >= swivel_viewer.Swivel.MAX_IMAGE_DIMENSION ||
      height >= swivel_viewer.Swivel.MAX_IMAGE_DIMENSION)) {
    return;
  }

  // Update the URLs for better image.
  this.updateURLs(width, height);
  this.reloadImages_();

  var imageCenterX = this.leftIncrement_ + width / 2;
  var imageCenterY = this.topIncrement_ + height / 2;

  // Find where the scroll event happened, relative to the center of the image
  // based on the actual size of the image, so that we can keep that point
  // stable wrt mouse events.
  this.getMouseXY(event);
  var fromCenterDiffX = (this.mouseX_ - imageCenterX) / this.currentZoom_;
  var fromCenterDiffY = (this.mouseY_ - imageCenterY) / this.currentZoom_;

  var origZoom = this.currentZoom_;

  // Update the current zoom level.
  this.currentZoom_ += inc;

  // The following would be needed in the case the zoom step does not exactly
  // divide max_zoom - min_zoom, for example 0.5 to 4.2 step 0.25. In such
  // case, currentZoom could have changed from 4.0 to 4.25.  But with current
  // set of parameters (0.5 to 4.0 step 0.25), this will not make a difference.
  this.currentZoom_ = goog.math.clamp(this.currentZoom_,
                                      swivel_viewer.Swivel.MIN_ZOOM,
                                      swivel_viewer.Swivel.MAX_ZOOM);

  // Calculate the new size of the image based on the zoom level.
  width = Math.floor(this.imageSize_.width * this.currentZoom_);
  height = Math.floor(this.imageSize_.height * this.currentZoom_);

  // Calculate the left/top offsets based on the zoom level, the position of the
  // mouse event in the view, and the position of the mouse event in the
  // unscaled image. We want the part of the image under the mouse event to stay
  // constant so you can zoom in/out of specific points. This should roughly
  // match how sketchup's zoom tool works.

  // Calculate the point of the resized image that should be under the mouse by
  // multiplying the unscaled position by the new zoom level.
  fromCenterDiffX *= this.currentZoom_;
  fromCenterDiffY *= this.currentZoom_;

  if (inc > 0) {
    imageCenterX = this.mouseX_ - fromCenterDiffX;
    imageCenterY = this.mouseY_ - fromCenterDiffY;
  } else {
    // If zoom < 1, use weighted combination of frame center and image center.
    // The following alpha ensures that that any point in the image would not
    // move away from the position it is supposed to be at minimum zoom.
    var alpha = (this.currentZoom_ - swivel_viewer.Swivel.MIN_ZOOM) /
        (origZoom - swivel_viewer.Swivel.MIN_ZOOM);
    imageCenterX = alpha * imageCenterX
        + (1 - alpha) * this.swivelSize_.width / 2;
    imageCenterY = alpha * imageCenterY
        + (1 - alpha) * this.swivelSize_.height / 2;
  }

  // Base the offsets on that, and the absolute position of the mouse.
  this.leftIncrement_ = Math.floor(imageCenterX - width / 2);
  this.topIncrement_ = Math.floor(imageCenterY - height / 2);

  // Do not let the image go too far out of the frame.
  this.leftIncrement_ = goog.math.clamp(this.leftIncrement_,
                                        -width, this.swivelSize_.width);
  this.topIncrement_  = goog.math.clamp(this.topIncrement_,
                                        -height, this.swivelSize_.height);

  var imageCount = this.imageArray_.length;
  for ( var i = 0; i < imageCount; i++) {
    var image = this.imageArray_[i];
    image.style.width = width;
    image.style.height = height;
    image.style.top = this.topIncrement_ + 'px';
    image.style.left = this.leftIncrement_ + 'px';
    image.style.overflow = "hidden";
  }

  // Update the zoom indicator value.
  this.zoomIndicator_.innerHTML = (this.currentZoom_ * 100) + '%';

  // If we currently have a fade animation, make sure it's stopped, and
  // reset the opacity of the zoom indicator.
  if (this.zoomFadeFx_ != null) {
    this.zoomFadeFx_.stop(false);
    goog.style.setOpacity(this.zoomIndicator_, 1);
  }

  // Then make sure the zoom indicator is showing, create a new fade out
  // animation if necessary, and (re)start it.
  this.showHideElement(this.zoomIndicator_, true);
  if (this.zoomFadeFx_ == null) {
    this.zoomFadeFx_ = new goog.fx.dom.FadeOutAndHide(this.zoomIndicator_,
        swivel_viewer.Swivel.ZOOM_FADE_TIMEOUT);
  }
  this.zoomFadeFx_.play(true);

  // Make sure the help message is hidden.
  this.showHideElement(this.helpIcon_, false);
};

