// @flow strict
import type { ChangeServerResponseFn, MockGraphQLConfig } from './index';

export const DEFAULT_CONFIG: $Shape<MockGraphQLConfig> = {
  matchOnVariables: true,
  persist: true
};

export const defaultChangeServerResponseFn: ChangeServerResponseFn = (
  _,
  response
) => response;
