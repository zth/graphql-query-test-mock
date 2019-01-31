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
  const errorMessageArray = getNoMockFoundErrorMessageArray(
    queryMock,
    operationName,
    variables
  );
  throw new Error(errorMessageArray.join(''));
}

function getNoMockFoundErrorMessageArray(
  queryMock: QueryMock,
  operationName: string,
  variables: Variables
): Array<string> {
  const mockedQueriesMessageArray = [
    `Could not find matching mock for operation "${operationName}" ` +
      `with variables: ${JSON.stringify(variables)}\n` +
      `Make sure you have mocked the query you are making.\n\n`
  ];

  if (!Object.entries(queryMock._queries).length) {
    mockedQueriesMessageArray.push(`=== No query was mocked ===\n\n`);
    return mockedQueriesMessageArray;
  }

  if (queryMock._queries[operationName]) {
    mockedQueriesMessageArray.push(
      `=== Currently mocked "${operationName}" queries ===\n`
    );
    queryMock._queries[operationName].forEach(({ queryMockConfig }) => {
      mockedQueriesMessageArray.push(
        `Query "variables": ${JSON.stringify(queryMockConfig.variables)}\n` +
          `Diff of "variables":\n` +
          `${printDiff(queryMockConfig.variables, variables)}\n\n`
      );
    });
  }

  const otherMockedQueryNames = Object.keys(queryMock._queries).filter(
    queryMockName => operationName !== queryMockName
  );
  if (!otherMockedQueryNames.length) {
    return mockedQueriesMessageArray;
  }

  mockedQueriesMessageArray.push(
    `=== ${
      queryMock._queries[operationName] ? 'Other' : 'All'
    } mocked queries ===\n`
  );
  otherMockedQueryNames.forEach(queryName => {
    mockedQueriesMessageArray.push(`- "${queryName || 'unknown'}"\n`);
  });
  mockedQueriesMessageArray.push(`\n`);
  return mockedQueriesMessageArray;
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
