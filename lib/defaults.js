"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultChangeServerResponseFn = exports.defaultExtractOperationIdFn = exports.DEFAULT_CONFIG = void 0;
//  strict
var DEFAULT_CONFIG = {
  matchOnVariables: true,
  persist: true
};
exports.DEFAULT_CONFIG = DEFAULT_CONFIG;

var defaultExtractOperationIdFn = function defaultExtractOperationIdFn(data) {
  return typeof data.id === 'string' ? data.id : typeof data.name === 'string' ? data.name : '';
};

exports.defaultExtractOperationIdFn = defaultExtractOperationIdFn;

var defaultChangeServerResponseFn = function defaultChangeServerResponseFn(_, response) {
  return response;
};

exports.defaultChangeServerResponseFn = defaultChangeServerResponseFn;