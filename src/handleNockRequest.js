// @flow strict
import deepEqual from 'deep-equal';
import { getOperationNameFromQuery } from './getOperationNameFromQuery';
import { QueryMock } from './index';
import type { ChangeServerResponseFn } from './index';
import type { ServerResponse } from './types';
import printDiff from 'jest-diff';

type NockHandleFn = (
  uri: string,
  data: mixed,
  cb: (null, [number, mixed]) => void
) => ?[number, mixed];

export function handleNockRequest(queryMock: QueryMock): NockHandleFn {
  return function(
    uri: string,
    data: mixed,
    cb: (null, [number, mixed]) => void
  ) {
    let preventThrowing = false;
    let id: ?string = null;

    if (data && typeof data === 'object') {
      id =
        typeof data.query === 'string'
          ? getOperationNameFromQuery(data.query)
          : null;

      if (id) {
        const variables =
          data.variables !== null && typeof data.variables === 'object'
            ? data.variables
            : {};

        const mockedQueryValue = queryMock._getQueryMock(id);

        if (mockedQueryValue) {
          const { queryMockConfig, resolveQueryPromise } = mockedQueryValue;
          const { status } = queryMockConfig;

          if (status && status >= 400) {
            // Bail early if status is a failure
            throw queryMockConfig.error ||
              new Error(`Request failed with status ${status}`);
          }

          const hasVariablesOrMatchFn = !!(
            queryMockConfig.variables || queryMockConfig.matchVariables
          );
          const shouldMatchOnVariables =
            queryMockConfig.matchOnVariables && hasVariablesOrMatchFn;

          if (
            !shouldMatchOnVariables ||
            (queryMockConfig.matchVariables
              ? queryMockConfig.matchVariables(variables)
              : deepEqual(variables, queryMockConfig.variables))
          ) {
            const serverResponseData: ServerResponse = {
              data: queryMockConfig.data
            };

            const changeServerResponseFn: ChangeServerResponseFn =
              queryMockConfig.changeServerResponse ||
              queryMock._changeServerResponseFn;

            const serverResponse = changeServerResponseFn(
              queryMockConfig,
              serverResponseData
            );

            const returnVal = queryMockConfig.customHandler
              ? queryMockConfig.customHandler(this.req)
              : [queryMockConfig.status || 200, serverResponse];

            queryMock._addCall({
              id,
              variables,
              headers: this.req.headers,
              response: serverResponse
            });

            if (resolveQueryPromise) {
              preventThrowing = true;

              // Wait for resolution control promise to resolve if it exists
              (async () => {
                await resolveQueryPromise;
                cb(null, returnVal);
              })();
            } else {
              cb(null, returnVal);
              return returnVal;
            }
          } else {
            // More useful errors
            if (shouldMatchOnVariables) {
              let errorStr = `Variables do not match for operation "${id ||
                'unknown'}"`;

              if (queryMockConfig.matchVariables) {
                throw new Error(
                  `${errorStr} due to custom "matchOnVariables" function`
                );
              } else {
                throw new Error(
                  `${errorStr}.\n\nVariables in request VS mocked variables: \n${printDiff(
                    variables,
                    queryMockConfig.variables
                  )}`
                );
              }
            }
          }
        }
      }
    }

    if (!preventThrowing) {
      const mockedQueries = Object.keys(queryMock._queries);
      throw new Error(
        `No suitable mock for operation "${id ||
          'unknown'}" found. Please make sure you have mocked the query you are making.${
          mockedQueries.length > 0
            ? '\n\nCurrently mocked queries: ' +
              mockedQueries.map(queryName => `"${queryName}"`).join(', ')
            : ''
        }`
      );
    }
  };
}
