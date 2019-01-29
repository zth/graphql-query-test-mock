// @flow
import { fetchQuery } from '../__testUtils__/fetchQuery';
import { queryMock } from '../__testUtils__/queryMock';


describe('handleErrors', () => {
  describe('printNoMockFoundError', () => {
    it('should throw an error when there is no query name', async () => {
      try {
        const res = await fetchQuery({
          text: 'query { id }',
        });
      } catch (error) {
        expect(error.message).toMatchSnapshot();
        return;
      };
      throw new Error('No error was raised');
    });

    it('should throw an error when there is no mocked query', async () => {
      try {
        const res = await fetchQuery({
          text: 'query TestQuery { id }',
        });
      } catch (error) {
        expect(error.message).toMatchSnapshot();
        return;
      };
      throw new Error('No error was raised');
    });

    it('should throw an error when there is 1 matching query name', async () => {
      queryMock.mockQuery({
        name: 'TestQuery',
        data: {},
        variables: {
          variable1: 'VARIABLE_1',
        },
      });

      try {
        const res = await fetchQuery({
          text: 'query TestQuery { id }',
        });
      } catch (error) {
        expect(error.message).toMatchSnapshot();
        return;
      };
      throw new Error('No error was raised');
    });

    it('should throw an error when there are multiple matching query names', async () => {
      queryMock.mockQuery({
        name: 'TestQuery',
        data: {},
        variables: {
          variable1: 'VARIABLE_1',
        },
      });
      queryMock.mockQuery({
        name: 'TestQuery',
        data: {
          test: 'DATA 2',
        },
        variables: {
          variable2: 'VARIABLE_2',
        },
      });

      try {
        const res = await fetchQuery({
          text: 'query TestQuery { id }'
        });
      } catch (error) {
        expect(error.message).toMatchSnapshot();
        return;
      };
      throw new Error('No error was raised');
    });

    it('should throw an error when there is 1 non-matching query names', async () => {
      queryMock.mockQuery({
        name: 'TestQuery1',
        data: {},
      });

      try {
        const res = await fetchQuery({
          text: 'query TestQuery2 { id }'
        });
      } catch (error) {
        expect(error.message).toMatchSnapshot();
        return;
      };
      throw new Error('No error was raised');
    });

    it('should throw an error when there are multiple non-matching query names', async () => {
      queryMock.mockQuery({
        name: 'TestQuery1',
        data: {},
      });

      queryMock.mockQuery({
        name: 'TestQuery2',
        data: {},
      });

      queryMock.mockQuery({
        name: '', // unknown
        data: {},
      });

      try {
        const res = await fetchQuery({
          text: 'query TestQuery3 { id }'
        });
      } catch (error) {
        expect(error.message).toMatchSnapshot();
        return;
      };
      throw new Error('No error was raised');
    });

    it('should throw an error when there are both matching and non-matching query names', async () => {
      queryMock.mockQuery({
        name: 'TestQuery1',
        data: {},
        variables: {
          variable1: 'VARIABLE_1',
        },
      });
      queryMock.mockQuery({
        name: 'TestQuery2',
        data: {},
      });

      try {
        const res = await fetchQuery({
          text: 'query TestQuery1 { id }'
        });
      } catch (error) {
        expect(error.message).toMatchSnapshot();
        return;
      };
      throw new Error('No error was raised');
    });
  });
});
