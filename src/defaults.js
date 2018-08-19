// @flow strict
import type {
  ChangeServerResponseFn,
  ExtractOperationIdFn,
  MockGraphQLConfig
} from './index';

export const DEFAULT_CONFIG: $Shape<MockGraphQLConfig> = {
  matchOnVariables: true,
  persist: true
};

export const defaultExtractOperationIdFn: ExtractOperationIdFn = data =>
  typeof data.id === 'string'
    ? data.id
    : typeof data.name === 'string' ? data.name : '';

export const defaultChangeServerResponseFn: ChangeServerResponseFn = (
  _,
  response
) => response;
