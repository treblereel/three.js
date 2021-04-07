var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.getGlobal = function(passedInThis) {
  var possibleGlobals = ["object" == typeof globalThis && globalThis, passedInThis, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global, ];
  for (var i = 0; i < possibleGlobals.length; ++i) {
    var maybeGlobal = possibleGlobals[i];
    if (maybeGlobal && maybeGlobal["Math"] == Math) {
      return maybeGlobal;
    }
  }
  return {valueOf:function() {
    throw new Error("Cannot find global object");
  }}.valueOf();
};
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.checkEs6ConformanceViaProxy = function() {
  try {
    var proxied = {};
    var proxy = Object.create(new $jscomp.global["Proxy"](proxied, {"get":function(target, key, receiver) {
      return target == proxied && key == "q" && receiver == proxy;
    }}));
    return proxy["q"] === true;
  } catch (err) {
    return false;
  }
};
$jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS = false;
$jscomp.ES6_CONFORMANCE = $jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS && $jscomp.checkEs6ConformanceViaProxy();
$jscomp.arrayIteratorImpl = function(array) {
  var index = 0;
  return function() {
    if (index < array.length) {
      return {done:false, value:array[index++], };
    } else {
      return {done:true};
    }
  };
};
$jscomp.arrayIterator = function(array) {
  return {next:$jscomp.arrayIteratorImpl(array)};
};
$jscomp.ASSUME_ES5 = false;
$jscomp.ASSUME_NO_NATIVE_MAP = false;
$jscomp.ASSUME_NO_NATIVE_SET = false;
$jscomp.SIMPLE_FROUND_POLYFILL = false;
$jscomp.ISOLATE_POLYFILLS = false;
$jscomp.FORCE_POLYFILL_PROMISE = false;
$jscomp.FORCE_POLYFILL_PROMISE_WHEN_NO_UNHANDLED_REJECTION = false;
$jscomp.defineProperty = $jscomp.ASSUME_ES5 || typeof Object.defineProperties == "function" ? Object.defineProperty : function(target, property, descriptor) {
  if (target == Array.prototype || target == Object.prototype) {
    return target;
  }
  target[property] = descriptor.value;
  return target;
};
$jscomp.IS_SYMBOL_NATIVE = typeof Symbol === "function" && typeof Symbol("x") === "symbol";
$jscomp.TRUST_ES6_POLYFILLS = !$jscomp.ISOLATE_POLYFILLS || $jscomp.IS_SYMBOL_NATIVE;
$jscomp.polyfills = {};
$jscomp.propertyToPolyfillSymbol = {};
$jscomp.POLYFILL_PREFIX = "$jscp$";
var $jscomp$lookupPolyfilledValue = function(target, property) {
  var obfuscatedName = $jscomp.propertyToPolyfillSymbol[property];
  if (obfuscatedName == null) {
    return target[property];
  }
  var polyfill = target[obfuscatedName];
  return polyfill !== undefined ? polyfill : target[property];
};
$jscomp.polyfill = function(target, polyfill, fromLang, toLang) {
  if (!polyfill) {
    return;
  }
  if ($jscomp.ISOLATE_POLYFILLS) {
    $jscomp.polyfillIsolated(target, polyfill, fromLang, toLang);
  } else {
    $jscomp.polyfillUnisolated(target, polyfill, fromLang, toLang);
  }
};
$jscomp.polyfillUnisolated = function(target, polyfill, fromLang, toLang) {
  var obj = $jscomp.global;
  var split = target.split(".");
  for (var i = 0; i < split.length - 1; i++) {
    var key = split[i];
    if (!(key in obj)) {
      return;
    }
    obj = obj[key];
  }
  var property = split[split.length - 1];
  var orig = obj[property];
  var impl = polyfill(orig);
  if (impl == orig || impl == null) {
    return;
  }
  $jscomp.defineProperty(obj, property, {configurable:true, writable:true, value:impl});
};
$jscomp.polyfillIsolated = function(target, polyfill, fromLang, toLang) {
  var split = target.split(".");
  var isSimpleName = split.length === 1;
  var root = split[0];
  var ownerObject;
  if (!isSimpleName && root in $jscomp.polyfills) {
    ownerObject = $jscomp.polyfills;
  } else {
    ownerObject = $jscomp.global;
  }
  for (var i = 0; i < split.length - 1; i++) {
    var key = split[i];
    if (!(key in ownerObject)) {
      return;
    }
    ownerObject = ownerObject[key];
  }
  var property = split[split.length - 1];
  var nativeImpl = $jscomp.IS_SYMBOL_NATIVE && fromLang === "es6" ? ownerObject[property] : null;
  var impl = polyfill(nativeImpl);
  if (impl == null) {
    return;
  }
  if (isSimpleName) {
    $jscomp.defineProperty($jscomp.polyfills, property, {configurable:true, writable:true, value:impl});
  } else {
    if (impl !== nativeImpl) {
      if ($jscomp.propertyToPolyfillSymbol[property] === undefined) {
        $jscomp.propertyToPolyfillSymbol[property] = $jscomp.IS_SYMBOL_NATIVE ? $jscomp.global["Symbol"](property) : $jscomp.POLYFILL_PREFIX + property;
      }
      var obfuscatedName = $jscomp.propertyToPolyfillSymbol[property];
      $jscomp.defineProperty(ownerObject, obfuscatedName, {configurable:true, writable:true, value:impl});
    }
  }
};
$jscomp.initSymbol = function() {
};
$jscomp.polyfill("Symbol", function(orig) {
  if (orig) {
    return orig;
  }
  var SymbolClass = function(id, opt_description) {
    this.$jscomp$symbol$id_ = id;
    this.description;
    $jscomp.defineProperty(this, "description", {configurable:true, writable:true, value:opt_description});
  };
  SymbolClass.prototype.toString = function() {
    return this.$jscomp$symbol$id_;
  };
  var SYMBOL_PREFIX = "jscomp_symbol_";
  var counter = 0;
  var symbolPolyfill = function(opt_description) {
    if (this instanceof symbolPolyfill) {
      throw new TypeError("Symbol is not a constructor");
    }
    return new SymbolClass(SYMBOL_PREFIX + (opt_description || "") + "_" + counter++, opt_description);
  };
  return symbolPolyfill;
}, "es6", "es3");
$jscomp.polyfill("Symbol.iterator", function(orig) {
  if (orig) {
    return orig;
  }
  var symbolIterator = Symbol("Symbol.iterator");
  var arrayLikes = ["Array", "Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array"];
  for (var i = 0; i < arrayLikes.length; i++) {
    var ArrayLikeCtor = $jscomp.global[arrayLikes[i]];
    if (typeof ArrayLikeCtor === "function" && typeof ArrayLikeCtor.prototype[symbolIterator] != "function") {
      $jscomp.defineProperty(ArrayLikeCtor.prototype, symbolIterator, {configurable:true, writable:true, value:function() {
        return $jscomp.iteratorPrototype($jscomp.arrayIteratorImpl(this));
      }});
    }
  }
  return symbolIterator;
}, "es6", "es3");
$jscomp.polyfill("Symbol.asyncIterator", function(orig) {
  if (orig) {
    return orig;
  }
  return Symbol("Symbol.asyncIterator");
}, "es9", "es3");
$jscomp.iteratorPrototype = function(next) {
  var iterator = {next:next};
  iterator[Symbol.iterator] = function() {
    return this;
  };
  return iterator;
};
$jscomp.makeIterator = function(iterable) {
  var iteratorFunction = typeof Symbol != "undefined" && Symbol.iterator && iterable[Symbol.iterator];
  return iteratorFunction ? iteratorFunction.call(iterable) : $jscomp.arrayIterator(iterable);
};
$jscomp.owns = function(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};
$jscomp.polyfill("WeakMap", function(NativeWeakMap) {
  function isConformant() {
    if (!NativeWeakMap || !Object.seal) {
      return false;
    }
    try {
      var x = Object.seal({});
      var y = Object.seal({});
      var map = new NativeWeakMap([[x, 2], [y, 3]]);
      if (map.get(x) != 2 || map.get(y) != 3) {
        return false;
      }
      map["delete"](x);
      map.set(y, 4);
      return !map.has(x) && map.get(y) == 4;
    } catch (err) {
      return false;
    }
  }
  if ($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS) {
    if (NativeWeakMap && $jscomp.ES6_CONFORMANCE) {
      return NativeWeakMap;
    }
  } else {
    if (isConformant()) {
      return NativeWeakMap;
    }
  }
  var prop = "$jscomp_hidden_" + Math.random();
  function WeakMapMembership() {
  }
  function isValidKey(key) {
    var type = typeof key;
    return type === "object" && key !== null || type === "function";
  }
  function insert(target) {
    if (!$jscomp.owns(target, prop)) {
      var obj = new WeakMapMembership;
      $jscomp.defineProperty(target, prop, {value:obj});
    }
  }
  function patch(name) {
    if ($jscomp.ISOLATE_POLYFILLS) {
      return;
    }
    var prev = Object[name];
    if (prev) {
      Object[name] = function(target) {
        if (target instanceof WeakMapMembership) {
          return target;
        } else {
          if (Object.isExtensible(target)) {
            insert(target);
          }
          return prev(target);
        }
      };
    }
  }
  patch("freeze");
  patch("preventExtensions");
  patch("seal");
  var index = 0;
  var PolyfillWeakMap = function(opt_iterable) {
    this.id_ = (index += Math.random() + 1).toString();
    if (opt_iterable) {
      var iter = $jscomp.makeIterator(opt_iterable);
      var entry;
      while (!(entry = iter.next()).done) {
        var item = entry.value;
        this.set(item[0], item[1]);
      }
    }
  };
  PolyfillWeakMap.prototype.set = function(key, value) {
    if (!isValidKey(key)) {
      throw new Error("Invalid WeakMap key");
    }
    insert(key);
    if (!$jscomp.owns(key, prop)) {
      throw new Error("WeakMap key fail: " + key);
    }
    key[prop][this.id_] = value;
    return this;
  };
  PolyfillWeakMap.prototype.get = function(key) {
    return isValidKey(key) && $jscomp.owns(key, prop) ? key[prop][this.id_] : undefined;
  };
  PolyfillWeakMap.prototype.has = function(key) {
    return isValidKey(key) && $jscomp.owns(key, prop) && $jscomp.owns(key[prop], this.id_);
  };
  PolyfillWeakMap.prototype["delete"] = function(key) {
    if (!isValidKey(key) || !$jscomp.owns(key, prop) || !$jscomp.owns(key[prop], this.id_)) {
      return false;
    }
    return delete key[prop][this.id_];
  };
  return PolyfillWeakMap;
}, "es6", "es3");
$jscomp.MapEntry = function() {
  this.previous;
  this.next;
  this.head;
  this.key;
  this.value;
};
$jscomp.polyfill("Map", function(NativeMap) {
  function isConformant() {
    if ($jscomp.ASSUME_NO_NATIVE_MAP || !NativeMap || typeof NativeMap != "function" || !NativeMap.prototype.entries || typeof Object.seal != "function") {
      return false;
    }
    try {
      NativeMap = NativeMap;
      var key = Object.seal({x:4});
      var map = new NativeMap($jscomp.makeIterator([[key, "s"]]));
      if (map.get(key) != "s" || map.size != 1 || map.get({x:4}) || map.set({x:4}, "t") != map || map.size != 2) {
        return false;
      }
      var iter = map.entries();
      var item = iter.next();
      if (item.done || item.value[0] != key || item.value[1] != "s") {
        return false;
      }
      item = iter.next();
      if (item.done || item.value[0].x != 4 || item.value[1] != "t" || !iter.next().done) {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }
  if ($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS) {
    if (NativeMap && $jscomp.ES6_CONFORMANCE) {
      return NativeMap;
    }
  } else {
    if (isConformant()) {
      return NativeMap;
    }
  }
  var idMap = new WeakMap;
  var PolyfillMap = function(opt_iterable) {
    this.data_ = {};
    this.head_ = createHead();
    this.size = 0;
    if (opt_iterable) {
      var iter = $jscomp.makeIterator(opt_iterable);
      var entry;
      while (!(entry = iter.next()).done) {
        var item = entry.value;
        this.set(item[0], item[1]);
      }
    }
  };
  PolyfillMap.prototype.set = function(key, value) {
    key = key === 0 ? 0 : key;
    var r = maybeGetEntry(this, key);
    if (!r.list) {
      r.list = this.data_[r.id] = [];
    }
    if (!r.entry) {
      r.entry = {next:this.head_, previous:this.head_.previous, head:this.head_, key:key, value:value, };
      r.list.push(r.entry);
      this.head_.previous.next = r.entry;
      this.head_.previous = r.entry;
      this.size++;
    } else {
      r.entry.value = value;
    }
    return this;
  };
  PolyfillMap.prototype["delete"] = function(key) {
    var r = maybeGetEntry(this, key);
    if (r.entry && r.list) {
      r.list.splice(r.index, 1);
      if (!r.list.length) {
        delete this.data_[r.id];
      }
      r.entry.previous.next = r.entry.next;
      r.entry.next.previous = r.entry.previous;
      r.entry.head = null;
      this.size--;
      return true;
    }
    return false;
  };
  PolyfillMap.prototype.clear = function() {
    this.data_ = {};
    this.head_ = this.head_.previous = createHead();
    this.size = 0;
  };
  PolyfillMap.prototype.has = function(key) {
    return !!maybeGetEntry(this, key).entry;
  };
  PolyfillMap.prototype.get = function(key) {
    var entry = maybeGetEntry(this, key).entry;
    return entry && entry.value;
  };
  PolyfillMap.prototype.entries = function() {
    return makeIterator(this, function(entry) {
      return [entry.key, entry.value];
    });
  };
  PolyfillMap.prototype.keys = function() {
    return makeIterator(this, function(entry) {
      return entry.key;
    });
  };
  PolyfillMap.prototype.values = function() {
    return makeIterator(this, function(entry) {
      return entry.value;
    });
  };
  PolyfillMap.prototype.forEach = function(callback, opt_thisArg) {
    var iter = this.entries();
    var item;
    while (!(item = iter.next()).done) {
      var entry = item.value;
      callback.call(opt_thisArg, entry[1], entry[0], this);
    }
  };
  PolyfillMap.prototype[Symbol.iterator] = PolyfillMap.prototype.entries;
  var maybeGetEntry = function(map, key) {
    var id = getId(key);
    var list = map.data_[id];
    if (list && $jscomp.owns(map.data_, id)) {
      for (var index = 0; index < list.length; index++) {
        var entry = list[index];
        if (key !== key && entry.key !== entry.key || key === entry.key) {
          return {id:id, list:list, index:index, entry:entry};
        }
      }
    }
    return {id:id, list:list, index:-1, entry:undefined};
  };
  var makeIterator = function(map, func) {
    var entry = map.head_;
    return $jscomp.iteratorPrototype(function() {
      if (entry) {
        while (entry.head != map.head_) {
          entry = entry.previous;
        }
        while (entry.next != entry.head) {
          entry = entry.next;
          return {done:false, value:func(entry)};
        }
        entry = null;
      }
      return {done:true, value:void 0};
    });
  };
  var createHead = function() {
    var head = {};
    head.previous = head.next = head.head = head;
    return head;
  };
  var mapIndex = 0;
  var getId = function(obj) {
    var type = obj && typeof obj;
    if (type == "object" || type == "function") {
      obj = obj;
      if (!idMap.has(obj)) {
        var id = "" + ++mapIndex;
        idMap.set(obj, id);
        return id;
      }
      return idMap.get(obj);
    }
    return "p_" + obj;
  };
  return PolyfillMap;
}, "es6", "es3");
$jscomp.polyfill("Set", function(NativeSet) {
  function isConformant() {
    if ($jscomp.ASSUME_NO_NATIVE_SET || !NativeSet || typeof NativeSet != "function" || !NativeSet.prototype.entries || typeof Object.seal != "function") {
      return false;
    }
    try {
      NativeSet = NativeSet;
      var value = Object.seal({x:4});
      var set = new NativeSet($jscomp.makeIterator([value]));
      if (!set.has(value) || set.size != 1 || set.add(value) != set || set.size != 1 || set.add({x:4}) != set || set.size != 2) {
        return false;
      }
      var iter = set.entries();
      var item = iter.next();
      if (item.done || item.value[0] != value || item.value[1] != value) {
        return false;
      }
      item = iter.next();
      if (item.done || item.value[0] == value || item.value[0].x != 4 || item.value[1] != item.value[0]) {
        return false;
      }
      return iter.next().done;
    } catch (err) {
      return false;
    }
  }
  if ($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS) {
    if (NativeSet && $jscomp.ES6_CONFORMANCE) {
      return NativeSet;
    }
  } else {
    if (isConformant()) {
      return NativeSet;
    }
  }
  var PolyfillSet = function(opt_iterable) {
    this.map_ = new Map;
    if (opt_iterable) {
      var iter = $jscomp.makeIterator(opt_iterable);
      var entry;
      while (!(entry = iter.next()).done) {
        var item = entry.value;
        this.add(item);
      }
    }
    this.size = this.map_.size;
  };
  PolyfillSet.prototype.add = function(value) {
    value = value === 0 ? 0 : value;
    this.map_.set(value, value);
    this.size = this.map_.size;
    return this;
  };
  PolyfillSet.prototype["delete"] = function(value) {
    var result = this.map_["delete"](value);
    this.size = this.map_.size;
    return result;
  };
  PolyfillSet.prototype.clear = function() {
    this.map_.clear();
    this.size = 0;
  };
  PolyfillSet.prototype.has = function(value) {
    return this.map_.has(value);
  };
  PolyfillSet.prototype.entries = function() {
    return this.map_.entries();
  };
  PolyfillSet.prototype.values = function() {
    return this.map_.values();
  };
  PolyfillSet.prototype.keys = PolyfillSet.prototype.values;
  PolyfillSet.prototype[Symbol.iterator] = PolyfillSet.prototype.values;
  PolyfillSet.prototype.forEach = function(callback, opt_thisArg) {
    var set = this;
    this.map_.forEach(function(value) {
      return callback.call(opt_thisArg, value, value, set);
    });
  };
  return PolyfillSet;
}, "es6", "es3");
(function() {
  var Module = function(id, opt_exports) {
    this.id = id;
    this.exports = opt_exports || {};
  };
  Module.prototype.exportAllFrom = function(other) {
    var module = this;
    var define = {};
    for (var key in other) {
      if (key == "default" || key in module.exports || key in define) {
        continue;
      }
      define[key] = {enumerable:true, get:function(key) {
        return function() {
          return other[key];
        };
      }(key)};
    }
    $jscomp.global.Object.defineProperties(module.exports, define);
  };
  var CacheEntry = function(def, module, path) {
    this.def = def;
    this.module = module;
    this.path = path;
    this.blockingDeps = new Set;
  };
  CacheEntry.prototype.load = function() {
    if (this.def) {
      var def = this.def;
      this.def = null;
      callRequireCallback(def, this.module);
    }
    return this.module.exports;
  };
  function callRequireCallback(callback, opt_module) {
    var oldPath = currentModulePath;
    try {
      if (opt_module) {
        currentModulePath = opt_module.id;
        callback.call(opt_module, createRequire(opt_module), opt_module.exports, opt_module);
      } else {
        callback($jscomp.require);
      }
    } finally {
      currentModulePath = oldPath;
    }
  }
  var moduleCache = new Map;
  var currentModulePath = "";
  function normalizePath(path) {
    var components = path.split("/");
    var i = 0;
    while (i < components.length) {
      if (components[i] == ".") {
        components.splice(i, 1);
      } else {
        if (i && components[i] == ".." && components[i - 1] && components[i - 1] != "..") {
          components.splice(--i, 2);
        } else {
          i++;
        }
      }
    }
    return components.join("/");
  }
  $jscomp.getCurrentModulePath = function() {
    return currentModulePath;
  };
  function getCacheEntry(id) {
    var cacheEntry = moduleCache.get(id);
    if (cacheEntry === undefined) {
      throw new Error("Module " + id + " does not exist.");
    }
    return cacheEntry;
  }
  var ensureMap = new Map;
  var CallbackEntry = function(requireSet, callback) {
    this.requireSet = requireSet;
    this.callback = callback;
  };
  function maybeNormalizePath(root, absOrRelativePath) {
    if (absOrRelativePath.startsWith("./") || absOrRelativePath.startsWith("../")) {
      return normalizePath(root + "/../" + absOrRelativePath);
    } else {
      return absOrRelativePath;
    }
  }
  function createRequire(opt_module) {
    function require(absOrRelativePath) {
      var absPath = absOrRelativePath;
      if (opt_module) {
        absPath = maybeNormalizePath(opt_module.id, absPath);
      }
      return getCacheEntry(absPath).load();
    }
    function requireEnsure(requires, callback) {
      if (currentModulePath) {
        for (var i = 0; i < requires.length; i++) {
          requires[i] = maybeNormalizePath(currentModulePath, requires[i]);
        }
      }
      var blockingRequires = [];
      for (var i = 0; i < requires.length; i++) {
        var required = moduleCache.get(requires[i]);
        if (!required || required.blockingDeps.size) {
          blockingRequires.push(requires[i]);
        }
      }
      if (blockingRequires.length) {
        var requireSet = new Set(blockingRequires);
        var callbackEntry = new CallbackEntry(requireSet, callback);
        requireSet.forEach(function(require) {
          var arr = ensureMap.get(require);
          if (!arr) {
            arr = [];
            ensureMap.set(require, arr);
          }
          arr.push(callbackEntry);
        });
      } else {
        callback(require);
      }
    }
    require.ensure = requireEnsure;
    return require;
  }
  $jscomp.require = createRequire();
  $jscomp.hasModule = function(id) {
    return moduleCache.has(id);
  };
  function markAvailable(absModulePath) {
    var ensures = ensureMap.get(absModulePath);
    if (ensures) {
      for (var i = 0; i < ensures.length; i++) {
        var entry = ensures[i];
        entry.requireSet["delete"](absModulePath);
        if (!entry.requireSet.size) {
          ensures.splice(i--, 1);
          callRequireCallback(entry.callback);
        }
      }
      if (!ensures.length) {
        ensureMap["delete"](absModulePath);
      }
    }
  }
  $jscomp.registerModule = function(moduleDef, absModulePath, opt_shallowDeps) {
    if (moduleCache.has(absModulePath)) {
      throw new Error("Module " + absModulePath + " has already been registered.");
    }
    if (currentModulePath) {
      throw new Error("Cannot nest modules.");
    }
    var shallowDeps = opt_shallowDeps || [];
    for (var i = 0; i < shallowDeps.length; i++) {
      shallowDeps[i] = maybeNormalizePath(absModulePath, shallowDeps[i]);
    }
    var blockingDeps = new Set;
    for (var i = 0; i < shallowDeps.length; i++) {
      getTransitiveBlockingDepsOf(shallowDeps[i]).forEach(function(transitive) {
        blockingDeps.add(transitive);
      });
    }
    blockingDeps["delete"](absModulePath);
    var cacheEntry = new CacheEntry(moduleDef, new Module(absModulePath), absModulePath);
    moduleCache.set(absModulePath, cacheEntry);
    blockingDeps.forEach(function(blocker) {
      addAsBlocking(cacheEntry, blocker);
    });
    if (!blockingDeps.size) {
      markAvailable(cacheEntry.module.id);
    }
    removeAsBlocking(cacheEntry);
  };
  function getTransitiveBlockingDepsOf(moduleId) {
    var cacheEntry = moduleCache.get(moduleId);
    var blocking = new Set;
    if (cacheEntry) {
      cacheEntry.blockingDeps.forEach(function(dep) {
        getTransitiveBlockingDepsOf(dep).forEach(function(transitive) {
          blocking.add(transitive);
        });
      });
    } else {
      blocking.add(moduleId);
    }
    return blocking;
  }
  var blockingModulePathToBlockedModules = new Map;
  function addAsBlocking(blocked, blocker) {
    if (blocked.module.id != blocker) {
      var blockedModules = blockingModulePathToBlockedModules.get(blocker);
      if (!blockedModules) {
        blockedModules = new Set;
        blockingModulePathToBlockedModules.set(blocker, blockedModules);
      }
      blockedModules.add(blocked);
      blocked.blockingDeps.add(blocker);
    }
  }
  function removeAsBlocking(cacheEntry) {
    var blocked = blockingModulePathToBlockedModules.get(cacheEntry.module.id);
    if (blocked) {
      blockingModulePathToBlockedModules["delete"](cacheEntry.module.id);
      blocked.forEach(function(blockedCacheEntry) {
        blockedCacheEntry.blockingDeps["delete"](cacheEntry.module.id);
        cacheEntry.blockingDeps.forEach(function(blocker) {
          addAsBlocking(blockedCacheEntry, blocker);
        });
        if (!blockedCacheEntry.blockingDeps.size) {
          removeAsBlocking(blockedCacheEntry);
          markAvailable(blockedCacheEntry.module.id);
        }
      });
    }
  }
  $jscomp.registerAndLoadModule = function(moduleDef, absModulePath, shallowDeps) {
    $jscomp.require.ensure([absModulePath], function(require) {
      require(absModulePath);
    });
    $jscomp.registerModule(moduleDef, absModulePath, shallowDeps);
  };
  $jscomp.registerEs6ModuleExports = function(absModulePath, exports) {
    if (moduleCache.has(absModulePath)) {
      throw new Error("Module at path " + absModulePath + " is already registered.");
    }
    var entry = new CacheEntry(null, new Module(absModulePath, exports), absModulePath);
    moduleCache.set(absModulePath, entry);
    markAvailable(absModulePath);
  };
  $jscomp.clearModules = function() {
    moduleCache.clear();
  };
})();
this.CLOSURE_EVAL_PREFILTER = function(s) { return s; };(function(thisValue){var isChrome87 = false; try {isChrome87 =  eval(trustedTypes.emptyScript) !== trustedTypes.emptyScript } catch (e) {} if (typeof trustedTypes !== 'undefined' && trustedTypes.createPolicy &&isChrome87 ) {  var policy = trustedTypes.createPolicy('goog#devserver',{ createScript: function(s){ return s; }});  thisValue.CLOSURE_EVAL_PREFILTER = policy.createScript.bind(policy);}})(this);//math/MathUtils.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {MathUtils:{enumerable:true, get:function() {
    return MathUtils;
  }}});
  const _lut = [];
  for (let i = 0; i < 256; i++) {
    _lut[i] = (i < 16 ? "0" : "") + i.toString(16);
  }
  let _seed = 1234567;
  const MathUtils = {DEG2RAD:Math.PI / 180, RAD2DEG:180 / Math.PI, generateUUID:function() {
    const d0 = Math.random() * 4294967295 | 0;
    const d1 = Math.random() * 4294967295 | 0;
    const d2 = Math.random() * 4294967295 | 0;
    const d3 = Math.random() * 4294967295 | 0;
    const uuid = _lut[d0 & 255] + _lut[d0 >> 8 & 255] + _lut[d0 >> 16 & 255] + _lut[d0 >> 24 & 255] + "-" + _lut[d1 & 255] + _lut[d1 >> 8 & 255] + "-" + _lut[d1 >> 16 & 15 | 64] + _lut[d1 >> 24 & 255] + "-" + _lut[d2 & 63 | 128] + _lut[d2 >> 8 & 255] + "-" + _lut[d2 >> 16 & 255] + _lut[d2 >> 24 & 255] + _lut[d3 & 255] + _lut[d3 >> 8 & 255] + _lut[d3 >> 16 & 255] + _lut[d3 >> 24 & 255];
    return uuid.toUpperCase();
  }, clamp:function(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }, euclideanModulo:function(n, m) {
    return (n % m + m) % m;
  }, mapLinear:function(x, a1, a2, b1, b2) {
    return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
  }, lerp:function(x, y, t) {
    return (1 - t) * x + t * y;
  }, damp:function(x, y, lambda, dt) {
    return MathUtils.lerp(x, y, 1 - Math.exp(-lambda * dt));
  }, pingpong:function(x, length = 1) {
    return length - Math.abs(MathUtils.euclideanModulo(x, length * 2) - length);
  }, smoothstep:function(x, min, max) {
    if (x <= min) {
      return 0;
    }
    if (x >= max) {
      return 1;
    }
    x = (x - min) / (max - min);
    return x * x * (3 - 2 * x);
  }, smootherstep:function(x, min, max) {
    if (x <= min) {
      return 0;
    }
    if (x >= max) {
      return 1;
    }
    x = (x - min) / (max - min);
    return x * x * x * (x * (x * 6 - 15) + 10);
  }, randInt:function(low, high) {
    return low + Math.floor(Math.random() * (high - low + 1));
  }, randFloat:function(low, high) {
    return low + Math.random() * (high - low);
  }, randFloatSpread:function(range) {
    return range * (0.5 - Math.random());
  }, seededRandom:function(s) {
    if (s !== undefined) {
      _seed = s % 2147483647;
    }
    _seed = _seed * 16807 % 2147483647;
    return (_seed - 1) / 2147483646;
  }, degToRad:function(degrees) {
    return degrees * MathUtils.DEG2RAD;
  }, radToDeg:function(radians) {
    return radians * MathUtils.RAD2DEG;
  }, isPowerOfTwo:function(value) {
    return (value & value - 1) === 0 && value !== 0;
  }, ceilPowerOfTwo:function(value) {
    return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
  }, floorPowerOfTwo:function(value) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
  }, setQuaternionFromProperEuler:function(q, a, b, c, order) {
    const cos = Math.cos;
    const sin = Math.sin;
    const c2 = cos(b / 2);
    const s2 = sin(b / 2);
    const c13 = cos((a + c) / 2);
    const s13 = sin((a + c) / 2);
    const c1_3 = cos((a - c) / 2);
    const s1_3 = sin((a - c) / 2);
    const c3_1 = cos((c - a) / 2);
    const s3_1 = sin((c - a) / 2);
    switch(order) {
      case "XYX":
        q.set(c2 * s13, s2 * c1_3, s2 * s1_3, c2 * c13);
        break;
      case "YZY":
        q.set(s2 * s1_3, c2 * s13, s2 * c1_3, c2 * c13);
        break;
      case "ZXZ":
        q.set(s2 * c1_3, s2 * s1_3, c2 * s13, c2 * c13);
        break;
      case "XZX":
        q.set(c2 * s13, s2 * s3_1, s2 * c3_1, c2 * c13);
        break;
      case "YXY":
        q.set(s2 * c3_1, c2 * s13, s2 * s3_1, c2 * c13);
        break;
      case "ZYZ":
        q.set(s2 * s3_1, s2 * c3_1, c2 * s13, c2 * c13);
        break;
      default:
        console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: " + order);
    }
  }};
}, "math/MathUtils.js", []);

//math/Quaternion.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Quaternion:{enumerable:true, get:function() {
    return Quaternion;
  }}});
  var module$math$MathUtils = $$require("math/MathUtils.js");
  class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this._x = x;
      this._y = y;
      this._z = z;
      this._w = w;
    }
    static slerp(qa, qb, qm, t) {
      return qm.copy(qa).slerp(qb, t);
    }
    static slerpFlat(dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t) {
      let x0 = src0[srcOffset0 + 0], y0 = src0[srcOffset0 + 1], z0 = src0[srcOffset0 + 2], w0 = src0[srcOffset0 + 3];
      const x1 = src1[srcOffset1 + 0], y1 = src1[srcOffset1 + 1], z1 = src1[srcOffset1 + 2], w1 = src1[srcOffset1 + 3];
      if (t === 0) {
        dst[dstOffset + 0] = x0;
        dst[dstOffset + 1] = y0;
        dst[dstOffset + 2] = z0;
        dst[dstOffset + 3] = w0;
        return;
      }
      if (t === 1) {
        dst[dstOffset + 0] = x1;
        dst[dstOffset + 1] = y1;
        dst[dstOffset + 2] = z1;
        dst[dstOffset + 3] = w1;
        return;
      }
      if (w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1) {
        let s = 1 - t;
        const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1, dir = cos >= 0 ? 1 : -1, sqrSin = 1 - cos * cos;
        if (sqrSin > Number.EPSILON) {
          const sin = Math.sqrt(sqrSin), len = Math.atan2(sin, cos * dir);
          s = Math.sin(s * len) / sin;
          t = Math.sin(t * len) / sin;
        }
        const tDir = t * dir;
        x0 = x0 * s + x1 * tDir;
        y0 = y0 * s + y1 * tDir;
        z0 = z0 * s + z1 * tDir;
        w0 = w0 * s + w1 * tDir;
        if (s === 1 - t) {
          const f = 1 / Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0);
          x0 *= f;
          y0 *= f;
          z0 *= f;
          w0 *= f;
        }
      }
      dst[dstOffset] = x0;
      dst[dstOffset + 1] = y0;
      dst[dstOffset + 2] = z0;
      dst[dstOffset + 3] = w0;
    }
    static multiplyQuaternionsFlat(dst, dstOffset, src0, srcOffset0, src1, srcOffset1) {
      const x0 = src0[srcOffset0];
      const y0 = src0[srcOffset0 + 1];
      const z0 = src0[srcOffset0 + 2];
      const w0 = src0[srcOffset0 + 3];
      const x1 = src1[srcOffset1];
      const y1 = src1[srcOffset1 + 1];
      const z1 = src1[srcOffset1 + 2];
      const w1 = src1[srcOffset1 + 3];
      dst[dstOffset] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
      dst[dstOffset + 1] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
      dst[dstOffset + 2] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
      dst[dstOffset + 3] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;
      return dst;
    }
    get x() {
      return this._x;
    }
    set x(value) {
      this._x = value;
      this._onChangeCallback();
    }
    get y() {
      return this._y;
    }
    set y(value) {
      this._y = value;
      this._onChangeCallback();
    }
    get z() {
      return this._z;
    }
    set z(value) {
      this._z = value;
      this._onChangeCallback();
    }
    get w() {
      return this._w;
    }
    set w(value) {
      this._w = value;
      this._onChangeCallback();
    }
    set(x, y, z, w) {
      this._x = x;
      this._y = y;
      this._z = z;
      this._w = w;
      this._onChangeCallback();
      return this;
    }
    clone() {
      return new this.constructor(this._x, this._y, this._z, this._w);
    }
    copy(quaternion) {
      this._x = quaternion.x;
      this._y = quaternion.y;
      this._z = quaternion.z;
      this._w = quaternion.w;
      this._onChangeCallback();
      return this;
    }
    setFromEuler(euler, update) {
      if (!(euler && euler.isEuler)) {
        throw new Error("THREE.Quaternion: .setFromEuler() now expects an Euler rotation rather than a Vector3 and order.");
      }
      const x = euler._x, y = euler._y, z = euler._z, order = euler._order;
      const cos = Math.cos;
      const sin = Math.sin;
      const c1 = cos(x / 2);
      const c2 = cos(y / 2);
      const c3 = cos(z / 2);
      const s1 = sin(x / 2);
      const s2 = sin(y / 2);
      const s3 = sin(z / 2);
      switch(order) {
        case "XYZ":
          this._x = s1 * c2 * c3 + c1 * s2 * s3;
          this._y = c1 * s2 * c3 - s1 * c2 * s3;
          this._z = c1 * c2 * s3 + s1 * s2 * c3;
          this._w = c1 * c2 * c3 - s1 * s2 * s3;
          break;
        case "YXZ":
          this._x = s1 * c2 * c3 + c1 * s2 * s3;
          this._y = c1 * s2 * c3 - s1 * c2 * s3;
          this._z = c1 * c2 * s3 - s1 * s2 * c3;
          this._w = c1 * c2 * c3 + s1 * s2 * s3;
          break;
        case "ZXY":
          this._x = s1 * c2 * c3 - c1 * s2 * s3;
          this._y = c1 * s2 * c3 + s1 * c2 * s3;
          this._z = c1 * c2 * s3 + s1 * s2 * c3;
          this._w = c1 * c2 * c3 - s1 * s2 * s3;
          break;
        case "ZYX":
          this._x = s1 * c2 * c3 - c1 * s2 * s3;
          this._y = c1 * s2 * c3 + s1 * c2 * s3;
          this._z = c1 * c2 * s3 - s1 * s2 * c3;
          this._w = c1 * c2 * c3 + s1 * s2 * s3;
          break;
        case "YZX":
          this._x = s1 * c2 * c3 + c1 * s2 * s3;
          this._y = c1 * s2 * c3 + s1 * c2 * s3;
          this._z = c1 * c2 * s3 - s1 * s2 * c3;
          this._w = c1 * c2 * c3 - s1 * s2 * s3;
          break;
        case "XZY":
          this._x = s1 * c2 * c3 - c1 * s2 * s3;
          this._y = c1 * s2 * c3 - s1 * c2 * s3;
          this._z = c1 * c2 * s3 + s1 * s2 * c3;
          this._w = c1 * c2 * c3 + s1 * s2 * s3;
          break;
        default:
          console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: " + order);
      }
      if (update !== false) {
        this._onChangeCallback();
      }
      return this;
    }
    setFromAxisAngle(axis, angle) {
      const halfAngle = angle / 2, s = Math.sin(halfAngle);
      this._x = axis.x * s;
      this._y = axis.y * s;
      this._z = axis.z * s;
      this._w = Math.cos(halfAngle);
      this._onChangeCallback();
      return this;
    }
    setFromRotationMatrix(m) {
      const te = m.elements, m11 = te[0], m12 = te[4], m13 = te[8], m21 = te[1], m22 = te[5], m23 = te[9], m31 = te[2], m32 = te[6], m33 = te[10], trace = m11 + m22 + m33;
      if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1.0);
        this._w = 0.25 / s;
        this._x = (m32 - m23) * s;
        this._y = (m13 - m31) * s;
        this._z = (m21 - m12) * s;
      } else {
        if (m11 > m22 && m11 > m33) {
          const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
          this._w = (m32 - m23) / s;
          this._x = 0.25 * s;
          this._y = (m12 + m21) / s;
          this._z = (m13 + m31) / s;
        } else {
          if (m22 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
            this._w = (m13 - m31) / s;
            this._x = (m12 + m21) / s;
            this._y = 0.25 * s;
            this._z = (m23 + m32) / s;
          } else {
            const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
            this._w = (m21 - m12) / s;
            this._x = (m13 + m31) / s;
            this._y = (m23 + m32) / s;
            this._z = 0.25 * s;
          }
        }
      }
      this._onChangeCallback();
      return this;
    }
    setFromUnitVectors(vFrom, vTo) {
      const EPS = 0.000001;
      let r = vFrom.dot(vTo) + 1;
      if (r < EPS) {
        r = 0;
        if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
          this._x = -vFrom.y;
          this._y = vFrom.x;
          this._z = 0;
          this._w = r;
        } else {
          this._x = 0;
          this._y = -vFrom.z;
          this._z = vFrom.y;
          this._w = r;
        }
      } else {
        this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
        this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
        this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
        this._w = r;
      }
      return this.normalize();
    }
    angleTo(q) {
      return 2 * Math.acos(Math.abs(module$math$MathUtils.MathUtils.clamp(this.dot(q), -1, 1)));
    }
    rotateTowards(q, step) {
      const angle = this.angleTo(q);
      if (angle === 0) {
        return this;
      }
      const t = Math.min(1, step / angle);
      this.slerp(q, t);
      return this;
    }
    identity() {
      return this.set(0, 0, 0, 1);
    }
    invert() {
      return this.conjugate();
    }
    conjugate() {
      this._x *= -1;
      this._y *= -1;
      this._z *= -1;
      this._onChangeCallback();
      return this;
    }
    dot(v) {
      return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;
    }
    lengthSq() {
      return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
    }
    length() {
      return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);
    }
    normalize() {
      let l = this.length();
      if (l === 0) {
        this._x = 0;
        this._y = 0;
        this._z = 0;
        this._w = 1;
      } else {
        l = 1 / l;
        this._x = this._x * l;
        this._y = this._y * l;
        this._z = this._z * l;
        this._w = this._w * l;
      }
      this._onChangeCallback();
      return this;
    }
    multiply(q, p) {
      if (p !== undefined) {
        console.warn("THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead.");
        return this.multiplyQuaternions(q, p);
      }
      return this.multiplyQuaternions(this, q);
    }
    premultiply(q) {
      return this.multiplyQuaternions(q, this);
    }
    multiplyQuaternions(a, b) {
      const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
      const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;
      this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
      this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
      this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
      this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
      this._onChangeCallback();
      return this;
    }
    slerp(qb, t) {
      if (t === 0) {
        return this;
      }
      if (t === 1) {
        return this.copy(qb);
      }
      const x = this._x, y = this._y, z = this._z, w = this._w;
      let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;
      if (cosHalfTheta < 0) {
        this._w = -qb._w;
        this._x = -qb._x;
        this._y = -qb._y;
        this._z = -qb._z;
        cosHalfTheta = -cosHalfTheta;
      } else {
        this.copy(qb);
      }
      if (cosHalfTheta >= 1.0) {
        this._w = w;
        this._x = x;
        this._y = y;
        this._z = z;
        return this;
      }
      const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;
      if (sqrSinHalfTheta <= Number.EPSILON) {
        const s = 1 - t;
        this._w = s * w + t * this._w;
        this._x = s * x + t * this._x;
        this._y = s * y + t * this._y;
        this._z = s * z + t * this._z;
        this.normalize();
        this._onChangeCallback();
        return this;
      }
      const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
      const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
      const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta, ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
      this._w = w * ratioA + this._w * ratioB;
      this._x = x * ratioA + this._x * ratioB;
      this._y = y * ratioA + this._y * ratioB;
      this._z = z * ratioA + this._z * ratioB;
      this._onChangeCallback();
      return this;
    }
    equals(quaternion) {
      return quaternion._x === this._x && quaternion._y === this._y && quaternion._z === this._z && quaternion._w === this._w;
    }
    fromArray(array, offset = 0) {
      this._x = array[offset];
      this._y = array[offset + 1];
      this._z = array[offset + 2];
      this._w = array[offset + 3];
      this._onChangeCallback();
      return this;
    }
    toArray(array = [], offset = 0) {
      array[offset] = this._x;
      array[offset + 1] = this._y;
      array[offset + 2] = this._z;
      array[offset + 3] = this._w;
      return array;
    }
    fromBufferAttribute(attribute, index) {
      this._x = attribute.getX(index);
      this._y = attribute.getY(index);
      this._z = attribute.getZ(index);
      this._w = attribute.getW(index);
      return this;
    }
    _onChange(callback) {
      this._onChangeCallback = callback;
      return this;
    }
    _onChangeCallback() {
    }
  }
  Quaternion.prototype.isQuaternion = true;
}, "math/Quaternion.js", ["math/MathUtils.js"]);

//math/Vector3.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Vector3:{enumerable:true, get:function() {
    return Vector3;
  }}});
  var module$math$MathUtils = $$require("math/MathUtils.js");
  var module$math$Quaternion = $$require("math/Quaternion.js");
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    set(x, y, z) {
      if (z === undefined) {
        z = this.z;
      }
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
    setScalar(scalar) {
      this.x = scalar;
      this.y = scalar;
      this.z = scalar;
      return this;
    }
    setX(x) {
      this.x = x;
      return this;
    }
    setY(y) {
      this.y = y;
      return this;
    }
    setZ(z) {
      this.z = z;
      return this;
    }
    setComponent(index, value) {
      switch(index) {
        case 0:
          this.x = value;
          break;
        case 1:
          this.y = value;
          break;
        case 2:
          this.z = value;
          break;
        default:
          throw new Error("index is out of range: " + index);
      }
      return this;
    }
    getComponent(index) {
      switch(index) {
        case 0:
          return this.x;
        case 1:
          return this.y;
        case 2:
          return this.z;
        default:
          throw new Error("index is out of range: " + index);
      }
    }
    clone() {
      return new this.constructor(this.x, this.y, this.z);
    }
    copy(v) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    }
    add(v, w) {
      if (w !== undefined) {
        console.warn("THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead.");
        return this.addVectors(v, w);
      }
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      return this;
    }
    addScalar(s) {
      this.x += s;
      this.y += s;
      this.z += s;
      return this;
    }
    addVectors(a, b) {
      this.x = a.x + b.x;
      this.y = a.y + b.y;
      this.z = a.z + b.z;
      return this;
    }
    addScaledVector(v, s) {
      this.x += v.x * s;
      this.y += v.y * s;
      this.z += v.z * s;
      return this;
    }
    sub(v, w) {
      if (w !== undefined) {
        console.warn("THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.");
        return this.subVectors(v, w);
      }
      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
      return this;
    }
    subScalar(s) {
      this.x -= s;
      this.y -= s;
      this.z -= s;
      return this;
    }
    subVectors(a, b) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      this.z = a.z - b.z;
      return this;
    }
    multiply(v, w) {
      if (w !== undefined) {
        console.warn("THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.");
        return this.multiplyVectors(v, w);
      }
      this.x *= v.x;
      this.y *= v.y;
      this.z *= v.z;
      return this;
    }
    multiplyScalar(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      return this;
    }
    multiplyVectors(a, b) {
      this.x = a.x * b.x;
      this.y = a.y * b.y;
      this.z = a.z * b.z;
      return this;
    }
    applyEuler(euler) {
      if (!(euler && euler.isEuler)) {
        console.error("THREE.Vector3: .applyEuler() now expects an Euler rotation rather than a Vector3 and order.");
      }
      return this.applyQuaternion(_quaternion.setFromEuler(euler));
    }
    applyAxisAngle(axis, angle) {
      return this.applyQuaternion(_quaternion.setFromAxisAngle(axis, angle));
    }
    applyMatrix3(m) {
      const x = this.x, y = this.y, z = this.z;
      const e = m.elements;
      this.x = e[0] * x + e[3] * y + e[6] * z;
      this.y = e[1] * x + e[4] * y + e[7] * z;
      this.z = e[2] * x + e[5] * y + e[8] * z;
      return this;
    }
    applyNormalMatrix(m) {
      return this.applyMatrix3(m).normalize();
    }
    applyMatrix4(m) {
      const x = this.x, y = this.y, z = this.z;
      const e = m.elements;
      const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
      this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
      this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
      this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
      return this;
    }
    applyQuaternion(q) {
      const x = this.x, y = this.y, z = this.z;
      const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
      const ix = qw * x + qy * z - qz * y;
      const iy = qw * y + qz * x - qx * z;
      const iz = qw * z + qx * y - qy * x;
      const iw = -qx * x - qy * y - qz * z;
      this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
      this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
      this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
      return this;
    }
    project(camera) {
      return this.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
    }
    unproject(camera) {
      return this.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld);
    }
    transformDirection(m) {
      const x = this.x, y = this.y, z = this.z;
      const e = m.elements;
      this.x = e[0] * x + e[4] * y + e[8] * z;
      this.y = e[1] * x + e[5] * y + e[9] * z;
      this.z = e[2] * x + e[6] * y + e[10] * z;
      return this.normalize();
    }
    divide(v) {
      this.x /= v.x;
      this.y /= v.y;
      this.z /= v.z;
      return this;
    }
    divideScalar(scalar) {
      return this.multiplyScalar(1 / scalar);
    }
    min(v) {
      this.x = Math.min(this.x, v.x);
      this.y = Math.min(this.y, v.y);
      this.z = Math.min(this.z, v.z);
      return this;
    }
    max(v) {
      this.x = Math.max(this.x, v.x);
      this.y = Math.max(this.y, v.y);
      this.z = Math.max(this.z, v.z);
      return this;
    }
    clamp(min, max) {
      this.x = Math.max(min.x, Math.min(max.x, this.x));
      this.y = Math.max(min.y, Math.min(max.y, this.y));
      this.z = Math.max(min.z, Math.min(max.z, this.z));
      return this;
    }
    clampScalar(minVal, maxVal) {
      this.x = Math.max(minVal, Math.min(maxVal, this.x));
      this.y = Math.max(minVal, Math.min(maxVal, this.y));
      this.z = Math.max(minVal, Math.min(maxVal, this.z));
      return this;
    }
    clampLength(min, max) {
      const length = this.length();
      return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
    }
    floor() {
      this.x = Math.floor(this.x);
      this.y = Math.floor(this.y);
      this.z = Math.floor(this.z);
      return this;
    }
    ceil() {
      this.x = Math.ceil(this.x);
      this.y = Math.ceil(this.y);
      this.z = Math.ceil(this.z);
      return this;
    }
    round() {
      this.x = Math.round(this.x);
      this.y = Math.round(this.y);
      this.z = Math.round(this.z);
      return this;
    }
    roundToZero() {
      this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x);
      this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y);
      this.z = this.z < 0 ? Math.ceil(this.z) : Math.floor(this.z);
      return this;
    }
    negate() {
      this.x = -this.x;
      this.y = -this.y;
      this.z = -this.z;
      return this;
    }
    dot(v) {
      return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    lengthSq() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    manhattanLength() {
      return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
    }
    normalize() {
      return this.divideScalar(this.length() || 1);
    }
    setLength(length) {
      return this.normalize().multiplyScalar(length);
    }
    lerp(v, alpha) {
      this.x += (v.x - this.x) * alpha;
      this.y += (v.y - this.y) * alpha;
      this.z += (v.z - this.z) * alpha;
      return this;
    }
    lerpVectors(v1, v2, alpha) {
      this.x = v1.x + (v2.x - v1.x) * alpha;
      this.y = v1.y + (v2.y - v1.y) * alpha;
      this.z = v1.z + (v2.z - v1.z) * alpha;
      return this;
    }
    cross(v, w) {
      if (w !== undefined) {
        console.warn("THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead.");
        return this.crossVectors(v, w);
      }
      return this.crossVectors(this, v);
    }
    crossVectors(a, b) {
      const ax = a.x, ay = a.y, az = a.z;
      const bx = b.x, by = b.y, bz = b.z;
      this.x = ay * bz - az * by;
      this.y = az * bx - ax * bz;
      this.z = ax * by - ay * bx;
      return this;
    }
    projectOnVector(v) {
      const denominator = v.lengthSq();
      if (denominator === 0) {
        return this.set(0, 0, 0);
      }
      const scalar = v.dot(this) / denominator;
      return this.copy(v).multiplyScalar(scalar);
    }
    projectOnPlane(planeNormal) {
      _vector.copy(this).projectOnVector(planeNormal);
      return this.sub(_vector);
    }
    reflect(normal) {
      return this.sub(_vector.copy(normal).multiplyScalar(2 * this.dot(normal)));
    }
    angleTo(v) {
      const denominator = Math.sqrt(this.lengthSq() * v.lengthSq());
      if (denominator === 0) {
        return Math.PI / 2;
      }
      const theta = this.dot(v) / denominator;
      return Math.acos(module$math$MathUtils.MathUtils.clamp(theta, -1, 1));
    }
    distanceTo(v) {
      return Math.sqrt(this.distanceToSquared(v));
    }
    distanceToSquared(v) {
      const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;
      return dx * dx + dy * dy + dz * dz;
    }
    manhattanDistanceTo(v) {
      return Math.abs(this.x - v.x) + Math.abs(this.y - v.y) + Math.abs(this.z - v.z);
    }
    setFromSpherical(s) {
      return this.setFromSphericalCoords(s.radius, s.phi, s.theta);
    }
    setFromSphericalCoords(radius, phi, theta) {
      const sinPhiRadius = Math.sin(phi) * radius;
      this.x = sinPhiRadius * Math.sin(theta);
      this.y = Math.cos(phi) * radius;
      this.z = sinPhiRadius * Math.cos(theta);
      return this;
    }
    setFromCylindrical(c) {
      return this.setFromCylindricalCoords(c.radius, c.theta, c.y);
    }
    setFromCylindricalCoords(radius, theta, y) {
      this.x = radius * Math.sin(theta);
      this.y = y;
      this.z = radius * Math.cos(theta);
      return this;
    }
    setFromMatrixPosition(m) {
      const e = m.elements;
      this.x = e[12];
      this.y = e[13];
      this.z = e[14];
      return this;
    }
    setFromMatrixScale(m) {
      const sx = this.setFromMatrixColumn(m, 0).length();
      const sy = this.setFromMatrixColumn(m, 1).length();
      const sz = this.setFromMatrixColumn(m, 2).length();
      this.x = sx;
      this.y = sy;
      this.z = sz;
      return this;
    }
    setFromMatrixColumn(m, index) {
      return this.fromArray(m.elements, index * 4);
    }
    setFromMatrix3Column(m, index) {
      return this.fromArray(m.elements, index * 3);
    }
    equals(v) {
      return v.x === this.x && v.y === this.y && v.z === this.z;
    }
    fromArray(array, offset = 0) {
      this.x = array[offset];
      this.y = array[offset + 1];
      this.z = array[offset + 2];
      return this;
    }
    toArray(array = [], offset = 0) {
      array[offset] = this.x;
      array[offset + 1] = this.y;
      array[offset + 2] = this.z;
      return array;
    }
    fromBufferAttribute(attribute, index, offset) {
      if (offset !== undefined) {
        console.warn("THREE.Vector3: offset has been removed from .fromBufferAttribute().");
      }
      this.x = attribute.getX(index);
      this.y = attribute.getY(index);
      this.z = attribute.getZ(index);
      return this;
    }
    random() {
      this.x = Math.random();
      this.y = Math.random();
      this.z = Math.random();
      return this;
    }
  }
  Vector3.prototype.isVector3 = true;
  const _vector = new Vector3;
  const _quaternion = new module$math$Quaternion.Quaternion;
}, "math/Vector3.js", ["math/MathUtils.js", "math/Quaternion.js"]);

//math/Matrix4.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Matrix4:{enumerable:true, get:function() {
    return Matrix4;
  }}});
  var module$math$Vector3 = $$require("math/Vector3.js");
  class Matrix4 {
    constructor() {
      this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      if (arguments.length > 0) {
        console.error("THREE.Matrix4: the constructor no longer reads arguments. use .set() instead.");
      }
    }
    set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
      const te = this.elements;
      te[0] = n11;
      te[4] = n12;
      te[8] = n13;
      te[12] = n14;
      te[1] = n21;
      te[5] = n22;
      te[9] = n23;
      te[13] = n24;
      te[2] = n31;
      te[6] = n32;
      te[10] = n33;
      te[14] = n34;
      te[3] = n41;
      te[7] = n42;
      te[11] = n43;
      te[15] = n44;
      return this;
    }
    identity() {
      this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      return this;
    }
    clone() {
      return (new Matrix4).fromArray(this.elements);
    }
    copy(m) {
      const te = this.elements;
      const me = m.elements;
      te[0] = me[0];
      te[1] = me[1];
      te[2] = me[2];
      te[3] = me[3];
      te[4] = me[4];
      te[5] = me[5];
      te[6] = me[6];
      te[7] = me[7];
      te[8] = me[8];
      te[9] = me[9];
      te[10] = me[10];
      te[11] = me[11];
      te[12] = me[12];
      te[13] = me[13];
      te[14] = me[14];
      te[15] = me[15];
      return this;
    }
    copyPosition(m) {
      const te = this.elements, me = m.elements;
      te[12] = me[12];
      te[13] = me[13];
      te[14] = me[14];
      return this;
    }
    setFromMatrix3(m) {
      const me = m.elements;
      this.set(me[0], me[3], me[6], 0, me[1], me[4], me[7], 0, me[2], me[5], me[8], 0, 0, 0, 0, 1);
      return this;
    }
    extractBasis(xAxis, yAxis, zAxis) {
      xAxis.setFromMatrixColumn(this, 0);
      yAxis.setFromMatrixColumn(this, 1);
      zAxis.setFromMatrixColumn(this, 2);
      return this;
    }
    makeBasis(xAxis, yAxis, zAxis) {
      this.set(xAxis.x, yAxis.x, zAxis.x, 0, xAxis.y, yAxis.y, zAxis.y, 0, xAxis.z, yAxis.z, zAxis.z, 0, 0, 0, 0, 1);
      return this;
    }
    extractRotation(m) {
      const te = this.elements;
      const me = m.elements;
      const scaleX = 1 / _v1.setFromMatrixColumn(m, 0).length();
      const scaleY = 1 / _v1.setFromMatrixColumn(m, 1).length();
      const scaleZ = 1 / _v1.setFromMatrixColumn(m, 2).length();
      te[0] = me[0] * scaleX;
      te[1] = me[1] * scaleX;
      te[2] = me[2] * scaleX;
      te[3] = 0;
      te[4] = me[4] * scaleY;
      te[5] = me[5] * scaleY;
      te[6] = me[6] * scaleY;
      te[7] = 0;
      te[8] = me[8] * scaleZ;
      te[9] = me[9] * scaleZ;
      te[10] = me[10] * scaleZ;
      te[11] = 0;
      te[12] = 0;
      te[13] = 0;
      te[14] = 0;
      te[15] = 1;
      return this;
    }
    makeRotationFromEuler(euler) {
      if (!(euler && euler.isEuler)) {
        console.error("THREE.Matrix4: .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.");
      }
      const te = this.elements;
      const x = euler.x, y = euler.y, z = euler.z;
      const a = Math.cos(x), b = Math.sin(x);
      const c = Math.cos(y), d = Math.sin(y);
      const e = Math.cos(z), f = Math.sin(z);
      if (euler.order === "XYZ") {
        const ae = a * e, af = a * f, be = b * e, bf = b * f;
        te[0] = c * e;
        te[4] = -c * f;
        te[8] = d;
        te[1] = af + be * d;
        te[5] = ae - bf * d;
        te[9] = -b * c;
        te[2] = bf - ae * d;
        te[6] = be + af * d;
        te[10] = a * c;
      } else {
        if (euler.order === "YXZ") {
          const ce = c * e, cf = c * f, de = d * e, df = d * f;
          te[0] = ce + df * b;
          te[4] = de * b - cf;
          te[8] = a * d;
          te[1] = a * f;
          te[5] = a * e;
          te[9] = -b;
          te[2] = cf * b - de;
          te[6] = df + ce * b;
          te[10] = a * c;
        } else {
          if (euler.order === "ZXY") {
            const ce = c * e, cf = c * f, de = d * e, df = d * f;
            te[0] = ce - df * b;
            te[4] = -a * f;
            te[8] = de + cf * b;
            te[1] = cf + de * b;
            te[5] = a * e;
            te[9] = df - ce * b;
            te[2] = -a * d;
            te[6] = b;
            te[10] = a * c;
          } else {
            if (euler.order === "ZYX") {
              const ae = a * e, af = a * f, be = b * e, bf = b * f;
              te[0] = c * e;
              te[4] = be * d - af;
              te[8] = ae * d + bf;
              te[1] = c * f;
              te[5] = bf * d + ae;
              te[9] = af * d - be;
              te[2] = -d;
              te[6] = b * c;
              te[10] = a * c;
            } else {
              if (euler.order === "YZX") {
                const ac = a * c, ad = a * d, bc = b * c, bd = b * d;
                te[0] = c * e;
                te[4] = bd - ac * f;
                te[8] = bc * f + ad;
                te[1] = f;
                te[5] = a * e;
                te[9] = -b * e;
                te[2] = -d * e;
                te[6] = ad * f + bc;
                te[10] = ac - bd * f;
              } else {
                if (euler.order === "XZY") {
                  const ac = a * c, ad = a * d, bc = b * c, bd = b * d;
                  te[0] = c * e;
                  te[4] = -f;
                  te[8] = d * e;
                  te[1] = ac * f + bd;
                  te[5] = a * e;
                  te[9] = ad * f - bc;
                  te[2] = bc * f - ad;
                  te[6] = b * e;
                  te[10] = bd * f + ac;
                }
              }
            }
          }
        }
      }
      te[3] = 0;
      te[7] = 0;
      te[11] = 0;
      te[12] = 0;
      te[13] = 0;
      te[14] = 0;
      te[15] = 1;
      return this;
    }
    makeRotationFromQuaternion(q) {
      return this.compose(_zero, q, _one);
    }
    lookAt(eye, target, up) {
      const te = this.elements;
      _z.subVectors(eye, target);
      if (_z.lengthSq() === 0) {
        _z.z = 1;
      }
      _z.normalize();
      _x.crossVectors(up, _z);
      if (_x.lengthSq() === 0) {
        if (Math.abs(up.z) === 1) {
          _z.x += 0.0001;
        } else {
          _z.z += 0.0001;
        }
        _z.normalize();
        _x.crossVectors(up, _z);
      }
      _x.normalize();
      _y.crossVectors(_z, _x);
      te[0] = _x.x;
      te[4] = _y.x;
      te[8] = _z.x;
      te[1] = _x.y;
      te[5] = _y.y;
      te[9] = _z.y;
      te[2] = _x.z;
      te[6] = _y.z;
      te[10] = _z.z;
      return this;
    }
    multiply(m, n) {
      if (n !== undefined) {
        console.warn("THREE.Matrix4: .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead.");
        return this.multiplyMatrices(m, n);
      }
      return this.multiplyMatrices(this, m);
    }
    premultiply(m) {
      return this.multiplyMatrices(m, this);
    }
    multiplyMatrices(a, b) {
      const ae = a.elements;
      const be = b.elements;
      const te = this.elements;
      const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
      const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
      const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
      const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];
      const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
      const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
      const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
      const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];
      te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
      te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
      te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
      te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
      te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
      te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
      te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
      te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
      te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
      te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
      te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
      te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
      te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
      te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
      te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
      te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
      return this;
    }
    multiplyScalar(s) {
      const te = this.elements;
      te[0] *= s;
      te[4] *= s;
      te[8] *= s;
      te[12] *= s;
      te[1] *= s;
      te[5] *= s;
      te[9] *= s;
      te[13] *= s;
      te[2] *= s;
      te[6] *= s;
      te[10] *= s;
      te[14] *= s;
      te[3] *= s;
      te[7] *= s;
      te[11] *= s;
      te[15] *= s;
      return this;
    }
    determinant() {
      const te = this.elements;
      const n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
      const n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
      const n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
      const n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];
      return n41 * (+n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34) + n42 * (+n11 * n23 * n34 - n11 * n24 * n33 + n14 * n21 * n33 - n13 * n21 * n34 + n13 * n24 * n31 - n14 * n23 * n31) + n43 * (+n11 * n24 * n32 - n11 * n22 * n34 - n14 * n21 * n32 + n12 * n21 * n34 + n14 * n22 * n31 - n12 * n24 * n31) + n44 * (-n13 * n22 * n31 - n11 * n23 * n32 + n11 * n22 * n33 + n13 * n21 * n32 - n12 * n21 * n33 + n12 * n23 * n31);
    }
    transpose() {
      const te = this.elements;
      let tmp;
      tmp = te[1];
      te[1] = te[4];
      te[4] = tmp;
      tmp = te[2];
      te[2] = te[8];
      te[8] = tmp;
      tmp = te[6];
      te[6] = te[9];
      te[9] = tmp;
      tmp = te[3];
      te[3] = te[12];
      te[12] = tmp;
      tmp = te[7];
      te[7] = te[13];
      te[13] = tmp;
      tmp = te[11];
      te[11] = te[14];
      te[14] = tmp;
      return this;
    }
    setPosition(x, y, z) {
      const te = this.elements;
      if (x.isVector3) {
        te[12] = x.x;
        te[13] = x.y;
        te[14] = x.z;
      } else {
        te[12] = x;
        te[13] = y;
        te[14] = z;
      }
      return this;
    }
    invert() {
      const te = this.elements, n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3], n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7], n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11], n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15], t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44, t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44, t13 = n13 * n24 * n42 - n14 * 
      n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44, t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
      const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
      if (det === 0) {
        return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      }
      const detInv = 1 / det;
      te[0] = t11 * detInv;
      te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
      te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
      te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;
      te[4] = t12 * detInv;
      te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
      te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
      te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;
      te[8] = t13 * detInv;
      te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
      te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
      te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;
      te[12] = t14 * detInv;
      te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
      te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
      te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;
      return this;
    }
    scale(v) {
      const te = this.elements;
      const x = v.x, y = v.y, z = v.z;
      te[0] *= x;
      te[4] *= y;
      te[8] *= z;
      te[1] *= x;
      te[5] *= y;
      te[9] *= z;
      te[2] *= x;
      te[6] *= y;
      te[10] *= z;
      te[3] *= x;
      te[7] *= y;
      te[11] *= z;
      return this;
    }
    getMaxScaleOnAxis() {
      const te = this.elements;
      const scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
      const scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
      const scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];
      return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
    }
    makeTranslation(x, y, z) {
      this.set(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1);
      return this;
    }
    makeRotationX(theta) {
      const c = Math.cos(theta), s = Math.sin(theta);
      this.set(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
      return this;
    }
    makeRotationY(theta) {
      const c = Math.cos(theta), s = Math.sin(theta);
      this.set(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
      return this;
    }
    makeRotationZ(theta) {
      const c = Math.cos(theta), s = Math.sin(theta);
      this.set(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      return this;
    }
    makeRotationAxis(axis, angle) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const t = 1 - c;
      const x = axis.x, y = axis.y, z = axis.z;
      const tx = t * x, ty = t * y;
      this.set(tx * x + c, tx * y - s * z, tx * z + s * y, 0, tx * y + s * z, ty * y + c, ty * z - s * x, 0, tx * z - s * y, ty * z + s * x, t * z * z + c, 0, 0, 0, 0, 1);
      return this;
    }
    makeScale(x, y, z) {
      this.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);
      return this;
    }
    makeShear(x, y, z) {
      this.set(1, y, z, 0, x, 1, z, 0, x, y, 1, 0, 0, 0, 0, 1);
      return this;
    }
    compose(position, quaternion, scale) {
      const te = this.elements;
      const x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
      const x2 = x + x, y2 = y + y, z2 = z + z;
      const xx = x * x2, xy = x * y2, xz = x * z2;
      const yy = y * y2, yz = y * z2, zz = z * z2;
      const wx = w * x2, wy = w * y2, wz = w * z2;
      const sx = scale.x, sy = scale.y, sz = scale.z;
      te[0] = (1 - (yy + zz)) * sx;
      te[1] = (xy + wz) * sx;
      te[2] = (xz - wy) * sx;
      te[3] = 0;
      te[4] = (xy - wz) * sy;
      te[5] = (1 - (xx + zz)) * sy;
      te[6] = (yz + wx) * sy;
      te[7] = 0;
      te[8] = (xz + wy) * sz;
      te[9] = (yz - wx) * sz;
      te[10] = (1 - (xx + yy)) * sz;
      te[11] = 0;
      te[12] = position.x;
      te[13] = position.y;
      te[14] = position.z;
      te[15] = 1;
      return this;
    }
    decompose(position, quaternion, scale) {
      const te = this.elements;
      let sx = _v1.set(te[0], te[1], te[2]).length();
      const sy = _v1.set(te[4], te[5], te[6]).length();
      const sz = _v1.set(te[8], te[9], te[10]).length();
      const det = this.determinant();
      if (det < 0) {
        sx = -sx;
      }
      position.x = te[12];
      position.y = te[13];
      position.z = te[14];
      _m1.copy(this);
      const invSX = 1 / sx;
      const invSY = 1 / sy;
      const invSZ = 1 / sz;
      _m1.elements[0] *= invSX;
      _m1.elements[1] *= invSX;
      _m1.elements[2] *= invSX;
      _m1.elements[4] *= invSY;
      _m1.elements[5] *= invSY;
      _m1.elements[6] *= invSY;
      _m1.elements[8] *= invSZ;
      _m1.elements[9] *= invSZ;
      _m1.elements[10] *= invSZ;
      quaternion.setFromRotationMatrix(_m1);
      scale.x = sx;
      scale.y = sy;
      scale.z = sz;
      return this;
    }
    makePerspective(left, right, top, bottom, near, far) {
      if (far === undefined) {
        console.warn("THREE.Matrix4: .makePerspective() has been redefined and has a new signature. Please check the docs.");
      }
      const te = this.elements;
      const x = 2 * near / (right - left);
      const y = 2 * near / (top - bottom);
      const a = (right + left) / (right - left);
      const b = (top + bottom) / (top - bottom);
      const c = -(far + near) / (far - near);
      const d = -2 * far * near / (far - near);
      te[0] = x;
      te[4] = 0;
      te[8] = a;
      te[12] = 0;
      te[1] = 0;
      te[5] = y;
      te[9] = b;
      te[13] = 0;
      te[2] = 0;
      te[6] = 0;
      te[10] = c;
      te[14] = d;
      te[3] = 0;
      te[7] = 0;
      te[11] = -1;
      te[15] = 0;
      return this;
    }
    makeOrthographic(left, right, top, bottom, near, far) {
      const te = this.elements;
      const w = 1.0 / (right - left);
      const h = 1.0 / (top - bottom);
      const p = 1.0 / (far - near);
      const x = (right + left) * w;
      const y = (top + bottom) * h;
      const z = (far + near) * p;
      te[0] = 2 * w;
      te[4] = 0;
      te[8] = 0;
      te[12] = -x;
      te[1] = 0;
      te[5] = 2 * h;
      te[9] = 0;
      te[13] = -y;
      te[2] = 0;
      te[6] = 0;
      te[10] = -2 * p;
      te[14] = -z;
      te[3] = 0;
      te[7] = 0;
      te[11] = 0;
      te[15] = 1;
      return this;
    }
    equals(matrix) {
      const te = this.elements;
      const me = matrix.elements;
      for (let i = 0; i < 16; i++) {
        if (te[i] !== me[i]) {
          return false;
        }
      }
      return true;
    }
    fromArray(array, offset = 0) {
      for (let i = 0; i < 16; i++) {
        this.elements[i] = array[i + offset];
      }
      return this;
    }
    toArray(array = [], offset = 0) {
      const te = this.elements;
      array[offset] = te[0];
      array[offset + 1] = te[1];
      array[offset + 2] = te[2];
      array[offset + 3] = te[3];
      array[offset + 4] = te[4];
      array[offset + 5] = te[5];
      array[offset + 6] = te[6];
      array[offset + 7] = te[7];
      array[offset + 8] = te[8];
      array[offset + 9] = te[9];
      array[offset + 10] = te[10];
      array[offset + 11] = te[11];
      array[offset + 12] = te[12];
      array[offset + 13] = te[13];
      array[offset + 14] = te[14];
      array[offset + 15] = te[15];
      return array;
    }
  }
  Matrix4.prototype.isMatrix4 = true;
  const _v1 = new module$math$Vector3.Vector3;
  const _m1 = new Matrix4;
  const _zero = new module$math$Vector3.Vector3(0, 0, 0);
  const _one = new module$math$Vector3.Vector3(1, 1, 1);
  const _x = new module$math$Vector3.Vector3;
  const _y = new module$math$Vector3.Vector3;
  const _z = new module$math$Vector3.Vector3;
}, "math/Matrix4.js", ["math/Vector3.js"]);

//core/EventDispatcher.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {EventDispatcher:{enumerable:true, get:function() {
    return EventDispatcher;
  }}});
  class EventDispatcher {
    constructor() {
      this._listeners = undefined;
    }
    addEventListener(type, listener) {
      if (this._listeners === undefined) {
        this._listeners = {};
      }
      const listeners = this._listeners;
      if (listeners[type] === undefined) {
        listeners[type] = [];
      }
      if (listeners[type].indexOf(listener) === -1) {
        listeners[type].push(listener);
      }
    }
    hasEventListener(type, listener) {
      if (this._listeners === undefined) {
        return false;
      }
      const listeners = this._listeners;
      return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
    }
    removeEventListener(type, listener) {
      if (this._listeners === undefined) {
        return;
      }
      const listeners = this._listeners;
      const listenerArray = listeners[type];
      if (listenerArray !== undefined) {
        const index = listenerArray.indexOf(listener);
        if (index !== -1) {
          listenerArray.splice(index, 1);
        }
      }
    }
    dispatchEvent(event) {
      console.log("dispatchEvent " + JSON.stringify(event));
      if (this._listeners === undefined) {
        return;
      }
      const listeners = this._listeners;
      const listenerArray = listeners[event.type];
      if (listenerArray !== undefined) {
        console.log("EventDesp 1");
        event.target = this;
        const array = listenerArray.slice(0);
        for (let i = 0, l = array.length; i < l; i++) {
          array[i].call(this, event);
        }
      }
    }
  }
}, "core/EventDispatcher.js", []);

//math/Euler.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Euler:{enumerable:true, get:function() {
    return Euler;
  }}});
  var module$math$Quaternion = $$require("math/Quaternion.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$math$Matrix4 = $$require("math/Matrix4.js");
  var module$math$MathUtils = $$require("math/MathUtils.js");
  const _matrix = new module$math$Matrix4.Matrix4;
  const _quaternion = new module$math$Quaternion.Quaternion;
  class Euler {
    constructor(x = 0, y = 0, z = 0, order = Euler.DefaultOrder) {
      this._x = x;
      this._y = y;
      this._z = z;
      this._order = order;
    }
    get x() {
      return this._x;
    }
    set x(value) {
      this._x = value;
      this._onChangeCallback();
    }
    get y() {
      return this._y;
    }
    set y(value) {
      this._y = value;
      this._onChangeCallback();
    }
    get z() {
      return this._z;
    }
    set z(value) {
      this._z = value;
      this._onChangeCallback();
    }
    get order() {
      return this._order;
    }
    set order(value) {
      this._order = value;
      this._onChangeCallback();
    }
    set(x, y, z, order) {
      this._x = x;
      this._y = y;
      this._z = z;
      this._order = order || this._order;
      this._onChangeCallback();
      return this;
    }
    clone() {
      return new this.constructor(this._x, this._y, this._z, this._order);
    }
    copy(euler) {
      this._x = euler._x;
      this._y = euler._y;
      this._z = euler._z;
      this._order = euler._order;
      this._onChangeCallback();
      return this;
    }
    setFromRotationMatrix(m, order, update) {
      const clamp = module$math$MathUtils.MathUtils.clamp;
      const te = m.elements;
      const m11 = te[0], m12 = te[4], m13 = te[8];
      const m21 = te[1], m22 = te[5], m23 = te[9];
      const m31 = te[2], m32 = te[6], m33 = te[10];
      order = order || this._order;
      switch(order) {
        case "XYZ":
          this._y = Math.asin(clamp(m13, -1, 1));
          if (Math.abs(m13) < 0.9999999) {
            this._x = Math.atan2(-m23, m33);
            this._z = Math.atan2(-m12, m11);
          } else {
            this._x = Math.atan2(m32, m22);
            this._z = 0;
          }
          break;
        case "YXZ":
          this._x = Math.asin(-clamp(m23, -1, 1));
          if (Math.abs(m23) < 0.9999999) {
            this._y = Math.atan2(m13, m33);
            this._z = Math.atan2(m21, m22);
          } else {
            this._y = Math.atan2(-m31, m11);
            this._z = 0;
          }
          break;
        case "ZXY":
          this._x = Math.asin(clamp(m32, -1, 1));
          if (Math.abs(m32) < 0.9999999) {
            this._y = Math.atan2(-m31, m33);
            this._z = Math.atan2(-m12, m22);
          } else {
            this._y = 0;
            this._z = Math.atan2(m21, m11);
          }
          break;
        case "ZYX":
          this._y = Math.asin(-clamp(m31, -1, 1));
          if (Math.abs(m31) < 0.9999999) {
            this._x = Math.atan2(m32, m33);
            this._z = Math.atan2(m21, m11);
          } else {
            this._x = 0;
            this._z = Math.atan2(-m12, m22);
          }
          break;
        case "YZX":
          this._z = Math.asin(clamp(m21, -1, 1));
          if (Math.abs(m21) < 0.9999999) {
            this._x = Math.atan2(-m23, m22);
            this._y = Math.atan2(-m31, m11);
          } else {
            this._x = 0;
            this._y = Math.atan2(m13, m33);
          }
          break;
        case "XZY":
          this._z = Math.asin(-clamp(m12, -1, 1));
          if (Math.abs(m12) < 0.9999999) {
            this._x = Math.atan2(m32, m22);
            this._y = Math.atan2(m13, m11);
          } else {
            this._x = Math.atan2(-m23, m33);
            this._y = 0;
          }
          break;
        default:
          console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: " + order);
      }
      this._order = order;
      if (update !== false) {
        this._onChangeCallback();
      }
      return this;
    }
    setFromQuaternion(q, order, update) {
      _matrix.makeRotationFromQuaternion(q);
      return this.setFromRotationMatrix(_matrix, order, update);
    }
    setFromVector3(v, order) {
      return this.set(v.x, v.y, v.z, order || this._order);
    }
    reorder(newOrder) {
      _quaternion.setFromEuler(this);
      return this.setFromQuaternion(_quaternion, newOrder);
    }
    equals(euler) {
      return euler._x === this._x && euler._y === this._y && euler._z === this._z && euler._order === this._order;
    }
    fromArray(array) {
      this._x = array[0];
      this._y = array[1];
      this._z = array[2];
      if (array[3] !== undefined) {
        this._order = array[3];
      }
      this._onChangeCallback();
      return this;
    }
    toArray(array = [], offset = 0) {
      array[offset] = this._x;
      array[offset + 1] = this._y;
      array[offset + 2] = this._z;
      array[offset + 3] = this._order;
      return array;
    }
    toVector3(optionalResult) {
      if (optionalResult) {
        return optionalResult.set(this._x, this._y, this._z);
      } else {
        return new module$math$Vector3.Vector3(this._x, this._y, this._z);
      }
    }
    _onChange(callback) {
      this._onChangeCallback = callback;
      return this;
    }
    _onChangeCallback() {
    }
  }
  Euler.prototype.isEuler = true;
  Euler.DefaultOrder = "XYZ";
  Euler.RotationOrders = ["XYZ", "YZX", "ZXY", "XZY", "YXZ", "ZYX"];
}, "math/Euler.js", ["math/Quaternion.js", "math/Vector3.js", "math/Matrix4.js", "math/MathUtils.js"]);

//core/Layers.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Layers:{enumerable:true, get:function() {
    return Layers;
  }}});
  class Layers {
    constructor() {
      this.mask = 1 | 0;
    }
    set(channel) {
      this.mask = 1 << channel | 0;
    }
    enable(channel) {
      this.mask |= 1 << channel | 0;
    }
    enableAll() {
      this.mask = 4294967295 | 0;
    }
    toggle(channel) {
      this.mask ^= 1 << channel | 0;
    }
    disable(channel) {
      this.mask &= ~(1 << channel | 0);
    }
    disableAll() {
      this.mask = 0;
    }
    test(layers) {
      return (this.mask & layers.mask) !== 0;
    }
  }
}, "core/Layers.js", []);

//math/Matrix3.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Matrix3:{enumerable:true, get:function() {
    return Matrix3;
  }}});
  class Matrix3 {
    constructor() {
      this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      if (arguments.length > 0) {
        console.error("THREE.Matrix3: the constructor no longer reads arguments. use .set() instead.");
      }
    }
    set(n11, n12, n13, n21, n22, n23, n31, n32, n33) {
      const te = this.elements;
      te[0] = n11;
      te[1] = n21;
      te[2] = n31;
      te[3] = n12;
      te[4] = n22;
      te[5] = n32;
      te[6] = n13;
      te[7] = n23;
      te[8] = n33;
      return this;
    }
    identity() {
      this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
      return this;
    }
    copy(m) {
      const te = this.elements;
      const me = m.elements;
      te[0] = me[0];
      te[1] = me[1];
      te[2] = me[2];
      te[3] = me[3];
      te[4] = me[4];
      te[5] = me[5];
      te[6] = me[6];
      te[7] = me[7];
      te[8] = me[8];
      return this;
    }
    extractBasis(xAxis, yAxis, zAxis) {
      xAxis.setFromMatrix3Column(this, 0);
      yAxis.setFromMatrix3Column(this, 1);
      zAxis.setFromMatrix3Column(this, 2);
      return this;
    }
    setFromMatrix4(m) {
      const me = m.elements;
      this.set(me[0], me[4], me[8], me[1], me[5], me[9], me[2], me[6], me[10]);
      return this;
    }
    multiply(m) {
      return this.multiplyMatrices(this, m);
    }
    premultiply(m) {
      return this.multiplyMatrices(m, this);
    }
    multiplyMatrices(a, b) {
      const ae = a.elements;
      const be = b.elements;
      const te = this.elements;
      const a11 = ae[0], a12 = ae[3], a13 = ae[6];
      const a21 = ae[1], a22 = ae[4], a23 = ae[7];
      const a31 = ae[2], a32 = ae[5], a33 = ae[8];
      const b11 = be[0], b12 = be[3], b13 = be[6];
      const b21 = be[1], b22 = be[4], b23 = be[7];
      const b31 = be[2], b32 = be[5], b33 = be[8];
      te[0] = a11 * b11 + a12 * b21 + a13 * b31;
      te[3] = a11 * b12 + a12 * b22 + a13 * b32;
      te[6] = a11 * b13 + a12 * b23 + a13 * b33;
      te[1] = a21 * b11 + a22 * b21 + a23 * b31;
      te[4] = a21 * b12 + a22 * b22 + a23 * b32;
      te[7] = a21 * b13 + a22 * b23 + a23 * b33;
      te[2] = a31 * b11 + a32 * b21 + a33 * b31;
      te[5] = a31 * b12 + a32 * b22 + a33 * b32;
      te[8] = a31 * b13 + a32 * b23 + a33 * b33;
      return this;
    }
    multiplyScalar(s) {
      const te = this.elements;
      te[0] *= s;
      te[3] *= s;
      te[6] *= s;
      te[1] *= s;
      te[4] *= s;
      te[7] *= s;
      te[2] *= s;
      te[5] *= s;
      te[8] *= s;
      return this;
    }
    determinant() {
      const te = this.elements;
      const a = te[0], b = te[1], c = te[2], d = te[3], e = te[4], f = te[5], g = te[6], h = te[7], i = te[8];
      return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
    }
    invert() {
      const te = this.elements, n11 = te[0], n21 = te[1], n31 = te[2], n12 = te[3], n22 = te[4], n32 = te[5], n13 = te[6], n23 = te[7], n33 = te[8], t11 = n33 * n22 - n32 * n23, t12 = n32 * n13 - n33 * n12, t13 = n23 * n12 - n22 * n13, det = n11 * t11 + n21 * t12 + n31 * t13;
      if (det === 0) {
        return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
      }
      const detInv = 1 / det;
      te[0] = t11 * detInv;
      te[1] = (n31 * n23 - n33 * n21) * detInv;
      te[2] = (n32 * n21 - n31 * n22) * detInv;
      te[3] = t12 * detInv;
      te[4] = (n33 * n11 - n31 * n13) * detInv;
      te[5] = (n31 * n12 - n32 * n11) * detInv;
      te[6] = t13 * detInv;
      te[7] = (n21 * n13 - n23 * n11) * detInv;
      te[8] = (n22 * n11 - n21 * n12) * detInv;
      return this;
    }
    transpose() {
      let tmp;
      const m = this.elements;
      tmp = m[1];
      m[1] = m[3];
      m[3] = tmp;
      tmp = m[2];
      m[2] = m[6];
      m[6] = tmp;
      tmp = m[5];
      m[5] = m[7];
      m[7] = tmp;
      return this;
    }
    getNormalMatrix(matrix4) {
      return this.setFromMatrix4(matrix4).invert().transpose();
    }
    transposeIntoArray(r) {
      const m = this.elements;
      r[0] = m[0];
      r[1] = m[3];
      r[2] = m[6];
      r[3] = m[1];
      r[4] = m[4];
      r[5] = m[7];
      r[6] = m[2];
      r[7] = m[5];
      r[8] = m[8];
      return this;
    }
    setUvTransform(tx, ty, sx, sy, rotation, cx, cy) {
      const c = Math.cos(rotation);
      const s = Math.sin(rotation);
      this.set(sx * c, sx * s, -sx * (c * cx + s * cy) + cx + tx, -sy * s, sy * c, -sy * (-s * cx + c * cy) + cy + ty, 0, 0, 1);
      return this;
    }
    scale(sx, sy) {
      const te = this.elements;
      te[0] *= sx;
      te[3] *= sx;
      te[6] *= sx;
      te[1] *= sy;
      te[4] *= sy;
      te[7] *= sy;
      return this;
    }
    rotate(theta) {
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      const te = this.elements;
      const a11 = te[0], a12 = te[3], a13 = te[6];
      const a21 = te[1], a22 = te[4], a23 = te[7];
      te[0] = c * a11 + s * a21;
      te[3] = c * a12 + s * a22;
      te[6] = c * a13 + s * a23;
      te[1] = -s * a11 + c * a21;
      te[4] = -s * a12 + c * a22;
      te[7] = -s * a13 + c * a23;
      return this;
    }
    translate(tx, ty) {
      const te = this.elements;
      te[0] += tx * te[2];
      te[3] += tx * te[5];
      te[6] += tx * te[8];
      te[1] += ty * te[2];
      te[4] += ty * te[5];
      te[7] += ty * te[8];
      return this;
    }
    equals(matrix) {
      const te = this.elements;
      const me = matrix.elements;
      for (let i = 0; i < 9; i++) {
        if (te[i] !== me[i]) {
          return false;
        }
      }
      return true;
    }
    fromArray(array, offset = 0) {
      for (let i = 0; i < 9; i++) {
        this.elements[i] = array[i + offset];
      }
      return this;
    }
    toArray(array = [], offset = 0) {
      const te = this.elements;
      array[offset] = te[0];
      array[offset + 1] = te[1];
      array[offset + 2] = te[2];
      array[offset + 3] = te[3];
      array[offset + 4] = te[4];
      array[offset + 5] = te[5];
      array[offset + 6] = te[6];
      array[offset + 7] = te[7];
      array[offset + 8] = te[8];
      return array;
    }
    clone() {
      return (new this.constructor).fromArray(this.elements);
    }
  }
  Matrix3.prototype.isMatrix3 = true;
}, "math/Matrix3.js", []);

//core/Object3D.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Object3D:{enumerable:true, get:function() {
    return Object3D;
  }}});
  var module$math$Quaternion = $$require("math/Quaternion.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$math$Matrix4 = $$require("math/Matrix4.js");
  var module$core$EventDispatcher = $$require("core/EventDispatcher.js");
  var module$math$Euler = $$require("math/Euler.js");
  var module$core$Layers = $$require("core/Layers.js");
  var module$math$Matrix3 = $$require("math/Matrix3.js");
  var module$math$MathUtils = $$require("math/MathUtils.js");
  let _object3DId = 0;
  const _v1 = new module$math$Vector3.Vector3;
  const _q1 = new module$math$Quaternion.Quaternion;
  const _m1 = new module$math$Matrix4.Matrix4;
  const _target = new module$math$Vector3.Vector3;
  const _position = new module$math$Vector3.Vector3;
  const _scale = new module$math$Vector3.Vector3;
  const _quaternion = new module$math$Quaternion.Quaternion;
  const _xAxis = new module$math$Vector3.Vector3(1, 0, 0);
  const _yAxis = new module$math$Vector3.Vector3(0, 1, 0);
  const _zAxis = new module$math$Vector3.Vector3(0, 0, 1);
  const _addedEvent = {type:"added"};
  const _removedEvent = {type:"removed"};
  class Object3D extends module$core$EventDispatcher.EventDispatcher {
    constructor() {
      super();
      Object3D.DefaultUp = new module$math$Vector3.Vector3(0, 1, 0);
      Object3D.DefaultMatrixAutoUpdate = true;
      this.id = _object3DId++;
      this.uuid = module$math$MathUtils.MathUtils.generateUUID();
      this.name = "";
      this.type = "Object3D";
      this.parent = null;
      this.children = [];
      this.up = Object3D.DefaultUp.clone();
      const position = new module$math$Vector3.Vector3;
      const rotation = new module$math$Euler.Euler;
      const quaternion = new module$math$Quaternion.Quaternion;
      const scale = new module$math$Vector3.Vector3(1, 1, 1);
      function onRotationChange() {
        quaternion.setFromEuler(rotation, false);
      }
      function onQuaternionChange() {
        rotation.setFromQuaternion(quaternion, undefined, false);
      }
      rotation._onChange(onRotationChange);
      quaternion._onChange(onQuaternionChange);
      this.position = position;
      this.rotation = rotation;
      this.quaternion = quaternion;
      this.scale = scale;
      this.modelViewMatrix = new module$math$Matrix4.Matrix4;
      this.normalMatrix = new module$math$Matrix3.Matrix3;
      this.matrix = new module$math$Matrix4.Matrix4;
      this.matrixWorld = new module$math$Matrix4.Matrix4;
      this.matrixAutoUpdate = Object3D.DefaultMatrixAutoUpdate;
      this.matrixWorldNeedsUpdate = false;
      this.layers = new module$core$Layers.Layers;
      this.visible = true;
      this.castShadow = false;
      this.receiveShadow = false;
      this.frustumCulled = true;
      this.renderOrder = 0;
      this.animations = [];
      this.userData = {};
      this.isObject3D = true;
    }
    onBeforeRender() {
    }
    onAfterRender() {
    }
    applyMatrix4(matrix) {
      if (this.matrixAutoUpdate) {
        this.updateMatrix();
      }
      this.matrix.premultiply(matrix);
      this.matrix.decompose(this.position, this.quaternion, this.scale);
    }
    applyQuaternion(q) {
      this.quaternion.premultiply(q);
      return this;
    }
    setRotationFromAxisAngle(axis, angle) {
      this.quaternion.setFromAxisAngle(axis, angle);
    }
    setRotationFromEuler(euler) {
      this.quaternion.setFromEuler(euler, true);
    }
    setRotationFromMatrix(m) {
      this.quaternion.setFromRotationMatrix(m);
    }
    setRotationFromQuaternion(q) {
      this.quaternion.copy(q);
    }
    rotateOnAxis(axis, angle) {
      _q1.setFromAxisAngle(axis, angle);
      this.quaternion.multiply(_q1);
      return this;
    }
    rotateOnWorldAxis(axis, angle) {
      _q1.setFromAxisAngle(axis, angle);
      this.quaternion.premultiply(_q1);
      return this;
    }
    rotateX(angle) {
      return this.rotateOnAxis(_xAxis, angle);
    }
    rotateY(angle) {
      return this.rotateOnAxis(_yAxis, angle);
    }
    rotateZ(angle) {
      return this.rotateOnAxis(_zAxis, angle);
    }
    translateOnAxis(axis, distance) {
      _v1.copy(axis).applyQuaternion(this.quaternion);
      this.position.add(_v1.multiplyScalar(distance));
      return this;
    }
    translateX(distance) {
      return this.translateOnAxis(_xAxis, distance);
    }
    translateY(distance) {
      return this.translateOnAxis(_yAxis, distance);
    }
    translateZ(distance) {
      return this.translateOnAxis(_zAxis, distance);
    }
    localToWorld(vector) {
      return vector.applyMatrix4(this.matrixWorld);
    }
    worldToLocal(vector) {
      return vector.applyMatrix4(_m1.copy(this.matrixWorld).invert());
    }
    lookAt(x, y, z) {
      if (x.isVector3) {
        _target.copy(x);
      } else {
        _target.set(x, y, z);
      }
      const parent = this.parent;
      this.updateWorldMatrix(true, false);
      _position.setFromMatrixPosition(this.matrixWorld);
      if (this.isCamera || this.isLight) {
        _m1.lookAt(_position, _target, this.up);
      } else {
        _m1.lookAt(_target, _position, this.up);
      }
      this.quaternion.setFromRotationMatrix(_m1);
      if (parent) {
        _m1.extractRotation(parent.matrixWorld);
        _q1.setFromRotationMatrix(_m1);
        this.quaternion.premultiply(_q1.invert());
      }
    }
    add(object) {
      if (arguments.length > 1) {
        for (let i = 0; i < arguments.length; i++) {
          this.add(arguments[i]);
        }
        return this;
      }
      if (object === this) {
        console.error("THREE.Object3D.add: object can't be added as a child of itself.", object);
        return this;
      }
      if (object && object.isObject3D) {
        if (object.parent !== null) {
          object.parent.remove(object);
        }
        object.parent = this;
        this.children.push(object);
        object.dispatchEvent(_addedEvent);
      } else {
        console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.", object);
      }
      return this;
    }
    remove(object) {
      if (arguments.length > 1) {
        for (let i = 0; i < arguments.length; i++) {
          this.remove(arguments[i]);
        }
        return this;
      }
      const index = this.children.indexOf(object);
      if (index !== -1) {
        object.parent = null;
        this.children.splice(index, 1);
        object.dispatchEvent(_removedEvent);
      }
      return this;
    }
    clear() {
      for (let i = 0; i < this.children.length; i++) {
        const object = this.children[i];
        object.parent = null;
        object.dispatchEvent(_removedEvent);
      }
      this.children.length = 0;
      return this;
    }
    attach(object) {
      this.updateWorldMatrix(true, false);
      _m1.copy(this.matrixWorld).invert();
      if (object.parent !== null) {
        object.parent.updateWorldMatrix(true, false);
        _m1.multiply(object.parent.matrixWorld);
      }
      object.applyMatrix4(_m1);
      this.add(object);
      object.updateWorldMatrix(false, true);
      return this;
    }
    getObjectById(id) {
      return this.getObjectByProperty("id", id);
    }
    getObjectByName(name) {
      return this.getObjectByProperty("name", name);
    }
    getObjectByProperty(name, value) {
      if (this[name] === value) {
        return this;
      }
      for (let i = 0, l = this.children.length; i < l; i++) {
        const child = this.children[i];
        const object = child.getObjectByProperty(name, value);
        if (object !== undefined) {
          console.log("Object3D 1");
          return object;
        }
      }
      return undefined;
    }
    getWorldPosition(target) {
      if (target === undefined) {
        console.warn("THREE.Object3D: .getWorldPosition() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      this.updateWorldMatrix(true, false);
      return target.setFromMatrixPosition(this.matrixWorld);
    }
    getWorldQuaternion(target) {
      if (target === undefined) {
        console.warn("THREE.Object3D: .getWorldQuaternion() target is now required");
        target = new module$math$Quaternion.Quaternion;
      }
      this.updateWorldMatrix(true, false);
      this.matrixWorld.decompose(_position, target, _scale);
      return target;
    }
    getWorldScale(target) {
      if (target === undefined) {
        console.warn("THREE.Object3D: .getWorldScale() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      this.updateWorldMatrix(true, false);
      this.matrixWorld.decompose(_position, _quaternion, target);
      return target;
    }
    getWorldDirection(target) {
      if (target === undefined) {
        console.warn("THREE.Object3D: .getWorldDirection() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      this.updateWorldMatrix(true, false);
      const e = this.matrixWorld.elements;
      return target.set(e[8], e[9], e[10]).normalize();
    }
    raycast() {
    }
    traverse(callback) {
      callback(this);
      const children = this.children;
      for (let i = 0, l = children.length; i < l; i++) {
        children[i].traverse(callback);
      }
    }
    traverseVisible(callback) {
      if (this.visible === false) {
        return;
      }
      callback(this);
      const children = this.children;
      for (let i = 0, l = children.length; i < l; i++) {
        children[i].traverseVisible(callback);
      }
    }
    traverseAncestors(callback) {
      const parent = this.parent;
      if (parent !== null) {
        callback(parent);
        parent.traverseAncestors(callback);
      }
    }
    updateMatrix() {
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.matrixWorldNeedsUpdate = true;
    }
    updateMatrixWorld(force) {
      if (this.matrixAutoUpdate) {
        this.updateMatrix();
      }
      if (this.matrixWorldNeedsUpdate || force) {
        if (this.parent === null) {
          this.matrixWorld.copy(this.matrix);
        } else {
          this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        }
        this.matrixWorldNeedsUpdate = false;
        force = true;
      }
      const children = this.children;
      for (let i = 0, l = children.length; i < l; i++) {
        children[i].updateMatrixWorld(force);
      }
    }
    updateWorldMatrix(updateParents, updateChildren) {
      const parent = this.parent;
      if (updateParents === true && parent !== null) {
        parent.updateWorldMatrix(true, false);
      }
      if (this.matrixAutoUpdate) {
        this.updateMatrix();
      }
      if (this.parent === null) {
        this.matrixWorld.copy(this.matrix);
      } else {
        this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
      }
      if (updateChildren === true) {
        const children = this.children;
        for (let i = 0, l = children.length; i < l; i++) {
          children[i].updateWorldMatrix(false, true);
        }
      }
    }
    toJSON(meta) {
      const isRootObject = meta === undefined || typeof meta === "string";
      const output = {};
      if (isRootObject) {
        meta = {geometries:{}, materials:{}, textures:{}, images:{}, shapes:{}, skeletons:{}, animations:{}};
        output.metadata = {version:4.5, type:"Object", generator:"Object3D.toJSON"};
      }
      const object = {};
      object.uuid = this.uuid;
      object.type = this.type;
      if (this.name !== "") {
        object.name = this.name;
      }
      if (this.castShadow === true) {
        object.castShadow = true;
      }
      if (this.receiveShadow === true) {
        object.receiveShadow = true;
      }
      if (this.visible === false) {
        object.visible = false;
      }
      if (this.frustumCulled === false) {
        object.frustumCulled = false;
      }
      if (this.renderOrder !== 0) {
        object.renderOrder = this.renderOrder;
      }
      if (JSON.stringify(this.userData) !== "{}") {
        object.userData = this.userData;
      }
      object.layers = this.layers.mask;
      object.matrix = this.matrix.toArray();
      if (this.matrixAutoUpdate === false) {
        object.matrixAutoUpdate = false;
      }
      if (this.isInstancedMesh) {
        object.type = "InstancedMesh";
        object.count = this.count;
        object.instanceMatrix = this.instanceMatrix.toJSON();
      }
      function serialize(library, element) {
        if (library[element.uuid] === undefined) {
          library[element.uuid] = element.toJSON(meta);
        }
        return element.uuid;
      }
      if (this.isMesh || this.isLine || this.isPoints) {
        object.geometry = serialize(meta.geometries, this.geometry);
        const parameters = this.geometry.parameters;
        if (parameters !== undefined && parameters.shapes !== undefined) {
          console.log("Object3D 2");
          const shapes = parameters.shapes;
          if (Array.isArray(shapes)) {
            for (let i = 0, l = shapes.length; i < l; i++) {
              const shape = shapes[i];
              serialize(meta.shapes, shape);
            }
          } else {
            serialize(meta.shapes, shapes);
          }
        }
      }
      if (this.isSkinnedMesh) {
        object.bindMode = this.bindMode;
        object.bindMatrix = this.bindMatrix.toArray();
        if (this.skeleton !== undefined) {
          console.log("Object3D 2");
          serialize(meta.skeletons, this.skeleton);
          object.skeleton = this.skeleton.uuid;
        }
      }
      if (this.material !== undefined) {
        if (Array.isArray(this.material)) {
          console.log("Object3D 3");
          const uuids = [];
          for (let i = 0, l = this.material.length; i < l; i++) {
            uuids.push(serialize(meta.materials, this.material[i]));
          }
          object.material = uuids;
        } else {
          object.material = serialize(meta.materials, this.material);
        }
      }
      if (this.children.length > 0) {
        object.children = [];
        for (let i = 0; i < this.children.length; i++) {
          object.children.push(this.children[i].toJSON(meta).object);
        }
      }
      if (this.animations.length > 0) {
        object.animations = [];
        for (let i = 0; i < this.animations.length; i++) {
          const animation = this.animations[i];
          object.animations.push(serialize(meta.animations, animation));
        }
      }
      if (isRootObject) {
        const geometries = extractFromCache(meta.geometries);
        const materials = extractFromCache(meta.materials);
        const textures = extractFromCache(meta.textures);
        const images = extractFromCache(meta.images);
        const shapes = extractFromCache(meta.shapes);
        const skeletons = extractFromCache(meta.skeletons);
        const animations = extractFromCache(meta.animations);
        if (geometries.length > 0) {
          output.geometries = geometries;
        }
        if (materials.length > 0) {
          output.materials = materials;
        }
        if (textures.length > 0) {
          output.textures = textures;
        }
        if (images.length > 0) {
          output.images = images;
        }
        if (shapes.length > 0) {
          output.shapes = shapes;
        }
        if (skeletons.length > 0) {
          output.skeletons = skeletons;
        }
        if (animations.length > 0) {
          output.animations = animations;
        }
      }
      output.object = object;
      return output;
      function extractFromCache(cache) {
        const values = [];
        for (const key in cache) {
          const data = cache[key];
          delete data.metadata;
          values.push(data);
        }
        return values;
      }
    }
    clone(recursive) {
      return (new this.constructor).copy(this, recursive);
    }
    copy(source, recursive = true) {
      this.name = source.name;
      this.up.copy(source.up);
      this.position.copy(source.position);
      this.rotation.order = source.rotation.order;
      this.quaternion.copy(source.quaternion);
      this.scale.copy(source.scale);
      this.matrix.copy(source.matrix);
      this.matrixWorld.copy(source.matrixWorld);
      this.matrixAutoUpdate = source.matrixAutoUpdate;
      this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;
      this.layers.mask = source.layers.mask;
      this.visible = source.visible;
      this.castShadow = source.castShadow;
      this.receiveShadow = source.receiveShadow;
      this.frustumCulled = source.frustumCulled;
      this.renderOrder = source.renderOrder;
      this.userData = JSON.parse(JSON.stringify(source.userData));
      if (recursive === true) {
        for (let i = 0; i < source.children.length; i++) {
          const child = source.children[i];
          this.add(child.clone());
        }
      }
      return this;
    }
  }
}, "core/Object3D.js", ["math/Quaternion.js", "math/Vector3.js", "math/Matrix4.js", "core/EventDispatcher.js", "math/Euler.js", "core/Layers.js", "math/Matrix3.js", "math/MathUtils.js"]);

//cameras/Camera.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Camera:{enumerable:true, get:function() {
    return Camera;
  }}});
  var module$math$Matrix4 = $$require("math/Matrix4.js");
  var module$core$Object3D = $$require("core/Object3D.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  class Camera extends module$core$Object3D.Object3D {
    constructor() {
      super();
      this.type = "Camera";
      this.matrixWorldInverse = new module$math$Matrix4.Matrix4;
      this.projectionMatrix = new module$math$Matrix4.Matrix4;
      this.projectionMatrixInverse = new module$math$Matrix4.Matrix4;
      this.isCamera = true;
    }
    copy(source, recursive) {
      module$core$Object3D.Object3D.prototype.copy.call(this, source, recursive);
      this.matrixWorldInverse.copy(source.matrixWorldInverse);
      this.projectionMatrix.copy(source.projectionMatrix);
      this.projectionMatrixInverse.copy(source.projectionMatrixInverse);
      return this;
    }
    getWorldDirection(target) {
      if (target === undefined) {
        console.warn("THREE.Camera: .getWorldDirection() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      this.updateWorldMatrix(true, false);
      const e = this.matrixWorld.elements;
      return target.set(-e[8], -e[9], -e[10]).normalize();
    }
    updateMatrixWorld(force) {
      module$core$Object3D.Object3D.prototype.updateMatrixWorld.call(this, force);
      this.matrixWorldInverse.copy(this.matrixWorld).invert();
    }
    updateWorldMatrix(updateParents, updateChildren) {
      module$core$Object3D.Object3D.prototype.updateWorldMatrix.call(this, updateParents, updateChildren);
      this.matrixWorldInverse.copy(this.matrixWorld).invert();
    }
    clone() {
      return (new this.constructor).copy(this);
    }
  }
}, "cameras/Camera.js", ["math/Matrix4.js", "core/Object3D.js", "math/Vector3.js"]);

//math/Vector4.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Vector4:{enumerable:true, get:function() {
    return Vector4;
  }}});
  class Vector4 {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
    get width() {
      return this.z;
    }
    set width(value) {
      this.z = value;
    }
    get height() {
      return this.w;
    }
    set height(value) {
      this.w = value;
    }
    set(x, y, z, w) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
      return this;
    }
    setScalar(scalar) {
      this.x = scalar;
      this.y = scalar;
      this.z = scalar;
      this.w = scalar;
      return this;
    }
    setX(x) {
      this.x = x;
      return this;
    }
    setY(y) {
      this.y = y;
      return this;
    }
    setZ(z) {
      this.z = z;
      return this;
    }
    setW(w) {
      this.w = w;
      return this;
    }
    setComponent(index, value) {
      switch(index) {
        case 0:
          this.x = value;
          break;
        case 1:
          this.y = value;
          break;
        case 2:
          this.z = value;
          break;
        case 3:
          this.w = value;
          break;
        default:
          throw new Error("index is out of range: " + index);
      }
      return this;
    }
    getComponent(index) {
      switch(index) {
        case 0:
          return this.x;
        case 1:
          return this.y;
        case 2:
          return this.z;
        case 3:
          return this.w;
        default:
          throw new Error("index is out of range: " + index);
      }
    }
    clone() {
      return new this.constructor(this.x, this.y, this.z, this.w);
    }
    copy(v) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      this.w = v.w !== undefined ? v.w : 1;
      return this;
    }
    add(v, w) {
      if (w !== undefined) {
        console.warn("THREE.Vector4: .add() now only accepts one argument. Use .addVectors( a, b ) instead.");
        return this.addVectors(v, w);
      }
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      this.w += v.w;
      return this;
    }
    addScalar(s) {
      this.x += s;
      this.y += s;
      this.z += s;
      this.w += s;
      return this;
    }
    addVectors(a, b) {
      this.x = a.x + b.x;
      this.y = a.y + b.y;
      this.z = a.z + b.z;
      this.w = a.w + b.w;
      return this;
    }
    addScaledVector(v, s) {
      this.x += v.x * s;
      this.y += v.y * s;
      this.z += v.z * s;
      this.w += v.w * s;
      return this;
    }
    sub(v, w) {
      if (w !== undefined) {
        console.warn("THREE.Vector4: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.");
        return this.subVectors(v, w);
      }
      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
      this.w -= v.w;
      return this;
    }
    subScalar(s) {
      this.x -= s;
      this.y -= s;
      this.z -= s;
      this.w -= s;
      return this;
    }
    subVectors(a, b) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      this.z = a.z - b.z;
      this.w = a.w - b.w;
      return this;
    }
    multiply(v) {
      this.x *= v.x;
      this.y *= v.y;
      this.z *= v.z;
      this.w *= v.w;
      return this;
    }
    multiplyScalar(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      this.w *= scalar;
      return this;
    }
    applyMatrix4(m) {
      const x = this.x, y = this.y, z = this.z, w = this.w;
      const e = m.elements;
      this.x = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
      this.y = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
      this.z = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
      this.w = e[3] * x + e[7] * y + e[11] * z + e[15] * w;
      return this;
    }
    divideScalar(scalar) {
      return this.multiplyScalar(1 / scalar);
    }
    setAxisAngleFromQuaternion(q) {
      this.w = 2 * Math.acos(q.w);
      const s = Math.sqrt(1 - q.w * q.w);
      if (s < 0.0001) {
        this.x = 1;
        this.y = 0;
        this.z = 0;
      } else {
        this.x = q.x / s;
        this.y = q.y / s;
        this.z = q.z / s;
      }
      return this;
    }
    setAxisAngleFromRotationMatrix(m) {
      let angle, x, y, z;
      const epsilon = 0.01, epsilon2 = 0.1, te = m.elements, m11 = te[0], m12 = te[4], m13 = te[8], m21 = te[1], m22 = te[5], m23 = te[9], m31 = te[2], m32 = te[6], m33 = te[10];
      if (Math.abs(m12 - m21) < epsilon && Math.abs(m13 - m31) < epsilon && Math.abs(m23 - m32) < epsilon) {
        if (Math.abs(m12 + m21) < epsilon2 && Math.abs(m13 + m31) < epsilon2 && Math.abs(m23 + m32) < epsilon2 && Math.abs(m11 + m22 + m33 - 3) < epsilon2) {
          this.set(1, 0, 0, 0);
          return this;
        }
        angle = Math.PI;
        const xx = (m11 + 1) / 2;
        const yy = (m22 + 1) / 2;
        const zz = (m33 + 1) / 2;
        const xy = (m12 + m21) / 4;
        const xz = (m13 + m31) / 4;
        const yz = (m23 + m32) / 4;
        if (xx > yy && xx > zz) {
          if (xx < epsilon) {
            x = 0;
            y = 0.707106781;
            z = 0.707106781;
          } else {
            x = Math.sqrt(xx);
            y = xy / x;
            z = xz / x;
          }
        } else {
          if (yy > zz) {
            if (yy < epsilon) {
              x = 0.707106781;
              y = 0;
              z = 0.707106781;
            } else {
              y = Math.sqrt(yy);
              x = xy / y;
              z = yz / y;
            }
          } else {
            if (zz < epsilon) {
              x = 0.707106781;
              y = 0.707106781;
              z = 0;
            } else {
              z = Math.sqrt(zz);
              x = xz / z;
              y = yz / z;
            }
          }
        }
        this.set(x, y, z, angle);
        return this;
      }
      let s = Math.sqrt((m32 - m23) * (m32 - m23) + (m13 - m31) * (m13 - m31) + (m21 - m12) * (m21 - m12));
      if (Math.abs(s) < 0.001) {
        s = 1;
      }
      this.x = (m32 - m23) / s;
      this.y = (m13 - m31) / s;
      this.z = (m21 - m12) / s;
      this.w = Math.acos((m11 + m22 + m33 - 1) / 2);
      return this;
    }
    min(v) {
      this.x = Math.min(this.x, v.x);
      this.y = Math.min(this.y, v.y);
      this.z = Math.min(this.z, v.z);
      this.w = Math.min(this.w, v.w);
      return this;
    }
    max(v) {
      this.x = Math.max(this.x, v.x);
      this.y = Math.max(this.y, v.y);
      this.z = Math.max(this.z, v.z);
      this.w = Math.max(this.w, v.w);
      return this;
    }
    clamp(min, max) {
      this.x = Math.max(min.x, Math.min(max.x, this.x));
      this.y = Math.max(min.y, Math.min(max.y, this.y));
      this.z = Math.max(min.z, Math.min(max.z, this.z));
      this.w = Math.max(min.w, Math.min(max.w, this.w));
      return this;
    }
    clampScalar(minVal, maxVal) {
      this.x = Math.max(minVal, Math.min(maxVal, this.x));
      this.y = Math.max(minVal, Math.min(maxVal, this.y));
      this.z = Math.max(minVal, Math.min(maxVal, this.z));
      this.w = Math.max(minVal, Math.min(maxVal, this.w));
      return this;
    }
    clampLength(min, max) {
      const length = this.length();
      return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
    }
    floor() {
      this.x = Math.floor(this.x);
      this.y = Math.floor(this.y);
      this.z = Math.floor(this.z);
      this.w = Math.floor(this.w);
      return this;
    }
    ceil() {
      this.x = Math.ceil(this.x);
      this.y = Math.ceil(this.y);
      this.z = Math.ceil(this.z);
      this.w = Math.ceil(this.w);
      return this;
    }
    round() {
      this.x = Math.round(this.x);
      this.y = Math.round(this.y);
      this.z = Math.round(this.z);
      this.w = Math.round(this.w);
      return this;
    }
    roundToZero() {
      this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x);
      this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y);
      this.z = this.z < 0 ? Math.ceil(this.z) : Math.floor(this.z);
      this.w = this.w < 0 ? Math.ceil(this.w) : Math.floor(this.w);
      return this;
    }
    negate() {
      this.x = -this.x;
      this.y = -this.y;
      this.z = -this.z;
      this.w = -this.w;
      return this;
    }
    dot(v) {
      return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }
    lengthSq() {
      return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }
    manhattanLength() {
      return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
    }
    normalize() {
      return this.divideScalar(this.length() || 1);
    }
    setLength(length) {
      return this.normalize().multiplyScalar(length);
    }
    lerp(v, alpha) {
      this.x += (v.x - this.x) * alpha;
      this.y += (v.y - this.y) * alpha;
      this.z += (v.z - this.z) * alpha;
      this.w += (v.w - this.w) * alpha;
      return this;
    }
    lerpVectors(v1, v2, alpha) {
      this.x = v1.x + (v2.x - v1.x) * alpha;
      this.y = v1.y + (v2.y - v1.y) * alpha;
      this.z = v1.z + (v2.z - v1.z) * alpha;
      this.w = v1.w + (v2.w - v1.w) * alpha;
      return this;
    }
    equals(v) {
      return v.x === this.x && v.y === this.y && v.z === this.z && v.w === this.w;
    }
    fromArray(array, offset = 0) {
      this.x = array[offset];
      this.y = array[offset + 1];
      this.z = array[offset + 2];
      this.w = array[offset + 3];
      return this;
    }
    toArray(array = [], offset = 0) {
      array[offset] = this.x;
      array[offset + 1] = this.y;
      array[offset + 2] = this.z;
      array[offset + 3] = this.w;
      return array;
    }
    fromBufferAttribute(attribute, index, offset) {
      if (offset !== undefined) {
        console.warn("THREE.Vector4: offset has been removed from .fromBufferAttribute().");
      }
      this.x = attribute.getX(index);
      this.y = attribute.getY(index);
      this.z = attribute.getZ(index);
      this.w = attribute.getW(index);
      return this;
    }
    random() {
      this.x = Math.random();
      this.y = Math.random();
      this.z = Math.random();
      this.w = Math.random();
      return this;
    }
  }
  Vector4.prototype.isVector4 = true;
}, "math/Vector4.js", []);

//cameras/PerspectiveCamera.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {PerspectiveCamera:{enumerable:true, get:function() {
    return PerspectiveCamera;
  }}});
  var module$cameras$Camera = $$require("cameras/Camera.js");
  var module$core$Object3D = $$require("core/Object3D.js");
  var module$math$MathUtils = $$require("math/MathUtils.js");
  var module$math$Vector4 = $$require("math/Vector4.js");
  class PerspectiveCamera extends module$cameras$Camera.Camera {
    constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
      super();
      this.type = "PerspectiveCamera";
      this.fov = fov;
      this.zoom = 1;
      this.near = near;
      this.far = far;
      this.focus = 10;
      this.aspect = aspect;
      this.view = null;
      this.filmGauge = 35;
      this.filmOffset = 0;
      this.updateProjectionMatrix();
      this.isPerspectiveCamera = true;
      this.viewport;
    }
    copy(source, recursive) {
      module$cameras$Camera.Camera.prototype.copy.call(this, source, recursive);
      this.fov = source.fov;
      this.zoom = source.zoom;
      this.near = source.near;
      this.far = source.far;
      this.focus = source.focus;
      this.aspect = source.aspect;
      this.view = source.view === null ? null : Object.assign({}, source.view);
      this.filmGauge = source.filmGauge;
      this.filmOffset = source.filmOffset;
      return this;
    }
    setFocalLength(focalLength) {
      const vExtentSlope = 0.5 * this.getFilmHeight() / focalLength;
      this.fov = module$math$MathUtils.MathUtils.RAD2DEG * 2 * Math.atan(vExtentSlope);
      this.updateProjectionMatrix();
    }
    getFocalLength() {
      const vExtentSlope = Math.tan(module$math$MathUtils.MathUtils.DEG2RAD * 0.5 * this.fov);
      return 0.5 * this.getFilmHeight() / vExtentSlope;
    }
    getEffectiveFOV() {
      return module$math$MathUtils.MathUtils.RAD2DEG * 2 * Math.atan(Math.tan(module$math$MathUtils.MathUtils.DEG2RAD * 0.5 * this.fov) / this.zoom);
    }
    getFilmWidth() {
      return this.filmGauge * Math.min(this.aspect, 1);
    }
    getFilmHeight() {
      return this.filmGauge / Math.max(this.aspect, 1);
    }
    setViewOffset(fullWidth, fullHeight, x, y, width, height) {
      this.aspect = fullWidth / fullHeight;
      if (this.view === null) {
        this.view = {enabled:true, fullWidth:1, fullHeight:1, offsetX:0, offsetY:0, width:1, height:1};
      }
      this.view.enabled = true;
      this.view.fullWidth = fullWidth;
      this.view.fullHeight = fullHeight;
      this.view.offsetX = x;
      this.view.offsetY = y;
      this.view.width = width;
      this.view.height = height;
      this.updateProjectionMatrix();
    }
    clearViewOffset() {
      if (this.view !== null) {
        this.view.enabled = false;
      }
      this.updateProjectionMatrix();
    }
    updateProjectionMatrix() {
      const near = this.near;
      let top = near * Math.tan(module$math$MathUtils.MathUtils.DEG2RAD * 0.5 * this.fov) / this.zoom;
      let height = 2 * top;
      let width = this.aspect * height;
      let left = -.5 * width;
      const view = this.view;
      if (this.view !== null && this.view.enabled) {
        const fullWidth = view.fullWidth, fullHeight = view.fullHeight;
        left += view.offsetX * width / fullWidth;
        top -= view.offsetY * height / fullHeight;
        width *= view.width / fullWidth;
        height *= view.height / fullHeight;
      }
      const skew = this.filmOffset;
      if (skew !== 0) {
        left += near * skew / this.getFilmWidth();
      }
      this.projectionMatrix.makePerspective(left, left + width, top, top - height, near, this.far);
      this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
    }
    toJSON(meta) {
      const data = module$core$Object3D.Object3D.prototype.toJSON.call(this, meta);
      data.object.fov = this.fov;
      data.object.zoom = this.zoom;
      data.object.near = this.near;
      data.object.far = this.far;
      data.object.focus = this.focus;
      data.object.aspect = this.aspect;
      if (this.view !== null) {
        data.object.view = Object.assign({}, this.view);
      }
      data.object.filmGauge = this.filmGauge;
      data.object.filmOffset = this.filmOffset;
      return data;
    }
  }
}, "cameras/PerspectiveCamera.js", ["cameras/Camera.js", "core/Object3D.js", "math/MathUtils.js", "math/Vector4.js"]);

//constants.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {ACESFilmicToneMapping:{enumerable:true, get:function() {
    return ACESFilmicToneMapping;
  }}, AddEquation:{enumerable:true, get:function() {
    return AddEquation;
  }}, AddOperation:{enumerable:true, get:function() {
    return AddOperation;
  }}, AdditiveAnimationBlendMode:{enumerable:true, get:function() {
    return AdditiveAnimationBlendMode;
  }}, AdditiveBlending:{enumerable:true, get:function() {
    return AdditiveBlending;
  }}, AlphaFormat:{enumerable:true, get:function() {
    return AlphaFormat;
  }}, AlwaysDepth:{enumerable:true, get:function() {
    return AlwaysDepth;
  }}, AlwaysStencilFunc:{enumerable:true, get:function() {
    return AlwaysStencilFunc;
  }}, BackSide:{enumerable:true, get:function() {
    return BackSide;
  }}, BasicDepthPacking:{enumerable:true, get:function() {
    return BasicDepthPacking;
  }}, BasicShadowMap:{enumerable:true, get:function() {
    return BasicShadowMap;
  }}, ByteType:{enumerable:true, get:function() {
    return ByteType;
  }}, CineonToneMapping:{enumerable:true, get:function() {
    return CineonToneMapping;
  }}, ClampToEdgeWrapping:{enumerable:true, get:function() {
    return ClampToEdgeWrapping;
  }}, CubeReflectionMapping:{enumerable:true, get:function() {
    return CubeReflectionMapping;
  }}, CubeRefractionMapping:{enumerable:true, get:function() {
    return CubeRefractionMapping;
  }}, CubeUVReflectionMapping:{enumerable:true, get:function() {
    return CubeUVReflectionMapping;
  }}, CubeUVRefractionMapping:{enumerable:true, get:function() {
    return CubeUVRefractionMapping;
  }}, CullFaceBack:{enumerable:true, get:function() {
    return CullFaceBack;
  }}, CullFaceFront:{enumerable:true, get:function() {
    return CullFaceFront;
  }}, CullFaceFrontBack:{enumerable:true, get:function() {
    return CullFaceFrontBack;
  }}, CullFaceNone:{enumerable:true, get:function() {
    return CullFaceNone;
  }}, CustomBlending:{enumerable:true, get:function() {
    return CustomBlending;
  }}, CustomToneMapping:{enumerable:true, get:function() {
    return CustomToneMapping;
  }}, DecrementStencilOp:{enumerable:true, get:function() {
    return DecrementStencilOp;
  }}, DecrementWrapStencilOp:{enumerable:true, get:function() {
    return DecrementWrapStencilOp;
  }}, DepthFormat:{enumerable:true, get:function() {
    return DepthFormat;
  }}, DepthStencilFormat:{enumerable:true, get:function() {
    return DepthStencilFormat;
  }}, DoubleSide:{enumerable:true, get:function() {
    return DoubleSide;
  }}, DstAlphaFactor:{enumerable:true, get:function() {
    return DstAlphaFactor;
  }}, DstColorFactor:{enumerable:true, get:function() {
    return DstColorFactor;
  }}, DynamicCopyUsage:{enumerable:true, get:function() {
    return DynamicCopyUsage;
  }}, DynamicDrawUsage:{enumerable:true, get:function() {
    return DynamicDrawUsage;
  }}, DynamicReadUsage:{enumerable:true, get:function() {
    return DynamicReadUsage;
  }}, EqualDepth:{enumerable:true, get:function() {
    return EqualDepth;
  }}, EqualStencilFunc:{enumerable:true, get:function() {
    return EqualStencilFunc;
  }}, EquirectangularReflectionMapping:{enumerable:true, get:function() {
    return EquirectangularReflectionMapping;
  }}, EquirectangularRefractionMapping:{enumerable:true, get:function() {
    return EquirectangularRefractionMapping;
  }}, FlatShading:{enumerable:true, get:function() {
    return FlatShading;
  }}, FloatType:{enumerable:true, get:function() {
    return FloatType;
  }}, FrontSide:{enumerable:true, get:function() {
    return FrontSide;
  }}, GLSL1:{enumerable:true, get:function() {
    return GLSL1;
  }}, GLSL3:{enumerable:true, get:function() {
    return GLSL3;
  }}, GammaEncoding:{enumerable:true, get:function() {
    return GammaEncoding;
  }}, GreaterDepth:{enumerable:true, get:function() {
    return GreaterDepth;
  }}, GreaterEqualDepth:{enumerable:true, get:function() {
    return GreaterEqualDepth;
  }}, GreaterEqualStencilFunc:{enumerable:true, get:function() {
    return GreaterEqualStencilFunc;
  }}, GreaterStencilFunc:{enumerable:true, get:function() {
    return GreaterStencilFunc;
  }}, HalfFloatType:{enumerable:true, get:function() {
    return HalfFloatType;
  }}, IncrementStencilOp:{enumerable:true, get:function() {
    return IncrementStencilOp;
  }}, IncrementWrapStencilOp:{enumerable:true, get:function() {
    return IncrementWrapStencilOp;
  }}, IntType:{enumerable:true, get:function() {
    return IntType;
  }}, InterpolateDiscrete:{enumerable:true, get:function() {
    return InterpolateDiscrete;
  }}, InterpolateLinear:{enumerable:true, get:function() {
    return InterpolateLinear;
  }}, InterpolateSmooth:{enumerable:true, get:function() {
    return InterpolateSmooth;
  }}, InvertStencilOp:{enumerable:true, get:function() {
    return InvertStencilOp;
  }}, KeepStencilOp:{enumerable:true, get:function() {
    return KeepStencilOp;
  }}, LessDepth:{enumerable:true, get:function() {
    return LessDepth;
  }}, LessEqualDepth:{enumerable:true, get:function() {
    return LessEqualDepth;
  }}, LessEqualStencilFunc:{enumerable:true, get:function() {
    return LessEqualStencilFunc;
  }}, LessStencilFunc:{enumerable:true, get:function() {
    return LessStencilFunc;
  }}, LinearEncoding:{enumerable:true, get:function() {
    return LinearEncoding;
  }}, LinearFilter:{enumerable:true, get:function() {
    return LinearFilter;
  }}, LinearMipMapLinearFilter:{enumerable:true, get:function() {
    return LinearMipMapLinearFilter;
  }}, LinearMipMapNearestFilter:{enumerable:true, get:function() {
    return LinearMipMapNearestFilter;
  }}, LinearMipmapLinearFilter:{enumerable:true, get:function() {
    return LinearMipmapLinearFilter;
  }}, LinearMipmapNearestFilter:{enumerable:true, get:function() {
    return LinearMipmapNearestFilter;
  }}, LinearToneMapping:{enumerable:true, get:function() {
    return LinearToneMapping;
  }}, LogLuvEncoding:{enumerable:true, get:function() {
    return LogLuvEncoding;
  }}, LoopOnce:{enumerable:true, get:function() {
    return LoopOnce;
  }}, LoopPingPong:{enumerable:true, get:function() {
    return LoopPingPong;
  }}, LoopRepeat:{enumerable:true, get:function() {
    return LoopRepeat;
  }}, LuminanceAlphaFormat:{enumerable:true, get:function() {
    return LuminanceAlphaFormat;
  }}, LuminanceFormat:{enumerable:true, get:function() {
    return LuminanceFormat;
  }}, MOUSE:{enumerable:true, get:function() {
    return MOUSE;
  }}, MaxEquation:{enumerable:true, get:function() {
    return MaxEquation;
  }}, MinEquation:{enumerable:true, get:function() {
    return MinEquation;
  }}, MirroredRepeatWrapping:{enumerable:true, get:function() {
    return MirroredRepeatWrapping;
  }}, MixOperation:{enumerable:true, get:function() {
    return MixOperation;
  }}, MultiplyBlending:{enumerable:true, get:function() {
    return MultiplyBlending;
  }}, MultiplyOperation:{enumerable:true, get:function() {
    return MultiplyOperation;
  }}, NearestFilter:{enumerable:true, get:function() {
    return NearestFilter;
  }}, NearestMipMapLinearFilter:{enumerable:true, get:function() {
    return NearestMipMapLinearFilter;
  }}, NearestMipMapNearestFilter:{enumerable:true, get:function() {
    return NearestMipMapNearestFilter;
  }}, NearestMipmapLinearFilter:{enumerable:true, get:function() {
    return NearestMipmapLinearFilter;
  }}, NearestMipmapNearestFilter:{enumerable:true, get:function() {
    return NearestMipmapNearestFilter;
  }}, NeverDepth:{enumerable:true, get:function() {
    return NeverDepth;
  }}, NeverStencilFunc:{enumerable:true, get:function() {
    return NeverStencilFunc;
  }}, NoBlending:{enumerable:true, get:function() {
    return NoBlending;
  }}, NoToneMapping:{enumerable:true, get:function() {
    return NoToneMapping;
  }}, NormalAnimationBlendMode:{enumerable:true, get:function() {
    return NormalAnimationBlendMode;
  }}, NormalBlending:{enumerable:true, get:function() {
    return NormalBlending;
  }}, NotEqualDepth:{enumerable:true, get:function() {
    return NotEqualDepth;
  }}, NotEqualStencilFunc:{enumerable:true, get:function() {
    return NotEqualStencilFunc;
  }}, ObjectSpaceNormalMap:{enumerable:true, get:function() {
    return ObjectSpaceNormalMap;
  }}, OneFactor:{enumerable:true, get:function() {
    return OneFactor;
  }}, OneMinusDstAlphaFactor:{enumerable:true, get:function() {
    return OneMinusDstAlphaFactor;
  }}, OneMinusDstColorFactor:{enumerable:true, get:function() {
    return OneMinusDstColorFactor;
  }}, OneMinusSrcAlphaFactor:{enumerable:true, get:function() {
    return OneMinusSrcAlphaFactor;
  }}, OneMinusSrcColorFactor:{enumerable:true, get:function() {
    return OneMinusSrcColorFactor;
  }}, PCFShadowMap:{enumerable:true, get:function() {
    return PCFShadowMap;
  }}, PCFSoftShadowMap:{enumerable:true, get:function() {
    return PCFSoftShadowMap;
  }}, REVISION:{enumerable:true, get:function() {
    return REVISION;
  }}, RGBADepthPacking:{enumerable:true, get:function() {
    return RGBADepthPacking;
  }}, RGBAFormat:{enumerable:true, get:function() {
    return RGBAFormat;
  }}, RGBAIntegerFormat:{enumerable:true, get:function() {
    return RGBAIntegerFormat;
  }}, RGBA_ASTC_10x10_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_10x10_Format;
  }}, RGBA_ASTC_10x5_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_10x5_Format;
  }}, RGBA_ASTC_10x6_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_10x6_Format;
  }}, RGBA_ASTC_10x8_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_10x8_Format;
  }}, RGBA_ASTC_12x10_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_12x10_Format;
  }}, RGBA_ASTC_12x12_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_12x12_Format;
  }}, RGBA_ASTC_4x4_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_4x4_Format;
  }}, RGBA_ASTC_5x4_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_5x4_Format;
  }}, RGBA_ASTC_5x5_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_5x5_Format;
  }}, RGBA_ASTC_6x5_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_6x5_Format;
  }}, RGBA_ASTC_6x6_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_6x6_Format;
  }}, RGBA_ASTC_8x5_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_8x5_Format;
  }}, RGBA_ASTC_8x6_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_8x6_Format;
  }}, RGBA_ASTC_8x8_Format:{enumerable:true, get:function() {
    return RGBA_ASTC_8x8_Format;
  }}, RGBA_BPTC_Format:{enumerable:true, get:function() {
    return RGBA_BPTC_Format;
  }}, RGBA_ETC2_EAC_Format:{enumerable:true, get:function() {
    return RGBA_ETC2_EAC_Format;
  }}, RGBA_PVRTC_2BPPV1_Format:{enumerable:true, get:function() {
    return RGBA_PVRTC_2BPPV1_Format;
  }}, RGBA_PVRTC_4BPPV1_Format:{enumerable:true, get:function() {
    return RGBA_PVRTC_4BPPV1_Format;
  }}, RGBA_S3TC_DXT1_Format:{enumerable:true, get:function() {
    return RGBA_S3TC_DXT1_Format;
  }}, RGBA_S3TC_DXT3_Format:{enumerable:true, get:function() {
    return RGBA_S3TC_DXT3_Format;
  }}, RGBA_S3TC_DXT5_Format:{enumerable:true, get:function() {
    return RGBA_S3TC_DXT5_Format;
  }}, RGBDEncoding:{enumerable:true, get:function() {
    return RGBDEncoding;
  }}, RGBEEncoding:{enumerable:true, get:function() {
    return RGBEEncoding;
  }}, RGBEFormat:{enumerable:true, get:function() {
    return RGBEFormat;
  }}, RGBFormat:{enumerable:true, get:function() {
    return RGBFormat;
  }}, RGBIntegerFormat:{enumerable:true, get:function() {
    return RGBIntegerFormat;
  }}, RGBM16Encoding:{enumerable:true, get:function() {
    return RGBM16Encoding;
  }}, RGBM7Encoding:{enumerable:true, get:function() {
    return RGBM7Encoding;
  }}, RGB_ETC1_Format:{enumerable:true, get:function() {
    return RGB_ETC1_Format;
  }}, RGB_ETC2_Format:{enumerable:true, get:function() {
    return RGB_ETC2_Format;
  }}, RGB_PVRTC_2BPPV1_Format:{enumerable:true, get:function() {
    return RGB_PVRTC_2BPPV1_Format;
  }}, RGB_PVRTC_4BPPV1_Format:{enumerable:true, get:function() {
    return RGB_PVRTC_4BPPV1_Format;
  }}, RGB_S3TC_DXT1_Format:{enumerable:true, get:function() {
    return RGB_S3TC_DXT1_Format;
  }}, RGFormat:{enumerable:true, get:function() {
    return RGFormat;
  }}, RGIntegerFormat:{enumerable:true, get:function() {
    return RGIntegerFormat;
  }}, RedFormat:{enumerable:true, get:function() {
    return RedFormat;
  }}, RedIntegerFormat:{enumerable:true, get:function() {
    return RedIntegerFormat;
  }}, ReinhardToneMapping:{enumerable:true, get:function() {
    return ReinhardToneMapping;
  }}, RepeatWrapping:{enumerable:true, get:function() {
    return RepeatWrapping;
  }}, ReplaceStencilOp:{enumerable:true, get:function() {
    return ReplaceStencilOp;
  }}, ReverseSubtractEquation:{enumerable:true, get:function() {
    return ReverseSubtractEquation;
  }}, SRGB8_ALPHA8_ASTC_10x10_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_10x10_Format;
  }}, SRGB8_ALPHA8_ASTC_10x5_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_10x5_Format;
  }}, SRGB8_ALPHA8_ASTC_10x6_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_10x6_Format;
  }}, SRGB8_ALPHA8_ASTC_10x8_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_10x8_Format;
  }}, SRGB8_ALPHA8_ASTC_12x10_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_12x10_Format;
  }}, SRGB8_ALPHA8_ASTC_12x12_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_12x12_Format;
  }}, SRGB8_ALPHA8_ASTC_4x4_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_4x4_Format;
  }}, SRGB8_ALPHA8_ASTC_5x4_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_5x4_Format;
  }}, SRGB8_ALPHA8_ASTC_5x5_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_5x5_Format;
  }}, SRGB8_ALPHA8_ASTC_6x5_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_6x5_Format;
  }}, SRGB8_ALPHA8_ASTC_6x6_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_6x6_Format;
  }}, SRGB8_ALPHA8_ASTC_8x5_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_8x5_Format;
  }}, SRGB8_ALPHA8_ASTC_8x6_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_8x6_Format;
  }}, SRGB8_ALPHA8_ASTC_8x8_Format:{enumerable:true, get:function() {
    return SRGB8_ALPHA8_ASTC_8x8_Format;
  }}, ShortType:{enumerable:true, get:function() {
    return ShortType;
  }}, SmoothShading:{enumerable:true, get:function() {
    return SmoothShading;
  }}, SrcAlphaFactor:{enumerable:true, get:function() {
    return SrcAlphaFactor;
  }}, SrcAlphaSaturateFactor:{enumerable:true, get:function() {
    return SrcAlphaSaturateFactor;
  }}, SrcColorFactor:{enumerable:true, get:function() {
    return SrcColorFactor;
  }}, StaticCopyUsage:{enumerable:true, get:function() {
    return StaticCopyUsage;
  }}, StaticDrawUsage:{enumerable:true, get:function() {
    return StaticDrawUsage;
  }}, StaticReadUsage:{enumerable:true, get:function() {
    return StaticReadUsage;
  }}, StreamCopyUsage:{enumerable:true, get:function() {
    return StreamCopyUsage;
  }}, StreamDrawUsage:{enumerable:true, get:function() {
    return StreamDrawUsage;
  }}, StreamReadUsage:{enumerable:true, get:function() {
    return StreamReadUsage;
  }}, SubtractEquation:{enumerable:true, get:function() {
    return SubtractEquation;
  }}, SubtractiveBlending:{enumerable:true, get:function() {
    return SubtractiveBlending;
  }}, TOUCH:{enumerable:true, get:function() {
    return TOUCH;
  }}, TangentSpaceNormalMap:{enumerable:true, get:function() {
    return TangentSpaceNormalMap;
  }}, TriangleFanDrawMode:{enumerable:true, get:function() {
    return TriangleFanDrawMode;
  }}, TriangleStripDrawMode:{enumerable:true, get:function() {
    return TriangleStripDrawMode;
  }}, TrianglesDrawMode:{enumerable:true, get:function() {
    return TrianglesDrawMode;
  }}, UVMapping:{enumerable:true, get:function() {
    return UVMapping;
  }}, UnsignedByteType:{enumerable:true, get:function() {
    return UnsignedByteType;
  }}, UnsignedInt248Type:{enumerable:true, get:function() {
    return UnsignedInt248Type;
  }}, UnsignedIntType:{enumerable:true, get:function() {
    return UnsignedIntType;
  }}, UnsignedShort4444Type:{enumerable:true, get:function() {
    return UnsignedShort4444Type;
  }}, UnsignedShort5551Type:{enumerable:true, get:function() {
    return UnsignedShort5551Type;
  }}, UnsignedShort565Type:{enumerable:true, get:function() {
    return UnsignedShort565Type;
  }}, UnsignedShortType:{enumerable:true, get:function() {
    return UnsignedShortType;
  }}, VSMShadowMap:{enumerable:true, get:function() {
    return VSMShadowMap;
  }}, WrapAroundEnding:{enumerable:true, get:function() {
    return WrapAroundEnding;
  }}, ZeroCurvatureEnding:{enumerable:true, get:function() {
    return ZeroCurvatureEnding;
  }}, ZeroFactor:{enumerable:true, get:function() {
    return ZeroFactor;
  }}, ZeroSlopeEnding:{enumerable:true, get:function() {
    return ZeroSlopeEnding;
  }}, ZeroStencilOp:{enumerable:true, get:function() {
    return ZeroStencilOp;
  }}, sRGBEncoding:{enumerable:true, get:function() {
    return sRGBEncoding;
  }}});
  const REVISION = "126";
  const MOUSE = {LEFT:0, MIDDLE:1, RIGHT:2, ROTATE:0, DOLLY:1, PAN:2};
  const TOUCH = {ROTATE:0, PAN:1, DOLLY_PAN:2, DOLLY_ROTATE:3};
  const CullFaceNone = 0;
  const CullFaceBack = 1;
  const CullFaceFront = 2;
  const CullFaceFrontBack = 3;
  const BasicShadowMap = 0;
  const PCFShadowMap = 1;
  const PCFSoftShadowMap = 2;
  const VSMShadowMap = 3;
  const FrontSide = 0;
  const BackSide = 1;
  const DoubleSide = 2;
  const FlatShading = 1;
  const SmoothShading = 2;
  const NoBlending = 0;
  const NormalBlending = 1;
  const AdditiveBlending = 2;
  const SubtractiveBlending = 3;
  const MultiplyBlending = 4;
  const CustomBlending = 5;
  const AddEquation = 100;
  const SubtractEquation = 101;
  const ReverseSubtractEquation = 102;
  const MinEquation = 103;
  const MaxEquation = 104;
  const ZeroFactor = 200;
  const OneFactor = 201;
  const SrcColorFactor = 202;
  const OneMinusSrcColorFactor = 203;
  const SrcAlphaFactor = 204;
  const OneMinusSrcAlphaFactor = 205;
  const DstAlphaFactor = 206;
  const OneMinusDstAlphaFactor = 207;
  const DstColorFactor = 208;
  const OneMinusDstColorFactor = 209;
  const SrcAlphaSaturateFactor = 210;
  const NeverDepth = 0;
  const AlwaysDepth = 1;
  const LessDepth = 2;
  const LessEqualDepth = 3;
  const EqualDepth = 4;
  const GreaterEqualDepth = 5;
  const GreaterDepth = 6;
  const NotEqualDepth = 7;
  const MultiplyOperation = 0;
  const MixOperation = 1;
  const AddOperation = 2;
  const NoToneMapping = 0;
  const LinearToneMapping = 1;
  const ReinhardToneMapping = 2;
  const CineonToneMapping = 3;
  const ACESFilmicToneMapping = 4;
  const CustomToneMapping = 5;
  const UVMapping = 300;
  const CubeReflectionMapping = 301;
  const CubeRefractionMapping = 302;
  const EquirectangularReflectionMapping = 303;
  const EquirectangularRefractionMapping = 304;
  const CubeUVReflectionMapping = 306;
  const CubeUVRefractionMapping = 307;
  const RepeatWrapping = 1000;
  const ClampToEdgeWrapping = 1001;
  const MirroredRepeatWrapping = 1002;
  const NearestFilter = 1003;
  const NearestMipmapNearestFilter = 1004;
  const NearestMipMapNearestFilter = 1004;
  const NearestMipmapLinearFilter = 1005;
  const NearestMipMapLinearFilter = 1005;
  const LinearFilter = 1006;
  const LinearMipmapNearestFilter = 1007;
  const LinearMipMapNearestFilter = 1007;
  const LinearMipmapLinearFilter = 1008;
  const LinearMipMapLinearFilter = 1008;
  const UnsignedByteType = 1009;
  const ByteType = 1010;
  const ShortType = 1011;
  const UnsignedShortType = 1012;
  const IntType = 1013;
  const UnsignedIntType = 1014;
  const FloatType = 1015;
  const HalfFloatType = 1016;
  const UnsignedShort4444Type = 1017;
  const UnsignedShort5551Type = 1018;
  const UnsignedShort565Type = 1019;
  const UnsignedInt248Type = 1020;
  const AlphaFormat = 1021;
  const RGBFormat = 1022;
  const RGBAFormat = 1023;
  const LuminanceFormat = 1024;
  const LuminanceAlphaFormat = 1025;
  const RGBEFormat = RGBAFormat;
  const DepthFormat = 1026;
  const DepthStencilFormat = 1027;
  const RedFormat = 1028;
  const RedIntegerFormat = 1029;
  const RGFormat = 1030;
  const RGIntegerFormat = 1031;
  const RGBIntegerFormat = 1032;
  const RGBAIntegerFormat = 1033;
  const RGB_S3TC_DXT1_Format = 33776;
  const RGBA_S3TC_DXT1_Format = 33777;
  const RGBA_S3TC_DXT3_Format = 33778;
  const RGBA_S3TC_DXT5_Format = 33779;
  const RGB_PVRTC_4BPPV1_Format = 35840;
  const RGB_PVRTC_2BPPV1_Format = 35841;
  const RGBA_PVRTC_4BPPV1_Format = 35842;
  const RGBA_PVRTC_2BPPV1_Format = 35843;
  const RGB_ETC1_Format = 36196;
  const RGB_ETC2_Format = 37492;
  const RGBA_ETC2_EAC_Format = 37496;
  const RGBA_ASTC_4x4_Format = 37808;
  const RGBA_ASTC_5x4_Format = 37809;
  const RGBA_ASTC_5x5_Format = 37810;
  const RGBA_ASTC_6x5_Format = 37811;
  const RGBA_ASTC_6x6_Format = 37812;
  const RGBA_ASTC_8x5_Format = 37813;
  const RGBA_ASTC_8x6_Format = 37814;
  const RGBA_ASTC_8x8_Format = 37815;
  const RGBA_ASTC_10x5_Format = 37816;
  const RGBA_ASTC_10x6_Format = 37817;
  const RGBA_ASTC_10x8_Format = 37818;
  const RGBA_ASTC_10x10_Format = 37819;
  const RGBA_ASTC_12x10_Format = 37820;
  const RGBA_ASTC_12x12_Format = 37821;
  const RGBA_BPTC_Format = 36492;
  const SRGB8_ALPHA8_ASTC_4x4_Format = 37840;
  const SRGB8_ALPHA8_ASTC_5x4_Format = 37841;
  const SRGB8_ALPHA8_ASTC_5x5_Format = 37842;
  const SRGB8_ALPHA8_ASTC_6x5_Format = 37843;
  const SRGB8_ALPHA8_ASTC_6x6_Format = 37844;
  const SRGB8_ALPHA8_ASTC_8x5_Format = 37845;
  const SRGB8_ALPHA8_ASTC_8x6_Format = 37846;
  const SRGB8_ALPHA8_ASTC_8x8_Format = 37847;
  const SRGB8_ALPHA8_ASTC_10x5_Format = 37848;
  const SRGB8_ALPHA8_ASTC_10x6_Format = 37849;
  const SRGB8_ALPHA8_ASTC_10x8_Format = 37850;
  const SRGB8_ALPHA8_ASTC_10x10_Format = 37851;
  const SRGB8_ALPHA8_ASTC_12x10_Format = 37852;
  const SRGB8_ALPHA8_ASTC_12x12_Format = 37853;
  const LoopOnce = 2200;
  const LoopRepeat = 2201;
  const LoopPingPong = 2202;
  const InterpolateDiscrete = 2300;
  const InterpolateLinear = 2301;
  const InterpolateSmooth = 2302;
  const ZeroCurvatureEnding = 2400;
  const ZeroSlopeEnding = 2401;
  const WrapAroundEnding = 2402;
  const NormalAnimationBlendMode = 2500;
  const AdditiveAnimationBlendMode = 2501;
  const TrianglesDrawMode = 0;
  const TriangleStripDrawMode = 1;
  const TriangleFanDrawMode = 2;
  const LinearEncoding = 3000;
  const sRGBEncoding = 3001;
  const GammaEncoding = 3007;
  const RGBEEncoding = 3002;
  const LogLuvEncoding = 3003;
  const RGBM7Encoding = 3004;
  const RGBM16Encoding = 3005;
  const RGBDEncoding = 3006;
  const BasicDepthPacking = 3200;
  const RGBADepthPacking = 3201;
  const TangentSpaceNormalMap = 0;
  const ObjectSpaceNormalMap = 1;
  const ZeroStencilOp = 0;
  const KeepStencilOp = 7680;
  const ReplaceStencilOp = 7681;
  const IncrementStencilOp = 7682;
  const DecrementStencilOp = 7683;
  const IncrementWrapStencilOp = 34055;
  const DecrementWrapStencilOp = 34056;
  const InvertStencilOp = 5386;
  const NeverStencilFunc = 512;
  const LessStencilFunc = 513;
  const EqualStencilFunc = 514;
  const LessEqualStencilFunc = 515;
  const GreaterStencilFunc = 516;
  const NotEqualStencilFunc = 517;
  const GreaterEqualStencilFunc = 518;
  const AlwaysStencilFunc = 519;
  const StaticDrawUsage = 35044;
  const DynamicDrawUsage = 35048;
  const StreamDrawUsage = 35040;
  const StaticReadUsage = 35045;
  const DynamicReadUsage = 35049;
  const StreamReadUsage = 35041;
  const StaticCopyUsage = 35046;
  const DynamicCopyUsage = 35050;
  const StreamCopyUsage = 35042;
  const GLSL1 = "100";
  const GLSL3 = "300 es";
}, "constants.js", []);

//loaders/Cache.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Cache:{enumerable:true, get:function() {
    return Cache;
  }}});
  const files = {};
  class _Cache {
    constructor() {
      this.enabled = false;
      this.files;
    }
    add(key, file) {
      if (this.enabled === false) {
        return;
      }
      files[key] = file;
    }
    get(key) {
      if (this.enabled === false) {
        return;
      }
      return files[key];
    }
    remove(key) {
      delete files[key];
    }
    clear() {
      this.files = {};
    }
  }
  const Cache = new _Cache;
}, "loaders/Cache.js", []);

//loaders/LoadingManager.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {DefaultLoadingManager:{enumerable:true, get:function() {
    return DefaultLoadingManager;
  }}, LoadingManager:{enumerable:true, get:function() {
    return LoadingManager;
  }}});
  class LoadingManager {
    constructor(onLoad, onProgress, onError) {
      this.isLoading = false;
      this.itemsLoaded = 0;
      this.itemsTotal = 0;
      this.urlModifier = undefined;
      this.handlers = [];
      this.onStart = undefined;
      this.onLoad = onLoad;
      this.onProgress = onProgress;
      this.onError = onError;
    }
    itemStart(url) {
      this.itemsTotal++;
      if (this.isLoading === false) {
        if (this.onStart !== undefined) {
          console.log("LoadingManager 1");
          this.onStart(url, this.itemsLoaded, this.itemsTotal);
        }
      }
      this.isLoading = true;
    }
    itemEnd(url) {
      this.itemsLoaded++;
      if (this.onProgress !== undefined) {
        console.log("LoadingManager 2");
        this.onProgress(url, this.itemsLoaded, this.itemsTotal);
      }
      if (this.itemsLoaded === this.itemsTotal) {
        this.isLoading = false;
        if (this.onLoad !== undefined) {
          console.log("LoadingManager 3");
          this.onLoad();
        }
      }
    }
    itemError(url) {
      if (this.onError !== undefined) {
        console.log("LoadingManager 4");
        this.onError(url);
      }
    }
    resolveURL(url) {
      if (this.urlModifier) {
        return this.urlModifier(url);
      }
      return url;
    }
    setURLModifier(transform) {
      this.urlModifier = transform;
      return this;
    }
    addHandler(regex, loader) {
      this.handlers.push(regex, loader);
      return this;
    }
    removeHandler(regex) {
      const index = this.handlers.indexOf(regex);
      if (index !== -1) {
        this.handlers.splice(index, 2);
      }
      return this;
    }
    getHandler(file) {
      for (let i = 0, l = this.handlers.length; i < l; i += 2) {
        const regex = this.handlers[i];
        const loader = this.handlers[i + 1];
        if (regex.global) {
          regex.lastIndex = 0;
        }
        if (regex.test(file)) {
          return loader;
        }
      }
      return null;
    }
  }
  const DefaultLoadingManager = new LoadingManager;
}, "loaders/LoadingManager.js", []);

//loaders/Loader.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Loader:{enumerable:true, get:function() {
    return Loader;
  }}});
  var module$loaders$LoadingManager = $$require("loaders/LoadingManager.js");
  class Loader {
    constructor(manager) {
      this.manager = manager !== undefined ? manager : module$loaders$LoadingManager.DefaultLoadingManager;
      this.crossOrigin = "anonymous";
      this.withCredentials = false;
      this.path = "";
      this.resourcePath = "";
      this.requestHeader = {};
    }
    load(url, onLoad, onProgress, onError) {
    }
    loadAsync(url, onProgress) {
      return new Promise(function(resolve, reject) {
        this.load(url, resolve, onProgress, reject);
      });
    }
    parse() {
    }
    setCrossOrigin(crossOrigin) {
      this.crossOrigin = crossOrigin;
      return this;
    }
    setWithCredentials(value) {
      this.withCredentials = value;
      return this;
    }
    setPath(path) {
      this.path = path;
      return this;
    }
    setResourcePath(resourcePath) {
      this.resourcePath = resourcePath;
      return this;
    }
    setRequestHeader(requestHeader) {
      this.requestHeader = requestHeader;
      return this;
    }
  }
}, "loaders/Loader.js", ["loaders/LoadingManager.js"]);

//loaders/ImageLoader.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {ImageLoader:{enumerable:true, get:function() {
    return ImageLoader;
  }}});
  var module$loaders$Cache = $$require("loaders/Cache.js");
  var module$loaders$Loader = $$require("loaders/Loader.js");
  var module$loaders$LoadingManager = $$require("loaders/LoadingManager.js");
  class ImageLoader extends module$loaders$Loader.Loader {
    constructor(manager) {
      super(manager);
    }
    load(url, onLoad, onProgress, onError) {
      if (this.path !== undefined) {
        url = this.path + url;
      }
      console.log("ImageLoader 1");
      url = this.manager.resolveURL(url);
      const scope = this;
      const cached = module$loaders$Cache.Cache.get(url);
      if (cached !== undefined) {
        console.log("ImageLoader 2");
        scope.manager.itemStart(url);
        setTimeout(function() {
          if (onLoad) {
            onLoad(cached);
          }
          scope.manager.itemEnd(url);
        }, 0);
        return cached;
      }
      const image = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
      function onImageLoad() {
        image.removeEventListener("load", onImageLoad, false);
        image.removeEventListener("error", onImageError, false);
        module$loaders$Cache.Cache.add(url, this);
        if (onLoad) {
          onLoad(this);
        }
        scope.manager.itemEnd(url);
      }
      function onImageError(event) {
        image.removeEventListener("load", onImageLoad, false);
        image.removeEventListener("error", onImageError, false);
        if (onError) {
          onError(event);
        }
        scope.manager.itemError(url);
        scope.manager.itemEnd(url);
      }
      image.addEventListener("load", onImageLoad, false);
      image.addEventListener("error", onImageError, false);
      if (url.substr(0, 5) !== "data:") {
        if (this.crossOrigin !== undefined) {
          image.crossOrigin = this.crossOrigin;
        }
      }
      scope.manager.itemStart(url);
      image.src = url;
      return image;
    }
  }
}, "loaders/ImageLoader.js", ["loaders/Cache.js", "loaders/Loader.js", "loaders/LoadingManager.js"]);

//math/Vector2.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Vector2:{enumerable:true, get:function() {
    return Vector2;
  }}});
  class Vector2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    get width() {
      return this.x;
    }
    set width(value) {
      this.x = value;
    }
    get height() {
      return this.y;
    }
    set height(value) {
      this.y = value;
    }
    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }
    setScalar(scalar) {
      this.x = scalar;
      this.y = scalar;
      return this;
    }
    setX(x) {
      this.x = x;
      return this;
    }
    setY(y) {
      this.y = y;
      return this;
    }
    setComponent(index, value) {
      switch(index) {
        case 0:
          this.x = value;
          break;
        case 1:
          this.y = value;
          break;
        default:
          throw new Error("index is out of range: " + index);
      }
      return this;
    }
    getComponent(index) {
      switch(index) {
        case 0:
          return this.x;
        case 1:
          return this.y;
        default:
          throw new Error("index is out of range: " + index);
      }
    }
    clone() {
      return new this.constructor(this.x, this.y);
    }
    copy(v) {
      this.x = v.x;
      this.y = v.y;
      return this;
    }
    add(v, w) {
      if (w !== undefined) {
        console.warn("THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead.");
        return this.addVectors(v, w);
      }
      this.x += v.x;
      this.y += v.y;
      return this;
    }
    addScalar(s) {
      this.x += s;
      this.y += s;
      return this;
    }
    addVectors(a, b) {
      this.x = a.x + b.x;
      this.y = a.y + b.y;
      return this;
    }
    addScaledVector(v, s) {
      this.x += v.x * s;
      this.y += v.y * s;
      return this;
    }
    sub(v, w) {
      if (w !== undefined) {
        console.warn("THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.");
        return this.subVectors(v, w);
      }
      this.x -= v.x;
      this.y -= v.y;
      return this;
    }
    subScalar(s) {
      this.x -= s;
      this.y -= s;
      return this;
    }
    subVectors(a, b) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      return this;
    }
    multiply(v) {
      this.x *= v.x;
      this.y *= v.y;
      return this;
    }
    multiplyScalar(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      return this;
    }
    divide(v) {
      this.x /= v.x;
      this.y /= v.y;
      return this;
    }
    divideScalar(scalar) {
      return this.multiplyScalar(1 / scalar);
    }
    applyMatrix3(m) {
      const x = this.x, y = this.y;
      const e = m.elements;
      this.x = e[0] * x + e[3] * y + e[6];
      this.y = e[1] * x + e[4] * y + e[7];
      return this;
    }
    min(v) {
      this.x = Math.min(this.x, v.x);
      this.y = Math.min(this.y, v.y);
      return this;
    }
    max(v) {
      this.x = Math.max(this.x, v.x);
      this.y = Math.max(this.y, v.y);
      return this;
    }
    clamp(min, max) {
      this.x = Math.max(min.x, Math.min(max.x, this.x));
      this.y = Math.max(min.y, Math.min(max.y, this.y));
      return this;
    }
    clampScalar(minVal, maxVal) {
      this.x = Math.max(minVal, Math.min(maxVal, this.x));
      this.y = Math.max(minVal, Math.min(maxVal, this.y));
      return this;
    }
    clampLength(min, max) {
      const length = this.length();
      return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
    }
    floor() {
      this.x = Math.floor(this.x);
      this.y = Math.floor(this.y);
      return this;
    }
    ceil() {
      this.x = Math.ceil(this.x);
      this.y = Math.ceil(this.y);
      return this;
    }
    round() {
      this.x = Math.round(this.x);
      this.y = Math.round(this.y);
      return this;
    }
    roundToZero() {
      this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x);
      this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y);
      return this;
    }
    negate() {
      this.x = -this.x;
      this.y = -this.y;
      return this;
    }
    dot(v) {
      return this.x * v.x + this.y * v.y;
    }
    cross(v) {
      return this.x * v.y - this.y * v.x;
    }
    lengthSq() {
      return this.x * this.x + this.y * this.y;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    manhattanLength() {
      return Math.abs(this.x) + Math.abs(this.y);
    }
    normalize() {
      return this.divideScalar(this.length() || 1);
    }
    angle() {
      const angle = Math.atan2(-this.y, -this.x) + Math.PI;
      return angle;
    }
    distanceTo(v) {
      return Math.sqrt(this.distanceToSquared(v));
    }
    distanceToSquared(v) {
      const dx = this.x - v.x, dy = this.y - v.y;
      return dx * dx + dy * dy;
    }
    manhattanDistanceTo(v) {
      return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);
    }
    setLength(length) {
      return this.normalize().multiplyScalar(length);
    }
    lerp(v, alpha) {
      this.x += (v.x - this.x) * alpha;
      this.y += (v.y - this.y) * alpha;
      return this;
    }
    lerpVectors(v1, v2, alpha) {
      this.x = v1.x + (v2.x - v1.x) * alpha;
      this.y = v1.y + (v2.y - v1.y) * alpha;
      return this;
    }
    equals(v) {
      return v.x === this.x && v.y === this.y;
    }
    fromArray(array, offset = 0) {
      this.x = array[offset];
      this.y = array[offset + 1];
      return this;
    }
    toArray(array = [], offset = 0) {
      array[offset] = this.x;
      array[offset + 1] = this.y;
      return array;
    }
    fromBufferAttribute(attribute, index, offset) {
      if (offset !== undefined) {
        console.warn("THREE.Vector2: offset has been removed from .fromBufferAttribute().");
      }
      this.x = attribute.getX(index);
      this.y = attribute.getY(index);
      return this;
    }
    rotateAround(center, angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      const x = this.x - center.x;
      const y = this.y - center.y;
      this.x = x * c - y * s + center.x;
      this.y = x * s + y * c + center.y;
      return this;
    }
    random() {
      this.x = Math.random();
      this.y = Math.random();
      return this;
    }
  }
  Vector2.prototype.isVector2 = true;
}, "math/Vector2.js", []);

//extras/ImageUtils.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {ImageUtils:{enumerable:true, get:function() {
    return ImageUtils;
  }}});
  let _canvas;
  const ImageUtils = {getDataURL:function(image) {
    if (/^data:/i.test(image.src)) {
      return image.src;
    }
    if (typeof HTMLCanvasElement == "undefined") {
      return image.src;
    }
    let canvas;
    if (image instanceof HTMLCanvasElement) {
      canvas = image;
    } else {
      if (_canvas === undefined) {
        _canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
      }
      _canvas.width = image.width;
      _canvas.height = image.height;
      const context = _canvas.getContext("2d");
      if (image instanceof ImageData) {
        context.putImageData(image, 0, 0);
      } else {
        context.drawImage(image, 0, 0, image.width, image.height);
      }
      canvas = _canvas;
    }
    if (canvas.width > 2048 || canvas.height > 2048) {
      return canvas.toDataURL("image/jpeg", 0.6);
    } else {
      return canvas.toDataURL("image/png");
    }
  }};
}, "extras/ImageUtils.js", []);

//textures/Texture.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Texture:{enumerable:true, get:function() {
    return Texture;
  }}});
  var module$core$EventDispatcher = $$require("core/EventDispatcher.js");
  var module$constants = $$require("constants.js");
  var module$math$MathUtils = $$require("math/MathUtils.js");
  var module$math$Vector2 = $$require("math/Vector2.js");
  var module$math$Matrix3 = $$require("math/Matrix3.js");
  var module$extras$ImageUtils = $$require("extras/ImageUtils.js");
  let textureId = 0;
  class Texture extends module$core$EventDispatcher.EventDispatcher {
    constructor(image = Texture.DEFAULT_IMAGE, mapping = Texture.DEFAULT_MAPPING, wrapS = module$constants.ClampToEdgeWrapping, wrapT = module$constants.ClampToEdgeWrapping, magFilter = module$constants.LinearFilter, minFilter = module$constants.LinearMipmapLinearFilter, format = module$constants.RGBAFormat, type = module$constants.UnsignedByteType, anisotropy = 1, encoding = module$constants.LinearEncoding) {
      super();
      this.id = textureId++;
      this.uuid = module$math$MathUtils.MathUtils.generateUUID();
      this.name = "";
      this.image = image;
      this.mipmaps = [];
      this.mapping = mapping;
      this.wrapS = wrapS;
      this.wrapT = wrapT;
      this.magFilter = magFilter;
      this.minFilter = minFilter;
      this.anisotropy = anisotropy;
      this.format = format;
      this.internalFormat = null;
      this.type = type;
      this.offset = new module$math$Vector2.Vector2(0, 0);
      this.repeat = new module$math$Vector2.Vector2(1, 1);
      this.center = new module$math$Vector2.Vector2(0, 0);
      this.rotation = 0;
      this.matrixAutoUpdate = true;
      this.matrix = new module$math$Matrix3.Matrix3;
      this.generateMipmaps = true;
      this.premultiplyAlpha = false;
      this.flipY = true;
      this.unpackAlignment = 4;
      this.encoding = encoding;
      this.version = 0;
      this.onUpdate = null;
    }
    updateMatrix() {
      this.matrix.setUvTransform(this.offset.x, this.offset.y, this.repeat.x, this.repeat.y, this.rotation, this.center.x, this.center.y);
    }
    clone() {
      return (new this.constructor).copy(this);
    }
    copy(source) {
      this.name = source.name;
      this.image = source.image;
      this.mipmaps = source.mipmaps.slice(0);
      this.mapping = source.mapping;
      this.wrapS = source.wrapS;
      this.wrapT = source.wrapT;
      this.magFilter = source.magFilter;
      this.minFilter = source.minFilter;
      this.anisotropy = source.anisotropy;
      this.format = source.format;
      this.internalFormat = source.internalFormat;
      this.type = source.type;
      this.offset.copy(source.offset);
      this.repeat.copy(source.repeat);
      this.center.copy(source.center);
      this.rotation = source.rotation;
      this.matrixAutoUpdate = source.matrixAutoUpdate;
      this.matrix.copy(source.matrix);
      this.generateMipmaps = source.generateMipmaps;
      this.premultiplyAlpha = source.premultiplyAlpha;
      this.flipY = source.flipY;
      this.unpackAlignment = source.unpackAlignment;
      this.encoding = source.encoding;
      return this;
    }
    toJSON(meta) {
      const isRootObject = meta === undefined || typeof meta === "string";
      if (!isRootObject && meta.textures[this.uuid] !== undefined) {
        console.log("Texture toJSON");
        return meta.textures[this.uuid];
      }
      const output = {metadata:{version:4.5, type:"Texture", generator:"Texture.toJSON"}, uuid:this.uuid, name:this.name, mapping:this.mapping, repeat:[this.repeat.x, this.repeat.y], offset:[this.offset.x, this.offset.y], center:[this.center.x, this.center.y], rotation:this.rotation, wrap:[this.wrapS, this.wrapT], format:this.format, type:this.type, encoding:this.encoding, minFilter:this.minFilter, magFilter:this.magFilter, anisotropy:this.anisotropy, flipY:this.flipY, premultiplyAlpha:this.premultiplyAlpha, 
      unpackAlignment:this.unpackAlignment};
      if (this.image !== undefined) {
        console.log("Texture IMAGE");
        const image = this.image;
        if (image.uuid === undefined) {
          image.uuid = module$math$MathUtils.MathUtils.generateUUID();
        }
        if (!isRootObject && meta.images[image.uuid] === undefined) {
          let url;
          if (Array.isArray(image)) {
            url = [];
            for (let i = 0, l = image.length; i < l; i++) {
              if (image[i].isDataTexture) {
                url.push(serializeImage(image[i].image));
              } else {
                url.push(serializeImage(image[i]));
              }
            }
          } else {
            url = serializeImage(image);
          }
          meta.images[image.uuid] = {uuid:image.uuid, url:url};
        }
        output.image = image.uuid;
      }
      if (!isRootObject) {
        meta.textures[this.uuid] = output;
      }
      return output;
    }
    dispose() {
      this.dispatchEvent({type:"dispose"});
    }
    transformUv(uv) {
      if (this.mapping !== module$constants.UVMapping) {
        return uv;
      }
      uv.applyMatrix3(this.matrix);
      if (uv.x < 0 || uv.x > 1) {
        switch(this.wrapS) {
          case module$constants.RepeatWrapping:
            uv.x = uv.x - Math.floor(uv.x);
            break;
          case module$constants.ClampToEdgeWrapping:
            uv.x = uv.x < 0 ? 0 : 1;
            break;
          case module$constants.MirroredRepeatWrapping:
            if (Math.abs(Math.floor(uv.x) % 2) === 1) {
              uv.x = Math.ceil(uv.x) - uv.x;
            } else {
              uv.x = uv.x - Math.floor(uv.x);
            }
            break;
        }
      }
      if (uv.y < 0 || uv.y > 1) {
        switch(this.wrapT) {
          case module$constants.RepeatWrapping:
            uv.y = uv.y - Math.floor(uv.y);
            break;
          case module$constants.ClampToEdgeWrapping:
            uv.y = uv.y < 0 ? 0 : 1;
            break;
          case module$constants.MirroredRepeatWrapping:
            if (Math.abs(Math.floor(uv.y) % 2) === 1) {
              uv.y = Math.ceil(uv.y) - uv.y;
            } else {
              uv.y = uv.y - Math.floor(uv.y);
            }
            break;
        }
      }
      if (this.flipY) {
        uv.y = 1 - uv.y;
      }
      return uv;
    }
    set needsUpdate(value) {
      if (value === true) {
        this.version++;
      }
    }
  }
  Texture.DEFAULT_IMAGE = undefined;
  Texture.DEFAULT_MAPPING = module$constants.UVMapping;
  Texture.prototype.isTexture = true;
  function serializeImage(image) {
    if (typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement || typeof HTMLCanvasElement !== "undefined" && image instanceof HTMLCanvasElement || typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
      return module$extras$ImageUtils.ImageUtils.getDataURL(image);
    } else {
      if (image.data) {
        return {data:Array.prototype.slice.call(image.data), width:image.width, height:image.height, type:image.data.constructor.name};
      } else {
        console.warn("THREE.Texture: Unable to serialize Texture.");
        return {};
      }
    }
  }
}, "textures/Texture.js", ["core/EventDispatcher.js", "constants.js", "math/MathUtils.js", "math/Vector2.js", "math/Matrix3.js", "extras/ImageUtils.js"]);

//loaders/TextureLoader.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {TextureLoader:{enumerable:true, get:function() {
    return TextureLoader;
  }}});
  var module$constants = $$require("constants.js");
  var module$loaders$ImageLoader = $$require("loaders/ImageLoader.js");
  var module$textures$Texture = $$require("textures/Texture.js");
  var module$loaders$Loader = $$require("loaders/Loader.js");
  var module$loaders$LoadingManager = $$require("loaders/LoadingManager.js");
  class TextureLoader extends module$loaders$Loader.Loader {
    constructor(manager) {
      super(manager);
    }
    load(url, onLoad, onProgress, onError) {
      const texture = new module$textures$Texture.Texture;
      const loader = new module$loaders$ImageLoader.ImageLoader(this.manager);
      loader.setCrossOrigin(this.crossOrigin);
      loader.setPath(this.path);
      loader.load(url, function(image) {
        texture.image = image;
        const isJPEG = url.search(/\.jpe?g($|\?)/i) > 0 || url.search(/^data:image\/jpeg/) === 0;
        texture.format = isJPEG ? module$constants.RGBFormat : module$constants.RGBAFormat;
        texture.needsUpdate = true;
        if (onLoad !== undefined) {
          console.log("TextureLoader 1");
          onLoad(texture);
        }
      }, onProgress, onError);
      return texture;
    }
  }
}, "loaders/TextureLoader.js", ["constants.js", "loaders/ImageLoader.js", "textures/Texture.js", "loaders/Loader.js", "loaders/LoadingManager.js"]);

//scenes/Scene.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Scene:{enumerable:true, get:function() {
    return Scene;
  }}});
  var module$core$Object3D = $$require("core/Object3D.js");
  class Scene extends module$core$Object3D.Object3D {
    constructor() {
      super();
      this.type = "Scene";
      this.background = null;
      this.environment = null;
      this.fog = null;
      this.overrideMaterial = null;
      this.autoUpdate = true;
      this.matrixAutoUpdate;
      if (typeof __THREE_DEVTOOLS__ !== "undefined") {
        __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe", {detail:this}));
      }
    }
    copy(source, recursive) {
      super.copy(source, recursive);
      if (source.background !== null) {
        this.background = source.background.clone();
      }
      if (source.environment !== null) {
        this.environment = source.environment.clone();
      }
      if (source.fog !== null) {
        this.fog = source.fog.clone();
      }
      if (source.overrideMaterial !== null) {
        this.overrideMaterial = source.overrideMaterial.clone();
      }
      this.autoUpdate = source.autoUpdate;
      this.matrixAutoUpdate = source.matrixAutoUpdate;
      return this;
    }
    toJSON(meta) {
      const data = super.toJSON(meta);
      if (this.background !== null) {
        data.object.background = this.background.toJSON(meta);
      }
      if (this.environment !== null) {
        data.object.environment = this.environment.toJSON(meta);
      }
      if (this.fog !== null) {
        data.object.fog = this.fog.toJSON();
      }
      return data;
    }
  }
  Scene.prototype.isScene = true;
}, "scenes/Scene.js", ["core/Object3D.js"]);

//math/Box3.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Box3:{enumerable:true, get:function() {
    return Box3;
  }}});
  var module$math$Vector3 = $$require("math/Vector3.js");
  class Box3 {
    constructor(min = new module$math$Vector3.Vector3(+Infinity, +Infinity, +Infinity), max = new module$math$Vector3.Vector3(-Infinity, -Infinity, -Infinity)) {
      this.min = min;
      this.max = max;
    }
    set(min, max) {
      this.min.copy(min);
      this.max.copy(max);
      return this;
    }
    setFromArray(array) {
      let minX = +Infinity;
      let minY = +Infinity;
      let minZ = +Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let maxZ = -Infinity;
      for (let i = 0, l = array.length; i < l; i += 3) {
        const x = array[i];
        const y = array[i + 1];
        const z = array[i + 2];
        if (x < minX) {
          minX = x;
        }
        if (y < minY) {
          minY = y;
        }
        if (z < minZ) {
          minZ = z;
        }
        if (x > maxX) {
          maxX = x;
        }
        if (y > maxY) {
          maxY = y;
        }
        if (z > maxZ) {
          maxZ = z;
        }
      }
      this.min.set(minX, minY, minZ);
      this.max.set(maxX, maxY, maxZ);
      return this;
    }
    setFromBufferAttribute(attribute) {
      let minX = +Infinity;
      let minY = +Infinity;
      let minZ = +Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let maxZ = -Infinity;
      for (let i = 0, l = attribute.count; i < l; i++) {
        const x = attribute.getX(i);
        const y = attribute.getY(i);
        const z = attribute.getZ(i);
        if (x < minX) {
          minX = x;
        }
        if (y < minY) {
          minY = y;
        }
        if (z < minZ) {
          minZ = z;
        }
        if (x > maxX) {
          maxX = x;
        }
        if (y > maxY) {
          maxY = y;
        }
        if (z > maxZ) {
          maxZ = z;
        }
      }
      this.min.set(minX, minY, minZ);
      this.max.set(maxX, maxY, maxZ);
      return this;
    }
    setFromPoints(points) {
      this.makeEmpty();
      for (let i = 0, il = points.length; i < il; i++) {
        this.expandByPoint(points[i]);
      }
      return this;
    }
    setFromCenterAndSize(center, size) {
      const halfSize = _vector.copy(size).multiplyScalar(0.5);
      this.min.copy(center).sub(halfSize);
      this.max.copy(center).add(halfSize);
      return this;
    }
    setFromObject(object) {
      this.makeEmpty();
      return this.expandByObject(object);
    }
    clone() {
      return (new this.constructor).copy(this);
    }
    copy(box) {
      this.min.copy(box.min);
      this.max.copy(box.max);
      return this;
    }
    makeEmpty() {
      this.min.x = this.min.y = this.min.z = +Infinity;
      this.max.x = this.max.y = this.max.z = -Infinity;
      return this;
    }
    isEmpty() {
      return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
    }
    getCenter(target) {
      if (target === undefined) {
        console.warn("THREE.Box3: .getCenter() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      return this.isEmpty() ? target.set(0, 0, 0) : target.addVectors(this.min, this.max).multiplyScalar(0.5);
    }
    getSize(target) {
      if (target === undefined) {
        console.warn("THREE.Box3: .getSize() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      return this.isEmpty() ? target.set(0, 0, 0) : target.subVectors(this.max, this.min);
    }
    expandByPoint(point) {
      this.min.min(point);
      this.max.max(point);
      return this;
    }
    expandByVector(vector) {
      this.min.sub(vector);
      this.max.add(vector);
      return this;
    }
    expandByScalar(scalar) {
      this.min.addScalar(-scalar);
      this.max.addScalar(scalar);
      return this;
    }
    expandByObject(object) {
      object.updateWorldMatrix(false, false);
      const geometry = object.geometry;
      if (geometry !== undefined) {
        if (geometry.boundingBox === null) {
          geometry.computeBoundingBox();
        }
        _box.copy(geometry.boundingBox);
        _box.applyMatrix4(object.matrixWorld);
        this.union(_box);
      }
      const children = object.children;
      for (let i = 0, l = children.length; i < l; i++) {
        this.expandByObject(children[i]);
      }
      return this;
    }
    containsPoint(point) {
      return point.x < this.min.x || point.x > this.max.x || point.y < this.min.y || point.y > this.max.y || point.z < this.min.z || point.z > this.max.z ? false : true;
    }
    containsBox(box) {
      return this.min.x <= box.min.x && box.max.x <= this.max.x && this.min.y <= box.min.y && box.max.y <= this.max.y && this.min.z <= box.min.z && box.max.z <= this.max.z;
    }
    getParameter(point, target) {
      if (target === undefined) {
        console.warn("THREE.Box3: .getParameter() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      return target.set((point.x - this.min.x) / (this.max.x - this.min.x), (point.y - this.min.y) / (this.max.y - this.min.y), (point.z - this.min.z) / (this.max.z - this.min.z));
    }
    intersectsBox(box) {
      return box.max.x < this.min.x || box.min.x > this.max.x || box.max.y < this.min.y || box.min.y > this.max.y || box.max.z < this.min.z || box.min.z > this.max.z ? false : true;
    }
    intersectsSphere(sphere) {
      this.clampPoint(sphere.center, _vector);
      return _vector.distanceToSquared(sphere.center) <= sphere.radius * sphere.radius;
    }
    intersectsPlane(plane) {
      let min, max;
      if (plane.normal.x > 0) {
        min = plane.normal.x * this.min.x;
        max = plane.normal.x * this.max.x;
      } else {
        min = plane.normal.x * this.max.x;
        max = plane.normal.x * this.min.x;
      }
      if (plane.normal.y > 0) {
        min += plane.normal.y * this.min.y;
        max += plane.normal.y * this.max.y;
      } else {
        min += plane.normal.y * this.max.y;
        max += plane.normal.y * this.min.y;
      }
      if (plane.normal.z > 0) {
        min += plane.normal.z * this.min.z;
        max += plane.normal.z * this.max.z;
      } else {
        min += plane.normal.z * this.max.z;
        max += plane.normal.z * this.min.z;
      }
      return min <= -plane.constant && max >= -plane.constant;
    }
    intersectsTriangle(triangle) {
      if (this.isEmpty()) {
        return false;
      }
      this.getCenter(_center);
      _extents.subVectors(this.max, _center);
      _v0.subVectors(triangle.a, _center);
      _v1.subVectors(triangle.b, _center);
      _v2.subVectors(triangle.c, _center);
      _f0.subVectors(_v1, _v0);
      _f1.subVectors(_v2, _v1);
      _f2.subVectors(_v0, _v2);
      let axes = [0, -_f0.z, _f0.y, 0, -_f1.z, _f1.y, 0, -_f2.z, _f2.y, _f0.z, 0, -_f0.x, _f1.z, 0, -_f1.x, _f2.z, 0, -_f2.x, -_f0.y, _f0.x, 0, -_f1.y, _f1.x, 0, -_f2.y, _f2.x, 0];
      if (!satForAxes(axes, _v0, _v1, _v2, _extents)) {
        return false;
      }
      axes = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      if (!satForAxes(axes, _v0, _v1, _v2, _extents)) {
        return false;
      }
      _triangleNormal.crossVectors(_f0, _f1);
      axes = [_triangleNormal.x, _triangleNormal.y, _triangleNormal.z];
      return satForAxes(axes, _v0, _v1, _v2, _extents);
    }
    clampPoint(point, target) {
      if (target === undefined) {
        console.warn("THREE.Box3: .clampPoint() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      return target.copy(point).clamp(this.min, this.max);
    }
    distanceToPoint(point) {
      const clampedPoint = _vector.copy(point).clamp(this.min, this.max);
      return clampedPoint.sub(point).length();
    }
    getBoundingSphere(target) {
      if (target === undefined) {
        console.error("THREE.Box3: .getBoundingSphere() target is now required");
      }
      this.getCenter(target.center);
      target.radius = this.getSize(_vector).length() * 0.5;
      return target;
    }
    intersect(box) {
      this.min.max(box.min);
      this.max.min(box.max);
      if (this.isEmpty()) {
        this.makeEmpty();
      }
      return this;
    }
    union(box) {
      this.min.min(box.min);
      this.max.max(box.max);
      return this;
    }
    applyMatrix4(matrix) {
      if (this.isEmpty()) {
        return this;
      }
      _points[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(matrix);
      _points[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(matrix);
      _points[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(matrix);
      _points[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(matrix);
      _points[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(matrix);
      _points[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(matrix);
      _points[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(matrix);
      _points[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(matrix);
      this.setFromPoints(_points);
      return this;
    }
    translate(offset) {
      this.min.add(offset);
      this.max.add(offset);
      return this;
    }
    equals(box) {
      return box.min.equals(this.min) && box.max.equals(this.max);
    }
  }
  Box3.prototype.isBox3 = true;
  const _points = [new module$math$Vector3.Vector3, new module$math$Vector3.Vector3, new module$math$Vector3.Vector3, new module$math$Vector3.Vector3, new module$math$Vector3.Vector3, new module$math$Vector3.Vector3, new module$math$Vector3.Vector3, new module$math$Vector3.Vector3];
  const _vector = new module$math$Vector3.Vector3;
  const _box = new Box3;
  const _v0 = new module$math$Vector3.Vector3;
  const _v1 = new module$math$Vector3.Vector3;
  const _v2 = new module$math$Vector3.Vector3;
  const _f0 = new module$math$Vector3.Vector3;
  const _f1 = new module$math$Vector3.Vector3;
  const _f2 = new module$math$Vector3.Vector3;
  const _center = new module$math$Vector3.Vector3;
  const _extents = new module$math$Vector3.Vector3;
  const _triangleNormal = new module$math$Vector3.Vector3;
  const _testAxis = new module$math$Vector3.Vector3;
  function satForAxes(axes, v0, v1, v2, extents) {
    for (let i = 0, j = axes.length - 3; i <= j; i += 3) {
      _testAxis.fromArray(axes, i);
      const r = extents.x * Math.abs(_testAxis.x) + extents.y * Math.abs(_testAxis.y) + extents.z * Math.abs(_testAxis.z);
      const p0 = v0.dot(_testAxis);
      const p1 = v1.dot(_testAxis);
      const p2 = v2.dot(_testAxis);
      if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
        return false;
      }
    }
    return true;
  }
}, "math/Box3.js", ["math/Vector3.js"]);

//math/Color.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Color:{enumerable:true, get:function() {
    return Color;
  }}});
  var module$math$MathUtils = $$require("math/MathUtils.js");
  const _colorKeywords = {"aliceblue":15792383, "antiquewhite":16444375, "aqua":65535, "aquamarine":8388564, "azure":15794175, "beige":16119260, "bisque":16770244, "black":0, "blanchedalmond":16772045, "blue":255, "blueviolet":9055202, "brown":10824234, "burlywood":14596231, "cadetblue":6266528, "chartreuse":8388352, "chocolate":13789470, "coral":16744272, "cornflowerblue":6591981, "cornsilk":16775388, "crimson":14423100, "cyan":65535, "darkblue":139, "darkcyan":35723, "darkgoldenrod":12092939, "darkgray":11119017, 
  "darkgreen":25600, "darkgrey":11119017, "darkkhaki":12433259, "darkmagenta":9109643, "darkolivegreen":5597999, "darkorange":16747520, "darkorchid":10040012, "darkred":9109504, "darksalmon":15308410, "darkseagreen":9419919, "darkslateblue":4734347, "darkslategray":3100495, "darkslategrey":3100495, "darkturquoise":52945, "darkviolet":9699539, "deeppink":16716947, "deepskyblue":49151, "dimgray":6908265, "dimgrey":6908265, "dodgerblue":2003199, "firebrick":11674146, "floralwhite":16775920, "forestgreen":2263842, 
  "fuchsia":16711935, "gainsboro":14474460, "ghostwhite":16316671, "gold":16766720, "goldenrod":14329120, "gray":8421504, "green":32768, "greenyellow":11403055, "grey":8421504, "honeydew":15794160, "hotpink":16738740, "indianred":13458524, "indigo":4915330, "ivory":16777200, "khaki":15787660, "lavender":15132410, "lavenderblush":16773365, "lawngreen":8190976, "lemonchiffon":16775885, "lightblue":11393254, "lightcoral":15761536, "lightcyan":14745599, "lightgoldenrodyellow":16448210, "lightgray":13882323, 
  "lightgreen":9498256, "lightgrey":13882323, "lightpink":16758465, "lightsalmon":16752762, "lightseagreen":2142890, "lightskyblue":8900346, "lightslategray":7833753, "lightslategrey":7833753, "lightsteelblue":11584734, "lightyellow":16777184, "lime":65280, "limegreen":3329330, "linen":16445670, "magenta":16711935, "maroon":8388608, "mediumaquamarine":6737322, "mediumblue":205, "mediumorchid":12211667, "mediumpurple":9662683, "mediumseagreen":3978097, "mediumslateblue":8087790, "mediumspringgreen":64154, 
  "mediumturquoise":4772300, "mediumvioletred":13047173, "midnightblue":1644912, "mintcream":16121850, "mistyrose":16770273, "moccasin":16770229, "navajowhite":16768685, "navy":128, "oldlace":16643558, "olive":8421376, "olivedrab":7048739, "orange":16753920, "orangered":16729344, "orchid":14315734, "palegoldenrod":15657130, "palegreen":10025880, "paleturquoise":11529966, "palevioletred":14381203, "papayawhip":16773077, "peachpuff":16767673, "peru":13468991, "pink":16761035, "plum":14524637, "powderblue":11591910, 
  "purple":8388736, "rebeccapurple":6697881, "red":16711680, "rosybrown":12357519, "royalblue":4286945, "saddlebrown":9127187, "salmon":16416882, "sandybrown":16032864, "seagreen":3050327, "seashell":16774638, "sienna":10506797, "silver":12632256, "skyblue":8900331, "slateblue":6970061, "slategray":7372944, "slategrey":7372944, "snow":16775930, "springgreen":65407, "steelblue":4620980, "tan":13808780, "teal":32896, "thistle":14204888, "tomato":16737095, "turquoise":4251856, "violet":15631086, "wheat":16113331, 
  "white":16777215, "whitesmoke":16119285, "yellow":16776960, "yellowgreen":10145074};
  const _hslA = {h:0, s:0, l:0};
  const _hslB = {h:0, s:0, l:0};
  function hue2rgb(p, q, t) {
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * 6 * (2 / 3 - t);
    }
    return p;
  }
  function SRGBToLinear(c) {
    return c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
  }
  function LinearToSRGB(c) {
    return c < 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 0.41666) - 0.055;
  }
  class Color {
    constructor(r, g, b) {
      if (g === undefined && b === undefined) {
        return this.set(r);
      }
      return this.setRGB(r, g, b);
    }
    set(value) {
      if (value && value.isColor) {
        this.copy(value);
      } else {
        if (typeof value === "number") {
          this.setHex(value);
        } else {
          if (typeof value === "string") {
            this.setStyle(value);
          }
        }
      }
      return this;
    }
    setScalar(scalar) {
      this.r = scalar;
      this.g = scalar;
      this.b = scalar;
      return this;
    }
    setHex(hex) {
      hex = Math.floor(hex);
      this.r = (hex >> 16 & 255) / 255;
      this.g = (hex >> 8 & 255) / 255;
      this.b = (hex & 255) / 255;
      return this;
    }
    setRGB(r, g, b) {
      this.r = r;
      this.g = g;
      this.b = b;
      return this;
    }
    setHSL(h, s, l) {
      h = module$math$MathUtils.MathUtils.euclideanModulo(h, 1);
      s = module$math$MathUtils.MathUtils.clamp(s, 0, 1);
      l = module$math$MathUtils.MathUtils.clamp(l, 0, 1);
      if (s === 0) {
        this.r = this.g = this.b = l;
      } else {
        const p = l <= 0.5 ? l * (1 + s) : l + s - l * s;
        const q = 2 * l - p;
        this.r = hue2rgb(q, p, h + 1 / 3);
        this.g = hue2rgb(q, p, h);
        this.b = hue2rgb(q, p, h - 1 / 3);
      }
      return this;
    }
    setStyle(style) {
      function handleAlpha(string) {
        if (string === undefined) {
          return;
        }
        if (parseFloat(string) < 1) {
          console.warn("THREE.Color: Alpha component of " + style + " will be ignored.");
        }
      }
      let m;
      if (m = /^((?:rgb|hsl)a?)\(([^\)]*)\)/.exec(style)) {
        let color;
        const name = m[1];
        const components = m[2];
        switch(name) {
          case "rgb":
          case "rgba":
            if (color = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(components)) {
              this.r = Math.min(255, parseInt(color[1], 10)) / 255;
              this.g = Math.min(255, parseInt(color[2], 10)) / 255;
              this.b = Math.min(255, parseInt(color[3], 10)) / 255;
              handleAlpha(color[4]);
              return this;
            }
            if (color = /^\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(components)) {
              this.r = Math.min(100, parseInt(color[1], 10)) / 100;
              this.g = Math.min(100, parseInt(color[2], 10)) / 100;
              this.b = Math.min(100, parseInt(color[3], 10)) / 100;
              handleAlpha(color[4]);
              return this;
            }
            break;
          case "hsl":
          case "hsla":
            if (color = /^\s*(\d*\.?\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(components)) {
              const h = parseFloat(color[1]) / 360;
              const s = parseInt(color[2], 10) / 100;
              const l = parseInt(color[3], 10) / 100;
              handleAlpha(color[4]);
              return this.setHSL(h, s, l);
            }
            break;
        }
      } else {
        if (m = /^#([A-Fa-f\d]+)$/.exec(style)) {
          const hex = m[1];
          const size = hex.length;
          if (size === 3) {
            this.r = parseInt(hex.charAt(0) + hex.charAt(0), 16) / 255;
            this.g = parseInt(hex.charAt(1) + hex.charAt(1), 16) / 255;
            this.b = parseInt(hex.charAt(2) + hex.charAt(2), 16) / 255;
            return this;
          } else {
            if (size === 6) {
              this.r = parseInt(hex.charAt(0) + hex.charAt(1), 16) / 255;
              this.g = parseInt(hex.charAt(2) + hex.charAt(3), 16) / 255;
              this.b = parseInt(hex.charAt(4) + hex.charAt(5), 16) / 255;
              return this;
            }
          }
        }
      }
      if (style && style.length > 0) {
        return this.setColorName(style);
      }
      return this;
    }
    setColorName(style) {
      const hex = _colorKeywords[style];
      if (hex !== undefined) {
        this.setHex(hex);
      } else {
        console.warn("THREE.Color: Unknown color " + style);
      }
      return this;
    }
    clone() {
      return new this.constructor(this.r, this.g, this.b);
    }
    copy(color) {
      this.r = color.r;
      this.g = color.g;
      this.b = color.b;
      return this;
    }
    copyGammaToLinear(color, gammaFactor = 2.0) {
      this.r = Math.pow(color.r, gammaFactor);
      this.g = Math.pow(color.g, gammaFactor);
      this.b = Math.pow(color.b, gammaFactor);
      return this;
    }
    copyLinearToGamma(color, gammaFactor = 2.0) {
      const safeInverse = gammaFactor > 0 ? 1.0 / gammaFactor : 1.0;
      this.r = Math.pow(color.r, safeInverse);
      this.g = Math.pow(color.g, safeInverse);
      this.b = Math.pow(color.b, safeInverse);
      return this;
    }
    convertGammaToLinear(gammaFactor) {
      this.copyGammaToLinear(this, gammaFactor);
      return this;
    }
    convertLinearToGamma(gammaFactor) {
      this.copyLinearToGamma(this, gammaFactor);
      return this;
    }
    copySRGBToLinear(color) {
      this.r = SRGBToLinear(color.r);
      this.g = SRGBToLinear(color.g);
      this.b = SRGBToLinear(color.b);
      return this;
    }
    copyLinearToSRGB(color) {
      this.r = LinearToSRGB(color.r);
      this.g = LinearToSRGB(color.g);
      this.b = LinearToSRGB(color.b);
      return this;
    }
    convertSRGBToLinear() {
      this.copySRGBToLinear(this);
      return this;
    }
    convertLinearToSRGB() {
      this.copyLinearToSRGB(this);
      return this;
    }
    getHex() {
      return this.r * 255 << 16 ^ this.g * 255 << 8 ^ this.b * 255 << 0;
    }
    getHexString() {
      return ("000000" + this.getHex().toString(16)).slice(-6);
    }
    getHSL(target) {
      if (target === undefined) {
        console.warn("THREE.Color: .getHSL() target is now required");
        target = {h:0, s:0, l:0};
      }
      const r = this.r, g = this.g, b = this.b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let hue, saturation;
      const lightness = (min + max) / 2.0;
      if (min === max) {
        hue = 0;
        saturation = 0;
      } else {
        const delta = max - min;
        saturation = lightness <= 0.5 ? delta / (max + min) : delta / (2 - max - min);
        switch(max) {
          case r:
            hue = (g - b) / delta + (g < b ? 6 : 0);
            break;
          case g:
            hue = (b - r) / delta + 2;
            break;
          case b:
            hue = (r - g) / delta + 4;
            break;
        }
        hue /= 6;
      }
      target.h = hue;
      target.s = saturation;
      target.l = lightness;
      return target;
    }
    getStyle() {
      return "rgb(" + (this.r * 255 | 0) + "," + (this.g * 255 | 0) + "," + (this.b * 255 | 0) + ")";
    }
    offsetHSL(h, s, l) {
      this.getHSL(_hslA);
      _hslA.h += h;
      _hslA.s += s;
      _hslA.l += l;
      this.setHSL(_hslA.h, _hslA.s, _hslA.l);
      return this;
    }
    add(color) {
      this.r += color.r;
      this.g += color.g;
      this.b += color.b;
      return this;
    }
    addColors(color1, color2) {
      this.r = color1.r + color2.r;
      this.g = color1.g + color2.g;
      this.b = color1.b + color2.b;
      return this;
    }
    addScalar(s) {
      this.r += s;
      this.g += s;
      this.b += s;
      return this;
    }
    sub(color) {
      this.r = Math.max(0, this.r - color.r);
      this.g = Math.max(0, this.g - color.g);
      this.b = Math.max(0, this.b - color.b);
      return this;
    }
    multiply(color) {
      this.r *= color.r;
      this.g *= color.g;
      this.b *= color.b;
      return this;
    }
    multiplyScalar(s) {
      this.r *= s;
      this.g *= s;
      this.b *= s;
      return this;
    }
    lerp(color, alpha) {
      this.r += (color.r - this.r) * alpha;
      this.g += (color.g - this.g) * alpha;
      this.b += (color.b - this.b) * alpha;
      return this;
    }
    lerpColors(color1, color2, alpha) {
      this.r = color1.r + (color2.r - color1.r) * alpha;
      this.g = color1.g + (color2.g - color1.g) * alpha;
      this.b = color1.b + (color2.b - color1.b) * alpha;
      return this;
    }
    lerpHSL(color, alpha) {
      this.getHSL(_hslA);
      color.getHSL(_hslB);
      const h = module$math$MathUtils.MathUtils.lerp(_hslA.h, _hslB.h, alpha);
      const s = module$math$MathUtils.MathUtils.lerp(_hslA.s, _hslB.s, alpha);
      const l = module$math$MathUtils.MathUtils.lerp(_hslA.l, _hslB.l, alpha);
      this.setHSL(h, s, l);
      return this;
    }
    equals(c) {
      return c.r === this.r && c.g === this.g && c.b === this.b;
    }
    fromArray(array, offset = 0) {
      this.r = array[offset];
      this.g = array[offset + 1];
      this.b = array[offset + 2];
      return this;
    }
    toArray(array = [], offset = 0) {
      array[offset] = this.r;
      array[offset + 1] = this.g;
      array[offset + 2] = this.b;
      return array;
    }
    fromBufferAttribute(attribute, index) {
      this.r = attribute.getX(index);
      this.g = attribute.getY(index);
      this.b = attribute.getZ(index);
      if (attribute.normalized === true) {
        this.r /= 255;
        this.g /= 255;
        this.b /= 255;
      }
      return this;
    }
    toJSON() {
      return this.getHex();
    }
  }
  Color.NAMES = _colorKeywords;
  Color.prototype.isColor = true;
  Color.prototype.r = 1;
  Color.prototype.g = 1;
  Color.prototype.b = 1;
}, "math/Color.js", ["math/MathUtils.js"]);

//core/BufferAttribute.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {BufferAttribute:{enumerable:true, get:function() {
    return BufferAttribute;
  }}, Float16BufferAttribute:{enumerable:true, get:function() {
    return Float16BufferAttribute;
  }}, Float32BufferAttribute:{enumerable:true, get:function() {
    return Float32BufferAttribute;
  }}, Float64BufferAttribute:{enumerable:true, get:function() {
    return Float64BufferAttribute;
  }}, Int16BufferAttribute:{enumerable:true, get:function() {
    return Int16BufferAttribute;
  }}, Int32BufferAttribute:{enumerable:true, get:function() {
    return Int32BufferAttribute;
  }}, Int8BufferAttribute:{enumerable:true, get:function() {
    return Int8BufferAttribute;
  }}, Uint16BufferAttribute:{enumerable:true, get:function() {
    return Uint16BufferAttribute;
  }}, Uint32BufferAttribute:{enumerable:true, get:function() {
    return Uint32BufferAttribute;
  }}, Uint8BufferAttribute:{enumerable:true, get:function() {
    return Uint8BufferAttribute;
  }}, Uint8ClampedBufferAttribute:{enumerable:true, get:function() {
    return Uint8ClampedBufferAttribute;
  }}});
  var module$math$Vector4 = $$require("math/Vector4.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$math$Vector2 = $$require("math/Vector2.js");
  var module$math$Color = $$require("math/Color.js");
  var module$constants = $$require("constants.js");
  const _vector = new module$math$Vector3.Vector3;
  const _vector2 = new module$math$Vector2.Vector2;
  class BufferAttribute {
    constructor(array, itemSize, normalized) {
      if (Array.isArray(array)) {
        throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");
      }
      this.name = "";
      this.array = array;
      this.itemSize = itemSize;
      console.log("BufferAttribute 1" + (array !== undefined));
      this.count = array !== undefined ? array.length / itemSize : 0;
      this.normalized = normalized === true;
      this.usage = module$constants.StaticDrawUsage;
      this.updateRange = {offset:0, count:-1};
      this.version = 0;
      this.isBufferAttribute = true;
    }
    set needsUpdate(value) {
      if (value === true) {
        this.version++;
      }
    }
    onUploadCallback() {
    }
    setUsage(value) {
      this.usage = value;
      return this;
    }
    copy(source) {
      this.name = source.name;
      this.array = new source.array.constructor(source.array);
      this.itemSize = source.itemSize;
      this.count = source.count;
      this.normalized = source.normalized;
      this.usage = source.usage;
      return this;
    }
    copyAt(index1, attribute, index2) {
      index1 *= this.itemSize;
      index2 *= attribute.itemSize;
      for (let i = 0, l = this.itemSize; i < l; i++) {
        this.array[index1 + i] = attribute.array[index2 + i];
      }
      return this;
    }
    copyArray(array) {
      this.array.set(array);
      return this;
    }
    copyColorsArray(colors) {
      const array = this.array;
      let offset = 0;
      for (let i = 0, l = colors.length; i < l; i++) {
        let color = colors[i];
        if (color === undefined) {
          console.warn("THREE.BufferAttribute.copyColorsArray(): color is undefined", i);
          color = new module$math$Color.Color;
        }
        array[offset++] = color.r;
        array[offset++] = color.g;
        array[offset++] = color.b;
      }
      return this;
    }
    copyVector2sArray(vectors) {
      const array = this.array;
      let offset = 0;
      for (let i = 0, l = vectors.length; i < l; i++) {
        let vector = vectors[i];
        if (vector === undefined) {
          console.warn("THREE.BufferAttribute.copyVector2sArray(): vector is undefined", i);
          vector = new module$math$Vector2.Vector2;
        }
        array[offset++] = vector.x;
        array[offset++] = vector.y;
      }
      return this;
    }
    copyVector3sArray(vectors) {
      const array = this.array;
      let offset = 0;
      for (let i = 0, l = vectors.length; i < l; i++) {
        let vector = vectors[i];
        if (vector === undefined) {
          console.warn("THREE.BufferAttribute.copyVector3sArray(): vector is undefined", i);
          vector = new module$math$Vector3.Vector3;
        }
        array[offset++] = vector.x;
        array[offset++] = vector.y;
        array[offset++] = vector.z;
      }
      return this;
    }
    copyVector4sArray(vectors) {
      const array = this.array;
      let offset = 0;
      for (let i = 0, l = vectors.length; i < l; i++) {
        let vector = vectors[i];
        if (vector === undefined) {
          console.warn("THREE.BufferAttribute.copyVector4sArray(): vector is undefined", i);
          vector = new module$math$Vector4.Vector4;
        }
        array[offset++] = vector.x;
        array[offset++] = vector.y;
        array[offset++] = vector.z;
        array[offset++] = vector.w;
      }
      return this;
    }
    applyMatrix3(m) {
      if (this.itemSize === 2) {
        for (let i = 0, l = this.count; i < l; i++) {
          _vector2.fromBufferAttribute(this, i);
          _vector2.applyMatrix3(m);
          this.setXY(i, _vector2.x, _vector2.y);
        }
      } else {
        if (this.itemSize === 3) {
          for (let i = 0, l = this.count; i < l; i++) {
            _vector.fromBufferAttribute(this, i);
            _vector.applyMatrix3(m);
            this.setXYZ(i, _vector.x, _vector.y, _vector.z);
          }
        }
      }
      return this;
    }
    applyMatrix4(m) {
      for (let i = 0, l = this.count; i < l; i++) {
        _vector.x = this.getX(i);
        _vector.y = this.getY(i);
        _vector.z = this.getZ(i);
        _vector.applyMatrix4(m);
        this.setXYZ(i, _vector.x, _vector.y, _vector.z);
      }
      return this;
    }
    applyNormalMatrix(m) {
      for (let i = 0, l = this.count; i < l; i++) {
        _vector.x = this.getX(i);
        _vector.y = this.getY(i);
        _vector.z = this.getZ(i);
        _vector.applyNormalMatrix(m);
        this.setXYZ(i, _vector.x, _vector.y, _vector.z);
      }
      return this;
    }
    transformDirection(m) {
      for (let i = 0, l = this.count; i < l; i++) {
        _vector.x = this.getX(i);
        _vector.y = this.getY(i);
        _vector.z = this.getZ(i);
        _vector.transformDirection(m);
        this.setXYZ(i, _vector.x, _vector.y, _vector.z);
      }
      return this;
    }
    set(value, offset = 0) {
      this.array.set(value, offset);
      return this;
    }
    getX(index) {
      return this.array[index * this.itemSize];
    }
    setX(index, x) {
      this.array[index * this.itemSize] = x;
      return this;
    }
    getY(index) {
      return this.array[index * this.itemSize + 1];
    }
    setY(index, y) {
      this.array[index * this.itemSize + 1] = y;
      return this;
    }
    getZ(index) {
      return this.array[index * this.itemSize + 2];
    }
    setZ(index, z) {
      this.array[index * this.itemSize + 2] = z;
      return this;
    }
    getW(index) {
      return this.array[index * this.itemSize + 3];
    }
    setW(index, w) {
      this.array[index * this.itemSize + 3] = w;
      return this;
    }
    setXY(index, x, y) {
      index *= this.itemSize;
      this.array[index + 0] = x;
      this.array[index + 1] = y;
      return this;
    }
    setXYZ(index, x, y, z) {
      index *= this.itemSize;
      this.array[index + 0] = x;
      this.array[index + 1] = y;
      this.array[index + 2] = z;
      return this;
    }
    setXYZW(index, x, y, z, w) {
      index *= this.itemSize;
      this.array[index + 0] = x;
      this.array[index + 1] = y;
      this.array[index + 2] = z;
      this.array[index + 3] = w;
      return this;
    }
    onUpload(callback) {
      this.onUploadCallback = callback;
      return this;
    }
    clone() {
      return (new this.constructor(this.array, this.itemSize)).copy(this);
    }
    toJSON() {
      return {itemSize:this.itemSize, type:this.array.constructor.name, array:Array.prototype.slice.call(this.array), normalized:this.normalized};
    }
  }
  class Int8BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
      super(new Int8Array(array), itemSize, normalized);
    }
  }
  class Uint8BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
      super(new Uint8Array(array), itemSize, normalized);
    }
  }
  class Uint8ClampedBufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
      super(new Uint8ClampedArray(array), itemSize, normalized);
    }
  }
  class Int16BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
      super(new Int16Array(array), itemSize, normalized);
    }
  }
  class Uint16BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
      super(new Uint16Array(array), itemSize, normalized);
    }
  }
  class Int32BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
      super(new Int32Array(array), itemSize, normalized);
    }
  }
  class Uint32BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
      super(new Uint32Array(array), itemSize, normalized);
    }
  }
  class Float16BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
      super(new Uint16Array(array), itemSize, normalized);
      Object.defineProperty(this, "isFloat16BufferAttribute", {value:true});
    }
  }
  class Float32BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
      super(new Float32Array(array), itemSize, normalized);
    }
  }
  class Float64BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
      super(new Float64Array(array), itemSize, normalized);
    }
  }
}, "core/BufferAttribute.js", ["math/Vector4.js", "math/Vector3.js", "math/Vector2.js", "math/Color.js", "constants.js"]);

//math/Sphere.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Sphere:{enumerable:true, get:function() {
    return Sphere;
  }}});
  var module$math$Box3 = $$require("math/Box3.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  const _box = new module$math$Box3.Box3;
  class Sphere {
    constructor(center = new module$math$Vector3.Vector3, radius = -1) {
      this.center = center;
      this.radius = radius;
    }
    set(center, radius) {
      this.center.copy(center);
      this.radius = radius;
      return this;
    }
    setFromPoints(points, optionalCenter) {
      const center = this.center;
      if (optionalCenter !== undefined) {
        center.copy(optionalCenter);
      } else {
        _box.setFromPoints(points).getCenter(center);
      }
      let maxRadiusSq = 0;
      for (let i = 0, il = points.length; i < il; i++) {
        maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(points[i]));
      }
      this.radius = Math.sqrt(maxRadiusSq);
      return this;
    }
    copy(sphere) {
      this.center.copy(sphere.center);
      this.radius = sphere.radius;
      return this;
    }
    isEmpty() {
      return this.radius < 0;
    }
    makeEmpty() {
      this.center.set(0, 0, 0);
      this.radius = -1;
      return this;
    }
    containsPoint(point) {
      return point.distanceToSquared(this.center) <= this.radius * this.radius;
    }
    distanceToPoint(point) {
      return point.distanceTo(this.center) - this.radius;
    }
    intersectsSphere(sphere) {
      const radiusSum = this.radius + sphere.radius;
      return sphere.center.distanceToSquared(this.center) <= radiusSum * radiusSum;
    }
    intersectsBox(box) {
      return box.intersectsSphere(this);
    }
    intersectsPlane(plane) {
      return Math.abs(plane.distanceToPoint(this.center)) <= this.radius;
    }
    clampPoint(point, target) {
      const deltaLengthSq = this.center.distanceToSquared(point);
      if (target === undefined) {
        console.warn("THREE.Sphere: .clampPoint() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      target.copy(point);
      if (deltaLengthSq > this.radius * this.radius) {
        target.sub(this.center).normalize();
        target.multiplyScalar(this.radius).add(this.center);
      }
      return target;
    }
    getBoundingBox(target) {
      if (target === undefined) {
        console.warn("THREE.Sphere: .getBoundingBox() target is now required");
        target = new module$math$Box3.Box3;
      }
      if (this.isEmpty()) {
        target.makeEmpty();
        return target;
      }
      target.set(this.center, this.center);
      target.expandByScalar(this.radius);
      return target;
    }
    applyMatrix4(matrix) {
      this.center.applyMatrix4(matrix);
      this.radius = this.radius * matrix.getMaxScaleOnAxis();
      return this;
    }
    translate(offset) {
      this.center.add(offset);
      return this;
    }
    equals(sphere) {
      return sphere.center.equals(this.center) && sphere.radius === this.radius;
    }
    clone() {
      return (new this.constructor).copy(this);
    }
  }
}, "math/Sphere.js", ["math/Box3.js", "math/Vector3.js"]);

//utils.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {arrayMax:{enumerable:true, get:function() {
    return arrayMax;
  }}, arrayMin:{enumerable:true, get:function() {
    return arrayMin;
  }}, getTypedArray:{enumerable:true, get:function() {
    return getTypedArray;
  }}});
  function arrayMin(array) {
    if (array.length === 0) {
      return Infinity;
    }
    let min = array[0];
    for (let i = 1, l = array.length; i < l; ++i) {
      if (array[i] < min) {
        min = array[i];
      }
    }
    return min;
  }
  function arrayMax(array) {
    if (array.length === 0) {
      return -Infinity;
    }
    let max = array[0];
    for (let i = 1, l = array.length; i < l; ++i) {
      if (array[i] > max) {
        max = array[i];
      }
    }
    return max;
  }
  const TYPED_ARRAYS = {Int8Array:Int8Array, Uint8Array:Uint8Array, Uint8ClampedArray:Uint8ClampedArray, Int16Array:Int16Array, Uint16Array:Uint16Array, Int32Array:Int32Array, Uint32Array:Uint32Array, Float32Array:Float32Array, Float64Array:Float64Array};
  function getTypedArray(type, buffer) {
    return new TYPED_ARRAYS[type](buffer);
  }
}, "utils.js", []);

//core/BufferGeometry.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {BufferGeometry:{enumerable:true, get:function() {
    return BufferGeometry;
  }}});
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$math$Vector2 = $$require("math/Vector2.js");
  var module$math$Box3 = $$require("math/Box3.js");
  var module$core$EventDispatcher = $$require("core/EventDispatcher.js");
  var module$core$BufferAttribute = $$require("core/BufferAttribute.js");
  var module$math$Sphere = $$require("math/Sphere.js");
  var module$core$Object3D = $$require("core/Object3D.js");
  var module$math$Matrix4 = $$require("math/Matrix4.js");
  var module$math$Matrix3 = $$require("math/Matrix3.js");
  var module$math$MathUtils = $$require("math/MathUtils.js");
  var module$utils = $$require("utils.js");
  let _id = 0;
  const _m1 = new module$math$Matrix4.Matrix4;
  const _obj = new module$core$Object3D.Object3D;
  const _offset = new module$math$Vector3.Vector3;
  const _box = new module$math$Box3.Box3;
  const _boxMorphTargets = new module$math$Box3.Box3;
  const _vector = new module$math$Vector3.Vector3;
  class BufferGeometry extends module$core$EventDispatcher.EventDispatcher {
    constructor() {
      super();
      this.id = _id++;
      this.uuid = module$math$MathUtils.MathUtils.generateUUID();
      this.name = "";
      this.type = "BufferGeometry";
      this.index = null;
      this.attributes = {};
      this.morphAttributes = {};
      this.morphTargetsRelative = false;
      this.groups = [];
      this.boundingBox = null;
      this.boundingSphere = null;
      this.drawRange = {start:0, count:Infinity};
      this.userData = {};
      this.isBufferGeometry = true;
      this.parameters = null;
    }
    getIndex() {
      return this.index;
    }
    setIndex(index) {
      if (Array.isArray(index)) {
        this.index = new ((0,module$utils.arrayMax)(index) > 65535 ? module$core$BufferAttribute.Uint32BufferAttribute : module$core$BufferAttribute.Uint16BufferAttribute)(index, 1);
      } else {
        this.index = index;
      }
      return this;
    }
    getAttribute(name) {
      return this.attributes[name];
    }
    setAttribute(name, attribute) {
      this.attributes[name] = attribute;
      return this;
    }
    deleteAttribute(name) {
      delete this.attributes[name];
      return this;
    }
    hasAttribute(name) {
      return this.attributes[name] !== undefined;
    }
    addGroup(start, count, materialIndex = 0) {
      this.groups.push({start:start, count:count, materialIndex:materialIndex});
    }
    clearGroups() {
      this.groups = [];
    }
    setDrawRange(start, count) {
      this.drawRange.start = start;
      this.drawRange.count = count;
    }
    applyMatrix4(matrix) {
      const position = this.attributes.position;
      if (position !== undefined) {
        console.log("BufferGeometry 1");
        position.applyMatrix4(matrix);
        position.needsUpdate = true;
      }
      const normal = this.attributes.normal;
      if (normal !== undefined) {
        console.log("BufferGeometry 2");
        const normalMatrix = (new module$math$Matrix3.Matrix3).getNormalMatrix(matrix);
        normal.applyNormalMatrix(normalMatrix);
        normal.needsUpdate = true;
      }
      const tangent = this.attributes.tangent;
      if (tangent !== undefined) {
        console.log("BufferGeometry 3");
        tangent.transformDirection(matrix);
        tangent.needsUpdate = true;
      }
      if (this.boundingBox !== null) {
        this.computeBoundingBox();
      }
      if (this.boundingSphere !== null) {
        this.computeBoundingSphere();
      }
      return this;
    }
    rotateX(angle) {
      _m1.makeRotationX(angle);
      this.applyMatrix4(_m1);
      return this;
    }
    rotateY(angle) {
      _m1.makeRotationY(angle);
      this.applyMatrix4(_m1);
      return this;
    }
    rotateZ(angle) {
      _m1.makeRotationZ(angle);
      this.applyMatrix4(_m1);
      return this;
    }
    translate(x, y, z) {
      _m1.makeTranslation(x, y, z);
      this.applyMatrix4(_m1);
      return this;
    }
    scale(x, y, z) {
      _m1.makeScale(x, y, z);
      this.applyMatrix4(_m1);
      return this;
    }
    lookAt(vector) {
      _obj.lookAt(vector);
      _obj.updateMatrix();
      this.applyMatrix4(_obj.matrix);
      return this;
    }
    center() {
      this.computeBoundingBox();
      this.boundingBox.getCenter(_offset).negate();
      this.translate(_offset.x, _offset.y, _offset.z);
      return this;
    }
    setFromPoints(points) {
      const position = [];
      for (let i = 0, l = points.length; i < l; i++) {
        const point = points[i];
        position.push(point.x, point.y, point.z || 0);
      }
      this.setAttribute("position", new module$core$BufferAttribute.Float32BufferAttribute(position, 3));
      return this;
    }
    computeBoundingBox() {
      if (this.boundingBox === null) {
        this.boundingBox = new module$math$Box3.Box3;
      }
      const position = this.attributes.position;
      const morphAttributesPosition = this.morphAttributes.position;
      if (position && position.isGLBufferAttribute) {
        console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".', this);
        this.boundingBox.set(new module$math$Vector3.Vector3(-Infinity, -Infinity, -Infinity), new module$math$Vector3.Vector3(+Infinity, +Infinity, +Infinity));
        return;
      }
      if (position !== undefined) {
        console.log("BufferGeometry 4");
        this.boundingBox.setFromBufferAttribute(position);
        if (morphAttributesPosition) {
          for (let i = 0, il = morphAttributesPosition.length; i < il; i++) {
            const morphAttribute = morphAttributesPosition[i];
            _box.setFromBufferAttribute(morphAttribute);
            if (this.morphTargetsRelative) {
              _vector.addVectors(this.boundingBox.min, _box.min);
              this.boundingBox.expandByPoint(_vector);
              _vector.addVectors(this.boundingBox.max, _box.max);
              this.boundingBox.expandByPoint(_vector);
            } else {
              this.boundingBox.expandByPoint(_box.min);
              this.boundingBox.expandByPoint(_box.max);
            }
          }
        }
      } else {
        this.boundingBox.makeEmpty();
      }
      if (isNaN(this.boundingBox.min.x) || isNaN(this.boundingBox.min.y) || isNaN(this.boundingBox.min.z)) {
        console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.', this);
      }
    }
    computeBoundingSphere() {
      if (this.boundingSphere === null) {
        this.boundingSphere = new module$math$Sphere.Sphere;
      }
      const position = this.attributes.position;
      const morphAttributesPosition = this.morphAttributes.position;
      if (position && position.isGLBufferAttribute) {
        console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".', this);
        this.boundingSphere.set(new module$math$Vector3.Vector3, Infinity);
        return;
      }
      if (position) {
        const center = this.boundingSphere.center;
        _box.setFromBufferAttribute(position);
        if (morphAttributesPosition) {
          for (let i = 0, il = morphAttributesPosition.length; i < il; i++) {
            const morphAttribute = morphAttributesPosition[i];
            _boxMorphTargets.setFromBufferAttribute(morphAttribute);
            if (this.morphTargetsRelative) {
              _vector.addVectors(_box.min, _boxMorphTargets.min);
              _box.expandByPoint(_vector);
              _vector.addVectors(_box.max, _boxMorphTargets.max);
              _box.expandByPoint(_vector);
            } else {
              _box.expandByPoint(_boxMorphTargets.min);
              _box.expandByPoint(_boxMorphTargets.max);
            }
          }
        }
        _box.getCenter(center);
        let maxRadiusSq = 0;
        for (let i = 0, il = position.count; i < il; i++) {
          _vector.fromBufferAttribute(position, i);
          maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vector));
        }
        if (morphAttributesPosition) {
          for (let i = 0, il = morphAttributesPosition.length; i < il; i++) {
            const morphAttribute = morphAttributesPosition[i];
            const morphTargetsRelative = this.morphTargetsRelative;
            for (let j = 0, jl = morphAttribute.count; j < jl; j++) {
              _vector.fromBufferAttribute(morphAttribute, j);
              if (morphTargetsRelative) {
                _offset.fromBufferAttribute(position, j);
                _vector.add(_offset);
              }
              maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vector));
            }
          }
        }
        this.boundingSphere.radius = Math.sqrt(maxRadiusSq);
        if (isNaN(this.boundingSphere.radius)) {
          console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.', this);
        }
      }
    }
    computeFaceNormals() {
    }
    computeTangents() {
      const index = this.index;
      const attributes = this.attributes;
      if (index === null || attributes.position === undefined || attributes.normal === undefined || attributes.uv === undefined) {
        console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");
        return;
      }
      const indices = index.array;
      const positions = attributes.position.array;
      const normals = attributes.normal.array;
      const uvs = attributes.uv.array;
      const nVertices = positions.length / 3;
      if (attributes.tangent === undefined) {
        this.setAttribute("tangent", new module$core$BufferAttribute.BufferAttribute(new Float32Array(4 * nVertices), 4));
      }
      const tangents = attributes.tangent.array;
      const tan1 = [], tan2 = [];
      for (let i = 0; i < nVertices; i++) {
        tan1[i] = new module$math$Vector3.Vector3;
        tan2[i] = new module$math$Vector3.Vector3;
      }
      const vA = new module$math$Vector3.Vector3, vB = new module$math$Vector3.Vector3, vC = new module$math$Vector3.Vector3, uvA = new module$math$Vector2.Vector2, uvB = new module$math$Vector2.Vector2, uvC = new module$math$Vector2.Vector2, sdir = new module$math$Vector3.Vector3, tdir = new module$math$Vector3.Vector3;
      function handleTriangle(a, b, c) {
        vA.fromArray(positions, a * 3);
        vB.fromArray(positions, b * 3);
        vC.fromArray(positions, c * 3);
        uvA.fromArray(uvs, a * 2);
        uvB.fromArray(uvs, b * 2);
        uvC.fromArray(uvs, c * 2);
        vB.sub(vA);
        vC.sub(vA);
        uvB.sub(uvA);
        uvC.sub(uvA);
        const r = 1.0 / (uvB.x * uvC.y - uvC.x * uvB.y);
        if (!isFinite(r)) {
          return;
        }
        sdir.copy(vB).multiplyScalar(uvC.y).addScaledVector(vC, -uvB.y).multiplyScalar(r);
        tdir.copy(vC).multiplyScalar(uvB.x).addScaledVector(vB, -uvC.x).multiplyScalar(r);
        tan1[a].add(sdir);
        tan1[b].add(sdir);
        tan1[c].add(sdir);
        tan2[a].add(tdir);
        tan2[b].add(tdir);
        tan2[c].add(tdir);
      }
      let groups = this.groups;
      if (groups.length === 0) {
        groups = [{start:0, count:indices.length}];
      }
      for (let i = 0, il = groups.length; i < il; ++i) {
        const group = groups[i];
        const start = group.start;
        const count = group.count;
        for (let j = start, jl = start + count; j < jl; j += 3) {
          handleTriangle(indices[j + 0], indices[j + 1], indices[j + 2]);
        }
      }
      const tmp = new module$math$Vector3.Vector3, tmp2 = new module$math$Vector3.Vector3;
      const n = new module$math$Vector3.Vector3, n2 = new module$math$Vector3.Vector3;
      function handleVertex(v) {
        n.fromArray(normals, v * 3);
        n2.copy(n);
        const t = tan1[v];
        tmp.copy(t);
        tmp.sub(n.multiplyScalar(n.dot(t))).normalize();
        tmp2.crossVectors(n2, t);
        const test = tmp2.dot(tan2[v]);
        const w = test < 0.0 ? -1 : 1.0;
        tangents[v * 4] = tmp.x;
        tangents[v * 4 + 1] = tmp.y;
        tangents[v * 4 + 2] = tmp.z;
        tangents[v * 4 + 3] = w;
      }
      for (let i = 0, il = groups.length; i < il; ++i) {
        const group = groups[i];
        const start = group.start;
        const count = group.count;
        for (let j = start, jl = start + count; j < jl; j += 3) {
          handleVertex(indices[j + 0]);
          handleVertex(indices[j + 1]);
          handleVertex(indices[j + 2]);
        }
      }
    }
    computeVertexNormals() {
      const index = this.index;
      const positionAttribute = this.getAttribute("position");
      if (positionAttribute !== undefined) {
        console.log("BufferGeometry 5");
        let normalAttribute = this.getAttribute("normal");
        if (normalAttribute === undefined) {
          normalAttribute = new module$core$BufferAttribute.BufferAttribute(new Float32Array(positionAttribute.count * 3), 3);
          this.setAttribute("normal", normalAttribute);
        } else {
          for (let i = 0, il = normalAttribute.count; i < il; i++) {
            normalAttribute.setXYZ(i, 0, 0, 0);
          }
        }
        const pA = new module$math$Vector3.Vector3, pB = new module$math$Vector3.Vector3, pC = new module$math$Vector3.Vector3;
        const nA = new module$math$Vector3.Vector3, nB = new module$math$Vector3.Vector3, nC = new module$math$Vector3.Vector3;
        const cb = new module$math$Vector3.Vector3, ab = new module$math$Vector3.Vector3;
        if (index) {
          for (let i = 0, il = index.count; i < il; i += 3) {
            const vA = index.getX(i + 0);
            const vB = index.getX(i + 1);
            const vC = index.getX(i + 2);
            pA.fromBufferAttribute(positionAttribute, vA);
            pB.fromBufferAttribute(positionAttribute, vB);
            pC.fromBufferAttribute(positionAttribute, vC);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            nA.fromBufferAttribute(normalAttribute, vA);
            nB.fromBufferAttribute(normalAttribute, vB);
            nC.fromBufferAttribute(normalAttribute, vC);
            nA.add(cb);
            nB.add(cb);
            nC.add(cb);
            normalAttribute.setXYZ(vA, nA.x, nA.y, nA.z);
            normalAttribute.setXYZ(vB, nB.x, nB.y, nB.z);
            normalAttribute.setXYZ(vC, nC.x, nC.y, nC.z);
          }
        } else {
          for (let i = 0, il = positionAttribute.count; i < il; i += 3) {
            pA.fromBufferAttribute(positionAttribute, i + 0);
            pB.fromBufferAttribute(positionAttribute, i + 1);
            pC.fromBufferAttribute(positionAttribute, i + 2);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            normalAttribute.setXYZ(i + 0, cb.x, cb.y, cb.z);
            normalAttribute.setXYZ(i + 1, cb.x, cb.y, cb.z);
            normalAttribute.setXYZ(i + 2, cb.x, cb.y, cb.z);
          }
        }
        this.normalizeNormals();
        normalAttribute.needsUpdate = true;
      }
    }
    merge(geometry, offset) {
      if (!(geometry && geometry.isBufferGeometry)) {
        console.error("THREE.BufferGeometry.merge(): geometry not an instance of THREE.BufferGeometry.", geometry);
        return;
      }
      if (offset === undefined) {
        offset = 0;
        console.warn("THREE.BufferGeometry.merge(): Overwriting original geometry, starting at offset\x3d0. " + "Use BufferGeometryUtils.mergeBufferGeometries() for lossless merge.");
      }
      const attributes = this.attributes;
      for (const key in attributes) {
        if (geometry.attributes[key] === undefined) {
          continue;
        }
        const attribute1 = attributes[key];
        const attributeArray1 = attribute1.array;
        const attribute2 = geometry.attributes[key];
        const attributeArray2 = attribute2.array;
        const attributeOffset = attribute2.itemSize * offset;
        const length = Math.min(attributeArray2.length, attributeArray1.length - attributeOffset);
        for (let i = 0, j = attributeOffset; i < length; i++, j++) {
          attributeArray1[j] = attributeArray2[i];
        }
      }
      return this;
    }
    normalizeNormals() {
      const normals = this.attributes.normal;
      for (let i = 0, il = normals.count; i < il; i++) {
        _vector.fromBufferAttribute(normals, i);
        _vector.normalize();
        normals.setXYZ(i, _vector.x, _vector.y, _vector.z);
      }
    }
    toNonIndexed() {
      function convertBufferAttribute(attribute, indices) {
        const array = attribute.array;
        const itemSize = attribute.itemSize;
        const normalized = attribute.normalized;
        const array2 = new array.constructor(indices.length * itemSize);
        let index = 0, index2 = 0;
        for (let i = 0, l = indices.length; i < l; i++) {
          index = indices[i] * itemSize;
          for (let j = 0; j < itemSize; j++) {
            array2[index2++] = array[index++];
          }
        }
        return new module$core$BufferAttribute.BufferAttribute(array2, itemSize, normalized);
      }
      if (this.index === null) {
        console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.");
        return this;
      }
      const geometry2 = new BufferGeometry;
      const indices = this.index.array;
      const attributes = this.attributes;
      for (const name in attributes) {
        const attribute = attributes[name];
        const newAttribute = convertBufferAttribute(attribute, indices);
        geometry2.setAttribute(name, newAttribute);
      }
      const morphAttributes = this.morphAttributes;
      for (const name in morphAttributes) {
        const morphArray = [];
        const morphAttribute = morphAttributes[name];
        for (let i = 0, il = morphAttribute.length; i < il; i++) {
          const attribute = morphAttribute[i];
          const newAttribute = convertBufferAttribute(attribute, indices);
          morphArray.push(newAttribute);
        }
        geometry2.morphAttributes[name] = morphArray;
      }
      geometry2.morphTargetsRelative = this.morphTargetsRelative;
      const groups = this.groups;
      for (let i = 0, l = groups.length; i < l; i++) {
        const group = groups[i];
        geometry2.addGroup(group.start, group.count, group.materialIndex);
      }
      return geometry2;
    }
    toJSON() {
      const data = {metadata:{version:4.5, type:"BufferGeometry", generator:"BufferGeometry.toJSON"}};
      data.uuid = this.uuid;
      data.type = this.type;
      if (this.name !== "") {
        data.name = this.name;
      }
      if (Object.keys(this.userData).length > 0) {
        data.userData = this.userData;
      }
      if (this.parameters !== undefined) {
        console.log("BufferGeometry 6");
        const parameters = this.parameters;
        for (const key in parameters) {
          console.log("CHECK THIS " + key + (parameters[key] !== undefined));
          if (parameters[key] !== undefined) {
            data[key] = parameters[key];
          }
        }
        return data;
      }
      data.data = {attributes:{}};
      const index = this.index;
      if (index !== null) {
        data.data.index = {type:index.array.constructor.name, array:Array.prototype.slice.call(index.array)};
      }
      const attributes = this.attributes;
      for (const key in attributes) {
        const attribute = attributes[key];
        const attributeData = attribute.toJSON(data.data);
        if (attribute.name !== "") {
          attributeData.name = attribute.name;
        }
        data.data.attributes[key] = attributeData;
      }
      const morphAttributes = {};
      let hasMorphAttributes = false;
      for (const key in this.morphAttributes) {
        const attributeArray = this.morphAttributes[key];
        const array = [];
        for (let i = 0, il = attributeArray.length; i < il; i++) {
          const attribute = attributeArray[i];
          const attributeData = attribute.toJSON(data.data);
          if (attribute.name !== "") {
            attributeData.name = attribute.name;
          }
          array.push(attributeData);
        }
        if (array.length > 0) {
          morphAttributes[key] = array;
          hasMorphAttributes = true;
        }
      }
      if (hasMorphAttributes) {
        data.data.morphAttributes = morphAttributes;
        data.data.morphTargetsRelative = this.morphTargetsRelative;
      }
      const groups = this.groups;
      if (groups.length > 0) {
        data.data.groups = JSON.parse(JSON.stringify(groups));
      }
      const boundingSphere = this.boundingSphere;
      if (boundingSphere !== null) {
        data.data.boundingSphere = {center:boundingSphere.center.toArray(), radius:boundingSphere.radius};
      }
      return data;
    }
    clone() {
      return (new BufferGeometry).copy(this);
    }
    copy(source) {
      this.index = null;
      this.attributes = {};
      this.morphAttributes = {};
      this.groups = [];
      this.boundingBox = null;
      this.boundingSphere = null;
      const data = {};
      this.name = source.name;
      const index = source.index;
      if (index !== null) {
        this.setIndex(index.clone(data));
      }
      const attributes = source.attributes;
      for (const name in attributes) {
        const attribute = attributes[name];
        this.setAttribute(name, attribute.clone(data));
      }
      const morphAttributes = source.morphAttributes;
      for (const name in morphAttributes) {
        const array = [];
        const morphAttribute = morphAttributes[name];
        for (let i = 0, l = morphAttribute.length; i < l; i++) {
          array.push(morphAttribute[i].clone(data));
        }
        this.morphAttributes[name] = array;
      }
      this.morphTargetsRelative = source.morphTargetsRelative;
      const groups = source.groups;
      for (let i = 0, l = groups.length; i < l; i++) {
        const group = groups[i];
        this.addGroup(group.start, group.count, group.materialIndex);
      }
      const boundingBox = source.boundingBox;
      if (boundingBox !== null) {
        this.boundingBox = boundingBox.clone();
      }
      const boundingSphere = source.boundingSphere;
      if (boundingSphere !== null) {
        this.boundingSphere = boundingSphere.clone();
      }
      this.drawRange.start = source.drawRange.start;
      this.drawRange.count = source.drawRange.count;
      this.userData = source.userData;
      return this;
    }
    dispose() {
      this.dispatchEvent({type:"dispose"});
    }
  }
}, "core/BufferGeometry.js", ["math/Vector3.js", "math/Vector2.js", "math/Box3.js", "core/EventDispatcher.js", "core/BufferAttribute.js", "math/Sphere.js", "core/Object3D.js", "math/Matrix4.js", "math/Matrix3.js", "math/MathUtils.js", "utils.js"]);

//geometries/BoxGeometry.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {BoxBufferGeometry:{enumerable:true, get:function() {
    return BoxGeometry;
  }}, BoxGeometry:{enumerable:true, get:function() {
    return BoxGeometry;
  }}});
  var module$core$BufferGeometry = $$require("core/BufferGeometry.js");
  var module$core$BufferAttribute = $$require("core/BufferAttribute.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  class BoxGeometry extends module$core$BufferGeometry.BufferGeometry {
    constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
      super();
      this.type = "BoxGeometry";
      this.parameters = {width:width, height:height, depth:depth, widthSegments:widthSegments, heightSegments:heightSegments, depthSegments:depthSegments};
      const scope = this;
      widthSegments = Math.floor(widthSegments);
      heightSegments = Math.floor(heightSegments);
      depthSegments = Math.floor(depthSegments);
      const indices = [];
      const vertices = [];
      const normals = [];
      const uvs = [];
      let numberOfVertices = 0;
      let groupStart = 0;
      buildPlane("z", "y", "x", -1, -1, depth, height, width, depthSegments, heightSegments, 0);
      buildPlane("z", "y", "x", 1, -1, depth, height, -width, depthSegments, heightSegments, 1);
      buildPlane("x", "z", "y", 1, 1, width, depth, height, widthSegments, depthSegments, 2);
      buildPlane("x", "z", "y", 1, -1, width, depth, -height, widthSegments, depthSegments, 3);
      buildPlane("x", "y", "z", 1, -1, width, height, depth, widthSegments, heightSegments, 4);
      buildPlane("x", "y", "z", -1, -1, width, height, -depth, widthSegments, heightSegments, 5);
      this.setIndex(indices);
      this.setAttribute("position", new module$core$BufferAttribute.Float32BufferAttribute(vertices, 3));
      this.setAttribute("normal", new module$core$BufferAttribute.Float32BufferAttribute(normals, 3));
      this.setAttribute("uv", new module$core$BufferAttribute.Float32BufferAttribute(uvs, 2));
      function buildPlane(u, v, w, udir, vdir, width, height, depth, gridX, gridY, materialIndex) {
        const segmentWidth = width / gridX;
        const segmentHeight = height / gridY;
        const widthHalf = width / 2;
        const heightHalf = height / 2;
        const depthHalf = depth / 2;
        const gridX1 = gridX + 1;
        const gridY1 = gridY + 1;
        let vertexCounter = 0;
        let groupCount = 0;
        const vector = new module$math$Vector3.Vector3;
        for (let iy = 0; iy < gridY1; iy++) {
          const y = iy * segmentHeight - heightHalf;
          for (let ix = 0; ix < gridX1; ix++) {
            const x = ix * segmentWidth - widthHalf;
            vector[u] = x * udir;
            vector[v] = y * vdir;
            vector[w] = depthHalf;
            vertices.push(vector.x, vector.y, vector.z);
            vector[u] = 0;
            vector[v] = 0;
            vector[w] = depth > 0 ? 1 : -1;
            normals.push(vector.x, vector.y, vector.z);
            uvs.push(ix / gridX);
            uvs.push(1 - iy / gridY);
            vertexCounter += 1;
          }
        }
        for (let iy = 0; iy < gridY; iy++) {
          for (let ix = 0; ix < gridX; ix++) {
            const a = numberOfVertices + ix + gridX1 * iy;
            const b = numberOfVertices + ix + gridX1 * (iy + 1);
            const c = numberOfVertices + (ix + 1) + gridX1 * (iy + 1);
            const d = numberOfVertices + (ix + 1) + gridX1 * iy;
            indices.push(a, b, d);
            indices.push(b, c, d);
            groupCount += 6;
          }
        }
        scope.addGroup(groupStart, groupCount, materialIndex);
        groupStart += groupCount;
        numberOfVertices += vertexCounter;
      }
    }
  }
}, "geometries/BoxGeometry.js", ["core/BufferGeometry.js", "core/BufferAttribute.js", "math/Vector3.js"]);

//materials/Material.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Material:{enumerable:true, get:function() {
    return Material;
  }}});
  var module$core$EventDispatcher = $$require("core/EventDispatcher.js");
  var module$constants = $$require("constants.js");
  var module$math$MathUtils = $$require("math/MathUtils.js");
  var module$math$Vector2 = $$require("math/Vector2.js");
  let materialId = 0;
  class Material extends module$core$EventDispatcher.EventDispatcher {
    constructor() {
      super();
      this.id = materialId++;
      this.uuid = module$math$MathUtils.MathUtils.generateUUID();
      this.name = "";
      this.type = "Material";
      this.fog = true;
      this.blending = module$constants.NormalBlending;
      this.side = module$constants.FrontSide;
      this.vertexColors = false;
      this.opacity = 1;
      this.transparent = false;
      this.blendSrc = module$constants.SrcAlphaFactor;
      this.blendDst = module$constants.OneMinusSrcAlphaFactor;
      this.blendEquation = module$constants.AddEquation;
      this.blendSrcAlpha = null;
      this.blendDstAlpha = null;
      this.blendEquationAlpha = null;
      this.depthFunc = module$constants.LessEqualDepth;
      this.depthTest = true;
      this.depthWrite = true;
      this.stencilWriteMask = 255;
      this.stencilFunc = module$constants.AlwaysStencilFunc;
      this.stencilRef = 0;
      this.stencilFuncMask = 255;
      this.stencilFail = module$constants.KeepStencilOp;
      this.stencilZFail = module$constants.KeepStencilOp;
      this.stencilZPass = module$constants.KeepStencilOp;
      this.stencilWrite = false;
      this.clippingPlanes = null;
      this.clipIntersection = false;
      this.clipShadows = false;
      this.shadowSide = null;
      this.colorWrite = true;
      this.precision = null;
      this.polygonOffset = false;
      this.polygonOffsetFactor = 0;
      this.polygonOffsetUnits = 0;
      this.dithering = false;
      this.alphaTest = 0;
      this.premultipliedAlpha = false;
      this.visible = true;
      this.toneMapped = true;
      this.userData = {};
      this.version = 0;
      this.isMaterial = true;
      this.flatShading = undefined;
      this.color = undefined;
      this.roughness = undefined;
      this.metalness = undefined;
      this.sheen = undefined;
      this.emissive = undefined;
      this.emissiveIntensity = undefined;
      this.specular = undefined;
      this.shininess = undefined;
      this.clearcoat = undefined;
      this.clearcoatRoughness = undefined;
      this.clearcoatMap = undefined;
      this.clearcoatRoughnessMap = undefined;
      this.clearcoatNormalMap = undefined;
      this.clearcoatNormalMap = undefined;
      this.clearcoatNormalScale;
      this.map = undefined;
      this.matcap = undefined;
      this.alphaMap = undefined;
      this.lightMap = undefined;
      this.lightMapIntensity = undefined;
      this.aoMap = undefined;
      this.aoMapIntensity = undefined;
      this.bumpMap = undefined;
      this.bumpScale = undefined;
      this.normalMap = undefined;
      this.normalMapType = undefined;
      this.normalScale;
      this.displacementMap = undefined;
      this.displacementScale = undefined;
      this.displacementBias = undefined;
      this.roughnessMap = undefined;
      this.metalnessMap = undefined;
      this.emissiveMap = undefined;
      this.envMap = undefined;
      this.reflectivity = undefined;
      this.refractionRatio = undefined;
      this.combine = undefined;
      this.envMapIntensity = undefined;
      this.gradientMap = undefined;
      this.size = undefined;
      this.sizeAttenuation = undefined;
      this.rotation = undefined;
      this.linewidth = undefined;
      this.dashSize = undefined;
      this.gapSize = undefined;
      this.scale = undefined;
      this.wireframe = undefined;
      this.wireframeLinewidth;
      this.wireframeLinecap = undefined;
      this.wireframeLinejoin = undefined;
      this.morphTargets = undefined;
      this.morphNormals = undefined;
      this.skinning = undefined;
      this.specularMap = undefined;
    }
    onBeforeCompile() {
    }
    customProgramCacheKey() {
      return this.onBeforeCompile.toString();
    }
    setValues(values) {
      if (values === undefined) {
        return;
      }
      for (const key in values) {
        const newValue = values[key];
        if (newValue === undefined) {
          console.warn("THREE.Material: '" + key + "' parameter is undefined.");
          continue;
        }
        if (key === "shading") {
          console.warn("THREE." + this.type + ": .shading has been removed. Use the boolean .flatShading instead.");
          this.flatShading = newValue === module$constants.FlatShading ? true : false;
          continue;
        }
        const currentValue = this[key];
        if (currentValue === undefined) {
          console.warn("THREE." + this.type + ": '" + key + "' is not a property of this material.");
          continue;
        }
        if (currentValue && currentValue.isColor) {
          currentValue.set(newValue);
        } else {
          if (currentValue && currentValue.isVector3 && (newValue && newValue.isVector3)) {
            currentValue.copy(newValue);
          } else {
            this[key] = newValue;
          }
        }
      }
    }
    toJSON(meta) {
      const isRoot = meta === undefined || typeof meta === "string";
      if (isRoot) {
        meta = {textures:{}, images:{}};
      }
      const data = {metadata:{version:4.5, type:"Material", generator:"Material.toJSON"}};
      data.uuid = this.uuid;
      data.type = this.type;
      if (this.name !== "") {
        data.name = this.name;
      }
      if (this.color && this.color.isColor) {
        data.color = this.color.getHex();
      }
      if (this.roughness !== undefined) {
        data.roughness = this.roughness;
      }
      if (this.metalness !== undefined) {
        data.metalness = this.metalness;
      }
      if (this.sheen && this.sheen.isColor) {
        data.sheen = this.sheen.getHex();
      }
      if (this.emissive && this.emissive.isColor) {
        data.emissive = this.emissive.getHex();
      }
      if (this.emissiveIntensity && this.emissiveIntensity !== 1) {
        data.emissiveIntensity = this.emissiveIntensity;
      }
      if (this.specular && this.specular.isColor) {
        data.specular = this.specular.getHex();
      }
      if (this.shininess !== undefined) {
        data.shininess = this.shininess;
      }
      if (this.clearcoat !== undefined) {
        data.clearcoat = this.clearcoat;
      }
      if (this.clearcoatRoughness !== undefined) {
        data.clearcoatRoughness = this.clearcoatRoughness;
      }
      if (this.clearcoatMap && this.clearcoatMap.isTexture) {
        data.clearcoatMap = this.clearcoatMap.toJSON(meta).uuid;
      }
      if (this.clearcoatRoughnessMap && this.clearcoatRoughnessMap.isTexture) {
        data.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON(meta).uuid;
      }
      if (this.clearcoatNormalMap && this.clearcoatNormalMap.isTexture) {
        data.clearcoatNormalMap = this.clearcoatNormalMap.toJSON(meta).uuid;
        data.clearcoatNormalScale = this.clearcoatNormalScale.toArray();
      }
      if (this.map && this.map.isTexture) {
        data.map = this.map.toJSON(meta).uuid;
      }
      if (this.matcap && this.matcap.isTexture) {
        data.matcap = this.matcap.toJSON(meta).uuid;
      }
      if (this.alphaMap && this.alphaMap.isTexture) {
        data.alphaMap = this.alphaMap.toJSON(meta).uuid;
      }
      if (this.lightMap && this.lightMap.isTexture) {
        data.lightMap = this.lightMap.toJSON(meta).uuid;
        data.lightMapIntensity = this.lightMapIntensity;
      }
      if (this.aoMap && this.aoMap.isTexture) {
        data.aoMap = this.aoMap.toJSON(meta).uuid;
        data.aoMapIntensity = this.aoMapIntensity;
      }
      if (this.bumpMap && this.bumpMap.isTexture) {
        data.bumpMap = this.bumpMap.toJSON(meta).uuid;
        data.bumpScale = this.bumpScale;
      }
      if (this.normalMap && this.normalMap.isTexture) {
        data.normalMap = this.normalMap.toJSON(meta).uuid;
        data.normalMapType = this.normalMapType;
        data.normalScale = this.normalScale.toArray();
      }
      if (this.displacementMap && this.displacementMap.isTexture) {
        data.displacementMap = this.displacementMap.toJSON(meta).uuid;
        data.displacementScale = this.displacementScale;
        data.displacementBias = this.displacementBias;
      }
      if (this.roughnessMap && this.roughnessMap.isTexture) {
        data.roughnessMap = this.roughnessMap.toJSON(meta).uuid;
      }
      if (this.metalnessMap && this.metalnessMap.isTexture) {
        data.metalnessMap = this.metalnessMap.toJSON(meta).uuid;
      }
      if (this.emissiveMap && this.emissiveMap.isTexture) {
        data.emissiveMap = this.emissiveMap.toJSON(meta).uuid;
      }
      if (this.specularMap && this.specularMap.isTexture) {
        data.specularMap = this.specularMap.toJSON(meta).uuid;
      }
      if (this.envMap && this.envMap.isTexture) {
        data.envMap = this.envMap.toJSON(meta).uuid;
        data.reflectivity = this.reflectivity;
        data.refractionRatio = this.refractionRatio;
        if (this.combine !== undefined) {
          data.combine = this.combine;
        }
        if (this.envMapIntensity !== undefined) {
          data.envMapIntensity = this.envMapIntensity;
        }
      }
      if (this.gradientMap && this.gradientMap.isTexture) {
        data.gradientMap = this.gradientMap.toJSON(meta).uuid;
      }
      if (this.size !== undefined) {
        data.size = this.size;
      }
      if (this.sizeAttenuation !== undefined) {
        data.sizeAttenuation = this.sizeAttenuation;
      }
      if (this.blending !== module$constants.NormalBlending) {
        data.blending = this.blending;
      }
      if (this.side !== module$constants.FrontSide) {
        data.side = this.side;
      }
      if (this.vertexColors) {
        data.vertexColors = true;
      }
      if (this.opacity < 1) {
        data.opacity = this.opacity;
      }
      if (this.transparent === true) {
        data.transparent = this.transparent;
      }
      data.depthFunc = this.depthFunc;
      data.depthTest = this.depthTest;
      data.depthWrite = this.depthWrite;
      data.stencilWrite = this.stencilWrite;
      data.stencilWriteMask = this.stencilWriteMask;
      data.stencilFunc = this.stencilFunc;
      data.stencilRef = this.stencilRef;
      data.stencilFuncMask = this.stencilFuncMask;
      data.stencilFail = this.stencilFail;
      data.stencilZFail = this.stencilZFail;
      data.stencilZPass = this.stencilZPass;
      if (this.rotation && this.rotation !== 0) {
        data.rotation = this.rotation;
      }
      if (this.polygonOffset === true) {
        data.polygonOffset = true;
      }
      if (this.polygonOffsetFactor !== 0) {
        data.polygonOffsetFactor = this.polygonOffsetFactor;
      }
      if (this.polygonOffsetUnits !== 0) {
        data.polygonOffsetUnits = this.polygonOffsetUnits;
      }
      if (this.linewidth && this.linewidth !== 1) {
        data.linewidth = this.linewidth;
      }
      if (this.dashSize !== undefined) {
        data.dashSize = this.dashSize;
      }
      if (this.gapSize !== undefined) {
        data.gapSize = this.gapSize;
      }
      if (this.scale !== undefined) {
        data.scale = this.scale;
      }
      if (this.dithering === true) {
        data.dithering = true;
      }
      if (this.alphaTest > 0) {
        data.alphaTest = this.alphaTest;
      }
      if (this.premultipliedAlpha === true) {
        data.premultipliedAlpha = this.premultipliedAlpha;
      }
      if (this.wireframe === true) {
        data.wireframe = this.wireframe;
      }
      if (this.wireframeLinewidth > 1) {
        data.wireframeLinewidth = this.wireframeLinewidth;
      }
      if (this.wireframeLinecap !== "round") {
        data.wireframeLinecap = this.wireframeLinecap;
      }
      if (this.wireframeLinejoin !== "round") {
        data.wireframeLinejoin = this.wireframeLinejoin;
      }
      if (this.morphTargets === true) {
        data.morphTargets = true;
      }
      if (this.morphNormals === true) {
        data.morphNormals = true;
      }
      if (this.skinning === true) {
        data.skinning = true;
      }
      if (this.flatShading === true) {
        data.flatShading = this.flatShading;
      }
      if (this.visible === false) {
        data.visible = false;
      }
      if (this.toneMapped === false) {
        data.toneMapped = false;
      }
      if (JSON.stringify(this.userData) !== "{}") {
        data.userData = this.userData;
      }
      function extractFromCache(cache) {
        const values = [];
        for (const key in cache) {
          const data = cache[key];
          delete data.metadata;
          values.push(data);
        }
        return values;
      }
      if (isRoot) {
        const textures = extractFromCache(meta.textures);
        const images = extractFromCache(meta.images);
        if (textures.length > 0) {
          data.textures = textures;
        }
        if (images.length > 0) {
          data.images = images;
        }
      }
      return data;
    }
    clone() {
      return (new this.constructor).copy(this);
    }
    copy(source) {
      this.name = source.name;
      this.fog = source.fog;
      this.blending = source.blending;
      this.side = source.side;
      this.vertexColors = source.vertexColors;
      this.opacity = source.opacity;
      this.transparent = source.transparent;
      this.blendSrc = source.blendSrc;
      this.blendDst = source.blendDst;
      this.blendEquation = source.blendEquation;
      this.blendSrcAlpha = source.blendSrcAlpha;
      this.blendDstAlpha = source.blendDstAlpha;
      this.blendEquationAlpha = source.blendEquationAlpha;
      this.depthFunc = source.depthFunc;
      this.depthTest = source.depthTest;
      this.depthWrite = source.depthWrite;
      this.stencilWriteMask = source.stencilWriteMask;
      this.stencilFunc = source.stencilFunc;
      this.stencilRef = source.stencilRef;
      this.stencilFuncMask = source.stencilFuncMask;
      this.stencilFail = source.stencilFail;
      this.stencilZFail = source.stencilZFail;
      this.stencilZPass = source.stencilZPass;
      this.stencilWrite = source.stencilWrite;
      const srcPlanes = source.clippingPlanes;
      let dstPlanes = null;
      if (srcPlanes !== null) {
        const n = srcPlanes.length;
        dstPlanes = new Array(n);
        for (let i = 0; i !== n; ++i) {
          dstPlanes[i] = srcPlanes[i].clone();
        }
      }
      this.clippingPlanes = dstPlanes;
      this.clipIntersection = source.clipIntersection;
      this.clipShadows = source.clipShadows;
      this.shadowSide = source.shadowSide;
      this.colorWrite = source.colorWrite;
      this.precision = source.precision;
      this.polygonOffset = source.polygonOffset;
      this.polygonOffsetFactor = source.polygonOffsetFactor;
      this.polygonOffsetUnits = source.polygonOffsetUnits;
      this.dithering = source.dithering;
      this.alphaTest = source.alphaTest;
      this.premultipliedAlpha = source.premultipliedAlpha;
      this.visible = source.visible;
      this.toneMapped = source.toneMapped;
      this.userData = JSON.parse(JSON.stringify(source.userData));
      return this;
    }
    dispose() {
      this.dispatchEvent({type:"dispose"});
    }
  }
  Object.defineProperty(Material.prototype, "needsUpdate", {set(value) {
    if (value === true) {
      this.version++;
    }
  }});
}, "materials/Material.js", ["core/EventDispatcher.js", "constants.js", "math/MathUtils.js", "math/Vector2.js"]);

//materials/MeshBasicMaterial.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {MeshBasicMaterial:{enumerable:true, get:function() {
    return MeshBasicMaterial;
  }}});
  var module$materials$Material = $$require("materials/Material.js");
  var module$constants = $$require("constants.js");
  var module$math$Color = $$require("math/Color.js");
  class MeshBasicMaterial extends module$materials$Material.Material {
    constructor(parameters) {
      super();
      this.type = "MeshBasicMaterial";
      this.color = new module$math$Color.Color(16777215);
      this.map = null;
      this.lightMap = null;
      this.lightMapIntensity = 1.0;
      this.aoMap = null;
      this.aoMapIntensity = 1.0;
      this.specularMap = null;
      this.alphaMap = null;
      this.envMap = null;
      this.combine = module$constants.MultiplyOperation;
      this.reflectivity = 1;
      this.refractionRatio = 0.98;
      this.wireframe = false;
      this.wireframeLinewidth = 1;
      this.wireframeLinecap = "round";
      this.wireframeLinejoin = "round";
      this.skinning = false;
      this.morphTargets = false;
      this.setValues(parameters);
    }
    copy(source) {
      super.copy(source);
      this.color.copy(source.color);
      this.map = source.map;
      this.lightMap = source.lightMap;
      this.lightMapIntensity = source.lightMapIntensity;
      this.aoMap = source.aoMap;
      this.aoMapIntensity = source.aoMapIntensity;
      this.specularMap = source.specularMap;
      this.alphaMap = source.alphaMap;
      this.envMap = source.envMap;
      this.combine = source.combine;
      this.reflectivity = source.reflectivity;
      this.refractionRatio = source.refractionRatio;
      this.wireframe = source.wireframe;
      this.wireframeLinewidth = source.wireframeLinewidth;
      this.wireframeLinecap = source.wireframeLinecap;
      this.wireframeLinejoin = source.wireframeLinejoin;
      this.skinning = source.skinning;
      this.morphTargets = source.morphTargets;
      return this;
    }
  }
  MeshBasicMaterial.prototype.isMeshBasicMaterial = true;
}, "materials/MeshBasicMaterial.js", ["materials/Material.js", "constants.js", "math/Color.js"]);

//math/Ray.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Ray:{enumerable:true, get:function() {
    return Ray;
  }}});
  var module$math$Vector3 = $$require("math/Vector3.js");
  const _vector = new module$math$Vector3.Vector3;
  const _segCenter = new module$math$Vector3.Vector3;
  const _segDir = new module$math$Vector3.Vector3;
  const _diff = new module$math$Vector3.Vector3;
  const _edge1 = new module$math$Vector3.Vector3;
  const _edge2 = new module$math$Vector3.Vector3;
  const _normal = new module$math$Vector3.Vector3;
  class Ray {
    constructor(origin = new module$math$Vector3.Vector3, direction = new module$math$Vector3.Vector3(0, 0, -1)) {
      this.origin = origin;
      this.direction = direction;
    }
    set(origin, direction) {
      this.origin.copy(origin);
      this.direction.copy(direction);
      return this;
    }
    copy(ray) {
      this.origin.copy(ray.origin);
      this.direction.copy(ray.direction);
      return this;
    }
    at(t, target) {
      if (target === undefined) {
        console.warn("THREE.Ray: .at() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      return target.copy(this.direction).multiplyScalar(t).add(this.origin);
    }
    lookAt(v) {
      this.direction.copy(v).sub(this.origin).normalize();
      return this;
    }
    recast(t) {
      this.origin.copy(this.at(t, _vector));
      return this;
    }
    closestPointToPoint(point, target) {
      if (target === undefined) {
        console.warn("THREE.Ray: .closestPointToPoint() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      target.subVectors(point, this.origin);
      const directionDistance = target.dot(this.direction);
      if (directionDistance < 0) {
        return target.copy(this.origin);
      }
      return target.copy(this.direction).multiplyScalar(directionDistance).add(this.origin);
    }
    distanceToPoint(point) {
      return Math.sqrt(this.distanceSqToPoint(point));
    }
    distanceSqToPoint(point) {
      const directionDistance = _vector.subVectors(point, this.origin).dot(this.direction);
      if (directionDistance < 0) {
        return this.origin.distanceToSquared(point);
      }
      _vector.copy(this.direction).multiplyScalar(directionDistance).add(this.origin);
      return _vector.distanceToSquared(point);
    }
    distanceSqToSegment(v0, v1, optionalPointOnRay, optionalPointOnSegment) {
      _segCenter.copy(v0).add(v1).multiplyScalar(0.5);
      _segDir.copy(v1).sub(v0).normalize();
      _diff.copy(this.origin).sub(_segCenter);
      const segExtent = v0.distanceTo(v1) * 0.5;
      const a01 = -this.direction.dot(_segDir);
      const b0 = _diff.dot(this.direction);
      const b1 = -_diff.dot(_segDir);
      const c = _diff.lengthSq();
      const det = Math.abs(1 - a01 * a01);
      let s0, s1, sqrDist, extDet;
      if (det > 0) {
        s0 = a01 * b1 - b0;
        s1 = a01 * b0 - b1;
        extDet = segExtent * det;
        if (s0 >= 0) {
          if (s1 >= -extDet) {
            if (s1 <= extDet) {
              const invDet = 1 / det;
              s0 *= invDet;
              s1 *= invDet;
              sqrDist = s0 * (s0 + a01 * s1 + 2 * b0) + s1 * (a01 * s0 + s1 + 2 * b1) + c;
            } else {
              s1 = segExtent;
              s0 = Math.max(0, -(a01 * s1 + b0));
              sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
            }
          } else {
            s1 = -segExtent;
            s0 = Math.max(0, -(a01 * s1 + b0));
            sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
          }
        } else {
          if (s1 <= -extDet) {
            s0 = Math.max(0, -(-a01 * segExtent + b0));
            s1 = s0 > 0 ? -segExtent : Math.min(Math.max(-segExtent, -b1), segExtent);
            sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
          } else {
            if (s1 <= extDet) {
              s0 = 0;
              s1 = Math.min(Math.max(-segExtent, -b1), segExtent);
              sqrDist = s1 * (s1 + 2 * b1) + c;
            } else {
              s0 = Math.max(0, -(a01 * segExtent + b0));
              s1 = s0 > 0 ? segExtent : Math.min(Math.max(-segExtent, -b1), segExtent);
              sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
            }
          }
        }
      } else {
        s1 = a01 > 0 ? -segExtent : segExtent;
        s0 = Math.max(0, -(a01 * s1 + b0));
        sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
      }
      if (optionalPointOnRay) {
        optionalPointOnRay.copy(this.direction).multiplyScalar(s0).add(this.origin);
      }
      if (optionalPointOnSegment) {
        optionalPointOnSegment.copy(_segDir).multiplyScalar(s1).add(_segCenter);
      }
      return sqrDist;
    }
    intersectSphere(sphere, target) {
      _vector.subVectors(sphere.center, this.origin);
      const tca = _vector.dot(this.direction);
      const d2 = _vector.dot(_vector) - tca * tca;
      const radius2 = sphere.radius * sphere.radius;
      if (d2 > radius2) {
        return null;
      }
      const thc = Math.sqrt(radius2 - d2);
      const t0 = tca - thc;
      const t1 = tca + thc;
      if (t0 < 0 && t1 < 0) {
        return null;
      }
      if (t0 < 0) {
        return this.at(t1, target);
      }
      return this.at(t0, target);
    }
    intersectsSphere(sphere) {
      return this.distanceSqToPoint(sphere.center) <= sphere.radius * sphere.radius;
    }
    distanceToPlane(plane) {
      const denominator = plane.normal.dot(this.direction);
      if (denominator === 0) {
        if (plane.distanceToPoint(this.origin) === 0) {
          return 0;
        }
        return null;
      }
      const t = -(this.origin.dot(plane.normal) + plane.constant) / denominator;
      return t >= 0 ? t : null;
    }
    intersectPlane(plane, target) {
      const t = this.distanceToPlane(plane);
      if (t === null) {
        return null;
      }
      return this.at(t, target);
    }
    intersectsPlane(plane) {
      const distToPoint = plane.distanceToPoint(this.origin);
      if (distToPoint === 0) {
        return true;
      }
      const denominator = plane.normal.dot(this.direction);
      if (denominator * distToPoint < 0) {
        return true;
      }
      return false;
    }
    intersectBox(box, target) {
      let tmin, tmax, tymin, tymax, tzmin, tzmax;
      const invdirx = 1 / this.direction.x, invdiry = 1 / this.direction.y, invdirz = 1 / this.direction.z;
      const origin = this.origin;
      if (invdirx >= 0) {
        tmin = (box.min.x - origin.x) * invdirx;
        tmax = (box.max.x - origin.x) * invdirx;
      } else {
        tmin = (box.max.x - origin.x) * invdirx;
        tmax = (box.min.x - origin.x) * invdirx;
      }
      if (invdiry >= 0) {
        tymin = (box.min.y - origin.y) * invdiry;
        tymax = (box.max.y - origin.y) * invdiry;
      } else {
        tymin = (box.max.y - origin.y) * invdiry;
        tymax = (box.min.y - origin.y) * invdiry;
      }
      if (tmin > tymax || tymin > tmax) {
        return null;
      }
      if (tymin > tmin || tmin !== tmin) {
        tmin = tymin;
      }
      if (tymax < tmax || tmax !== tmax) {
        tmax = tymax;
      }
      if (invdirz >= 0) {
        tzmin = (box.min.z - origin.z) * invdirz;
        tzmax = (box.max.z - origin.z) * invdirz;
      } else {
        tzmin = (box.max.z - origin.z) * invdirz;
        tzmax = (box.min.z - origin.z) * invdirz;
      }
      if (tmin > tzmax || tzmin > tmax) {
        return null;
      }
      if (tzmin > tmin || tmin !== tmin) {
        tmin = tzmin;
      }
      if (tzmax < tmax || tmax !== tmax) {
        tmax = tzmax;
      }
      if (tmax < 0) {
        return null;
      }
      return this.at(tmin >= 0 ? tmin : tmax, target);
    }
    intersectsBox(box) {
      return this.intersectBox(box, _vector) !== null;
    }
    intersectTriangle(a, b, c, backfaceCulling, target) {
      _edge1.subVectors(b, a);
      _edge2.subVectors(c, a);
      _normal.crossVectors(_edge1, _edge2);
      let DdN = this.direction.dot(_normal);
      let sign;
      if (DdN > 0) {
        if (backfaceCulling) {
          return null;
        }
        sign = 1;
      } else {
        if (DdN < 0) {
          sign = -1;
          DdN = -DdN;
        } else {
          return null;
        }
      }
      _diff.subVectors(this.origin, a);
      const DdQxE2 = sign * this.direction.dot(_edge2.crossVectors(_diff, _edge2));
      if (DdQxE2 < 0) {
        return null;
      }
      const DdE1xQ = sign * this.direction.dot(_edge1.cross(_diff));
      if (DdE1xQ < 0) {
        return null;
      }
      if (DdQxE2 + DdE1xQ > DdN) {
        return null;
      }
      const QdN = -sign * _diff.dot(_normal);
      if (QdN < 0) {
        return null;
      }
      return this.at(QdN / DdN, target);
    }
    applyMatrix4(matrix4) {
      this.origin.applyMatrix4(matrix4);
      this.direction.transformDirection(matrix4);
      return this;
    }
    equals(ray) {
      return ray.origin.equals(this.origin) && ray.direction.equals(this.direction);
    }
    clone() {
      return (new this.constructor).copy(this);
    }
  }
}, "math/Ray.js", ["math/Vector3.js"]);

//math/Plane.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Plane:{enumerable:true, get:function() {
    return Plane;
  }}});
  var module$math$Matrix3 = $$require("math/Matrix3.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  const _vector1 = new module$math$Vector3.Vector3;
  const _vector2 = new module$math$Vector3.Vector3;
  const _normalMatrix = new module$math$Matrix3.Matrix3;
  class Plane {
    constructor(normal = new module$math$Vector3.Vector3(1, 0, 0), constant = 0) {
      this.normal = normal;
      this.constant = constant;
    }
    set(normal, constant) {
      this.normal.copy(normal);
      this.constant = constant;
      return this;
    }
    setComponents(x, y, z, w) {
      this.normal.set(x, y, z);
      this.constant = w;
      return this;
    }
    setFromNormalAndCoplanarPoint(normal, point) {
      this.normal.copy(normal);
      this.constant = -point.dot(this.normal);
      return this;
    }
    setFromCoplanarPoints(a, b, c) {
      const normal = _vector1.subVectors(c, b).cross(_vector2.subVectors(a, b)).normalize();
      this.setFromNormalAndCoplanarPoint(normal, a);
      return this;
    }
    copy(plane) {
      this.normal.copy(plane.normal);
      this.constant = plane.constant;
      return this;
    }
    normalize() {
      const inverseNormalLength = 1.0 / this.normal.length();
      this.normal.multiplyScalar(inverseNormalLength);
      this.constant *= inverseNormalLength;
      return this;
    }
    negate() {
      this.constant *= -1;
      this.normal.negate();
      return this;
    }
    distanceToPoint(point) {
      return this.normal.dot(point) + this.constant;
    }
    distanceToSphere(sphere) {
      return this.distanceToPoint(sphere.center) - sphere.radius;
    }
    projectPoint(point, target) {
      if (target === undefined) {
        console.warn("THREE.Plane: .projectPoint() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      return target.copy(this.normal).multiplyScalar(-this.distanceToPoint(point)).add(point);
    }
    intersectLine(line, target) {
      if (target === undefined) {
        console.warn("THREE.Plane: .intersectLine() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      const direction = line.delta(_vector1);
      const denominator = this.normal.dot(direction);
      if (denominator === 0) {
        if (this.distanceToPoint(line.start) === 0) {
          return target.copy(line.start);
        }
        return undefined;
      }
      const t = -(line.start.dot(this.normal) + this.constant) / denominator;
      if (t < 0 || t > 1) {
        return undefined;
      }
      return target.copy(direction).multiplyScalar(t).add(line.start);
    }
    intersectsLine(line) {
      const startSign = this.distanceToPoint(line.start);
      const endSign = this.distanceToPoint(line.end);
      return startSign < 0 && endSign > 0 || endSign < 0 && startSign > 0;
    }
    intersectsBox(box) {
      return box.intersectsPlane(this);
    }
    intersectsSphere(sphere) {
      return sphere.intersectsPlane(this);
    }
    coplanarPoint(target) {
      if (target === undefined) {
        console.warn("THREE.Plane: .coplanarPoint() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      return target.copy(this.normal).multiplyScalar(-this.constant);
    }
    applyMatrix4(matrix, optionalNormalMatrix) {
      const normalMatrix = optionalNormalMatrix || _normalMatrix.getNormalMatrix(matrix);
      const referencePoint = this.coplanarPoint(_vector1).applyMatrix4(matrix);
      const normal = this.normal.applyMatrix3(normalMatrix).normalize();
      this.constant = -referencePoint.dot(normal);
      return this;
    }
    translate(offset) {
      this.constant -= offset.dot(this.normal);
      return this;
    }
    equals(plane) {
      return plane.normal.equals(this.normal) && plane.constant === this.constant;
    }
    clone() {
      return (new this.constructor).copy(this);
    }
  }
  Plane.prototype.isPlane = true;
}, "math/Plane.js", ["math/Matrix3.js", "math/Vector3.js"]);

//math/Triangle.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Triangle:{enumerable:true, get:function() {
    return Triangle;
  }}});
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$math$Plane = $$require("math/Plane.js");
  const _v0 = new module$math$Vector3.Vector3;
  const _v1 = new module$math$Vector3.Vector3;
  const _v2 = new module$math$Vector3.Vector3;
  const _v3 = new module$math$Vector3.Vector3;
  const _vab = new module$math$Vector3.Vector3;
  const _vac = new module$math$Vector3.Vector3;
  const _vbc = new module$math$Vector3.Vector3;
  const _vap = new module$math$Vector3.Vector3;
  const _vbp = new module$math$Vector3.Vector3;
  const _vcp = new module$math$Vector3.Vector3;
  class Triangle {
    constructor(a = new module$math$Vector3.Vector3, b = new module$math$Vector3.Vector3, c = new module$math$Vector3.Vector3) {
      this.a = a;
      this.b = b;
      this.c = c;
    }
    static getNormal(a, b, c, target) {
      if (target === undefined) {
        console.warn("THREE.Triangle: .getNormal() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      target.subVectors(c, b);
      _v0.subVectors(a, b);
      target.cross(_v0);
      const targetLengthSq = target.lengthSq();
      if (targetLengthSq > 0) {
        return target.multiplyScalar(1 / Math.sqrt(targetLengthSq));
      }
      return target.set(0, 0, 0);
    }
    static getBarycoord(point, a, b, c, target) {
      _v0.subVectors(c, a);
      _v1.subVectors(b, a);
      _v2.subVectors(point, a);
      const dot00 = _v0.dot(_v0);
      const dot01 = _v0.dot(_v1);
      const dot02 = _v0.dot(_v2);
      const dot11 = _v1.dot(_v1);
      const dot12 = _v1.dot(_v2);
      const denom = dot00 * dot11 - dot01 * dot01;
      if (target === undefined) {
        console.warn("THREE.Triangle: .getBarycoord() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      if (denom === 0) {
        return target.set(-2, -1, -1);
      }
      const invDenom = 1 / denom;
      const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
      const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
      return target.set(1 - u - v, v, u);
    }
    static containsPoint(point, a, b, c) {
      this.getBarycoord(point, a, b, c, _v3);
      return _v3.x >= 0 && _v3.y >= 0 && _v3.x + _v3.y <= 1;
    }
    static getUV(point, p1, p2, p3, uv1, uv2, uv3, target) {
      this.getBarycoord(point, p1, p2, p3, _v3);
      target.set(0, 0);
      target.addScaledVector(uv1, _v3.x);
      target.addScaledVector(uv2, _v3.y);
      target.addScaledVector(uv3, _v3.z);
      return target;
    }
    static isFrontFacing(a, b, c, direction) {
      _v0.subVectors(c, b);
      _v1.subVectors(a, b);
      return _v0.cross(_v1).dot(direction) < 0 ? true : false;
    }
    set(a, b, c) {
      this.a.copy(a);
      this.b.copy(b);
      this.c.copy(c);
      return this;
    }
    setFromPointsAndIndices(points, i0, i1, i2) {
      this.a.copy(points[i0]);
      this.b.copy(points[i1]);
      this.c.copy(points[i2]);
      return this;
    }
    clone() {
      return (new this.constructor).copy(this);
    }
    copy(triangle) {
      this.a.copy(triangle.a);
      this.b.copy(triangle.b);
      this.c.copy(triangle.c);
      return this;
    }
    getArea() {
      _v0.subVectors(this.c, this.b);
      _v1.subVectors(this.a, this.b);
      return _v0.cross(_v1).length() * 0.5;
    }
    getMidpoint(target) {
      if (target === undefined) {
        console.warn("THREE.Triangle: .getMidpoint() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      return target.addVectors(this.a, this.b).add(this.c).multiplyScalar(1 / 3);
    }
    getNormal(target) {
      return Triangle.getNormal(this.a, this.b, this.c, target);
    }
    getPlane(target) {
      if (target === undefined) {
        console.warn("THREE.Triangle: .getPlane() target is now required");
        target = new module$math$Plane.Plane;
      }
      return target.setFromCoplanarPoints(this.a, this.b, this.c);
    }
    getBarycoord(point, target) {
      return Triangle.getBarycoord(point, this.a, this.b, this.c, target);
    }
    getUV(point, uv1, uv2, uv3, target) {
      return Triangle.getUV(point, this.a, this.b, this.c, uv1, uv2, uv3, target);
    }
    containsPoint(point) {
      return Triangle.containsPoint(point, this.a, this.b, this.c);
    }
    isFrontFacing(direction) {
      return Triangle.isFrontFacing(this.a, this.b, this.c, direction);
    }
    intersectsBox(box) {
      return box.intersectsTriangle(this);
    }
    closestPointToPoint(p, target) {
      if (target === undefined) {
        console.warn("THREE.Triangle: .closestPointToPoint() target is now required");
        target = new module$math$Vector3.Vector3;
      }
      const a = this.a, b = this.b, c = this.c;
      let v, w;
      _vab.subVectors(b, a);
      _vac.subVectors(c, a);
      _vap.subVectors(p, a);
      const d1 = _vab.dot(_vap);
      const d2 = _vac.dot(_vap);
      if (d1 <= 0 && d2 <= 0) {
        return target.copy(a);
      }
      _vbp.subVectors(p, b);
      const d3 = _vab.dot(_vbp);
      const d4 = _vac.dot(_vbp);
      if (d3 >= 0 && d4 <= d3) {
        return target.copy(b);
      }
      const vc = d1 * d4 - d3 * d2;
      if (vc <= 0 && d1 >= 0 && d3 <= 0) {
        v = d1 / (d1 - d3);
        return target.copy(a).addScaledVector(_vab, v);
      }
      _vcp.subVectors(p, c);
      const d5 = _vab.dot(_vcp);
      const d6 = _vac.dot(_vcp);
      if (d6 >= 0 && d5 <= d6) {
        return target.copy(c);
      }
      const vb = d5 * d2 - d1 * d6;
      if (vb <= 0 && d2 >= 0 && d6 <= 0) {
        w = d2 / (d2 - d6);
        return target.copy(a).addScaledVector(_vac, w);
      }
      const va = d3 * d6 - d5 * d4;
      if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
        _vbc.subVectors(c, b);
        w = (d4 - d3) / (d4 - d3 + (d5 - d6));
        return target.copy(b).addScaledVector(_vbc, w);
      }
      const denom = 1 / (va + vb + vc);
      v = vb * denom;
      w = vc * denom;
      return target.copy(a).addScaledVector(_vab, v).addScaledVector(_vac, w);
    }
    equals(triangle) {
      return triangle.a.equals(this.a) && triangle.b.equals(this.b) && triangle.c.equals(this.c);
    }
  }
}, "math/Triangle.js", ["math/Vector3.js", "math/Plane.js"]);

//objects/Mesh.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Mesh:{enumerable:true, get:function() {
    return Mesh;
  }}});
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$math$Vector2 = $$require("math/Vector2.js");
  var module$math$Sphere = $$require("math/Sphere.js");
  var module$math$Ray = $$require("math/Ray.js");
  var module$math$Matrix4 = $$require("math/Matrix4.js");
  var module$core$Object3D = $$require("core/Object3D.js");
  var module$math$Triangle = $$require("math/Triangle.js");
  var module$constants = $$require("constants.js");
  var module$materials$MeshBasicMaterial = $$require("materials/MeshBasicMaterial.js");
  var module$core$BufferGeometry = $$require("core/BufferGeometry.js");
  const _inverseMatrix = new module$math$Matrix4.Matrix4;
  const _ray = new module$math$Ray.Ray;
  const _sphere = new module$math$Sphere.Sphere;
  const _vA = new module$math$Vector3.Vector3;
  const _vB = new module$math$Vector3.Vector3;
  const _vC = new module$math$Vector3.Vector3;
  const _tempA = new module$math$Vector3.Vector3;
  const _tempB = new module$math$Vector3.Vector3;
  const _tempC = new module$math$Vector3.Vector3;
  const _morphA = new module$math$Vector3.Vector3;
  const _morphB = new module$math$Vector3.Vector3;
  const _morphC = new module$math$Vector3.Vector3;
  const _uvA = new module$math$Vector2.Vector2;
  const _uvB = new module$math$Vector2.Vector2;
  const _uvC = new module$math$Vector2.Vector2;
  const _intersectionPoint = new module$math$Vector3.Vector3;
  const _intersectionPointWorld = new module$math$Vector3.Vector3;
  class Mesh extends module$core$Object3D.Object3D {
    constructor(geometry = new module$core$BufferGeometry.BufferGeometry, material = new module$materials$MeshBasicMaterial.MeshBasicMaterial) {
      super();
      this.type = "Mesh";
      this.geometry = geometry;
      this.material = material;
      this.updateMorphTargets();
      this.isMesh = true;
      this.morphTargetInfluences = undefined;
      this.morphTargetDictionary = undefined;
    }
    copy(source) {
      module$core$Object3D.Object3D.prototype.copy.call(this, source);
      if (source.morphTargetInfluences !== undefined) {
        this.morphTargetInfluences = source.morphTargetInfluences.slice();
      }
      if (source.morphTargetDictionary !== undefined) {
        this.morphTargetDictionary = Object.assign({}, source.morphTargetDictionary);
      }
      this.material = source.material;
      this.geometry = source.geometry;
      return this;
    }
    updateMorphTargets() {
      const geometry = this.geometry;
      if (geometry.isBufferGeometry) {
        const morphAttributes = geometry.morphAttributes;
        const keys = Object.keys(morphAttributes);
        if (keys.length > 0) {
          const morphAttribute = morphAttributes[keys[0]];
          if (morphAttribute !== undefined) {
            this.morphTargetInfluences = [];
            this.morphTargetDictionary = {};
            for (let m = 0, ml = morphAttribute.length; m < ml; m++) {
              const name = morphAttribute[m].name || String(m);
              this.morphTargetInfluences.push(0);
              this.morphTargetDictionary[name] = m;
            }
          }
        }
      } else {
        const morphTargets = geometry.morphTargets;
        if (morphTargets !== undefined && morphTargets.length > 0) {
          console.error("THREE.Mesh.updateMorphTargets() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.");
        }
      }
    }
    raycast(raycaster, intersects) {
      const geometry = this.geometry;
      const material = this.material;
      const matrixWorld = this.matrixWorld;
      if (material === undefined) {
        return;
      }
      if (geometry.boundingSphere === null) {
        geometry.computeBoundingSphere();
      }
      _sphere.copy(geometry.boundingSphere);
      _sphere.applyMatrix4(matrixWorld);
      if (raycaster.ray.intersectsSphere(_sphere) === false) {
        return;
      }
      _inverseMatrix.copy(matrixWorld).invert();
      _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix);
      if (geometry.boundingBox !== null) {
        if (_ray.intersectsBox(geometry.boundingBox) === false) {
          return;
        }
      }
      let intersection;
      if (geometry.isBufferGeometry) {
        const index = geometry.index;
        const position = geometry.attributes.position;
        const morphPosition = geometry.morphAttributes.position;
        const morphTargetsRelative = geometry.morphTargetsRelative;
        const uv = geometry.attributes.uv;
        const uv2 = geometry.attributes.uv2;
        const groups = geometry.groups;
        const drawRange = geometry.drawRange;
        if (index !== null) {
          if (Array.isArray(material)) {
            for (let i = 0, il = groups.length; i < il; i++) {
              const group = groups[i];
              const groupMaterial = material[group.materialIndex];
              const start = Math.max(group.start, drawRange.start);
              const end = Math.min(group.start + group.count, drawRange.start + drawRange.count);
              for (let j = start, jl = end; j < jl; j += 3) {
                const a = index.getX(j);
                const b = index.getX(j + 1);
                const c = index.getX(j + 2);
                intersection = this.checkBufferGeometryIntersection(this, groupMaterial, raycaster, _ray, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c);
                if (intersection) {
                  intersection.faceIndex = Math.floor(j / 3);
                  intersection.face.materialIndex = group.materialIndex;
                  intersects.push(intersection);
                }
              }
            }
          } else {
            const start = Math.max(0, drawRange.start);
            const end = Math.min(index.count, drawRange.start + drawRange.count);
            for (let i = start, il = end; i < il; i += 3) {
              const a = index.getX(i);
              const b = index.getX(i + 1);
              const c = index.getX(i + 2);
              intersection = this.checkBufferGeometryIntersection(this, material, raycaster, _ray, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c);
              if (intersection) {
                intersection.faceIndex = Math.floor(i / 3);
                intersects.push(intersection);
              }
            }
          }
        } else {
          if (position !== undefined) {
            if (Array.isArray(material)) {
              for (let i = 0, il = groups.length; i < il; i++) {
                const group = groups[i];
                const groupMaterial = material[group.materialIndex];
                const start = Math.max(group.start, drawRange.start);
                const end = Math.min(group.start + group.count, drawRange.start + drawRange.count);
                for (let j = start, jl = end; j < jl; j += 3) {
                  const a = j;
                  const b = j + 1;
                  const c = j + 2;
                  intersection = this.checkBufferGeometryIntersection(this, groupMaterial, raycaster, _ray, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c);
                  if (intersection) {
                    intersection.faceIndex = Math.floor(j / 3);
                    intersection.face.materialIndex = group.materialIndex;
                    intersects.push(intersection);
                  }
                }
              }
            } else {
              const start = Math.max(0, drawRange.start);
              const end = Math.min(position.count, drawRange.start + drawRange.count);
              for (let i = start, il = end; i < il; i += 3) {
                const a = i;
                const b = i + 1;
                const c = i + 2;
                intersection = this.checkBufferGeometryIntersection(this, material, raycaster, _ray, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c);
                if (intersection) {
                  intersection.faceIndex = Math.floor(i / 3);
                  intersects.push(intersection);
                }
              }
            }
          }
        }
      } else {
        if (geometry.isGeometry) {
          console.error("THREE.Mesh.raycast() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.");
        }
      }
    }
    checkIntersection(object, material, raycaster, ray, pA, pB, pC, point) {
      let intersect;
      if (material.side === module$constants.BackSide) {
        intersect = ray.intersectTriangle(pC, pB, pA, true, point);
      } else {
        intersect = ray.intersectTriangle(pA, pB, pC, material.side !== module$constants.DoubleSide, point);
      }
      if (intersect === null) {
        return null;
      }
      _intersectionPointWorld.copy(point);
      _intersectionPointWorld.applyMatrix4(object.matrixWorld);
      const distance = raycaster.ray.origin.distanceTo(_intersectionPointWorld);
      if (distance < raycaster.near || distance > raycaster.far) {
        return null;
      }
      return {distance:distance, point:_intersectionPointWorld.clone(), object:object};
    }
    checkBufferGeometryIntersection(object, material, raycaster, ray, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c) {
      _vA.fromBufferAttribute(position, a);
      _vB.fromBufferAttribute(position, b);
      _vC.fromBufferAttribute(position, c);
      const morphInfluences = object.morphTargetInfluences;
      if (material.morphTargets && morphPosition && morphInfluences) {
        _morphA.set(0, 0, 0);
        _morphB.set(0, 0, 0);
        _morphC.set(0, 0, 0);
        for (let i = 0, il = morphPosition.length; i < il; i++) {
          const influence = morphInfluences[i];
          const morphAttribute = morphPosition[i];
          if (influence === 0) {
            continue;
          }
          _tempA.fromBufferAttribute(morphAttribute, a);
          _tempB.fromBufferAttribute(morphAttribute, b);
          _tempC.fromBufferAttribute(morphAttribute, c);
          if (morphTargetsRelative) {
            _morphA.addScaledVector(_tempA, influence);
            _morphB.addScaledVector(_tempB, influence);
            _morphC.addScaledVector(_tempC, influence);
          } else {
            _morphA.addScaledVector(_tempA.sub(_vA), influence);
            _morphB.addScaledVector(_tempB.sub(_vB), influence);
            _morphC.addScaledVector(_tempC.sub(_vC), influence);
          }
        }
        _vA.add(_morphA);
        _vB.add(_morphB);
        _vC.add(_morphC);
      }
      if (object.isSkinnedMesh && material.skinning) {
        object.boneTransform(a, _vA);
        object.boneTransform(b, _vB);
        object.boneTransform(c, _vC);
      }
      const intersection = this.checkIntersection(object, material, raycaster, ray, _vA, _vB, _vC, _intersectionPoint);
      if (intersection) {
        if (uv) {
          _uvA.fromBufferAttribute(uv, a);
          _uvB.fromBufferAttribute(uv, b);
          _uvC.fromBufferAttribute(uv, c);
          intersection.uv = module$math$Triangle.Triangle.getUV(_intersectionPoint, _vA, _vB, _vC, _uvA, _uvB, _uvC, new module$math$Vector2.Vector2);
        }
        if (uv2) {
          _uvA.fromBufferAttribute(uv2, a);
          _uvB.fromBufferAttribute(uv2, b);
          _uvC.fromBufferAttribute(uv2, c);
          intersection.uv2 = module$math$Triangle.Triangle.getUV(_intersectionPoint, _vA, _vB, _vC, _uvA, _uvB, _uvC, new module$math$Vector2.Vector2);
        }
        const face = {a:a, b:b, c:c, normal:new module$math$Vector3.Vector3, materialIndex:0};
        module$math$Triangle.Triangle.getNormal(_vA, _vB, _vC, face.normal);
        intersection.face = face;
      }
      return intersection;
    }
  }
}, "objects/Mesh.js", ["math/Vector3.js", "math/Vector2.js", "math/Sphere.js", "math/Ray.js", "math/Matrix4.js", "core/Object3D.js", "math/Triangle.js", "constants.js", "materials/MeshBasicMaterial.js", "core/BufferGeometry.js"]);

//textures/DataTexture.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {DataTexture:{enumerable:true, get:function() {
    return DataTexture;
  }}});
  var module$textures$Texture = $$require("textures/Texture.js");
  var module$constants = $$require("constants.js");
  class DataTexture extends module$textures$Texture.Texture {
    constructor(data, width, height, format, type, mapping, wrapS, wrapT, magFilter, minFilter, anisotropy, encoding) {
      super(null, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding);
      this.image = {data:data || null, width:width || 1, height:height || 1};
      this.magFilter = magFilter !== undefined ? magFilter : module$constants.NearestFilter;
      this.minFilter = minFilter !== undefined ? minFilter : module$constants.NearestFilter;
      this.generateMipmaps = false;
      this.flipY = false;
      this.unpackAlignment = 1;
      this.needsUpdate = true;
    }
  }
  DataTexture.prototype.isDataTexture = true;
}, "textures/DataTexture.js", ["textures/Texture.js", "constants.js"]);

//math/Frustum.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Frustum:{enumerable:true, get:function() {
    return Frustum;
  }}});
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$math$Sphere = $$require("math/Sphere.js");
  var module$math$Plane = $$require("math/Plane.js");
  const _sphere = new module$math$Sphere.Sphere;
  const _vector = new module$math$Vector3.Vector3;
  class Frustum {
    constructor(p0 = new module$math$Plane.Plane, p1 = new module$math$Plane.Plane, p2 = new module$math$Plane.Plane, p3 = new module$math$Plane.Plane, p4 = new module$math$Plane.Plane, p5 = new module$math$Plane.Plane) {
      this.planes = [p0, p1, p2, p3, p4, p5];
    }
    set(p0, p1, p2, p3, p4, p5) {
      const planes = this.planes;
      planes[0].copy(p0);
      planes[1].copy(p1);
      planes[2].copy(p2);
      planes[3].copy(p3);
      planes[4].copy(p4);
      planes[5].copy(p5);
      return this;
    }
    copy(frustum) {
      const planes = this.planes;
      for (let i = 0; i < 6; i++) {
        planes[i].copy(frustum.planes[i]);
      }
      return this;
    }
    setFromProjectionMatrix(m) {
      const planes = this.planes;
      const me = m.elements;
      const me0 = me[0], me1 = me[1], me2 = me[2], me3 = me[3];
      const me4 = me[4], me5 = me[5], me6 = me[6], me7 = me[7];
      const me8 = me[8], me9 = me[9], me10 = me[10], me11 = me[11];
      const me12 = me[12], me13 = me[13], me14 = me[14], me15 = me[15];
      planes[0].setComponents(me3 - me0, me7 - me4, me11 - me8, me15 - me12).normalize();
      planes[1].setComponents(me3 + me0, me7 + me4, me11 + me8, me15 + me12).normalize();
      planes[2].setComponents(me3 + me1, me7 + me5, me11 + me9, me15 + me13).normalize();
      planes[3].setComponents(me3 - me1, me7 - me5, me11 - me9, me15 - me13).normalize();
      planes[4].setComponents(me3 - me2, me7 - me6, me11 - me10, me15 - me14).normalize();
      planes[5].setComponents(me3 + me2, me7 + me6, me11 + me10, me15 + me14).normalize();
      return this;
    }
    intersectsObject(object) {
      const geometry = object.geometry;
      if (geometry.boundingSphere === null) {
        geometry.computeBoundingSphere();
      }
      _sphere.copy(geometry.boundingSphere).applyMatrix4(object.matrixWorld);
      return this.intersectsSphere(_sphere);
    }
    intersectsSprite(sprite) {
      _sphere.center.set(0, 0, 0);
      _sphere.radius = 0.7071067811865476;
      _sphere.applyMatrix4(sprite.matrixWorld);
      return this.intersectsSphere(_sphere);
    }
    intersectsSphere(sphere) {
      const planes = this.planes;
      const center = sphere.center;
      const negRadius = -sphere.radius;
      for (let i = 0; i < 6; i++) {
        const distance = planes[i].distanceToPoint(center);
        if (distance < negRadius) {
          return false;
        }
      }
      return true;
    }
    intersectsBox(box) {
      const planes = this.planes;
      for (let i = 0; i < 6; i++) {
        const plane = planes[i];
        _vector.x = plane.normal.x > 0 ? box.max.x : box.min.x;
        _vector.y = plane.normal.y > 0 ? box.max.y : box.min.y;
        _vector.z = plane.normal.z > 0 ? box.max.z : box.min.z;
        if (plane.distanceToPoint(_vector) < 0) {
          return false;
        }
      }
      return true;
    }
    containsPoint(point) {
      const planes = this.planes;
      for (let i = 0; i < 6; i++) {
        if (planes[i].distanceToPoint(point) < 0) {
          return false;
        }
      }
      return true;
    }
    clone() {
      return (new this.constructor).copy(this);
    }
  }
}, "math/Frustum.js", ["math/Vector3.js", "math/Sphere.js", "math/Plane.js"]);

//renderers/webgl/WebGLAnimation.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLAnimation:{enumerable:true, get:function() {
    return WebGLAnimation;
  }}});
  class WebGLAnimation {
    constructor() {
      this.context = null;
      this.isAnimating = false;
      this.animationLoop = null;
      this.requestId = null;
    }
    onAnimationFrame(time, frame) {
      this.animationLoop(time, frame);
      this.requestId = this.context.requestAnimationFrame(this.onAnimationFrame);
    }
    start() {
      if (this.isAnimating === true) {
        return;
      }
      if (this.animationLoop === null) {
        return;
      }
      this.requestId = this.context.requestAnimationFrame(this.onAnimationFrame);
      this.isAnimating = true;
    }
    stop() {
      this.context.cancelAnimationFrame(this.requestId);
      this.isAnimating = false;
    }
    setAnimationLoop(callback) {
      this.animationLoop = callback;
    }
    setContext(value) {
      this.context = value;
    }
  }
}, "renderers/webgl/WebGLAnimation.js", []);

//renderers/webgl/WebGLAttributes.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLAttributes:{enumerable:true, get:function() {
    return WebGLAttributes;
  }}});
  class WebGLAttributes {
    constructor(gl, capabilities) {
      this.gl = gl;
      this.capabilities = capabilities;
      this.isWebGL2 = capabilities.isWebGL2;
      this.buffers = new WeakMap;
    }
    createBuffer(attribute, bufferType) {
      const array = attribute.array;
      const usage = attribute.usage;
      const buffer = this.gl.createBuffer();
      this.gl.bindBuffer(bufferType, buffer);
      this.gl.bufferData(bufferType, array, usage);
      attribute.onUploadCallback();
      let type = this.gl.FLOAT;
      if (array instanceof Float32Array) {
        type = this.gl.FLOAT;
      } else {
        if (array instanceof Float64Array) {
          console.warn("THREE.WebGLAttributes: Unsupported data buffer format: Float64Array.");
        } else {
          if (array instanceof Uint16Array) {
            if (attribute.isFloat16BufferAttribute) {
              if (this.isWebGL2) {
                type = this.gl.HALF_FLOAT;
              } else {
                console.warn("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");
              }
            } else {
              type = this.gl.UNSIGNED_SHORT;
            }
          } else {
            if (array instanceof Int16Array) {
              type = this.gl.SHORT;
            } else {
              if (array instanceof Uint32Array) {
                type = this.gl.UNSIGNED_INT;
              } else {
                if (array instanceof Int32Array) {
                  type = this.gl.INT;
                } else {
                  if (array instanceof Int8Array) {
                    type = this.gl.BYTE;
                  } else {
                    if (array instanceof Uint8Array) {
                      type = this.gl.UNSIGNED_BYTE;
                    }
                  }
                }
              }
            }
          }
        }
      }
      return {buffer:buffer, type:type, bytesPerElement:array.BYTES_PER_ELEMENT, version:attribute.version};
    }
    updateBuffer(buffer, attribute, bufferType) {
      const array = attribute.array;
      const updateRange = attribute.updateRange;
      this.gl.bindBuffer(bufferType, buffer);
      if (updateRange.count === -1) {
        this.gl.bufferSubData(bufferType, 0, array);
      } else {
        if (this.isWebGL2) {
          this.gl.bufferSubData(bufferType, updateRange.offset * array.BYTES_PER_ELEMENT, array, updateRange.offset, updateRange.count);
        } else {
          this.gl.bufferSubData(bufferType, updateRange.offset * array.BYTES_PER_ELEMENT, array.subarray(updateRange.offset, updateRange.offset + updateRange.count));
        }
        updateRange.count = -1;
      }
    }
    get(attribute) {
      if (attribute.isInterleavedBufferAttribute) {
        attribute = attribute.data;
      }
      return this.buffers.get(attribute);
    }
    remove(attribute) {
      if (attribute.isInterleavedBufferAttribute) {
        attribute = attribute.data;
      }
      const data = this.buffers.get(attribute);
      if (data) {
        this.gl.deleteBuffer(data.buffer);
        this.buffers["delete"](attribute);
      }
    }
    update(attribute, bufferType) {
      if (attribute.isGLBufferAttribute) {
        const cached = this.buffers.get(attribute);
        if (!cached || cached.version < attribute.version) {
          this.buffers.set(attribute, {buffer:attribute.buffer, type:attribute.type, bytesPerElement:attribute.elementSize, version:attribute.version});
        }
        return;
      }
      if (attribute.isInterleavedBufferAttribute) {
        attribute = attribute.data;
      }
      const data = this.buffers.get(attribute);
      if (data === undefined) {
        this.buffers.set(attribute, this.createBuffer(attribute, bufferType));
      } else {
        if (data.version < attribute.version) {
          this.updateBuffer(data.buffer, attribute, bufferType);
          data.version = attribute.version;
        }
      }
    }
  }
}, "renderers/webgl/WebGLAttributes.js", []);

//geometries/PlaneGeometry.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {PlaneBufferGeometry:{enumerable:true, get:function() {
    return PlaneGeometry;
  }}, PlaneGeometry:{enumerable:true, get:function() {
    return PlaneGeometry;
  }}});
  var module$core$BufferGeometry = $$require("core/BufferGeometry.js");
  var module$core$BufferAttribute = $$require("core/BufferAttribute.js");
  class PlaneGeometry extends module$core$BufferGeometry.BufferGeometry {
    constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
      super();
      this.type = "PlaneGeometry";
      this.parameters = {width:width, height:height, widthSegments:widthSegments, heightSegments:heightSegments};
      const width_half = width / 2;
      const height_half = height / 2;
      const gridX = Math.floor(widthSegments);
      const gridY = Math.floor(heightSegments);
      const gridX1 = gridX + 1;
      const gridY1 = gridY + 1;
      const segment_width = width / gridX;
      const segment_height = height / gridY;
      const indices = [];
      const vertices = [];
      const normals = [];
      const uvs = [];
      for (let iy = 0; iy < gridY1; iy++) {
        const y = iy * segment_height - height_half;
        for (let ix = 0; ix < gridX1; ix++) {
          const x = ix * segment_width - width_half;
          vertices.push(x, -y, 0);
          normals.push(0, 0, 1);
          uvs.push(ix / gridX);
          uvs.push(1 - iy / gridY);
        }
      }
      for (let iy = 0; iy < gridY; iy++) {
        for (let ix = 0; ix < gridX; ix++) {
          const a = ix + gridX1 * iy;
          const b = ix + gridX1 * (iy + 1);
          const c = ix + 1 + gridX1 * (iy + 1);
          const d = ix + 1 + gridX1 * iy;
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }
      this.setIndex(indices);
      this.setAttribute("position", new module$core$BufferAttribute.Float32BufferAttribute(vertices, 3));
      this.setAttribute("normal", new module$core$BufferAttribute.Float32BufferAttribute(normals, 3));
      this.setAttribute("uv", new module$core$BufferAttribute.Float32BufferAttribute(uvs, 2));
    }
  }
}, "geometries/PlaneGeometry.js", ["core/BufferGeometry.js", "core/BufferAttribute.js"]);

//renderers/shaders/UniformsUtils.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {UniformsUtils:{enumerable:true, get:function() {
    return UniformsUtils;
  }}, cloneUniforms:{enumerable:true, get:function() {
    return cloneUniforms;
  }}, mergeUniforms:{enumerable:true, get:function() {
    return mergeUniforms;
  }}});
  function cloneUniforms(src) {
    const dst = {};
    for (const u in src) {
      dst[u] = {};
      for (const p in src[u]) {
        const property = src[u][p];
        if (property && (property.isColor || property.isMatrix3 || property.isMatrix4 || property.isVector2 || property.isVector3 || property.isVector4 || property.isTexture || property.isQuaternion)) {
          dst[u][p] = property.clone();
        } else {
          if (Array.isArray(property)) {
            dst[u][p] = property.slice();
          } else {
            dst[u][p] = property;
          }
        }
      }
    }
    return dst;
  }
  function mergeUniforms(uniforms) {
    console.log("mergeUniforms before " + JSON.stringify(uniforms));
    const merged = {};
    for (let u = 0; u < uniforms.length; u++) {
      const tmp = cloneUniforms(uniforms[u]);
      for (const p in tmp) {
        merged[p] = tmp[p];
      }
    }
    console.log("mergeUniforms return " + JSON.stringify(merged));
    return merged;
  }
  const UniformsUtils = {clone:cloneUniforms, merge:mergeUniforms};
}, "renderers/shaders/UniformsUtils.js", []);

//renderers/shaders/ShaderChunk/default_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
}, "renderers/shaders/ShaderChunk/default_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/default_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}
`;
}, "renderers/shaders/ShaderChunk/default_fragment.glsl.js", []);

//materials/ShaderMaterial.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {ShaderMaterial:{enumerable:true, get:function() {
    return ShaderMaterial;
  }}});
  var module$materials$Material = $$require("materials/Material.js");
  var module$renderers$shaders$UniformsUtils = $$require("renderers/shaders/UniformsUtils.js");
  var module$renderers$shaders$ShaderChunk$default_vertex_glsl = $$require("renderers/shaders/ShaderChunk/default_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$default_fragment_glsl = $$require("renderers/shaders/ShaderChunk/default_fragment.glsl.js");
  class ShaderMaterial extends module$materials$Material.Material {
    constructor(parameters) {
      super();
      this.type = "ShaderMaterial";
      this.defines = {};
      this.uniforms = {};
      this.vertexShader = module$renderers$shaders$ShaderChunk$default_vertex_glsl["default"];
      this.fragmentShader = module$renderers$shaders$ShaderChunk$default_fragment_glsl["default"];
      this.linewidth = 1;
      this.wireframe = false;
      this.wireframeLinewidth = 1;
      this.fog = false;
      this.lights = false;
      this.clipping = false;
      this.skinning = false;
      this.morphTargets = false;
      this.morphNormals = false;
      this.extensions = {derivatives:false, fragDepth:false, drawBuffers:false, shaderTextureLOD:false};
      this.defaultAttributeValues = {"color":[1, 1, 1], "uv":[0, 0], "uv2":[0, 0]};
      this.index0AttributeName = undefined;
      this.uniformsNeedUpdate = false;
      this.glslVersion = null;
      if (parameters !== undefined) {
        if (parameters.attributes !== undefined) {
          console.error("THREE.ShaderMaterial: attributes should now be defined in THREE.BufferGeometry instead.");
        }
        this.setValues(parameters);
      }
      this.isShaderMaterial = true;
    }
    copy(source) {
      module$materials$Material.Material.prototype.copy.call(this, source);
      this.fragmentShader = source.fragmentShader;
      this.vertexShader = source.vertexShader;
      this.uniforms = (0,module$renderers$shaders$UniformsUtils.cloneUniforms)(source.uniforms);
      this.defines = Object.assign({}, source.defines);
      this.wireframe = source.wireframe;
      this.wireframeLinewidth = source.wireframeLinewidth;
      this.lights = source.lights;
      this.clipping = source.clipping;
      this.skinning = source.skinning;
      this.morphTargets = source.morphTargets;
      this.morphNormals = source.morphNormals;
      this.extensions = Object.assign({}, source.extensions);
      this.glslVersion = source.glslVersion;
      return this;
    }
    toJSON(meta) {
      const data = module$materials$Material.Material.prototype.toJSON.call(this, meta);
      data.glslVersion = this.glslVersion;
      data.uniforms = {};
      for (const name in this.uniforms) {
        const uniform = this.uniforms[name];
        const value = uniform.value;
        if (value && value.isTexture) {
          data.uniforms[name] = {type:"t", value:value.toJSON(meta).uuid};
        } else {
          if (value && value.isColor) {
            data.uniforms[name] = {type:"c", value:value.getHex()};
          } else {
            if (value && value.isVector2) {
              data.uniforms[name] = {type:"v2", value:value.toArray()};
            } else {
              if (value && value.isVector3) {
                data.uniforms[name] = {type:"v3", value:value.toArray()};
              } else {
                if (value && value.isVector4) {
                  data.uniforms[name] = {type:"v4", value:value.toArray()};
                } else {
                  if (value && value.isMatrix3) {
                    data.uniforms[name] = {type:"m3", value:value.toArray()};
                  } else {
                    if (value && value.isMatrix4) {
                      data.uniforms[name] = {type:"m4", value:value.toArray()};
                    } else {
                      data.uniforms[name] = {value:value};
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (Object.keys(this.defines).length > 0) {
        data.defines = this.defines;
      }
      data.vertexShader = this.vertexShader;
      data.fragmentShader = this.fragmentShader;
      const extensions = {};
      for (const key in this.extensions) {
        if (this.extensions[key] === true) {
          extensions[key] = true;
        }
      }
      if (Object.keys(extensions).length > 0) {
        data.extensions = extensions;
      }
      return data;
    }
  }
}, "materials/ShaderMaterial.js", ["materials/Material.js", "renderers/shaders/UniformsUtils.js", "renderers/shaders/ShaderChunk/default_vertex.glsl.js", "renderers/shaders/ShaderChunk/default_fragment.glsl.js"]);

//renderers/shaders/ShaderChunk/alphamap_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, vUv ).g;

#endif
`;
}, "renderers/shaders/ShaderChunk/alphamap_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/alphamap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap;

#endif
`;
}, "renderers/shaders/ShaderChunk/alphamap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/alphatest_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef ALPHATEST

	if ( diffuseColor.a < ALPHATEST ) discard;

#endif
`;
}, "renderers/shaders/ShaderChunk/alphatest_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/aomap_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_AOMAP

	// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;

	reflectedLight.indirectDiffuse *= ambientOcclusion;

	#if defined( USE_ENVMAP ) && defined( STANDARD )

		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );

		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/aomap_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/aomap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_AOMAP

	uniform sampler2D aoMap;
	uniform float aoMapIntensity;

#endif
`;
}, "renderers/shaders/ShaderChunk/aomap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/begin_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
vec3 transformed = vec3( position );
`;
}, "renderers/shaders/ShaderChunk/begin_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/beginnormal_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
vec3 objectNormal = vec3( normal );

#ifdef USE_TANGENT

	vec3 objectTangent = vec3( tangent.xyz );

#endif
`;
}, "renderers/shaders/ShaderChunk/beginnormal_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/bsdfs.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `

// Analytical approximation of the DFG LUT, one half of the
// split-sum approximation used in indirect specular lighting.
// via 'environmentBRDF' from "Physically Based Shading on Mobile"
// https://www.unrealengine.com/blog/physically-based-shading-on-mobile - environmentBRDF for GGX on mobile
vec2 integrateSpecularBRDF( const in float dotNV, const in float roughness ) {
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );

	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );

	vec4 r = roughness * c0 + c1;

	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;

	return vec2( -1.04, 1.04 ) * a004 + r.zw;

}

float punctualLightIntensityToIrradianceFactor( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {

#if defined ( PHYSICALLY_CORRECT_LIGHTS )

	// based upon Frostbite 3 Moving to Physically-based Rendering
	// page 32, equation 26: E[window1]
	// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
	// this is intended to be used on spot and point lights who are represented as luminous intensity
	// but who must be converted to luminous irradiance for surface lighting calculation
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );

	if( cutoffDistance > 0.0 ) {

		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );

	}

	return distanceFalloff;

#else

	if( cutoffDistance > 0.0 && decayExponent > 0.0 ) {

		return pow( saturate( -lightDistance / cutoffDistance + 1.0 ), decayExponent );

	}

	return 1.0;

#endif

}

vec3 BRDF_Diffuse_Lambert( const in vec3 diffuseColor ) {

	return RECIPROCAL_PI * diffuseColor;

} // validated

vec3 F_Schlick( const in vec3 specularColor, const in float dotLH ) {

	// Original approximation by Christophe Schlick '94
	// float fresnel = pow( 1.0 - dotLH, 5.0 );

	// Optimized variant (presented by Epic at SIGGRAPH '13)
	// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
	float fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );

	return ( 1.0 - specularColor ) * fresnel + specularColor;

} // validated

vec3 F_Schlick_RoughnessDependent( const in vec3 F0, const in float dotNV, const in float roughness ) {

	// See F_Schlick
	float fresnel = exp2( ( -5.55473 * dotNV - 6.98316 ) * dotNV );
	vec3 Fr = max( vec3( 1.0 - roughness ), F0 ) - F0;

	return Fr * fresnel + F0;

}


// Microfacet Models for Refraction through Rough Surfaces - equation (34)
// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
// alpha is "roughness squared" in Disney\u2019s reparameterization
float G_GGX_Smith( const in float alpha, const in float dotNL, const in float dotNV ) {

	// geometry term (normalized) = G(l)\u22c5G(v) / 4(n\u22c5l)(n\u22c5v)
	// also see #12151

	float a2 = pow2( alpha );

	float gl = dotNL + sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	float gv = dotNV + sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );

	return 1.0 / ( gl * gv );

} // validated

// Moving Frostbite to Physically Based Rendering 3.0 - page 12, listing 2
// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float G_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {

	float a2 = pow2( alpha );

	// dotNL and dotNV are explicitly swapped. This is not a mistake.
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );

	return 0.5 / max( gv + gl, EPSILON );

}

// Microfacet Models for Refraction through Rough Surfaces - equation (33)
// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
// alpha is "roughness squared" in Disney\u2019s reparameterization
float D_GGX( const in float alpha, const in float dotNH ) {

	float a2 = pow2( alpha );

	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0; // avoid alpha = 0 with dotNH = 1

	return RECIPROCAL_PI * a2 / pow2( denom );

}

// GGX Distribution, Schlick Fresnel, GGX-Smith Visibility
vec3 BRDF_Specular_GGX( const in IncidentLight incidentLight, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float roughness ) {

	float alpha = pow2( roughness ); // UE4's roughness

	vec3 halfDir = normalize( incidentLight.direction + viewDir );

	float dotNL = saturate( dot( normal, incidentLight.direction ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotLH = saturate( dot( incidentLight.direction, halfDir ) );

	vec3 F = F_Schlick( specularColor, dotLH );

	float G = G_GGX_SmithCorrelated( alpha, dotNL, dotNV );

	float D = D_GGX( alpha, dotNH );

	return F * ( G * D );

} // validated

// Rect Area Light

// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines
// by Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt
// code: https://github.com/selfshadow/ltc_code/

vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {

	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;

	float dotNV = saturate( dot( N, V ) );

	// texture parameterized by sqrt( GGX alpha ) and sqrt( 1 - cos( theta ) )
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );

	uv = uv * LUT_SCALE + LUT_BIAS;

	return uv;

}

float LTC_ClippedSphereFormFactor( const in vec3 f ) {

	// Real-Time Area Lighting: a Journey from Research to Production (p.102)
	// An approximation of the form factor of a horizon-clipped rectangle.

	float l = length( f );

	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );

}

vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {

	float x = dot( v1, v2 );

	float y = abs( x );

	// rational polynomial approximation to theta / sin( theta ) / 2PI
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;

	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;

	return cross( v1, v2 ) * theta_sintheta;

}

vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {

	// bail if point is on back side of plane of light
	// assumes ccw winding order of light vertices
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );

	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );

	// construct orthonormal basis around N
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 ); // negated from paper; possibly due to a different handedness of world coordinate system

	// compute transform
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );

	// transform rect
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );

	// project rect onto sphere
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );

	// calculate vector form factor
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );

	// adjust for horizon clipping
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );

/*
	// alternate method of adjusting for horizon clipping (see referece)
	// refactoring required
	float len = length( vectorFormFactor );
	float z = vectorFormFactor.z / len;

	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;

	// tabulated horizon-clipped sphere, apparently...
	vec2 uv = vec2( z * 0.5 + 0.5, len );
	uv = uv * LUT_SCALE + LUT_BIAS;

	float scale = texture2D( ltc_2, uv ).w;

	float result = len * scale;
*/

	return vec3( result );

}

// End Rect Area Light

// ref: https://www.unrealengine.com/blog/physically-based-shading-on-mobile - environmentBRDF for GGX on mobile
vec3 BRDF_Specular_GGX_Environment( const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float roughness ) {

	float dotNV = saturate( dot( normal, viewDir ) );

	vec2 brdf = integrateSpecularBRDF( dotNV, roughness );

	return specularColor * brdf.x + brdf.y;

} // validated

// Fdez-Ag\u00fcera's "Multiple-Scattering Microfacet Model for Real-Time Image Based Lighting"
// Approximates multiscattering in order to preserve energy.
// http://www.jcgt.org/published/0008/01/03/
void BRDF_Specular_Multiscattering_Environment( const in GeometricContext geometry, const in vec3 specularColor, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {

	float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );

	vec3 F = F_Schlick_RoughnessDependent( specularColor, dotNV, roughness );
	vec2 brdf = integrateSpecularBRDF( dotNV, roughness );
	vec3 FssEss = F * brdf.x + brdf.y;

	float Ess = brdf.x + brdf.y;
	float Ems = 1.0 - Ess;

	vec3 Favg = specularColor + ( 1.0 - specularColor ) * 0.047619; // 1/21
	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );

	singleScatter += FssEss;
	multiScatter += Fms * Ems;

}

float G_BlinnPhong_Implicit( /* const in float dotNL, const in float dotNV */ ) {

	// geometry term is (n dot l)(n dot v) / 4(n dot l)(n dot v)
	return 0.25;

}

float D_BlinnPhong( const in float shininess, const in float dotNH ) {

	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );

}

vec3 BRDF_Specular_BlinnPhong( const in IncidentLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float shininess ) {

	vec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );

	//float dotNL = saturate( dot( geometry.normal, incidentLight.direction ) );
	//float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
	float dotNH = saturate( dot( geometry.normal, halfDir ) );
	float dotLH = saturate( dot( incidentLight.direction, halfDir ) );

	vec3 F = F_Schlick( specularColor, dotLH );

	float G = G_BlinnPhong_Implicit( /* dotNL, dotNV */ );

	float D = D_BlinnPhong( shininess, dotNH );

	return F * ( G * D );

} // validated

// source: http://simonstechblog.blogspot.ca/2011/12/microfacet-brdf.html
float GGXRoughnessToBlinnExponent( const in float ggxRoughness ) {
	return ( 2.0 / pow2( ggxRoughness + 0.0001 ) - 2.0 );
}

float BlinnExponentToGGXRoughness( const in float blinnExponent ) {
	return sqrt( 2.0 / ( blinnExponent + 2.0 ) );
}

#if defined( USE_SHEEN )

// https://github.com/google/filament/blob/master/shaders/src/brdf.fs#L94
float D_Charlie(float roughness, float NoH) {
	// Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
	float invAlpha = 1.0 / roughness;
	float cos2h = NoH * NoH;
	float sin2h = max(1.0 - cos2h, 0.0078125); // 2^(-14/2), so sin2h^2 > 0 in fp16
	return (2.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * PI);
}

// https://github.com/google/filament/blob/master/shaders/src/brdf.fs#L136
float V_Neubelt(float NoV, float NoL) {
	// Neubelt and Pettineo 2013, "Crafting a Next-gen Material Pipeline for The Order: 1886"
	return saturate(1.0 / (4.0 * (NoL + NoV - NoL * NoV)));
}

vec3 BRDF_Specular_Sheen( const in float roughness, const in vec3 L, const in GeometricContext geometry, vec3 specularColor ) {

	vec3 N = geometry.normal;
	vec3 V = geometry.viewDir;

	vec3 H = normalize( V + L );
	float dotNH = saturate( dot( N, H ) );

	return specularColor * D_Charlie( roughness, dotNH ) * V_Neubelt( dot(N, V), dot(N, L) );

}

#endif
`;
}, "renderers/shaders/ShaderChunk/bsdfs.glsl.js", []);

//renderers/shaders/ShaderChunk/bumpmap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_BUMPMAP

	uniform sampler2D bumpMap;
	uniform float bumpScale;

	// Bump Mapping Unparametrized Surfaces on the GPU by Morten S. Mikkelsen
	// http://api.unrealengine.com/attachments/Engine/Rendering/LightingAndShadows/BumpMappingWithoutTangentSpace/mm_sfgrad_bump.pdf

	// Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)

	vec2 dHdxy_fwd() {

		vec2 dSTdx = dFdx( vUv );
		vec2 dSTdy = dFdy( vUv );

		float Hll = bumpScale * texture2D( bumpMap, vUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;

		return vec2( dBx, dBy );

	}

	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {

		// Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988

		vec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );
		vec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );
		vec3 vN = surf_norm;		// normalized

		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );

		float fDet = dot( vSigmaX, R1 ) * faceDirection;

		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );

	}

#endif
`;
}, "renderers/shaders/ShaderChunk/bumpmap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/clipping_planes_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if NUM_CLIPPING_PLANES > 0

	vec4 plane;

	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {

		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;

	}
	#pragma unroll_loop_end

	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES

		bool clipped = true;

		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {

			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;

		}
		#pragma unroll_loop_end

		if ( clipped ) discard;

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/clipping_planes_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/clipping_planes_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];

#endif
`;
}, "renderers/shaders/ShaderChunk/clipping_planes_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/clipping_planes_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

#endif
`;
}, "renderers/shaders/ShaderChunk/clipping_planes_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/clipping_planes_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if NUM_CLIPPING_PLANES > 0

	vClipPosition = - mvPosition.xyz;

#endif
`;
}, "renderers/shaders/ShaderChunk/clipping_planes_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/color_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_COLOR

	diffuseColor.rgb *= vColor;

#endif
`;
}, "renderers/shaders/ShaderChunk/color_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/color_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_COLOR

	varying vec3 vColor;

#endif
`;
}, "renderers/shaders/ShaderChunk/color_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/color_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )

	varying vec3 vColor;

#endif
`;
}, "renderers/shaders/ShaderChunk/color_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/color_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )

	vColor = vec3( 1.0 );

#endif

#ifdef USE_COLOR

	vColor.xyz *= color.xyz;

#endif

#ifdef USE_INSTANCING_COLOR

	vColor.xyz *= instanceColor.xyz;

#endif
`;
}, "renderers/shaders/ShaderChunk/color_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/common.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6

#ifndef saturate
// <tonemapping_pars_fragment> may have defined saturate() already
#define saturate(a) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement(a) ( 1.0 - saturate( a ) )

float pow2( const in float x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
// expects values in the range of [0,1]x[0,1], returns values in the [0,1] range.
// do not collapse into a single function per: http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float max3( vec3 v ) { return max( max( v.x, v.y ), v.z ); }
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif

struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};

struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};

struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
#ifdef CLEARCOAT
	vec3 clearcoatNormal;
#endif
};

vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

}

vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {

	// dir can be either a direction vector or a normal vector
	// upper-left 3x3 of matrix is assumed to be orthogonal

	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );

}

vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {

	float distance = dot( planeNormal, point - pointOnPlane );

	return - distance * planeNormal + point;

}

float sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {

	return sign( dot( point - pointOnPlane, planeNormal ) );

}

vec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {

	return lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;

}

mat3 transposeMat3( const in mat3 m ) {

	mat3 tmp;

	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );

	return tmp;

}

// https://en.wikipedia.org/wiki/Relative_luminance
float linearToRelativeLuminance( const in vec3 color ) {

	vec3 weights = vec3( 0.2126, 0.7152, 0.0722 );

	return dot( weights, color.rgb );

}

bool isPerspectiveMatrix( mat4 m ) {

	return m[ 2 ][ 3 ] == - 1.0;

}

vec2 equirectUv( in vec3 dir ) {

	// dir is assumed to be unit length

	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;

	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;

	return vec2( u, v );

}
`;
}, "renderers/shaders/ShaderChunk/common.glsl.js", []);

//renderers/shaders/ShaderChunk/cube_uv_reflection_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef ENVMAP_TYPE_CUBE_UV

	#define cubeUV_maxMipLevel 8.0
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_maxTileSize 256.0
	#define cubeUV_minTileSize 16.0

	// These shader functions convert between the UV coordinates of a single face of
	// a cubemap, the 0-5 integer index of a cube face, and the direction vector for
	// sampling a textureCube (not generally normalized ).

	float getFace( vec3 direction ) {

		vec3 absDirection = abs( direction );

		float face = - 1.0;

		if ( absDirection.x > absDirection.z ) {

			if ( absDirection.x > absDirection.y )

				face = direction.x > 0.0 ? 0.0 : 3.0;

			else

				face = direction.y > 0.0 ? 1.0 : 4.0;

		} else {

			if ( absDirection.z > absDirection.y )

				face = direction.z > 0.0 ? 2.0 : 5.0;

			else

				face = direction.y > 0.0 ? 1.0 : 4.0;

		}

		return face;

	}

	// RH coordinate system; PMREM face-indexing convention
	vec2 getUV( vec3 direction, float face ) {

		vec2 uv;

		if ( face == 0.0 ) {

			uv = vec2( direction.z, direction.y ) / abs( direction.x ); // pos x

		} else if ( face == 1.0 ) {

			uv = vec2( - direction.x, - direction.z ) / abs( direction.y ); // pos y

		} else if ( face == 2.0 ) {

			uv = vec2( - direction.x, direction.y ) / abs( direction.z ); // pos z

		} else if ( face == 3.0 ) {

			uv = vec2( - direction.z, direction.y ) / abs( direction.x ); // neg x

		} else if ( face == 4.0 ) {

			uv = vec2( - direction.x, direction.z ) / abs( direction.y ); // neg y

		} else {

			uv = vec2( direction.x, direction.y ) / abs( direction.z ); // neg z

		}

		return 0.5 * ( uv + 1.0 );

	}

	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {

		float face = getFace( direction );

		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );

		mipInt = max( mipInt, cubeUV_minMipLevel );

		float faceSize = exp2( mipInt );

		float texelSize = 1.0 / ( 3.0 * cubeUV_maxTileSize );

		vec2 uv = getUV( direction, face ) * ( faceSize - 1.0 );

		vec2 f = fract( uv );

		uv += 0.5 - f;

		if ( face > 2.0 ) {

			uv.y += faceSize;

			face -= 3.0;

		}

		uv.x += face * faceSize;

		if ( mipInt < cubeUV_maxMipLevel ) {

			uv.y += 2.0 * cubeUV_maxTileSize;

		}

		uv.y += filterInt * 2.0 * cubeUV_minTileSize;

		uv.x += 3.0 * max( 0.0, cubeUV_maxTileSize - 2.0 * faceSize );

		uv *= texelSize;

		vec3 tl = envMapTexelToLinear( texture2D( envMap, uv ) ).rgb;

		uv.x += texelSize;

		vec3 tr = envMapTexelToLinear( texture2D( envMap, uv ) ).rgb;

		uv.y += texelSize;

		vec3 br = envMapTexelToLinear( texture2D( envMap, uv ) ).rgb;

		uv.x -= texelSize;

		vec3 bl = envMapTexelToLinear( texture2D( envMap, uv ) ).rgb;

		vec3 tm = mix( tl, tr, f.x );

		vec3 bm = mix( bl, br, f.x );

		return mix( tm, bm, f.y );

	}

	// These defines must match with PMREMGenerator

	#define r0 1.0
	#define v0 0.339
	#define m0 - 2.0
	#define r1 0.8
	#define v1 0.276
	#define m1 - 1.0
	#define r4 0.4
	#define v4 0.046
	#define m4 2.0
	#define r5 0.305
	#define v5 0.016
	#define m5 3.0
	#define r6 0.21
	#define v6 0.0038
	#define m6 4.0

	float roughnessToMip( float roughness ) {

		float mip = 0.0;

		if ( roughness >= r1 ) {

			mip = ( r0 - roughness ) * ( m1 - m0 ) / ( r0 - r1 ) + m0;

		} else if ( roughness >= r4 ) {

			mip = ( r1 - roughness ) * ( m4 - m1 ) / ( r1 - r4 ) + m1;

		} else if ( roughness >= r5 ) {

			mip = ( r4 - roughness ) * ( m5 - m4 ) / ( r4 - r5 ) + m4;

		} else if ( roughness >= r6 ) {

			mip = ( r5 - roughness ) * ( m6 - m5 ) / ( r5 - r6 ) + m5;

		} else {

			mip = - 2.0 * log2( 1.16 * roughness ); // 1.16 = 1.79^0.25
		}

		return mip;

	}

	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {

		float mip = clamp( roughnessToMip( roughness ), m0, cubeUV_maxMipLevel );

		float mipF = fract( mip );

		float mipInt = floor( mip );

		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );

		if ( mipF == 0.0 ) {

			return vec4( color0, 1.0 );

		} else {

			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );

			return vec4( mix( color0, color1, mipF ), 1.0 );

		}

	}

#endif
`;
}, "renderers/shaders/ShaderChunk/cube_uv_reflection_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/defaultnormal_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
vec3 transformedNormal = objectNormal;

#ifdef USE_INSTANCING

	// this is in lieu of a per-instance normal-matrix
	// shear transforms in the instance matrix are not supported

	mat3 m = mat3( instanceMatrix );

	transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );

	transformedNormal = m * transformedNormal;

#endif

transformedNormal = normalMatrix * transformedNormal;

#ifdef FLIP_SIDED

	transformedNormal = - transformedNormal;

#endif

#ifdef USE_TANGENT

	vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;

	#ifdef FLIP_SIDED

		transformedTangent = - transformedTangent;

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/defaultnormal_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/displacementmap_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_DISPLACEMENTMAP

	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;

#endif
`;
}, "renderers/shaders/ShaderChunk/displacementmap_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/displacementmap_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_DISPLACEMENTMAP

	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUv ).x * displacementScale + displacementBias );

#endif
`;
}, "renderers/shaders/ShaderChunk/displacementmap_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/emissivemap_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_EMISSIVEMAP

	vec4 emissiveColor = texture2D( emissiveMap, vUv );

	emissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor ).rgb;

	totalEmissiveRadiance *= emissiveColor.rgb;

#endif
`;
}, "renderers/shaders/ShaderChunk/emissivemap_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/emissivemap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_EMISSIVEMAP

	uniform sampler2D emissiveMap;

#endif
`;
}, "renderers/shaders/ShaderChunk/emissivemap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/encodings_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
gl_FragColor = linearToOutputTexel( gl_FragColor );
`;
}, "renderers/shaders/ShaderChunk/encodings_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/encodings_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
// For a discussion of what this is, please read this: http://lousodrome.net/blog/light/2013/05/26/gamma-correct-and-hdr-rendering-in-a-32-bits-buffer/

vec4 LinearToLinear( in vec4 value ) {
	return value;
}

vec4 GammaToLinear( in vec4 value, in float gammaFactor ) {
	return vec4( pow( value.rgb, vec3( gammaFactor ) ), value.a );
}

vec4 LinearToGamma( in vec4 value, in float gammaFactor ) {
	return vec4( pow( value.rgb, vec3( 1.0 / gammaFactor ) ), value.a );
}

vec4 sRGBToLinear( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

vec4 RGBEToLinear( in vec4 value ) {
	return vec4( value.rgb * exp2( value.a * 255.0 - 128.0 ), 1.0 );
}

vec4 LinearToRGBE( in vec4 value ) {
	float maxComponent = max( max( value.r, value.g ), value.b );
	float fExp = clamp( ceil( log2( maxComponent ) ), -128.0, 127.0 );
	return vec4( value.rgb / exp2( fExp ), ( fExp + 128.0 ) / 255.0 );
	// return vec4( value.brg, ( 3.0 + 128.0 ) / 256.0 );
}

// reference: http://iwasbeingirony.blogspot.ca/2010/06/difference-between-rgbm-and-rgbd.html
vec4 RGBMToLinear( in vec4 value, in float maxRange ) {
	return vec4( value.rgb * value.a * maxRange, 1.0 );
}

vec4 LinearToRGBM( in vec4 value, in float maxRange ) {
	float maxRGB = max( value.r, max( value.g, value.b ) );
	float M = clamp( maxRGB / maxRange, 0.0, 1.0 );
	M = ceil( M * 255.0 ) / 255.0;
	return vec4( value.rgb / ( M * maxRange ), M );
}

// reference: http://iwasbeingirony.blogspot.ca/2010/06/difference-between-rgbm-and-rgbd.html
vec4 RGBDToLinear( in vec4 value, in float maxRange ) {
	return vec4( value.rgb * ( ( maxRange / 255.0 ) / value.a ), 1.0 );
}

vec4 LinearToRGBD( in vec4 value, in float maxRange ) {
	float maxRGB = max( value.r, max( value.g, value.b ) );
	float D = max( maxRange / maxRGB, 1.0 );
	// NOTE: The implementation with min causes the shader to not compile on
	// a common Alcatel A502DL in Chrome 78/Android 8.1. Some research suggests 
	// that the chipset is Mediatek MT6739 w/ IMG PowerVR GE8100 GPU.
	// D = min( floor( D ) / 255.0, 1.0 );
	D = clamp( floor( D ) / 255.0, 0.0, 1.0 );
	return vec4( value.rgb * ( D * ( 255.0 / maxRange ) ), D );
}

// LogLuv reference: http://graphicrants.blogspot.ca/2009/04/rgbm-color-encoding.html

// M matrix, for encoding
const mat3 cLogLuvM = mat3( 0.2209, 0.3390, 0.4184, 0.1138, 0.6780, 0.7319, 0.0102, 0.1130, 0.2969 );
vec4 LinearToLogLuv( in vec4 value ) {
	vec3 Xp_Y_XYZp = cLogLuvM * value.rgb;
	Xp_Y_XYZp = max( Xp_Y_XYZp, vec3( 1e-6, 1e-6, 1e-6 ) );
	vec4 vResult;
	vResult.xy = Xp_Y_XYZp.xy / Xp_Y_XYZp.z;
	float Le = 2.0 * log2(Xp_Y_XYZp.y) + 127.0;
	vResult.w = fract( Le );
	vResult.z = ( Le - ( floor( vResult.w * 255.0 ) ) / 255.0 ) / 255.0;
	return vResult;
}

// Inverse M matrix, for decoding
const mat3 cLogLuvInverseM = mat3( 6.0014, -2.7008, -1.7996, -1.3320, 3.1029, -5.7721, 0.3008, -1.0882, 5.6268 );
vec4 LogLuvToLinear( in vec4 value ) {
	float Le = value.z * 255.0 + value.w;
	vec3 Xp_Y_XYZp;
	Xp_Y_XYZp.y = exp2( ( Le - 127.0 ) / 2.0 );
	Xp_Y_XYZp.z = Xp_Y_XYZp.y / value.y;
	Xp_Y_XYZp.x = value.x * Xp_Y_XYZp.z;
	vec3 vRGB = cLogLuvInverseM * Xp_Y_XYZp.rgb;
	return vec4( max( vRGB, 0.0 ), 1.0 );
}
`;
}, "renderers/shaders/ShaderChunk/encodings_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/envmap_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_ENVMAP

	#ifdef ENV_WORLDPOS

		vec3 cameraToFrag;

		if ( isOrthographic ) {

			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

		} else {

			cameraToFrag = normalize( vWorldPosition - cameraPosition );

		}

		// Transforming Normal Vectors with the Inverse Transformation
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

		#ifdef ENVMAP_MODE_REFLECTION

			vec3 reflectVec = reflect( cameraToFrag, worldNormal );

		#else

			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );

		#endif

	#else

		vec3 reflectVec = vReflect;

	#endif

	#ifdef ENVMAP_TYPE_CUBE

		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );

	#elif defined( ENVMAP_TYPE_CUBE_UV )

		vec4 envColor = textureCubeUV( envMap, reflectVec, 0.0 );

	#else

		vec4 envColor = vec4( 0.0 );

	#endif

	#ifndef ENVMAP_TYPE_CUBE_UV

		envColor = envMapTexelToLinear( envColor );

	#endif

	#ifdef ENVMAP_BLENDING_MULTIPLY

		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );

	#elif defined( ENVMAP_BLENDING_MIX )

		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );

	#elif defined( ENVMAP_BLENDING_ADD )

		outgoingLight += envColor.xyz * specularStrength * reflectivity;

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/envmap_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/envmap_common_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_ENVMAP

	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform int maxMipLevel;

	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif
`;
}, "renderers/shaders/ShaderChunk/envmap_common_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/envmap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_ENVMAP

	uniform float reflectivity;

	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )

		#define ENV_WORLDPOS

	#endif

	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/envmap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/envmap_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_ENVMAP

	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) ||defined( PHONG )

		#define ENV_WORLDPOS

	#endif

	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;

	#else

		varying vec3 vReflect;
		uniform float refractionRatio;

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/envmap_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/envmap_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_ENVMAP

	#ifdef ENV_WORLDPOS

		vWorldPosition = worldPosition.xyz;

	#else

		vec3 cameraToVertex;

		if ( isOrthographic ) {

			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

		} else {

			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );

		}

		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );

		#ifdef ENVMAP_MODE_REFLECTION

			vReflect = reflect( cameraToVertex, worldNormal );

		#else

			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );

		#endif

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/envmap_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/fog_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_FOG

	fogDepth = - mvPosition.z;

#endif
`;
}, "renderers/shaders/ShaderChunk/fog_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/fog_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_FOG

	varying float fogDepth;

#endif
`;
}, "renderers/shaders/ShaderChunk/fog_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/fog_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_FOG

	#ifdef FOG_EXP2

		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );

	#else

		float fogFactor = smoothstep( fogNear, fogFar, fogDepth );

	#endif

	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

#endif
`;
}, "renderers/shaders/ShaderChunk/fog_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/fog_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_FOG

	uniform vec3 fogColor;
	varying float fogDepth;

	#ifdef FOG_EXP2

		uniform float fogDensity;

	#else

		uniform float fogNear;
		uniform float fogFar;

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/fog_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/gradientmap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `

#ifdef USE_GRADIENTMAP

	uniform sampler2D gradientMap;

#endif

vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {

	// dotNL will be from -1.0 to 1.0
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );

	#ifdef USE_GRADIENTMAP

		return texture2D( gradientMap, coord ).rgb;

	#else

		return ( coord.x < 0.7 ) ? vec3( 0.7 ) : vec3( 1.0 );

	#endif

}
`;
}, "renderers/shaders/ShaderChunk/gradientmap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/lightmap_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_LIGHTMAP

	vec4 lightMapTexel= texture2D( lightMap, vUv2 );
	reflectedLight.indirectDiffuse += PI * lightMapTexelToLinear( lightMapTexel ).rgb * lightMapIntensity; // factor of PI should not be present; included here to prevent breakage

#endif
`;
}, "renderers/shaders/ShaderChunk/lightmap_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/lightmap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_LIGHTMAP

	uniform sampler2D lightMap;
	uniform float lightMapIntensity;

#endif
`;
}, "renderers/shaders/ShaderChunk/lightmap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_lambert_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
vec3 diffuse = vec3( 1.0 );

GeometricContext geometry;
geometry.position = mvPosition.xyz;
geometry.normal = normalize( transformedNormal );
geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( -mvPosition.xyz );

GeometricContext backGeometry;
backGeometry.position = geometry.position;
backGeometry.normal = -geometry.normal;
backGeometry.viewDir = geometry.viewDir;

vLightFront = vec3( 0.0 );
vIndirectFront = vec3( 0.0 );
#ifdef DOUBLE_SIDED
	vLightBack = vec3( 0.0 );
	vIndirectBack = vec3( 0.0 );
#endif

IncidentLight directLight;
float dotNL;
vec3 directLightColor_Diffuse;

vIndirectFront += getAmbientLightIrradiance( ambientLightColor );

vIndirectFront += getLightProbeIrradiance( lightProbe, geometry );

#ifdef DOUBLE_SIDED

	vIndirectBack += getAmbientLightIrradiance( ambientLightColor );

	vIndirectBack += getLightProbeIrradiance( lightProbe, backGeometry );

#endif

#if NUM_POINT_LIGHTS > 0

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

		getPointDirectLightIrradiance( pointLights[ i ], geometry, directLight );

		dotNL = dot( geometry.normal, directLight.direction );
		directLightColor_Diffuse = PI * directLight.color;

		vLightFront += saturate( dotNL ) * directLightColor_Diffuse;

		#ifdef DOUBLE_SIDED

			vLightBack += saturate( -dotNL ) * directLightColor_Diffuse;

		#endif

	}
	#pragma unroll_loop_end

#endif

#if NUM_SPOT_LIGHTS > 0

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

		getSpotDirectLightIrradiance( spotLights[ i ], geometry, directLight );

		dotNL = dot( geometry.normal, directLight.direction );
		directLightColor_Diffuse = PI * directLight.color;

		vLightFront += saturate( dotNL ) * directLightColor_Diffuse;

		#ifdef DOUBLE_SIDED

			vLightBack += saturate( -dotNL ) * directLightColor_Diffuse;

		#endif
	}
	#pragma unroll_loop_end

#endif

/*
#if NUM_RECT_AREA_LIGHTS > 0

	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {

		// TODO (abelnation): implement

	}

#endif
*/

#if NUM_DIR_LIGHTS > 0

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

		getDirectionalDirectLightIrradiance( directionalLights[ i ], geometry, directLight );

		dotNL = dot( geometry.normal, directLight.direction );
		directLightColor_Diffuse = PI * directLight.color;

		vLightFront += saturate( dotNL ) * directLightColor_Diffuse;

		#ifdef DOUBLE_SIDED

			vLightBack += saturate( -dotNL ) * directLightColor_Diffuse;

		#endif

	}
	#pragma unroll_loop_end

#endif

#if NUM_HEMI_LIGHTS > 0

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {

		vIndirectFront += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );

		#ifdef DOUBLE_SIDED

			vIndirectBack += getHemisphereLightIrradiance( hemisphereLights[ i ], backGeometry );

		#endif

	}
	#pragma unroll_loop_end

#endif
`;
}, "renderers/shaders/ShaderChunk/lights_lambert_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_pars_begin.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform bool receiveShadow;
uniform vec3 ambientLightColor;
uniform vec3 lightProbe[ 9 ];

// get the irradiance (radiance convolved with cosine lobe) at the point 'normal' on the unit sphere
// source: https://graphics.stanford.edu/papers/envmap/envmap.pdf
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {

	// normal is assumed to have unit length

	float x = normal.x, y = normal.y, z = normal.z;

	// band 0
	vec3 result = shCoefficients[ 0 ] * 0.886227;

	// band 1
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;

	// band 2
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );

	return result;

}

vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in GeometricContext geometry ) {

	vec3 worldNormal = inverseTransformDirection( geometry.normal, viewMatrix );

	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );

	return irradiance;

}

vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {

	vec3 irradiance = ambientLightColor;

	#ifndef PHYSICALLY_CORRECT_LIGHTS

		irradiance *= PI;

	#endif

	return irradiance;

}

#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

	void getDirectionalDirectLightIrradiance( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight directLight ) {

		directLight.color = directionalLight.color;
		directLight.direction = directionalLight.direction;
		directLight.visible = true;

	}

#endif


#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

	// directLight is an out parameter as having it as a return value caused compiler errors on some devices
	void getPointDirectLightIrradiance( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight directLight ) {

		vec3 lVector = pointLight.position - geometry.position;
		directLight.direction = normalize( lVector );

		float lightDistance = length( lVector );

		directLight.color = pointLight.color;
		directLight.color *= punctualLightIntensityToIrradianceFactor( lightDistance, pointLight.distance, pointLight.decay );
		directLight.visible = ( directLight.color != vec3( 0.0 ) );

	}

#endif


#if NUM_SPOT_LIGHTS > 0

	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};

	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];

	// directLight is an out parameter as having it as a return value caused compiler errors on some devices
	void getSpotDirectLightIrradiance( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight directLight ) {

		vec3 lVector = spotLight.position - geometry.position;
		directLight.direction = normalize( lVector );

		float lightDistance = length( lVector );
		float angleCos = dot( directLight.direction, spotLight.direction );

		if ( angleCos > spotLight.coneCos ) {

			float spotEffect = smoothstep( spotLight.coneCos, spotLight.penumbraCos, angleCos );

			directLight.color = spotLight.color;
			directLight.color *= spotEffect * punctualLightIntensityToIrradianceFactor( lightDistance, spotLight.distance, spotLight.decay );
			directLight.visible = true;

		} else {

			directLight.color = vec3( 0.0 );
			directLight.visible = false;

		}
	}

#endif


#if NUM_RECT_AREA_LIGHTS > 0

	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};

	// Pre-computed values of LinearTransformedCosine approximation of BRDF
	// BRDF approximation Texture is 64x64
	uniform sampler2D ltc_1; // RGBA Float
	uniform sampler2D ltc_2; // RGBA Float

	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];

#endif


#if NUM_HEMI_LIGHTS > 0

	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};

	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];

	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in GeometricContext geometry ) {

		float dotNL = dot( geometry.normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;

		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );

		#ifndef PHYSICALLY_CORRECT_LIGHTS

			irradiance *= PI;

		#endif

		return irradiance;

	}

#endif
`;
}, "renderers/shaders/ShaderChunk/lights_pars_begin.glsl.js", []);

//renderers/shaders/ShaderChunk/envmap_physical_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_ENVMAP )

	#ifdef ENVMAP_MODE_REFRACTION
		uniform float refractionRatio;
	#endif

	vec3 getLightProbeIndirectIrradiance( /*const in SpecularLightProbe specularLightProbe,*/ const in GeometricContext geometry, const in int maxMIPLevel ) {

		vec3 worldNormal = inverseTransformDirection( geometry.normal, viewMatrix );

		#ifdef ENVMAP_TYPE_CUBE

			vec3 queryVec = vec3( flipEnvMap * worldNormal.x, worldNormal.yz );

			// TODO: replace with properly filtered cubemaps and access the irradiance LOD level, be it the last LOD level
			// of a specular cubemap, or just the default level of a specially created irradiance cubemap.

			#ifdef TEXTURE_LOD_EXT

				vec4 envMapColor = textureCubeLodEXT( envMap, queryVec, float( maxMIPLevel ) );

			#else

				// force the bias high to get the last LOD level as it is the most blurred.
				vec4 envMapColor = textureCube( envMap, queryVec, float( maxMIPLevel ) );

			#endif

			envMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;

		#elif defined( ENVMAP_TYPE_CUBE_UV )

			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );

		#else

			vec4 envMapColor = vec4( 0.0 );

		#endif

		return PI * envMapColor.rgb * envMapIntensity;

	}

	// Trowbridge-Reitz distribution to Mip level, following the logic of http://casual-effects.blogspot.ca/2011/08/plausible-environment-lighting-in-two.html
	float getSpecularMIPLevel( const in float roughness, const in int maxMIPLevel ) {

		float maxMIPLevelScalar = float( maxMIPLevel );

		float sigma = PI * roughness * roughness / ( 1.0 + roughness );
		float desiredMIPLevel = maxMIPLevelScalar + log2( sigma );

		// clamp to allowable LOD ranges.
		return clamp( desiredMIPLevel, 0.0, maxMIPLevelScalar );

	}

	vec3 getLightProbeIndirectRadiance( /*const in SpecularLightProbe specularLightProbe,*/ const in vec3 viewDir, const in vec3 normal, const in float roughness, const in int maxMIPLevel ) {

		#ifdef ENVMAP_MODE_REFLECTION

			vec3 reflectVec = reflect( -viewDir, normal );

			// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

		#else

			vec3 reflectVec = refract( -viewDir, normal, refractionRatio );

		#endif

		reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

		float specularMIPLevel = getSpecularMIPLevel( roughness, maxMIPLevel );

		#ifdef ENVMAP_TYPE_CUBE

			vec3 queryReflectVec = vec3( flipEnvMap * reflectVec.x, reflectVec.yz );

			#ifdef TEXTURE_LOD_EXT

				vec4 envMapColor = textureCubeLodEXT( envMap, queryReflectVec, specularMIPLevel );

			#else

				vec4 envMapColor = textureCube( envMap, queryReflectVec, specularMIPLevel );

			#endif

			envMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;

		#elif defined( ENVMAP_TYPE_CUBE_UV )

			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );

		#endif

		return envMapColor.rgb * envMapIntensity;

	}

#endif
`;
}, "renderers/shaders/ShaderChunk/envmap_physical_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_toon_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;
`;
}, "renderers/shaders/ShaderChunk/lights_toon_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_toon_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif


struct ToonMaterial {

	vec3 diffuseColor;

};

void RE_Direct_Toon( const in IncidentLight directLight, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {

	vec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;

	#ifndef PHYSICALLY_CORRECT_LIGHTS

		irradiance *= PI; // punctual light

	#endif

	reflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );

}

void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {

	reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );

}

#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon

#define Material_LightProbeLOD( material )	(0)
`;
}, "renderers/shaders/ShaderChunk/lights_toon_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_phong_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;
`;
}, "renderers/shaders/ShaderChunk/lights_phong_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_phong_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif


struct BlinnPhongMaterial {

	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;

};

void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {

	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;

	#ifndef PHYSICALLY_CORRECT_LIGHTS

		irradiance *= PI; // punctual light

	#endif

	reflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );

	reflectedLight.directSpecular += irradiance * BRDF_Specular_BlinnPhong( directLight, geometry, material.specularColor, material.specularShininess ) * material.specularStrength;

}

void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {

	reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );

}

#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong

#define Material_LightProbeLOD( material )	(0)
`;
}, "renderers/shaders/ShaderChunk/lights_phong_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_physical_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );

vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );

material.specularRoughness = max( roughnessFactor, 0.0525 );// 0.0525 corresponds to the base mip of a 256 cubemap.
material.specularRoughness += geometryRoughness;
material.specularRoughness = min( material.specularRoughness, 1.0 );

#ifdef REFLECTIVITY

	material.specularColor = mix( vec3( MAXIMUM_SPECULAR_COEFFICIENT * pow2( reflectivity ) ), diffuseColor.rgb, metalnessFactor );

#else

	material.specularColor = mix( vec3( DEFAULT_SPECULAR_COEFFICIENT ), diffuseColor.rgb, metalnessFactor );

#endif

#ifdef CLEARCOAT

	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;

	#ifdef USE_CLEARCOATMAP

		material.clearcoat *= texture2D( clearcoatMap, vUv ).x;

	#endif

	#ifdef USE_CLEARCOAT_ROUGHNESSMAP

		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vUv ).y;

	#endif

	material.clearcoat = saturate( material.clearcoat ); // Burley clearcoat model
	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );

#endif

#ifdef USE_SHEEN

	material.sheenColor = sheen;

#endif
`;
}, "renderers/shaders/ShaderChunk/lights_physical_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_physical_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
struct PhysicalMaterial {

	vec3 diffuseColor;
	float specularRoughness;
	vec3 specularColor;

#ifdef CLEARCOAT
	float clearcoat;
	float clearcoatRoughness;
#endif
#ifdef USE_SHEEN
	vec3 sheenColor;
#endif

};

#define MAXIMUM_SPECULAR_COEFFICIENT 0.16
#define DEFAULT_SPECULAR_COEFFICIENT 0.04

// Clear coat directional hemishperical reflectance (this approximation should be improved)
float clearcoatDHRApprox( const in float roughness, const in float dotNL ) {

	return DEFAULT_SPECULAR_COEFFICIENT + ( 1.0 - DEFAULT_SPECULAR_COEFFICIENT ) * ( pow( 1.0 - dotNL, 5.0 ) * pow( 1.0 - roughness, 2.0 ) );

}

#if NUM_RECT_AREA_LIGHTS > 0

	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {

		vec3 normal = geometry.normal;
		vec3 viewDir = geometry.viewDir;
		vec3 position = geometry.position;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.specularRoughness;

		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;

		vec2 uv = LTC_Uv( normal, viewDir, roughness );

		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );

		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);

		// LTC Fresnel Approximation by Stephen Hill
		// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );

		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );

		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );

	}

#endif

void RE_Direct_Physical( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {

	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );

	vec3 irradiance = dotNL * directLight.color;

	#ifndef PHYSICALLY_CORRECT_LIGHTS

		irradiance *= PI; // punctual light

	#endif

	#ifdef CLEARCOAT

		float ccDotNL = saturate( dot( geometry.clearcoatNormal, directLight.direction ) );

		vec3 ccIrradiance = ccDotNL * directLight.color;

		#ifndef PHYSICALLY_CORRECT_LIGHTS

			ccIrradiance *= PI; // punctual light

		#endif

		float clearcoatDHR = material.clearcoat * clearcoatDHRApprox( material.clearcoatRoughness, ccDotNL );

		reflectedLight.directSpecular += ccIrradiance * material.clearcoat * BRDF_Specular_GGX( directLight, geometry.viewDir, geometry.clearcoatNormal, vec3( DEFAULT_SPECULAR_COEFFICIENT ), material.clearcoatRoughness );

	#else

		float clearcoatDHR = 0.0;

	#endif

	#ifdef USE_SHEEN
		reflectedLight.directSpecular += ( 1.0 - clearcoatDHR ) * irradiance * BRDF_Specular_Sheen(
			material.specularRoughness,
			directLight.direction,
			geometry,
			material.sheenColor
		);
	#else
		reflectedLight.directSpecular += ( 1.0 - clearcoatDHR ) * irradiance * BRDF_Specular_GGX( directLight, geometry.viewDir, geometry.normal, material.specularColor, material.specularRoughness);
	#endif

	reflectedLight.directDiffuse += ( 1.0 - clearcoatDHR ) * irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
}

void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {

	reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );

}

void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {

	#ifdef CLEARCOAT

		float ccDotNV = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );

		reflectedLight.indirectSpecular += clearcoatRadiance * material.clearcoat * BRDF_Specular_GGX_Environment( geometry.viewDir, geometry.clearcoatNormal, vec3( DEFAULT_SPECULAR_COEFFICIENT ), material.clearcoatRoughness );

		float ccDotNL = ccDotNV;
		float clearcoatDHR = material.clearcoat * clearcoatDHRApprox( material.clearcoatRoughness, ccDotNL );

	#else

		float clearcoatDHR = 0.0;

	#endif

	float clearcoatInv = 1.0 - clearcoatDHR;

	// Both indirect specular and indirect diffuse light accumulate here

	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;

	BRDF_Specular_Multiscattering_Environment( geometry, material.specularColor, material.specularRoughness, singleScattering, multiScattering );

	vec3 diffuse = material.diffuseColor * ( 1.0 - ( singleScattering + multiScattering ) );

	reflectedLight.indirectSpecular += clearcoatInv * radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;

	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;

}

#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical

// ref: https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {

	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );

}
`;
}, "renderers/shaders/ShaderChunk/lights_physical_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_fragment_begin.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
/**
 * This is a template that can be used to light a material, it uses pluggable
 * RenderEquations (RE)for specific lighting scenarios.
 *
 * Instructions for use:
 * - Ensure that both RE_Direct, RE_IndirectDiffuse and RE_IndirectSpecular are defined
 * - If you have defined an RE_IndirectSpecular, you need to also provide a Material_LightProbeLOD. <---- ???
 * - Create a material parameter that is to be passed as the third parameter to your lighting functions.
 *
 * TODO:
 * - Add area light support.
 * - Add sphere light support.
 * - Add diffuse light probe (irradiance cubemap) support.
 */

GeometricContext geometry;

geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );

#ifdef CLEARCOAT

	geometry.clearcoatNormal = clearcoatNormal;

#endif

IncidentLight directLight;

#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )

	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

		pointLight = pointLights[ i ];

		getPointDirectLightIrradiance( pointLight, geometry, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif

		RE_Direct( directLight, geometry, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )

	SpotLight spotLight;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

		spotLight = spotLights[ i ];

		getSpotDirectLightIrradiance( spotLight, geometry, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
		#endif

		RE_Direct( directLight, geometry, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )

	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

		directionalLight = directionalLights[ i ];

		getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif

		RE_Direct( directLight, geometry, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )

	RectAreaLight rectAreaLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {

		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if defined( RE_IndirectDiffuse )

	vec3 iblIrradiance = vec3( 0.0 );

	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );

	irradiance += getLightProbeIrradiance( lightProbe, geometry );

	#if ( NUM_HEMI_LIGHTS > 0 )

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {

			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );

		}
		#pragma unroll_loop_end

	#endif

#endif

#if defined( RE_IndirectSpecular )

	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );

#endif
`;
}, "renderers/shaders/ShaderChunk/lights_fragment_begin.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_fragment_maps.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( RE_IndirectDiffuse )

	#ifdef USE_LIGHTMAP

		vec4 lightMapTexel= texture2D( lightMap, vUv2 );
		vec3 lightMapIrradiance = lightMapTexelToLinear( lightMapTexel ).rgb * lightMapIntensity;

		#ifndef PHYSICALLY_CORRECT_LIGHTS

			lightMapIrradiance *= PI; // factor of PI should not be present; included here to prevent breakage

		#endif

		irradiance += lightMapIrradiance;

	#endif

	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )

		iblIrradiance += getLightProbeIndirectIrradiance( /*lightProbe,*/ geometry, maxMipLevel );

	#endif

#endif

#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )

	radiance += getLightProbeIndirectRadiance( /*specularLightProbe,*/ geometry.viewDir, geometry.normal, material.specularRoughness, maxMipLevel );

	#ifdef CLEARCOAT

		clearcoatRadiance += getLightProbeIndirectRadiance( /*specularLightProbe,*/ geometry.viewDir, geometry.clearcoatNormal, material.clearcoatRoughness, maxMipLevel );

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/lights_fragment_maps.glsl.js", []);

//renderers/shaders/ShaderChunk/lights_fragment_end.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( RE_IndirectDiffuse )

	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );

#endif

#if defined( RE_IndirectSpecular )

	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );

#endif
`;
}, "renderers/shaders/ShaderChunk/lights_fragment_end.glsl.js", []);

//renderers/shaders/ShaderChunk/logdepthbuf_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )

	// Doing a strict comparison with == 1.0 can cause noise artifacts
	// on some platforms. See issue #17623.
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;

#endif
`;
}, "renderers/shaders/ShaderChunk/logdepthbuf_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/logdepthbuf_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )

	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;

#endif
`;
}, "renderers/shaders/ShaderChunk/logdepthbuf_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/logdepthbuf_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_LOGDEPTHBUF

	#ifdef USE_LOGDEPTHBUF_EXT

		varying float vFragDepth;
		varying float vIsPerspective;

	#else

		uniform float logDepthBufFC;

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/logdepthbuf_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/logdepthbuf_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_LOGDEPTHBUF

	#ifdef USE_LOGDEPTHBUF_EXT

		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );

	#else

		if ( isPerspectiveMatrix( projectionMatrix ) ) {

			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;

			gl_Position.z *= gl_Position.w;

		}

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/logdepthbuf_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/map_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_MAP

	vec4 texelColor = texture2D( map, vUv );

	texelColor = mapTexelToLinear( texelColor );
	diffuseColor *= texelColor;

#endif
`;
}, "renderers/shaders/ShaderChunk/map_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/map_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_MAP

	uniform sampler2D map;

#endif
`;
}, "renderers/shaders/ShaderChunk/map_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/map_particle_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_MAP ) || defined( USE_ALPHAMAP )

	vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;

#endif

#ifdef USE_MAP

	vec4 mapTexel = texture2D( map, uv );
	diffuseColor *= mapTexelToLinear( mapTexel );

#endif

#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, uv ).g;

#endif
`;
}, "renderers/shaders/ShaderChunk/map_particle_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/map_particle_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_MAP ) || defined( USE_ALPHAMAP )

	uniform mat3 uvTransform;

#endif

#ifdef USE_MAP

	uniform sampler2D map;

#endif

#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap;

#endif
`;
}, "renderers/shaders/ShaderChunk/map_particle_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/metalnessmap_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
float metalnessFactor = metalness;

#ifdef USE_METALNESSMAP

	vec4 texelMetalness = texture2D( metalnessMap, vUv );

	// reads channel B, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	metalnessFactor *= texelMetalness.b;

#endif
`;
}, "renderers/shaders/ShaderChunk/metalnessmap_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/metalnessmap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_METALNESSMAP

	uniform sampler2D metalnessMap;

#endif
`;
}, "renderers/shaders/ShaderChunk/metalnessmap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/morphnormal_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_MORPHNORMALS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in normal = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	objectNormal *= morphTargetBaseInfluence;
	objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
	objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
	objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
	objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];

#endif
`;
}, "renderers/shaders/ShaderChunk/morphnormal_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/morphtarget_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_MORPHTARGETS

	uniform float morphTargetBaseInfluence;

	#ifndef USE_MORPHNORMALS

		uniform float morphTargetInfluences[ 8 ];

	#else

		uniform float morphTargetInfluences[ 4 ];

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/morphtarget_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/morphtarget_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_MORPHTARGETS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in position = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	transformed *= morphTargetBaseInfluence;
	transformed += morphTarget0 * morphTargetInfluences[ 0 ];
	transformed += morphTarget1 * morphTargetInfluences[ 1 ];
	transformed += morphTarget2 * morphTargetInfluences[ 2 ];
	transformed += morphTarget3 * morphTargetInfluences[ 3 ];

	#ifndef USE_MORPHNORMALS

		transformed += morphTarget4 * morphTargetInfluences[ 4 ];
		transformed += morphTarget5 * morphTargetInfluences[ 5 ];
		transformed += morphTarget6 * morphTargetInfluences[ 6 ];
		transformed += morphTarget7 * morphTargetInfluences[ 7 ];

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/morphtarget_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/normal_fragment_begin.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;

#ifdef FLAT_SHADED

	// Workaround for Adreno GPUs not able to do dFdx( vViewPosition )

	vec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );
	vec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );
	vec3 normal = normalize( cross( fdx, fdy ) );

#else

	vec3 normal = normalize( vNormal );

	#ifdef DOUBLE_SIDED

		normal = normal * faceDirection;

	#endif

	#ifdef USE_TANGENT

		vec3 tangent = normalize( vTangent );
		vec3 bitangent = normalize( vBitangent );

		#ifdef DOUBLE_SIDED

			tangent = tangent * faceDirection;
			bitangent = bitangent * faceDirection;

		#endif

		#if defined( TANGENTSPACE_NORMALMAP ) || defined( USE_CLEARCOAT_NORMALMAP )

			mat3 vTBN = mat3( tangent, bitangent, normal );

		#endif

	#endif

#endif

// non perturbed normal for clearcoat among others

vec3 geometryNormal = normal;

`;
}, "renderers/shaders/ShaderChunk/normal_fragment_begin.glsl.js", []);

//renderers/shaders/ShaderChunk/normal_fragment_maps.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `

#ifdef OBJECTSPACE_NORMALMAP

	normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

	#ifdef FLIP_SIDED

		normal = - normal;

	#endif

	#ifdef DOUBLE_SIDED

		normal = normal * faceDirection;

	#endif

	normal = normalize( normalMatrix * normal );

#elif defined( TANGENTSPACE_NORMALMAP )

	vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;

	#ifdef USE_TANGENT

		normal = normalize( vTBN * mapN );

	#else

		normal = perturbNormal2Arb( -vViewPosition, normal, mapN, faceDirection );

	#endif

#elif defined( USE_BUMPMAP )

	normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd(), faceDirection );

#endif
`;
}, "renderers/shaders/ShaderChunk/normal_fragment_maps.glsl.js", []);

//renderers/shaders/ShaderChunk/normalmap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_NORMALMAP

	uniform sampler2D normalMap;
	uniform vec2 normalScale;

#endif

#ifdef OBJECTSPACE_NORMALMAP

	uniform mat3 normalMatrix;

#endif

#if ! defined ( USE_TANGENT ) && ( defined ( TANGENTSPACE_NORMALMAP ) || defined ( USE_CLEARCOAT_NORMALMAP ) )

	// Normal Mapping Without Precomputed Tangents
	// http://www.thetenthplanet.de/archives/1180

	vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec3 mapN, float faceDirection ) {

		// Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988

		vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
		vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
		vec2 st0 = dFdx( vUv.st );
		vec2 st1 = dFdy( vUv.st );

		vec3 N = surf_norm; // normalized

		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );

		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;

		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : faceDirection * inversesqrt( det );

		return normalize( T * ( mapN.x * scale ) + B * ( mapN.y * scale ) + N * mapN.z );

	}

#endif
`;
}, "renderers/shaders/ShaderChunk/normalmap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/clearcoat_normal_fragment_begin.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef CLEARCOAT

	vec3 clearcoatNormal = geometryNormal;

#endif
`;
}, "renderers/shaders/ShaderChunk/clearcoat_normal_fragment_begin.glsl.js", []);

//renderers/shaders/ShaderChunk/clearcoat_normal_fragment_maps.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_CLEARCOAT_NORMALMAP

	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;

	#ifdef USE_TANGENT

		clearcoatNormal = normalize( vTBN * clearcoatMapN );

	#else

		clearcoatNormal = perturbNormal2Arb( - vViewPosition, clearcoatNormal, clearcoatMapN, faceDirection );

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/clearcoat_normal_fragment_maps.glsl.js", []);

//renderers/shaders/ShaderChunk/clearcoat_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `

#ifdef USE_CLEARCOATMAP

	uniform sampler2D clearcoatMap;

#endif

#ifdef USE_CLEARCOAT_ROUGHNESSMAP

	uniform sampler2D clearcoatRoughnessMap;

#endif

#ifdef USE_CLEARCOAT_NORMALMAP

	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;

#endif
`;
}, "renderers/shaders/ShaderChunk/clearcoat_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/packing.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}

vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}

const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

const float ShiftRight8 = 1. / 256.;

vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8; // tidy overflow
	return r * PackUpscale;
}

float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}

vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ));
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w);
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}

// NOTE: viewZ/eyeZ is < 0 when in front of the camera per OpenGL conventions

float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {
	return linearClipZ * ( near - far ) - near;
}

float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return (( near + viewZ ) * far ) / (( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * invClipZ - far );
}
`;
}, "renderers/shaders/ShaderChunk/packing.glsl.js", []);

//renderers/shaders/ShaderChunk/premultiplied_alpha_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef PREMULTIPLIED_ALPHA

	// Get get normal blending with premultipled, use with CustomBlending, OneFactor, OneMinusSrcAlphaFactor, AddEquation.
	gl_FragColor.rgb *= gl_FragColor.a;

#endif
`;
}, "renderers/shaders/ShaderChunk/premultiplied_alpha_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/project_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;
`;
}, "renderers/shaders/ShaderChunk/project_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/dithering_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef DITHERING

	gl_FragColor.rgb = dithering( gl_FragColor.rgb );

#endif
`;
}, "renderers/shaders/ShaderChunk/dithering_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/dithering_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef DITHERING

	// based on https://www.shadertoy.com/view/MslGR8
	vec3 dithering( vec3 color ) {
		//Calculate grid position
		float grid_position = rand( gl_FragCoord.xy );

		//Shift the individual colors differently, thus making it even harder to see the dithering pattern
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );

		//modify shift acording to grid position.
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );

		//shift the color by dither_shift
		return color + dither_shift_RGB;
	}

#endif
`;
}, "renderers/shaders/ShaderChunk/dithering_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/roughnessmap_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
float roughnessFactor = roughness;

#ifdef USE_ROUGHNESSMAP

	vec4 texelRoughness = texture2D( roughnessMap, vUv );

	// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	roughnessFactor *= texelRoughness.g;

#endif
`;
}, "renderers/shaders/ShaderChunk/roughnessmap_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/roughnessmap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_ROUGHNESSMAP

	uniform sampler2D roughnessMap;

#endif
`;
}, "renderers/shaders/ShaderChunk/roughnessmap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/shadowmap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_SHADOWMAP

	#if NUM_DIR_LIGHT_SHADOWS > 0

		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#if NUM_SPOT_LIGHT_SHADOWS > 0

		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		varying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHT_SHADOWS ];

		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];

		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};

		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];

	#endif

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): create uniforms for area light shadows

	#endif
	*/

	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {

		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );

	}

	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {

		return unpackRGBATo2Half( texture2D( shadow, uv ) );

	}

	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){

		float occlusion = 1.0;

		vec2 distribution = texture2DDistribution( shadow, uv );

		float hard_shadow = step( compare , distribution.x ); // Hard Shadow

		if (hard_shadow != 1.0 ) {

			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance ); // Chebeyshevs inequality
			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 ); // 0.3 reduces light bleed
			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );

		}
		return occlusion;

	}

	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

		float shadow = 1.0;

		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;

		// if ( something && something ) breaks ATI OpenGL shader compiler
		// if ( all( something, something ) ) using this instead

		bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
		bool inFrustum = all( inFrustumVec );

		bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );

		bool frustumTest = all( frustumTestVec );

		if ( frustumTest ) {

		#if defined( SHADOWMAP_TYPE_PCF )

			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;

			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;

			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );

		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )

			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;

			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;

			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ), 
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ), 
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ), 
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ), 
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ), 
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ), 
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );

		#elif defined( SHADOWMAP_TYPE_VSM )

			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );

		#else // no percentage-closer filtering:

			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );

		#endif

		}

		return shadow;

	}

	// cubeToUV() maps a 3D direction vector suitable for cube texture mapping to a 2D
	// vector suitable for 2D texture mapping. This code uses the following layout for the
	// 2D texture:
	//
	// xzXZ
	//  y Y
	//
	// Y - Positive y direction
	// y - Negative y direction
	// X - Positive x direction
	// x - Negative x direction
	// Z - Positive z direction
	// z - Negative z direction
	//
	// Source and test bed:
	// https://gist.github.com/tschw/da10c43c467ce8afd0c4

	vec2 cubeToUV( vec3 v, float texelSizeY ) {

		// Number of texels to avoid at the edge of each square

		vec3 absV = abs( v );

		// Intersect unit cube

		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;

		// Apply scale to avoid seams

		// two texels less per square (one texel will do for NEAREST)
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );

		// Unwrap

		// space: -1 ... 1 range for each square
		//
		// #X##		dim    := ( 4 , 2 )
		//  # #		center := ( 1 , 1 )

		vec2 planar = v.xy;

		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;

		if ( absV.z >= almostOne ) {

			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;

		} else if ( absV.x >= almostOne ) {

			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;

		} else if ( absV.y >= almostOne ) {

			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;

		}

		// Transform to UV space

		// scale := 0.5 / dim
		// translate := ( center + 0.5 ) / dim
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );

	}

	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {

		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );

		// for point lights, the uniform @vShadowCoord is re-purposed to hold
		// the vector from the light to the world-space position of the fragment.
		vec3 lightToPosition = shadowCoord.xyz;

		// dp = normalized distance from light to fragment position
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear ); // need to clamp?
		dp += shadowBias;

		// bd3D = base direction 3D
		vec3 bd3D = normalize( lightToPosition );

		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )

			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;

			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );

		#else // no percentage-closer filtering

			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );

		#endif

	}

#endif
`;
}, "renderers/shaders/ShaderChunk/shadowmap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/shadowmap_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_SHADOWMAP

	#if NUM_DIR_LIGHT_SHADOWS > 0

		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#if NUM_SPOT_LIGHT_SHADOWS > 0

		uniform mat4 spotShadowMatrix[ NUM_SPOT_LIGHT_SHADOWS ];
		varying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHT_SHADOWS ];

		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];

		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};

		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];

	#endif

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): uniforms for area light shadows

	#endif
	*/

#endif
`;
}, "renderers/shaders/ShaderChunk/shadowmap_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/shadowmap_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_SHADOWMAP

	#if NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SPOT_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0

		// Offsetting the position used for querying occlusion along the world normal can be used to reduce shadow acne.
		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		vec4 shadowWorldPosition;

	#endif

	#if NUM_DIR_LIGHT_SHADOWS > 0

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

		shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
		vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;

	}
	#pragma unroll_loop_end

	#endif

	#if NUM_SPOT_LIGHT_SHADOWS > 0

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {

		shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias, 0 );
		vSpotShadowCoord[ i ] = spotShadowMatrix[ i ] * shadowWorldPosition;

	}
	#pragma unroll_loop_end

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {

		shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
		vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;

	}
	#pragma unroll_loop_end

	#endif

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): update vAreaShadowCoord with area light info

	#endif
	*/

#endif
`;
}, "renderers/shaders/ShaderChunk/shadowmap_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/shadowmask_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
float getShadowMask() {

	float shadow = 1.0;

	#ifdef USE_SHADOWMAP

	#if NUM_DIR_LIGHT_SHADOWS > 0

	DirectionalLightShadow directionalLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	#if NUM_SPOT_LIGHT_SHADOWS > 0

	SpotLightShadow spotLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {

		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

	PointLightShadow pointLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {

		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): update shadow for Area light

	#endif
	*/

	#endif

	return shadow;

}
`;
}, "renderers/shaders/ShaderChunk/shadowmask_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/skinbase_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_SKINNING

	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );

#endif
`;
}, "renderers/shaders/ShaderChunk/skinbase_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/skinning_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_SKINNING

	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;

	#ifdef BONE_TEXTURE

		uniform highp sampler2D boneTexture;
		uniform int boneTextureSize;

		mat4 getBoneMatrix( const in float i ) {

			float j = i * 4.0;
			float x = mod( j, float( boneTextureSize ) );
			float y = floor( j / float( boneTextureSize ) );

			float dx = 1.0 / float( boneTextureSize );
			float dy = 1.0 / float( boneTextureSize );

			y = dy * ( y + 0.5 );

			vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
			vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
			vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
			vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );

			mat4 bone = mat4( v1, v2, v3, v4 );

			return bone;

		}

	#else

		uniform mat4 boneMatrices[ MAX_BONES ];

		mat4 getBoneMatrix( const in float i ) {

			mat4 bone = boneMatrices[ int(i) ];
			return bone;

		}

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/skinning_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/skinning_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_SKINNING

	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );

	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;

	transformed = ( bindMatrixInverse * skinned ).xyz;

#endif
`;
}, "renderers/shaders/ShaderChunk/skinning_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/skinnormal_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_SKINNING

	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;

	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;

	#ifdef USE_TANGENT

		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;

	#endif

#endif
`;
}, "renderers/shaders/ShaderChunk/skinnormal_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/specularmap_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
float specularStrength;

#ifdef USE_SPECULARMAP

	vec4 texelSpecular = texture2D( specularMap, vUv );
	specularStrength = texelSpecular.r;

#else

	specularStrength = 1.0;

#endif
`;
}, "renderers/shaders/ShaderChunk/specularmap_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/specularmap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_SPECULARMAP

	uniform sampler2D specularMap;

#endif
`;
}, "renderers/shaders/ShaderChunk/specularmap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/tonemapping_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( TONE_MAPPING )

	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );

#endif
`;
}, "renderers/shaders/ShaderChunk/tonemapping_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/tonemapping_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifndef saturate
// <common> may have defined saturate() already
#define saturate(a) clamp( a, 0.0, 1.0 )
#endif

uniform float toneMappingExposure;

// exposure only
vec3 LinearToneMapping( vec3 color ) {

	return toneMappingExposure * color;

}

// source: https://www.cs.utah.edu/~reinhard/cdrom/
vec3 ReinhardToneMapping( vec3 color ) {

	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );

}

// source: http://filmicworlds.com/blog/filmic-tonemapping-operators/
vec3 OptimizedCineonToneMapping( vec3 color ) {

	// optimized filmic operator by Jim Hejl and Richard Burgess-Dawson
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );

}

// source: https://github.com/selfshadow/ltc_code/blob/master/webgl/shaders/ltc/ltc_blit.fs
vec3 RRTAndODTFit( vec3 v ) {

	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;

}

// this implementation of ACES is modified to accommodate a brighter viewing environment.
// the scale factor of 1/0.6 is subjective. see discussion in #19621.

vec3 ACESFilmicToneMapping( vec3 color ) {

	// sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ), // transposed from source
		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);

	// ODT_SAT => XYZ => D60_2_D65 => sRGB
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ), // transposed from source
		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);

	color *= toneMappingExposure / 0.6;

	color = ACESInputMat * color;

	// Apply RRT and ODT
	color = RRTAndODTFit( color );

	color = ACESOutputMat * color;

	// Clamp to [0, 1]
	return saturate( color );

}

vec3 CustomToneMapping( vec3 color ) { return color; }
`;
}, "renderers/shaders/ShaderChunk/tonemapping_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/transmissionmap_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_TRANSMISSIONMAP

	totalTransmission *= texture2D( transmissionMap, vUv ).r;

#endif
`;
}, "renderers/shaders/ShaderChunk/transmissionmap_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/transmissionmap_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_TRANSMISSIONMAP

	uniform sampler2D transmissionMap;

#endif
`;
}, "renderers/shaders/ShaderChunk/transmissionmap_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/uv_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )

	varying vec2 vUv;

#endif
`;
}, "renderers/shaders/ShaderChunk/uv_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/uv_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_UV

	#ifdef UVS_VERTEX_ONLY

		vec2 vUv;

	#else

		varying vec2 vUv;

	#endif

	uniform mat3 uvTransform;

#endif
`;
}, "renderers/shaders/ShaderChunk/uv_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/uv_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#ifdef USE_UV

	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

#endif
`;
}, "renderers/shaders/ShaderChunk/uv_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/uv2_pars_fragment.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )

	varying vec2 vUv2;

#endif
`;
}, "renderers/shaders/ShaderChunk/uv2_pars_fragment.glsl.js", []);

//renderers/shaders/ShaderChunk/uv2_pars_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )

	attribute vec2 uv2;
	varying vec2 vUv2;

	uniform mat3 uv2Transform;

#endif
`;
}, "renderers/shaders/ShaderChunk/uv2_pars_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/uv2_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )

	vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;

#endif
`;
}, "renderers/shaders/ShaderChunk/uv2_vertex.glsl.js", []);

//renderers/shaders/ShaderChunk/worldpos_vertex.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )

	vec4 worldPosition = vec4( transformed, 1.0 );

	#ifdef USE_INSTANCING

		worldPosition = instanceMatrix * worldPosition;

	#endif

	worldPosition = modelMatrix * worldPosition;

#endif
`;
}, "renderers/shaders/ShaderChunk/worldpos_vertex.glsl.js", []);

//renderers/shaders/ShaderLib/background_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform sampler2D t2D;

varying vec2 vUv;

void main() {

	vec4 texColor = texture2D( t2D, vUv );

	gl_FragColor = mapTexelToLinear( texColor );

	#include <tonemapping_fragment>
	#include <encodings_fragment>

}
`;
}, "renderers/shaders/ShaderLib/background_frag.glsl.js", []);

//renderers/shaders/ShaderLib/background_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
varying vec2 vUv;
uniform mat3 uvTransform;

void main() {

	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

	gl_Position = vec4( position.xy, 1.0, 1.0 );

}
`;
}, "renderers/shaders/ShaderLib/background_vert.glsl.js", []);

//renderers/shaders/ShaderLib/cube_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#include <envmap_common_pars_fragment>
uniform float opacity;

varying vec3 vWorldDirection;

#include <cube_uv_reflection_fragment>

void main() {

	vec3 vReflect = vWorldDirection;
	#include <envmap_fragment>

	gl_FragColor = envColor;
	gl_FragColor.a *= opacity;

	#include <tonemapping_fragment>
	#include <encodings_fragment>

}
`;
}, "renderers/shaders/ShaderLib/cube_frag.glsl.js", []);

//renderers/shaders/ShaderLib/cube_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`;
}, "renderers/shaders/ShaderLib/cube_vert.glsl.js", []);

//renderers/shaders/ShaderLib/depth_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#if DEPTH_PACKING == 3200

	uniform float opacity;

#endif

#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

varying vec2 vHighPrecisionZW;

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( 1.0 );

	#if DEPTH_PACKING == 3200

		diffuseColor.a = opacity;

	#endif

	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>

	#include <logdepthbuf_fragment>

	// Higher precision equivalent of gl_FragCoord.z. This assumes depthRange has been left to its default values.
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;

	#if DEPTH_PACKING == 3200

		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );

	#elif DEPTH_PACKING == 3201

		gl_FragColor = packDepthToRGBA( fragCoordZ );

	#endif

}
`;
}, "renderers/shaders/ShaderLib/depth_frag.glsl.js", []);

//renderers/shaders/ShaderLib/depth_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

// This is used for computing an equivalent of gl_FragCoord.z that is as high precision as possible.
// Some platforms compute gl_FragCoord at a lower precision which makes the manually computed value better for
// depth-based postprocessing effects. Reproduced on iPad with A10 processor / iPadOS 13.3.1.
varying vec2 vHighPrecisionZW;

void main() {

	#include <uv_vertex>

	#include <skinbase_vertex>

	#ifdef USE_DISPLACEMENTMAP

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vHighPrecisionZW = gl_Position.zw;

}
`;
}, "renderers/shaders/ShaderLib/depth_vert.glsl.js", []);

//renderers/shaders/ShaderLib/distanceRGBA_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define DISTANCE

uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;

#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <clipping_planes_pars_fragment>

void main () {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( 1.0 );

	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>

	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist ); // clamp to [ 0, 1 ]

	gl_FragColor = packDepthToRGBA( dist );

}
`;
}, "renderers/shaders/ShaderLib/distanceRGBA_frag.glsl.js", []);

//renderers/shaders/ShaderLib/distanceRGBA_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define DISTANCE

varying vec3 vWorldPosition;

#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>

	#include <skinbase_vertex>

	#ifdef USE_DISPLACEMENTMAP

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>

	vWorldPosition = worldPosition.xyz;

}
`;
}, "renderers/shaders/ShaderLib/distanceRGBA_vert.glsl.js", []);

//renderers/shaders/ShaderLib/equirect_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform sampler2D tEquirect;

varying vec3 vWorldDirection;

#include <common>

void main() {

	vec3 direction = normalize( vWorldDirection );

	vec2 sampleUV = equirectUv( direction );

	vec4 texColor = texture2D( tEquirect, sampleUV );

	gl_FragColor = mapTexelToLinear( texColor );

	#include <tonemapping_fragment>
	#include <encodings_fragment>

}
`;
}, "renderers/shaders/ShaderLib/equirect_frag.glsl.js", []);

//renderers/shaders/ShaderLib/equirect_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

}
`;
}, "renderers/shaders/ShaderLib/equirect_vert.glsl.js", []);

//renderers/shaders/ShaderLib/linedashed_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform vec3 diffuse;
uniform float opacity;

uniform float dashSize;
uniform float totalSize;

varying float vLineDistance;

#include <common>
#include <color_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	if ( mod( vLineDistance, totalSize ) > dashSize ) {

		discard;

	}

	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );

	#include <logdepthbuf_fragment>
	#include <color_fragment>

	outgoingLight = diffuseColor.rgb; // simple shader

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`;
}, "renderers/shaders/ShaderLib/linedashed_frag.glsl.js", []);

//renderers/shaders/ShaderLib/linedashed_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform float scale;
attribute float lineDistance;

varying float vLineDistance;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	vLineDistance = scale * lineDistance;

	#include <color_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>

}
`;
}, "renderers/shaders/ShaderLib/linedashed_vert.glsl.js", []);

//renderers/shaders/ShaderLib/meshbasic_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform vec3 diffuse;
uniform float opacity;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

	// accumulation (baked indirect lighting only)
	#ifdef USE_LIGHTMAP
	
		vec4 lightMapTexel= texture2D( lightMap, vUv2 );
		reflectedLight.indirectDiffuse += lightMapTexelToLinear( lightMapTexel ).rgb * lightMapIntensity;

	#else

		reflectedLight.indirectDiffuse += vec3( 1.0 );

	#endif

	// modulation
	#include <aomap_fragment>

	reflectedLight.indirectDiffuse *= diffuseColor.rgb;

	vec3 outgoingLight = reflectedLight.indirectDiffuse;

	#include <envmap_fragment>

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;
}, "renderers/shaders/ShaderLib/meshbasic_frag.glsl.js", []);

//renderers/shaders/ShaderLib/meshbasic_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <skinbase_vertex>

	#ifdef USE_ENVMAP

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>

	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>

}
`;
}, "renderers/shaders/ShaderLib/meshbasic_vert.glsl.js", []);

//renderers/shaders/ShaderLib/meshlambert_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;

varying vec3 vLightFront;
varying vec3 vIndirectFront;

#ifdef DOUBLE_SIDED
	varying vec3 vLightBack;
	varying vec3 vIndirectBack;
#endif


#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <fog_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <emissivemap_fragment>

	// accumulation

	#ifdef DOUBLE_SIDED

		reflectedLight.indirectDiffuse += ( gl_FrontFacing ) ? vIndirectFront : vIndirectBack;

	#else

		reflectedLight.indirectDiffuse += vIndirectFront;

	#endif

	#include <lightmap_fragment>

	reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );

	#ifdef DOUBLE_SIDED

		reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;

	#else

		reflectedLight.directDiffuse = vLightFront;

	#endif

	reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();

	// modulation

	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

	#include <envmap_fragment>

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
`;
}, "renderers/shaders/ShaderLib/meshlambert_frag.glsl.js", []);

//renderers/shaders/ShaderLib/meshlambert_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define LAMBERT

varying vec3 vLightFront;
varying vec3 vIndirectFront;

#ifdef DOUBLE_SIDED
	varying vec3 vLightBack;
	varying vec3 vIndirectBack;
#endif

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <bsdfs>
#include <lights_pars_begin>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <lights_lambert_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}
`;
}, "renderers/shaders/ShaderLib/meshlambert_vert.glsl.js", []);

//renderers/shaders/ShaderLib/meshmatcap_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define MATCAP

uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>

#include <fog_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks

	#ifdef USE_MATCAP

		vec4 matcapColor = texture2D( matcap, uv );
		matcapColor = matcapTexelToLinear( matcapColor );

	#else

		vec4 matcapColor = vec4( 1.0 );

	#endif

	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;
}, "renderers/shaders/ShaderLib/meshmatcap_frag.glsl.js", []);

//renderers/shaders/ShaderLib/meshmatcap_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define MATCAP

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>

#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

	#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

		vNormal = normalize( transformedNormal );

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>

	vViewPosition = - mvPosition.xyz;

}
`;
}, "renderers/shaders/ShaderLib/meshmatcap_vert.glsl.js", []);

//renderers/shaders/ShaderLib/meshtoon_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define TOON

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;
}, "renderers/shaders/ShaderLib/meshtoon_frag.glsl.js", []);

//renderers/shaders/ShaderLib/meshtoon_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define TOON

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`;
}, "renderers/shaders/ShaderLib/meshtoon_vert.glsl.js", []);

//renderers/shaders/ShaderLib/meshphong_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;
}, "renderers/shaders/ShaderLib/meshphong_frag.glsl.js", []);

//renderers/shaders/ShaderLib/meshphong_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define PHONG

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`;
}, "renderers/shaders/ShaderLib/meshphong_vert.glsl.js", []);

//renderers/shaders/ShaderLib/meshphysical_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define STANDARD

#ifdef PHYSICAL
	#define REFLECTIVITY
	#define CLEARCOAT
	#define TRANSMISSION
#endif

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#ifdef TRANSMISSION
	uniform float transmission;
#endif

#ifdef REFLECTIVITY
	uniform float reflectivity;
#endif

#ifdef CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif

#ifdef USE_SHEEN
	uniform vec3 sheen;
#endif

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <transmissionmap_pars_fragment>
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <lights_physical_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#ifdef TRANSMISSION
		float totalTransmission = transmission;
	#endif

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <transmissionmap_fragment>

	// accumulation
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	// this is a stub for the transmission model
	#ifdef TRANSMISSION
		diffuseColor.a *= mix( saturate( 1. - totalTransmission + linearToRelativeLuminance( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) ), 1.0, metalness );
	#endif

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;
}, "renderers/shaders/ShaderLib/meshphysical_frag.glsl.js", []);

//renderers/shaders/ShaderLib/meshphysical_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define STANDARD

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

	#ifdef USE_TANGENT

		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );

	#endif

#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`;
}, "renderers/shaders/ShaderLib/meshphysical_vert.glsl.js", []);

//renderers/shaders/ShaderLib/normal_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define NORMAL

uniform float opacity;

#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )

	varying vec3 vViewPosition;

#endif

#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif

#include <packing>
#include <uv_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );

}
`;
}, "renderers/shaders/ShaderLib/normal_frag.glsl.js", []);

//renderers/shaders/ShaderLib/normal_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#define NORMAL

#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )

	varying vec3 vViewPosition;

#endif

#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif

#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

	#ifdef USE_TANGENT

		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );

	#endif

#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )

	vViewPosition = - mvPosition.xyz;

#endif

}
`;
}, "renderers/shaders/ShaderLib/normal_vert.glsl.js", []);

//renderers/shaders/ShaderLib/points_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform vec3 diffuse;
uniform float opacity;

#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );

	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>

	outgoingLight = diffuseColor.rgb;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`;
}, "renderers/shaders/ShaderLib/points_frag.glsl.js", []);

//renderers/shaders/ShaderLib/points_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform float size;
uniform float scale;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <color_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>

	gl_PointSize = size;

	#ifdef USE_SIZEATTENUATION

		bool isPerspective = isPerspectiveMatrix( projectionMatrix );

		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );

	#endif

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>

}
`;
}, "renderers/shaders/ShaderLib/points_vert.glsl.js", []);

//renderers/shaders/ShaderLib/shadow_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform vec3 color;
uniform float opacity;

#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

void main() {

	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>

}
`;
}, "renderers/shaders/ShaderLib/shadow_frag.glsl.js", []);

//renderers/shaders/ShaderLib/shadow_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
#include <common>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>

void main() {

	#include <begin_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`;
}, "renderers/shaders/ShaderLib/shadow_vert.glsl.js", []);

//renderers/shaders/ShaderLib/sprite_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform vec3 diffuse;
uniform float opacity;

#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>

	outgoingLight = diffuseColor.rgb;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>

}
`;
}, "renderers/shaders/ShaderLib/sprite_frag.glsl.js", []);

//renderers/shaders/ShaderLib/sprite_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform float rotation;
uniform vec2 center;

#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>

	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );

	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

	#ifndef USE_SIZEATTENUATION

		bool isPerspective = isPerspectiveMatrix( projectionMatrix );

		if ( isPerspective ) scale *= - mvPosition.z;

	#endif

	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;

	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;

	mvPosition.xy += rotatedPosition;

	gl_Position = projectionMatrix * mvPosition;

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>

}
`;
}, "renderers/shaders/ShaderLib/sprite_vert.glsl.js", []);

//renderers/shaders/ShaderChunk.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {ShaderChunk:{enumerable:true, get:function() {
    return ShaderChunk;
  }}});
  var module$renderers$shaders$ShaderChunk$alphamap_fragment_glsl = $$require("renderers/shaders/ShaderChunk/alphamap_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$alphamap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/alphamap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$alphatest_fragment_glsl = $$require("renderers/shaders/ShaderChunk/alphatest_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$aomap_fragment_glsl = $$require("renderers/shaders/ShaderChunk/aomap_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$aomap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/aomap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$begin_vertex_glsl = $$require("renderers/shaders/ShaderChunk/begin_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$beginnormal_vertex_glsl = $$require("renderers/shaders/ShaderChunk/beginnormal_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$bsdfs_glsl = $$require("renderers/shaders/ShaderChunk/bsdfs.glsl.js");
  var module$renderers$shaders$ShaderChunk$bumpmap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/bumpmap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$clipping_planes_fragment_glsl = $$require("renderers/shaders/ShaderChunk/clipping_planes_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$clipping_planes_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/clipping_planes_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$clipping_planes_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/clipping_planes_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$clipping_planes_vertex_glsl = $$require("renderers/shaders/ShaderChunk/clipping_planes_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$color_fragment_glsl = $$require("renderers/shaders/ShaderChunk/color_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$color_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/color_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$color_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/color_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$color_vertex_glsl = $$require("renderers/shaders/ShaderChunk/color_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$common_glsl = $$require("renderers/shaders/ShaderChunk/common.glsl.js");
  var module$renderers$shaders$ShaderChunk$cube_uv_reflection_fragment_glsl = $$require("renderers/shaders/ShaderChunk/cube_uv_reflection_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$defaultnormal_vertex_glsl = $$require("renderers/shaders/ShaderChunk/defaultnormal_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$displacementmap_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/displacementmap_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$displacementmap_vertex_glsl = $$require("renderers/shaders/ShaderChunk/displacementmap_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$emissivemap_fragment_glsl = $$require("renderers/shaders/ShaderChunk/emissivemap_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$emissivemap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/emissivemap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$encodings_fragment_glsl = $$require("renderers/shaders/ShaderChunk/encodings_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$encodings_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/encodings_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$envmap_fragment_glsl = $$require("renderers/shaders/ShaderChunk/envmap_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$envmap_common_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/envmap_common_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$envmap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/envmap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$envmap_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/envmap_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$envmap_vertex_glsl = $$require("renderers/shaders/ShaderChunk/envmap_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$fog_vertex_glsl = $$require("renderers/shaders/ShaderChunk/fog_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$fog_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/fog_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$fog_fragment_glsl = $$require("renderers/shaders/ShaderChunk/fog_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$fog_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/fog_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$gradientmap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/gradientmap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$lightmap_fragment_glsl = $$require("renderers/shaders/ShaderChunk/lightmap_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$lightmap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/lightmap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_lambert_vertex_glsl = $$require("renderers/shaders/ShaderChunk/lights_lambert_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_pars_begin_glsl = $$require("renderers/shaders/ShaderChunk/lights_pars_begin.glsl.js");
  var module$renderers$shaders$ShaderChunk$envmap_physical_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/envmap_physical_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_toon_fragment_glsl = $$require("renderers/shaders/ShaderChunk/lights_toon_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_toon_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/lights_toon_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_phong_fragment_glsl = $$require("renderers/shaders/ShaderChunk/lights_phong_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_phong_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/lights_phong_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_physical_fragment_glsl = $$require("renderers/shaders/ShaderChunk/lights_physical_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_physical_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/lights_physical_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_fragment_begin_glsl = $$require("renderers/shaders/ShaderChunk/lights_fragment_begin.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_fragment_maps_glsl = $$require("renderers/shaders/ShaderChunk/lights_fragment_maps.glsl.js");
  var module$renderers$shaders$ShaderChunk$lights_fragment_end_glsl = $$require("renderers/shaders/ShaderChunk/lights_fragment_end.glsl.js");
  var module$renderers$shaders$ShaderChunk$logdepthbuf_fragment_glsl = $$require("renderers/shaders/ShaderChunk/logdepthbuf_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$logdepthbuf_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/logdepthbuf_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$logdepthbuf_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/logdepthbuf_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$logdepthbuf_vertex_glsl = $$require("renderers/shaders/ShaderChunk/logdepthbuf_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$map_fragment_glsl = $$require("renderers/shaders/ShaderChunk/map_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$map_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/map_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$map_particle_fragment_glsl = $$require("renderers/shaders/ShaderChunk/map_particle_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$map_particle_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/map_particle_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$metalnessmap_fragment_glsl = $$require("renderers/shaders/ShaderChunk/metalnessmap_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$metalnessmap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/metalnessmap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$morphnormal_vertex_glsl = $$require("renderers/shaders/ShaderChunk/morphnormal_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$morphtarget_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/morphtarget_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$morphtarget_vertex_glsl = $$require("renderers/shaders/ShaderChunk/morphtarget_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$normal_fragment_begin_glsl = $$require("renderers/shaders/ShaderChunk/normal_fragment_begin.glsl.js");
  var module$renderers$shaders$ShaderChunk$normal_fragment_maps_glsl = $$require("renderers/shaders/ShaderChunk/normal_fragment_maps.glsl.js");
  var module$renderers$shaders$ShaderChunk$normalmap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/normalmap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$clearcoat_normal_fragment_begin_glsl = $$require("renderers/shaders/ShaderChunk/clearcoat_normal_fragment_begin.glsl.js");
  var module$renderers$shaders$ShaderChunk$clearcoat_normal_fragment_maps_glsl = $$require("renderers/shaders/ShaderChunk/clearcoat_normal_fragment_maps.glsl.js");
  var module$renderers$shaders$ShaderChunk$clearcoat_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/clearcoat_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$packing_glsl = $$require("renderers/shaders/ShaderChunk/packing.glsl.js");
  var module$renderers$shaders$ShaderChunk$premultiplied_alpha_fragment_glsl = $$require("renderers/shaders/ShaderChunk/premultiplied_alpha_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$project_vertex_glsl = $$require("renderers/shaders/ShaderChunk/project_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$dithering_fragment_glsl = $$require("renderers/shaders/ShaderChunk/dithering_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$dithering_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/dithering_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$roughnessmap_fragment_glsl = $$require("renderers/shaders/ShaderChunk/roughnessmap_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$roughnessmap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/roughnessmap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$shadowmap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/shadowmap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$shadowmap_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/shadowmap_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$shadowmap_vertex_glsl = $$require("renderers/shaders/ShaderChunk/shadowmap_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$shadowmask_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/shadowmask_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$skinbase_vertex_glsl = $$require("renderers/shaders/ShaderChunk/skinbase_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$skinning_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/skinning_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$skinning_vertex_glsl = $$require("renderers/shaders/ShaderChunk/skinning_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$skinnormal_vertex_glsl = $$require("renderers/shaders/ShaderChunk/skinnormal_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$specularmap_fragment_glsl = $$require("renderers/shaders/ShaderChunk/specularmap_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$specularmap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/specularmap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$tonemapping_fragment_glsl = $$require("renderers/shaders/ShaderChunk/tonemapping_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$tonemapping_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/tonemapping_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$transmissionmap_fragment_glsl = $$require("renderers/shaders/ShaderChunk/transmissionmap_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$transmissionmap_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/transmissionmap_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$uv_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/uv_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$uv_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/uv_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$uv_vertex_glsl = $$require("renderers/shaders/ShaderChunk/uv_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$uv2_pars_fragment_glsl = $$require("renderers/shaders/ShaderChunk/uv2_pars_fragment.glsl.js");
  var module$renderers$shaders$ShaderChunk$uv2_pars_vertex_glsl = $$require("renderers/shaders/ShaderChunk/uv2_pars_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$uv2_vertex_glsl = $$require("renderers/shaders/ShaderChunk/uv2_vertex.glsl.js");
  var module$renderers$shaders$ShaderChunk$worldpos_vertex_glsl = $$require("renderers/shaders/ShaderChunk/worldpos_vertex.glsl.js");
  var module$renderers$shaders$ShaderLib$background_frag_glsl = $$require("renderers/shaders/ShaderLib/background_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$background_vert_glsl = $$require("renderers/shaders/ShaderLib/background_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$cube_frag_glsl = $$require("renderers/shaders/ShaderLib/cube_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$cube_vert_glsl = $$require("renderers/shaders/ShaderLib/cube_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$depth_frag_glsl = $$require("renderers/shaders/ShaderLib/depth_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$depth_vert_glsl = $$require("renderers/shaders/ShaderLib/depth_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$distanceRGBA_frag_glsl = $$require("renderers/shaders/ShaderLib/distanceRGBA_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$distanceRGBA_vert_glsl = $$require("renderers/shaders/ShaderLib/distanceRGBA_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$equirect_frag_glsl = $$require("renderers/shaders/ShaderLib/equirect_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$equirect_vert_glsl = $$require("renderers/shaders/ShaderLib/equirect_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$linedashed_frag_glsl = $$require("renderers/shaders/ShaderLib/linedashed_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$linedashed_vert_glsl = $$require("renderers/shaders/ShaderLib/linedashed_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$meshbasic_frag_glsl = $$require("renderers/shaders/ShaderLib/meshbasic_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$meshbasic_vert_glsl = $$require("renderers/shaders/ShaderLib/meshbasic_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$meshlambert_frag_glsl = $$require("renderers/shaders/ShaderLib/meshlambert_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$meshlambert_vert_glsl = $$require("renderers/shaders/ShaderLib/meshlambert_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$meshmatcap_frag_glsl = $$require("renderers/shaders/ShaderLib/meshmatcap_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$meshmatcap_vert_glsl = $$require("renderers/shaders/ShaderLib/meshmatcap_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$meshtoon_frag_glsl = $$require("renderers/shaders/ShaderLib/meshtoon_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$meshtoon_vert_glsl = $$require("renderers/shaders/ShaderLib/meshtoon_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$meshphong_frag_glsl = $$require("renderers/shaders/ShaderLib/meshphong_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$meshphong_vert_glsl = $$require("renderers/shaders/ShaderLib/meshphong_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$meshphysical_frag_glsl = $$require("renderers/shaders/ShaderLib/meshphysical_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$meshphysical_vert_glsl = $$require("renderers/shaders/ShaderLib/meshphysical_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$normal_frag_glsl = $$require("renderers/shaders/ShaderLib/normal_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$normal_vert_glsl = $$require("renderers/shaders/ShaderLib/normal_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$points_frag_glsl = $$require("renderers/shaders/ShaderLib/points_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$points_vert_glsl = $$require("renderers/shaders/ShaderLib/points_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$shadow_frag_glsl = $$require("renderers/shaders/ShaderLib/shadow_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$shadow_vert_glsl = $$require("renderers/shaders/ShaderLib/shadow_vert.glsl.js");
  var module$renderers$shaders$ShaderLib$sprite_frag_glsl = $$require("renderers/shaders/ShaderLib/sprite_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$sprite_vert_glsl = $$require("renderers/shaders/ShaderLib/sprite_vert.glsl.js");
  const ShaderChunk = {"alphamap_fragment":module$renderers$shaders$ShaderChunk$alphamap_fragment_glsl["default"], "alphamap_pars_fragment":module$renderers$shaders$ShaderChunk$alphamap_pars_fragment_glsl["default"], "alphatest_fragment":module$renderers$shaders$ShaderChunk$alphatest_fragment_glsl["default"], "aomap_fragment":module$renderers$shaders$ShaderChunk$aomap_fragment_glsl["default"], "aomap_pars_fragment":module$renderers$shaders$ShaderChunk$aomap_pars_fragment_glsl["default"], "begin_vertex":module$renderers$shaders$ShaderChunk$begin_vertex_glsl["default"], 
  "beginnormal_vertex":module$renderers$shaders$ShaderChunk$beginnormal_vertex_glsl["default"], "bsdfs":module$renderers$shaders$ShaderChunk$bsdfs_glsl["default"], "bumpmap_pars_fragment":module$renderers$shaders$ShaderChunk$bumpmap_pars_fragment_glsl["default"], "clipping_planes_fragment":module$renderers$shaders$ShaderChunk$clipping_planes_fragment_glsl["default"], "clipping_planes_pars_fragment":module$renderers$shaders$ShaderChunk$clipping_planes_pars_fragment_glsl["default"], "clipping_planes_pars_vertex":module$renderers$shaders$ShaderChunk$clipping_planes_pars_vertex_glsl["default"], 
  "clipping_planes_vertex":module$renderers$shaders$ShaderChunk$clipping_planes_vertex_glsl["default"], "color_fragment":module$renderers$shaders$ShaderChunk$color_fragment_glsl["default"], "color_pars_fragment":module$renderers$shaders$ShaderChunk$color_pars_fragment_glsl["default"], "color_pars_vertex":module$renderers$shaders$ShaderChunk$color_pars_vertex_glsl["default"], "color_vertex":module$renderers$shaders$ShaderChunk$color_vertex_glsl["default"], "common":module$renderers$shaders$ShaderChunk$common_glsl["default"], 
  "cube_uv_reflection_fragment":module$renderers$shaders$ShaderChunk$cube_uv_reflection_fragment_glsl["default"], "defaultnormal_vertex":module$renderers$shaders$ShaderChunk$defaultnormal_vertex_glsl["default"], "displacementmap_pars_vertex":module$renderers$shaders$ShaderChunk$displacementmap_pars_vertex_glsl["default"], "displacementmap_vertex":module$renderers$shaders$ShaderChunk$displacementmap_vertex_glsl["default"], "emissivemap_fragment":module$renderers$shaders$ShaderChunk$emissivemap_fragment_glsl["default"], 
  "emissivemap_pars_fragment":module$renderers$shaders$ShaderChunk$emissivemap_pars_fragment_glsl["default"], "encodings_fragment":module$renderers$shaders$ShaderChunk$encodings_fragment_glsl["default"], "encodings_pars_fragment":module$renderers$shaders$ShaderChunk$encodings_pars_fragment_glsl["default"], "envmap_fragment":module$renderers$shaders$ShaderChunk$envmap_fragment_glsl["default"], "envmap_common_pars_fragment":module$renderers$shaders$ShaderChunk$envmap_common_pars_fragment_glsl["default"], 
  "envmap_pars_fragment":module$renderers$shaders$ShaderChunk$envmap_pars_fragment_glsl["default"], "envmap_pars_vertex":module$renderers$shaders$ShaderChunk$envmap_pars_vertex_glsl["default"], "envmap_physical_pars_fragment":module$renderers$shaders$ShaderChunk$envmap_physical_pars_fragment_glsl["default"], "envmap_vertex":module$renderers$shaders$ShaderChunk$envmap_vertex_glsl["default"], "fog_vertex":module$renderers$shaders$ShaderChunk$fog_vertex_glsl["default"], "fog_pars_vertex":module$renderers$shaders$ShaderChunk$fog_pars_vertex_glsl["default"], 
  "fog_fragment":module$renderers$shaders$ShaderChunk$fog_fragment_glsl["default"], "fog_pars_fragment":module$renderers$shaders$ShaderChunk$fog_pars_fragment_glsl["default"], "gradientmap_pars_fragment":module$renderers$shaders$ShaderChunk$gradientmap_pars_fragment_glsl["default"], "lightmap_fragment":module$renderers$shaders$ShaderChunk$lightmap_fragment_glsl["default"], "lightmap_pars_fragment":module$renderers$shaders$ShaderChunk$lightmap_pars_fragment_glsl["default"], "lights_lambert_vertex":module$renderers$shaders$ShaderChunk$lights_lambert_vertex_glsl["default"], 
  "lights_pars_begin":module$renderers$shaders$ShaderChunk$lights_pars_begin_glsl["default"], "lights_toon_fragment":module$renderers$shaders$ShaderChunk$lights_toon_fragment_glsl["default"], "lights_toon_pars_fragment":module$renderers$shaders$ShaderChunk$lights_toon_pars_fragment_glsl["default"], "lights_phong_fragment":module$renderers$shaders$ShaderChunk$lights_phong_fragment_glsl["default"], "lights_phong_pars_fragment":module$renderers$shaders$ShaderChunk$lights_phong_pars_fragment_glsl["default"], 
  "lights_physical_fragment":module$renderers$shaders$ShaderChunk$lights_physical_fragment_glsl["default"], "lights_physical_pars_fragment":module$renderers$shaders$ShaderChunk$lights_physical_pars_fragment_glsl["default"], "lights_fragment_begin":module$renderers$shaders$ShaderChunk$lights_fragment_begin_glsl["default"], "lights_fragment_maps":module$renderers$shaders$ShaderChunk$lights_fragment_maps_glsl["default"], "lights_fragment_end":module$renderers$shaders$ShaderChunk$lights_fragment_end_glsl["default"], 
  "logdepthbuf_fragment":module$renderers$shaders$ShaderChunk$logdepthbuf_fragment_glsl["default"], "logdepthbuf_pars_fragment":module$renderers$shaders$ShaderChunk$logdepthbuf_pars_fragment_glsl["default"], "logdepthbuf_pars_vertex":module$renderers$shaders$ShaderChunk$logdepthbuf_pars_vertex_glsl["default"], "logdepthbuf_vertex":module$renderers$shaders$ShaderChunk$logdepthbuf_vertex_glsl["default"], "map_fragment":module$renderers$shaders$ShaderChunk$map_fragment_glsl["default"], "map_pars_fragment":module$renderers$shaders$ShaderChunk$map_pars_fragment_glsl["default"], 
  "map_particle_fragment":module$renderers$shaders$ShaderChunk$map_particle_fragment_glsl["default"], "map_particle_pars_fragment":module$renderers$shaders$ShaderChunk$map_particle_pars_fragment_glsl["default"], "metalnessmap_fragment":module$renderers$shaders$ShaderChunk$metalnessmap_fragment_glsl["default"], "metalnessmap_pars_fragment":module$renderers$shaders$ShaderChunk$metalnessmap_pars_fragment_glsl["default"], "morphnormal_vertex":module$renderers$shaders$ShaderChunk$morphnormal_vertex_glsl["default"], 
  "morphtarget_pars_vertex":module$renderers$shaders$ShaderChunk$morphtarget_pars_vertex_glsl["default"], "morphtarget_vertex":module$renderers$shaders$ShaderChunk$morphtarget_vertex_glsl["default"], "normal_fragment_begin":module$renderers$shaders$ShaderChunk$normal_fragment_begin_glsl["default"], "normal_fragment_maps":module$renderers$shaders$ShaderChunk$normal_fragment_maps_glsl["default"], "normalmap_pars_fragment":module$renderers$shaders$ShaderChunk$normalmap_pars_fragment_glsl["default"], 
  "clearcoat_normal_fragment_begin":module$renderers$shaders$ShaderChunk$clearcoat_normal_fragment_begin_glsl["default"], "clearcoat_normal_fragment_maps":module$renderers$shaders$ShaderChunk$clearcoat_normal_fragment_maps_glsl["default"], "clearcoat_pars_fragment":module$renderers$shaders$ShaderChunk$clearcoat_pars_fragment_glsl["default"], "packing":module$renderers$shaders$ShaderChunk$packing_glsl["default"], "premultiplied_alpha_fragment":module$renderers$shaders$ShaderChunk$premultiplied_alpha_fragment_glsl["default"], 
  "project_vertex":module$renderers$shaders$ShaderChunk$project_vertex_glsl["default"], "dithering_fragment":module$renderers$shaders$ShaderChunk$dithering_fragment_glsl["default"], "dithering_pars_fragment":module$renderers$shaders$ShaderChunk$dithering_pars_fragment_glsl["default"], "roughnessmap_fragment":module$renderers$shaders$ShaderChunk$roughnessmap_fragment_glsl["default"], "roughnessmap_pars_fragment":module$renderers$shaders$ShaderChunk$roughnessmap_pars_fragment_glsl["default"], "shadowmap_pars_fragment":module$renderers$shaders$ShaderChunk$shadowmap_pars_fragment_glsl["default"], 
  "shadowmap_pars_vertex":module$renderers$shaders$ShaderChunk$shadowmap_pars_vertex_glsl["default"], "shadowmap_vertex":module$renderers$shaders$ShaderChunk$shadowmap_vertex_glsl["default"], "shadowmask_pars_fragment":module$renderers$shaders$ShaderChunk$shadowmask_pars_fragment_glsl["default"], "skinbase_vertex":module$renderers$shaders$ShaderChunk$skinbase_vertex_glsl["default"], "skinning_pars_vertex":module$renderers$shaders$ShaderChunk$skinning_pars_vertex_glsl["default"], "skinning_vertex":module$renderers$shaders$ShaderChunk$skinning_vertex_glsl["default"], 
  "skinnormal_vertex":module$renderers$shaders$ShaderChunk$skinnormal_vertex_glsl["default"], "specularmap_fragment":module$renderers$shaders$ShaderChunk$specularmap_fragment_glsl["default"], "specularmap_pars_fragment":module$renderers$shaders$ShaderChunk$specularmap_pars_fragment_glsl["default"], "tonemapping_fragment":module$renderers$shaders$ShaderChunk$tonemapping_fragment_glsl["default"], "tonemapping_pars_fragment":module$renderers$shaders$ShaderChunk$tonemapping_pars_fragment_glsl["default"], 
  "transmissionmap_fragment":module$renderers$shaders$ShaderChunk$transmissionmap_fragment_glsl["default"], "transmissionmap_pars_fragment":module$renderers$shaders$ShaderChunk$transmissionmap_pars_fragment_glsl["default"], "uv_pars_fragment":module$renderers$shaders$ShaderChunk$uv_pars_fragment_glsl["default"], "uv_pars_vertex":module$renderers$shaders$ShaderChunk$uv_pars_vertex_glsl["default"], "uv_vertex":module$renderers$shaders$ShaderChunk$uv_vertex_glsl["default"], "uv2_pars_fragment":module$renderers$shaders$ShaderChunk$uv2_pars_fragment_glsl["default"], 
  "uv2_pars_vertex":module$renderers$shaders$ShaderChunk$uv2_pars_vertex_glsl["default"], "uv2_vertex":module$renderers$shaders$ShaderChunk$uv2_vertex_glsl["default"], "worldpos_vertex":module$renderers$shaders$ShaderChunk$worldpos_vertex_glsl["default"], "background_frag":module$renderers$shaders$ShaderLib$background_frag_glsl["default"], "background_vert":module$renderers$shaders$ShaderLib$background_vert_glsl["default"], "cube_frag":module$renderers$shaders$ShaderLib$cube_frag_glsl["default"], 
  "cube_vert":module$renderers$shaders$ShaderLib$cube_vert_glsl["default"], "depth_frag":module$renderers$shaders$ShaderLib$depth_frag_glsl["default"], "depth_vert":module$renderers$shaders$ShaderLib$depth_vert_glsl["default"], "distanceRGBA_frag":module$renderers$shaders$ShaderLib$distanceRGBA_frag_glsl["default"], "distanceRGBA_vert":module$renderers$shaders$ShaderLib$distanceRGBA_vert_glsl["default"], "equirect_frag":module$renderers$shaders$ShaderLib$equirect_frag_glsl["default"], "equirect_vert":module$renderers$shaders$ShaderLib$equirect_vert_glsl["default"], 
  "linedashed_frag":module$renderers$shaders$ShaderLib$linedashed_frag_glsl["default"], "linedashed_vert":module$renderers$shaders$ShaderLib$linedashed_vert_glsl["default"], "meshbasic_frag":module$renderers$shaders$ShaderLib$meshbasic_frag_glsl["default"], "meshbasic_vert":module$renderers$shaders$ShaderLib$meshbasic_vert_glsl["default"], "meshlambert_frag":module$renderers$shaders$ShaderLib$meshlambert_frag_glsl["default"], "meshlambert_vert":module$renderers$shaders$ShaderLib$meshlambert_vert_glsl["default"], 
  "meshmatcap_frag":module$renderers$shaders$ShaderLib$meshmatcap_frag_glsl["default"], "meshmatcap_vert":module$renderers$shaders$ShaderLib$meshmatcap_vert_glsl["default"], "meshtoon_frag":module$renderers$shaders$ShaderLib$meshtoon_frag_glsl["default"], "meshtoon_vert":module$renderers$shaders$ShaderLib$meshtoon_vert_glsl["default"], "meshphong_frag":module$renderers$shaders$ShaderLib$meshphong_frag_glsl["default"], "meshphong_vert":module$renderers$shaders$ShaderLib$meshphong_vert_glsl["default"], 
  "meshphysical_frag":module$renderers$shaders$ShaderLib$meshphysical_frag_glsl["default"], "meshphysical_vert":module$renderers$shaders$ShaderLib$meshphysical_vert_glsl["default"], "normal_frag":module$renderers$shaders$ShaderLib$normal_frag_glsl["default"], "normal_vert":module$renderers$shaders$ShaderLib$normal_vert_glsl["default"], "points_frag":module$renderers$shaders$ShaderLib$points_frag_glsl["default"], "points_vert":module$renderers$shaders$ShaderLib$points_vert_glsl["default"], "shadow_frag":module$renderers$shaders$ShaderLib$shadow_frag_glsl["default"], 
  "shadow_vert":module$renderers$shaders$ShaderLib$shadow_vert_glsl["default"], "sprite_frag":module$renderers$shaders$ShaderLib$sprite_frag_glsl["default"], "sprite_vert":module$renderers$shaders$ShaderLib$sprite_vert_glsl["default"]};
}, "renderers/shaders/ShaderChunk.js", ["renderers/shaders/ShaderChunk/alphamap_fragment.glsl.js", "renderers/shaders/ShaderChunk/alphamap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/alphatest_fragment.glsl.js", "renderers/shaders/ShaderChunk/aomap_fragment.glsl.js", "renderers/shaders/ShaderChunk/aomap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/begin_vertex.glsl.js", "renderers/shaders/ShaderChunk/beginnormal_vertex.glsl.js", "renderers/shaders/ShaderChunk/bsdfs.glsl.js", 
"renderers/shaders/ShaderChunk/bumpmap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/clipping_planes_fragment.glsl.js", "renderers/shaders/ShaderChunk/clipping_planes_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/clipping_planes_pars_vertex.glsl.js", "renderers/shaders/ShaderChunk/clipping_planes_vertex.glsl.js", "renderers/shaders/ShaderChunk/color_fragment.glsl.js", "renderers/shaders/ShaderChunk/color_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/color_pars_vertex.glsl.js", 
"renderers/shaders/ShaderChunk/color_vertex.glsl.js", "renderers/shaders/ShaderChunk/common.glsl.js", "renderers/shaders/ShaderChunk/cube_uv_reflection_fragment.glsl.js", "renderers/shaders/ShaderChunk/defaultnormal_vertex.glsl.js", "renderers/shaders/ShaderChunk/displacementmap_pars_vertex.glsl.js", "renderers/shaders/ShaderChunk/displacementmap_vertex.glsl.js", "renderers/shaders/ShaderChunk/emissivemap_fragment.glsl.js", "renderers/shaders/ShaderChunk/emissivemap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/encodings_fragment.glsl.js", 
"renderers/shaders/ShaderChunk/encodings_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/envmap_fragment.glsl.js", "renderers/shaders/ShaderChunk/envmap_common_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/envmap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/envmap_pars_vertex.glsl.js", "renderers/shaders/ShaderChunk/envmap_vertex.glsl.js", "renderers/shaders/ShaderChunk/fog_vertex.glsl.js", "renderers/shaders/ShaderChunk/fog_pars_vertex.glsl.js", "renderers/shaders/ShaderChunk/fog_fragment.glsl.js", 
"renderers/shaders/ShaderChunk/fog_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/gradientmap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/lightmap_fragment.glsl.js", "renderers/shaders/ShaderChunk/lightmap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/lights_lambert_vertex.glsl.js", "renderers/shaders/ShaderChunk/lights_pars_begin.glsl.js", "renderers/shaders/ShaderChunk/envmap_physical_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/lights_toon_fragment.glsl.js", 
"renderers/shaders/ShaderChunk/lights_toon_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/lights_phong_fragment.glsl.js", "renderers/shaders/ShaderChunk/lights_phong_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/lights_physical_fragment.glsl.js", "renderers/shaders/ShaderChunk/lights_physical_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/lights_fragment_begin.glsl.js", "renderers/shaders/ShaderChunk/lights_fragment_maps.glsl.js", "renderers/shaders/ShaderChunk/lights_fragment_end.glsl.js", 
"renderers/shaders/ShaderChunk/logdepthbuf_fragment.glsl.js", "renderers/shaders/ShaderChunk/logdepthbuf_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/logdepthbuf_pars_vertex.glsl.js", "renderers/shaders/ShaderChunk/logdepthbuf_vertex.glsl.js", "renderers/shaders/ShaderChunk/map_fragment.glsl.js", "renderers/shaders/ShaderChunk/map_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/map_particle_fragment.glsl.js", "renderers/shaders/ShaderChunk/map_particle_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/metalnessmap_fragment.glsl.js", 
"renderers/shaders/ShaderChunk/metalnessmap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/morphnormal_vertex.glsl.js", "renderers/shaders/ShaderChunk/morphtarget_pars_vertex.glsl.js", "renderers/shaders/ShaderChunk/morphtarget_vertex.glsl.js", "renderers/shaders/ShaderChunk/normal_fragment_begin.glsl.js", "renderers/shaders/ShaderChunk/normal_fragment_maps.glsl.js", "renderers/shaders/ShaderChunk/normalmap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/clearcoat_normal_fragment_begin.glsl.js", 
"renderers/shaders/ShaderChunk/clearcoat_normal_fragment_maps.glsl.js", "renderers/shaders/ShaderChunk/clearcoat_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/packing.glsl.js", "renderers/shaders/ShaderChunk/premultiplied_alpha_fragment.glsl.js", "renderers/shaders/ShaderChunk/project_vertex.glsl.js", "renderers/shaders/ShaderChunk/dithering_fragment.glsl.js", "renderers/shaders/ShaderChunk/dithering_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/roughnessmap_fragment.glsl.js", "renderers/shaders/ShaderChunk/roughnessmap_pars_fragment.glsl.js", 
"renderers/shaders/ShaderChunk/shadowmap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/shadowmap_pars_vertex.glsl.js", "renderers/shaders/ShaderChunk/shadowmap_vertex.glsl.js", "renderers/shaders/ShaderChunk/shadowmask_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/skinbase_vertex.glsl.js", "renderers/shaders/ShaderChunk/skinning_pars_vertex.glsl.js", "renderers/shaders/ShaderChunk/skinning_vertex.glsl.js", "renderers/shaders/ShaderChunk/skinnormal_vertex.glsl.js", "renderers/shaders/ShaderChunk/specularmap_fragment.glsl.js", 
"renderers/shaders/ShaderChunk/specularmap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/tonemapping_fragment.glsl.js", "renderers/shaders/ShaderChunk/tonemapping_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/transmissionmap_fragment.glsl.js", "renderers/shaders/ShaderChunk/transmissionmap_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/uv_pars_fragment.glsl.js", "renderers/shaders/ShaderChunk/uv_pars_vertex.glsl.js", "renderers/shaders/ShaderChunk/uv_vertex.glsl.js", "renderers/shaders/ShaderChunk/uv2_pars_fragment.glsl.js", 
"renderers/shaders/ShaderChunk/uv2_pars_vertex.glsl.js", "renderers/shaders/ShaderChunk/uv2_vertex.glsl.js", "renderers/shaders/ShaderChunk/worldpos_vertex.glsl.js", "renderers/shaders/ShaderLib/background_frag.glsl.js", "renderers/shaders/ShaderLib/background_vert.glsl.js", "renderers/shaders/ShaderLib/cube_frag.glsl.js", "renderers/shaders/ShaderLib/cube_vert.glsl.js", "renderers/shaders/ShaderLib/depth_frag.glsl.js", "renderers/shaders/ShaderLib/depth_vert.glsl.js", "renderers/shaders/ShaderLib/distanceRGBA_frag.glsl.js", 
"renderers/shaders/ShaderLib/distanceRGBA_vert.glsl.js", "renderers/shaders/ShaderLib/equirect_frag.glsl.js", "renderers/shaders/ShaderLib/equirect_vert.glsl.js", "renderers/shaders/ShaderLib/linedashed_frag.glsl.js", "renderers/shaders/ShaderLib/linedashed_vert.glsl.js", "renderers/shaders/ShaderLib/meshbasic_frag.glsl.js", "renderers/shaders/ShaderLib/meshbasic_vert.glsl.js", "renderers/shaders/ShaderLib/meshlambert_frag.glsl.js", "renderers/shaders/ShaderLib/meshlambert_vert.glsl.js", "renderers/shaders/ShaderLib/meshmatcap_frag.glsl.js", 
"renderers/shaders/ShaderLib/meshmatcap_vert.glsl.js", "renderers/shaders/ShaderLib/meshtoon_frag.glsl.js", "renderers/shaders/ShaderLib/meshtoon_vert.glsl.js", "renderers/shaders/ShaderLib/meshphong_frag.glsl.js", "renderers/shaders/ShaderLib/meshphong_vert.glsl.js", "renderers/shaders/ShaderLib/meshphysical_frag.glsl.js", "renderers/shaders/ShaderLib/meshphysical_vert.glsl.js", "renderers/shaders/ShaderLib/normal_frag.glsl.js", "renderers/shaders/ShaderLib/normal_vert.glsl.js", "renderers/shaders/ShaderLib/points_frag.glsl.js", 
"renderers/shaders/ShaderLib/points_vert.glsl.js", "renderers/shaders/ShaderLib/shadow_frag.glsl.js", "renderers/shaders/ShaderLib/shadow_vert.glsl.js", "renderers/shaders/ShaderLib/sprite_frag.glsl.js", "renderers/shaders/ShaderLib/sprite_vert.glsl.js"]);

//renderers/shaders/UniformsLib.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {UniformsLib:{enumerable:true, get:function() {
    return UniformsLib;
  }}});
  var module$math$Color = $$require("math/Color.js");
  var module$math$Vector2 = $$require("math/Vector2.js");
  var module$math$Matrix3 = $$require("math/Matrix3.js");
  var module$constants = $$require("constants.js");
  const UniformsLib = {common:{diffuse:{value:new module$math$Color.Color(15658734)}, opacity:{value:1.0}, map:{value:null}, uvTransform:{value:new module$math$Matrix3.Matrix3}, uv2Transform:{value:new module$math$Matrix3.Matrix3}, alphaMap:{value:null}, }, specularmap:{specularMap:{value:null}, }, envmap:{envMap:{value:null}, flipEnvMap:{value:-1}, reflectivity:{value:1.0}, refractionRatio:{value:0.98}, maxMipLevel:{value:0}}, aomap:{aoMap:{value:null}, aoMapIntensity:{value:1}}, lightmap:{lightMap:{value:null}, 
  lightMapIntensity:{value:1}}, emissivemap:{emissiveMap:{value:null}}, bumpmap:{bumpMap:{value:null}, bumpScale:{value:1}}, normalmap:{normalMap:{value:null}, normalScale:{value:new module$math$Vector2.Vector2(1, 1)}}, displacementmap:{displacementMap:{value:null}, displacementScale:{value:1}, displacementBias:{value:0}}, roughnessmap:{roughnessMap:{value:null}}, metalnessmap:{metalnessMap:{value:null}}, gradientmap:{gradientMap:{value:null}}, fog:{fogDensity:{value:0.00025}, fogNear:{value:1}, 
  fogFar:{value:2000}, fogColor:{value:new module$math$Color.Color(16777215)}}, lights:{ambientLightColor:{value:[]}, lightProbe:{value:[]}, directionalLights:{value:[], properties:{direction:{}, color:{}}}, directionalLightShadows:{value:[], properties:{shadowBias:{}, shadowNormalBias:{}, shadowRadius:{}, shadowMapSize:{}}}, directionalShadowMap:{value:[]}, directionalShadowMatrix:{value:[]}, spotLights:{value:[], properties:{color:{}, position:{}, direction:{}, distance:{}, coneCos:{}, penumbraCos:{}, 
  decay:{}}}, spotLightShadows:{value:[], properties:{shadowBias:{}, shadowNormalBias:{}, shadowRadius:{}, shadowMapSize:{}}}, spotShadowMap:{value:[]}, spotShadowMatrix:{value:[]}, pointLights:{value:[], properties:{color:{}, position:{}, decay:{}, distance:{}}}, pointLightShadows:{value:[], properties:{shadowBias:{}, shadowNormalBias:{}, shadowRadius:{}, shadowMapSize:{}, shadowCameraNear:{}, shadowCameraFar:{}}}, pointShadowMap:{value:[]}, pointShadowMatrix:{value:[]}, hemisphereLights:{value:[], 
  properties:{direction:{}, skyColor:{}, groundColor:{}}}, rectAreaLights:{value:[], properties:{color:{}, position:{}, width:{}, height:{}}}, ltc_1:{value:null}, ltc_2:{value:null}}, points:{diffuse:{value:new module$math$Color.Color(15658734)}, opacity:{value:1.0}, size:{value:1.0}, scale:{value:1.0}, map:{value:null}, alphaMap:{value:null}, uvTransform:{value:new module$math$Matrix3.Matrix3}}, sprite:{diffuse:{value:new module$math$Color.Color(15658734)}, opacity:{value:1.0}, center:{value:new module$math$Vector2.Vector2(0.5, 
  0.5)}, rotation:{value:0.0}, map:{value:null}, alphaMap:{value:null}, uvTransform:{value:new module$math$Matrix3.Matrix3}}};
}, "renderers/shaders/UniformsLib.js", ["math/Color.js", "math/Vector2.js", "math/Matrix3.js", "constants.js"]);

//renderers/shaders/ShaderLib.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {ShaderLib:{enumerable:true, get:function() {
    return ShaderLib;
  }}});
  var module$renderers$shaders$ShaderChunk = $$require("renderers/shaders/ShaderChunk.js");
  var module$renderers$shaders$UniformsUtils = $$require("renderers/shaders/UniformsUtils.js");
  var module$math$Vector2 = $$require("math/Vector2.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$renderers$shaders$UniformsLib = $$require("renderers/shaders/UniformsLib.js");
  var module$math$Color = $$require("math/Color.js");
  var module$math$Matrix3 = $$require("math/Matrix3.js");
  const ShaderLib = {"basic":{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.common, module$renderers$shaders$UniformsLib.UniformsLib.specularmap, module$renderers$shaders$UniformsLib.UniformsLib.envmap, module$renderers$shaders$UniformsLib.UniformsLib.aomap, module$renderers$shaders$UniformsLib.UniformsLib.lightmap, module$renderers$shaders$UniformsLib.UniformsLib.fog]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk["meshbasic_vert"], 
  fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk["meshbasic_frag"]}, lambert:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.common, module$renderers$shaders$UniformsLib.UniformsLib.specularmap, module$renderers$shaders$UniformsLib.UniformsLib.envmap, module$renderers$shaders$UniformsLib.UniformsLib.aomap, module$renderers$shaders$UniformsLib.UniformsLib.lightmap, module$renderers$shaders$UniformsLib.UniformsLib.emissivemap, 
  module$renderers$shaders$UniformsLib.UniformsLib.fog, module$renderers$shaders$UniformsLib.UniformsLib.lights, {emissive:{value:new module$math$Color.Color(0)}}]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshlambert_vert, fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshlambert_frag}, phong:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.common, module$renderers$shaders$UniformsLib.UniformsLib.specularmap, 
  module$renderers$shaders$UniformsLib.UniformsLib.envmap, module$renderers$shaders$UniformsLib.UniformsLib.aomap, module$renderers$shaders$UniformsLib.UniformsLib.lightmap, module$renderers$shaders$UniformsLib.UniformsLib.emissivemap, module$renderers$shaders$UniformsLib.UniformsLib.bumpmap, module$renderers$shaders$UniformsLib.UniformsLib.normalmap, module$renderers$shaders$UniformsLib.UniformsLib.displacementmap, module$renderers$shaders$UniformsLib.UniformsLib.fog, module$renderers$shaders$UniformsLib.UniformsLib.lights, 
  {emissive:{value:new module$math$Color.Color(0)}, specular:{value:new module$math$Color.Color(1118481)}, shininess:{value:30}}]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshphong_vert, fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshphong_frag}, standard:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.common, module$renderers$shaders$UniformsLib.UniformsLib.envmap, module$renderers$shaders$UniformsLib.UniformsLib.aomap, 
  module$renderers$shaders$UniformsLib.UniformsLib.lightmap, module$renderers$shaders$UniformsLib.UniformsLib.emissivemap, module$renderers$shaders$UniformsLib.UniformsLib.bumpmap, module$renderers$shaders$UniformsLib.UniformsLib.normalmap, module$renderers$shaders$UniformsLib.UniformsLib.displacementmap, module$renderers$shaders$UniformsLib.UniformsLib.roughnessmap, module$renderers$shaders$UniformsLib.UniformsLib.metalnessmap, module$renderers$shaders$UniformsLib.UniformsLib.fog, module$renderers$shaders$UniformsLib.UniformsLib.lights, 
  {emissive:{value:new module$math$Color.Color(0)}, roughness:{value:1.0}, metalness:{value:0.0}, envMapIntensity:{value:1}}]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshphysical_vert, fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshphysical_frag}, toon:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.common, module$renderers$shaders$UniformsLib.UniformsLib.aomap, module$renderers$shaders$UniformsLib.UniformsLib.lightmap, 
  module$renderers$shaders$UniformsLib.UniformsLib.emissivemap, module$renderers$shaders$UniformsLib.UniformsLib.bumpmap, module$renderers$shaders$UniformsLib.UniformsLib.normalmap, module$renderers$shaders$UniformsLib.UniformsLib.displacementmap, module$renderers$shaders$UniformsLib.UniformsLib.gradientmap, module$renderers$shaders$UniformsLib.UniformsLib.fog, module$renderers$shaders$UniformsLib.UniformsLib.lights, {emissive:{value:new module$math$Color.Color(0)}}]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshtoon_vert, 
  fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshtoon_frag}, matcap:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.common, module$renderers$shaders$UniformsLib.UniformsLib.bumpmap, module$renderers$shaders$UniformsLib.UniformsLib.normalmap, module$renderers$shaders$UniformsLib.UniformsLib.displacementmap, module$renderers$shaders$UniformsLib.UniformsLib.fog, {matcap:{value:null}}]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshmatcap_vert, 
  fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshmatcap_frag}, points:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.points, module$renderers$shaders$UniformsLib.UniformsLib.fog]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.points_vert, fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.points_frag}, dashed:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.common, 
  module$renderers$shaders$UniformsLib.UniformsLib.fog, {scale:{value:1}, dashSize:{value:1}, totalSize:{value:2}}]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.linedashed_vert, fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.linedashed_frag}, depth:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.common, module$renderers$shaders$UniformsLib.UniformsLib.displacementmap]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.depth_vert, 
  fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.depth_frag}, normal:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.common, module$renderers$shaders$UniformsLib.UniformsLib.bumpmap, module$renderers$shaders$UniformsLib.UniformsLib.normalmap, module$renderers$shaders$UniformsLib.UniformsLib.displacementmap, {opacity:{value:1.0}}]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.normal_vert, fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.normal_frag}, 
  sprite:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.sprite, module$renderers$shaders$UniformsLib.UniformsLib.fog]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.sprite_vert, fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.sprite_frag}, background:{uniforms:{uvTransform:{value:new module$math$Matrix3.Matrix3}, t2D:{value:null}, }, vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.background_vert, 
  fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.background_frag}, cube:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.envmap, {opacity:{value:1.0}}]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.cube_vert, fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.cube_frag}, equirect:{uniforms:{tEquirect:{value:null}, }, vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.equirect_vert, 
  fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.equirect_frag}, distanceRGBA:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.common, module$renderers$shaders$UniformsLib.UniformsLib.displacementmap, {referencePosition:{value:new module$math$Vector3.Vector3}, nearDistance:{value:1}, farDistance:{value:1000}}]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.distanceRGBA_vert, fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.distanceRGBA_frag}, 
  shadow:{uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([module$renderers$shaders$UniformsLib.UniformsLib.lights, module$renderers$shaders$UniformsLib.UniformsLib.fog, {color:{value:new module$math$Color.Color(0)}, opacity:{value:1.0}}, ]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.shadow_vert, fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.shadow_frag}};
  ShaderLib.physical = {uniforms:(0,module$renderers$shaders$UniformsUtils.mergeUniforms)([ShaderLib.standard.uniforms, {clearcoat:{value:0}, clearcoatMap:{value:null}, clearcoatRoughness:{value:0}, clearcoatRoughnessMap:{value:null}, clearcoatNormalScale:{value:new module$math$Vector2.Vector2(1, 1)}, clearcoatNormalMap:{value:null}, sheen:{value:new module$math$Color.Color(0)}, transmission:{value:0}, transmissionMap:{value:null}, }]), vertexShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshphysical_vert, 
  fragmentShader:module$renderers$shaders$ShaderChunk.ShaderChunk.meshphysical_frag};
  ShaderLib.get = function(name) {
    console.log("GET " + name);
    switch(name) {
      case "basic":
        return ShaderLib.basic;
    }
    throw new Error("Not able to find ShaderLib : " + name);
  };
}, "renderers/shaders/ShaderLib.js", ["renderers/shaders/ShaderChunk.js", "renderers/shaders/UniformsUtils.js", "math/Vector2.js", "math/Vector3.js", "renderers/shaders/UniformsLib.js", "math/Color.js", "math/Matrix3.js"]);

//renderers/webgl/WebGLBackground.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLBackground:{enumerable:true, get:function() {
    return WebGLBackground;
  }}});
  var module$constants = $$require("constants.js");
  var module$geometries$BoxGeometry = $$require("geometries/BoxGeometry.js");
  var module$geometries$PlaneGeometry = $$require("geometries/PlaneGeometry.js");
  var module$materials$ShaderMaterial = $$require("materials/ShaderMaterial.js");
  var module$math$Color = $$require("math/Color.js");
  var module$objects$Mesh = $$require("objects/Mesh.js");
  var module$renderers$shaders$ShaderLib = $$require("renderers/shaders/ShaderLib.js");
  var module$renderers$shaders$UniformsUtils = $$require("renderers/shaders/UniformsUtils.js");
  class WebGLBackground {
    constructor(renderer, cubemaps, state, objects, premultipliedAlpha) {
      this.renderer = renderer;
      this.cubemaps = cubemaps;
      this.state = state;
      this.objects = objects;
      this.premultipliedAlpha = premultipliedAlpha;
      this.clearColor = new module$math$Color.Color(0);
      this.clearAlpha = 0;
      this.planeMesh;
      this.boxMesh;
      this.currentBackground = null;
      this.currentBackgroundVersion = 0;
      this.currentTonemapping = null;
    }
    render(renderList, scene, camera, forceClear) {
      let background = scene.isScene === true ? scene.background : null;
      if (background && background.isTexture) {
        background = this.cubemaps.get(background);
      }
      const xr = this.renderer.xr;
      const session = xr.getSession && xr.getSession();
      if (session && session.environmentBlendMode === "additive") {
        background = null;
      }
      if (background === null) {
        this.setClear(this.clearColor, this.clearAlpha);
      } else {
        if (background && background.isColor) {
          this.setClear(background, 1);
          forceClear = true;
        }
      }
      if (this.renderer.autoClear || forceClear) {
        this.renderer.clear(this.renderer.autoClearColor, this.renderer.autoClearDepth, this.renderer.autoClearStencil);
      }
      if (background && (background.isCubeTexture || background.isWebGLCubeRenderTarget || background.mapping === module$constants.CubeUVReflectionMapping)) {
        if (this.boxMesh === undefined) {
          this.boxMesh = new module$objects$Mesh.Mesh(new module$geometries$BoxGeometry.BoxGeometry(1, 1, 1), new module$materials$ShaderMaterial.ShaderMaterial({name:"BackgroundCubeMaterial", uniforms:(0,module$renderers$shaders$UniformsUtils.cloneUniforms)(module$renderers$shaders$ShaderLib.ShaderLib.cube.uniforms), vertexShader:module$renderers$shaders$ShaderLib.ShaderLib.cube.vertexShader, fragmentShader:module$renderers$shaders$ShaderLib.ShaderLib.cube.fragmentShader, side:module$constants.BackSide, 
          depthTest:false, depthWrite:false, fog:false}));
          this.boxMesh.geometry.deleteAttribute("normal");
          this.boxMesh.geometry.deleteAttribute("uv");
          this.boxMesh.onBeforeRender = function(renderer, scene, camera) {
            this.matrixWorld.copyPosition(camera.matrixWorld);
          };
          this.boxMesh.material.envMap.get = function() {
            return this.uniforms.envMap.value;
          };
          this.objects.update(this.boxMesh);
        }
        if (background.isWebGLCubeRenderTarget) {
          background = background.texture;
        }
        this.boxMesh.material.uniforms.envMap.value = background;
        this.boxMesh.material.uniforms.flipEnvMap.value = background.isCubeTexture && background._needsFlipEnvMap ? -1 : 1;
        if (this.currentBackground !== background || this.currentBackgroundVersion !== background.version || this.currentTonemapping !== this.renderer.toneMapping) {
          this.boxMesh.material.needsUpdate = true;
          this.currentBackground = background;
          this.currentBackgroundVersion = background.version;
          this.currentTonemapping = this.renderer.toneMapping;
        }
        renderList.unshift(this.boxMesh, this.boxMesh.geometry, this.boxMesh.material, 0, 0, null);
      } else {
        if (background && background.isTexture) {
          if (this.planeMesh === undefined) {
            this.planeMesh = new module$objects$Mesh.Mesh(new module$geometries$PlaneGeometry.PlaneGeometry(2, 2), new module$materials$ShaderMaterial.ShaderMaterial({name:"BackgroundMaterial", uniforms:(0,module$renderers$shaders$UniformsUtils.cloneUniforms)(module$renderers$shaders$ShaderLib.ShaderLib.background.uniforms), vertexShader:module$renderers$shaders$ShaderLib.ShaderLib.background.vertexShader, fragmentShader:module$renderers$shaders$ShaderLib.ShaderLib.background.fragmentShader, side:module$constants.FrontSide, 
            depthTest:false, depthWrite:false, fog:false}));
            this.planeMesh.geometry.deleteAttribute("normal");
            this.planeMesh.material.map.get = function() {
              return this.uniforms.t2D.value;
            };
            this.objects.update(this.planeMesh);
          }
          this.planeMesh.material.uniforms.t2D.value = background;
          if (background.matrixAutoUpdate === true) {
            background.updateMatrix();
          }
          this.planeMesh.material.uniforms.uvTransform.value.copy(background.matrix);
          if (this.currentBackground !== background || this.currentBackgroundVersion !== background.version || this.currentTonemapping !== this.renderer.toneMapping) {
            this.planeMesh.material.needsUpdate = true;
            this.currentBackground = background;
            this.currentBackgroundVersion = background.version;
            this.currentTonemapping = this.renderer.toneMapping;
          }
          renderList.unshift(this.planeMesh, this.planeMesh.geometry, this.planeMesh.material, 0, 0, null);
        }
      }
    }
    setClear(color, alpha) {
      this.state.buffers.color.setClear(color.r, color.g, color.b, alpha, this.premultipliedAlpha);
    }
    getClearColor() {
      return this.clearColor;
    }
    setClearColor(color = null, alpha = 1) {
      this.clearColor.set(color);
      this.clearAlpha = alpha;
      this.setClear(this.clearColor, this.clearAlpha);
    }
    getClearAlpha() {
      return this.clearAlpha;
    }
    setClearAlpha(alpha) {
      this.clearAlpha = alpha;
      this.setClear(this.clearColor, this.clearAlpha);
    }
  }
}, "renderers/webgl/WebGLBackground.js", ["constants.js", "geometries/BoxGeometry.js", "geometries/PlaneGeometry.js", "materials/ShaderMaterial.js", "math/Color.js", "objects/Mesh.js", "renderers/shaders/ShaderLib.js", "renderers/shaders/UniformsUtils.js"]);

//renderers/webgl/WebGLBindingStates.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLBindingStates:{enumerable:true, get:function() {
    return WebGLBindingStates;
  }}});
  class WebGLBindingStates {
    constructor(gl, extensions, attributes, capabilities) {
      this.gl = gl;
      this.extensions = extensions;
      this.attributes = attributes;
      this.capabilities = capabilities;
      this.maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      this.extension = capabilities.isWebGL2 ? null : extensions.get("OES_vertex_array_object");
      this.vaoAvailable = capabilities.isWebGL2 || this.extension !== null;
      this.bindingStates = {};
      this.defaultState = this.createBindingState(null);
      this.currentState = this.defaultState;
    }
    setup(object, material, program, geometry, index) {
      let updateBuffers = false;
      if (this.vaoAvailable) {
        const state = this.getBindingState(geometry, program, material);
        if (this.currentState !== state) {
          this.currentState = state;
          this.bindVertexArrayObject(this.currentState.object);
        }
        updateBuffers = this.needsUpdate(geometry, index);
        if (updateBuffers) {
          this.saveCache(geometry, index);
        }
      } else {
        const wireframe = material.wireframe === true;
        if (this.currentState.geometry !== geometry.id || this.currentState.program !== program.id || this.currentState.wireframe !== wireframe) {
          this.currentState.geometry = geometry.id;
          this.currentState.program = program.id;
          this.currentState.wireframe = wireframe;
          updateBuffers = true;
        }
      }
      if (object.isInstancedMesh === true) {
        updateBuffers = true;
      }
      if (index !== null) {
        this.attributes.update(index, this.gl.ELEMENT_ARRAY_BUFFER);
      }
      if (updateBuffers) {
        this.setupVertexAttributes(object, material, program, geometry);
        if (index !== null) {
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.attributes.get(index).buffer);
        }
      }
    }
    createVertexArrayObject() {
      if (this.capabilities.isWebGL2) {
        return this.gl.createVertexArray();
      }
      return this.extension.createVertexArrayOES();
    }
    bindVertexArrayObject(vao) {
      if (this.capabilities.isWebGL2) {
        return this.gl.bindVertexArray(vao);
      }
      return this.extension.bindVertexArrayOES(vao);
    }
    deleteVertexArrayObject(vao) {
      if (this.capabilities.isWebGL2) {
        return this.gl.deleteVertexArray(vao);
      }
      return this.extension.deleteVertexArrayOES(vao);
    }
    getBindingState(geometry, program, material) {
      const wireframe = material.wireframe === true;
      let programMap = this.bindingStates[geometry.id];
      if (programMap === undefined) {
        programMap = {};
        this.bindingStates[geometry.id] = programMap;
      }
      let stateMap = programMap[program.id];
      if (stateMap === undefined) {
        stateMap = {};
        programMap[program.id] = stateMap;
      }
      let state = stateMap[wireframe];
      if (state === undefined) {
        state = this.createBindingState(this.createVertexArrayObject());
        stateMap[wireframe] = state;
      }
      return state;
    }
    createBindingState(vao) {
      const newAttributes = [];
      const enabledAttributes = [];
      const attributeDivisors = [];
      for (let i = 0; i < this.maxVertexAttributes; i++) {
        newAttributes[i] = 0;
        enabledAttributes[i] = 0;
        attributeDivisors[i] = 0;
      }
      return {geometry:null, program:null, wireframe:false, newAttributes:newAttributes, enabledAttributes:enabledAttributes, attributeDivisors:attributeDivisors, object:vao, attributes:{}, index:null};
    }
    needsUpdate(geometry, index) {
      const cachedAttributes = this.currentState.attributes;
      const geometryAttributes = geometry.attributes;
      let attributesNum = 0;
      for (const key in geometryAttributes) {
        const cachedAttribute = cachedAttributes[key];
        const geometryAttribute = geometryAttributes[key];
        if (cachedAttribute === undefined) {
          return true;
        }
        if (cachedAttribute.attribute !== geometryAttribute) {
          return true;
        }
        if (cachedAttribute.data !== geometryAttribute.data) {
          return true;
        }
        attributesNum++;
      }
      if (this.currentState.attributesNum !== attributesNum) {
        return true;
      }
      if (this.currentState.index !== index) {
        return true;
      }
      return false;
    }
    saveCache(geometry, index) {
      const cache = {};
      const attributes = geometry.attributes;
      let attributesNum = 0;
      for (const key in attributes) {
        const attribute = attributes[key];
        const data = {};
        data.attribute = attribute;
        if (attribute.data) {
          data.data = attribute.data;
        }
        cache[key] = data;
        attributesNum++;
      }
      this.currentState.attributes = cache;
      this.currentState.attributesNum = attributesNum;
      this.currentState.index = index;
    }
    initAttributes() {
      const newAttributes = this.currentState.newAttributes;
      for (let i = 0, il = newAttributes.length; i < il; i++) {
        newAttributes[i] = 0;
      }
    }
    enableAttribute(attribute) {
      this.enableAttributeAndDivisor(attribute, 0);
    }
    enableAttributeAndDivisor(attribute, meshPerAttribute) {
      const newAttributes = this.currentState.newAttributes;
      const enabledAttributes = this.currentState.enabledAttributes;
      const attributeDivisors = this.currentState.attributeDivisors;
      newAttributes[attribute] = 1;
      if (enabledAttributes[attribute] === 0) {
        this.gl.enableVertexAttribArray(attribute);
        enabledAttributes[attribute] = 1;
      }
      if (attributeDivisors[attribute] !== meshPerAttribute) {
        const extension = this.capabilities.isWebGL2 ? this.gl : this.extensions.get("ANGLE_instanced_arrays");
        extension[this.capabilities.isWebGL2 ? "vertexAttribDivisor" : "vertexAttribDivisorANGLE"](attribute, meshPerAttribute);
        attributeDivisors[attribute] = meshPerAttribute;
      }
    }
    disableUnusedAttributes() {
      const newAttributes = this.currentState.newAttributes;
      const enabledAttributes = this.currentState.enabledAttributes;
      for (let i = 0, il = enabledAttributes.length; i < il; i++) {
        if (enabledAttributes[i] !== newAttributes[i]) {
          this.gl.disableVertexAttribArray(i);
          enabledAttributes[i] = 0;
        }
      }
    }
    vertexAttribPointer(index, size, type, normalized, stride, offset) {
      if (this.capabilities.isWebGL2 === true && (type === this.gl.INT || type === this.gl.UNSIGNED_INT)) {
        this.gl.vertexAttribIPointer(index, size, type, stride, offset);
      } else {
        this.gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
      }
    }
    setupVertexAttributes(object, material, program, geometry) {
      if (this.capabilities.isWebGL2 === false && (object.isInstancedMesh || geometry.isInstancedBufferGeometry)) {
        if (this.extensions.get("ANGLE_instanced_arrays") === null) {
          return;
        }
      }
      this.initAttributes();
      const geometryAttributes = geometry.attributes;
      const programAttributes = program.getAttributes();
      const materialDefaultAttributeValues = material.defaultAttributeValues;
      for (const name in programAttributes) {
        const programAttribute = programAttributes[name];
        if (programAttribute >= 0) {
          const geometryAttribute = geometryAttributes[name];
          if (geometryAttribute !== undefined) {
            console.log("WebGLBindingStates 1");
            const normalized = geometryAttribute.normalized;
            const size = geometryAttribute.itemSize;
            const attribute = this.attributes.get(geometryAttribute);
            if (attribute === undefined) {
              continue;
            }
            const buffer = attribute.buffer;
            const type = attribute.type;
            const bytesPerElement = attribute.bytesPerElement;
            if (geometryAttribute.isInterleavedBufferAttribute) {
              const data = geometryAttribute.data;
              const stride = data.stride;
              const offset = geometryAttribute.offset;
              if (data && data.isInstancedInterleavedBuffer) {
                this.enableAttributeAndDivisor(programAttribute, data.meshPerAttribute);
                if (geometry._maxInstanceCount === undefined) {
                  geometry._maxInstanceCount = data.meshPerAttribute * data.count;
                }
              } else {
                this.enableAttribute(programAttribute);
              }
              this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
              this.vertexAttribPointer(programAttribute, size, type, normalized, stride * bytesPerElement, offset * bytesPerElement);
            } else {
              if (geometryAttribute.isInstancedBufferAttribute) {
                this.enableAttributeAndDivisor(programAttribute, geometryAttribute.meshPerAttribute);
                if (geometry._maxInstanceCount === undefined) {
                  geometry._maxInstanceCount = geometryAttribute.meshPerAttribute * geometryAttribute.count;
                }
              } else {
                this.enableAttribute(programAttribute);
              }
              this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
              this.vertexAttribPointer(programAttribute, size, type, normalized, 0, 0);
            }
          } else {
            if (name === "instanceMatrix") {
              const attribute = this.attributes.get(object.instanceMatrix);
              if (attribute === undefined) {
                continue;
              }
              const buffer = attribute.buffer;
              const type = attribute.type;
              this.enableAttributeAndDivisor(programAttribute + 0, 1);
              this.enableAttributeAndDivisor(programAttribute + 1, 1);
              this.enableAttributeAndDivisor(programAttribute + 2, 1);
              this.enableAttributeAndDivisor(programAttribute + 3, 1);
              this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
              this.gl.vertexAttribPointer(programAttribute + 0, 4, type, false, 64, 0);
              this.gl.vertexAttribPointer(programAttribute + 1, 4, type, false, 64, 16);
              this.gl.vertexAttribPointer(programAttribute + 2, 4, type, false, 64, 32);
              this.gl.vertexAttribPointer(programAttribute + 3, 4, type, false, 64, 48);
            } else {
              if (name === "instanceColor") {
                const attribute = this.attributes.get(object.instanceColor);
                if (attribute === undefined) {
                  continue;
                }
                const buffer = attribute.buffer;
                const type = attribute.type;
                this.enableAttributeAndDivisor(programAttribute, 1);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
                this.gl.vertexAttribPointer(programAttribute, 3, type, false, 12, 0);
              } else {
                if (materialDefaultAttributeValues !== undefined) {
                  console.log("WebGLBindingStates 2");
                  const value = materialDefaultAttributeValues[name];
                  if (value !== undefined) {
                    console.log("WebGLBindingStates 3");
                    switch(value.length) {
                      case 2:
                        this.gl.vertexAttrib2fv(programAttribute, value);
                        break;
                      case 3:
                        this.gl.vertexAttrib3fv(programAttribute, value);
                        break;
                      case 4:
                        this.gl.vertexAttrib4fv(programAttribute, value);
                        break;
                      default:
                        this.gl.vertexAttrib1fv(programAttribute, value);
                    }
                  }
                }
              }
            }
          }
        }
      }
      this.disableUnusedAttributes();
    }
    dispose() {
      this.reset();
      for (const geometryId in this.bindingStates) {
        const programMap = this.bindingStates[geometryId];
        for (const programId in programMap) {
          const stateMap = programMap[programId];
          for (const wireframe in stateMap) {
            this.deleteVertexArrayObject(stateMap[wireframe].object);
            delete stateMap[wireframe];
          }
          delete programMap[programId];
        }
        delete this.bindingStates[geometryId];
      }
    }
    releaseStatesOfGeometry(geometry) {
      if (this.bindingStates[geometry.id] === undefined) {
        return;
      }
      const programMap = this.bindingStates[geometry.id];
      for (const programId in programMap) {
        const stateMap = programMap[programId];
        for (const wireframe in stateMap) {
          this.deleteVertexArrayObject(stateMap[wireframe].object);
          delete stateMap[wireframe];
        }
        delete programMap[programId];
      }
      delete this.bindingStates[geometry.id];
    }
    releaseStatesOfProgram(program) {
      for (const geometryId in this.bindingStates) {
        const programMap = this.bindingStates[geometryId];
        if (programMap[program.id] === undefined) {
          continue;
        }
        const stateMap = programMap[program.id];
        for (const wireframe in stateMap) {
          this.deleteVertexArrayObject(stateMap[wireframe].object);
          delete stateMap[wireframe];
        }
        delete programMap[program.id];
      }
    }
    reset() {
      this.resetDefaultState();
      if (this.currentState === this.defaultState) {
        return;
      }
      this.currentState = this.defaultState;
      this.bindVertexArrayObject(this.currentState.object);
    }
    resetDefaultState() {
      this.defaultState.geometry = null;
      this.defaultState.program = null;
      this.defaultState.wireframe = false;
    }
  }
}, "renderers/webgl/WebGLBindingStates.js", []);

//renderers/webgl/WebGLBufferRenderer.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLBufferRenderer:{enumerable:true, get:function() {
    return WebGLBufferRenderer;
  }}});
  class WebGLBufferRenderer {
    constructor(gl, extensions, info, capabilities) {
      this.gl = gl;
      this.extensions = extensions;
      this.info = info;
      this.capabilities = capabilities;
      this.isWebGL2 = capabilities.isWebGL2;
      this.mode = undefined;
    }
    setMode(value) {
      this.mode = value;
    }
    render(start, count) {
      this.gl.drawArrays(this.mode, start, count);
      this.info.update(count, this.mode, 1);
    }
    renderInstances(start, count, primcount) {
      if (primcount === 0) {
        return;
      }
      let extension, methodName;
      if (this.isWebGL2) {
        extension = this.gl;
        methodName = "drawArraysInstanced";
      } else {
        extension = this.extensions.get("ANGLE_instanced_arrays");
        methodName = "drawArraysInstancedANGLE";
        if (extension === null) {
          console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");
          return;
        }
      }
      extension[methodName](this.mode, start, count, primcount);
      this.info.update(count, this.mode, primcount);
    }
  }
}, "renderers/webgl/WebGLBufferRenderer.js", []);

//renderers/webgl/WebGLCapabilities.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLCapabilities:{enumerable:true, get:function() {
    return WebGLCapabilities;
  }}});
  class WebGLCapabilities {
    constructor(gl, extensions, parameters) {
      this.gl = gl;
      this.extensions = extensions;
      this.parameters = parameters;
      this.maxAnisotropy;
      this.isWebGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext || typeof WebGL2ComputeRenderingContext !== "undefined" && gl instanceof WebGL2ComputeRenderingContext;
      this.precision = parameters.precision !== undefined ? parameters.precision : "highp";
      this.maxPrecision = this.getMaxPrecision(this.precision);
      if (this.maxPrecision !== this.precision) {
        console.warn("THREE.WebGLRenderer:", this.precision, "not supported, using", this.maxPrecision, "instead.");
        this.precision = this.maxPrecision;
      }
      this.logarithmicDepthBuffer = parameters.logarithmicDepthBuffer === true;
      this.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      this.maxVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
      this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      this.maxCubemapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
      this.maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      this.maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
      this.maxVaryings = gl.getParameter(gl.MAX_VARYING_VECTORS);
      this.maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
      this.vertexTextures = this.maxVertexTextures > 0;
      this.floatFragmentTextures = this.isWebGL2 || extensions.has("OES_texture_float");
      this.floatVertexTextures = this.vertexTextures && this.floatFragmentTextures;
      this.maxSamples = this.isWebGL2 ? gl.getParameter(gl.MAX_SAMPLES) : 0;
    }
    getMaxAnisotropy() {
      if (this.maxAnisotropy !== undefined) {
        return this.maxAnisotropy;
      }
      if (this.extensions.has("EXT_texture_filter_anisotropic") === true) {
        const extension = this.extensions.get("EXT_texture_filter_anisotropic");
        this.maxAnisotropy = this.gl.getParameter(extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      } else {
        this.maxAnisotropy = 0;
      }
      return this.maxAnisotropy;
    }
    getMaxPrecision(precision) {
      if (precision === "highp") {
        if (this.gl.getShaderPrecisionFormat(this.gl.VERTEX_SHADER, this.gl.HIGH_FLOAT).precision > 0 && this.gl.getShaderPrecisionFormat(this.gl.FRAGMENT_SHADER, this.gl.HIGH_FLOAT).precision > 0) {
          return "highp";
        }
        precision = "mediump";
      }
      if (precision === "mediump") {
        if (this.gl.getShaderPrecisionFormat(this.gl.VERTEX_SHADER, this.gl.MEDIUM_FLOAT).precision > 0 && this.gl.getShaderPrecisionFormat(this.gl.FRAGMENT_SHADER, this.gl.MEDIUM_FLOAT).precision > 0) {
          return "mediump";
        }
      }
      return "lowp";
    }
  }
}, "renderers/webgl/WebGLCapabilities.js", []);

//renderers/webgl/WebGLClipping.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLClipping:{enumerable:true, get:function() {
    return WebGLClipping;
  }}});
  var module$cameras$Camera = $$require("cameras/Camera.js");
  var module$math$Matrix3 = $$require("math/Matrix3.js");
  var module$math$Plane = $$require("math/Plane.js");
  class WebGLClipping {
    constructor(properties) {
      this.properties = properties;
      this.globalState = null;
      this.numGlobalPlanes = 0;
      this.localClippingEnabled = false;
      this.renderingShadows = false;
      this.plane = new module$math$Plane.Plane;
      this.viewNormalMatrix = new module$math$Matrix3.Matrix3;
      this.uniform = {value:null, needsUpdate:false};
      this.numPlanes = 0;
      this.numIntersection = 0;
    }
    init(planes, enableLocalClipping, camera) {
      const enabled = planes.length !== 0 || enableLocalClipping || this.numGlobalPlanes !== 0 || this.localClippingEnabled;
      this.localClippingEnabled = enableLocalClipping;
      this.globalState = this.projectPlanes(planes, camera, 0);
      this.numGlobalPlanes = planes.length;
      return enabled;
    }
    beginShadows() {
      this.renderingShadows = true;
      this.projectPlanes(null);
    }
    endShadows() {
      this.renderingShadows = false;
      this.resetGlobalState();
    }
    setState(material, camera, useCache) {
      const planes = material.clippingPlanes, clipIntersection = material.clipIntersection, clipShadows = material.clipShadows;
      const materialProperties = this.properties.get(material);
      if (!this.localClippingEnabled || planes === null || planes.length === 0 || this.renderingShadows && !clipShadows) {
        if (this.renderingShadows) {
          this.projectPlanes(null);
        } else {
          this.resetGlobalState();
        }
      } else {
        const nGlobal = this.renderingShadows ? 0 : this.numGlobalPlanes, lGlobal = nGlobal * 4;
        let dstArray = materialProperties.clippingState || null;
        this.uniform.value = dstArray;
        dstArray = this.projectPlanes(planes, camera, lGlobal, useCache);
        for (let i = 0; i !== lGlobal; ++i) {
          dstArray[i] = this.globalState[i];
        }
        materialProperties.clippingState = dstArray;
        this.numIntersection = clipIntersection ? this.numPlanes : 0;
        this.numPlanes += nGlobal;
      }
    }
    resetGlobalState() {
      if (this.uniform.value !== this.globalState) {
        this.uniform.value = this.globalState;
        this.uniform.needsUpdate = this.numGlobalPlanes > 0;
      }
      this.numPlanes = this.numGlobalPlanes;
      this.numIntersection = 0;
    }
    projectPlanes(planes, camera, dstOffset, skipTransform) {
      const nPlanes = planes !== null ? planes.length : 0;
      let dstArray = null;
      if (nPlanes !== 0) {
        dstArray = this.uniform.value;
        if (skipTransform !== true || dstArray === null) {
          const flatSize = dstOffset + nPlanes * 4, viewMatrix = camera.matrixWorldInverse;
          this.viewNormalMatrix.getNormalMatrix(viewMatrix);
          if (dstArray === null || dstArray.length < flatSize) {
            dstArray = new Float32Array(flatSize);
          }
          for (let i = 0, i4 = dstOffset; i !== nPlanes; ++i, i4 += 4) {
            this.plane.copy(planes[i]).applyMatrix4(viewMatrix, this.viewNormalMatrix);
            this.plane.normal.toArray(dstArray, i4);
            dstArray[i4 + 3] = this.plane.constant;
          }
        }
        this.uniform.value = dstArray;
        this.uniform.needsUpdate = true;
      }
      this.numPlanes = nPlanes;
      this.numIntersection = 0;
      return dstArray;
    }
  }
}, "renderers/webgl/WebGLClipping.js", ["cameras/Camera.js", "math/Matrix3.js", "math/Plane.js"]);

//renderers/WebGLRenderTarget.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLRenderTarget:{enumerable:true, get:function() {
    return WebGLRenderTarget;
  }}});
  var module$core$EventDispatcher = $$require("core/EventDispatcher.js");
  var module$textures$Texture = $$require("textures/Texture.js");
  var module$constants = $$require("constants.js");
  var module$math$Vector4 = $$require("math/Vector4.js");
  class WebGLRenderTarget extends module$core$EventDispatcher.EventDispatcher {
    constructor(width, height, options) {
      super();
      this.width = width;
      this.height = height;
      this.depth = 1;
      this.scissor = new module$math$Vector4.Vector4(0, 0, width, height);
      this.scissorTest = false;
      this.viewport = new module$math$Vector4.Vector4(0, 0, width, height);
      options = options || {};
      this.texture = new module$textures$Texture.Texture(undefined, options.mapping, options.wrapS, options.wrapT, options.magFilter, options.minFilter, options.format, options.type, options.anisotropy, options.encoding);
      this.texture.image = {};
      this.texture.image.width = width;
      this.texture.image.height = height;
      this.texture.image.depth = 1;
      this.texture.generateMipmaps = options.generateMipmaps !== undefined ? options.generateMipmaps : false;
      this.texture.minFilter = options.minFilter !== undefined ? options.minFilter : module$constants.LinearFilter;
      this.depthBuffer = options.depthBuffer !== undefined ? options.depthBuffer : true;
      this.stencilBuffer = options.stencilBuffer !== undefined ? options.stencilBuffer : false;
      this.depthTexture = options.depthTexture !== undefined ? options.depthTexture : null;
    }
    setTexture(texture) {
      texture.image = {width:this.width, height:this.height, depth:this.depth};
      this.texture = texture;
    }
    setSize(width, height, depth = 1) {
      if (this.width !== width || this.height !== height || this.depth !== depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.texture.image.width = width;
        this.texture.image.height = height;
        this.texture.image.depth = depth;
        this.dispose();
      }
      this.viewport.set(0, 0, width, height);
      this.scissor.set(0, 0, width, height);
    }
    clone() {
      return (new this.constructor).copy(this);
    }
    copy(source) {
      this.width = source.width;
      this.height = source.height;
      this.depth = source.depth;
      this.viewport.copy(source.viewport);
      this.texture = source.texture.clone();
      this.depthBuffer = source.depthBuffer;
      this.stencilBuffer = source.stencilBuffer;
      this.depthTexture = source.depthTexture;
      return this;
    }
    dispose() {
      this.dispatchEvent({type:"dispose"});
    }
  }
  WebGLRenderTarget.prototype.isWebGLRenderTarget = true;
}, "renderers/WebGLRenderTarget.js", ["core/EventDispatcher.js", "textures/Texture.js", "constants.js", "math/Vector4.js"]);

//cameras/CubeCamera.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {CubeCamera:{enumerable:true, get:function() {
    return CubeCamera;
  }}});
  var module$core$Object3D = $$require("core/Object3D.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$cameras$PerspectiveCamera = $$require("cameras/PerspectiveCamera.js");
  const fov = 90, aspect = 1;
  class CubeCamera extends module$core$Object3D.Object3D {
    constructor(near, far, renderTarget) {
      super();
      this.type = "CubeCamera";
      if (renderTarget.isWebGLCubeRenderTarget !== true) {
        console.error("THREE.CubeCamera: The constructor now expects an instance of WebGLCubeRenderTarget as third parameter.");
        return;
      }
      this.renderTarget = renderTarget;
      const cameraPX = new module$cameras$PerspectiveCamera.PerspectiveCamera(fov, aspect, near, far);
      cameraPX.layers = this.layers;
      cameraPX.up.set(0, -1, 0);
      cameraPX.lookAt(new module$math$Vector3.Vector3(1, 0, 0));
      this.add(cameraPX);
      const cameraNX = new module$cameras$PerspectiveCamera.PerspectiveCamera(fov, aspect, near, far);
      cameraNX.layers = this.layers;
      cameraNX.up.set(0, -1, 0);
      cameraNX.lookAt(new module$math$Vector3.Vector3(-1, 0, 0));
      this.add(cameraNX);
      const cameraPY = new module$cameras$PerspectiveCamera.PerspectiveCamera(fov, aspect, near, far);
      cameraPY.layers = this.layers;
      cameraPY.up.set(0, 0, 1);
      cameraPY.lookAt(new module$math$Vector3.Vector3(0, 1, 0));
      this.add(cameraPY);
      const cameraNY = new module$cameras$PerspectiveCamera.PerspectiveCamera(fov, aspect, near, far);
      cameraNY.layers = this.layers;
      cameraNY.up.set(0, 0, -1);
      cameraNY.lookAt(new module$math$Vector3.Vector3(0, -1, 0));
      this.add(cameraNY);
      const cameraPZ = new module$cameras$PerspectiveCamera.PerspectiveCamera(fov, aspect, near, far);
      cameraPZ.layers = this.layers;
      cameraPZ.up.set(0, -1, 0);
      cameraPZ.lookAt(new module$math$Vector3.Vector3(0, 0, 1));
      this.add(cameraPZ);
      const cameraNZ = new module$cameras$PerspectiveCamera.PerspectiveCamera(fov, aspect, near, far);
      cameraNZ.layers = this.layers;
      cameraNZ.up.set(0, -1, 0);
      cameraNZ.lookAt(new module$math$Vector3.Vector3(0, 0, -1));
      this.add(cameraNZ);
    }
    update(renderer, scene) {
      if (this.parent === null) {
        this.updateMatrixWorld();
      }
      const renderTarget = this.renderTarget;
      const [cameraPX, cameraNX, cameraPY, cameraNY, cameraPZ, cameraNZ] = this.children;
      const currentXrEnabled = renderer.xr.enabled;
      const currentRenderTarget = renderer.getRenderTarget();
      renderer.xr.enabled = false;
      const generateMipmaps = renderTarget.texture.generateMipmaps;
      renderTarget.texture.generateMipmaps = false;
      renderer.setRenderTarget(renderTarget, 0);
      renderer.render(scene, cameraPX);
      renderer.setRenderTarget(renderTarget, 1);
      renderer.render(scene, cameraNX);
      renderer.setRenderTarget(renderTarget, 2);
      renderer.render(scene, cameraPY);
      renderer.setRenderTarget(renderTarget, 3);
      renderer.render(scene, cameraNY);
      renderer.setRenderTarget(renderTarget, 4);
      renderer.render(scene, cameraPZ);
      renderTarget.texture.generateMipmaps = generateMipmaps;
      renderer.setRenderTarget(renderTarget, 5);
      renderer.render(scene, cameraNZ);
      renderer.setRenderTarget(currentRenderTarget);
      renderer.xr.enabled = currentXrEnabled;
    }
  }
}, "cameras/CubeCamera.js", ["core/Object3D.js", "math/Vector3.js", "cameras/PerspectiveCamera.js"]);

//textures/CubeTexture.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {CubeTexture:{enumerable:true, get:function() {
    return CubeTexture;
  }}});
  var module$textures$Texture = $$require("textures/Texture.js");
  var module$constants = $$require("constants.js");
  class CubeTexture extends module$textures$Texture.Texture {
    constructor(images, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding) {
      console.log("CubeTexture constructor images " + (images !== undefined));
      console.log("CubeTexture constructor mapping " + (mapping !== undefined));
      console.log("CubeTexture constructor format " + (format !== undefined));
      images = images !== undefined ? images : [];
      mapping = mapping !== undefined ? mapping : module$constants.CubeReflectionMapping;
      format = format !== undefined ? format : module$constants.RGBFormat;
      super(images, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding);
      this._needsFlipEnvMap = true;
      this.flipY = false;
    }
    get images() {
      return this.image;
    }
    set images(value) {
      this.image = value;
    }
  }
  CubeTexture.prototype.isCubeTexture = true;
}, "textures/CubeTexture.js", ["textures/Texture.js", "constants.js"]);

//renderers/WebGLCubeRenderTarget.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLCubeRenderTarget:{enumerable:true, get:function() {
    return WebGLCubeRenderTarget;
  }}});
  var module$constants = $$require("constants.js");
  var module$objects$Mesh = $$require("objects/Mesh.js");
  var module$geometries$BoxGeometry = $$require("geometries/BoxGeometry.js");
  var module$materials$ShaderMaterial = $$require("materials/ShaderMaterial.js");
  var module$renderers$shaders$UniformsUtils = $$require("renderers/shaders/UniformsUtils.js");
  var module$renderers$WebGLRenderTarget = $$require("renderers/WebGLRenderTarget.js");
  var module$cameras$CubeCamera = $$require("cameras/CubeCamera.js");
  var module$textures$CubeTexture = $$require("textures/CubeTexture.js");
  class WebGLCubeRenderTarget extends module$renderers$WebGLRenderTarget.WebGLRenderTarget {
    constructor(size, options) {
      super(size, size, options);
      options = options || {};
      this.texture = new module$textures$CubeTexture.CubeTexture(undefined, options.mapping, options.wrapS, options.wrapT, options.magFilter, options.minFilter, options.format, options.type, options.anisotropy, options.encoding);
      this.texture.generateMipmaps = options.generateMipmaps !== undefined ? options.generateMipmaps : false;
      this.texture.minFilter = options.minFilter !== undefined ? options.minFilter : module$constants.LinearFilter;
      this.texture._needsFlipEnvMap = false;
    }
    fromEquirectangularTexture(renderer, texture) {
      this.texture.type = texture.type;
      this.texture.format = module$constants.RGBAFormat;
      this.texture.encoding = texture.encoding;
      this.texture.generateMipmaps = texture.generateMipmaps;
      this.texture.minFilter = texture.minFilter;
      this.texture.magFilter = texture.magFilter;
      const shader = {uniforms:{tEquirect:{value:null}, }, vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`, fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`};
      const geometry = new module$geometries$BoxGeometry.BoxGeometry(5, 5, 5);
      const material = new module$materials$ShaderMaterial.ShaderMaterial({name:"CubemapFromEquirect", uniforms:(0,module$renderers$shaders$UniformsUtils.cloneUniforms)(shader.uniforms), vertexShader:shader.vertexShader, fragmentShader:shader.fragmentShader, side:module$constants.BackSide, blending:module$constants.NoBlending});
      material.uniforms.tEquirect.value = texture;
      const mesh = new module$objects$Mesh.Mesh(geometry, material);
      const currentMinFilter = texture.minFilter;
      if (texture.minFilter === module$constants.LinearMipmapLinearFilter) {
        texture.minFilter = module$constants.LinearFilter;
      }
      const camera = new module$cameras$CubeCamera.CubeCamera(1, 10, this);
      camera.update(renderer, mesh);
      texture.minFilter = currentMinFilter;
      mesh.geometry.dispose();
      mesh.material.dispose();
      return this;
    }
    clear(renderer, color, depth, stencil) {
      const currentRenderTarget = renderer.getRenderTarget();
      for (let i = 0; i < 6; i++) {
        renderer.setRenderTarget(this, i);
        renderer.clear(color, depth, stencil);
      }
      renderer.setRenderTarget(currentRenderTarget);
    }
  }
  WebGLCubeRenderTarget.prototype.isWebGLCubeRenderTarget = true;
}, "renderers/WebGLCubeRenderTarget.js", ["constants.js", "objects/Mesh.js", "geometries/BoxGeometry.js", "materials/ShaderMaterial.js", "renderers/shaders/UniformsUtils.js", "renderers/WebGLRenderTarget.js", "cameras/CubeCamera.js", "textures/CubeTexture.js"]);

//renderers/webgl/WebGLCubeMaps.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLCubeMaps:{enumerable:true, get:function() {
    return WebGLCubeMaps;
  }}});
  var module$constants = $$require("constants.js");
  var module$renderers$WebGLCubeRenderTarget = $$require("renderers/WebGLCubeRenderTarget.js");
  class WebGLCubeMaps {
    constructor(renderer) {
      this.renderer = renderer;
      this.cubemaps = new WeakMap;
    }
    mapTextureMapping(texture, mapping) {
      if (mapping === module$constants.EquirectangularReflectionMapping) {
        texture.mapping = module$constants.CubeReflectionMapping;
      } else {
        if (mapping === module$constants.EquirectangularRefractionMapping) {
          texture.mapping = module$constants.CubeRefractionMapping;
        }
      }
      return texture;
    }
    get(texture) {
      if (texture && texture.isTexture) {
        const mapping = texture.mapping;
        if (mapping === module$constants.EquirectangularReflectionMapping || mapping === module$constants.EquirectangularRefractionMapping) {
          if (this.cubemaps.has(texture)) {
            const cubemap = this.cubemaps.get(texture).texture;
            return this.mapTextureMapping(cubemap, texture.mapping);
          } else {
            const image = texture.image;
            if (image && image.height > 0) {
              const currentRenderTarget = this.renderer.getRenderTarget();
              const renderTarget = new module$renderers$WebGLCubeRenderTarget.WebGLCubeRenderTarget(image.height / 2);
              renderTarget.fromEquirectangularTexture(this.renderer, texture);
              this.cubemaps.set(texture, renderTarget);
              this.renderer.setRenderTarget(currentRenderTarget);
              texture.addEventListener("dispose", this.onTextureDispose);
              return this.mapTextureMapping(renderTarget.texture, texture.mapping);
            } else {
              return null;
            }
          }
        }
      }
      return texture;
    }
    onTextureDispose(event) {
      const texture = event.target;
      texture.removeEventListener("dispose", this.onTextureDispose);
      const cubemap = this.cubemaps.get(texture);
      if (cubemap !== undefined) {
        this.cubemaps["delete"](texture);
        cubemap.dispose();
      }
    }
    dispose() {
      this.cubemaps = new WeakMap;
    }
  }
}, "renderers/webgl/WebGLCubeMaps.js", ["constants.js", "renderers/WebGLCubeRenderTarget.js"]);

//renderers/webgl/WebGLExtensions.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLExtensions:{enumerable:true, get:function() {
    return WebGLExtensions;
  }}});
  class WebGLExtensions {
    constructor(gl) {
      this.gl = gl;
      this.extensions = {};
    }
    getExtension(name) {
      if (this.extensions[name] !== undefined) {
        return this.extensions[name];
      }
      let extension;
      switch(name) {
        case "WEBGL_depth_texture":
          extension = this.gl.getExtension("WEBGL_depth_texture") || this.gl.getExtension("MOZ_WEBGL_depth_texture") || this.gl.getExtension("WEBKIT_WEBGL_depth_texture");
          break;
        case "EXT_texture_filter_anisotropic":
          extension = this.gl.getExtension("EXT_texture_filter_anisotropic") || this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic") || this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
          break;
        case "WEBGL_compressed_texture_s3tc":
          extension = this.gl.getExtension("WEBGL_compressed_texture_s3tc") || this.gl.getExtension("MOZ_WEBGL_compressed_texture_s3tc") || this.gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");
          break;
        case "WEBGL_compressed_texture_pvrtc":
          extension = this.gl.getExtension("WEBGL_compressed_texture_pvrtc") || this.gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");
          break;
        default:
          extension = this.gl.getExtension(name);
      }
      this.extensions[name] = extension;
      return extension;
    }
    has(name) {
      return this.getExtension(name) !== null;
    }
    init(capabilities) {
      if (capabilities.isWebGL2) {
        this.getExtension("EXT_color_buffer_float");
      } else {
        this.getExtension("WEBGL_depth_texture");
        this.getExtension("OES_texture_float");
        this.getExtension("OES_texture_half_float");
        this.getExtension("OES_texture_half_float_linear");
        this.getExtension("OES_standard_derivatives");
        this.getExtension("OES_element_index_uint");
        this.getExtension("OES_vertex_array_object");
        this.getExtension("ANGLE_instanced_arrays");
      }
      this.getExtension("OES_texture_float_linear");
      this.getExtension("EXT_color_buffer_half_float");
    }
    get(name) {
      const extension = this.getExtension(name);
      if (extension === null) {
        console.warn("THREE.WebGLRenderer: " + name + " extension not supported.");
      }
      return extension;
    }
  }
}, "renderers/webgl/WebGLExtensions.js", []);

//renderers/webgl/WebGLGeometries.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLGeometries:{enumerable:true, get:function() {
    return WebGLGeometries;
  }}});
  var module$core$BufferAttribute = $$require("core/BufferAttribute.js");
  var module$utils = $$require("utils.js");
  class WebGLGeometries {
    constructor(gl, attributes, info, bindingStates) {
      this.gl = gl;
      this.attributes = attributes;
      this.info = info;
      this.bindingStates = bindingStates;
      this.geometries = {};
      this.wireframeAttributes = new WeakMap;
    }
    onGeometryDispose(event) {
      const geometry = event.target;
      if (geometry.index !== null) {
        this.attributes.remove(geometry.index);
      }
      for (const name in geometry.attributes) {
        this.attributes.remove(geometry.attributes[name]);
      }
      geometry.removeEventListener("dispose", this.onGeometryDispose);
      delete this.geometries[geometry.id];
      const attribute = this.wireframeAttributes.get(geometry);
      if (attribute) {
        this.attributes.remove(attribute);
        this.wireframeAttributes["delete"](geometry);
      }
      this.bindingStates.releaseStatesOfGeometry(geometry);
      if (geometry.isInstancedBufferGeometry === true) {
        delete geometry._maxInstanceCount;
      }
      this.info.memory.geometries--;
    }
    get(object, geometry) {
      if (this.geometries[geometry.id] === true) {
        return geometry;
      }
      geometry.addEventListener("dispose", this.onGeometryDispose);
      this.geometries[geometry.id] = true;
      this.info.memory.geometries++;
      return geometry;
    }
    update(geometry) {
      const geometryAttributes = geometry.attributes;
      for (const name in geometryAttributes) {
        this.attributes.update(geometryAttributes[name], this.gl.ARRAY_BUFFER);
      }
      const morphAttributes = geometry.morphAttributes;
      for (const name in morphAttributes) {
        const array = morphAttributes[name];
        for (let i = 0, l = array.length; i < l; i++) {
          this.attributes.update(array[i], this.gl.ARRAY_BUFFER);
        }
      }
    }
    updateWireframeAttribute(geometry) {
      const indices = [];
      const geometryIndex = geometry.index;
      const geometryPosition = geometry.attributes.position;
      let version = 0;
      if (geometryIndex !== null) {
        const array = geometryIndex.array;
        version = geometryIndex.version;
        for (let i = 0, l = array.length; i < l; i += 3) {
          const a = array[i + 0];
          const b = array[i + 1];
          const c = array[i + 2];
          indices.push(a, b, b, c, c, a);
        }
      } else {
        const array = geometryPosition.array;
        version = geometryPosition.version;
        for (let i = 0, l = array.length / 3 - 1; i < l; i += 3) {
          const a = i + 0;
          const b = i + 1;
          const c = i + 2;
          indices.push(a, b, b, c, c, a);
        }
      }
      const attribute = new ((0,module$utils.arrayMax)(indices) > 65535 ? module$core$BufferAttribute.Uint32BufferAttribute : module$core$BufferAttribute.Uint16BufferAttribute)(indices, 1);
      attribute.version = version;
      const previousAttribute = this.wireframeAttributes.get(geometry);
      if (previousAttribute) {
        this.attributes.remove(previousAttribute);
      }
      this.wireframeAttributes.set(geometry, attribute);
    }
    getWireframeAttribute(geometry) {
      const currentAttribute = this.wireframeAttributes.get(geometry);
      if (currentAttribute) {
        const geometryIndex = geometry.index;
        if (geometryIndex !== null) {
          if (currentAttribute.version < geometryIndex.version) {
            this.updateWireframeAttribute(geometry);
          }
        }
      } else {
        this.updateWireframeAttribute(geometry);
      }
      return this.wireframeAttributes.get(geometry);
    }
  }
}, "renderers/webgl/WebGLGeometries.js", ["core/BufferAttribute.js", "utils.js"]);

//renderers/webgl/WebGLIndexedBufferRenderer.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLIndexedBufferRenderer:{enumerable:true, get:function() {
    return WebGLIndexedBufferRenderer;
  }}});
  class WebGLIndexedBufferRenderer {
    constructor(gl, extensions, info, capabilities) {
      this.gl = gl;
      this.extensions = extensions;
      this.info = info;
      this.capabilities = capabilities;
      this.isWebGL2 = capabilities.isWebGL2;
      this.mode = null;
      this.type = null;
      this.bytesPerElement = null;
    }
    setMode(value) {
      this.mode = value;
    }
    setIndex(value) {
      this.type = value.type;
      this.bytesPerElement = value.bytesPerElement;
    }
    render(start, count) {
      this.gl.drawElements(this.mode, count, this.type, start * this.bytesPerElement);
      this.info.update(count, this.mode, 1);
    }
    renderInstances(start, count, primcount) {
      if (primcount === 0) {
        return;
      }
      let extension, methodName;
      if (this.isWebGL2) {
        extension = this.gl;
        methodName = "drawElementsInstanced";
      } else {
        extension = this.extensions.get("ANGLE_instanced_arrays");
        methodName = "drawElementsInstancedANGLE";
        if (extension === null) {
          console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");
          return;
        }
      }
      extension[methodName](this.mode, count, this.type, start * this.bytesPerElement, primcount);
      this.info.update(count, this.mode, primcount);
    }
  }
}, "renderers/webgl/WebGLIndexedBufferRenderer.js", []);

//renderers/webgl/WebGLInfo.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLInfo:{enumerable:true, get:function() {
    return WebGLInfo;
  }}});
  class WebGLInfo {
    constructor(gl) {
      this.gl = gl;
      const memory = {geometries:0, textures:0};
      const render = {frame:0, calls:0, triangles:0, points:0, lines:0};
      this.memory = memory;
      this.render = render;
      this.programs = null;
      this.autoReset = true;
    }
    update(count, mode, instanceCount) {
      this.render.calls++;
      switch(mode) {
        case this.gl.TRIANGLES:
          this.render.triangles += instanceCount * (count / 3);
          break;
        case this.gl.LINES:
          this.render.lines += instanceCount * (count / 2);
          break;
        case this.gl.LINE_STRIP:
          this.render.lines += instanceCount * (count - 1);
          break;
        case this.gl.LINE_LOOP:
          this.render.lines += instanceCount * count;
          break;
        case this.gl.POINTS:
          this.render.points += instanceCount * count;
          break;
        default:
          console.error("THREE.WebGLInfo: Unknown draw mode:", mode);
          break;
      }
    }
    reset() {
      this.render.frame++;
      this.render.calls = 0;
      this.render.triangles = 0;
      this.render.points = 0;
      this.render.lines = 0;
    }
  }
}, "renderers/webgl/WebGLInfo.js", []);

//renderers/webgl/WebGLMorphtargets.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLMorphtargets:{enumerable:true, get:function() {
    return WebGLMorphtargets;
  }}});
  function numericalSort(a, b) {
    return a[0] - b[0];
  }
  function absNumericalSort(a, b) {
    return Math.abs(b[1]) - Math.abs(a[1]);
  }
  class WebGLMorphtargets {
    constructor(gl) {
      this.gl = gl;
      this.influencesList = {};
      this.morphInfluences = new Float32Array(8);
      this.workInfluences = [];
      for (let i = 0; i < 8; i++) {
        this.workInfluences[i] = [i, 0];
      }
    }
    update(object, geometry, material, program) {
      const objectInfluences = object.morphTargetInfluences;
      const length = objectInfluences === undefined ? 0 : objectInfluences.length;
      let influences = this.influencesList[geometry.id];
      if (influences === undefined) {
        influences = [];
        for (let i = 0; i < length; i++) {
          influences[i] = [i, 0];
        }
        this.influencesList[geometry.id] = influences;
      }
      for (let i = 0; i < length; i++) {
        const influence = influences[i];
        influence[0] = i;
        influence[1] = objectInfluences[i];
      }
      influences.sort(absNumericalSort);
      for (let i = 0; i < 8; i++) {
        if (i < length && influences[i][1]) {
          this.workInfluences[i][0] = influences[i][0];
          this.workInfluences[i][1] = influences[i][1];
        } else {
          this.workInfluences[i][0] = Number.MAX_SAFE_INTEGER;
          this.workInfluences[i][1] = 0;
        }
      }
      this.workInfluences.sort(numericalSort);
      const morphTargets = material.morphTargets && geometry.morphAttributes.position;
      const morphNormals = material.morphNormals && geometry.morphAttributes.normal;
      let morphInfluencesSum = 0;
      for (let i = 0; i < 8; i++) {
        const influence = this.workInfluences[i];
        const index = influence[0];
        const value = influence[1];
        if (index !== Number.MAX_SAFE_INTEGER && value) {
          if (morphTargets && geometry.getAttribute("morphTarget" + i) !== morphTargets[index]) {
            geometry.setAttribute("morphTarget" + i, morphTargets[index]);
          }
          if (morphNormals && geometry.getAttribute("morphNormal" + i) !== morphNormals[index]) {
            geometry.setAttribute("morphNormal" + i, morphNormals[index]);
          }
          this.morphInfluences[i] = value;
          morphInfluencesSum += value;
        } else {
          if (morphTargets && geometry.hasAttribute("morphTarget" + i) === true) {
            geometry.deleteAttribute("morphTarget" + i);
          }
          if (morphNormals && geometry.hasAttribute("morphNormal" + i) === true) {
            geometry.deleteAttribute("morphNormal" + i);
          }
          this.morphInfluences[i] = 0;
        }
      }
      const morphBaseInfluence = geometry.morphTargetsRelative ? 1 : 1 - morphInfluencesSum;
      program.getUniforms().setValue(this.gl, "morphTargetBaseInfluence", morphBaseInfluence);
      program.getUniforms().setValue(this.gl, "morphTargetInfluences", this.morphInfluences);
    }
  }
}, "renderers/webgl/WebGLMorphtargets.js", []);

//renderers/webgl/WebGLObjects.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLObjects:{enumerable:true, get:function() {
    return WebGLObjects;
  }}});
  class WebGLObjects {
    constructor(gl, geometries, attributes, info) {
      this.updateMap = new WeakMap;
      this.gl = gl;
      this.geometries = geometries;
      this.attributes = attributes;
      this.info = info;
    }
    update(object) {
      const frame = this.info.render.frame;
      const geometry = object.geometry;
      const buffergeometry = this.geometries.get(object, geometry);
      if (this.updateMap.get(buffergeometry) !== frame) {
        this.geometries.update(buffergeometry);
        this.updateMap.set(buffergeometry, frame);
      }
      if (object.isInstancedMesh) {
        if (object.hasEventListener("dispose", this.onInstancedMeshDispose) === false) {
          object.addEventListener("dispose", this.onInstancedMeshDispose);
        }
        this.attributes.update(object.instanceMatrix, this.gl.ARRAY_BUFFER);
        if (object.instanceColor !== null) {
          this.attributes.update(object.instanceColor, this.gl.ARRAY_BUFFER);
        }
      }
      return buffergeometry;
    }
    dispose() {
      this.updateMap = new WeakMap;
    }
    onInstancedMeshDispose(event) {
      const instancedMesh = event.target;
      instancedMesh.removeEventListener("dispose", this.onInstancedMeshDispose);
      this.attributes.remove(instancedMesh.instanceMatrix);
      if (instancedMesh.instanceColor !== null) {
        this.attributes.remove(instancedMesh.instanceColor);
      }
    }
  }
}, "renderers/webgl/WebGLObjects.js", []);

//textures/DataTexture2DArray.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {DataTexture2DArray:{enumerable:true, get:function() {
    return DataTexture2DArray;
  }}});
  var module$textures$Texture = $$require("textures/Texture.js");
  var module$constants = $$require("constants.js");
  class DataTexture2DArray extends module$textures$Texture.Texture {
    constructor(data = null, width = 1, height = 1, depth = 1) {
      super(null);
      this.image = {data, width, height, depth};
      this.magFilter = module$constants.NearestFilter;
      this.minFilter = module$constants.NearestFilter;
      this.wrapR = module$constants.ClampToEdgeWrapping;
      this.generateMipmaps = false;
      this.flipY = false;
      this.needsUpdate = true;
    }
  }
  DataTexture2DArray.prototype.isDataTexture2DArray = true;
}, "textures/DataTexture2DArray.js", ["textures/Texture.js", "constants.js"]);

//textures/DataTexture3D.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {DataTexture3D:{enumerable:true, get:function() {
    return DataTexture3D;
  }}});
  var module$textures$Texture = $$require("textures/Texture.js");
  var module$constants = $$require("constants.js");
  class DataTexture3D extends module$textures$Texture.Texture {
    constructor(data = null, width = 1, height = 1, depth = 1) {
      super(null);
      this.image = {data, width, height, depth};
      this.magFilter = module$constants.NearestFilter;
      this.minFilter = module$constants.NearestFilter;
      this.wrapR = module$constants.ClampToEdgeWrapping;
      this.generateMipmaps = false;
      this.flipY = false;
      this.needsUpdate = true;
    }
  }
  DataTexture3D.prototype.isDataTexture3D = true;
}, "textures/DataTexture3D.js", ["textures/Texture.js", "constants.js"]);

//renderers/webgl/WebGLTextures.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLTextures:{enumerable:true, get:function() {
    return WebGLTextures;
  }}});
  var module$constants = $$require("constants.js");
  var module$math$MathUtils = $$require("math/MathUtils.js");
  class WebGLTextures {
    constructor(_gl, extensions, state, properties, capabilities, utils, info) {
      this._gl = _gl;
      this.extensions = extensions;
      this.state = state;
      this.properties = properties;
      this.capabilities = capabilities;
      this.utils = utils;
      this.info = info;
      this.isWebGL2 = capabilities.isWebGL2;
      this.maxTextures = capabilities.maxTextures;
      this.maxCubemapSize = capabilities.maxCubemapSize;
      this.maxTextureSize = capabilities.maxTextureSize;
      this.maxSamples = capabilities.maxSamples;
      this._videoTextures = new WeakMap;
      this._canvas = undefined;
      this.useOffscreenCanvas = false;
      this.textureUnits = 0;
      try {
        this.useOffscreenCanvas = typeof OffscreenCanvas !== "undefined" && (new OffscreenCanvas(1, 1)).getContext("2d") !== null;
      } catch (err) {
      }
      this.wrappingToGL = {[module$constants.RepeatWrapping]:this._gl.REPEAT, [module$constants.ClampToEdgeWrapping]:this._gl.CLAMP_TO_EDGE, [module$constants.MirroredRepeatWrapping]:this._gl.MIRRORED_REPEAT};
      this.filterToGL = {[module$constants.NearestFilter]:this._gl.NEAREST, [module$constants.NearestMipmapNearestFilter]:this._gl.NEAREST_MIPMAP_NEAREST, [module$constants.NearestMipmapLinearFilter]:this._gl.NEAREST_MIPMAP_LINEAR, [module$constants.LinearFilter]:this._gl.LINEAR, [module$constants.LinearMipmapNearestFilter]:this._gl.LINEAR_MIPMAP_NEAREST, [module$constants.LinearMipmapLinearFilter]:this._gl.LINEAR_MIPMAP_LINEAR};
      this.warnedTexture2D = false;
      this.warnedTextureCube = false;
    }
    createCanvas(width, height) {
      return this.useOffscreenCanvas ? new OffscreenCanvas(width, height) : document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
    }
    resizeImage(image, needsPowerOfTwo, needsNewCanvas, maxSize) {
      let scale = 1;
      if (image.width > maxSize || image.height > maxSize) {
        scale = maxSize / Math.max(image.width, image.height);
      }
      if (scale < 1 || needsPowerOfTwo === true) {
        if (typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement || typeof HTMLCanvasElement !== "undefined" && image instanceof HTMLCanvasElement || typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
          const floor = needsPowerOfTwo ? module$math$MathUtils.MathUtils.floorPowerOfTwo : Math.floor;
          const width = floor(scale * image.width);
          const height = floor(scale * image.height);
          if (this._canvas === undefined) {
            this._canvas = this.createCanvas(width, height);
          }
          const canvas = needsNewCanvas ? this.createCanvas(width, height) : this._canvas;
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, width, height);
          console.warn("THREE.WebGLRenderer: Texture has been resized from (" + image.width + "x" + image.height + ") to (" + width + "x" + height + ").");
          return canvas;
        } else {
          if ("data" in image) {
            console.warn("THREE.WebGLRenderer: Image in DataTexture is too big (" + image.width + "x" + image.height + ").");
          }
          return image;
        }
      }
      return image;
    }
    isPowerOfTwo(image) {
      return module$math$MathUtils.MathUtils.isPowerOfTwo(image.width) && module$math$MathUtils.MathUtils.isPowerOfTwo(image.height);
    }
    textureNeedsPowerOfTwo(texture) {
      if (this.isWebGL2) {
        return false;
      }
      return texture.wrapS !== module$constants.ClampToEdgeWrapping || texture.wrapT !== module$constants.ClampToEdgeWrapping || texture.minFilter !== module$constants.NearestFilter && texture.minFilter !== module$constants.LinearFilter;
    }
    textureNeedsGenerateMipmaps(texture, supportsMips) {
      return texture.generateMipmaps && supportsMips && texture.minFilter !== module$constants.NearestFilter && texture.minFilter !== module$constants.LinearFilter;
    }
    generateMipmap(target, texture, width, height) {
      this._gl.generateMipmap(target);
      const textureProperties = this.properties.get(texture);
      textureProperties.__maxMipLevel = Math.log2(Math.max(width, height));
    }
    getInternalFormat(internalFormatName, glFormat, glType) {
      if (this.isWebGL2 === false) {
        return glFormat;
      }
      if (internalFormatName !== null) {
        if (this._gl[internalFormatName] !== undefined) {
          return this._gl[internalFormatName];
        }
        console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '" + internalFormatName + "'");
      }
      let internalFormat = glFormat;
      if (glFormat === this._gl.RED) {
        if (glType === this._gl.FLOAT) {
          internalFormat = this._gl.R32F;
        }
        if (glType === this._gl.HALF_FLOAT) {
          internalFormat = this._gl.R16F;
        }
        if (glType === this._gl.UNSIGNED_BYTE) {
          internalFormat = this._gl.R8;
        }
      }
      if (glFormat === this._gl.RGB) {
        if (glType === this._gl.FLOAT) {
          internalFormat = this._gl.RGB32F;
        }
        if (glType === this._gl.HALF_FLOAT) {
          internalFormat = this._gl.RGB16F;
        }
        if (glType === this._gl.UNSIGNED_BYTE) {
          internalFormat = this._gl.RGB8;
        }
      }
      if (glFormat === this._gl.RGBA) {
        if (glType === this._gl.FLOAT) {
          internalFormat = this._gl.RGBA32F;
        }
        if (glType === this._gl.HALF_FLOAT) {
          internalFormat = this._gl.RGBA16F;
        }
        if (glType === this._gl.UNSIGNED_BYTE) {
          internalFormat = this._gl.RGBA8;
        }
      }
      if (internalFormat === this._gl.R16F || internalFormat === this._gl.R32F || internalFormat === this._gl.RGBA16F || internalFormat === this._gl.RGBA32F) {
        this.extensions.get("EXT_color_buffer_float");
      }
      return internalFormat;
    }
    filterFallback(f) {
      if (f === module$constants.NearestFilter || f === module$constants.NearestMipmapNearestFilter || f === module$constants.NearestMipmapLinearFilter) {
        return this._gl.NEAREST;
      }
      return this._gl.LINEAR;
    }
    onTextureDispose(event) {
      const texture = event.target;
      texture.removeEventListener("dispose", this.onTextureDispose);
      this.deallocateTexture(texture);
      if (texture.isVideoTexture) {
        this._videoTextures["delete"](texture);
      }
      this.info.memory.textures--;
    }
    onRenderTargetDispose(event) {
      const renderTarget = event.target;
      renderTarget.removeEventListener("dispose", this.onRenderTargetDispose);
      this.deallocateRenderTarget(renderTarget);
      this.info.memory.textures--;
    }
    deallocateTexture(texture) {
      const textureProperties = this.properties.get(texture);
      if (textureProperties.__webglInit === undefined) {
        return;
      }
      this._gl.deleteTexture(textureProperties.__webglTexture);
      this.properties.remove(texture);
    }
    deallocateRenderTarget(renderTarget) {
      const texture = renderTarget.texture;
      const renderTargetProperties = this.properties.get(renderTarget);
      const textureProperties = this.properties.get(texture);
      if (!renderTarget) {
        return;
      }
      if (textureProperties.__webglTexture !== undefined) {
        this._gl.deleteTexture(textureProperties.__webglTexture);
      }
      if (renderTarget.depthTexture) {
        renderTarget.depthTexture.dispose();
      }
      if (renderTarget.isWebGLCubeRenderTarget) {
        for (let i = 0; i < 6; i++) {
          this._gl.deleteFramebuffer(renderTargetProperties.__webglFramebuffer[i]);
          if (renderTargetProperties.__webglDepthbuffer) {
            this._gl.deleteRenderbuffer(renderTargetProperties.__webglDepthbuffer[i]);
          }
        }
      } else {
        this._gl.deleteFramebuffer(renderTargetProperties.__webglFramebuffer);
        if (renderTargetProperties.__webglDepthbuffer) {
          this._gl.deleteRenderbuffer(renderTargetProperties.__webglDepthbuffer);
        }
        if (renderTargetProperties.__webglMultisampledFramebuffer) {
          this._gl.deleteFramebuffer(renderTargetProperties.__webglMultisampledFramebuffer);
        }
        if (renderTargetProperties.__webglColorRenderbuffer) {
          this._gl.deleteRenderbuffer(renderTargetProperties.__webglColorRenderbuffer);
        }
        if (renderTargetProperties.__webglDepthRenderbuffer) {
          this._gl.deleteRenderbuffer(renderTargetProperties.__webglDepthRenderbuffer);
        }
      }
      this.properties.remove(texture);
      this.properties.remove(renderTarget);
    }
    resetTextureUnits() {
      this.textureUnits = 0;
    }
    allocateTextureUnit() {
      const textureUnit = this.textureUnits;
      if (textureUnit >= this.maxTextures) {
        console.warn("THREE.WebGLTextures: Trying to use " + textureUnit + " texture units while this GPU supports only " + this.maxTextures);
      }
      this.textureUnits += 1;
      return textureUnit;
    }
    setTexture2D(texture, slot) {
      const textureProperties = this.properties.get(texture);
      if (texture.isVideoTexture) {
        this.updateVideoTexture(texture);
      }
      if (texture.version > 0 && textureProperties.__version !== texture.version) {
        const image = texture.image;
        if (image === undefined) {
          console.warn("THREE.WebGLRenderer: Texture marked for update but image is undefined");
        } else {
          if (image.complete === false) {
            console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");
          } else {
            this.uploadTexture(textureProperties, texture, slot);
            return;
          }
        }
      }
      this.state.activeTexture(this._gl.TEXTURE0 + slot);
      this.state.bindTexture(this._gl.TEXTURE_2D, textureProperties.__webglTexture);
    }
    setTexture2DArray(texture, slot) {
      const textureProperties = this.properties.get(texture);
      if (texture.version > 0 && textureProperties.__version !== texture.version) {
        this.uploadTexture(textureProperties, texture, slot);
        return;
      }
      this.state.activeTexture(this._gl.TEXTURE0 + slot);
      this.state.bindTexture(this._gl.TEXTURE_2D_ARRAY, textureProperties.__webglTexture);
    }
    setTexture3D(texture, slot) {
      const textureProperties = this.properties.get(texture);
      if (texture.version > 0 && textureProperties.__version !== texture.version) {
        this.uploadTexture(textureProperties, texture, slot);
        return;
      }
      this.state.activeTexture(this._gl.TEXTURE0 + slot);
      this.state.bindTexture(this._gl.TEXTURE_3D, textureProperties.__webglTexture);
    }
    setTextureCube(texture, slot) {
      const textureProperties = this.properties.get(texture);
      if (texture.version > 0 && textureProperties.__version !== texture.version) {
        this.uploadCubeTexture(textureProperties, texture, slot);
        return;
      }
      this.state.activeTexture(this._gl.TEXTURE0 + slot);
      this.state.bindTexture(this._gl.TEXTURE_CUBE_MAP, textureProperties.__webglTexture);
    }
    setTextureParameters(textureType, texture, supportsMips) {
      if (supportsMips) {
        this._gl.texParameteri(textureType, this._gl.TEXTURE_WRAP_S, this.wrappingToGL[texture.wrapS]);
        this._gl.texParameteri(textureType, this._gl.TEXTURE_WRAP_T, this.wrappingToGL[texture.wrapT]);
        if (textureType === this._gl.TEXTURE_3D || textureType === this._gl.TEXTURE_2D_ARRAY) {
          this._gl.texParameteri(textureType, this._gl.TEXTURE_WRAP_R, this.wrappingToGL[texture.wrapR]);
        }
        this._gl.texParameteri(textureType, this._gl.TEXTURE_MAG_FILTER, this.filterToGL[texture.magFilter]);
        this._gl.texParameteri(textureType, this._gl.TEXTURE_MIN_FILTER, this.filterToGL[texture.minFilter]);
      } else {
        this._gl.texParameteri(textureType, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(textureType, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
        if (textureType === this._gl.TEXTURE_3D || textureType === this._gl.TEXTURE_2D_ARRAY) {
          this._gl.texParameteri(textureType, this._gl.TEXTURE_WRAP_R, this._gl.CLAMP_TO_EDGE);
        }
        if (texture.wrapS !== module$constants.ClampToEdgeWrapping || texture.wrapT !== module$constants.ClampToEdgeWrapping) {
          console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping.");
        }
        this._gl.texParameteri(textureType, this._gl.TEXTURE_MAG_FILTER, this.filterFallback(texture.magFilter));
        this._gl.texParameteri(textureType, this._gl.TEXTURE_MIN_FILTER, this.filterFallback(texture.minFilter));
        if (texture.minFilter !== module$constants.NearestFilter && texture.minFilter !== module$constants.LinearFilter) {
          console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.");
        }
      }
      if (this.extensions.has("EXT_texture_filter_anisotropic") === true) {
        const extension = this.extensions.get("EXT_texture_filter_anisotropic");
        if (texture.type === module$constants.FloatType && this.extensions.has("OES_texture_float_linear") === false) {
          return;
        }
        if (this.isWebGL2 === false && (texture.type === module$constants.HalfFloatType && this.extensions.has("OES_texture_half_float_linear") === false)) {
          return;
        }
        if (texture.anisotropy > 1 || this.properties.get(texture).__currentAnisotropy) {
          this._gl.texParameterf(textureType, extension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(texture.anisotropy, this.capabilities.getMaxAnisotropy()));
          this.properties.get(texture).__currentAnisotropy = texture.anisotropy;
        }
      }
    }
    initTexture(textureProperties, texture) {
      if (textureProperties.__webglInit === undefined) {
        textureProperties.__webglInit = true;
        texture.addEventListener("dispose", this.onTextureDispose);
        textureProperties.__webglTexture = this._gl.createTexture();
        this.info.memory.textures++;
      }
    }
    uploadTexture(textureProperties, texture, slot) {
      let textureType = this._gl.TEXTURE_2D;
      if (texture.isDataTexture2DArray) {
        textureType = this._gl.TEXTURE_2D_ARRAY;
      }
      if (texture.isDataTexture3D) {
        textureType = this._gl.TEXTURE_3D;
      }
      this.initTexture(textureProperties, texture);
      this.state.activeTexture(this._gl.TEXTURE0 + slot);
      this.state.bindTexture(textureType, textureProperties.__webglTexture);
      this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, texture.flipY);
      this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha);
      this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, texture.unpackAlignment);
      this._gl.pixelStorei(this._gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this._gl.NONE);
      const needsPowerOfTwo = this.textureNeedsPowerOfTwo(texture) && this.isPowerOfTwo(texture.image) === false;
      const image = this.resizeImage(texture.image, needsPowerOfTwo, false, this.maxTextureSize);
      const supportsMips = this.isPowerOfTwo(image) || this.isWebGL2, glFormat = this.utils.convert(texture.format);
      let glType = this.utils.convert(texture.type), glInternalFormat = this.getInternalFormat(texture.internalFormat, glFormat, glType);
      this.setTextureParameters(textureType, texture, supportsMips);
      let mipmap;
      const mipmaps = texture.mipmaps;
      if (texture.isDepthTexture) {
        glInternalFormat = this._gl.DEPTH_COMPONENT;
        if (this.isWebGL2) {
          if (texture.type === module$constants.FloatType) {
            glInternalFormat = this._gl.DEPTH_COMPONENT32F;
          } else {
            if (texture.type === module$constants.UnsignedIntType) {
              glInternalFormat = this._gl.DEPTH_COMPONENT24;
            } else {
              if (texture.type === module$constants.UnsignedInt248Type) {
                glInternalFormat = this._gl.DEPTH24_STENCIL8;
              } else {
                glInternalFormat = this._gl.DEPTH_COMPONENT16;
              }
            }
          }
        } else {
          if (texture.type === module$constants.FloatType) {
            console.error("WebGLRenderer: Floating point depth texture requires WebGL2.");
          }
        }
        if (texture.format === module$constants.DepthFormat && glInternalFormat === this._gl.DEPTH_COMPONENT) {
          if (texture.type !== module$constants.UnsignedShortType && texture.type !== module$constants.UnsignedIntType) {
            console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture.");
            texture.type = module$constants.UnsignedShortType;
            glType = this.utils.convert(texture.type);
          }
        }
        if (texture.format === module$constants.DepthStencilFormat && glInternalFormat === this._gl.DEPTH_COMPONENT) {
          glInternalFormat = this._gl.DEPTH_STENCIL;
          if (texture.type !== module$constants.UnsignedInt248Type) {
            console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture.");
            texture.type = module$constants.UnsignedInt248Type;
            glType = this.utils.convert(texture.type);
          }
        }
        this.state.texImage2D(this._gl.TEXTURE_2D, 0, glInternalFormat, image.width, image.height, 0, glFormat, glType, null);
      } else {
        if (texture.isDataTexture) {
          if (mipmaps.length > 0 && supportsMips) {
            for (let i = 0, il = mipmaps.length; i < il; i++) {
              mipmap = mipmaps[i];
              this.state.texImage2D(this._gl.TEXTURE_2D, i, glInternalFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data);
            }
            texture.generateMipmaps = false;
            textureProperties.__maxMipLevel = mipmaps.length - 1;
          } else {
            this.state.texImage2D(this._gl.TEXTURE_2D, 0, glInternalFormat, image.width, image.height, 0, glFormat, glType, image.data);
            textureProperties.__maxMipLevel = 0;
          }
        } else {
          if (texture.isCompressedTexture) {
            for (let i = 0, il = mipmaps.length; i < il; i++) {
              mipmap = mipmaps[i];
              if (texture.format !== module$constants.RGBAFormat && texture.format !== module$constants.RGBFormat) {
                if (glFormat !== null) {
                  this.state.compressedTexImage2D(this._gl.TEXTURE_2D, i, glInternalFormat, mipmap.width, mipmap.height, 0, mipmap.data);
                } else {
                  console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");
                }
              } else {
                this.state.texImage2D(this._gl.TEXTURE_2D, i, glInternalFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data);
              }
            }
            textureProperties.__maxMipLevel = mipmaps.length - 1;
          } else {
            if (texture.isDataTexture2DArray) {
              this.state.texImage3D(this._gl.TEXTURE_2D_ARRAY, 0, glInternalFormat, image.width, image.height, image.depth, 0, glFormat, glType, image.data);
              textureProperties.__maxMipLevel = 0;
            } else {
              if (texture.isDataTexture3D) {
                this.state.texImage3D(this._gl.TEXTURE_3D, 0, glInternalFormat, image.width, image.height, image.depth, 0, glFormat, glType, image.data);
                textureProperties.__maxMipLevel = 0;
              } else {
                if (mipmaps.length > 0 && supportsMips) {
                  for (let i = 0, il = mipmaps.length; i < il; i++) {
                    mipmap = mipmaps[i];
                    this.state.texImage2D(this._gl.TEXTURE_2D, i, glInternalFormat, glFormat, glType, mipmap);
                  }
                  texture.generateMipmaps = false;
                  textureProperties.__maxMipLevel = mipmaps.length - 1;
                } else {
                  this.state.texImage2D(this._gl.TEXTURE_2D, 0, glInternalFormat, glFormat, glType, image);
                  textureProperties.__maxMipLevel = 0;
                }
              }
            }
          }
        }
      }
      if (this.textureNeedsGenerateMipmaps(texture, supportsMips)) {
        this.generateMipmap(textureType, texture, image.width, image.height);
      }
      textureProperties.__version = texture.version;
      if (texture.onUpdate) {
        texture.onUpdate(texture);
      }
    }
    uploadCubeTexture(textureProperties, texture, slot) {
      if (texture.image.length !== 6) {
        return;
      }
      this.initTexture(textureProperties, texture);
      this.state.activeTexture(this._gl.TEXTURE0 + slot);
      this.state.bindTexture(this._gl.TEXTURE_CUBE_MAP, textureProperties.__webglTexture);
      this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, texture.flipY);
      this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha);
      this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, texture.unpackAlignment);
      this._gl.pixelStorei(this._gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this._gl.NONE);
      const isCompressed = texture && (texture.isCompressedTexture || texture.image[0].isCompressedTexture);
      const isDataTexture = texture.image[0] && texture.image[0].isDataTexture;
      const cubeImage = [];
      for (let i = 0; i < 6; i++) {
        if (!isCompressed && !isDataTexture) {
          cubeImage[i] = this.resizeImage(texture.image[i], false, true, this.maxCubemapSize);
        } else {
          cubeImage[i] = isDataTexture ? texture.image[i].image : texture.image[i];
        }
      }
      const image = cubeImage[0], supportsMips = this.isPowerOfTwo(image) || this.isWebGL2, glFormat = this.utils.convert(texture.format), glType = this.utils.convert(texture.type), glInternalFormat = this.getInternalFormat(texture.internalFormat, glFormat, glType);
      this.setTextureParameters(this._gl.TEXTURE_CUBE_MAP, texture, supportsMips);
      let mipmaps;
      if (isCompressed) {
        for (let i = 0; i < 6; i++) {
          mipmaps = cubeImage[i].mipmaps;
          for (let j = 0; j < mipmaps.length; j++) {
            const mipmap = mipmaps[j];
            if (texture.format !== module$constants.RGBAFormat && texture.format !== module$constants.RGBFormat) {
              if (glFormat !== null) {
                this.state.compressedTexImage2D(this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j, glInternalFormat, mipmap.width, mipmap.height, 0, mipmap.data);
              } else {
                console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()");
              }
            } else {
              this.state.texImage2D(this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j, glInternalFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data);
            }
          }
        }
        textureProperties.__maxMipLevel = mipmaps.length - 1;
      } else {
        mipmaps = texture.mipmaps;
        for (let i = 0; i < 6; i++) {
          if (isDataTexture) {
            this.state.texImage2D(this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, glInternalFormat, cubeImage[i].width, cubeImage[i].height, 0, glFormat, glType, cubeImage[i].data);
            for (let j = 0; j < mipmaps.length; j++) {
              const mipmap = mipmaps[j];
              const mipmapImage = mipmap.image[i].image;
              this.state.texImage2D(this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j + 1, glInternalFormat, mipmapImage.width, mipmapImage.height, 0, glFormat, glType, mipmapImage.data);
            }
          } else {
            this.state.texImage2D(this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, glInternalFormat, glFormat, glType, cubeImage[i]);
            for (let j = 0; j < mipmaps.length; j++) {
              const mipmap = mipmaps[j];
              this.state.texImage2D(this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j + 1, glInternalFormat, glFormat, glType, mipmap.image[i]);
            }
          }
        }
        textureProperties.__maxMipLevel = mipmaps.length;
      }
      if (this.textureNeedsGenerateMipmaps(texture, supportsMips)) {
        this.generateMipmap(this._gl.TEXTURE_CUBE_MAP, texture, image.width, image.height);
      }
      textureProperties.__version = texture.version;
      if (texture.onUpdate) {
        texture.onUpdate(texture);
      }
    }
    setupFrameBufferTexture(framebuffer, renderTarget, attachment, textureTarget) {
      const texture = renderTarget.texture;
      const glFormat = this.utils.convert(texture.format);
      const glType = this.utils.convert(texture.type);
      const glInternalFormat = this.getInternalFormat(texture.internalFormat, glFormat, glType);
      if (textureTarget === this._gl.TEXTURE_3D || textureTarget === this._gl.TEXTURE_2D_ARRAY) {
        this.state.texImage3D(textureTarget, 0, glInternalFormat, renderTarget.width, renderTarget.height, renderTarget.depth, 0, glFormat, glType, null);
      } else {
        this.state.texImage2D(textureTarget, 0, glInternalFormat, renderTarget.width, renderTarget.height, 0, glFormat, glType, null);
      }
      this.state.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);
      this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, attachment, textureTarget, this.properties.get(texture).__webglTexture, 0);
      this.state.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }
    setupRenderBufferStorage(renderbuffer, renderTarget, isMultisample) {
      this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, renderbuffer);
      if (renderTarget.depthBuffer && !renderTarget.stencilBuffer) {
        let glInternalFormat = this._gl.DEPTH_COMPONENT16;
        if (isMultisample) {
          const depthTexture = renderTarget.depthTexture;
          if (depthTexture && depthTexture.isDepthTexture) {
            if (depthTexture.type === module$constants.FloatType) {
              glInternalFormat = this._gl.DEPTH_COMPONENT32F;
            } else {
              if (depthTexture.type === module$constants.UnsignedIntType) {
                glInternalFormat = this._gl.DEPTH_COMPONENT24;
              }
            }
          }
          const samples = this.getRenderTargetSamples(renderTarget);
          this._gl.renderbufferStorageMultisample(this._gl.RENDERBUFFER, samples, glInternalFormat, renderTarget.width, renderTarget.height);
        } else {
          this._gl.renderbufferStorage(this._gl.RENDERBUFFER, glInternalFormat, renderTarget.width, renderTarget.height);
        }
        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, renderbuffer);
      } else {
        if (renderTarget.depthBuffer && renderTarget.stencilBuffer) {
          if (isMultisample) {
            const samples = this.getRenderTargetSamples(renderTarget);
            this._gl.renderbufferStorageMultisample(this._gl.RENDERBUFFER, samples, this._gl.DEPTH24_STENCIL8, renderTarget.width, renderTarget.height);
          } else {
            this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_STENCIL, renderTarget.width, renderTarget.height);
          }
          this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_STENCIL_ATTACHMENT, this._gl.RENDERBUFFER, renderbuffer);
        } else {
          const texture = renderTarget.texture;
          const glFormat = this.utils.convert(texture.format);
          const glType = this.utils.convert(texture.type);
          const glInternalFormat = this.getInternalFormat(texture.internalFormat, glFormat, glType);
          if (isMultisample) {
            const samples = this.getRenderTargetSamples(renderTarget);
            this._gl.renderbufferStorageMultisample(this._gl.RENDERBUFFER, samples, glInternalFormat, renderTarget.width, renderTarget.height);
          } else {
            this._gl.renderbufferStorage(this._gl.RENDERBUFFER, glInternalFormat, renderTarget.width, renderTarget.height);
          }
        }
      }
      this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, null);
    }
    setupDepthTexture(framebuffer, renderTarget) {
      const isCube = renderTarget && renderTarget.isWebGLCubeRenderTarget;
      if (isCube) {
        throw new Error("Depth Texture with cube render targets is not supported");
      }
      this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);
      if (!(renderTarget.depthTexture && renderTarget.depthTexture.isDepthTexture)) {
        throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");
      }
      if (!this.properties.get(renderTarget.depthTexture).__webglTexture || renderTarget.depthTexture.image.width !== renderTarget.width || renderTarget.depthTexture.image.height !== renderTarget.height) {
        renderTarget.depthTexture.image.width = renderTarget.width;
        renderTarget.depthTexture.image.height = renderTarget.height;
        renderTarget.depthTexture.needsUpdate = true;
      }
      this.setTexture2D(renderTarget.depthTexture, 0);
      const webglDepthTexture = this.properties.get(renderTarget.depthTexture).__webglTexture;
      if (renderTarget.depthTexture.format === module$constants.DepthFormat) {
        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.TEXTURE_2D, webglDepthTexture, 0);
      } else {
        if (renderTarget.depthTexture.format === module$constants.DepthStencilFormat) {
          this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.DEPTH_STENCIL_ATTACHMENT, this._gl.TEXTURE_2D, webglDepthTexture, 0);
        } else {
          throw new Error("Unknown depthTexture format");
        }
      }
    }
    setupDepthRenderbuffer(renderTarget) {
      const renderTargetProperties = this.properties.get(renderTarget);
      const isCube = renderTarget.isWebGLCubeRenderTarget === true;
      if (renderTarget.depthTexture) {
        if (isCube) {
          throw new Error("target.depthTexture not supported in Cube render targets");
        }
        this.setupDepthTexture(renderTargetProperties.__webglFramebuffer, renderTarget);
      } else {
        if (isCube) {
          renderTargetProperties.__webglDepthbuffer = [];
          for (let i = 0; i < 6; i++) {
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, renderTargetProperties.__webglFramebuffer[i]);
            renderTargetProperties.__webglDepthbuffer[i] = this._gl.createRenderbuffer();
            this.setupRenderBufferStorage(renderTargetProperties.__webglDepthbuffer[i], renderTarget, false);
          }
        } else {
          this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, renderTargetProperties.__webglFramebuffer);
          renderTargetProperties.__webglDepthbuffer = this._gl.createRenderbuffer();
          this.setupRenderBufferStorage(renderTargetProperties.__webglDepthbuffer, renderTarget, false);
        }
      }
      this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }
    setupRenderTarget(renderTarget) {
      const texture = renderTarget.texture;
      const renderTargetProperties = this.properties.get(renderTarget);
      const textureProperties = this.properties.get(texture);
      renderTarget.addEventListener("dispose", this.onRenderTargetDispose);
      textureProperties.__webglTexture = this._gl.createTexture();
      this.info.memory.textures++;
      const isCube = renderTarget.isWebGLCubeRenderTarget === true;
      const isMultisample = renderTarget.isWebGLMultisampleRenderTarget === true;
      const isRenderTarget3D = texture.isDataTexture3D || texture.isDataTexture2DArray;
      const supportsMips = this.isPowerOfTwo(renderTarget) || this.isWebGL2;
      if (this.isWebGL2 && texture.format === module$constants.RGBFormat && (texture.type === module$constants.FloatType || texture.type === module$constants.HalfFloatType)) {
        texture.format = module$constants.RGBAFormat;
        console.warn("THREE.WebGLRenderer: Rendering to textures with RGB format is not supported. Using RGBA format instead.");
      }
      if (isCube) {
        renderTargetProperties.__webglFramebuffer = [];
        for (let i = 0; i < 6; i++) {
          renderTargetProperties.__webglFramebuffer[i] = this._gl.createFramebuffer();
        }
      } else {
        renderTargetProperties.__webglFramebuffer = this._gl.createFramebuffer();
        if (isMultisample) {
          if (this.isWebGL2) {
            renderTargetProperties.__webglMultisampledFramebuffer = this._gl.createFramebuffer();
            renderTargetProperties.__webglColorRenderbuffer = this._gl.createRenderbuffer();
            this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, renderTargetProperties.__webglColorRenderbuffer);
            const glFormat = this.utils.convert(texture.format);
            const glType = this.utils.convert(texture.type);
            const glInternalFormat = this.getInternalFormat(texture.internalFormat, glFormat, glType);
            const samples = this.getRenderTargetSamples(renderTarget);
            this._gl.renderbufferStorageMultisample(this._gl.RENDERBUFFER, samples, glInternalFormat, renderTarget.width, renderTarget.height);
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, renderTargetProperties.__webglMultisampledFramebuffer);
            this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.RENDERBUFFER, renderTargetProperties.__webglColorRenderbuffer);
            this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, null);
            if (renderTarget.depthBuffer) {
              renderTargetProperties.__webglDepthRenderbuffer = this._gl.createRenderbuffer();
              this.setupRenderBufferStorage(renderTargetProperties.__webglDepthRenderbuffer, renderTarget, true);
            }
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
          } else {
            console.warn("THREE.WebGLRenderer: WebGLMultisampleRenderTarget can only be used with WebGL2.");
          }
        }
      }
      if (isCube) {
        this.state.bindTexture(this._gl.TEXTURE_CUBE_MAP, textureProperties.__webglTexture);
        this.setTextureParameters(this._gl.TEXTURE_CUBE_MAP, texture, supportsMips);
        for (let i = 0; i < 6; i++) {
          this.setupFrameBufferTexture(renderTargetProperties.__webglFramebuffer[i], renderTarget, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i);
        }
        if (this.textureNeedsGenerateMipmaps(texture, supportsMips)) {
          this.generateMipmap(this._gl.TEXTURE_CUBE_MAP, texture, renderTarget.width, renderTarget.height);
        }
        this.state.bindTexture(this._gl.TEXTURE_CUBE_MAP, null);
      } else {
        let glTextureType = this._gl.TEXTURE_2D;
        if (isRenderTarget3D) {
          if (this.isWebGL2) {
            const isTexture3D = texture.isDataTexture3D;
            glTextureType = isTexture3D ? this._gl.TEXTURE_3D : this._gl.TEXTURE_2D_ARRAY;
          } else {
            console.warn("THREE.DataTexture3D and THREE.DataTexture2DArray only supported with WebGL2.");
          }
        }
        this.state.bindTexture(glTextureType, textureProperties.__webglTexture);
        this.setTextureParameters(glTextureType, texture, supportsMips);
        this.setupFrameBufferTexture(renderTargetProperties.__webglFramebuffer, renderTarget, this._gl.COLOR_ATTACHMENT0, glTextureType);
        if (this.textureNeedsGenerateMipmaps(texture, supportsMips)) {
          this.generateMipmap(this._gl.TEXTURE_2D, texture, renderTarget.width, renderTarget.height);
        }
        this.state.bindTexture(this._gl.TEXTURE_2D, null);
      }
      if (renderTarget.depthBuffer) {
        this.setupDepthRenderbuffer(renderTarget);
      }
    }
    updateRenderTargetMipmap(renderTarget) {
      const texture = renderTarget.texture;
      const supportsMips = this.isPowerOfTwo(renderTarget) || this.isWebGL2;
      if (this.textureNeedsGenerateMipmaps(texture, supportsMips)) {
        const target = renderTarget.isWebGLCubeRenderTarget ? this._gl.TEXTURE_CUBE_MAP : this._gl.TEXTURE_2D;
        const webglTexture = this.properties.get(texture).__webglTexture;
        this.state.bindTexture(target, webglTexture);
        this.generateMipmap(target, texture, renderTarget.width, renderTarget.height);
        this.state.bindTexture(target, null);
      }
    }
    updateMultisampleRenderTarget(renderTarget) {
      if (renderTarget.isWebGLMultisampleRenderTarget) {
        if (this.isWebGL2) {
          const renderTargetProperties = this.properties.get(renderTarget);
          this._gl.bindFramebuffer(this._gl.READ_FRAMEBUFFER, renderTargetProperties.__webglMultisampledFramebuffer);
          this._gl.bindFramebuffer(this._gl.DRAW_FRAMEBUFFER, renderTargetProperties.__webglFramebuffer);
          const width = renderTarget.width;
          const height = renderTarget.height;
          let mask = this._gl.COLOR_BUFFER_BIT;
          if (renderTarget.depthBuffer) {
            mask |= this._gl.DEPTH_BUFFER_BIT;
          }
          if (renderTarget.stencilBuffer) {
            mask |= this._gl.STENCIL_BUFFER_BIT;
          }
          this._gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, mask, this._gl.NEAREST);
          this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, renderTargetProperties.__webglMultisampledFramebuffer);
        } else {
          console.warn("THREE.WebGLRenderer: WebGLMultisampleRenderTarget can only be used with WebGL2.");
        }
      }
    }
    getRenderTargetSamples(renderTarget) {
      return this.isWebGL2 && renderTarget.isWebGLMultisampleRenderTarget ? Math.min(this.maxSamples, renderTarget.samples) : 0;
    }
    updateVideoTexture(texture) {
      const frame = this.info.render.frame;
      if (this._videoTextures.get(texture) !== frame) {
        this._videoTextures.set(texture, frame);
        texture.update();
      }
    }
    safeSetTexture2D(texture, slot) {
      if (texture && texture.isWebGLRenderTarget) {
        if (this.warnedTexture2D === false) {
          console.warn("THREE.WebGLTextures.safeSetTexture2D: don't use render targets as textures. Use their .texture property instead.");
          this.warnedTexture2D = true;
        }
        texture = texture.texture;
      }
      this.setTexture2D(texture, slot);
    }
    safeSetTextureCube(texture, slot) {
      if (texture && texture.isWebGLCubeRenderTarget) {
        if (this.warnedTextureCube === false) {
          console.warn("THREE.WebGLTextures.safeSetTextureCube: don't use cube render targets as textures. Use their .texture property instead.");
          this.warnedTextureCube = true;
        }
        texture = texture.texture;
      }
      this.setTextureCube(texture, slot);
    }
  }
}, "renderers/webgl/WebGLTextures.js", ["constants.js", "math/MathUtils.js"]);

//renderers/webgl/WebGLUniforms.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLUniforms:{enumerable:true, get:function() {
    return WebGLUniforms;
  }}});
  var module$textures$CubeTexture = $$require("textures/CubeTexture.js");
  var module$textures$Texture = $$require("textures/Texture.js");
  var module$textures$DataTexture2DArray = $$require("textures/DataTexture2DArray.js");
  var module$textures$DataTexture3D = $$require("textures/DataTexture3D.js");
  var module$renderers$webgl$WebGLTextures = $$require("renderers/webgl/WebGLTextures.js");
  const emptyTexture = new module$textures$Texture.Texture;
  const emptyTexture2dArray = new module$textures$DataTexture2DArray.DataTexture2DArray;
  const emptyTexture3d = new module$textures$DataTexture3D.DataTexture3D;
  const emptyCubeTexture = new module$textures$CubeTexture.CubeTexture;
  const arrayCacheF32 = [];
  const arrayCacheI32 = [];
  const mat4array = new Float32Array(16);
  const mat3array = new Float32Array(9);
  const mat2array = new Float32Array(4);
  function flatten(array, nBlocks, blockSize) {
    const firstElem = array[0];
    if (firstElem <= 0 || firstElem > 0) {
      return array;
    }
    const n = nBlocks * blockSize;
    let r = arrayCacheF32[n];
    if (r === undefined) {
      r = new Float32Array(n);
      arrayCacheF32[n] = r;
    }
    if (nBlocks !== 0) {
      firstElem.toArray(r, 0);
      for (let i = 1, offset = 0; i !== nBlocks; ++i) {
        offset += blockSize;
        array[i].toArray(r, offset);
      }
    }
    return r;
  }
  function arraysEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0, l = a.length; i < l; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  function copyArray(a, b) {
    for (let i = 0, l = b.length; i < l; i++) {
      a[i] = b[i];
    }
  }
  function allocTexUnits(textures, n) {
    let r = arrayCacheI32[n];
    if (r === undefined) {
      r = new Int32Array(n);
      arrayCacheI32[n] = r;
    }
    for (let i = 0; i !== n; ++i) {
      r[i] = textures.allocateTextureUnit();
    }
    return r;
  }
  class UniformParent {
    constructor(id, activeInfo, addr) {
      this.id = id;
      this.addr = addr;
      this.cache = [];
      this.size = activeInfo.size;
      this.activeInfo = activeInfo;
    }
    setValueV1f(gl, v) {
      const cache = this.cache;
      if (cache[0] === v) {
        return;
      }
      gl.uniform1f(this.addr, v);
      cache[0] = v;
    }
    setValueV2f(gl, v) {
      const cache = this.cache;
      if (v.x !== undefined) {
        console.log("WebGlUniforms setValueV2f ");
        if (cache[0] !== v.x || cache[1] !== v.y) {
          gl.uniform2f(this.addr, v.x, v.y);
          cache[0] = v.x;
          cache[1] = v.y;
        }
      } else {
        if (arraysEqual(cache, v)) {
          return;
        }
        gl.uniform2fv(this.addr, v);
        copyArray(cache, v);
      }
    }
    setValueV3f(gl, v) {
      console.log("WebGlUniforms pre " + JSON.stringify(v));
      const cache = this.cache;
      if (v.x !== undefined) {
        console.log("WebGlUniforms setValueV3f ");
        if (cache[0] !== v.x || cache[1] !== v.y || cache[2] !== v.z) {
          gl.uniform3f(this.addr, v.x, v.y, v.z);
          cache[0] = v.x;
          cache[1] = v.y;
          cache[2] = v.z;
        }
      } else {
        if (v.r !== undefined) {
          console.log("WebGlUniforms setValueV3f 1");
          if (cache[0] !== v.r || cache[1] !== v.g || cache[2] !== v.b) {
            gl.uniform3f(this.addr, v.r, v.g, v.b);
            cache[0] = v.r;
            cache[1] = v.g;
            cache[2] = v.b;
          }
        } else {
          if (arraysEqual(cache, v)) {
            return;
          }
          gl.uniform3fv(this.addr, v);
          copyArray(cache, v);
        }
      }
    }
    setValueV4f(gl, v) {
      const cache = this.cache;
      if (v.x !== undefined) {
        console.log("WebGlUniforms setValueV4f 1");
        if (cache[0] !== v.x || cache[1] !== v.y || cache[2] !== v.z || cache[3] !== v.w) {
          gl.uniform4f(this.addr, v.x, v.y, v.z, v.w);
          cache[0] = v.x;
          cache[1] = v.y;
          cache[2] = v.z;
          cache[3] = v.w;
        }
      } else {
        if (arraysEqual(cache, v)) {
          return;
        }
        gl.uniform4fv(this.addr, v);
        copyArray(cache, v);
      }
    }
    setValueM2(gl, v) {
      const cache = this.cache;
      const elements = v.elements;
      if (elements === undefined) {
        if (arraysEqual(cache, v)) {
          return;
        }
        gl.uniformMatrix2fv(this.addr, false, v);
        copyArray(cache, v);
      } else {
        if (arraysEqual(cache, elements)) {
          return;
        }
        mat2array.set(elements);
        gl.uniformMatrix2fv(this.addr, false, mat2array);
        copyArray(cache, elements);
      }
    }
    setValueM3(gl, v) {
      const cache = this.cache;
      const elements = v.elements;
      if (elements === undefined) {
        if (arraysEqual(cache, v)) {
          return;
        }
        gl.uniformMatrix3fv(this.addr, false, v);
        copyArray(cache, v);
      } else {
        if (arraysEqual(cache, elements)) {
          return;
        }
        mat3array.set(elements);
        gl.uniformMatrix3fv(this.addr, false, mat3array);
        copyArray(cache, elements);
      }
    }
    setValueM4(gl, v) {
      const cache = this.cache;
      const elements = v.elements;
      if (elements === undefined) {
        if (arraysEqual(cache, v)) {
          return;
        }
        gl.uniformMatrix4fv(this.addr, false, v);
        copyArray(cache, v);
      } else {
        if (arraysEqual(cache, elements)) {
          return;
        }
        mat4array.set(elements);
        gl.uniformMatrix4fv(this.addr, false, mat4array);
        copyArray(cache, elements);
      }
    }
    setValueT1(gl, v, textures) {
      const cache = this.cache;
      const unit = textures.allocateTextureUnit();
      if (cache[0] !== unit) {
        gl.uniform1i(this.addr, unit);
        cache[0] = unit;
      }
      textures.safeSetTexture2D(v || emptyTexture, unit);
    }
    setValueT2DArray1(gl, v, textures) {
      const cache = this.cache;
      const unit = textures.allocateTextureUnit();
      if (cache[0] !== unit) {
        gl.uniform1i(this.addr, unit);
        cache[0] = unit;
      }
      textures.setTexture2DArray(v || emptyTexture2dArray, unit);
    }
    setValueT3D1(gl, v, textures) {
      const cache = this.cache;
      const unit = textures.allocateTextureUnit();
      if (cache[0] !== unit) {
        gl.uniform1i(this.addr, unit);
        cache[0] = unit;
      }
      textures.setTexture3D(v || emptyTexture3d, unit);
    }
    setValueT6(gl, v, textures) {
      const cache = this.cache;
      const unit = textures.allocateTextureUnit();
      if (cache[0] !== unit) {
        gl.uniform1i(this.addr, unit);
        cache[0] = unit;
      }
      textures.safeSetTextureCube(v || emptyCubeTexture, unit);
    }
    setValueV1i(gl, v) {
      const cache = this.cache;
      if (cache[0] === v) {
        return;
      }
      gl.uniform1i(this.addr, v);
      cache[0] = v;
    }
    setValueV2i(gl, v) {
      const cache = this.cache;
      if (arraysEqual(cache, v)) {
        return;
      }
      gl.uniform2iv(this.addr, v);
      copyArray(cache, v);
    }
    setValueV3i(gl, v) {
      const cache = this.cache;
      if (arraysEqual(cache, v)) {
        return;
      }
      gl.uniform3iv(this.addr, v);
      copyArray(cache, v);
    }
    setValueV4i(gl, v) {
      const cache = this.cache;
      if (arraysEqual(cache, v)) {
        return;
      }
      gl.uniform4iv(this.addr, v);
      copyArray(cache, v);
    }
    setValueV1ui(gl, v) {
      const cache = this.cache;
      if (cache[0] === v) {
        return;
      }
      gl.uniform1ui(this.addr, v);
      cache[0] = v;
    }
    getSingularSetter(type) {
      console.log("                   getSingularSetter " + type);
      switch(type) {
        case 5126:
          {
            console.log(1);
            break;
          }
        case 35664:
          {
            console.log(2);
            break;
          }
        case 35665:
          {
            console.log(3);
            break;
          }
        case 35666:
          {
            console.log(4);
            break;
          }
        case 35674:
          {
            console.log(5);
            break;
          }
        case 35675:
          {
            console.log(6);
            break;
          }
        case 35676:
          {
            console.log(7);
            break;
          }
        case 5124:
        case 35670:
          {
            console.log(8);
            break;
          }
        case 35667:
        case 35671:
          {
            console.log(9);
            break;
          }
        case 35668:
        case 35672:
          {
            console.log(10);
            break;
          }
        case 35669:
        case 35673:
          {
            console.log(11);
            break;
          }
        case 5125:
          {
            console.log(1);
            break;
          }
        case 35678:
        case 36198:
        case 36298:
        case 36306:
        case 35682:
          {
            console.log(11);
            break;
          }
        case 35679:
        case 36299:
        case 36307:
          {
            console.log(11);
            break;
          }
        case 35680:
        case 36300:
        case 36308:
        case 36293:
          {
            console.log(12);
            break;
          }
        case 36289:
        case 36303:
        case 36311:
        case 36292:
          {
            console.log(13);
            break;
          }
      }
      switch(type) {
        case 5126:
          return this.setValueV1f;
        case 35664:
          return this.setValueV2f;
        case 35665:
          return this.setValueV3f;
        case 35666:
          return this.setValueV4f;
        case 35674:
          return this.setValueM2;
        case 35675:
          return this.setValueM3;
        case 35676:
          return this.setValueM4;
        case 5124:
        case 35670:
          return this.setValueV1i;
        case 35667:
        case 35671:
          return this.setValueV2i;
        case 35668:
        case 35672:
          return this.setValueV3i;
        case 35669:
        case 35673:
          return this.setValueV4i;
        case 5125:
          return this.setValueV1ui;
        case 35678:
        case 36198:
        case 36298:
        case 36306:
        case 35682:
          return this.setValueT1;
        case 35679:
        case 36299:
        case 36307:
          return this.setValueT3D1;
        case 35680:
        case 36300:
        case 36308:
        case 36293:
          return this.setValueT6;
        case 36289:
        case 36303:
        case 36311:
        case 36292:
          return this.setValueT2DArray1;
      }
    }
    setValueV1fArray(gl, v) {
      gl.uniform1fv(this.addr, v);
    }
    setValueV1iArray(gl, v) {
      gl.uniform1iv(this.addr, v);
    }
    setValueV2iArray(gl, v) {
      gl.uniform2iv(this.addr, v);
    }
    setValueV3iArray(gl, v) {
      gl.uniform3iv(this.addr, v);
    }
    setValueV4iArray(gl, v) {
      gl.uniform4iv(this.addr, v);
    }
    setValueV2fArray(gl, v) {
      const data = flatten(v, this.size, 2);
      gl.uniform2fv(this.addr, data);
    }
    setValueV3fArray(gl, v) {
      const data = flatten(v, this.size, 3);
      gl.uniform3fv(this.addr, data);
    }
    setValueV4fArray(gl, v) {
      const data = flatten(v, this.size, 4);
      gl.uniform4fv(this.addr, data);
    }
    setValueM2Array(gl, v) {
      const data = flatten(v, this.size, 4);
      gl.uniformMatrix2fv(this.addr, false, data);
    }
    setValueM3Array(gl, v) {
      const data = flatten(v, this.size, 9);
      gl.uniformMatrix3fv(this.addr, false, data);
    }
    setValueM4Array(gl, v) {
      const data = flatten(v, this.size, 16);
      gl.uniformMatrix4fv(this.addr, false, data);
    }
    setValueT1Array(gl, v, textures) {
      const n = v.length;
      const units = allocTexUnits(textures, n);
      gl.uniform1iv(this.addr, units);
      for (let i = 0; i !== n; ++i) {
        textures.safeSetTexture2D(v[i] || emptyTexture, units[i]);
      }
    }
    setValueT6Array(gl, v, textures) {
      const n = v.length;
      const units = allocTexUnits(textures, n);
      gl.uniform1iv(this.addr, units);
      for (let i = 0; i !== n; ++i) {
        textures.safeSetTextureCube(v[i] || emptyCubeTexture, units[i]);
      }
    }
    getPureArraySetter(type) {
      console.log("WebGlUniforms getPureArraySetter " + JSON.stringify(type));
      switch(type) {
        case 5126:
          return this.setValueV1fArray;
        case 35664:
          return this.setValueV2fArray;
        case 35665:
          return this.setValueV3fArray;
        case 35666:
          return this.setValueV4fArray;
        case 35674:
          return this.setValueM2Array;
        case 35675:
          return this.setValueM3Array;
        case 35676:
          return this.setValueM4Array;
        case 5124:
        case 35670:
          return this.setValueV1iArray;
        case 35667:
        case 35671:
          return this.setValueV2iArray;
        case 35668:
        case 35672:
          return this.setValueV3iArray;
        case 35669:
        case 35673:
          return this.setValueV4iArray;
        case 35678:
        case 36198:
        case 36298:
        case 36306:
        case 35682:
          return this.setValueT1Array;
        case 35680:
        case 36300:
        case 36308:
        case 36293:
          return this.setValueT6Array;
      }
    }
  }
  class SingleUniform extends UniformParent {
    constructor(id, activeInfo, addr) {
      super(id, activeInfo, addr);
      console.log("SingleUniform activeInfo " + JSON.stringify(activeInfo));
      this.id = id;
      this.addr = addr;
      this.cache = [];
      this.setValue = this.getSingularSetter(activeInfo.type);
      console.log("SingleUniform after setValue " + this.setValue);
    }
  }
  class PureArrayUniform extends UniformParent {
    constructor(id, activeInfo, addr) {
      super(id, activeInfo, addr);
      this.id = id;
      this.addr = addr;
      this.cache = [];
      this.size = activeInfo.size;
      this.setValue = this.getPureArraySetter(activeInfo.type);
    }
    updateCache(data) {
      const cache = this.cache;
      if (data instanceof Float32Array && cache.length !== data.length) {
        this.cache = new Float32Array(data.length);
      }
      copyArray(cache, data);
    }
  }
  class StructuredUniform {
    constructor(id) {
      this.id = id;
      this.seq = [];
      this.map = {};
    }
    setValue(gl, value, textures) {
      const seq = this.seq;
      for (let i = 0, n = seq.length; i !== n; ++i) {
        const u = seq[i];
        u.setValue(gl, value[u.id], textures);
      }
    }
  }
  const RePathPart = /(\w+)(\])?(\[|\.)?/g;
  function addUniform(container, uniformObject) {
    container.seq.push(uniformObject);
    container.map[uniformObject.id] = uniformObject;
  }
  function parseUniform(activeInfo, addr, container) {
    const path = activeInfo.name, pathLength = path.length;
    RePathPart.lastIndex = 0;
    while (true) {
      const match = RePathPart.exec(path), matchEnd = RePathPart.lastIndex;
      let id = match[1];
      const idIsIndex = match[2] === "]", subscript = match[3];
      if (idIsIndex) {
        id = id | 0;
      }
      if (subscript === undefined || subscript === "[" && matchEnd + 2 === pathLength) {
        addUniform(container, subscript === undefined ? new SingleUniform(id, activeInfo, addr) : new PureArrayUniform(id, activeInfo, addr));
        break;
      } else {
        const map = container.map;
        let next = map[id];
        if (next === undefined) {
          next = new StructuredUniform(id);
          addUniform(container, next);
        }
        container = next;
      }
    }
  }
  class WebGLUniforms {
    constructor(gl, program) {
      this.seq = [];
      this.map = {};
      const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; ++i) {
        const info = gl.getActiveUniform(program, i), addr = gl.getUniformLocation(program, info.name);
        parseUniform(info, addr, this);
      }
    }
    setValue(gl, name, value, textures) {
      const u = this.map[name];
      console.log("WebGlUniforms setValue  1 " + (u !== undefined));
      if (u !== undefined) {
        u.setValue(gl, value, textures);
      }
    }
    setOptional(gl, object, name) {
      const v = object[name];
      console.log("WebGlUniforms setValue  2 ");
      if (v !== undefined) {
        this.setValue(gl, name, v);
      }
    }
  }
  WebGLUniforms.upload = function(gl, seq, values, textures) {
    console.log("WebGLUniforms.upload " + JSON.stringify(seq));
    for (let i = 0, n = seq.length; i !== n; ++i) {
      const u = seq[i], v = values[u.id];
      console.log("WebGLUniforms.upload needsUpdate ?" + (v.needsUpdate !== false));
      if (v.needsUpdate !== false) {
        console.log("U " + u + " -\x3e " + JSON.stringify(u) + " -\x3e " + JSON.stringify(v));
        u.setValue(gl, v.value, textures);
      }
    }
  };
  WebGLUniforms.seqWithValue = function(seq, values) {
    const r = [];
    for (let i = 0, n = seq.length; i !== n; ++i) {
      const u = seq[i];
      console.log("?? " + JSON.stringify(values));
      if (u.id in values) {
        console.log("EE " + u.id);
        r.push(u);
      }
    }
    return r;
  };
}, "renderers/webgl/WebGLUniforms.js", ["textures/CubeTexture.js", "textures/Texture.js", "textures/DataTexture2DArray.js", "textures/DataTexture3D.js", "renderers/webgl/WebGLTextures.js"]);

//renderers/webgl/WebGLShader.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLShader:{enumerable:true, get:function() {
    return WebGLShader;
  }}});
  function WebGLShader(gl, type, string) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, string);
    gl.compileShader(shader);
    return shader;
  }
}, "renderers/webgl/WebGLShader.js", []);

//renderers/webgl/WebGLProgram.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLProgram:{enumerable:true, get:function() {
    return WebGLProgram;
  }}});
  var module$renderers$webgl$WebGLUniforms = $$require("renderers/webgl/WebGLUniforms.js");
  var module$renderers$webgl$WebGLShader = $$require("renderers/webgl/WebGLShader.js");
  var module$renderers$shaders$ShaderChunk = $$require("renderers/shaders/ShaderChunk.js");
  var module$constants = $$require("constants.js");
  let programIdCount = 0;
  function addLineNumbers(string) {
    const lines = string.split("\n");
    for (let i = 0; i < lines.length; i++) {
      lines[i] = i + 1 + ": " + lines[i];
    }
    return lines.join("\n");
  }
  function getEncodingComponents(encoding) {
    switch(encoding) {
      case module$constants.LinearEncoding:
        return ["Linear", "( value )"];
      case module$constants.sRGBEncoding:
        return ["sRGB", "( value )"];
      case module$constants.RGBEEncoding:
        return ["RGBE", "( value )"];
      case module$constants.RGBM7Encoding:
        return ["RGBM", "( value, 7.0 )"];
      case module$constants.RGBM16Encoding:
        return ["RGBM", "( value, 16.0 )"];
      case module$constants.RGBDEncoding:
        return ["RGBD", "( value, 256.0 )"];
      case module$constants.GammaEncoding:
        return ["Gamma", "( value, float( GAMMA_FACTOR ) )"];
      case module$constants.LogLuvEncoding:
        return ["LogLuv", "( value )"];
      default:
        console.warn("THREE.WebGLProgram: Unsupported encoding:", encoding);
        return ["Linear", "( value )"];
    }
  }
  function getShaderErrors(gl, shader, type) {
    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    const log = gl.getShaderInfoLog(shader).trim();
    if (status && log === "") {
      return "";
    }
    const source = gl.getShaderSource(shader);
    return "THREE.WebGLShader: gl.getShaderInfoLog() " + type + "\n" + log + addLineNumbers(source);
  }
  function getTexelDecodingFunction(functionName, encoding) {
    const components = getEncodingComponents(encoding);
    return "vec4 " + functionName + "( vec4 value ) { return " + components[0] + "ToLinear" + components[1] + "; }";
  }
  function getTexelEncodingFunction(functionName, encoding) {
    const components = getEncodingComponents(encoding);
    return "vec4 " + functionName + "( vec4 value ) { return LinearTo" + components[0] + components[1] + "; }";
  }
  function getToneMappingFunction(functionName, toneMapping) {
    let toneMappingName;
    switch(toneMapping) {
      case module$constants.LinearToneMapping:
        toneMappingName = "Linear";
        break;
      case module$constants.ReinhardToneMapping:
        toneMappingName = "Reinhard";
        break;
      case module$constants.CineonToneMapping:
        toneMappingName = "OptimizedCineon";
        break;
      case module$constants.ACESFilmicToneMapping:
        toneMappingName = "ACESFilmic";
        break;
      case module$constants.CustomToneMapping:
        toneMappingName = "Custom";
        break;
      default:
        console.warn("THREE.WebGLProgram: Unsupported toneMapping:", toneMapping);
        toneMappingName = "Linear";
    }
    return "vec3 " + functionName + "( vec3 color ) { return " + toneMappingName + "ToneMapping( color ); }";
  }
  function generateExtensions(parameters) {
    const chunks = [parameters.extensionDerivatives || parameters.envMapCubeUV || parameters.bumpMap || parameters.tangentSpaceNormalMap || parameters.clearcoatNormalMap || parameters.flatShading || parameters.shaderID === "physical" ? "#extension GL_OES_standard_derivatives : enable" : "", (parameters.extensionFragDepth || parameters.logarithmicDepthBuffer) && parameters.rendererExtensionFragDepth ? "#extension GL_EXT_frag_depth : enable" : "", parameters.extensionDrawBuffers && parameters.rendererExtensionDrawBuffers ? 
    "#extension GL_EXT_draw_buffers : require" : "", (parameters.extensionShaderTextureLOD || parameters.envMap) && parameters.rendererExtensionShaderTextureLod ? "#extension GL_EXT_shader_texture_lod : enable" : ""];
    return chunks.filter(filterEmptyLine).join("\n");
  }
  function generateDefines(defines) {
    const chunks = [];
    for (const name in defines) {
      const value = defines[name];
      if (value === false) {
        continue;
      }
      chunks.push("#define " + name + " " + value);
    }
    return chunks.join("\n");
  }
  function fetchAttributeLocations(gl, program) {
    const attributes = {};
    const n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveAttrib(program, i);
      const name = info.name;
      attributes[name] = gl.getAttribLocation(program, name);
    }
    return attributes;
  }
  function filterEmptyLine(string) {
    return string !== "";
  }
  function replaceLightNums(string, parameters) {
    return string.replace(/NUM_DIR_LIGHTS/g, parameters.numDirLights).replace(/NUM_SPOT_LIGHTS/g, parameters.numSpotLights).replace(/NUM_RECT_AREA_LIGHTS/g, parameters.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g, parameters.numPointLights).replace(/NUM_HEMI_LIGHTS/g, parameters.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g, parameters.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS/g, parameters.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g, parameters.numPointLightShadows);
  }
  function replaceClippingPlaneNums(string, parameters) {
    return string.replace(/NUM_CLIPPING_PLANES/g, parameters.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g, parameters.numClippingPlanes - parameters.numClipIntersection);
  }
  const includePattern = /^[ \t]*#include +<([\w\d./]+)>/gm;
  function resolveIncludes(string) {
    return string.replace(includePattern, includeReplacer);
  }
  function includeReplacer(match, include) {
    const string = module$renderers$shaders$ShaderChunk.ShaderChunk[include];
    if (string === undefined) {
      throw new Error("Can not resolve #include \x3c" + include + "\x3e");
    }
    return resolveIncludes(string);
  }
  const deprecatedUnrollLoopPattern = /#pragma unroll_loop[\s]+?for \( int i = (\d+); i < (\d+); i \+\+ \) \{([\s\S]+?)(?=\})\}/g;
  const unrollLoopPattern = /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;
  function unrollLoops(string) {
    return string.replace(unrollLoopPattern, loopReplacer).replace(deprecatedUnrollLoopPattern, deprecatedLoopReplacer);
  }
  function deprecatedLoopReplacer(match, start, end, snippet) {
    console.warn("WebGLProgram: #pragma unroll_loop shader syntax is deprecated. Please use #pragma unroll_loop_start syntax instead.");
    return loopReplacer(match, start, end, snippet);
  }
  function loopReplacer(match, start, end, snippet) {
    let string = "";
    for (let i = parseInt(start); i < parseInt(end); i++) {
      string += snippet.replace(/\[\s*i\s*\]/g, "[ " + i + " ]").replace(/UNROLLED_LOOP_INDEX/g, i);
    }
    return string;
  }
  function generatePrecision(parameters) {
    let precisionstring = "precision " + parameters.precision + " float;\nprecision " + parameters.precision + " int;";
    if (parameters.precision === "highp") {
      precisionstring += "\n#define HIGH_PRECISION";
    } else {
      if (parameters.precision === "mediump") {
        precisionstring += "\n#define MEDIUM_PRECISION";
      } else {
        if (parameters.precision === "lowp") {
          precisionstring += "\n#define LOW_PRECISION";
        }
      }
    }
    return precisionstring;
  }
  function generateShadowMapTypeDefine(parameters) {
    let shadowMapTypeDefine = "SHADOWMAP_TYPE_BASIC";
    if (parameters.shadowMapType === module$constants.PCFShadowMap) {
      shadowMapTypeDefine = "SHADOWMAP_TYPE_PCF";
    } else {
      if (parameters.shadowMapType === module$constants.PCFSoftShadowMap) {
        shadowMapTypeDefine = "SHADOWMAP_TYPE_PCF_SOFT";
      } else {
        if (parameters.shadowMapType === module$constants.VSMShadowMap) {
          shadowMapTypeDefine = "SHADOWMAP_TYPE_VSM";
        }
      }
    }
    return shadowMapTypeDefine;
  }
  function generateEnvMapTypeDefine(parameters) {
    let envMapTypeDefine = "ENVMAP_TYPE_CUBE";
    if (parameters.envMap) {
      switch(parameters.envMapMode) {
        case module$constants.CubeReflectionMapping:
        case module$constants.CubeRefractionMapping:
          envMapTypeDefine = "ENVMAP_TYPE_CUBE";
          break;
        case module$constants.CubeUVReflectionMapping:
        case module$constants.CubeUVRefractionMapping:
          envMapTypeDefine = "ENVMAP_TYPE_CUBE_UV";
          break;
      }
    }
    return envMapTypeDefine;
  }
  function generateEnvMapModeDefine(parameters) {
    let envMapModeDefine = "ENVMAP_MODE_REFLECTION";
    if (parameters.envMap) {
      switch(parameters.envMapMode) {
        case module$constants.CubeRefractionMapping:
        case module$constants.CubeUVRefractionMapping:
          envMapModeDefine = "ENVMAP_MODE_REFRACTION";
          break;
      }
    }
    return envMapModeDefine;
  }
  function generateEnvMapBlendingDefine(parameters) {
    let envMapBlendingDefine = "ENVMAP_BLENDING_NONE";
    if (parameters.envMap) {
      switch(parameters.combine) {
        case module$constants.MultiplyOperation:
          envMapBlendingDefine = "ENVMAP_BLENDING_MULTIPLY";
          break;
        case module$constants.MixOperation:
          envMapBlendingDefine = "ENVMAP_BLENDING_MIX";
          break;
        case module$constants.AddOperation:
          envMapBlendingDefine = "ENVMAP_BLENDING_ADD";
          break;
      }
    }
    return envMapBlendingDefine;
  }
  class WebGLProgram {
    constructor(renderer, cacheKey, parameters, bindingStates) {
      this.renderer = renderer;
      this.cacheKey = cacheKey;
      this.parameters = parameters;
      this.bindingStates = bindingStates;
      this.gl = renderer.getContext();
      const defines = parameters.defines;
      let vertexShader = parameters.vertexShader;
      let fragmentShader = parameters.fragmentShader;
      const shadowMapTypeDefine = generateShadowMapTypeDefine(parameters);
      const envMapTypeDefine = generateEnvMapTypeDefine(parameters);
      const envMapModeDefine = generateEnvMapModeDefine(parameters);
      const envMapBlendingDefine = generateEnvMapBlendingDefine(parameters);
      const gammaFactorDefine = renderer.gammaFactor > 0 ? renderer.gammaFactor : 1.0;
      const customExtensions = parameters.isWebGL2 ? "" : generateExtensions(parameters);
      const customDefines = generateDefines(defines);
      const program = this.gl.createProgram();
      let prefixVertex, prefixFragment;
      let versionString = parameters.glslVersion ? "#version " + parameters.glslVersion + "\n" : "";
      if (parameters.isRawShaderMaterial) {
        prefixVertex = [customDefines].filter(filterEmptyLine).join("\n");
        if (prefixVertex.length > 0) {
          prefixVertex += "\n";
        }
        prefixFragment = [customExtensions, customDefines].filter(filterEmptyLine).join("\n");
        if (prefixFragment.length > 0) {
          prefixFragment += "\n";
        }
      } else {
        prefixVertex = [generatePrecision(parameters), "#define SHADER_NAME " + parameters.shaderName, customDefines, parameters.instancing ? "#define USE_INSTANCING" : "", parameters.instancingColor ? "#define USE_INSTANCING_COLOR" : "", parameters.supportsVertexTextures ? "#define VERTEX_TEXTURES" : "", "#define GAMMA_FACTOR " + gammaFactorDefine, "#define MAX_BONES " + parameters.maxBones, parameters.useFog && parameters.fog ? "#define USE_FOG" : "", parameters.useFog && parameters.fogExp2 ? "#define FOG_EXP2" : 
        "", parameters.map ? "#define USE_MAP" : "", parameters.envMap ? "#define USE_ENVMAP" : "", parameters.envMap ? "#define " + envMapModeDefine : "", parameters.lightMap ? "#define USE_LIGHTMAP" : "", parameters.aoMap ? "#define USE_AOMAP" : "", parameters.emissiveMap ? "#define USE_EMISSIVEMAP" : "", parameters.bumpMap ? "#define USE_BUMPMAP" : "", parameters.normalMap ? "#define USE_NORMALMAP" : "", parameters.normalMap && parameters.objectSpaceNormalMap ? "#define OBJECTSPACE_NORMALMAP" : 
        "", parameters.normalMap && parameters.tangentSpaceNormalMap ? "#define TANGENTSPACE_NORMALMAP" : "", parameters.clearcoatMap ? "#define USE_CLEARCOATMAP" : "", parameters.clearcoatRoughnessMap ? "#define USE_CLEARCOAT_ROUGHNESSMAP" : "", parameters.clearcoatNormalMap ? "#define USE_CLEARCOAT_NORMALMAP" : "", parameters.displacementMap && parameters.supportsVertexTextures ? "#define USE_DISPLACEMENTMAP" : "", parameters.specularMap ? "#define USE_SPECULARMAP" : "", parameters.roughnessMap ? 
        "#define USE_ROUGHNESSMAP" : "", parameters.metalnessMap ? "#define USE_METALNESSMAP" : "", parameters.alphaMap ? "#define USE_ALPHAMAP" : "", parameters.transmissionMap ? "#define USE_TRANSMISSIONMAP" : "", parameters.vertexTangents ? "#define USE_TANGENT" : "", parameters.vertexColors ? "#define USE_COLOR" : "", parameters.vertexUvs ? "#define USE_UV" : "", parameters.uvsVertexOnly ? "#define UVS_VERTEX_ONLY" : "", parameters.flatShading ? "#define FLAT_SHADED" : "", parameters.skinning ? 
        "#define USE_SKINNING" : "", parameters.useVertexTexture ? "#define BONE_TEXTURE" : "", parameters.morphTargets ? "#define USE_MORPHTARGETS" : "", parameters.morphNormals && parameters.flatShading === false ? "#define USE_MORPHNORMALS" : "", parameters.doubleSided ? "#define DOUBLE_SIDED" : "", parameters.flipSided ? "#define FLIP_SIDED" : "", parameters.shadowMapEnabled ? "#define USE_SHADOWMAP" : "", parameters.shadowMapEnabled ? "#define " + shadowMapTypeDefine : "", parameters.sizeAttenuation ? 
        "#define USE_SIZEATTENUATION" : "", parameters.logarithmicDepthBuffer ? "#define USE_LOGDEPTHBUF" : "", parameters.logarithmicDepthBuffer && parameters.rendererExtensionFragDepth ? "#define USE_LOGDEPTHBUF_EXT" : "", "uniform mat4 modelMatrix;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "uniform mat4 viewMatrix;", "uniform mat3 normalMatrix;", "uniform vec3 cameraPosition;", "uniform bool isOrthographic;", "#ifdef USE_INSTANCING", "\tattribute mat4 instanceMatrix;", 
        "#endif", "#ifdef USE_INSTANCING_COLOR", "\tattribute vec3 instanceColor;", "#endif", "attribute vec3 position;", "attribute vec3 normal;", "attribute vec2 uv;", "#ifdef USE_TANGENT", "\tattribute vec4 tangent;", "#endif", "#ifdef USE_COLOR", "\tattribute vec3 color;", "#endif", "#ifdef USE_MORPHTARGETS", "\tattribute vec3 morphTarget0;", "\tattribute vec3 morphTarget1;", "\tattribute vec3 morphTarget2;", "\tattribute vec3 morphTarget3;", "\t#ifdef USE_MORPHNORMALS", "\t\tattribute vec3 morphNormal0;", 
        "\t\tattribute vec3 morphNormal1;", "\t\tattribute vec3 morphNormal2;", "\t\tattribute vec3 morphNormal3;", "\t#else", "\t\tattribute vec3 morphTarget4;", "\t\tattribute vec3 morphTarget5;", "\t\tattribute vec3 morphTarget6;", "\t\tattribute vec3 morphTarget7;", "\t#endif", "#endif", "#ifdef USE_SKINNING", "\tattribute vec4 skinIndex;", "\tattribute vec4 skinWeight;", "#endif", "\n"].filter(filterEmptyLine).join("\n");
        prefixFragment = [customExtensions, generatePrecision(parameters), "#define SHADER_NAME " + parameters.shaderName, customDefines, parameters.alphaTest ? "#define ALPHATEST " + parameters.alphaTest + (parameters.alphaTest % 1 ? "" : ".0") : "", "#define GAMMA_FACTOR " + gammaFactorDefine, parameters.useFog && parameters.fog ? "#define USE_FOG" : "", parameters.useFog && parameters.fogExp2 ? "#define FOG_EXP2" : "", parameters.map ? "#define USE_MAP" : "", parameters.matcap ? "#define USE_MATCAP" : 
        "", parameters.envMap ? "#define USE_ENVMAP" : "", parameters.envMap ? "#define " + envMapTypeDefine : "", parameters.envMap ? "#define " + envMapModeDefine : "", parameters.envMap ? "#define " + envMapBlendingDefine : "", parameters.lightMap ? "#define USE_LIGHTMAP" : "", parameters.aoMap ? "#define USE_AOMAP" : "", parameters.emissiveMap ? "#define USE_EMISSIVEMAP" : "", parameters.bumpMap ? "#define USE_BUMPMAP" : "", parameters.normalMap ? "#define USE_NORMALMAP" : "", parameters.normalMap && 
        parameters.objectSpaceNormalMap ? "#define OBJECTSPACE_NORMALMAP" : "", parameters.normalMap && parameters.tangentSpaceNormalMap ? "#define TANGENTSPACE_NORMALMAP" : "", parameters.clearcoatMap ? "#define USE_CLEARCOATMAP" : "", parameters.clearcoatRoughnessMap ? "#define USE_CLEARCOAT_ROUGHNESSMAP" : "", parameters.clearcoatNormalMap ? "#define USE_CLEARCOAT_NORMALMAP" : "", parameters.specularMap ? "#define USE_SPECULARMAP" : "", parameters.roughnessMap ? "#define USE_ROUGHNESSMAP" : "", 
        parameters.metalnessMap ? "#define USE_METALNESSMAP" : "", parameters.alphaMap ? "#define USE_ALPHAMAP" : "", parameters.sheen ? "#define USE_SHEEN" : "", parameters.transmissionMap ? "#define USE_TRANSMISSIONMAP" : "", parameters.vertexTangents ? "#define USE_TANGENT" : "", parameters.vertexColors || parameters.instancingColor ? "#define USE_COLOR" : "", parameters.vertexUvs ? "#define USE_UV" : "", parameters.uvsVertexOnly ? "#define UVS_VERTEX_ONLY" : "", parameters.gradientMap ? "#define USE_GRADIENTMAP" : 
        "", parameters.flatShading ? "#define FLAT_SHADED" : "", parameters.doubleSided ? "#define DOUBLE_SIDED" : "", parameters.flipSided ? "#define FLIP_SIDED" : "", parameters.shadowMapEnabled ? "#define USE_SHADOWMAP" : "", parameters.shadowMapEnabled ? "#define " + shadowMapTypeDefine : "", parameters.premultipliedAlpha ? "#define PREMULTIPLIED_ALPHA" : "", parameters.physicallyCorrectLights ? "#define PHYSICALLY_CORRECT_LIGHTS" : "", parameters.logarithmicDepthBuffer ? "#define USE_LOGDEPTHBUF" : 
        "", parameters.logarithmicDepthBuffer && parameters.rendererExtensionFragDepth ? "#define USE_LOGDEPTHBUF_EXT" : "", (parameters.extensionShaderTextureLOD || parameters.envMap) && parameters.rendererExtensionShaderTextureLod ? "#define TEXTURE_LOD_EXT" : "", "uniform mat4 viewMatrix;", "uniform vec3 cameraPosition;", "uniform bool isOrthographic;", parameters.toneMapping !== module$constants.NoToneMapping ? "#define TONE_MAPPING" : "", parameters.toneMapping !== module$constants.NoToneMapping ? 
        module$renderers$shaders$ShaderChunk.ShaderChunk["tonemapping_pars_fragment"] : "", parameters.toneMapping !== module$constants.NoToneMapping ? getToneMappingFunction("toneMapping", parameters.toneMapping) : "", parameters.dithering ? "#define DITHERING" : "", module$renderers$shaders$ShaderChunk.ShaderChunk["encodings_pars_fragment"], parameters.map ? getTexelDecodingFunction("mapTexelToLinear", parameters.mapEncoding) : "", parameters.matcap ? getTexelDecodingFunction("matcapTexelToLinear", 
        parameters.matcapEncoding) : "", parameters.envMap ? getTexelDecodingFunction("envMapTexelToLinear", parameters.envMapEncoding) : "", parameters.emissiveMap ? getTexelDecodingFunction("emissiveMapTexelToLinear", parameters.emissiveMapEncoding) : "", parameters.lightMap ? getTexelDecodingFunction("lightMapTexelToLinear", parameters.lightMapEncoding) : "", getTexelEncodingFunction("linearToOutputTexel", parameters.outputEncoding), parameters.depthPacking ? "#define DEPTH_PACKING " + parameters.depthPacking : 
        "", "\n"].filter(filterEmptyLine).join("\n");
      }
      vertexShader = resolveIncludes(vertexShader);
      vertexShader = replaceLightNums(vertexShader, parameters);
      vertexShader = replaceClippingPlaneNums(vertexShader, parameters);
      fragmentShader = resolveIncludes(fragmentShader);
      fragmentShader = replaceLightNums(fragmentShader, parameters);
      fragmentShader = replaceClippingPlaneNums(fragmentShader, parameters);
      vertexShader = unrollLoops(vertexShader);
      fragmentShader = unrollLoops(fragmentShader);
      if (parameters.isWebGL2 && parameters.isRawShaderMaterial !== true) {
        versionString = "#version 300 es\n";
        prefixVertex = ["#define attribute in", "#define varying out", "#define texture2D texture"].join("\n") + "\n" + prefixVertex;
        prefixFragment = ["#define varying in", parameters.glslVersion === module$constants.GLSL3 ? "" : "out highp vec4 pc_fragColor;", parameters.glslVersion === module$constants.GLSL3 ? "" : "#define gl_FragColor pc_fragColor", "#define gl_FragDepthEXT gl_FragDepth", "#define texture2D texture", "#define textureCube texture", "#define texture2DProj textureProj", "#define texture2DLodEXT textureLod", "#define texture2DProjLodEXT textureProjLod", "#define textureCubeLodEXT textureLod", "#define texture2DGradEXT textureGrad", 
        "#define texture2DProjGradEXT textureProjGrad", "#define textureCubeGradEXT textureGrad"].join("\n") + "\n" + prefixFragment;
      }
      const vertexGlsl = versionString + prefixVertex + vertexShader;
      const fragmentGlsl = versionString + prefixFragment + fragmentShader;
      const glVertexShader = (0,module$renderers$webgl$WebGLShader.WebGLShader)(this.gl, this.gl.VERTEX_SHADER, vertexGlsl);
      const glFragmentShader = (0,module$renderers$webgl$WebGLShader.WebGLShader)(this.gl, this.gl.FRAGMENT_SHADER, fragmentGlsl);
      this.gl.attachShader(program, glVertexShader);
      this.gl.attachShader(program, glFragmentShader);
      if (parameters.index0AttributeName !== undefined) {
        this.gl.bindAttribLocation(program, 0, parameters.index0AttributeName);
      } else {
        if (parameters.morphTargets === true) {
          this.gl.bindAttribLocation(program, 0, "position");
        }
      }
      this.gl.linkProgram(program);
      if (renderer.debug.checkShaderErrors) {
        const programLog = this.gl.getProgramInfoLog(program).trim();
        const vertexLog = this.gl.getShaderInfoLog(glVertexShader).trim();
        const fragmentLog = this.gl.getShaderInfoLog(glFragmentShader).trim();
        let runnable = true;
        let haveDiagnostics = true;
        if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS) === false) {
          runnable = false;
          const vertexErrors = getShaderErrors(this.gl, glVertexShader, "vertex");
          const fragmentErrors = getShaderErrors(this.gl, glFragmentShader, "fragment");
          console.error("THREE.WebGLProgram: shader error: ", this.gl.getError(), "gl.VALIDATE_STATUS", this.gl.getProgramParameter(program, this.gl.VALIDATE_STATUS), "gl.getProgramInfoLog", programLog, vertexErrors, fragmentErrors);
        } else {
          if (programLog !== "") {
            console.warn("THREE.WebGLProgram: gl.getProgramInfoLog()", programLog);
          } else {
            if (vertexLog === "" || fragmentLog === "") {
              haveDiagnostics = false;
            }
          }
        }
        if (haveDiagnostics) {
          this.diagnostics = {runnable:runnable, programLog:programLog, vertexShader:{log:vertexLog, prefix:prefixVertex}, fragmentShader:{log:fragmentLog, prefix:prefixFragment}};
        }
      }
      this.gl.deleteShader(glVertexShader);
      this.gl.deleteShader(glFragmentShader);
      this.cachedUniforms = undefined;
      this.cachedAttributes = undefined;
      this.name = parameters.shaderName;
      this.id = programIdCount++;
      this.cacheKey = cacheKey;
      this.usedTimes = 1;
      this.program = program;
      this.vertexShader = glVertexShader;
      this.fragmentShader = glFragmentShader;
    }
    getUniforms() {
      if (this.cachedUniforms === undefined) {
        this.cachedUniforms = new module$renderers$webgl$WebGLUniforms.WebGLUniforms(this.gl, this.program);
      }
      return this.cachedUniforms;
    }
    getAttributes() {
      if (this.cachedAttributes === undefined) {
        this.cachedAttributes = fetchAttributeLocations(this.gl, this.program);
      }
      return this.cachedAttributes;
    }
    destroy() {
      this.bindingStates.releaseStatesOfProgram(this);
      this.gl.deleteProgram(this.program);
      this.program = undefined;
    }
  }
}, "renderers/webgl/WebGLProgram.js", ["renderers/webgl/WebGLUniforms.js", "renderers/webgl/WebGLShader.js", "renderers/shaders/ShaderChunk.js", "constants.js"]);

//renderers/webgl/WebGLPrograms.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLPrograms:{enumerable:true, get:function() {
    return WebGLPrograms;
  }}});
  var module$constants = $$require("constants.js");
  var module$renderers$webgl$WebGLProgram = $$require("renderers/webgl/WebGLProgram.js");
  var module$renderers$shaders$ShaderLib = $$require("renderers/shaders/ShaderLib.js");
  var module$renderers$shaders$UniformsUtils = $$require("renderers/shaders/UniformsUtils.js");
  class WebGLPrograms {
    constructor(renderer, cubemaps, extensions, capabilities, bindingStates, clipping) {
      this.renderer = renderer;
      this.cubemaps = cubemaps;
      this.extensions = extensions;
      this.capabilities = capabilities;
      this.bindingStates = bindingStates;
      this.clipping = clipping;
      this.programs = [];
      this.isWebGL2 = capabilities.isWebGL2;
      this.logarithmicDepthBuffer = capabilities.logarithmicDepthBuffer;
      this.floatVertexTextures = capabilities.floatVertexTextures;
      this.maxVertexUniforms = capabilities.maxVertexUniforms;
      this.vertexTextures = capabilities.vertexTextures;
      this.precision = capabilities.precision;
      this.shaderIDs = {"MeshDepthMaterial":"depth", "MeshDistanceMaterial":"distanceRGBA", "MeshNormalMaterial":"normal", "MeshBasicMaterial":"basic", "MeshLambertMaterial":"lambert", "MeshPhongMaterial":"phong", "MeshToonMaterial":"toon", "MeshStandardMaterial":"physical", "MeshPhysicalMaterial":"physical", "MeshMatcapMaterial":"matcap", "LineBasicMaterial":"basic", "LineDashedMaterial":"dashed", "PointsMaterial":"points", "ShadowMaterial":"shadow", "SpriteMaterial":"sprite"};
      this.parameterNames = ["precision", "isWebGL2", "supportsVertexTextures", "outputEncoding", "instancing", "instancingColor", "map", "mapEncoding", "matcap", "matcapEncoding", "envMap", "envMapMode", "envMapEncoding", "envMapCubeUV", "lightMap", "lightMapEncoding", "aoMap", "emissiveMap", "emissiveMapEncoding", "bumpMap", "normalMap", "objectSpaceNormalMap", "tangentSpaceNormalMap", "clearcoatMap", "clearcoatRoughnessMap", "clearcoatNormalMap", "displacementMap", "specularMap", "roughnessMap", 
      "metalnessMap", "gradientMap", "alphaMap", "combine", "vertexColors", "vertexTangents", "vertexUvs", "uvsVertexOnly", "fog", "useFog", "fogExp2", "flatShading", "sizeAttenuation", "logarithmicDepthBuffer", "skinning", "maxBones", "useVertexTexture", "morphTargets", "morphNormals", "maxMorphTargets", "maxMorphNormals", "premultipliedAlpha", "numDirLights", "numPointLights", "numSpotLights", "numHemiLights", "numRectAreaLights", "numDirLightShadows", "numPointLightShadows", "numSpotLightShadows", 
      "shadowMapEnabled", "shadowMapType", "toneMapping", "physicallyCorrectLights", "alphaTest", "doubleSided", "flipSided", "numClippingPlanes", "numClipIntersection", "depthPacking", "dithering", "sheen", "transmissionMap"];
    }
    getMaxBones(object) {
      const skeleton = object.skeleton;
      const bones = skeleton.bones;
      if (this.floatVertexTextures) {
        return 1024;
      } else {
        const nVertexUniforms = this.maxVertexUniforms;
        const nVertexMatrices = Math.floor((nVertexUniforms - 20) / 4);
        const maxBones = Math.min(nVertexMatrices, bones.length);
        if (maxBones < bones.length) {
          console.warn("THREE.WebGLRenderer: Skeleton has " + bones.length + " bones. This GPU supports " + maxBones + ".");
          return 0;
        }
        return maxBones;
      }
    }
    getTextureEncodingFromMap(map) {
      let encoding;
      if (map && map.isTexture) {
        encoding = map.encoding;
      } else {
        if (map && map.isWebGLRenderTarget) {
          console.warn("THREE.WebGLPrograms.getTextureEncodingFromMap: don't use render targets as textures. Use their .texture property instead.");
          encoding = map.texture.encoding;
        } else {
          encoding = module$constants.LinearEncoding;
        }
      }
      return encoding;
    }
    getParameters(material, lights, shadows, scene, object) {
      const fog = scene.fog;
      const environment = material.isMeshStandardMaterial ? scene.environment : null;
      const envMap = this.cubemaps.get(material.envMap || environment);
      const shaderID = this.shaderIDs[material.type];
      const maxBones = object.isSkinnedMesh ? this.getMaxBones(object) : 0;
      if (material.precision !== null) {
        this.precision = this.capabilities.getMaxPrecision(material.precision);
        if (this.precision !== material.precision) {
          console.warn("THREE.WebGLProgram.getParameters:", material.precision, "not supported, using", this.precision, "instead.");
        }
      }
      let vertexShader, fragmentShader;
      if (shaderID) {
        console.log("GET " + shaderID);
        const shader = module$renderers$shaders$ShaderLib.ShaderLib.get(shaderID);
        vertexShader = shader.vertexShader;
        fragmentShader = shader.fragmentShader;
      } else {
        vertexShader = material.vertexShader;
        fragmentShader = material.fragmentShader;
      }
      const currentRenderTarget = this.renderer.getRenderTarget();
      const parameters = {isWebGL2:this.isWebGL2, shaderID:shaderID, shaderName:material.type, vertexShader:vertexShader, fragmentShader:fragmentShader, defines:material.defines, isRawShaderMaterial:material.isRawShaderMaterial === true, glslVersion:material.glslVersion, precision:this.precision, instancing:object.isInstancedMesh === true, instancingColor:object.isInstancedMesh === true && object.instanceColor !== null, supportsVertexTextures:this.vertexTextures, outputEncoding:currentRenderTarget !== 
      null ? this.getTextureEncodingFromMap(currentRenderTarget.texture) : this.renderer.outputEncoding, map:!!material.map, mapEncoding:this.getTextureEncodingFromMap(material.map), matcap:!!material.matcap, matcapEncoding:this.getTextureEncodingFromMap(material.matcap), envMap:!!envMap, envMapMode:envMap && envMap.mapping, envMapEncoding:this.getTextureEncodingFromMap(envMap), envMapCubeUV:!!envMap && (envMap.mapping === module$constants.CubeUVReflectionMapping || envMap.mapping === module$constants.CubeUVRefractionMapping), 
      lightMap:!!material.lightMap, lightMapEncoding:this.getTextureEncodingFromMap(material.lightMap), aoMap:!!material.aoMap, emissiveMap:!!material.emissiveMap, emissiveMapEncoding:this.getTextureEncodingFromMap(material.emissiveMap), bumpMap:!!material.bumpMap, normalMap:!!material.normalMap, objectSpaceNormalMap:material.normalMapType === module$constants.ObjectSpaceNormalMap, tangentSpaceNormalMap:material.normalMapType === module$constants.TangentSpaceNormalMap, clearcoatMap:!!material.clearcoatMap, 
      clearcoatRoughnessMap:!!material.clearcoatRoughnessMap, clearcoatNormalMap:!!material.clearcoatNormalMap, displacementMap:!!material.displacementMap, roughnessMap:!!material.roughnessMap, metalnessMap:!!material.metalnessMap, specularMap:!!material.specularMap, alphaMap:!!material.alphaMap, gradientMap:!!material.gradientMap, sheen:!!material.sheen, transmissionMap:!!material.transmissionMap, combine:material.combine, vertexTangents:material.normalMap && material.vertexTangents, vertexColors:material.vertexColors, 
      vertexUvs:!!material.map || !!material.bumpMap || !!material.normalMap || !!material.specularMap || !!material.alphaMap || !!material.emissiveMap || !!material.roughnessMap || !!material.metalnessMap || !!material.clearcoatMap || !!material.clearcoatRoughnessMap || !!material.clearcoatNormalMap || !!material.displacementMap || !!material.transmissionMap, uvsVertexOnly:!(!!material.map || !!material.bumpMap || !!material.normalMap || !!material.specularMap || !!material.alphaMap || !!material.emissiveMap || 
      !!material.roughnessMap || !!material.metalnessMap || !!material.clearcoatNormalMap || !!material.transmissionMap) && !!material.displacementMap, fog:!!fog, useFog:material.fog, fogExp2:fog && fog.isFogExp2, flatShading:!!material.flatShading, sizeAttenuation:material.sizeAttenuation, logarithmicDepthBuffer:this.logarithmicDepthBuffer, skinning:material.skinning && maxBones > 0, maxBones:maxBones, useVertexTexture:this.floatVertexTextures, morphTargets:material.morphTargets, morphNormals:material.morphNormals, 
      maxMorphTargets:this.renderer.maxMorphTargets, maxMorphNormals:this.renderer.maxMorphNormals, numDirLights:lights.directional.length, numPointLights:lights.point.length, numSpotLights:lights.spot.length, numRectAreaLights:lights.rectArea.length, numHemiLights:lights.hemi.length, numDirLightShadows:lights.directionalShadowMap.length, numPointLightShadows:lights.pointShadowMap.length, numSpotLightShadows:lights.spotShadowMap.length, numClippingPlanes:this.clipping.numPlanes, numClipIntersection:this.clipping.numIntersection, 
      dithering:material.dithering, shadowMapEnabled:this.renderer.shadowMap.enabled && shadows.length > 0, shadowMapType:this.renderer.shadowMap.type, toneMapping:material.toneMapped ? this.renderer.toneMapping : module$constants.NoToneMapping, physicallyCorrectLights:this.renderer.physicallyCorrectLights, premultipliedAlpha:material.premultipliedAlpha, alphaTest:material.alphaTest, doubleSided:material.side === module$constants.DoubleSide, flipSided:material.side === module$constants.BackSide, 
      depthPacking:material.depthPacking !== undefined ? material.depthPacking : false, index0AttributeName:material.index0AttributeName, extensionDerivatives:material.extensions && material.extensions.derivatives, extensionFragDepth:material.extensions && material.extensions.fragDepth, extensionDrawBuffers:material.extensions && material.extensions.drawBuffers, extensionShaderTextureLOD:material.extensions && material.extensions.shaderTextureLOD, rendererExtensionFragDepth:this.isWebGL2 || this.extensions.has("EXT_frag_depth"), 
      rendererExtensionDrawBuffers:this.isWebGL2 || this.extensions.has("WEBGL_draw_buffers"), rendererExtensionShaderTextureLod:this.isWebGL2 || this.extensions.has("EXT_shader_texture_lod"), customProgramCacheKey:material.customProgramCacheKey()};
      return parameters;
    }
    getProgramCacheKey(parameters) {
      const array = [];
      if (parameters.shaderID) {
        array.push(parameters.shaderID);
      } else {
        array.push(parameters.fragmentShader);
        array.push(parameters.vertexShader);
      }
      if (parameters.defines !== undefined) {
        for (const name in parameters.defines) {
          array.push(name);
          array.push(parameters.defines[name]);
        }
      }
      if (parameters.isRawShaderMaterial === false) {
        for (let i = 0; i < this.parameterNames.length; i++) {
          array.push(parameters[this.parameterNames[i]]);
        }
        array.push(this.renderer.outputEncoding);
        array.push(this.renderer.gammaFactor);
      }
      array.push(parameters.customProgramCacheKey);
      return array.join();
    }
    getUniforms(material) {
      const shaderID = this.shaderIDs[material.type];
      let uniforms;
      if (shaderID) {
        console.log("GET " + shaderID);
        const shader = module$renderers$shaders$ShaderLib.ShaderLib.get(shaderID);
        uniforms = module$renderers$shaders$UniformsUtils.UniformsUtils.clone(shader.uniforms);
      } else {
        uniforms = material.uniforms;
      }
      return uniforms;
    }
    acquireProgram(parameters, cacheKey) {
      let program;
      for (let p = 0, pl = this.programs.length; p < pl; p++) {
        const preexistingProgram = this.programs[p];
        if (preexistingProgram.cacheKey === cacheKey) {
          program = preexistingProgram;
          ++program.usedTimes;
          break;
        }
      }
      if (program === undefined) {
        program = new module$renderers$webgl$WebGLProgram.WebGLProgram(this.renderer, cacheKey, parameters, this.bindingStates);
        this.programs.push(program);
      }
      return program;
    }
    releaseProgram(program) {
      if (--program.usedTimes === 0) {
        const i = this.programs.indexOf(program);
        this.programs[i] = this.programs[this.programs.length - 1];
        this.programs.pop();
        program.destroy();
      }
    }
  }
}, "renderers/webgl/WebGLPrograms.js", ["constants.js", "renderers/webgl/WebGLProgram.js", "renderers/shaders/ShaderLib.js", "renderers/shaders/UniformsUtils.js"]);

//renderers/webgl/WebGLProperties.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLProperties:{enumerable:true, get:function() {
    return WebGLProperties;
  }}});
  class WebGLProperties {
    constructor() {
      this.properties = new WeakMap;
    }
    get(object) {
      let map = this.properties.get(object);
      if (map === undefined) {
        map = {};
        this.properties.set(object, map);
      }
      return map;
    }
    remove(object) {
      this.properties["delete"](object);
    }
    update(object, key, value) {
      this.properties.get(object)[key] = value;
    }
    dispose() {
      this.properties = new WeakMap;
    }
  }
}, "renderers/webgl/WebGLProperties.js", []);

//renderers/webgl/WebGLRenderLists.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLRenderList:{enumerable:true, get:function() {
    return WebGLRenderList;
  }}, WebGLRenderLists:{enumerable:true, get:function() {
    return WebGLRenderLists;
  }}});
  function painterSortStable(a, b) {
    if (a.groupOrder !== b.groupOrder) {
      return a.groupOrder - b.groupOrder;
    } else {
      if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
      } else {
        if (a.program !== b.program) {
          return a.program.id - b.program.id;
        } else {
          if (a.material.id !== b.material.id) {
            return a.material.id - b.material.id;
          } else {
            if (a.z !== b.z) {
              return a.z - b.z;
            } else {
              return a.id - b.id;
            }
          }
        }
      }
    }
  }
  function reversePainterSortStable(a, b) {
    if (a.groupOrder !== b.groupOrder) {
      return a.groupOrder - b.groupOrder;
    } else {
      if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
      } else {
        if (a.z !== b.z) {
          return b.z - a.z;
        } else {
          return a.id - b.id;
        }
      }
    }
  }
  class WebGLRenderList {
    constructor(properties) {
      this.properties = properties;
      this.renderItems = [];
      this.renderItemsIndex = 0;
      this.opaque = [];
      this.transparent = [];
      this.defaultProgram = {id:-1};
    }
    init() {
      this.renderItemsIndex = 0;
      this.opaque.length = 0;
      this.transparent.length = 0;
    }
    getNextRenderItem(object, geometry, material, groupOrder, z, group) {
      let renderItem = this.renderItems[this.renderItemsIndex];
      const materialProperties = this.properties.get(material);
      if (renderItem === undefined) {
        renderItem = {id:object.id, object:object, geometry:geometry, material:material, program:materialProperties.program || this.defaultProgram, groupOrder:groupOrder, renderOrder:object.renderOrder, z:z, group:group};
        this.renderItems[this.renderItemsIndex] = renderItem;
      } else {
        renderItem.id = object.id;
        renderItem.object = object;
        renderItem.geometry = geometry;
        renderItem.material = material;
        renderItem.program = materialProperties.program || this.defaultProgram;
        renderItem.groupOrder = groupOrder;
        renderItem.renderOrder = object.renderOrder;
        renderItem.z = z;
        renderItem.group = group;
      }
      this.renderItemsIndex++;
      return renderItem;
    }
    push(object, geometry, material, groupOrder, z, group) {
      const renderItem = this.getNextRenderItem(object, geometry, material, groupOrder, z, group);
      (material.transparent === true ? this.transparent : this.opaque).push(renderItem);
    }
    unshift(object, geometry, material, groupOrder, z, group) {
      const renderItem = this.getNextRenderItem(object, geometry, material, groupOrder, z, group);
      (material.transparent === true ? this.transparent : this.opaque).unshift(renderItem);
    }
    sort(customOpaqueSort, customTransparentSort) {
      if (this.opaque.length > 1) {
        this.opaque.sort(customOpaqueSort || painterSortStable);
      }
      if (this.transparent.length > 1) {
        this.transparent.sort(customTransparentSort || reversePainterSortStable);
      }
    }
    finish() {
      for (let i = this.renderItemsIndex, il = this.renderItems.length; i < il; i++) {
        const renderItem = this.renderItems[i];
        if (renderItem.id === null) {
          break;
        }
        renderItem.id = null;
        renderItem.object = null;
        renderItem.geometry = null;
        renderItem.material = null;
        renderItem.program = null;
        renderItem.group = null;
      }
    }
  }
  class WebGLRenderLists {
    constructor(properties) {
      this.properties = properties;
      this.lists = new WeakMap;
    }
    get(scene, renderCallDepth) {
      let list;
      if (this.lists.has(scene) === false) {
        list = new WebGLRenderList(this.properties);
        this.lists.set(scene, [list]);
      } else {
        if (renderCallDepth >= this.lists.get(scene).length) {
          list = new WebGLRenderList(this.properties);
          this.lists.get(scene).push(list);
        } else {
          list = this.lists.get(scene)[renderCallDepth];
        }
      }
      return list;
    }
    dispose() {
      this.lists = new WeakMap;
    }
  }
}, "renderers/webgl/WebGLRenderLists.js", []);

//renderers/webgl/WebGLLights.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLLights:{enumerable:true, get:function() {
    return WebGLLights;
  }}});
  var module$math$Color = $$require("math/Color.js");
  var module$math$Matrix4 = $$require("math/Matrix4.js");
  var module$math$Vector2 = $$require("math/Vector2.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$renderers$shaders$UniformsLib = $$require("renderers/shaders/UniformsLib.js");
  class UniformsCache {
    constructor() {
      this.lights = {};
    }
    get(light) {
      if (this.lights[light.id] !== undefined) {
        return this.lights[light.id];
      }
      let uniforms;
      switch(light.type) {
        case "DirectionalLight":
          uniforms = {direction:new module$math$Vector3.Vector3, color:new module$math$Color.Color};
          break;
        case "SpotLight":
          uniforms = {position:new module$math$Vector3.Vector3, direction:new module$math$Vector3.Vector3, color:new module$math$Color.Color, distance:0, coneCos:0, penumbraCos:0, decay:0};
          break;
        case "PointLight":
          uniforms = {position:new module$math$Vector3.Vector3, color:new module$math$Color.Color, distance:0, decay:0};
          break;
        case "HemisphereLight":
          uniforms = {direction:new module$math$Vector3.Vector3, skyColor:new module$math$Color.Color, groundColor:new module$math$Color.Color};
          break;
        case "RectAreaLight":
          uniforms = {color:new module$math$Color.Color, position:new module$math$Vector3.Vector3, halfWidth:new module$math$Vector3.Vector3, halfHeight:new module$math$Vector3.Vector3};
          break;
      }
      this.lights[light.id] = uniforms;
      return uniforms;
    }
  }
  class ShadowUniformsCache {
    constructor() {
      this.lights = {};
    }
    get(light) {
      if (this.lights[light.id] !== undefined) {
        return this.lights[light.id];
      }
      let uniforms;
      switch(light.type) {
        case "DirectionalLight":
          uniforms = {shadowBias:0, shadowNormalBias:0, shadowRadius:1, shadowMapSize:new module$math$Vector2.Vector2};
          break;
        case "SpotLight":
          uniforms = {shadowBias:0, shadowNormalBias:0, shadowRadius:1, shadowMapSize:new module$math$Vector2.Vector2};
          break;
        case "PointLight":
          uniforms = {shadowBias:0, shadowNormalBias:0, shadowRadius:1, shadowMapSize:new module$math$Vector2.Vector2, shadowCameraNear:1, shadowCameraFar:1000};
          break;
      }
      this.lights[light.id] = uniforms;
      return uniforms;
    }
  }
  let nextVersion = 0;
  function shadowCastingLightsFirst(lightA, lightB) {
    return (lightB.castShadow ? 1 : 0) - (lightA.castShadow ? 1 : 0);
  }
  class WebGLLights {
    constructor(extensions, capabilities) {
      this.extensions = extensions;
      this.capabilities = capabilities;
      this.cache = new UniformsCache;
      this.shadowCache = new ShadowUniformsCache;
      this.state = {version:0, hash:{directionalLength:-1, pointLength:-1, spotLength:-1, rectAreaLength:-1, hemiLength:-1, numDirectionalShadows:-1, numPointShadows:-1, numSpotShadows:-1}, ambient:[0, 0, 0], probe:[], directional:[], directionalShadow:[], directionalShadowMap:[], directionalShadowMatrix:[], spot:[], spotShadow:[], spotShadowMap:[], spotShadowMatrix:[], rectArea:[], rectAreaLTC1:null, rectAreaLTC2:null, point:[], pointShadow:[], pointShadowMap:[], pointShadowMatrix:[], hemi:[]};
      for (let i = 0; i < 9; i++) {
        this.state.probe.push(new module$math$Vector3.Vector3);
      }
      this.vector3 = new module$math$Vector3.Vector3;
      this.matrix4 = new module$math$Matrix4.Matrix4;
      this.matrix42 = new module$math$Matrix4.Matrix4;
    }
    setup(lights) {
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < 9; i++) {
        this.state.probe[i].set(0, 0, 0);
      }
      let directionalLength = 0;
      let pointLength = 0;
      let spotLength = 0;
      let rectAreaLength = 0;
      let hemiLength = 0;
      let numDirectionalShadows = 0;
      let numPointShadows = 0;
      let numSpotShadows = 0;
      lights.sort(shadowCastingLightsFirst);
      for (let i = 0, l = lights.length; i < l; i++) {
        const light = lights[i];
        const color = light.color;
        const intensity = light.intensity;
        const distance = light.distance;
        const shadowMap = light.shadow && light.shadow.map ? light.shadow.map.texture : null;
        if (light.isAmbientLight) {
          r += color.r * intensity;
          g += color.g * intensity;
          b += color.b * intensity;
        } else {
          if (light.isLightProbe) {
            for (let j = 0; j < 9; j++) {
              this.state.probe[j].addScaledVector(light.sh.coefficients[j], intensity);
            }
          } else {
            if (light.isDirectionalLight) {
              const uniforms = this.cache.get(light);
              uniforms.color.copy(light.color).multiplyScalar(light.intensity);
              if (light.castShadow) {
                const shadow = light.shadow;
                const shadowUniforms = this.shadowCache.get(light);
                shadowUniforms.shadowBias = shadow.bias;
                shadowUniforms.shadowNormalBias = shadow.normalBias;
                shadowUniforms.shadowRadius = shadow.radius;
                shadowUniforms.shadowMapSize = shadow.mapSize;
                this.state.directionalShadow[directionalLength] = shadowUniforms;
                this.state.directionalShadowMap[directionalLength] = shadowMap;
                this.state.directionalShadowMatrix[directionalLength] = light.shadow.matrix;
                numDirectionalShadows++;
              }
              this.state.directional[directionalLength] = uniforms;
              directionalLength++;
            } else {
              if (light.isSpotLight) {
                const uniforms = this.cache.get(light);
                uniforms.position.setFromMatrixPosition(light.matrixWorld);
                uniforms.color.copy(color).multiplyScalar(intensity);
                uniforms.distance = distance;
                uniforms.coneCos = Math.cos(light.angle);
                uniforms.penumbraCos = Math.cos(light.angle * (1 - light.penumbra));
                uniforms.decay = light.decay;
                if (light.castShadow) {
                  const shadow = light.shadow;
                  const shadowUniforms = this.shadowCache.get(light);
                  shadowUniforms.shadowBias = shadow.bias;
                  shadowUniforms.shadowNormalBias = shadow.normalBias;
                  shadowUniforms.shadowRadius = shadow.radius;
                  shadowUniforms.shadowMapSize = shadow.mapSize;
                  this.state.spotShadow[spotLength] = shadowUniforms;
                  this.state.spotShadowMap[spotLength] = shadowMap;
                  this.state.spotShadowMatrix[spotLength] = light.shadow.matrix;
                  numSpotShadows++;
                }
                this.state.spot[spotLength] = uniforms;
                spotLength++;
              } else {
                if (light.isRectAreaLight) {
                  const uniforms = this.cache.get(light);
                  uniforms.color.copy(color).multiplyScalar(intensity);
                  uniforms.halfWidth.set(light.width * 0.5, 0.0, 0.0);
                  uniforms.halfHeight.set(0.0, light.height * 0.5, 0.0);
                  this.state.rectArea[rectAreaLength] = uniforms;
                  rectAreaLength++;
                } else {
                  if (light.isPointLight) {
                    const uniforms = this.cache.get(light);
                    uniforms.color.copy(light.color).multiplyScalar(light.intensity);
                    uniforms.distance = light.distance;
                    uniforms.decay = light.decay;
                    if (light.castShadow) {
                      const shadow = light.shadow;
                      const shadowUniforms = this.shadowCache.get(light);
                      shadowUniforms.shadowBias = shadow.bias;
                      shadowUniforms.shadowNormalBias = shadow.normalBias;
                      shadowUniforms.shadowRadius = shadow.radius;
                      shadowUniforms.shadowMapSize = shadow.mapSize;
                      shadowUniforms.shadowCameraNear = shadow.camera.near;
                      shadowUniforms.shadowCameraFar = shadow.camera.far;
                      this.state.pointShadow[pointLength] = shadowUniforms;
                      this.state.pointShadowMap[pointLength] = shadowMap;
                      this.state.pointShadowMatrix[pointLength] = light.shadow.matrix;
                      numPointShadows++;
                    }
                    this.state.point[pointLength] = uniforms;
                    pointLength++;
                  } else {
                    if (light.isHemisphereLight) {
                      const uniforms = this.cache.get(light);
                      uniforms.skyColor.copy(light.color).multiplyScalar(intensity);
                      uniforms.groundColor.copy(light.groundColor).multiplyScalar(intensity);
                      this.state.hemi[hemiLength] = uniforms;
                      hemiLength++;
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (rectAreaLength > 0) {
        if (this.capabilities.isWebGL2) {
        } else {
          if (this.extensions.has("OES_texture_float_linear") === true) {
          } else {
            if (this.extensions.has("OES_texture_half_float_linear") === true) {
            } else {
              console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.");
            }
          }
        }
      }
      this.state.ambient[0] = r;
      this.state.ambient[1] = g;
      this.state.ambient[2] = b;
      const hash = this.state.hash;
      if (hash.directionalLength !== directionalLength || hash.pointLength !== pointLength || hash.spotLength !== spotLength || hash.rectAreaLength !== rectAreaLength || hash.hemiLength !== hemiLength || hash.numDirectionalShadows !== numDirectionalShadows || hash.numPointShadows !== numPointShadows || hash.numSpotShadows !== numSpotShadows) {
        this.state.directional.length = directionalLength;
        this.state.spot.length = spotLength;
        this.state.rectArea.length = rectAreaLength;
        this.state.point.length = pointLength;
        this.state.hemi.length = hemiLength;
        this.state.directionalShadow.length = numDirectionalShadows;
        this.state.directionalShadowMap.length = numDirectionalShadows;
        this.state.pointShadow.length = numPointShadows;
        this.state.pointShadowMap.length = numPointShadows;
        this.state.spotShadow.length = numSpotShadows;
        this.state.spotShadowMap.length = numSpotShadows;
        this.state.directionalShadowMatrix.length = numDirectionalShadows;
        this.state.pointShadowMatrix.length = numPointShadows;
        this.state.spotShadowMatrix.length = numSpotShadows;
        hash.directionalLength = directionalLength;
        hash.pointLength = pointLength;
        hash.spotLength = spotLength;
        hash.rectAreaLength = rectAreaLength;
        hash.hemiLength = hemiLength;
        hash.numDirectionalShadows = numDirectionalShadows;
        hash.numPointShadows = numPointShadows;
        hash.numSpotShadows = numSpotShadows;
        this.state.version = nextVersion++;
      }
    }
    setupView(lights, camera) {
      let directionalLength = 0;
      let pointLength = 0;
      let spotLength = 0;
      let rectAreaLength = 0;
      let hemiLength = 0;
      const viewMatrix = camera.matrixWorldInverse;
      for (let i = 0, l = lights.length; i < l; i++) {
        const light = lights[i];
        if (light.isDirectionalLight) {
          const uniforms = this.state.directional[directionalLength];
          uniforms.direction.setFromMatrixPosition(light.matrixWorld);
          this.vector3.setFromMatrixPosition(light.target.matrixWorld);
          uniforms.direction.sub(this.vector3);
          uniforms.direction.transformDirection(viewMatrix);
          directionalLength++;
        } else {
          if (light.isSpotLight) {
            const uniforms = this.state.spot[spotLength];
            uniforms.position.setFromMatrixPosition(light.matrixWorld);
            uniforms.position.applyMatrix4(viewMatrix);
            uniforms.direction.setFromMatrixPosition(light.matrixWorld);
            this.vector3.setFromMatrixPosition(light.target.matrixWorld);
            uniforms.direction.sub(this.vector3);
            uniforms.direction.transformDirection(viewMatrix);
            spotLength++;
          } else {
            if (light.isRectAreaLight) {
              const uniforms = this.state.rectArea[rectAreaLength];
              uniforms.position.setFromMatrixPosition(light.matrixWorld);
              uniforms.position.applyMatrix4(viewMatrix);
              this.matrix42.identity();
              this.matrix4.copy(light.matrixWorld);
              this.matrix4.premultiply(viewMatrix);
              this.matrix42.extractRotation(this.matrix4);
              uniforms.halfWidth.set(light.width * 0.5, 0.0, 0.0);
              uniforms.halfHeight.set(0.0, light.height * 0.5, 0.0);
              uniforms.halfWidth.applyMatrix4(this.matrix42);
              uniforms.halfHeight.applyMatrix4(this.matrix42);
              rectAreaLength++;
            } else {
              if (light.isPointLight) {
                const uniforms = this.state.point[pointLength];
                uniforms.position.setFromMatrixPosition(light.matrixWorld);
                uniforms.position.applyMatrix4(viewMatrix);
                pointLength++;
              } else {
                if (light.isHemisphereLight) {
                  const uniforms = this.state.hemi[hemiLength];
                  uniforms.direction.setFromMatrixPosition(light.matrixWorld);
                  uniforms.direction.transformDirection(viewMatrix);
                  uniforms.direction.normalize();
                  hemiLength++;
                }
              }
            }
          }
        }
      }
    }
  }
}, "renderers/webgl/WebGLLights.js", ["math/Color.js", "math/Matrix4.js", "math/Vector2.js", "math/Vector3.js", "renderers/shaders/UniformsLib.js"]);

//renderers/webgl/WebGLRenderStates.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLRenderStates:{enumerable:true, get:function() {
    return WebGLRenderStates;
  }}});
  var module$renderers$webgl$WebGLLights = $$require("renderers/webgl/WebGLLights.js");
  class WebGLRenderState {
    constructor(extensions, capabilities) {
      this.lights = new module$renderers$webgl$WebGLLights.WebGLLights(extensions, capabilities);
      this.lightsArray = [];
      this.shadowsArray = [];
      this.state = {lightsArray:this.lightsArray, shadowsArray:this.shadowsArray, lights:this.lights};
    }
    init() {
      this.lightsArray.length = 0;
      this.shadowsArray.length = 0;
    }
    pushLight(light) {
      this.lightsArray.push(light);
    }
    pushShadow(shadowLight) {
      this.shadowsArray.push(shadowLight);
    }
    setupLights() {
      this.lights.setup(this.lightsArray);
    }
    setupLightsView(camera) {
      this.lights.setupView(this.lightsArray, camera);
    }
  }
  class WebGLRenderStates {
    constructor(extensions, capabilities) {
      this.extensions = extensions;
      this.capabilities = capabilities;
      this.renderStates = new WeakMap;
    }
    get(scene = undefined, renderCallDepth = 0) {
      let renderState;
      if (this.renderStates.has(scene) === false) {
        renderState = new WebGLRenderState(this.extensions, this.capabilities);
        this.renderStates.set(scene, [renderState]);
      } else {
        if (renderCallDepth >= this.renderStates.get(scene).length) {
          renderState = new WebGLRenderState(this.extensions, this.capabilities);
          this.renderStates.get(scene).push(renderState);
        } else {
          renderState = this.renderStates.get(scene)[renderCallDepth];
        }
      }
      return renderState;
    }
    dispose() {
      this.renderStates = new WeakMap;
    }
  }
}, "renderers/webgl/WebGLRenderStates.js", ["renderers/webgl/WebGLLights.js"]);

//materials/MeshDepthMaterial.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {MeshDepthMaterial:{enumerable:true, get:function() {
    return MeshDepthMaterial;
  }}});
  var module$materials$Material = $$require("materials/Material.js");
  var module$constants = $$require("constants.js");
  class MeshDepthMaterial extends module$materials$Material.Material {
    constructor(parameters) {
      super();
      this.type = "MeshDepthMaterial";
      this.depthPacking = module$constants.BasicDepthPacking;
      this.skinning = false;
      this.morphTargets = false;
      this.map = null;
      this.alphaMap = null;
      this.displacementMap = null;
      this.displacementScale = 1;
      this.displacementBias = 0;
      this.wireframe = false;
      this.wireframeLinewidth = 1;
      this.fog = false;
      this.setValues(parameters);
    }
    copy(source) {
      super.copy(source);
      this.depthPacking = source.depthPacking;
      this.skinning = source.skinning;
      this.morphTargets = source.morphTargets;
      this.map = source.map;
      this.alphaMap = source.alphaMap;
      this.displacementMap = source.displacementMap;
      this.displacementScale = source.displacementScale;
      this.displacementBias = source.displacementBias;
      this.wireframe = source.wireframe;
      this.wireframeLinewidth = source.wireframeLinewidth;
      return this;
    }
  }
  MeshDepthMaterial.prototype.isMeshDepthMaterial = true;
}, "materials/MeshDepthMaterial.js", ["materials/Material.js", "constants.js"]);

//materials/MeshDistanceMaterial.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {MeshDistanceMaterial:{enumerable:true, get:function() {
    return MeshDistanceMaterial;
  }}});
  var module$materials$Material = $$require("materials/Material.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  class MeshDistanceMaterial extends module$materials$Material.Material {
    constructor(parameters) {
      super();
      this.type = "MeshDistanceMaterial";
      this.referencePosition = new module$math$Vector3.Vector3;
      this.nearDistance = 1;
      this.farDistance = 1000;
      this.skinning = false;
      this.morphTargets = false;
      this.map = null;
      this.alphaMap = null;
      this.displacementMap = null;
      this.displacementScale = 1;
      this.displacementBias = 0;
      this.fog = false;
      this.setValues(parameters);
    }
    copy(source) {
      super.copy(source);
      this.referencePosition.copy(source.referencePosition);
      this.nearDistance = source.nearDistance;
      this.farDistance = source.farDistance;
      this.skinning = source.skinning;
      this.morphTargets = source.morphTargets;
      this.map = source.map;
      this.alphaMap = source.alphaMap;
      this.displacementMap = source.displacementMap;
      this.displacementScale = source.displacementScale;
      this.displacementBias = source.displacementBias;
      return this;
    }
  }
  MeshDistanceMaterial.prototype.isMeshDistanceMaterial = true;
}, "materials/MeshDistanceMaterial.js", ["materials/Material.js", "math/Vector3.js"]);

//renderers/shaders/ShaderLib/vsm_frag.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;

#include <packing>

void main() {

	float mean = 0.0;
	float squared_mean = 0.0;

	// This seems totally useless but it's a crazy work around for a Adreno compiler bug
	float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy ) / resolution ) );

	for ( float i = -1.0; i < 1.0 ; i += SAMPLE_RATE) {

		#ifdef HORIZONTAL_PASS

			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( i, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;

		#else

			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, i ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;

		#endif

	}

	mean = mean * HALF_SAMPLE_RATE;
	squared_mean = squared_mean * HALF_SAMPLE_RATE;

	float std_dev = sqrt( squared_mean - mean * mean );

	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );

}
`;
}, "renderers/shaders/ShaderLib/vsm_frag.glsl.js", []);

//renderers/shaders/ShaderLib/vsm_vert.glsl.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return $$default;
  }}});
  const $$default = `
void main() {

	gl_Position = vec4( position, 1.0 );

}
`;
}, "renderers/shaders/ShaderLib/vsm_vert.glsl.js", []);

//renderers/webgl/WebGLShadowMap.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLShadowMap:{enumerable:true, get:function() {
    return WebGLShadowMap;
  }}});
  var module$constants = $$require("constants.js");
  var module$renderers$WebGLRenderTarget = $$require("renderers/WebGLRenderTarget.js");
  var module$materials$MeshDepthMaterial = $$require("materials/MeshDepthMaterial.js");
  var module$materials$MeshDistanceMaterial = $$require("materials/MeshDistanceMaterial.js");
  var module$materials$ShaderMaterial = $$require("materials/ShaderMaterial.js");
  var module$core$BufferAttribute = $$require("core/BufferAttribute.js");
  var module$core$BufferGeometry = $$require("core/BufferGeometry.js");
  var module$objects$Mesh = $$require("objects/Mesh.js");
  var module$math$Vector4 = $$require("math/Vector4.js");
  var module$math$Vector2 = $$require("math/Vector2.js");
  var module$math$Frustum = $$require("math/Frustum.js");
  var module$renderers$shaders$ShaderLib$vsm_frag_glsl = $$require("renderers/shaders/ShaderLib/vsm_frag.glsl.js");
  var module$renderers$shaders$ShaderLib$vsm_vert_glsl = $$require("renderers/shaders/ShaderLib/vsm_vert.glsl.js");
  class WebGLShadowMap {
    constructor(_renderer, _objects, maxTextureSize) {
      this._renderer = _renderer;
      this._objects = _objects;
      this.maxTextureSize = maxTextureSize;
      this._frustum = new module$math$Frustum.Frustum;
      this._shadowMapSize = new module$math$Vector2.Vector2;
      this._viewportSize = new module$math$Vector2.Vector2;
      this._viewport = new module$math$Vector4.Vector4;
      this._depthMaterials = [];
      this._distanceMaterials = [];
      this._materialCache = {};
      this.shadowSide = {0:module$constants.BackSide, 1:module$constants.FrontSide, 2:module$constants.DoubleSide};
      this.shadowMaterialVertical = new module$materials$ShaderMaterial.ShaderMaterial({defines:{SAMPLE_RATE:2.0 / 8.0, HALF_SAMPLE_RATE:1.0 / 8.0}, uniforms:{shadow_pass:{value:null}, resolution:{value:new module$math$Vector2.Vector2}, radius:{value:4.0}}, vertexShader:module$renderers$shaders$ShaderLib$vsm_vert_glsl["default"], fragmentShader:module$renderers$shaders$ShaderLib$vsm_frag_glsl["default"]});
      this.shadowMaterialHorizontal = this.shadowMaterialVertical.clone();
      this.shadowMaterialHorizontal.defines.HORIZONTAL_PASS = 1;
      const fullScreenTri = new module$core$BufferGeometry.BufferGeometry;
      fullScreenTri.setAttribute("position", new module$core$BufferAttribute.BufferAttribute(new Float32Array([-1, -1, 0.5, 3, -1, 0.5, -1, 3, 0.5]), 3));
      this.fullScreenMesh = new module$objects$Mesh.Mesh(fullScreenTri, this.shadowMaterialVertical);
      this.enabled = false;
      this.autoUpdate = true;
      this.needsUpdate = false;
      this.type = module$constants.PCFShadowMap;
    }
    render(lights, scene, camera) {
      if (this.enabled === false) {
        return;
      }
      if (this.autoUpdate === false && this.needsUpdate === false) {
        return;
      }
      if (lights.length === 0) {
        return;
      }
      const currentRenderTarget = this._renderer.getRenderTarget();
      const activeCubeFace = this._renderer.getActiveCubeFace();
      const activeMipmapLevel = this._renderer.getActiveMipmapLevel();
      const _state = this._renderer.state;
      _state.setBlending(module$constants.NoBlending);
      _state.buffers.color.setClear(1, 1, 1, 1);
      _state.buffers.depth.setTest(true);
      _state.setScissorTest(false);
      for (let i = 0, il = lights.length; i < il; i++) {
        const light = lights[i];
        const shadow = light.shadow;
        if (shadow === undefined) {
          console.warn("THREE.WebGLShadowMap:", light, "has no shadow.");
          continue;
        }
        if (shadow.autoUpdate === false && shadow.needsUpdate === false) {
          continue;
        }
        this._shadowMapSize.copy(shadow.mapSize);
        const shadowFrameExtents = shadow.getFrameExtents();
        this._shadowMapSize.multiply(shadowFrameExtents);
        this._viewportSize.copy(shadow.mapSize);
        if (this._shadowMapSize.x > this.maxTextureSize || this._shadowMapSize.y > this.maxTextureSize) {
          if (this._shadowMapSize.x > this.maxTextureSize) {
            this._viewportSize.x = Math.floor(this.maxTextureSize / shadowFrameExtents.x);
            this._shadowMapSize.x = this._viewportSize.x * shadowFrameExtents.x;
            shadow.mapSize.x = this._viewportSize.x;
          }
          if (this._shadowMapSize.y > this.maxTextureSize) {
            this._viewportSize.y = Math.floor(this.maxTextureSize / shadowFrameExtents.y);
            this._shadowMapSize.y = this._viewportSize.y * shadowFrameExtents.y;
            shadow.mapSize.y = this._viewportSize.y;
          }
        }
        if (shadow.map === null && !shadow.isPointLightShadow && this.type === module$constants.VSMShadowMap) {
          const pars = {minFilter:module$constants.LinearFilter, magFilter:module$constants.LinearFilter, format:module$constants.RGBAFormat};
          shadow.map = new module$renderers$WebGLRenderTarget.WebGLRenderTarget(this._shadowMapSize.x, this._shadowMapSize.y, pars);
          shadow.map.texture.name = light.name + ".shadowMap";
          shadow.mapPass = new module$renderers$WebGLRenderTarget.WebGLRenderTarget(this._shadowMapSize.x, this._shadowMapSize.y, pars);
          shadow.camera.updateProjectionMatrix();
        }
        if (shadow.map === null) {
          const pars = {minFilter:module$constants.NearestFilter, magFilter:module$constants.NearestFilter, format:module$constants.RGBAFormat};
          shadow.map = new module$renderers$WebGLRenderTarget.WebGLRenderTarget(this._shadowMapSize.x, this._shadowMapSize.y, pars);
          shadow.map.texture.name = light.name + ".shadowMap";
          shadow.camera.updateProjectionMatrix();
        }
        this._renderer.setRenderTarget(shadow.map);
        this._renderer.clear();
        const viewportCount = shadow.getViewportCount();
        for (let vp = 0; vp < viewportCount; vp++) {
          const viewport = shadow.getViewport(vp);
          this._viewport.set(this._viewportSize.x * viewport.x, this._viewportSize.y * viewport.y, this._viewportSize.x * viewport.z, this._viewportSize.y * viewport.w);
          _state.viewport(this._viewport);
          shadow.updateMatrices(light, vp);
          this._frustum = shadow.getFrustum();
          this.renderObject(scene, camera, shadow.camera, light, this.type);
        }
        if (!shadow.isPointLightShadow && this.type === module$constants.VSMShadowMap) {
          this.VSMPass(shadow, camera);
        }
        shadow.needsUpdate = false;
      }
      this.needsUpdate = false;
      this._renderer.setRenderTarget(currentRenderTarget, activeCubeFace, activeMipmapLevel);
    }
    VSMPass(shadow, camera) {
      const geometry = this._objects.update(this.fullScreenMesh);
      this.shadowMaterialVertical.uniforms.shadow_pass.value = shadow.map.texture;
      this.shadowMaterialVertical.uniforms.resolution.value = shadow.mapSize;
      this.shadowMaterialVertical.uniforms.radius.value = shadow.radius;
      this._renderer.setRenderTarget(shadow.mapPass);
      this._renderer.clear();
      this._renderer.renderBufferDirect(camera, null, geometry, this.shadowMaterialVertical, this.fullScreenMesh, null);
      this.shadowMaterialHorizontal.uniforms.shadow_pass.value = shadow.mapPass.texture;
      this.shadowMaterialHorizontal.uniforms.resolution.value = shadow.mapSize;
      this.shadowMaterialHorizontal.uniforms.radius.value = shadow.radius;
      this._renderer.setRenderTarget(shadow.map);
      this._renderer.clear();
      this._renderer.renderBufferDirect(camera, null, geometry, this.shadowMaterialHorizontal, this.fullScreenMesh, null);
    }
    getDepthMaterialVariant(useMorphing, useSkinning, useInstancing) {
      const index = useMorphing << 0 | useSkinning << 1 | useInstancing << 2;
      let material = this._depthMaterials[index];
      if (material === undefined) {
        material = new module$materials$MeshDepthMaterial.MeshDepthMaterial({depthPacking:module$constants.RGBADepthPacking, morphTargets:useMorphing, skinning:useSkinning});
        this._depthMaterials[index] = material;
      }
      return material;
    }
    getDistanceMaterialVariant(useMorphing, useSkinning, useInstancing) {
      const index = useMorphing << 0 | useSkinning << 1 | useInstancing << 2;
      let material = this._distanceMaterials[index];
      if (material === undefined) {
        material = new module$materials$MeshDistanceMaterial.MeshDistanceMaterial({morphTargets:useMorphing, skinning:useSkinning});
        this._distanceMaterials[index] = material;
      }
      return material;
    }
    getDepthMaterial(object, geometry, material, light, shadowCameraNear, shadowCameraFar, type) {
      let result = null;
      let getMaterialVariant = this.getDepthMaterialVariant;
      let customMaterial = object.customDepthMaterial;
      if (light.isPointLight === true) {
        getMaterialVariant = this.getDistanceMaterialVariant;
        customMaterial = object.customDistanceMaterial;
      }
      if (customMaterial === undefined) {
        let useMorphing = false;
        if (material.morphTargets === true) {
          useMorphing = geometry.morphAttributes && geometry.morphAttributes.position && geometry.morphAttributes.position.length > 0;
        }
        let useSkinning = false;
        if (object.isSkinnedMesh === true) {
          if (material.skinning === true) {
            useSkinning = true;
          } else {
            console.warn("THREE.WebGLShadowMap: THREE.SkinnedMesh with material.skinning set to false:", object);
          }
        }
        const useInstancing = object.isInstancedMesh === true;
        result = getMaterialVariant(useMorphing, useSkinning, useInstancing);
      } else {
        result = customMaterial;
      }
      if (this._renderer.localClippingEnabled && material.clipShadows === true && material.clippingPlanes.length !== 0) {
        const keyA = result.uuid, keyB = material.uuid;
        let materialsForVariant = this._materialCache[keyA];
        if (materialsForVariant === undefined) {
          materialsForVariant = {};
          this._materialCache[keyA] = materialsForVariant;
        }
        let cachedMaterial = materialsForVariant[keyB];
        if (cachedMaterial === undefined) {
          cachedMaterial = result.clone();
          materialsForVariant[keyB] = cachedMaterial;
        }
        result = cachedMaterial;
      }
      result.visible = material.visible;
      result.wireframe = material.wireframe;
      if (type === module$constants.VSMShadowMap) {
        result.side = material.shadowSide !== null ? material.shadowSide : material.side;
      } else {
        result.side = material.shadowSide !== null ? material.shadowSide : this.shadowSide[material.side];
      }
      result.clipShadows = material.clipShadows;
      result.clippingPlanes = material.clippingPlanes;
      result.clipIntersection = material.clipIntersection;
      result.wireframeLinewidth = material.wireframeLinewidth;
      result.linewidth = material.linewidth;
      if (light.isPointLight === true && result.isMeshDistanceMaterial === true) {
        result.referencePosition.setFromMatrixPosition(light.matrixWorld);
        result.nearDistance = shadowCameraNear;
        result.farDistance = shadowCameraFar;
      }
      return result;
    }
    renderObject(object, camera, shadowCamera, light, type) {
      if (object.visible === false) {
        return;
      }
      const visible = object.layers.test(camera.layers);
      if (visible && (object.isMesh || object.isLine || object.isPoints)) {
        if ((object.castShadow || object.receiveShadow && type === module$constants.VSMShadowMap) && (!object.frustumCulled || this._frustum.intersectsObject(object))) {
          object.modelViewMatrix.multiplyMatrices(shadowCamera.matrixWorldInverse, object.matrixWorld);
          const geometry = this._objects.update(object);
          const material = object.material;
          if (Array.isArray(material)) {
            const groups = geometry.groups;
            for (let k = 0, kl = groups.length; k < kl; k++) {
              const group = groups[k];
              const groupMaterial = material[group.materialIndex];
              if (groupMaterial && groupMaterial.visible) {
                const depthMaterial = this.getDepthMaterial(object, geometry, groupMaterial, light, shadowCamera.near, shadowCamera.far, type);
                this._renderer.renderBufferDirect(shadowCamera, null, geometry, depthMaterial, object, group);
              }
            }
          } else {
            if (material.visible) {
              const depthMaterial = this.getDepthMaterial(object, geometry, material, light, shadowCamera.near, shadowCamera.far, type);
              this._renderer.renderBufferDirect(shadowCamera, null, geometry, depthMaterial, object, null);
            }
          }
        }
      }
      const children = object.children;
      for (let i = 0, l = children.length; i < l; i++) {
        this.renderObject(children[i], camera, shadowCamera, light, type);
      }
    }
  }
}, "renderers/webgl/WebGLShadowMap.js", ["constants.js", "renderers/WebGLRenderTarget.js", "materials/MeshDepthMaterial.js", "materials/MeshDistanceMaterial.js", "materials/ShaderMaterial.js", "core/BufferAttribute.js", "core/BufferGeometry.js", "objects/Mesh.js", "math/Vector4.js", "math/Vector2.js", "math/Frustum.js", "renderers/shaders/ShaderLib/vsm_frag.glsl.js", "renderers/shaders/ShaderLib/vsm_vert.glsl.js"]);

//renderers/webgl/WebGLState.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLState:{enumerable:true, get:function() {
    return WebGLState;
  }}});
  var module$constants = $$require("constants.js");
  var module$math$Vector4 = $$require("math/Vector4.js");
  var module$materials$Material = $$require("materials/Material.js");
  class ColorBuffer {
    constructor(state) {
      this.state = state;
      this.locked = false;
      this.color = new module$math$Vector4.Vector4;
      this.currentColorMask = null;
      this.currentColorClear = new module$math$Vector4.Vector4(0, 0, 0, 0);
    }
    setMask(colorMask) {
      if (this.currentColorMask !== colorMask && !this.locked) {
        this.state.gl.colorMask(colorMask, colorMask, colorMask, colorMask);
        this.currentColorMask = colorMask;
      }
    }
    setLocked(lock) {
      this.locked = lock;
    }
    setClear(r, g, b, a, premultipliedAlpha) {
      if (premultipliedAlpha === true) {
        r *= a;
        g *= a;
        b *= a;
      }
      this.color.set(r, g, b, a);
      if (this.currentColorClear.equals(this.color) === false) {
        this.state.gl.clearColor(r, g, b, a);
        this.currentColorClear.copy(this.color);
      }
    }
    reset() {
      this.locked = false;
      this.currentColorMask = null;
      this.currentColorClear.set(-1, 0, 0, 0);
    }
  }
  class DepthBuffer {
    constructor(state) {
      this.state = state;
      this.locked = false;
      this.currentDepthMask = null;
      this.currentDepthFunc = null;
      this.currentDepthClear = null;
    }
    setTest(depthTest) {
      if (depthTest) {
        this.state.enable(this.state.gl.DEPTH_TEST);
      } else {
        this.state.disable(this.state.gl.DEPTH_TEST);
      }
    }
    setMask(depthMask) {
      if (this.currentDepthMask !== depthMask && !this.locked) {
        this.state.gl.depthMask(depthMask);
        this.currentDepthMask = depthMask;
      }
    }
    setFunc(depthFunc) {
      if (this.currentDepthFunc !== depthFunc) {
        if (depthFunc) {
          switch(depthFunc) {
            case module$constants.NeverDepth:
              this.state.gl.depthFunc(this.state.gl.NEVER);
              break;
            case module$constants.AlwaysDepth:
              this.state.gl.depthFunc(this.state.gl.ALWAYS);
              break;
            case module$constants.LessDepth:
              this.state.gl.depthFunc(this.state.gl.LESS);
              break;
            case module$constants.LessEqualDepth:
              this.state.gl.depthFunc(this.state.gl.LEQUAL);
              break;
            case module$constants.EqualDepth:
              this.state.gl.depthFunc(this.state.gl.EQUAL);
              break;
            case module$constants.GreaterEqualDepth:
              this.state.gl.depthFunc(this.state.gl.GEQUAL);
              break;
            case module$constants.GreaterDepth:
              this.state.gl.depthFunc(this.state.gl.GREATER);
              break;
            case module$constants.NotEqualDepth:
              this.state.gl.depthFunc(this.state.gl.NOTEQUAL);
              break;
            default:
              this.state.gl.depthFunc(this.state.gl.LEQUAL);
          }
        } else {
          this.state.gl.depthFunc(this.state.gl.LEQUAL);
        }
        this.currentDepthFunc = depthFunc;
      }
    }
    setLocked(lock) {
      this.locked = lock;
    }
    setClear(depth) {
      if (this.state.currentDepthClear !== depth) {
        this.state.gl.clearDepth(depth);
        this.currentDepthClear = depth;
      }
    }
    reset() {
      this.locked = false;
      this.currentDepthMask = null;
      this.currentDepthFunc = null;
      this.currentDepthClear = null;
    }
  }
  class StencilBuffer {
    constructor(state) {
      this.state = state;
      this.locked = false;
      this.currentStencilMask = null;
      this.currentStencilFunc = null;
      this.currentStencilRef = null;
      this.currentStencilFuncMask = null;
      this.currentStencilFail = null;
      this.currentStencilZFail = null;
      this.currentStencilZPass = null;
      this.currentStencilClear = null;
    }
    setTest(stencilTest) {
      if (!this.locked) {
        if (stencilTest) {
          this.state.enable(this.state.gl.STENCIL_TEST);
        } else {
          this.state.disable(this.state.gl.STENCIL_TEST);
        }
      }
    }
    setMask(stencilMask) {
      if (this.currentStencilMask !== stencilMask && !this.locked) {
        this.state.gl.stencilMask(stencilMask);
        this.currentStencilMask = stencilMask;
      }
    }
    setFunc(stencilFunc, stencilRef, stencilMask) {
      if (this.currentStencilFunc !== stencilFunc || this.currentStencilRef !== stencilRef || this.currentStencilFuncMask !== stencilMask) {
        this.state.gl.stencilFunc(stencilFunc, stencilRef, stencilMask);
        this.currentStencilFunc = stencilFunc;
        this.currentStencilRef = stencilRef;
        this.currentStencilFuncMask = stencilMask;
      }
    }
    setOp(stencilFail, stencilZFail, stencilZPass) {
      if (this.currentStencilFail !== stencilFail || this.currentStencilZFail !== stencilZFail || this.currentStencilZPass !== stencilZPass) {
        this.state.gl.stencilOp(stencilFail, stencilZFail, stencilZPass);
        this.currentStencilFail = stencilFail;
        this.currentStencilZFail = stencilZFail;
        this.currentStencilZPass = stencilZPass;
      }
    }
    setLocked(lock) {
      this.locked = lock;
    }
    setClear(stencil) {
      if (this.currentStencilClear !== stencil) {
        this.state.gl.clearStencil(stencil);
        this.currentStencilClear = stencil;
      }
    }
    reset() {
      this.locked = false;
      this.currentStencilMask = null;
      this.currentStencilFunc = null;
      this.currentStencilRef = null;
      this.currentStencilFuncMask = null;
      this.currentStencilFail = null;
      this.currentStencilZFail = null;
      this.currentStencilZPass = null;
      this.currentStencilClear = null;
    }
  }
  class WebGLState {
    constructor(gl, extensions, capabilities) {
      this.gl = gl;
      this.extensions = extensions;
      this.capabilities = capabilities;
      this.isWebGL2 = capabilities.isWebGL2;
      this.colorBuffer = new ColorBuffer(this);
      this.depthBuffer = new DepthBuffer(this);
      this.stencilBuffer = new StencilBuffer(this);
      this.enabledCapabilities = {};
      this.currentProgram = null;
      this.currentBlendingEnabled = false;
      this.currentBlending = null;
      this.currentBlendEquation = null;
      this.currentBlendSrc = null;
      this.currentBlendDst = null;
      this.currentBlendEquationAlpha = null;
      this.currentBlendSrcAlpha = null;
      this.currentBlendDstAlpha = null;
      this.currentPremultipledAlpha = false;
      this.currentFlipSided = null;
      this.currentCullFace = null;
      this.currentLineWidth = null;
      this.currentPolygonOffsetFactor = null;
      this.currentPolygonOffsetUnits = null;
      this.maxTextures = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
      this.lineWidthAvailable = false;
      this.version = 0;
      const glVersion = gl.getParameter(gl.VERSION);
      if (glVersion.indexOf("WebGL") !== -1) {
        this.version = parseFloat(/^WebGL (\d)/.exec(glVersion)[1]);
        this.lineWidthAvailable = this.version >= 1.0;
      } else {
        if (glVersion.indexOf("OpenGL ES") !== -1) {
          this.version = parseFloat(/^OpenGL ES (\d)/.exec(glVersion)[1]);
          this.lineWidthAvailable = this.version >= 2.0;
        }
      }
      this.currentTextureSlot = null;
      this.currentBoundTextures = {};
      this.currentScissor = new module$math$Vector4.Vector4;
      this.currentViewport = new module$math$Vector4.Vector4;
      function createTexture(type, target, count) {
        const data = new Uint8Array(4);
        const texture = gl.createTexture();
        gl.bindTexture(type, texture);
        gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        for (let i = 0; i < count; i++) {
          gl.texImage2D(target + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        }
        return texture;
      }
      const emptyTextures = {};
      emptyTextures[gl.TEXTURE_2D] = createTexture(gl.TEXTURE_2D, gl.TEXTURE_2D, 1);
      emptyTextures[gl.TEXTURE_CUBE_MAP] = createTexture(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_CUBE_MAP_POSITIVE_X, 6);
      this.emptyTextures = emptyTextures;
      this.colorBuffer.setClear(0, 0, 0, 1);
      this.depthBuffer.setClear(1);
      this.stencilBuffer.setClear(0);
      this.buffers = {color:this.colorBuffer, depth:this.depthBuffer, stencil:this.stencilBuffer};
      this.enable(gl.DEPTH_TEST);
      this.depthBuffer.setFunc(module$constants.LessEqualDepth);
      this.setFlipSided(false);
      this.setCullFace(module$constants.CullFaceBack);
      this.enable(this.gl.CULL_FACE);
      this.setBlending(module$constants.NoBlending);
      this.equationToGL = {[module$constants.AddEquation]:gl.FUNC_ADD, [module$constants.SubtractEquation]:gl.FUNC_SUBTRACT, [module$constants.ReverseSubtractEquation]:gl.FUNC_REVERSE_SUBTRACT};
      if (this.isWebGL2) {
        this.equationToGL[module$constants.MinEquation] = gl.MIN;
        this.equationToGL[module$constants.MaxEquation] = gl.MAX;
      } else {
        const extension = this.extensions.get("EXT_blend_minmax");
        if (extension !== null) {
          this.equationToGL[module$constants.MinEquation] = extension.MIN_EXT;
          this.equationToGL[module$constants.MaxEquation] = extension.MAX_EXT;
        }
      }
      this.factorToGL = {[module$constants.ZeroFactor]:gl.ZERO, [module$constants.OneFactor]:gl.ONE, [module$constants.SrcColorFactor]:gl.SRC_COLOR, [module$constants.SrcAlphaFactor]:gl.SRC_ALPHA, [module$constants.SrcAlphaSaturateFactor]:gl.SRC_ALPHA_SATURATE, [module$constants.DstColorFactor]:gl.DST_COLOR, [module$constants.DstAlphaFactor]:gl.DST_ALPHA, [module$constants.OneMinusSrcColorFactor]:gl.ONE_MINUS_SRC_COLOR, [module$constants.OneMinusSrcAlphaFactor]:gl.ONE_MINUS_SRC_ALPHA, [module$constants.OneMinusDstColorFactor]:gl.ONE_MINUS_DST_COLOR, 
      [module$constants.OneMinusDstAlphaFactor]:gl.ONE_MINUS_DST_ALPHA};
    }
    enable(id) {
      if (this.enabledCapabilities[id] !== true) {
        this.gl.enable(id);
        this.enabledCapabilities[id] = true;
      }
    }
    disable(id) {
      if (this.enabledCapabilities[id] !== false) {
        this.gl.disable(id);
        this.enabledCapabilities[id] = false;
      }
    }
    useProgram(program) {
      if (this.currentProgram !== program) {
        this.gl.useProgram(program);
        this.currentProgram = program;
        return true;
      }
      return false;
    }
    setBlending(blending, blendEquation, blendSrc, blendDst, blendEquationAlpha, blendSrcAlpha, blendDstAlpha, premultipliedAlpha) {
      if (blending === module$constants.NoBlending) {
        if (this.currentBlendingEnabled === true) {
          this.disable(this.gl.BLEND);
          this.currentBlendingEnabled = false;
        }
        return;
      }
      if (this.currentBlendingEnabled === false) {
        this.enable(this.gl.BLEND);
        this.currentBlendingEnabled = true;
      }
      if (blending !== module$constants.CustomBlending) {
        if (blending !== this.currentBlending || premultipliedAlpha !== this.currentPremultipledAlpha) {
          if (this.currentBlendEquation !== module$constants.AddEquation || this.currentBlendEquationAlpha !== module$constants.AddEquation) {
            this.gl.blendEquation(this.gl.FUNC_ADD);
            this.currentBlendEquation = module$constants.AddEquation;
            this.currentBlendEquationAlpha = module$constants.AddEquation;
          }
          if (premultipliedAlpha) {
            switch(blending) {
              case module$constants.NormalBlending:
                this.gl.blendFuncSeparate(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
                break;
              case module$constants.AdditiveBlending:
                this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
                break;
              case module$constants.SubtractiveBlending:
                this.gl.blendFuncSeparate(this.gl.ZERO, this.gl.ZERO, this.gl.ONE_MINUS_SRC_COLOR, this.gl.ONE_MINUS_SRC_ALPHA);
                break;
              case module$constants.MultiplyBlending:
                this.gl.blendFuncSeparate(this.gl.ZERO, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.SRC_ALPHA);
                break;
              default:
                console.error("THREE.WebGLState: Invalid blending: ", blending);
                break;
            }
          } else {
            switch(blending) {
              case module$constants.NormalBlending:
                this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
                break;
              case module$constants.AdditiveBlending:
                this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
                break;
              case module$constants.SubtractiveBlending:
                this.gl.blendFunc(this.gl.ZERO, this.gl.ONE_MINUS_SRC_COLOR);
                break;
              case module$constants.MultiplyBlending:
                this.gl.blendFunc(this.gl.ZERO, this.gl.SRC_COLOR);
                break;
              default:
                console.error("THREE.WebGLState: Invalid blending: ", blending);
                break;
            }
          }
          this.currentBlendSrc = null;
          this.currentBlendDst = null;
          this.currentBlendSrcAlpha = null;
          this.currentBlendDstAlpha = null;
          this.currentBlending = blending;
          this.currentPremultipledAlpha = premultipliedAlpha;
        }
        return;
      }
      blendEquationAlpha = blendEquationAlpha || blendEquation;
      blendSrcAlpha = blendSrcAlpha || blendSrc;
      blendDstAlpha = blendDstAlpha || blendDst;
      if (blendEquation !== this.currentBlendEquation || blendEquationAlpha !== this.currentBlendEquationAlpha) {
        this.gl.blendEquationSeparate(this.equationToGL[blendEquation], this.equationToGL[blendEquationAlpha]);
        this.currentBlendEquation = blendEquation;
        this.currentBlendEquationAlpha = blendEquationAlpha;
      }
      if (blendSrc !== this.currentBlendSrc || blendDst !== this.currentBlendDst || blendSrcAlpha !== this.currentBlendSrcAlpha || blendDstAlpha !== this.currentBlendDstAlpha) {
        this.gl.blendFuncSeparate(this.factorToGL[blendSrc], this.factorToGL[blendDst], this.factorToGL[blendSrcAlpha], this.factorToGL[blendDstAlpha]);
        this.currentBlendSrc = blendSrc;
        this.currentBlendDst = blendDst;
        this.currentBlendSrcAlpha = blendSrcAlpha;
        this.currentBlendDstAlpha = blendDstAlpha;
      }
      this.currentBlending = blending;
      this.currentPremultipledAlpha = null;
    }
    setMaterial(material, frontFaceCW) {
      material.side === module$constants.DoubleSide ? this.disable(this.gl.CULL_FACE) : this.enable(this.gl.CULL_FACE);
      let flipSided = material.side === module$constants.BackSide;
      if (frontFaceCW) {
        flipSided = !flipSided;
      }
      this.setFlipSided(flipSided);
      material.blending === module$constants.NormalBlending && material.transparent === false ? this.setBlending(module$constants.NoBlending) : this.setBlending(material.blending, material.blendEquation, material.blendSrc, material.blendDst, material.blendEquationAlpha, material.blendSrcAlpha, material.blendDstAlpha, material.premultipliedAlpha);
      this.depthBuffer.setFunc(material.depthFunc);
      this.depthBuffer.setTest(material.depthTest);
      this.depthBuffer.setMask(material.depthWrite);
      this.colorBuffer.setMask(material.colorWrite);
      const stencilWrite = material.stencilWrite;
      this.stencilBuffer.setTest(stencilWrite);
      if (stencilWrite) {
        this.stencilBuffer.setMask(material.stencilWriteMask);
        this.stencilBuffer.setFunc(material.stencilFunc, material.stencilRef, material.stencilFuncMask);
        this.stencilBuffer.setOp(material.stencilFail, material.stencilZFail, material.stencilZPass);
      }
      this.setPolygonOffset(material.polygonOffset, material.polygonOffsetFactor, material.polygonOffsetUnits);
    }
    setFlipSided(flipSided) {
      if (this.currentFlipSided !== flipSided) {
        if (flipSided) {
          this.gl.frontFace(this.gl.CW);
        } else {
          this.gl.frontFace(this.gl.CCW);
        }
        this.currentFlipSided = flipSided;
      }
    }
    setCullFace(cullFace) {
      if (cullFace !== module$constants.CullFaceNone) {
        this.enable(this.gl.CULL_FACE);
        if (cullFace !== this.currentCullFace) {
          if (cullFace === module$constants.CullFaceBack) {
            this.gl.cullFace(this.gl.BACK);
          } else {
            if (cullFace === module$constants.CullFaceFront) {
              this.gl.cullFace(this.gl.FRONT);
            } else {
              this.gl.cullFace(this.gl.FRONT_AND_BACK);
            }
          }
        }
      } else {
        this.disable(this.gl.CULL_FACE);
      }
      this.currentCullFace = cullFace;
    }
    setLineWidth(width) {
      if (width !== this.currentLineWidth) {
        if (this.lineWidthAvailable) {
          this.gl.lineWidth(width);
        }
        this.currentLineWidth = width;
      }
    }
    setPolygonOffset(polygonOffset, factor, units) {
      if (polygonOffset) {
        this.enable(this.gl.POLYGON_OFFSET_FILL);
        if (this.currentPolygonOffsetFactor !== factor || this.currentPolygonOffsetUnits !== units) {
          this.gl.polygonOffset(factor, units);
          this.currentPolygonOffsetFactor = factor;
          this.currentPolygonOffsetUnits = units;
        }
      } else {
        this.disable(this.gl.POLYGON_OFFSET_FILL);
      }
    }
    setScissorTest(scissorTest) {
      if (scissorTest) {
        this.enable(this.gl.SCISSOR_TEST);
      } else {
        this.disable(this.gl.SCISSOR_TEST);
      }
    }
    activeTexture(webglSlot) {
      if (webglSlot === undefined) {
        webglSlot = this.gl.TEXTURE0 + this.maxTextures - 1;
      }
      if (this.currentTextureSlot !== webglSlot) {
        this.gl.activeTexture(webglSlot);
        this.currentTextureSlot = webglSlot;
      }
    }
    bindTexture(webglType, webglTexture) {
      if (this.currentTextureSlot === null) {
        this.activeTexture();
      }
      let boundTexture = this.currentBoundTextures[this.currentTextureSlot];
      if (boundTexture === undefined) {
        boundTexture = {type:undefined, texture:undefined};
        this.currentBoundTextures[this.currentTextureSlot] = boundTexture;
      }
      if (boundTexture.type !== webglType || boundTexture.texture !== webglTexture) {
        this.gl.bindTexture(webglType, webglTexture || this.emptyTextures[webglType]);
        boundTexture.type = webglType;
        boundTexture.texture = webglTexture;
      }
    }
    unbindTexture() {
      const boundTexture = this.currentBoundTextures[this.currentTextureSlot];
      if (boundTexture !== undefined && boundTexture.type !== undefined) {
        this.gl.bindTexture(boundTexture.type, null);
        boundTexture.type = undefined;
        boundTexture.texture = undefined;
      }
    }
    compressedTexImage2D() {
      try {
        this.gl.compressedTexImage2D.apply(this.gl, arguments);
      } catch (error) {
        console.error("THREE.WebGLState:", error);
      }
    }
    texImage2D() {
      try {
        this.gl.texImage2D.apply(this.gl, arguments);
      } catch (error) {
        console.error("THREE.WebGLState:", error);
      }
    }
    texImage3D() {
      try {
        this.gl.texImage3D.apply(this.gl, arguments);
      } catch (error) {
        console.error("THREE.WebGLState:", error);
      }
    }
    scissor(scissor) {
      if (this.currentScissor.equals(scissor) === false) {
        this.gl.scissor(scissor.x, scissor.y, scissor.z, scissor.w);
        this.currentScissor.copy(scissor);
      }
    }
    viewport(viewport) {
      if (this.currentViewport.equals(viewport) === false) {
        this.gl.viewport(viewport.x, viewport.y, viewport.z, viewport.w);
        this.currentViewport.copy(viewport);
      }
    }
    reset() {
      this.gl.disable(this.gl.BLEND);
      this.gl.disable(this.gl.CULL_FACE);
      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.disable(this.gl.POLYGON_OFFSET_FILL);
      this.gl.disable(this.gl.SCISSOR_TEST);
      this.gl.disable(this.gl.STENCIL_TEST);
      this.gl.blendEquation(this.gl.FUNC_ADD);
      this.gl.blendFunc(this.gl.ONE, this.gl.ZERO);
      this.gl.blendFuncSeparate(this.gl.ONE, this.gl.ZERO, this.gl.ONE, this.gl.ZERO);
      this.gl.colorMask(true, true, true, true);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.depthMask(true);
      this.gl.depthFunc(this.gl.LESS);
      this.gl.clearDepth(1);
      this.gl.stencilMask(4294967295);
      this.gl.stencilFunc(this.gl.ALWAYS, 0, 4294967295);
      this.gl.stencilOp(this.gl.KEEP, this.gl.KEEP, this.gl.KEEP);
      this.gl.clearStencil(0);
      this.gl.cullFace(this.gl.BACK);
      this.gl.frontFace(this.gl.CCW);
      this.gl.polygonOffset(0, 0);
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.useProgram(null);
      this.gl.lineWidth(1);
      this.gl.scissor(0, 0, this.gl.canvas.width, this.gl.canvas.height);
      this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
      this.enabledCapabilities = {};
      this.currentTextureSlot = null;
      this.currentBoundTextures = {};
      this.currentProgram = null;
      this.currentBlendingEnabled = false;
      this.currentBlending = null;
      this.currentBlendEquation = null;
      this.currentBlendSrc = null;
      this.currentBlendDst = null;
      this.currentBlendEquationAlpha = null;
      this.currentBlendSrcAlpha = null;
      this.currentBlendDstAlpha = null;
      this.currentPremultipledAlpha = false;
      this.currentFlipSided = null;
      this.currentCullFace = null;
      this.currentLineWidth = null;
      this.currentPolygonOffsetFactor = null;
      this.currentPolygonOffsetUnits = null;
      this.colorBuffer.reset();
      this.depthBuffer.reset();
      this.stencilBuffer.reset();
    }
  }
}, "renderers/webgl/WebGLState.js", ["constants.js", "math/Vector4.js", "materials/Material.js"]);

//renderers/webgl/WebGLUtils.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLUtils:{enumerable:true, get:function() {
    return WebGLUtils;
  }}});
  var module$constants = $$require("constants.js");
  class WebGLUtils {
    constructor(gl, extensions, capabilities) {
      this.gl = gl;
      this.extensions = extensions;
      this.capabilities = capabilities;
      this.isWebGL2 = capabilities.isWebGL2;
    }
    convert(p) {
      let extension;
      if (p === module$constants.UnsignedByteType) {
        return this.gl.UNSIGNED_BYTE;
      }
      if (p === module$constants.UnsignedShort4444Type) {
        return this.gl.UNSIGNED_SHORT_4_4_4_4;
      }
      if (p === module$constants.UnsignedShort5551Type) {
        return this.gl.UNSIGNED_SHORT_5_5_5_1;
      }
      if (p === module$constants.UnsignedShort565Type) {
        return this.gl.UNSIGNED_SHORT_5_6_5;
      }
      if (p === module$constants.ByteType) {
        return this.gl.BYTE;
      }
      if (p === module$constants.ShortType) {
        return this.gl.SHORT;
      }
      if (p === module$constants.UnsignedShortType) {
        return this.gl.UNSIGNED_SHORT;
      }
      if (p === module$constants.IntType) {
        return this.gl.INT;
      }
      if (p === module$constants.UnsignedIntType) {
        return this.gl.UNSIGNED_INT;
      }
      if (p === module$constants.FloatType) {
        return this.gl.FLOAT;
      }
      if (p === module$constants.HalfFloatType) {
        if (this.isWebGL2) {
          return this.gl.HALF_FLOAT;
        }
        extension = this.extensions.get("OES_texture_half_float");
        if (extension !== null) {
          return extension.HALF_FLOAT_OES;
        } else {
          return null;
        }
      }
      if (p === module$constants.AlphaFormat) {
        return this.gl.ALPHA;
      }
      if (p === module$constants.RGBFormat) {
        return this.gl.RGB;
      }
      if (p === module$constants.RGBAFormat) {
        return this.gl.RGBA;
      }
      if (p === module$constants.LuminanceFormat) {
        return this.gl.LUMINANCE;
      }
      if (p === module$constants.LuminanceAlphaFormat) {
        return this.gl.LUMINANCE_ALPHA;
      }
      if (p === module$constants.DepthFormat) {
        return this.gl.DEPTH_COMPONENT;
      }
      if (p === module$constants.DepthStencilFormat) {
        return this.gl.DEPTH_STENCIL;
      }
      if (p === module$constants.RedFormat) {
        return this.gl.RED;
      }
      if (p === module$constants.RedIntegerFormat) {
        return this.gl.RED_INTEGER;
      }
      if (p === module$constants.RGFormat) {
        return this.gl.RG;
      }
      if (p === module$constants.RGIntegerFormat) {
        return this.gl.RG_INTEGER;
      }
      if (p === module$constants.RGBIntegerFormat) {
        return this.gl.RGB_INTEGER;
      }
      if (p === module$constants.RGBAIntegerFormat) {
        return this.gl.RGBA_INTEGER;
      }
      if (p === module$constants.RGB_S3TC_DXT1_Format || p === module$constants.RGBA_S3TC_DXT1_Format || p === module$constants.RGBA_S3TC_DXT3_Format || p === module$constants.RGBA_S3TC_DXT5_Format) {
        extension = this.extensions.get("WEBGL_compressed_texture_s3tc");
        if (extension !== null) {
          if (p === module$constants.RGB_S3TC_DXT1_Format) {
            return extension.COMPRESSED_RGB_S3TC_DXT1_EXT;
          }
          if (p === module$constants.RGBA_S3TC_DXT1_Format) {
            return extension.COMPRESSED_RGBA_S3TC_DXT1_EXT;
          }
          if (p === module$constants.RGBA_S3TC_DXT3_Format) {
            return extension.COMPRESSED_RGBA_S3TC_DXT3_EXT;
          }
          if (p === module$constants.RGBA_S3TC_DXT5_Format) {
            return extension.COMPRESSED_RGBA_S3TC_DXT5_EXT;
          }
        } else {
          return null;
        }
      }
      if (p === module$constants.RGB_PVRTC_4BPPV1_Format || p === module$constants.RGB_PVRTC_2BPPV1_Format || p === module$constants.RGBA_PVRTC_4BPPV1_Format || p === module$constants.RGBA_PVRTC_2BPPV1_Format) {
        extension = this.extensions.get("WEBGL_compressed_texture_pvrtc");
        if (extension !== null) {
          if (p === module$constants.RGB_PVRTC_4BPPV1_Format) {
            return extension.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
          }
          if (p === module$constants.RGB_PVRTC_2BPPV1_Format) {
            return extension.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
          }
          if (p === module$constants.RGBA_PVRTC_4BPPV1_Format) {
            return extension.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
          }
          if (p === module$constants.RGBA_PVRTC_2BPPV1_Format) {
            return extension.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
          }
        } else {
          return null;
        }
      }
      if (p === module$constants.RGB_ETC1_Format) {
        extension = this.extensions.get("WEBGL_compressed_texture_etc1");
        if (extension !== null) {
          return extension.COMPRESSED_RGB_ETC1_WEBGL;
        } else {
          return null;
        }
      }
      if (p === module$constants.RGB_ETC2_Format || p === module$constants.RGBA_ETC2_EAC_Format) {
        extension = this.extensions.get("WEBGL_compressed_texture_etc");
        if (extension !== null) {
          if (p === module$constants.RGB_ETC2_Format) {
            return extension.COMPRESSED_RGB8_ETC2;
          }
          if (p === module$constants.RGBA_ETC2_EAC_Format) {
            return extension.COMPRESSED_RGBA8_ETC2_EAC;
          }
        }
      }
      if (p === module$constants.RGBA_ASTC_4x4_Format || p === module$constants.RGBA_ASTC_5x4_Format || p === module$constants.RGBA_ASTC_5x5_Format || p === module$constants.RGBA_ASTC_6x5_Format || p === module$constants.RGBA_ASTC_6x6_Format || p === module$constants.RGBA_ASTC_8x5_Format || p === module$constants.RGBA_ASTC_8x6_Format || p === module$constants.RGBA_ASTC_8x8_Format || p === module$constants.RGBA_ASTC_10x5_Format || p === module$constants.RGBA_ASTC_10x6_Format || p === module$constants.RGBA_ASTC_10x8_Format || 
      p === module$constants.RGBA_ASTC_10x10_Format || p === module$constants.RGBA_ASTC_12x10_Format || p === module$constants.RGBA_ASTC_12x12_Format || p === module$constants.SRGB8_ALPHA8_ASTC_4x4_Format || p === module$constants.SRGB8_ALPHA8_ASTC_5x4_Format || p === module$constants.SRGB8_ALPHA8_ASTC_5x5_Format || p === module$constants.SRGB8_ALPHA8_ASTC_6x5_Format || p === module$constants.SRGB8_ALPHA8_ASTC_6x6_Format || p === module$constants.SRGB8_ALPHA8_ASTC_8x5_Format || p === module$constants.SRGB8_ALPHA8_ASTC_8x6_Format || 
      p === module$constants.SRGB8_ALPHA8_ASTC_8x8_Format || p === module$constants.SRGB8_ALPHA8_ASTC_10x5_Format || p === module$constants.SRGB8_ALPHA8_ASTC_10x6_Format || p === module$constants.SRGB8_ALPHA8_ASTC_10x8_Format || p === module$constants.SRGB8_ALPHA8_ASTC_10x10_Format || p === module$constants.SRGB8_ALPHA8_ASTC_12x10_Format || p === module$constants.SRGB8_ALPHA8_ASTC_12x12_Format) {
        extension = this.extensions.get("WEBGL_compressed_texture_astc");
        if (extension !== null) {
          return p;
        } else {
          return null;
        }
      }
      if (p === module$constants.RGBA_BPTC_Format) {
        extension = this.extensions.get("EXT_texture_compression_bptc");
        if (extension !== null) {
          return p;
        } else {
          return null;
        }
      }
      if (p === module$constants.UnsignedInt248Type) {
        if (this.isWebGL2) {
          return this.gl.UNSIGNED_INT_24_8;
        }
        extension = this.extensions.get("WEBGL_depth_texture");
        if (extension !== null) {
          return extension.UNSIGNED_INT_24_8_WEBGL;
        } else {
          return null;
        }
      }
    }
  }
}, "renderers/webgl/WebGLUtils.js", ["constants.js"]);

//cameras/ArrayCamera.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {ArrayCamera:{enumerable:true, get:function() {
    return ArrayCamera;
  }}});
  var module$cameras$PerspectiveCamera = $$require("cameras/PerspectiveCamera.js");
  class ArrayCamera extends module$cameras$PerspectiveCamera.PerspectiveCamera {
    constructor(array = []) {
      super();
      this.cameras = array;
      this.isArrayCamera = true;
    }
  }
}, "cameras/ArrayCamera.js", ["cameras/PerspectiveCamera.js"]);

//objects/Group.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {Group:{enumerable:true, get:function() {
    return Group;
  }}});
  var module$core$Object3D = $$require("core/Object3D.js");
  class Group extends module$core$Object3D.Object3D {
    constructor() {
      super();
      this.type = "Group";
      this.isGroup = true;
      this.joints;
      this.inputState;
    }
  }
}, "objects/Group.js", ["core/Object3D.js"]);

//renderers/webxr/WebXRController.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebXRController:{enumerable:true, get:function() {
    return WebXRController;
  }}});
  var module$objects$Group = $$require("objects/Group.js");
  class WebXRController {
    constructor() {
      this._targetRay = null;
      this._grip = null;
      this._hand = null;
    }
    getHandSpace() {
      if (this._hand === null) {
        this._hand = new module$objects$Group.Group;
        this._hand.matrixAutoUpdate = false;
        this._hand.visible = false;
        this._hand.joints = {};
        this._hand.inputState = {pinching:false};
      }
      return this._hand;
    }
    getTargetRaySpace() {
      if (this._targetRay === null) {
        this._targetRay = new module$objects$Group.Group;
        this._targetRay.matrixAutoUpdate = false;
        this._targetRay.visible = false;
      }
      return this._targetRay;
    }
    getGripSpace() {
      if (this._grip === null) {
        this._grip = new module$objects$Group.Group;
        this._grip.matrixAutoUpdate = false;
        this._grip.visible = false;
      }
      return this._grip;
    }
    dispatchEvent(event) {
      if (this._targetRay !== null) {
        this._targetRay.dispatchEvent(event);
      }
      if (this._grip !== null) {
        this._grip.dispatchEvent(event);
      }
      if (this._hand !== null) {
        this._hand.dispatchEvent(event);
      }
      return this;
    }
    disconnect(inputSource) {
      this.dispatchEvent({type:"disconnected", data:inputSource});
      if (this._targetRay !== null) {
        this._targetRay.visible = false;
      }
      if (this._grip !== null) {
        this._grip.visible = false;
      }
      if (this._hand !== null) {
        this._hand.visible = false;
      }
      return this;
    }
    update(inputSource, frame, referenceSpace) {
      let inputPose = null;
      let gripPose = null;
      let handPose = null;
      const targetRay = this._targetRay;
      const grip = this._grip;
      const hand = this._hand;
      if (inputSource && frame.session.visibilityState !== "visible-blurred") {
        if (hand && inputSource.hand) {
          handPose = true;
          for (const inputjoint of inputSource.hand.values()) {
            const jointPose = frame.getJointPose(inputjoint, referenceSpace);
            if (hand.joints[inputjoint.jointName] === undefined) {
              const joint = new module$objects$Group.Group;
              joint.matrixAutoUpdate = false;
              joint.visible = false;
              hand.joints[inputjoint.jointName] = joint;
              hand.add(joint);
            }
            const joint = hand.joints[inputjoint.jointName];
            if (jointPose !== null) {
              joint.matrix.fromArray(jointPose.transform.matrix);
              joint.matrix.decompose(joint.position, joint.rotation, joint.scale);
              joint.jointRadius = jointPose.radius;
            }
            joint.visible = jointPose !== null;
          }
          const indexTip = hand.joints["index-finger-tip"];
          const thumbTip = hand.joints["thumb-tip"];
          const distance = indexTip.position.distanceTo(thumbTip.position);
          const distanceToPinch = 0.02;
          const threshold = 0.005;
          if (hand.inputState.pinching && distance > distanceToPinch + threshold) {
            hand.inputState.pinching = false;
            this.dispatchEvent({type:"pinchend", handedness:inputSource.handedness, target:this});
          } else {
            if (!hand.inputState.pinching && distance <= distanceToPinch - threshold) {
              hand.inputState.pinching = true;
              this.dispatchEvent({type:"pinchstart", handedness:inputSource.handedness, target:this});
            }
          }
        } else {
          if (targetRay !== null) {
            inputPose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
            if (inputPose !== null) {
              targetRay.matrix.fromArray(inputPose.transform.matrix);
              targetRay.matrix.decompose(targetRay.position, targetRay.rotation, targetRay.scale);
            }
          }
          if (grip !== null && inputSource.gripSpace) {
            gripPose = frame.getPose(inputSource.gripSpace, referenceSpace);
            if (gripPose !== null) {
              grip.matrix.fromArray(gripPose.transform.matrix);
              grip.matrix.decompose(grip.position, grip.rotation, grip.scale);
            }
          }
        }
      }
      if (targetRay !== null) {
        targetRay.visible = inputPose !== null;
      }
      if (grip !== null) {
        grip.visible = gripPose !== null;
      }
      if (hand !== null) {
        hand.visible = handPose !== null;
      }
      return this;
    }
  }
}, "renderers/webxr/WebXRController.js", ["objects/Group.js"]);

//renderers/webxr/WebXRManager.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebXRManager:{enumerable:true, get:function() {
    return WebXRManager;
  }}});
  var module$cameras$ArrayCamera = $$require("cameras/ArrayCamera.js");
  var module$core$EventDispatcher = $$require("core/EventDispatcher.js");
  var module$cameras$PerspectiveCamera = $$require("cameras/PerspectiveCamera.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$math$Vector4 = $$require("math/Vector4.js");
  var module$renderers$webgl$WebGLAnimation = $$require("renderers/webgl/WebGLAnimation.js");
  var module$renderers$webxr$WebXRController = $$require("renderers/webxr/WebXRController.js");
  const cameraLPos = new module$math$Vector3.Vector3;
  const cameraRPos = new module$math$Vector3.Vector3;
  const animation = new module$renderers$webgl$WebGLAnimation.WebGLAnimation;
  class WebXRManager extends module$core$EventDispatcher.EventDispatcher {
    constructor(renderer, gl) {
      super();
      this.scope = this;
      this.session = null;
      this.renderer = renderer;
      this.gl = gl;
      this.framebufferScaleFactor = 1.0;
      this.referenceSpace = null;
      this.referenceSpaceType = "local-floor";
      this.pose = null;
      this.controllers = [];
      this.inputSourcesMap = new Map;
      this.cameraL = new module$cameras$PerspectiveCamera.PerspectiveCamera;
      this.cameraL.layers.enable(1);
      this.cameraL.viewport = new module$math$Vector4.Vector4;
      this.cameraR = new module$cameras$PerspectiveCamera.PerspectiveCamera;
      this.cameraR.layers.enable(2);
      this.cameraR.viewport = new module$math$Vector4.Vector4;
      this.cameras = [this.cameraL, this.cameraR];
      this.cameraVR = new module$cameras$ArrayCamera.ArrayCamera;
      this.cameraVR.layers.enable(1);
      this.cameraVR.layers.enable(2);
      this._currentDepthNear = null;
      this._currentDepthFar = null;
      this.enabled = false;
      this.isPresenting = false;
      this.onAnimationFrameCallback = null;
      animation.setAnimationLoop(this.onAnimationFrame);
      this.dispose = function() {
      };
    }
    getController(index) {
      let controller = this.controllers[index];
      if (controller === undefined) {
        controller = new module$renderers$webxr$WebXRController.WebXRController;
        this.controllers[index] = controller;
      }
      return controller.getTargetRaySpace();
    }
    getControllerGrip(index) {
      let controller = this.controllers[index];
      if (controller === undefined) {
        controller = new module$renderers$webxr$WebXRController.WebXRController;
        this.controllers[index] = controller;
      }
      return controller.getGripSpace();
    }
    getHand(index) {
      let controller = this.controllers[index];
      if (controller === undefined) {
        controller = new module$renderers$webxr$WebXRController.WebXRController;
        this.controllers[index] = controller;
      }
      return controller.getHandSpace();
    }
    onSessionEvent(event) {
      const controller = this.inputSourcesMap.get(event.inputSource);
      if (controller) {
        controller.dispatchEvent({type:event.type, data:event.inputSource});
      }
    }
    onSessionEnd() {
      this.inputSourcesMap.forEach(function(controller, inputSource) {
        controller.disconnect(inputSource);
      });
      this.inputSourcesMap.clear();
      this._currentDepthNear = null;
      this._currentDepthFar = null;
      this.renderer.setFramebuffer(null);
      this.renderer.setRenderTarget(this.renderer.getRenderTarget());
      animation.stop();
      this.scope.isPresenting = false;
      this.scope.dispatchEvent({type:"sessionend"});
    }
    setFramebufferScaleFactor(value) {
      this.framebufferScaleFactor = value;
      if (this.scope.isPresenting === true) {
        console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.");
      }
    }
    setReferenceSpaceType(value) {
      this.referenceSpaceType = value;
      if (this.scope.isPresenting === true) {
        console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.");
      }
    }
    getReferenceSpace() {
      return this.referenceSpace;
    }
    getSession() {
      return this.session;
    }
    async setSession(value) {
      this.session = value;
      if (this.session !== null) {
        this.session.addEventListener("select", this.onSessionEvent);
        this.session.addEventListener("selectstart", this.onSessionEvent);
        this.session.addEventListener("selectend", this.onSessionEvent);
        this.session.addEventListener("squeeze", this.onSessionEvent);
        this.session.addEventListener("squeezestart", this.onSessionEvent);
        this.session.addEventListener("squeezeend", this.onSessionEvent);
        this.session.addEventListener("end", this.onSessionEnd);
        this.session.addEventListener("inputsourceschange", this.onInputSourcesChange);
        const attributes = this.gl.getContextAttributes();
        if (attributes.xrCompatible !== true) {
          await this.gl.makeXRCompatible();
        }
        const layerInit = {antialias:attributes.antialias, alpha:attributes.alpha, depth:attributes.depth, stencil:attributes.stencil, framebufferScaleFactor:this.framebufferScaleFactor};
        const baseLayer = new XRWebGLLayer(this.session, this.gl, layerInit);
        this.session.updateRenderState({baseLayer:baseLayer});
        this.referenceSpace = await this.session.requestReferenceSpace(this.referenceSpaceType);
        animation.setContext(this.session);
        animation.start();
        this.scope.isPresenting = true;
        this.scope.dispatchEvent({type:"sessionstart"});
      }
    }
    onInputSourcesChange(event) {
      const inputSources = this.session.inputSources;
      for (let i = 0; i < this.controllers.length; i++) {
        this.inputSourcesMap.set(inputSources[i], this.controllers[i]);
      }
      for (let i = 0; i < event.removed.length; i++) {
        const inputSource = event.removed[i];
        const controller = this.inputSourcesMap.get(inputSource);
        if (controller) {
          controller.dispatchEvent({type:"disconnected", data:inputSource});
          this.inputSourcesMap["delete"](inputSource);
        }
      }
      for (let i = 0; i < event.added.length; i++) {
        const inputSource = event.added[i];
        const controller = this.inputSourcesMap.get(inputSource);
        if (controller) {
          controller.dispatchEvent({type:"connected", data:inputSource});
        }
      }
    }
    setProjectionFromUnion(camera, cameraL, cameraR) {
      cameraLPos.setFromMatrixPosition(cameraL.matrixWorld);
      cameraRPos.setFromMatrixPosition(cameraR.matrixWorld);
      const ipd = cameraLPos.distanceTo(cameraRPos);
      const projL = cameraL.projectionMatrix.elements;
      const projR = cameraR.projectionMatrix.elements;
      const near = projL[14] / (projL[10] - 1);
      const far = projL[14] / (projL[10] + 1);
      const topFov = (projL[9] + 1) / projL[5];
      const bottomFov = (projL[9] - 1) / projL[5];
      const leftFov = (projL[8] - 1) / projL[0];
      const rightFov = (projR[8] + 1) / projR[0];
      const left = near * leftFov;
      const right = near * rightFov;
      const zOffset = ipd / (-leftFov + rightFov);
      const xOffset = zOffset * -leftFov;
      cameraL.matrixWorld.decompose(camera.position, camera.quaternion, camera.scale);
      camera.translateX(xOffset);
      camera.translateZ(zOffset);
      camera.matrixWorld.compose(camera.position, camera.quaternion, camera.scale);
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const near2 = near + zOffset;
      const far2 = far + zOffset;
      const left2 = left - xOffset;
      const right2 = right + (ipd - xOffset);
      const top2 = topFov * far / far2 * near2;
      const bottom2 = bottomFov * far / far2 * near2;
      camera.projectionMatrix.makePerspective(left2, right2, top2, bottom2, near2, far2);
    }
    updateCamera(camera, parent) {
      if (parent === null) {
        camera.matrixWorld.copy(camera.matrix);
      } else {
        camera.matrixWorld.multiplyMatrices(parent.matrixWorld, camera.matrix);
      }
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    }
    getCamera(camera) {
      this.cameraVR.near = this.cameraR.near = this.cameraL.near = camera.near;
      this.cameraVR.far = this.cameraR.far = this.cameraL.far = camera.far;
      if (this._currentDepthNear !== this.cameraVR.near || this._currentDepthFar !== this.cameraVR.far) {
        this.session.updateRenderState({depthNear:this.cameraVR.near, depthFar:this.cameraVR.far});
        this._currentDepthNear = this.cameraVR.near;
        this._currentDepthFar = this.cameraVR.far;
      }
      const parent = camera.parent;
      const cameras = this.cameraVR.cameras;
      this.updateCamera(this.cameraVR, parent);
      for (let i = 0; i < cameras.length; i++) {
        this.updateCamera(cameras[i], parent);
      }
      camera.matrixWorld.copy(this.cameraVR.matrixWorld);
      camera.matrix.copy(this.cameraVR.matrix);
      camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
      const children = camera.children;
      for (let i = 0, l = children.length; i < l; i++) {
        children[i].updateMatrixWorld(true);
      }
      if (cameras.length === 2) {
        this.setProjectionFromUnion(this.cameraVR, this.cameraL, this.cameraR);
      } else {
        this.cameraVR.projectionMatrix.copy(this.cameraL.projectionMatrix);
      }
      return this.cameraVR;
    }
    onAnimationFrame(time, frame) {
      var pose = frame.getViewerPose(this.referenceSpace);
      if (pose !== null) {
        const views = pose.views;
        const baseLayer = this.session.renderState.baseLayer;
        this.renderer.setFramebuffer(baseLayer.framebuffer);
        let cameraVRNeedsUpdate = false;
        if (views.length !== this.cameraVR.cameras.length) {
          this.cameraVR.cameras.length = 0;
          cameraVRNeedsUpdate = true;
        }
        for (let i = 0; i < views.length; i++) {
          const view = views[i];
          const viewport = baseLayer.getViewport(view);
          const camera = this.cameras[i];
          camera.matrix.fromArray(view.transform.matrix);
          camera.projectionMatrix.fromArray(view.projectionMatrix);
          camera.viewport.set(viewport.x, viewport.y, viewport.width, viewport.height);
          if (i === 0) {
            this.cameraVR.matrix.copy(camera.matrix);
          }
          if (cameraVRNeedsUpdate === true) {
            this.cameraVR.cameras.push(camera);
          }
        }
      }
      const inputSources = this.session.inputSources;
      for (let i = 0; i < this.controllers.length; i++) {
        const controller = this.controllers[i];
        const inputSource = inputSources[i];
        controller.update(inputSource, frame, this.referenceSpace);
      }
      if (this.onAnimationFrameCallback) {
        this.onAnimationFrameCallback(time, frame);
      }
    }
    setAnimationLoop(callback) {
      this.onAnimationFrameCallback = callback;
    }
  }
}, "renderers/webxr/WebXRManager.js", ["cameras/ArrayCamera.js", "core/EventDispatcher.js", "cameras/PerspectiveCamera.js", "math/Vector3.js", "math/Vector4.js", "renderers/webgl/WebGLAnimation.js", "renderers/webxr/WebXRController.js"]);

//renderers/webgl/WebGLMaterials.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLMaterials:{enumerable:true, get:function() {
    return WebGLMaterials;
  }}});
  var module$constants = $$require("constants.js");
  class WebGLMaterials {
    constructor(properties) {
      this.properties = properties;
    }
    refreshFogUniforms(uniforms, fog) {
      uniforms.fogColor.value.copy(fog.color);
      if (fog.isFog) {
        uniforms.fogNear.value = fog.near;
        uniforms.fogFar.value = fog.far;
      } else {
        if (fog.isFogExp2) {
          uniforms.fogDensity.value = fog.density;
        }
      }
    }
    refreshMaterialUniforms(uniforms, material, pixelRatio, height) {
      if (material.isMeshBasicMaterial) {
        this.refreshUniformsCommon(uniforms, material);
      } else {
        if (material.isMeshLambertMaterial) {
          this.refreshUniformsCommon(uniforms, material);
          this.refreshUniformsLambert(uniforms, material);
        } else {
          if (material.isMeshToonMaterial) {
            this.refreshUniformsCommon(uniforms, material);
            this.refreshUniformsToon(uniforms, material);
          } else {
            if (material.isMeshPhongMaterial) {
              this.refreshUniformsCommon(uniforms, material);
              this.refreshUniformsPhong(uniforms, material);
            } else {
              if (material.isMeshStandardMaterial) {
                this.refreshUniformsCommon(uniforms, material);
                if (material.isMeshPhysicalMaterial) {
                  this.refreshUniformsPhysical(uniforms, material);
                } else {
                  this.refreshUniformsStandard(uniforms, material);
                }
              } else {
                if (material.isMeshMatcapMaterial) {
                  this.refreshUniformsCommon(uniforms, material);
                  this.refreshUniformsMatcap(uniforms, material);
                } else {
                  if (material.isMeshDepthMaterial) {
                    this.refreshUniformsCommon(uniforms, material);
                    this.refreshUniformsDepth(uniforms, material);
                  } else {
                    if (material.isMeshDistanceMaterial) {
                      this.refreshUniformsCommon(uniforms, material);
                      this.refreshUniformsDistance(uniforms, material);
                    } else {
                      if (material.isMeshNormalMaterial) {
                        this.refreshUniformsCommon(uniforms, material);
                        this.refreshUniformsNormal(uniforms, material);
                      } else {
                        if (material.isLineBasicMaterial) {
                          this.refreshUniformsLine(uniforms, material);
                          if (material.isLineDashedMaterial) {
                            this.refreshUniformsDash(uniforms, material);
                          }
                        } else {
                          if (material.isPointsMaterial) {
                            this.refreshUniformsPoints(uniforms, material, pixelRatio, height);
                          } else {
                            if (material.isSpriteMaterial) {
                              this.refreshUniformsSprites(uniforms, material);
                            } else {
                              if (material.isShadowMaterial) {
                                uniforms.color.value.copy(material.color);
                                console.log("1");
                                uniforms.opacity.value = material.opacity;
                              } else {
                                if (material.isShaderMaterial) {
                                  material.uniformsNeedUpdate = false;
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    refreshUniformsCommon(uniforms, material) {
      console.log("2 " + JSON.stringify(uniforms));
      uniforms.opacity.value = material.opacity;
      if (material.color) {
        uniforms.diffuse.value.copy(material.color);
      }
      if (material.emissive) {
        uniforms.emissive.value.copy(material.emissive).multiplyScalar(material.emissiveIntensity);
      }
      if (material.map) {
        uniforms.map.value = material.map;
      }
      if (material.alphaMap) {
        uniforms.alphaMap.value = material.alphaMap;
      }
      if (material.specularMap) {
        uniforms.specularMap.value = material.specularMap;
      }
      const envMap = this.properties.get(material).envMap;
      if (envMap) {
        uniforms.envMap.value = envMap;
        uniforms.flipEnvMap.value = envMap.isCubeTexture && envMap._needsFlipEnvMap ? -1 : 1;
        uniforms.reflectivity.value = material.reflectivity;
        uniforms.refractionRatio.value = material.refractionRatio;
        const maxMipLevel = this.properties.get(envMap).__maxMipLevel;
        if (maxMipLevel !== undefined) {
          uniforms.maxMipLevel.value = maxMipLevel;
        }
      }
      if (material.lightMap) {
        uniforms.lightMap.value = material.lightMap;
        uniforms.lightMapIntensity.value = material.lightMapIntensity;
      }
      if (material.aoMap) {
        uniforms.aoMap.value = material.aoMap;
        uniforms.aoMapIntensity.value = material.aoMapIntensity;
      }
      let uvScaleMap;
      if (material.map) {
        uvScaleMap = material.map;
      } else {
        if (material.specularMap) {
          uvScaleMap = material.specularMap;
        } else {
          if (material.displacementMap) {
            uvScaleMap = material.displacementMap;
          } else {
            if (material.normalMap) {
              uvScaleMap = material.normalMap;
            } else {
              if (material.bumpMap) {
                uvScaleMap = material.bumpMap;
              } else {
                if (material.roughnessMap) {
                  uvScaleMap = material.roughnessMap;
                } else {
                  if (material.metalnessMap) {
                    uvScaleMap = material.metalnessMap;
                  } else {
                    if (material.alphaMap) {
                      uvScaleMap = material.alphaMap;
                    } else {
                      if (material.emissiveMap) {
                        uvScaleMap = material.emissiveMap;
                      } else {
                        if (material.clearcoatMap) {
                          uvScaleMap = material.clearcoatMap;
                        } else {
                          if (material.clearcoatNormalMap) {
                            uvScaleMap = material.clearcoatNormalMap;
                          } else {
                            if (material.clearcoatRoughnessMap) {
                              uvScaleMap = material.clearcoatRoughnessMap;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (uvScaleMap !== undefined) {
        if (uvScaleMap.isWebGLRenderTarget) {
          uvScaleMap = uvScaleMap.texture;
        }
        if (uvScaleMap.matrixAutoUpdate === true) {
          uvScaleMap.updateMatrix();
        }
        uniforms.uvTransform.value.copy(uvScaleMap.matrix);
      }
      let uv2ScaleMap;
      if (material.aoMap) {
        uv2ScaleMap = material.aoMap;
      } else {
        if (material.lightMap) {
          uv2ScaleMap = material.lightMap;
        }
      }
      if (uv2ScaleMap !== undefined) {
        if (uv2ScaleMap.isWebGLRenderTarget) {
          uv2ScaleMap = uv2ScaleMap.texture;
        }
        if (uv2ScaleMap.matrixAutoUpdate === true) {
          uv2ScaleMap.updateMatrix();
        }
        uniforms.uv2Transform.value.copy(uv2ScaleMap.matrix);
      }
    }
    refreshUniformsLine(uniforms, material) {
      uniforms.diffuse.value.copy(material.color);
      console.log("3");
      uniforms.opacity.value = material.opacity;
    }
    refreshUniformsDash(uniforms, material) {
      uniforms.dashSize.value = material.dashSize;
      uniforms.totalSize.value = material.dashSize + material.gapSize;
      uniforms.scale.value = material.scale;
    }
    refreshUniformsPoints(uniforms, material, pixelRatio, height) {
      uniforms.diffuse.value.copy(material.color);
      console.log("4");
      uniforms.opacity.value = material.opacity;
      uniforms.size.value = material.size * pixelRatio;
      uniforms.scale.value = height * 0.5;
      if (material.map) {
        uniforms.map.value = material.map;
      }
      if (material.alphaMap) {
        uniforms.alphaMap.value = material.alphaMap;
      }
      let uvScaleMap;
      if (material.map) {
        uvScaleMap = material.map;
      } else {
        if (material.alphaMap) {
          uvScaleMap = material.alphaMap;
        }
      }
      if (uvScaleMap !== undefined) {
        if (uvScaleMap.matrixAutoUpdate === true) {
          uvScaleMap.updateMatrix();
        }
        uniforms.uvTransform.value.copy(uvScaleMap.matrix);
      }
    }
    refreshUniformsSprites(uniforms, material) {
      uniforms.diffuse.value.copy(material.color);
      console.log("5");
      uniforms.opacity.value = material.opacity;
      uniforms.rotation.value = material.rotation;
      if (material.map) {
        uniforms.map.value = material.map;
      }
      if (material.alphaMap) {
        uniforms.alphaMap.value = material.alphaMap;
      }
      let uvScaleMap;
      if (material.map) {
        uvScaleMap = material.map;
      } else {
        if (material.alphaMap) {
          uvScaleMap = material.alphaMap;
        }
      }
      if (uvScaleMap !== undefined) {
        if (uvScaleMap.matrixAutoUpdate === true) {
          uvScaleMap.updateMatrix();
        }
        uniforms.uvTransform.value.copy(uvScaleMap.matrix);
      }
    }
    refreshUniformsLambert(uniforms, material) {
      if (material.emissiveMap) {
        uniforms.emissiveMap.value = material.emissiveMap;
      }
    }
    refreshUniformsPhong(uniforms, material) {
      uniforms.specular.value.copy(material.specular);
      uniforms.shininess.value = Math.max(material.shininess, 1e-4);
      if (material.emissiveMap) {
        uniforms.emissiveMap.value = material.emissiveMap;
      }
      if (material.bumpMap) {
        uniforms.bumpMap.value = material.bumpMap;
        uniforms.bumpScale.value = material.bumpScale;
        if (material.side === module$constants.BackSide) {
          uniforms.bumpScale.value *= -1;
        }
      }
      if (material.normalMap) {
        uniforms.normalMap.value = material.normalMap;
        uniforms.normalScale.value.copy(material.normalScale);
        if (material.side === module$constants.BackSide) {
          uniforms.normalScale.value.negate();
        }
      }
      if (material.displacementMap) {
        uniforms.displacementMap.value = material.displacementMap;
        uniforms.displacementScale.value = material.displacementScale;
        uniforms.displacementBias.value = material.displacementBias;
      }
    }
    refreshUniformsToon(uniforms, material) {
      if (material.gradientMap) {
        uniforms.gradientMap.value = material.gradientMap;
      }
      if (material.emissiveMap) {
        uniforms.emissiveMap.value = material.emissiveMap;
      }
      if (material.bumpMap) {
        uniforms.bumpMap.value = material.bumpMap;
        uniforms.bumpScale.value = material.bumpScale;
        if (material.side === module$constants.BackSide) {
          uniforms.bumpScale.value *= -1;
        }
      }
      if (material.normalMap) {
        uniforms.normalMap.value = material.normalMap;
        uniforms.normalScale.value.copy(material.normalScale);
        if (material.side === module$constants.BackSide) {
          uniforms.normalScale.value.negate();
        }
      }
      if (material.displacementMap) {
        uniforms.displacementMap.value = material.displacementMap;
        uniforms.displacementScale.value = material.displacementScale;
        uniforms.displacementBias.value = material.displacementBias;
      }
    }
    refreshUniformsStandard(uniforms, material) {
      uniforms.roughness.value = material.roughness;
      uniforms.metalness.value = material.metalness;
      if (material.roughnessMap) {
        uniforms.roughnessMap.value = material.roughnessMap;
      }
      if (material.metalnessMap) {
        uniforms.metalnessMap.value = material.metalnessMap;
      }
      if (material.emissiveMap) {
        uniforms.emissiveMap.value = material.emissiveMap;
      }
      if (material.bumpMap) {
        uniforms.bumpMap.value = material.bumpMap;
        uniforms.bumpScale.value = material.bumpScale;
        if (material.side === module$constants.BackSide) {
          uniforms.bumpScale.value *= -1;
        }
      }
      if (material.normalMap) {
        uniforms.normalMap.value = material.normalMap;
        uniforms.normalScale.value.copy(material.normalScale);
        if (material.side === module$constants.BackSide) {
          uniforms.normalScale.value.negate();
        }
      }
      if (material.displacementMap) {
        uniforms.displacementMap.value = material.displacementMap;
        uniforms.displacementScale.value = material.displacementScale;
        uniforms.displacementBias.value = material.displacementBias;
      }
      const envMap = this.properties.get(material).envMap;
      if (envMap) {
        uniforms.envMapIntensity.value = material.envMapIntensity;
      }
    }
    refreshUniformsPhysical(uniforms, material) {
      this.refreshUniformsStandard(uniforms, material);
      uniforms.reflectivity.value = material.reflectivity;
      uniforms.clearcoat.value = material.clearcoat;
      uniforms.clearcoatRoughness.value = material.clearcoatRoughness;
      if (material.sheen) {
        uniforms.sheen.value.copy(material.sheen);
      }
      if (material.clearcoatMap) {
        uniforms.clearcoatMap.value = material.clearcoatMap;
      }
      if (material.clearcoatRoughnessMap) {
        uniforms.clearcoatRoughnessMap.value = material.clearcoatRoughnessMap;
      }
      if (material.clearcoatNormalMap) {
        uniforms.clearcoatNormalScale.value.copy(material.clearcoatNormalScale);
        uniforms.clearcoatNormalMap.value = material.clearcoatNormalMap;
        if (material.side === module$constants.BackSide) {
          uniforms.clearcoatNormalScale.value.negate();
        }
      }
      uniforms.transmission.value = material.transmission;
      if (material.transmissionMap) {
        uniforms.transmissionMap.value = material.transmissionMap;
      }
    }
    refreshUniformsMatcap(uniforms, material) {
      if (material.matcap) {
        uniforms.matcap.value = material.matcap;
      }
      if (material.bumpMap) {
        uniforms.bumpMap.value = material.bumpMap;
        uniforms.bumpScale.value = material.bumpScale;
        if (material.side === module$constants.BackSide) {
          uniforms.bumpScale.value *= -1;
        }
      }
      if (material.normalMap) {
        uniforms.normalMap.value = material.normalMap;
        uniforms.normalScale.value.copy(material.normalScale);
        if (material.side === module$constants.BackSide) {
          uniforms.normalScale.value.negate();
        }
      }
      if (material.displacementMap) {
        uniforms.displacementMap.value = material.displacementMap;
        uniforms.displacementScale.value = material.displacementScale;
        uniforms.displacementBias.value = material.displacementBias;
      }
    }
    refreshUniformsDepth(uniforms, material) {
      if (material.displacementMap) {
        uniforms.displacementMap.value = material.displacementMap;
        uniforms.displacementScale.value = material.displacementScale;
        uniforms.displacementBias.value = material.displacementBias;
      }
    }
    refreshUniformsDistance(uniforms, material) {
      if (material.displacementMap) {
        uniforms.displacementMap.value = material.displacementMap;
        uniforms.displacementScale.value = material.displacementScale;
        uniforms.displacementBias.value = material.displacementBias;
      }
      uniforms.referencePosition.value.copy(material.referencePosition);
      uniforms.nearDistance.value = material.nearDistance;
      uniforms.farDistance.value = material.farDistance;
    }
    refreshUniformsNormal(uniforms, material) {
      if (material.bumpMap) {
        uniforms.bumpMap.value = material.bumpMap;
        uniforms.bumpScale.value = material.bumpScale;
        if (material.side === module$constants.BackSide) {
          uniforms.bumpScale.value *= -1;
        }
      }
      if (material.normalMap) {
        uniforms.normalMap.value = material.normalMap;
        uniforms.normalScale.value.copy(material.normalScale);
        if (material.side === module$constants.BackSide) {
          uniforms.normalScale.value.negate();
        }
      }
      if (material.displacementMap) {
        uniforms.displacementMap.value = material.displacementMap;
        uniforms.displacementScale.value = material.displacementScale;
        uniforms.displacementBias.value = material.displacementBias;
      }
    }
  }
}, "renderers/webgl/WebGLMaterials.js", ["constants.js"]);

//renderers/WebGLRenderer.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {WebGLRenderer:{enumerable:true, get:function() {
    return WebGLRenderer;
  }}});
  var module$constants = $$require("constants.js");
  var module$math$MathUtils = $$require("math/MathUtils.js");
  var module$textures$DataTexture = $$require("textures/DataTexture.js");
  var module$math$Frustum = $$require("math/Frustum.js");
  var module$math$Matrix4 = $$require("math/Matrix4.js");
  var module$math$Vector2 = $$require("math/Vector2.js");
  var module$math$Vector3 = $$require("math/Vector3.js");
  var module$math$Vector4 = $$require("math/Vector4.js");
  var module$math$Color = $$require("math/Color.js");
  var module$renderers$webgl$WebGLAnimation = $$require("renderers/webgl/WebGLAnimation.js");
  var module$renderers$webgl$WebGLAttributes = $$require("renderers/webgl/WebGLAttributes.js");
  var module$renderers$webgl$WebGLBackground = $$require("renderers/webgl/WebGLBackground.js");
  var module$renderers$webgl$WebGLBindingStates = $$require("renderers/webgl/WebGLBindingStates.js");
  var module$renderers$webgl$WebGLBufferRenderer = $$require("renderers/webgl/WebGLBufferRenderer.js");
  var module$renderers$webgl$WebGLCapabilities = $$require("renderers/webgl/WebGLCapabilities.js");
  var module$renderers$webgl$WebGLClipping = $$require("renderers/webgl/WebGLClipping.js");
  var module$renderers$webgl$WebGLCubeMaps = $$require("renderers/webgl/WebGLCubeMaps.js");
  var module$renderers$webgl$WebGLExtensions = $$require("renderers/webgl/WebGLExtensions.js");
  var module$renderers$webgl$WebGLGeometries = $$require("renderers/webgl/WebGLGeometries.js");
  var module$renderers$webgl$WebGLIndexedBufferRenderer = $$require("renderers/webgl/WebGLIndexedBufferRenderer.js");
  var module$renderers$webgl$WebGLInfo = $$require("renderers/webgl/WebGLInfo.js");
  var module$renderers$webgl$WebGLMorphtargets = $$require("renderers/webgl/WebGLMorphtargets.js");
  var module$renderers$webgl$WebGLObjects = $$require("renderers/webgl/WebGLObjects.js");
  var module$renderers$webgl$WebGLPrograms = $$require("renderers/webgl/WebGLPrograms.js");
  var module$renderers$webgl$WebGLProperties = $$require("renderers/webgl/WebGLProperties.js");
  var module$renderers$webgl$WebGLRenderLists = $$require("renderers/webgl/WebGLRenderLists.js");
  var module$renderers$webgl$WebGLRenderStates = $$require("renderers/webgl/WebGLRenderStates.js");
  var module$renderers$webgl$WebGLShadowMap = $$require("renderers/webgl/WebGLShadowMap.js");
  var module$renderers$webgl$WebGLState = $$require("renderers/webgl/WebGLState.js");
  var module$renderers$webgl$WebGLTextures = $$require("renderers/webgl/WebGLTextures.js");
  var module$renderers$webgl$WebGLUniforms = $$require("renderers/webgl/WebGLUniforms.js");
  var module$renderers$webgl$WebGLUtils = $$require("renderers/webgl/WebGLUtils.js");
  var module$renderers$webxr$WebXRManager = $$require("renderers/webxr/WebXRManager.js");
  var module$renderers$webgl$WebGLMaterials = $$require("renderers/webgl/WebGLMaterials.js");
  function createCanvasElement() {
    const canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
    canvas.style.display = "block";
    return canvas;
  }
  class WebGLRenderer {
    constructor(parameters) {
      parameters = parameters || {};
      this.parameters = parameters;
      this.isWebGL1Renderer = false;
      let _canvas = parameters.canvas !== undefined ? parameters.canvas : createCanvasElement();
      this._canvas = _canvas;
      this._context = parameters.context !== undefined ? parameters.context : null;
      let _alpha = parameters.alpha !== undefined ? parameters.alpha : false;
      let _depth = parameters.depth !== undefined ? parameters.depth : true;
      let _stencil = parameters.stencil !== undefined ? parameters.stencil : true;
      let _antialias = parameters.antialias !== undefined ? parameters.antialias : false;
      let _premultipliedAlpha = parameters.premultipliedAlpha !== undefined ? parameters.premultipliedAlpha : true;
      this._premultipliedAlpha = _premultipliedAlpha;
      let _preserveDrawingBuffer = parameters.preserveDrawingBuffer !== undefined ? parameters.preserveDrawingBuffer : false;
      let _powerPreference = parameters.powerPreference !== undefined ? parameters.powerPreference : "default";
      let _failIfMajorPerformanceCaveat = parameters.failIfMajorPerformanceCaveat !== undefined ? parameters.failIfMajorPerformanceCaveat : false;
      this.currentRenderList = null;
      this.currentRenderState = null;
      this.renderListStack = [];
      this.renderStateStack = [];
      this.domElement = this._canvas;
      this.debug = {checkShaderErrors:true};
      this.autoClear = true;
      this.autoClearColor = true;
      this.autoClearDepth = true;
      this.autoClearStencil = true;
      this.sortObjects = true;
      this.clippingPlanes = [];
      this.localClippingEnabled = false;
      this.gammaFactor = 2.0;
      this.outputEncoding = module$constants.LinearEncoding;
      this.physicallyCorrectLights = false;
      this.toneMapping = module$constants.NoToneMapping;
      this.toneMappingExposure = 1.0;
      this.maxMorphTargets = 8;
      this.maxMorphNormals = 4;
      this._isContextLost = false;
      this._framebuffer = null;
      this._currentActiveCubeFace = 0;
      this._currentActiveMipmapLevel = 0;
      this._currentRenderTarget = null;
      this._currentFramebuffer = null;
      this._currentMaterialId = -1;
      this._currentCamera = null;
      this._currentViewport = new module$math$Vector4.Vector4;
      this._currentScissor = new module$math$Vector4.Vector4;
      this._currentScissorTest = null;
      this._width = this._canvas.width;
      this._height = this._canvas.height;
      this._pixelRatio = 1;
      this._opaqueSort = null;
      this._transparentSort = null;
      this._viewport = new module$math$Vector4.Vector4(0, 0, this._width, this._height);
      this._scissor = new module$math$Vector4.Vector4(0, 0, this._width, this._height);
      this._scissorTest = false;
      this._frustum = new module$math$Frustum.Frustum;
      this._clippingEnabled = false;
      this._localClippingEnabled = false;
      this._projScreenMatrix = new module$math$Matrix4.Matrix4;
      this._vector3 = new module$math$Vector3.Vector3;
      this._emptyScene = {background:null, fog:null, environment:null, overrideMaterial:null, isScene:true};
      let _gl = this._context;
      this._gl = _gl;
      function getContext(contextNames, contextAttributes) {
        for (let i = 0; i < contextNames.length; i++) {
          const contextName = contextNames[i];
          const context = _canvas.getContext(contextName, contextAttributes);
          if (context !== null) {
            return context;
          }
        }
        return null;
      }
      try {
        const contextAttributes = {alpha:_alpha, depth:_depth, stencil:_stencil, antialias:_antialias, premultipliedAlpha:_premultipliedAlpha, preserveDrawingBuffer:_preserveDrawingBuffer, powerPreference:_powerPreference, failIfMajorPerformanceCaveat:_failIfMajorPerformanceCaveat};
        this._canvas.addEventListener("webglcontextlost", this.onContextLost, false);
        this._canvas.addEventListener("webglcontextrestored", this.onContextRestore, false);
        if (this._gl === null) {
          const contextNames = ["webgl2", "webgl", "experimental-webgl"];
          if (this.isWebGL1Renderer === true) {
            contextNames.shift();
          }
          this._gl = getContext(contextNames, contextAttributes);
          if (this._gl === null) {
            if (getContext(contextNames)) {
              throw new Error("Error creating WebGL context with your selected attributes.");
            } else {
              throw new Error("Error creating WebGL context.");
            }
          }
        }
        if (this._gl.getShaderPrecisionFormat === undefined) {
          this._gl.getShaderPrecisionFormat = function() {
            return {"rangeMin":1, "rangeMax":1, "precision":1};
          };
        }
      } catch (error) {
        console.error("THREE.WebGLRenderer: " + error.message);
        throw error;
      }
      this.capabilities;
      this.extensions;
      this.properties;
      this.renderLists;
      this.renderStates;
      this.clipping;
      this.objects;
      this.background;
      this.textures;
      this.state;
      this.info;
      this.shadowMap;
      this.utils;
      this.cubemaps;
      this.programCache;
      this.materials;
      this.attributes;
      this.indexedBufferRenderer;
      this.bufferRenderer;
      this.bindingStates;
      this.morphtargets;
      this.geometries;
      console.log("GL " + this._gl);
      this.initGLContext();
      const xr = new module$renderers$webxr$WebXRManager.WebXRManager(this, this._gl);
      this.xr = xr;
      this.onAnimationFrameCallback = null;
      this.animation = new module$renderers$webgl$WebGLAnimation.WebGLAnimation;
      this.animation.setAnimationLoop(this.onAnimationFrame);
      if (typeof window !== "undefined") {
        this.animation.setContext(window);
      }
      if (typeof __THREE_DEVTOOLS__ !== "undefined") {
        __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe", {detail:this}));
      }
    }
    initGLContext() {
      let extensions, capabilities, state, info;
      let properties, textures, cubemaps, attributes, geometries, objects;
      let programCache, materials, renderLists, renderStates, clipping, shadowMap;
      let background, morphtargets, bufferRenderer, indexedBufferRenderer;
      let utils, bindingStates;
      extensions = new module$renderers$webgl$WebGLExtensions.WebGLExtensions(this._gl);
      capabilities = new module$renderers$webgl$WebGLCapabilities.WebGLCapabilities(this._gl, extensions, this.parameters);
      extensions.init(capabilities);
      utils = new module$renderers$webgl$WebGLUtils.WebGLUtils(this._gl, extensions, capabilities);
      state = new module$renderers$webgl$WebGLState.WebGLState(this._gl, extensions, capabilities);
      state.scissor(this._currentScissor.copy(this._scissor).multiplyScalar(this._pixelRatio).floor());
      state.viewport(this._currentViewport.copy(this._viewport).multiplyScalar(this._pixelRatio).floor());
      info = new module$renderers$webgl$WebGLInfo.WebGLInfo(this._gl);
      properties = new module$renderers$webgl$WebGLProperties.WebGLProperties;
      textures = new module$renderers$webgl$WebGLTextures.WebGLTextures(this._gl, extensions, state, properties, capabilities, utils, info);
      cubemaps = new module$renderers$webgl$WebGLCubeMaps.WebGLCubeMaps(this);
      attributes = new module$renderers$webgl$WebGLAttributes.WebGLAttributes(this._gl, capabilities);
      bindingStates = new module$renderers$webgl$WebGLBindingStates.WebGLBindingStates(this._gl, extensions, attributes, capabilities);
      geometries = new module$renderers$webgl$WebGLGeometries.WebGLGeometries(this._gl, attributes, info, bindingStates);
      objects = new module$renderers$webgl$WebGLObjects.WebGLObjects(this._gl, geometries, attributes, info);
      morphtargets = new module$renderers$webgl$WebGLMorphtargets.WebGLMorphtargets(this._gl);
      clipping = new module$renderers$webgl$WebGLClipping.WebGLClipping(properties);
      programCache = new module$renderers$webgl$WebGLPrograms.WebGLPrograms(this, cubemaps, extensions, capabilities, bindingStates, clipping);
      materials = new module$renderers$webgl$WebGLMaterials.WebGLMaterials(properties);
      renderLists = new module$renderers$webgl$WebGLRenderLists.WebGLRenderLists(properties);
      renderStates = new module$renderers$webgl$WebGLRenderStates.WebGLRenderStates(extensions, capabilities);
      background = new module$renderers$webgl$WebGLBackground.WebGLBackground(this, cubemaps, state, objects, this._premultipliedAlpha);
      shadowMap = new module$renderers$webgl$WebGLShadowMap.WebGLShadowMap(this, objects, capabilities);
      bufferRenderer = new module$renderers$webgl$WebGLBufferRenderer.WebGLBufferRenderer(this._gl, extensions, info, capabilities);
      indexedBufferRenderer = new module$renderers$webgl$WebGLIndexedBufferRenderer.WebGLIndexedBufferRenderer(this._gl, extensions, info, capabilities);
      info.programs = programCache.programs;
      this.capabilities = capabilities;
      this.extensions = extensions;
      this.properties = properties;
      this.renderLists = renderLists;
      this.renderStates = renderStates;
      this.shadowMap = shadowMap;
      this.state = state;
      this.info = info;
      this.utils = utils;
      this.bindingStates = bindingStates;
      this.clipping = clipping;
      this.objects = objects;
      this.background = background;
      this.textures = textures;
      this.cubemaps = cubemaps;
      this.programCache = programCache;
      this.materials = materials;
      this.attributes = attributes;
      this.indexedBufferRenderer = indexedBufferRenderer;
      this.bufferRenderer = bufferRenderer;
      this.morphtargets = morphtargets;
      this.geometries = geometries;
    }
    getTargetPixelRatio() {
      return this._currentRenderTarget === null ? this._pixelRatio : 1;
    }
    getContext() {
      return this._gl;
    }
    getContextAttributes() {
      return this._gl.getContextAttributes();
    }
    forceContextLoss() {
      const extension = this.extensions.get("WEBGL_lose_context");
      if (extension) {
        extension.loseContext();
      }
    }
    forceContextRestore() {
      const extension = this.extensions.get("WEBGL_lose_context");
      if (extension) {
        extension.restoreContext();
      }
    }
    getPixelRatio() {
      return this._pixelRatio;
    }
    setPixelRatio(value) {
      if (value === undefined) {
        return;
      }
      this._pixelRatio = value;
      this.setSize(this._width, this._height, false);
    }
    getSize(target) {
      if (target === undefined) {
        console.warn("WebGLRenderer: .getsize() now requires a Vector2 as an argument");
        target = new module$math$Vector2.Vector2;
      }
      return target.set(this._width, this._height);
    }
    setSize(width, height, updateStyle) {
      if (this.xr.isPresenting) {
        console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");
        return;
      }
      this._width = width;
      this._height = height;
      this._canvas.width = Math.floor(width * this._pixelRatio);
      this._canvas.height = Math.floor(height * this._pixelRatio);
      if (updateStyle !== false) {
        this._canvas.style.width = width + "px";
        this._canvas.style.height = height + "px";
      }
      this.setViewport(0, 0, width, height);
    }
    getDrawingBufferSize(target) {
      if (target === undefined) {
        console.warn("WebGLRenderer: .getdrawingBufferSize() now requires a Vector2 as an argument");
        target = new module$math$Vector2.Vector2;
      }
      return target.set(this._width * this._pixelRatio, this._height * this._pixelRatio).floor();
    }
    setDrawingBufferSize(width, height, pixelRatio) {
      this._width = width;
      this._height = height;
      this._pixelRatio = pixelRatio;
      this._canvas.width = Math.floor(width * pixelRatio);
      this._canvas.height = Math.floor(height * pixelRatio);
      this.setViewport(0, 0, width, height);
    }
    getCurrentViewport(target) {
      if (target === undefined) {
        console.warn("WebGLRenderer: .getCurrentViewport() now requires a Vector4 as an argument");
        target = new module$math$Vector4.Vector4;
      }
      return target.copy(this._currentViewport);
    }
    getViewport(target) {
      return target.copy(this._viewport);
    }
    setViewport(x, y, width, height) {
      if (x.isVector4) {
        this._viewport.set(x.x, x.y, x.z, x.w);
      } else {
        this._viewport.set(x, y, width, height);
      }
      this.state.viewport(this._currentViewport.copy(this._viewport).multiplyScalar(this._pixelRatio).floor());
    }
    getScissor(target) {
      return target.copy(this._scissor);
    }
    setScissor(x, y, width, height) {
      if (x.isVector4) {
        this._scissor.set(x.x, x.y, x.z, x.w);
      } else {
        this._scissor.set(x, y, width, height);
      }
      this.state.scissor(this._currentScissor.copy(this._scissor).multiplyScalar(this._pixelRatio).floor());
    }
    getScissorTest() {
      return this._scissorTest;
    }
    setScissorTest(boolean) {
      this.state.setScissorTest(this._scissorTest = boolean);
    }
    setOpaqueSort(method) {
      this._opaqueSort = method;
    }
    setTransparentSort(method) {
      this._transparentSort = method;
    }
    getClearColor(target) {
      if (target === undefined) {
        console.warn("WebGLRenderer: .getClearColor() now requires a Color as an argument");
        target = new module$math$Color.Color;
      }
      return target.copy(this.background.getClearColor());
    }
    setClearColor() {
      this.background.setClearColor.apply(this.background, arguments);
    }
    getClearAlpha() {
      return this.background.getClearAlpha();
    }
    setClearAlpha() {
      this.background.setClearAlpha.apply(this.background, arguments);
    }
    clear(color, depth, stencil) {
      let bits = 0;
      if (color === undefined || color) {
        bits |= this._gl.COLOR_BUFFER_BIT;
      }
      if (depth === undefined || depth) {
        bits |= this._gl.DEPTH_BUFFER_BIT;
      }
      if (stencil === undefined || stencil) {
        bits |= this._gl.STENCIL_BUFFER_BIT;
      }
      this._gl.clear(bits);
    }
    clearColor() {
      this.clear(true, false, false);
    }
    clearDepth() {
      this.clear(false, true, false);
    }
    clearStencil() {
      this.clear(false, false, true);
    }
    dispose() {
      this._canvas.removeEventListener("webglcontextlost", this.onContextLost, false);
      this._canvas.removeEventListener("webglcontextrestored", this.onContextRestore, false);
      this.renderLists.dispose();
      this.renderStates.dispose();
      this.properties.dispose();
      this.cubemaps.dispose();
      this.objects.dispose();
      this.bindingStates.dispose();
      this.xr.dispose();
      this.animation.stop();
    }
    onContextLost(event) {
      event.preventDefault();
      console.log("THREE.WebGLRenderer: Context Lost.");
      this._isContextLost = true;
    }
    onContextRestore() {
      console.log("THREE.WebGLRenderer: Context Restored.");
      this._isContextLost = false;
      this.initGLContext();
    }
    onMaterialDispose(event) {
      const material = event.target;
      material.removeEventListener("dispose", this.onMaterialDispose);
      this.deallocateMaterial(material);
    }
    deallocateMaterial(material) {
      this.releaseMaterialProgramReference(material);
      this.properties.remove(material);
    }
    releaseMaterialProgramReference(material) {
      const programInfo = this.properties.get(material).program;
      if (programInfo !== undefined) {
        this.programCache.releaseProgram(programInfo);
      }
    }
    renderObjectImmediate(object, program) {
      let _this = this;
      object.render(function(object) {
        _this.renderBufferImmediate(object, program);
      });
    }
    renderBufferImmediate(object, program) {
      this.bindingStates.initAttributes();
      const buffers = this.properties.get(object);
      if (object.hasPositions && !buffers.position) {
        buffers.position = this._gl.createBuffer();
      }
      if (object.hasNormals && !buffers.normal) {
        buffers.normal = this._gl.createBuffer();
      }
      if (object.hasUvs && !buffers.uv) {
        buffers.uv = this._gl.createBuffer();
      }
      if (object.hasColors && !buffers.color) {
        buffers.color = this._gl.createBuffer();
      }
      const programAttributes = program.getAttributes();
      if (object.hasPositions) {
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffers.position);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, object.positionArray, this._gl.DYNAMIC_DRAW);
        this.bindingStates.enableAttribute(programAttributes.position);
        this._gl.vertexAttribPointer(programAttributes.position, 3, this._gl.FLOAT, false, 0, 0);
      }
      if (object.hasNormals) {
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffers.normal);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, object.normalArray, this._gl.DYNAMIC_DRAW);
        this.bindingStates.enableAttribute(programAttributes.normal);
        this._gl.vertexAttribPointer(programAttributes.normal, 3, this._gl.FLOAT, false, 0, 0);
      }
      if (object.hasUvs) {
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffers.uv);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, object.uvArray, this._gl.DYNAMIC_DRAW);
        this.bindingStates.enableAttribute(programAttributes.uv);
        this._gl.vertexAttribPointer(programAttributes.uv, 2, this._gl.FLOAT, false, 0, 0);
      }
      if (object.hasColors) {
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffers.color);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, object.colorArray, this._gl.DYNAMIC_DRAW);
        this.bindingStates.enableAttribute(programAttributes.color);
        this._gl.vertexAttribPointer(programAttributes.color, 3, this._gl.FLOAT, false, 0, 0);
      }
      this.bindingStates.disableUnusedAttributes();
      this._gl.drawArrays(this._gl.TRIANGLES, 0, object.count);
      object.count = 0;
    }
    renderBufferDirect(camera, scene, geometry, material, object, group) {
      if (scene === null) {
        scene = this._emptyScene;
      }
      const frontFaceCW = object.isMesh && object.matrixWorld.determinant() < 0;
      const program = this.setProgram(camera, scene, material, object);
      this.state.setMaterial(material, frontFaceCW);
      let index = geometry.index;
      const position = geometry.attributes.position;
      if (index === null) {
        if (position === undefined || position.count === 0) {
          return;
        }
      } else {
        if (index.count === 0) {
          return;
        }
      }
      let rangeFactor = 1;
      if (material.wireframe === true) {
        index = this.geometries.getWireframeAttribute(geometry);
        rangeFactor = 2;
      }
      if (material.morphTargets || material.morphNormals) {
        this.morphtargets.update(object, geometry, material, program);
      }
      this.bindingStates.setup(object, material, program, geometry, index);
      let attribute;
      let renderer = this.bufferRenderer;
      if (index !== null) {
        attribute = this.attributes.get(index);
        renderer = this.indexedBufferRenderer;
        renderer.setIndex(attribute);
      }
      const dataCount = index !== null ? index.count : position.count;
      const rangeStart = geometry.drawRange.start * rangeFactor;
      const rangeCount = geometry.drawRange.count * rangeFactor;
      const groupStart = group !== null ? group.start * rangeFactor : 0;
      const groupCount = group !== null ? group.count * rangeFactor : Infinity;
      const drawStart = Math.max(rangeStart, groupStart);
      const drawEnd = Math.min(dataCount, rangeStart + rangeCount, groupStart + groupCount) - 1;
      const drawCount = Math.max(0, drawEnd - drawStart + 1);
      if (drawCount === 0) {
        return;
      }
      if (object.isMesh) {
        if (material.wireframe === true) {
          this.state.setLineWidth(material.wireframeLinewidth * this.getTargetPixelRatio());
          renderer.setMode(this._gl.LINES);
        } else {
          renderer.setMode(this._gl.TRIANGLES);
        }
      } else {
        if (object.isLine) {
          let lineWidth = material.linewidth;
          if (lineWidth === undefined) {
            lineWidth = 1;
          }
          this.state.setLineWidth(lineWidth * this.getTargetPixelRatio());
          if (object.isLineSegments) {
            renderer.setMode(this._gl.LINES);
          } else {
            if (object.isLineLoop) {
              renderer.setMode(this._gl.LINE_LOOP);
            } else {
              renderer.setMode(this._gl.LINE_STRIP);
            }
          }
        } else {
          if (object.isPoints) {
            renderer.setMode(this._gl.POINTS);
          } else {
            if (object.isSprite) {
              renderer.setMode(this._gl.TRIANGLES);
            }
          }
        }
      }
      if (object.isInstancedMesh) {
        renderer.renderInstances(drawStart, drawCount, object.count);
      } else {
        if (geometry.isInstancedBufferGeometry) {
          const instanceCount = Math.min(geometry.instanceCount, geometry._maxInstanceCount);
          renderer.renderInstances(drawStart, drawCount, instanceCount);
        } else {
          renderer.render(drawStart, drawCount);
        }
      }
    }
    compile(scene, camera) {
      this.currentRenderState = this.renderStates.get(scene);
      this.currentRenderState.init();
      scene.traverseVisible(function(object) {
        if (object.isLight && object.layers.test(camera.layers)) {
          this.currentRenderState.pushLight(object);
          if (object.castShadow) {
            this.urrentRenderState.pushShadow(object);
          }
        }
      });
      this.currentRenderState.setupLights();
      const compiled = new WeakMap;
      scene.traverse(function(object) {
        const material = object.material;
        if (material) {
          if (Array.isArray(material)) {
            for (let i = 0; i < material.length; i++) {
              const material2 = material[i];
              if (compiled.has(material2) === false) {
                this.initMaterial(material2, scene, object);
                compiled.set(material2);
              }
            }
          } else {
            if (compiled.has(material) === false) {
              this.initMaterial(material, scene, object);
              compiled.set(material);
            }
          }
        }
      });
    }
    onAnimationFrame(time) {
      if (this.xr.isPresenting) {
        return;
      }
      if (this.onAnimationFrameCallback) {
        this.onAnimationFrameCallback(time);
      }
    }
    setAnimationLoop(callback) {
      this.onAnimationFrameCallback = callback;
      this.xr.setAnimationLoop(callback);
      callback === null ? this.animation.stop() : this.animation.start();
    }
    render(scene, camera) {
      let renderTarget, forceClear;
      if (arguments[2] !== undefined) {
        console.warn("THREE.WebGLRenderer.render(): the renderTarget argument has been removed. Use .setRenderTarget() instead.");
        renderTarget = arguments[2];
      }
      if (arguments[3] !== undefined) {
        console.warn("THREE.WebGLRenderer.render(): the forceClear argument has been removed. Use .clear() instead.");
        forceClear = arguments[3];
      }
      if (camera !== undefined && camera.isCamera !== true) {
        console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");
        return;
      }
      if (this._isContextLost === true) {
        return;
      }
      this.bindingStates.resetDefaultState();
      this._currentMaterialId = -1;
      this._currentCamera = null;
      if (scene.autoUpdate === true) {
        scene.updateMatrixWorld();
      }
      if (camera.parent === null) {
        camera.updateMatrixWorld();
      }
      if (this.xr.enabled === true && this.xr.isPresenting === true) {
        camera = this.xr.getCamera(camera);
      }
      if (scene.isScene === true) {
        scene.onBeforeRender(this, scene, camera, renderTarget || this._currentRenderTarget);
      }
      this.currentRenderState = this.renderStates.get(scene, this.renderStateStack.length);
      this.currentRenderState.init();
      this.renderStateStack.push(this.currentRenderState);
      this._projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      this._frustum.setFromProjectionMatrix(this._projScreenMatrix);
      this._localClippingEnabled = this.localClippingEnabled;
      this._clippingEnabled = this.clipping.init(this.clippingPlanes, this._localClippingEnabled, camera);
      this.currentRenderList = this.renderLists.get(scene, this.renderListStack.length);
      this.currentRenderList.init();
      this.renderListStack.push(this.currentRenderList);
      this.projectObject(scene, camera, 0, this.sortObjects);
      this.currentRenderList.finish();
      if (this.sortObjects === true) {
        this.currentRenderList.sort(this._opaqueSort, this._transparentSort);
      }
      if (this._clippingEnabled === true) {
        this.clipping.beginShadows();
      }
      const shadowsArray = this.currentRenderState.state.shadowsArray;
      this.shadowMap.render(shadowsArray, scene, camera);
      this.currentRenderState.setupLights();
      this.currentRenderState.setupLightsView(camera);
      if (this._clippingEnabled === true) {
        this.clipping.endShadows();
      }
      if (this.info.autoReset === true) {
        this.info.reset();
      }
      if (renderTarget !== undefined) {
        this.setRenderTarget(renderTarget);
      }
      this.background.render(this.currentRenderList, scene, camera, forceClear);
      const opaqueObjects = this.currentRenderList.opaque;
      const transparentObjects = this.currentRenderList.transparent;
      if (opaqueObjects.length > 0) {
        this.renderObjects(opaqueObjects, scene, camera);
      }
      if (transparentObjects.length > 0) {
        this.renderObjects(transparentObjects, scene, camera);
      }
      if (scene.isScene === true) {
        scene.onAfterRender(this, scene, camera);
      }
      if (this._currentRenderTarget !== null) {
        this.textures.updateRenderTargetMipmap(this._currentRenderTarget);
        this.textures.updateMultisampleRenderTarget(this._currentRenderTarget);
      }
      this.state.buffers.depth.setTest(true);
      this.state.buffers.depth.setMask(true);
      this.state.buffers.color.setMask(true);
      this.state.setPolygonOffset(false);
      this.renderStateStack.pop();
      if (this.renderStateStack.length > 0) {
        this.currentRenderState = this.renderStateStack[this.renderStateStack.length - 1];
      } else {
        this.currentRenderState = null;
      }
      this.renderListStack.pop();
      if (this.renderListStack.length > 0) {
        this.currentRenderList = this.renderListStack[this.renderListStack.length - 1];
      } else {
        this.currentRenderList = null;
      }
    }
    projectObject(object, camera, groupOrder, sortObjects) {
      if (object.visible === false) {
        return;
      }
      const visible = object.layers.test(camera.layers);
      if (visible) {
        if (object.isGroup) {
          groupOrder = object.renderOrder;
        } else {
          if (object.isLOD) {
            if (object.autoUpdate === true) {
              object.update(camera);
            }
          } else {
            if (object.isLight) {
              this.currentRenderState.pushLight(object);
              if (object.castShadow) {
                this.currentRenderState.pushShadow(object);
              }
            } else {
              if (object.isSprite) {
                if (!object.frustumCulled || this._frustum.intersectsSprite(object)) {
                  if (sortObjects) {
                    this._vector3.setFromMatrixPosition(object.matrixWorld).applyMatrix4(this._projScreenMatrix);
                  }
                  const geometry = this.objects.update(object);
                  const material = object.material;
                  if (material.visible) {
                    this.currentRenderList.push(object, geometry, material, groupOrder, this._vector3.z, null);
                  }
                }
              } else {
                if (object.isImmediateRenderObject) {
                  if (sortObjects) {
                    this._vector3.setFromMatrixPosition(object.matrixWorld).applyMatrix4(this._projScreenMatrix);
                  }
                  this.currentRenderList.push(object, null, object.material, groupOrder, this._vector3.z, null);
                } else {
                  if (object.isMesh || object.isLine || object.isPoints) {
                    if (object.isSkinnedMesh) {
                      if (object.skeleton.frame !== this.info.render.frame) {
                        object.skeleton.update();
                        object.skeleton.frame = this.info.render.frame;
                      }
                    }
                    if (!object.frustumCulled || this._frustum.intersectsObject(object)) {
                      if (sortObjects) {
                        this._vector3.setFromMatrixPosition(object.matrixWorld).applyMatrix4(this._projScreenMatrix);
                      }
                      const geometry = this.objects.update(object);
                      const material = object.material;
                      if (Array.isArray(material)) {
                        const groups = geometry.groups;
                        for (let i = 0, l = groups.length; i < l; i++) {
                          const group = groups[i];
                          const groupMaterial = material[group.materialIndex];
                          if (groupMaterial && groupMaterial.visible) {
                            this.currentRenderList.push(object, geometry, groupMaterial, groupOrder, this._vector3.z, group);
                          }
                        }
                      } else {
                        if (material.visible) {
                          this.currentRenderList.push(object, geometry, material, groupOrder, this._vector3.z, null);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      const children = object.children;
      for (let i = 0, l = children.length; i < l; i++) {
        this.projectObject(children[i], camera, groupOrder, sortObjects);
      }
    }
    renderObjects(renderList, scene, camera) {
      const overrideMaterial = scene.isScene === true ? scene.overrideMaterial : null;
      for (let i = 0, l = renderList.length; i < l; i++) {
        const renderItem = renderList[i];
        const object = renderItem.object;
        const geometry = renderItem.geometry;
        const material = overrideMaterial === null ? renderItem.material : overrideMaterial;
        const group = renderItem.group;
        if (camera.isArrayCamera) {
          const cameras = camera.cameras;
          for (let j = 0, jl = cameras.length; j < jl; j++) {
            const camera2 = cameras[j];
            if (object.layers.test(camera2.layers)) {
              this.state.viewport(this._currentViewport.copy(camera2.viewport));
              this.currentRenderState.setupLightsView(camera2);
              this.renderObject(object, scene, camera2, geometry, material, group);
            }
          }
        } else {
          this.renderObject(object, scene, camera, geometry, material, group);
        }
      }
    }
    renderObject(object, scene, camera, geometry, material, group) {
      object.onBeforeRender(this, scene, camera, geometry, material, group);
      object.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
      object.normalMatrix.getNormalMatrix(object.modelViewMatrix);
      if (object.isImmediateRenderObject) {
        const program = this.setProgram(camera, scene, material, object);
        this.state.setMaterial(material);
        this.bindingStates.reset();
        this.renderObjectImmediate(object, program);
      } else {
        this.renderBufferDirect(camera, scene, geometry, material, object, group);
      }
      object.onAfterRender(this, scene, camera, geometry, material, group);
    }
    initMaterial(material, scene, object) {
      if (scene.isScene !== true) {
        scene = this._emptyScene;
      }
      const materialProperties = this.properties.get(material);
      const lights = this.currentRenderState.state.lights;
      const shadowsArray = this.currentRenderState.state.shadowsArray;
      const lightsStateVersion = lights.state.version;
      const parameters = this.programCache.getParameters(material, lights.state, shadowsArray, scene, object);
      const programCacheKey = this.programCache.getProgramCacheKey(parameters);
      let program = materialProperties.program;
      let programChange = true;
      materialProperties.environment = material.isMeshStandardMaterial ? scene.environment : null;
      materialProperties.fog = scene.fog;
      materialProperties.envMap = this.cubemaps.get(material.envMap || materialProperties.environment);
      if (program === undefined) {
        material.addEventListener("dispose", this.onMaterialDispose);
      } else {
        if (program.cacheKey !== programCacheKey) {
          this.releaseMaterialProgramReference(material);
        } else {
          if (materialProperties.lightsStateVersion !== lightsStateVersion) {
            programChange = false;
          } else {
            if (parameters.shaderID !== undefined) {
              return;
            } else {
              programChange = false;
            }
          }
        }
      }
      if (programChange) {
        parameters.uniforms = this.programCache.getUniforms(material);
        material.onBeforeCompile(parameters, this);
        program = this.programCache.acquireProgram(parameters, programCacheKey);
        materialProperties.program = program;
        materialProperties.uniforms = parameters.uniforms;
        materialProperties.outputEncoding = parameters.outputEncoding;
      }
      const uniforms = materialProperties.uniforms;
      if (!material.isShaderMaterial && !material.isRawShaderMaterial || material.clipping === true) {
        materialProperties.numClippingPlanes = this.clipping.numPlanes;
        materialProperties.numIntersection = this.clipping.numIntersection;
        uniforms.clippingPlanes = this.clipping.uniform;
      }
      materialProperties.needsLights = this.materialNeedsLights(material);
      materialProperties.lightsStateVersion = lightsStateVersion;
      if (materialProperties.needsLights) {
        uniforms.ambientLightColor.value = lights.state.ambient;
        uniforms.lightProbe.value = lights.state.probe;
        uniforms.directionalLights.value = lights.state.directional;
        uniforms.directionalLightShadows.value = lights.state.directionalShadow;
        uniforms.spotLights.value = lights.state.spot;
        uniforms.spotLightShadows.value = lights.state.spotShadow;
        uniforms.rectAreaLights.value = lights.state.rectArea;
        uniforms.ltc_1.value = lights.state.rectAreaLTC1;
        uniforms.ltc_2.value = lights.state.rectAreaLTC2;
        uniforms.pointLights.value = lights.state.point;
        uniforms.pointLightShadows.value = lights.state.pointShadow;
        uniforms.hemisphereLights.value = lights.state.hemi;
        uniforms.directionalShadowMap.value = lights.state.directionalShadowMap;
        uniforms.directionalShadowMatrix.value = lights.state.directionalShadowMatrix;
        uniforms.spotShadowMap.value = lights.state.spotShadowMap;
        uniforms.spotShadowMatrix.value = lights.state.spotShadowMatrix;
        uniforms.pointShadowMap.value = lights.state.pointShadowMap;
        uniforms.pointShadowMatrix.value = lights.state.pointShadowMatrix;
      }
      const progUniforms = materialProperties.program.getUniforms();
      const uniformsList = module$renderers$webgl$WebGLUniforms.WebGLUniforms.seqWithValue(progUniforms.seq, uniforms);
      materialProperties.uniformsList = uniformsList;
    }
    setProgram(camera, scene, material, object) {
      if (scene.isScene !== true) {
        scene = this._emptyScene;
      }
      this.textures.resetTextureUnits();
      const fog = scene.fog;
      const environment = material.isMeshStandardMaterial ? scene.environment : null;
      const encoding = this._currentRenderTarget === null ? this.outputEncoding : this._currentRenderTarget.texture.encoding;
      const envMap = this.cubemaps.get(material.envMap || environment);
      const materialProperties = this.properties.get(material);
      const lights = this.currentRenderState.state.lights;
      if (this._clippingEnabled === true) {
        if (this._localClippingEnabled === true || camera !== this._currentCamera) {
          const useCache = camera === this._currentCamera && material.id === this._currentMaterialId;
          this.clipping.setState(material, camera, useCache);
        }
      }
      if (material.version === materialProperties.__version) {
        if (material.fog && materialProperties.fog !== fog) {
          this.initMaterial(material, scene, object);
        } else {
          if (materialProperties.environment !== environment) {
            this.initMaterial(material, scene, object);
          } else {
            if (materialProperties.needsLights && materialProperties.lightsStateVersion !== lights.state.version) {
              this.initMaterial(material, scene, object);
            } else {
              if (materialProperties.numClippingPlanes !== undefined && (materialProperties.numClippingPlanes !== this.clipping.numPlanes || materialProperties.numIntersection !== this.clipping.numIntersection)) {
                this.initMaterial(material, scene, object);
              } else {
                if (materialProperties.outputEncoding !== encoding) {
                  this.initMaterial(material, scene, object);
                } else {
                  if (materialProperties.envMap !== envMap) {
                    this.initMaterial(material, scene, object);
                  }
                }
              }
            }
          }
        }
      } else {
        this.initMaterial(material, scene, object);
        materialProperties.__version = material.version;
      }
      let refreshProgram = false;
      let refreshMaterial = false;
      let refreshLights = false;
      const program = materialProperties.program, p_uniforms = program.getUniforms(), m_uniforms = materialProperties.uniforms;
      if (this.state.useProgram(program.program)) {
        refreshProgram = true;
        refreshMaterial = true;
        refreshLights = true;
      }
      if (material.id !== this._currentMaterialId) {
        this._currentMaterialId = material.id;
        refreshMaterial = true;
      }
      if (refreshProgram || this._currentCamera !== camera) {
        p_uniforms.setValue(this._gl, "projectionMatrix", camera.projectionMatrix);
        if (this.capabilities.logarithmicDepthBuffer) {
          p_uniforms.setValue(this._gl, "logDepthBufFC", 2.0 / (Math.log(camera.far + 1.0) / Math.LN2));
        }
        if (this._currentCamera !== camera) {
          this._currentCamera = camera;
          refreshMaterial = true;
          refreshLights = true;
        }
        if (material.isShaderMaterial || material.isMeshPhongMaterial || material.isMeshToonMaterial || material.isMeshStandardMaterial || material.envMap) {
          const uCamPos = p_uniforms.map.cameraPosition;
          if (uCamPos !== undefined) {
            uCamPos.setValue(this._gl, this._vector3.setFromMatrixPosition(camera.matrixWorld));
          }
        }
        if (material.isMeshPhongMaterial || material.isMeshToonMaterial || material.isMeshLambertMaterial || material.isMeshBasicMaterial || material.isMeshStandardMaterial || material.isShaderMaterial) {
          p_uniforms.setValue(this._gl, "isOrthographic", camera.isOrthographicCamera === true);
        }
        if (material.isMeshPhongMaterial || material.isMeshToonMaterial || material.isMeshLambertMaterial || material.isMeshBasicMaterial || material.isMeshStandardMaterial || material.isShaderMaterial || material.isShadowMaterial || material.skinning) {
          p_uniforms.setValue(this._gl, "viewMatrix", camera.matrixWorldInverse);
        }
      }
      if (material.skinning) {
        p_uniforms.setOptional(this._gl, object, "bindMatrix");
        p_uniforms.setOptional(this._gl, object, "bindMatrixInverse");
        const skeleton = object.skeleton;
        if (skeleton) {
          const bones = skeleton.bones;
          if (this.capabilities.floatVertexTextures) {
            if (skeleton.boneTexture === null) {
              let size = Math.sqrt(bones.length * 4);
              size = module$math$MathUtils.MathUtils.ceilPowerOfTwo(size);
              size = Math.max(size, 4);
              const boneMatrices = new Float32Array(size * size * 4);
              boneMatrices.set(skeleton.boneMatrices);
              const boneTexture = new module$textures$DataTexture.DataTexture(boneMatrices, size, size, module$constants.RGBAFormat, module$constants.FloatType);
              skeleton.boneMatrices = boneMatrices;
              skeleton.boneTexture = boneTexture;
              skeleton.boneTextureSize = size;
            }
            p_uniforms.setValue(this._gl, "boneTexture", skeleton.boneTexture, this.textures);
            p_uniforms.setValue(this._gl, "boneTextureSize", skeleton.boneTextureSize);
          } else {
            p_uniforms.setOptional(this._gl, skeleton, "boneMatrices");
          }
        }
      }
      if (refreshMaterial || materialProperties.receiveShadow !== object.receiveShadow) {
        materialProperties.receiveShadow = object.receiveShadow;
        p_uniforms.setValue(this._gl, "receiveShadow", object.receiveShadow);
      }
      if (refreshMaterial) {
        p_uniforms.setValue(this._gl, "toneMappingExposure", this.toneMappingExposure);
        if (materialProperties.needsLights) {
          this.markUniformsLightsNeedsUpdate(m_uniforms, refreshLights);
        }
        if (fog && material.fog) {
          this.materials.refreshFogUniforms(m_uniforms, fog);
        }
        this.materials.refreshMaterialUniforms(m_uniforms, material, this._pixelRatio, this._height);
        module$renderers$webgl$WebGLUniforms.WebGLUniforms.upload(this._gl, materialProperties.uniformsList, m_uniforms, this.textures);
      }
      if (material.isShaderMaterial && material.uniformsNeedUpdate === true) {
        module$renderers$webgl$WebGLUniforms.WebGLUniforms.upload(this._gl, materialProperties.uniformsList, m_uniforms, this.textures);
        material.uniformsNeedUpdate = false;
      }
      if (material.isSpriteMaterial) {
        p_uniforms.setValue(this._gl, "center", object.center);
      }
      p_uniforms.setValue(this._gl, "modelViewMatrix", object.modelViewMatrix);
      p_uniforms.setValue(this._gl, "normalMatrix", object.normalMatrix);
      p_uniforms.setValue(this._gl, "modelMatrix", object.matrixWorld);
      return program;
    }
    markUniformsLightsNeedsUpdate(uniforms, value) {
      uniforms.ambientLightColor.needsUpdate = value;
      uniforms.lightProbe.needsUpdate = value;
      uniforms.directionalLights.needsUpdate = value;
      uniforms.directionalLightShadows.needsUpdate = value;
      uniforms.pointLights.needsUpdate = value;
      uniforms.pointLightShadows.needsUpdate = value;
      uniforms.spotLights.needsUpdate = value;
      uniforms.spotLightShadows.needsUpdate = value;
      uniforms.rectAreaLights.needsUpdate = value;
      uniforms.hemisphereLights.needsUpdate = value;
    }
    materialNeedsLights(material) {
      return material.isMeshLambertMaterial || material.isMeshToonMaterial || material.isMeshPhongMaterial || material.isMeshStandardMaterial || material.isShadowMaterial || material.isShaderMaterial && material.lights === true;
    }
    setFramebuffer(value) {
      if (this._framebuffer !== value && this._currentRenderTarget === null) {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, value);
      }
      this._framebuffer = value;
    }
    getActiveCubeFace() {
      return this._currentActiveCubeFace;
    }
    getActiveMipmapLevel() {
      return this._currentActiveMipmapLevel;
    }
    getRenderTarget() {
      return this._currentRenderTarget;
    }
    setRenderTarget(renderTarget, activeCubeFace = 0, activeMipmapLevel = 0) {
      this._currentRenderTarget = renderTarget;
      this._currentActiveCubeFace = activeCubeFace;
      this._currentActiveMipmapLevel = activeMipmapLevel;
      if (renderTarget && this.properties.get(renderTarget).__webglFramebuffer === undefined) {
        this.textures.setupRenderTarget(renderTarget);
      }
      let framebuffer = this._framebuffer;
      let isCube = false;
      let isRenderTarget3D = false;
      if (renderTarget) {
        const texture = renderTarget.texture;
        if (texture.isDataTexture3D || texture.isDataTexture2DArray) {
          isRenderTarget3D = true;
        }
        const __webglFramebuffer = this.properties.get(renderTarget).__webglFramebuffer;
        if (renderTarget.isWebGLCubeRenderTarget) {
          framebuffer = __webglFramebuffer[activeCubeFace];
          isCube = true;
        } else {
          if (renderTarget.isWebGLMultisampleRenderTarget) {
            framebuffer = this.properties.get(renderTarget).__webglMultisampledFramebuffer;
          } else {
            framebuffer = __webglFramebuffer;
          }
        }
        this._currentViewport.copy(renderTarget.viewport);
        this._currentScissor.copy(renderTarget.scissor);
        this._currentScissorTest = renderTarget.scissorTest;
      } else {
        this._currentViewport.copy(this._viewport).multiplyScalar(this._pixelRatio).floor();
        this._currentScissor.copy(this._scissor).multiplyScalar(this._pixelRatio).floor();
        this._currentScissorTest = this._scissorTest;
      }
      if (this._currentFramebuffer !== framebuffer) {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);
        this._currentFramebuffer = framebuffer;
      }
      this.state.viewport(this._currentViewport);
      this.state.scissor(this._currentScissor);
      this.state.setScissorTest(this._currentScissorTest);
      if (isCube) {
        const textureProperties = this.properties.get(renderTarget.texture);
        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + activeCubeFace, textureProperties.__webglTexture, activeMipmapLevel);
      } else {
        if (isRenderTarget3D) {
          const textureProperties = this.properties.get(renderTarget.texture);
          const layer = activeCubeFace || 0;
          this._gl.framebufferTextureLayer(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, textureProperties.__webglTexture, activeMipmapLevel || 0, layer);
        }
      }
    }
    readRenderTargetPixels(renderTarget, x, y, width, height, buffer, activeCubeFaceIndex) {
      if (!(renderTarget && renderTarget.isWebGLRenderTarget)) {
        console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");
        return;
      }
      let framebuffer = this.properties.get(renderTarget).__webglFramebuffer;
      if (renderTarget.isWebGLCubeRenderTarget && activeCubeFaceIndex !== undefined) {
        framebuffer = framebuffer[activeCubeFaceIndex];
      }
      if (framebuffer) {
        let restore = false;
        if (framebuffer !== this._currentFramebuffer) {
          this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);
          restore = true;
        }
        try {
          const texture = renderTarget.texture;
          const textureFormat = texture.format;
          const textureType = texture.type;
          if (textureFormat !== module$constants.RGBAFormat && this.utils.convert(textureFormat) !== this._gl.getParameter(this._gl.IMPLEMENTATION_COLOR_READ_FORMAT)) {
            console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");
            return;
          }
          const halfFloatSupportedByExt = textureType === module$constants.HalfFloatType && (this.extensions.has("EXT_color_buffer_half_float") || this.capabilities.isWebGL2 && this.extensions.has("EXT_color_buffer_float"));
          if (textureType !== module$constants.UnsignedByteType && this.utils.convert(textureType) !== this._gl.getParameter(this._gl.IMPLEMENTATION_COLOR_READ_TYPE) && !(textureType === module$constants.FloatType && (this.capabilities.isWebGL2 || this.extensions.has("OES_texture_float") || this.extensions.has("WEBGL_color_buffer_float"))) && !halfFloatSupportedByExt) {
            console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");
            return;
          }
          if (this._gl.checkFramebufferStatus(this._gl.FRAMEBUFFER) === this._gl.FRAMEBUFFER_COMPLETE) {
            if (x >= 0 && x <= renderTarget.width - width && (y >= 0 && y <= renderTarget.height - height)) {
              this._gl.readPixels(x, y, width, height, this.utils.convert(textureFormat), this.utils.convert(textureType), buffer);
            }
          } else {
            console.error("THREE.WebGLRenderer.readRenderTargetPixels: readPixels from renderTarget failed. Framebuffer not complete.");
          }
        } finally {
          if (restore) {
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._currentFramebuffer);
          }
        }
      }
    }
    copyFramebufferToTexture(position, texture, level = 0) {
      const levelScale = Math.pow(2, -level);
      const width = Math.floor(texture.image.width * levelScale);
      const height = Math.floor(texture.image.height * levelScale);
      const glFormat = this.utils.convert(texture.format);
      this.textures.setTexture2D(texture, 0);
      this._gl.copyTexImage2D(this._gl.TEXTURE_2D, level, glFormat, position.x, position.y, width, height, 0);
      this.state.unbindTexture();
    }
    copyTextureToTexture(position, srcTexture, dstTexture, level = 0) {
      const width = srcTexture.image.width;
      const height = srcTexture.image.height;
      const glFormat = this.utils.convert(dstTexture.format);
      const glType = this.utils.convert(dstTexture.type);
      this.textures.setTexture2D(dstTexture, 0);
      this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, dstTexture.flipY);
      this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, dstTexture.premultiplyAlpha);
      this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, dstTexture.unpackAlignment);
      if (srcTexture.isDataTexture) {
        this._gl.texSubImage2D(this._gl.TEXTURE_2D, level, position.x, position.y, width, height, glFormat, glType, srcTexture.image.data);
      } else {
        if (srcTexture.isCompressedTexture) {
          this._gl.compressedTexSubImage2D(this._gl.TEXTURE_2D, level, position.x, position.y, srcTexture.mipmaps[0].width, srcTexture.mipmaps[0].height, glFormat, srcTexture.mipmaps[0].data);
        } else {
          this._gl.texSubImage2D(this._gl.TEXTURE_2D, level, position.x, position.y, glFormat, glType, srcTexture.image);
        }
      }
      if (level === 0 && dstTexture.generateMipmaps) {
        this._gl.generateMipmap(this._gl.TEXTURE_2D);
      }
      this.state.unbindTexture();
    }
    copyTextureToTexture3D(sourceBox, position, srcTexture, dstTexture, level = 0) {
      if (this.isWebGL1Renderer) {
        console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");
        return;
      }
      const {width, height, data} = srcTexture.image;
      const glFormat = this.utils.convert(dstTexture.format);
      const glType = this.utils.convert(dstTexture.type);
      let glTarget;
      if (dstTexture.isDataTexture3D) {
        this.textures.setTexture3D(dstTexture, 0);
        glTarget = this._gl.TEXTURE_3D;
      } else {
        if (dstTexture.isDataTexture2DArray) {
          this.textures.setTexture2DArray(dstTexture, 0);
          glTarget = this._gl.TEXTURE_2D_ARRAY;
        } else {
          console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");
          return;
        }
      }
      this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, dstTexture.flipY);
      this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, dstTexture.premultiplyAlpha);
      this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, dstTexture.unpackAlignment);
      const unpackRowLen = this._gl.getParameter(this._gl.UNPACK_ROW_LENGTH);
      const unpackImageHeight = this._gl.getParameter(this._gl.UNPACK_IMAGE_HEIGHT);
      const unpackSkipPixels = this._gl.getParameter(this._gl.UNPACK_SKIP_PIXELS);
      const unpackSkipRows = this._gl.getParameter(this._gl.UNPACK_SKIP_ROWS);
      const unpackSkipImages = this._gl.getParameter(this._gl.UNPACK_SKIP_IMAGES);
      this._gl.pixelStorei(this._gl.UNPACK_ROW_LENGTH, width);
      this._gl.pixelStorei(this._gl.UNPACK_IMAGE_HEIGHT, height);
      this._gl.pixelStorei(this._gl.UNPACK_SKIP_PIXELS, sourceBox.min.x);
      this._gl.pixelStorei(this._gl.UNPACK_SKIP_ROWS, sourceBox.min.y);
      this._gl.pixelStorei(this._gl.UNPACK_SKIP_IMAGES, sourceBox.min.z);
      this._gl.texSubImage3D(glTarget, level, position.x, position.y, position.z, sourceBox.max.x - sourceBox.min.x + 1, sourceBox.max.y - sourceBox.min.y + 1, sourceBox.max.z - sourceBox.min.z + 1, glFormat, glType, data);
      this._gl.pixelStorei(this._gl.UNPACK_ROW_LENGTH, unpackRowLen);
      this._gl.pixelStorei(this._gl.UNPACK_IMAGE_HEIGHT, unpackImageHeight);
      this._gl.pixelStorei(this._gl.UNPACK_SKIP_PIXELS, unpackSkipPixels);
      this._gl.pixelStorei(this._gl.UNPACK_SKIP_ROWS, unpackSkipRows);
      this._gl.pixelStorei(this._gl.UNPACK_SKIP_IMAGES, unpackSkipImages);
      if (level === 0 && dstTexture.generateMipmaps) {
        this._gl.generateMipmap(glTarget);
      }
      this.state.unbindTexture();
    }
    initTexture(texture) {
      this.textures.setTexture2D(texture, 0);
      this.state.unbindTexture();
    }
    resetState() {
      this.state.reset();
      this.bindingStates.reset();
    }
  }
}, "renderers/WebGLRenderer.js", ["constants.js", "math/MathUtils.js", "textures/DataTexture.js", "math/Frustum.js", "math/Matrix4.js", "math/Vector2.js", "math/Vector3.js", "math/Vector4.js", "math/Color.js", "renderers/webgl/WebGLAnimation.js", "renderers/webgl/WebGLAttributes.js", "renderers/webgl/WebGLBackground.js", "renderers/webgl/WebGLBindingStates.js", "renderers/webgl/WebGLBufferRenderer.js", "renderers/webgl/WebGLCapabilities.js", "renderers/webgl/WebGLClipping.js", "renderers/webgl/WebGLCubeMaps.js", 
"renderers/webgl/WebGLExtensions.js", "renderers/webgl/WebGLGeometries.js", "renderers/webgl/WebGLIndexedBufferRenderer.js", "renderers/webgl/WebGLInfo.js", "renderers/webgl/WebGLMorphtargets.js", "renderers/webgl/WebGLObjects.js", "renderers/webgl/WebGLPrograms.js", "renderers/webgl/WebGLProperties.js", "renderers/webgl/WebGLRenderLists.js", "renderers/webgl/WebGLRenderStates.js", "renderers/webgl/WebGLShadowMap.js", "renderers/webgl/WebGLState.js", "renderers/webgl/WebGLTextures.js", "renderers/webgl/WebGLUniforms.js", 
"renderers/webgl/WebGLUtils.js", "renderers/webxr/WebXRManager.js", "renderers/webgl/WebGLMaterials.js"]);

//box.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  var module$cameras$PerspectiveCamera = $$require("cameras/PerspectiveCamera.js");
  var module$loaders$TextureLoader = $$require("loaders/TextureLoader.js");
  var module$scenes$Scene = $$require("scenes/Scene.js");
  var module$geometries$BoxGeometry = $$require("geometries/BoxGeometry.js");
  var module$materials$MeshBasicMaterial = $$require("materials/MeshBasicMaterial.js");
  var module$objects$Mesh = $$require("objects/Mesh.js");
  var module$renderers$WebGLRenderer = $$require("renderers/WebGLRenderer.js");
  let camera, scene, renderer;
  let mesh;
  init();
  animate();
  function init() {
    camera = new module$cameras$PerspectiveCamera.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 400;
    scene = new module$scenes$Scene.Scene;
    const texture = (new module$loaders$TextureLoader.TextureLoader).load("https://threejs.org/examples/textures/crate.gif");
    const geometry = new module$geometries$BoxGeometry.BoxBufferGeometry(200, 200, 200);
    const material = new module$materials$MeshBasicMaterial.MeshBasicMaterial({map:texture});
    mesh = new module$objects$Mesh.Mesh(geometry, material);
    scene.add(mesh);
    renderer = new module$renderers$WebGLRenderer.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    console.log("MAP " + JSON.stringify(material.map));
    window.addEventListener("resize", onWindowResize, false);
  }
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
}, "box.js", ["cameras/PerspectiveCamera.js", "loaders/TextureLoader.js", "scenes/Scene.js", "geometries/BoxGeometry.js", "materials/MeshBasicMaterial.js", "objects/Mesh.js", "renderers/WebGLRenderer.js"]);

