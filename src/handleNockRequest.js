// @flow strict
import deepEqual from 'deep-equal';
import { getOperationNameFromQuery } from './getOperationNameFromQuery';
import { QueryMock } from './index';
import type { ChangeServerResponseFn } from './index';
import type { ServerResponse } from './types';

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

    if (data && typeof data === 'object') {
      const id =
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
          }
        }
      }
    }

    if (!preventThrowing) {
      throw new Error(
        'No suitable mock found. Please make sure you have mocked the query you are making.'
      );
    }
  };
}
