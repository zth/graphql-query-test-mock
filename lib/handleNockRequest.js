"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleNockRequest = handleNockRequest;

var _deepEqual = _interopRequireDefault(require("deep-equal"));

var _index = require("./index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function handleNockRequest(queryMock) {
  return function (uri, data, cb) {
    var preventThrowing = false;

    if (data && _typeof(data) === 'object') {
      var id = queryMock._extractOperationIdFn(data);

      if (id) {
        var variables = data.variables !== null && _typeof(data.variables) === 'object' ? data.variables : {};
        var mockedQueryValue = queryMock.getQueryMock(id);

        if (mockedQueryValue) {
          var queryMockConfig = mockedQueryValue.queryMockConfig,
              resolveQueryPromise = mockedQueryValue.resolveQueryPromise;
          var status = queryMockConfig.status;

          if (status && status >= 400) {
            // Bail early if status is a failure
            throw new Error("Request failed with status ".concat(status));
          }

          var hasVariablesOrMatchFn = !!(queryMockConfig.variables || queryMockConfig.matchVariables);
          var shouldMatchOnVariables = queryMockConfig.matchOnVariables && hasVariablesOrMatchFn;

          if (!shouldMatchOnVariables || (queryMockConfig.matchVariables ? queryMockConfig.matchVariables(variables) : (0, _deepEqual.default)(variables, queryMockConfig.variables))) {
            var serverResponseData = {
              data: queryMockConfig.data
            };
            var changeServerResponseFn = queryMockConfig.changeServerResponse || queryMock._changeServerResponseFn;
            var serverResponse = changeServerResponseFn(queryMockConfig, serverResponseData);
            var returnVal = queryMockConfig.customHandler ? queryMockConfig.customHandler(this.req) : [queryMockConfig.status || 200, serverResponse];
            queryMock.addCall({
              id: id,
              variables: variables,
              headers: this.req.headers,
              response: serverResponse
            });

            if (resolveQueryPromise) {
              preventThrowing = true; // Wait for resolution control promise to resolve if it exists

              _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee() {
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return resolveQueryPromise;

                      case 2:
                        cb(null, returnVal);

                      case 3:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }))();
            } else {
              cb(null, returnVal);
              return returnVal;
            }
          }
        }
      }
    }

    if (!preventThrowing) {
      throw new Error('No suitable mock found. Please make sure you have mocked the query you are making.');
    }
  };
}