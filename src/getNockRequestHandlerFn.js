// @flow strict
import deepEqual from 'deep-equal';
import { getOperationNameFromQuery } from './getOperationNameFromQuery';
import {
  printNoMockFoundError,
  printVariablesDoesNotMatchError
} from './handleErrors';
import { returnMockData } from './handleMockData';
import { QueryMock } from './index';
import type { ChangeServerResponseFn } from './index';
import type { ServerResponse } from './types';
import { getVariables } from './utils';

type NockHandleFn = (
  uri: string,
  data: mixed,
  cb: (null, [number, mixed]) => void
) => ?[number, mixed];

export function getNockRequestHandlerFn(queryMock: QueryMock): NockHandleFn {
  return function handleNockRequest(
    uri: string,
    data: mixed,
    resolveNockRequestCallback: (null, [number, mixed]) => void
  ) {
    let operationName: ?string = null;

    if (data && typeof data === 'object') {
      const queryStr = typeof data.query === 'string' ? data.query : null;
      operationName = queryStr ? getOperationNameFromQuery(queryStr) : null;

      if (operationName && queryStr) {
        const variables =
          data.variables !== null && typeof data.variables === 'object'
            ? data.variables
            : {};

        const mockedQueryRecord = queryMock._getQueryMock(
          operationName,
          variables
        );

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
              : deepEqual(
                  getVariables(
                    variables,
                    queryMockConfig.ignoreThesePropertiesInVariables || []
                  ),
                  getVariables(
                    queryMockConfig.variables,
                    queryMockConfig.ignoreThesePropertiesInVariables || []
                  )
                ))
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
                resolveNockRequestCallback(null, nockReturnVal);
              })();
            } else {
              resolveNockRequestCallback(null, nockReturnVal);
              return nockReturnVal;
            }
          } else {
            // More useful errors
            printVariablesDoesNotMatchError(
              queryMockConfig,
              shouldMatchOnVariables,
              operationName,
              variables
            );
          }
        } else {
          if (queryMock.shouldAutoMock()) {
            (async () => {
              resolveNockRequestCallback(null, [
                200,
                await returnMockData(queryMock, queryStr, variables)
              ]);
            })();
          } else {
            printNoMockFoundError(queryMock, operationName, variables);
          }
        }
      } else {
        throw new Error(
          "Could not find operation name in request. Please make sure you're actually sending the query in your fetch."
        );
      }
    }
  };
}
