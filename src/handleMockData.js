// @flow strict
import { QueryMock } from './index';
import type { Variables } from './types';

export async function returnMockData(
  queryMock: QueryMock,
  queryStr: string,
  variables?: Variables
): Promise<{}> {
  const rawSchema = queryMock.getRawSchema();

  // Resolve mocked response data
  return {};
}
