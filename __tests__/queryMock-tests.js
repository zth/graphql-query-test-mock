// @flow
import { fetchQuery } from '../__testUtils__/fetchQuery';
import { queryMock } from '../__testUtils__/queryMock';

describe('queryMock', () => {
  describe('Basic queries', () => {
    it('should be able to mock basic queries', async () => {
      const testData = {
        test: 'data'
      };

      queryMock.mockQuery({
        name: 'TestQuery',
        data: testData
      });

      const res = await fetchQuery({
        name: 'TestQuery',
        text: ''
      });

      expect(res.data).toEqual(testData);
      expect(queryMock._calls.length).toBe(1);
    });

    it('should throw if query mock is not found', async () => {
      expect.assertions(1);

      try {
        await fetchQuery({
          name: 'NoMockForThisOne',
          text: ''
        });
      } catch (e) {
        expect(e.message).toBe(
          'No suitable mock found. Please make sure you have mocked the query you are making.'
        );
      }
    });
  });

  describe('Multiple queries', () => {
    it('should be able to mock queries in sequence with the same query id', async () => {
      const firstTestData = {
        first: 'data'
      };

      const secondTestData = {
        second: 'data'
      };

      queryMock.mockQuery({
        name: 'TestQuery',
        data: firstTestData,
        persist: false
      });

      queryMock.mockQuery({
        name: 'TestQuery',
        data: secondTestData,
        persist: false
      });

      const firstRes = await fetchQuery({
        name: 'TestQuery',
        text: ''
      });

      const secondRes = await fetchQuery({
        name: 'TestQuery',
        text: ''
      });

      expect(firstRes.data).toEqual(firstTestData);
      expect(secondRes.data).toEqual(secondTestData);
    });
  });

  describe('Setup', () => {
    describe('Resetting queries', () => {
      it('should resolve here as this is where the query mock is setup', async () => {
        const testData = {
          test: 'data'
        };

        queryMock.mockQuery({
          name: 'TestQuery',
          data: testData
        });

        const res = await fetchQuery({
          name: 'TestQuery',
          text: ''
        });

        expect(res.data).toEqual(testData);
        expect(queryMock._calls.length).toBe(1);
      });

      it('should throw here as old mocked query should be reset', async () => {
        expect.assertions(2);

        try {
          await fetchQuery({
            name: 'TestQuery',
            text: ''
          });
        } catch (e) {
          expect(e).toBeDefined();
          expect(queryMock._calls.length).toBe(0);
        }
      });
    });
  });

  describe('Matching on variables', () => {
    let mockData;
    let mockVariables;

    beforeEach(() => {
      mockData = { some: 'data' };
      mockVariables = {
        includeStuff: true,
        withStuff: true,
        filterOn: [123, 345],
        after: 'cursor'
      };
    });

    describe('By object', () => {
      it('should make sure variables match provided variables object if provided', async () => {
        queryMock.mockQuery({
          name: 'TestQuery',
          variables: mockVariables,
          data: mockData
        });

        const res = await fetchQuery(
          {
            name: 'TestQuery',
            text: ''
          },
          mockVariables
        );

        expect(res.data).toEqual(mockData);
      });

      it('should throw if variables does not match', async () => {
        queryMock.mockQuery({
          name: 'TestQuery',
          variables: mockVariables,
          data: mockData
        });

        expect.assertions(1);

        try {
          await fetchQuery({
            name: 'TestQuery',
            text: ''
          });
        } catch (e) {
          expect(e.message).toBe(
            'No suitable mock found. Please make sure you have mocked the query you are making.'
          );
        }
      });

      it('should allow turning off matching per mocked query', async () => {
        queryMock.mockQuery({
          name: 'TestQuery',
          variables: mockVariables,
          data: mockData,
          matchOnVariables: false
        });

        const res = await fetchQuery({
          name: 'TestQuery',
          text: ''
        });

        expect(res.data).toEqual(mockData);
      });
    });

    describe('By function', () => {
      it('should allow matching variables with custom function', async () => {
        queryMock.mockQuery({
          name: 'TestQuery',
          matchVariables: variables => variables.includeStuff === true,
          data: mockData
        });

        const res = await fetchQuery(
          {
            name: 'TestQuery',
            text: ''
          },
          mockVariables
        );

        expect(res.data).toEqual(mockData);
      });
    });
  });

  describe('Controlling when response is resolved', () => {
    it('should be possible to control when response is resolved', async () => {
      const testData = {
        test: 'data'
      };

      const resolveQuery = queryMock.mockQueryWithControlledResolution({
        name: 'ControlledQuery',
        matchOnVariables: false,
        data: testData
      });

      let controlVariable = false;

      const returnPromise = fetchQuery({
        name: 'ControlledQuery',
        text: ''
      }).then(res => {
        controlVariable = true;
        return res;
      });

      // Make sure we wait. The then-fn above should not run until we've explicitly resolved the query by invoking
      // the resolve function above.
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(controlVariable).toBe(false);
      resolveQuery();

      await returnPromise;

      expect(controlVariable).toBe(true);
    });
  });

  describe('Changing the server response on the fly', () => {
    it('should be possible to change the server response arbitrarily by supplying a fn to query mock config', async () => {
      queryMock.mockQuery({
        name: 'AlteredQuery',
        data: {},
        changeServerResponse: (queryConfig, serverResponse) => ({
          ...serverResponse,
          someOtherPropOnResponse: true,
          data: {
            ...serverResponse.data,
            addedProp: true
          }
        })
      });

      const res = await fetchQuery({
        name: 'AlteredQuery',
        text: ''
      });

      expect(res).toEqual({
        someOtherPropOnResponse: true,
        data: {
          addedProp: true
        }
      });
    });
  });

  describe('Custom errors', () => {
    it('should return default error when status is 400 or above', async () => {
      const testData = {
        test: 'data'
      };

      queryMock.mockQuery({
        name: 'ErrorTestQuery',
        data: testData,
        status: 400
      });

      try {
        await fetchQuery({
          name: 'ErrorTestQuery',
          text: ''
        });
      } catch (e) {
        expect(e).toBeDefined();
        expect(e.toString()).toBe('Error: Request failed with status 400');
      }
    });

    it('should return default error when status is 400 or above and error is defined', async () => {
      const testData = {
        test: 'data'
      };

      const errorData = {
        error: 'data'
      };

      queryMock.mockQuery({
        name: 'ErrorTestQuery',
        data: testData,
        error: errorData,
        status: 400
      });

      try {
        await fetchQuery({
          name: 'ErrorTestQuery',
          text: ''
        });
      } catch (e) {
        expect(e).toBeDefined();
        expect(e).toBe(errorData);
      }
    });
  });
});
