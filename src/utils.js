// @flow strict
import { DEFAULT_CONFIG } from './defaults';
import type { MockGraphQLConfig, MockGraphQLRecord } from './index';
import type { Variables } from './types';

export function getQueryMockID(
  queryName: string,
  variables: ?Variables,
  ignoreThesePropertiesInVariables: Array<string>
): string {
  const processedVariables = variables || {};

  ignoreThesePropertiesInVariables.forEach(propName => {
    delete processedVariables[propName];
  });

  return `${queryName}__${JSON.stringify(processedVariables)}`;
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
