// @flow
import { getOperationNameFromQuery } from '../src/getOperationNameFromQuery';

describe('getOperationNameFromQuery', () => {
  it('should extract operation name from query', () => {
    expect(getOperationNameFromQuery(`query SomeQuery { viewer { id } }`)).toBe(
      'SomeQuery'
    );
  });

  it('should extract operation name from query and skip fragment names', () => {
    expect(
      getOperationNameFromQuery(
        `fragment SomeFragment on Viewer { id } query SomeQuery { viewer { id, ...SomeFragment } }`
      )
    ).toBe('SomeQuery');
  });

  it('should throw if it cannot extract name from operation', () => {
    expect.assertions(1);

    try {
      getOperationNameFromQuery(`{ id }`);
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });
});
