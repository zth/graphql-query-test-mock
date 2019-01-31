// @flow strict
import hash from 'object-hash';
import { DEFAULT_CONFIG } from './defaults';
import type { MockGraphQLConfig, MockGraphQLRecord } from './index';
import type { Variables } from './types';

export function getQueryMockID(
  queryName: string,
  variables: ?Variables,
  ignoreThesePropertiesInVariables: Array<string>
): string {
  const processedVariables = getVariables(
    variables,
    ignoreThesePropertiesInVariables
  );

  return `${queryName}__${hash.sha1(processedVariables)}`;
}

export function getVariables(
  variables: ?Variables,
  ignoreThesePropertiesInVariables: Array<string>
): Variables {
  const vars = {
    ...variables
  };

  ignoreThesePropertiesInVariables.forEach(propName => {
    delete vars[propName];
  });

  return vars;
}

export function createMockGraphQLRecord(
  config: MockGraphQLConfig,
  resolveQueryPromise?: Promise<mixed>
): MockGraphQLRecord {
  const queryMockConfig: MockGraphQLConfig = {
    variables: {},
    ...DEFAULT_CONFIG,
    ...config
  };

  let ignoreThesePropertiesInVariables: Array<string> =
    queryMockConfig.ignoreThesePropertiesInVariables || [];

  if (!queryMockConfig.matchOnVariables && !queryMockConfig.matchVariables) {
    ignoreThesePropertiesInVariables = Object.keys(
      queryMockConfig.variables || {}
    );
  }

  return {
    id: getQueryMockID(
      queryMockConfig.name,
      queryMockConfig.variables,
      ignoreThesePropertiesInVariables
    ),
    queryMockConfig: {
      ...queryMockConfig,
      ignoreThesePropertiesInVariables
    },
    resolveQueryPromise
  };
}
