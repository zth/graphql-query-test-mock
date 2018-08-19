"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QueryMock = void 0;

var _nock = _interopRequireDefault(require("nock"));

var _url = _interopRequireDefault(require("url"));

var _defaults = require("./defaults");

var _handleNockRequest = require("./handleNockRequest");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var QueryMock =
/*#__PURE__*/
function () {
  function QueryMock(config) {
    _classCallCheck(this, QueryMock);

    _defineProperty(this, "_calls", []);

    _defineProperty(this, "_queries", {});

    _defineProperty(this, "_extractOperationIdFn", _defaults.defaultExtractOperationIdFn);

    _defineProperty(this, "_changeServerResponseFn", _defaults.defaultChangeServerResponseFn);

    if (!config) {
      return;
    }

    var extractOperationId = config.extractOperationId,
        changeServerResponse = config.changeServerResponse;

    if (extractOperationId) {
      this._extractOperationIdFn = extractOperationId;
    }

    if (changeServerResponse) {
      this._changeServerResponseFn = changeServerResponse;
    }
  }

  _createClass(QueryMock, [{
    key: "addCall",
    value: function addCall(call) {
      this._calls.push(call);
    }
  }, {
    key: "reset",
    value: function reset() {
      this._calls = [];
      this._queries = {};
    }
  }, {
    key: "getCalls",
    value: function getCalls() {
      return _toConsumableArray(this._calls);
    }
  }, {
    key: "getOrCreateMockQueryHolder",
    value: function getOrCreateMockQueryHolder(id) {
      if (!this._queries[id]) {
        this._queries[id] = [];
      }

      return this._queries[id];
    }
  }, {
    key: "mockQuery",
    value: function mockQuery(config) {
      this.getOrCreateMockQueryHolder(config.name).push({
        queryMockConfig: _objectSpread({}, _defaults.DEFAULT_CONFIG, config)
      });
    }
  }, {
    key: "mockQueryWithControlledResolution",
    value: function mockQueryWithControlledResolution(config) {
      var resolver = null;
      var resolveQueryPromise = new Promise(function (resolve) {
        resolver = resolve;
      });

      var resolveQueryFn = function resolveQueryFn() {
        var interval = setInterval(function () {
          if (resolver) {
            clearInterval(interval);
            resolver();
          }
        }, 50);
      };

      this.getOrCreateMockQueryHolder(config.name).push({
        queryMockConfig: _objectSpread({}, _defaults.DEFAULT_CONFIG, config),
        resolveQueryPromise: resolveQueryPromise
      });
      return resolveQueryFn;
    }
  }, {
    key: "getQueryMock",
    value: function getQueryMock(name) {
      var queryMockHolder = this._queries[name];

      if (!queryMockHolder || queryMockHolder.length < 1) {
        return null;
      }

      return queryMockHolder[0].queryMockConfig.persist ? queryMockHolder[0] : queryMockHolder.shift();
    }
  }, {
    key: "setup",
    value: function setup(graphQLURL) {
      this.reset();

      var theUrl = _url.default.parse(graphQLURL);

      (0, _nock.default)("".concat(theUrl.protocol || 'https:', "//").concat(theUrl.host || 'localhost')).persist().post(theUrl.path || '/').reply((0, _handleNockRequest.handleNockRequest)(this));
    }
  }]);

  return QueryMock;
}();

exports.QueryMock = QueryMock;