// @flow strict
import printDiff from 'jest-diff';
import type { MockGraphQLConfig } from './index';
import { QueryMock } from './index';
import type { Variables } from './types';

export function printNoMockFoundError(
  queryMock: QueryMock,
  operationName: string,
  variables: Variables
): void {
  const mockedQueries = Object.keys(queryMock._queries);
  throw new Error(
    `No suitable mock for operation "${operationName ||
      'unknown'}" with variables ${JSON.stringify(
      variables
    )} found. Please make sure you have mocked the query you are making.${
      mockedQueries.length > 0
        ? '\n\n === Currently mocked queries ===\n' +
          mockedQueries
            .map(
              queryName =>
                `"${queryName}" with variables: \n\n  ${queryMock._queries[
                  queryName
                ]
                  .map(
                    ({ queryMockConfig }) =>
                      `${JSON.stringify(
                        queryMockConfig.variables
                      )}, diff: \n${printDiff(
                        variables,
                        queryMockConfig.variables
                      )}`
                  )
                  .join('\n\n  ')}`
            )
            .join(', ')
        : ''
    }`
  );
}

export function printVariablesDoesNotMatchError(
  queryMockConfig: MockGraphQLConfig,
  shouldMatchOnVariables: boolean,
  operationName: string,
  variables: Variables
): void {
  if (shouldMatchOnVariables) {
    let errorStr = `Variables do not match for operation "${operationName ||
      'unknown'}"`;

    if (queryMockConfig.matchVariables) {
      throw new Error(`${errorStr} due to custom "matchOnVariables" function`);
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
