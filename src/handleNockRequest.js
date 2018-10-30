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
  return function handleTheRequest(
    uri: string,
    data: mixed,
    cb: (null, [number, mixed]) => void
  ) {
    let operationName: ?string = null;

    if (data && typeof data === 'object') {
      operationName =
        typeof data.query === 'string'
          ? getOperationNameFromQuery(data.query)
          : null;

      if (operationName) {
        const variables =
          data.variables !== null && typeof data.variables === 'object'
            ? data.variables
            : {};

        const mockedQueryRecord = queryMock._getQueryMock(operationName);

        if (mockedQueryRecord) {
          const { queryMockConfig, resolveQueryPromise } = mockedQueryRecord;
          const { status } = queryMockConfig;

          if (status && status >= 400) {
            // Bail early if status is a failure
            throw queryMockConfig.error ||
              new Error(
                `Request for operation "${operationName ||
                  'unknown'}" failed with status ${status}. This is intentional and set up in the mock.`
              );
          }

          const hasVariablesOrMatchFn = !!(
            queryMockConfig.variables || queryMockConfig.matchVariables
          );

          const shouldMatchOnVariables =
            queryMockConfig.matchOnVariables && hasVariablesOrMatchFn;

          if (
            !shouldMatchOnVariables || // Bypass if we should not match on variables
            (queryMockConfig.matchVariables
              ? queryMockConfig.matchVariables(variables)
              : deepEqual(variables, queryMockConfig.variables))
          ) {
            const serverResponseData: ServerResponse = {
              data: queryMockConfig.data
            };

            /**
             * This is a default function that just returns itself (ie does not change the server response)
             * unless provided a custom function.
             **/
            const changeServerResponseFn: ChangeServerResponseFn =
              queryMockConfig.changeServerResponse ||
              queryMock._changeServerResponseFn;

            const serverResponse = changeServerResponseFn(
              queryMockConfig,
              serverResponseData
            );

            const nockReturnVal = queryMockConfig.customHandler
              ? queryMockConfig.customHandler(this.req)
              : [queryMockConfig.status || 200, serverResponse];

            // Make sure we add the call to our list
            queryMock._addCall({
              id: operationName,
              variables,
              headers: this.req.headers,
              response: serverResponse
            });

            if (resolveQueryPromise) {
              // Wait for resolution control promise to resolve if it exists
              (async () => {
                await resolveQueryPromise;
                cb(null, nockReturnVal);
              })();
            } else {
              cb(null, nockReturnVal);
              return nockReturnVal;
            }
          } else {
            // More useful errors
            if (shouldMatchOnVariables) {
              let errorStr = `Variables do not match for operation "${operationName ||
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
        } else {
          const mockedQueries = Object.keys(queryMock._queries);
          throw new Error(
            `No suitable mock for operation "${operationName ||
              'unknown'}" found. Please make sure you have mocked the query you are making.${
              mockedQueries.length > 0
                ? '\n\nCurrently mocked queries: ' +
                  mockedQueries.map(queryName => `"${queryName}"`).join(', ')
                : ''
            }`
          );
        }
      } else {
        throw new Error(
          "Could not find operation name in request. Please make sure you're actually sending the query in your fetch."
        );
      }
    }
  };
}
