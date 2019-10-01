// @flow strict
import nock from 'nock';
import url from 'url';
import { defaultChangeServerResponseFn } from './defaults';
import { getNockRequestHandlerFn } from './getNockRequestHandlerFn';
import type { Data, ServerResponse, Variables, Error } from './types';
import { createMockGraphQLRecord, getQueryMockID } from './utils';

export type MockGraphQLConfig = {|
  /**
   * The name of the query to mock.
   * Example: `query QueryNameIsHere { ... }`.
   */
  name: string,

  /**
   * The data to return for this particular query.
   */
  data: Data,

  /**
   * If you need to return GraphQL errors you can return an array of them here. Note that
   * this is different to the "error" prop below, and this should be used whenever the
   * GraphQL server would respond with a status 200, but have GraphQL errors.
   */

  graphqlErrors?: Array<Error>,

  /**
   * If you want, you can return a custom error here that'll be thrown by the API if
   * you return a status like 401. Note that this is *an error for the entire request*,
   * not GraphQL errors. For returning GraphQL errors, see the "graphqlErrors" prop.
   */
  error?: Data,

  /**
   * The status to return from the API. Defaults to 200, but can be changed to 401
   * or similar if you want to test more complex interactions with the API.
   */
  status?: number,

  /**
   * This tells QueryMock whether you want the query you mock to only be valid for the
   * exact variables you pass `mockQuery` when mocking. Matching on the variables is
   * a convenient way to test that the correct variables are used by your app.
   * Default: true.
   */
  matchOnVariables?: boolean,

  /**
   * This is a convenience method you can use if you want to match on variables in a
   * more dynamic way, for example when using relative dates in your queries.
   * NOTE: Use this only in very specific cases, instead prefer using "ignoreThesePropertiesInVariables"
   * defined below.
   *
   * Takes precedence over matchOnVariables above if specified.
   */
  matchVariables?: (variables: Variables) => boolean | Promise<boolean>,

  /**
   * The variables to match this specific query mock to.
   * Example: variables: { id: 123 } would only match when exactly { id: 123 } is sent
   * as variables for this query.
   */
  variables?: Variables,

  /**
   * A list of properties to ignore when matching variables. This is very useful when you use unstable variables
   * like dates in your queries. For example:
   * ignoreThesePropertiesInVariables: ["fromDate", "toDate"] used with variables: { someProp: true, fromDate: someDate, toDate: someOtherDate }
   * will match variables only on someProp, and ignore fromDate/toDate.
   */

  ignoreThesePropertiesInVariables?: Array<string>,

  /**
   * Whether to persist this mock or not, meaning whether it should be valid for several
   * calls in a row, or delete itself after being used once. Set this to false when you
   * need to test a more complex flow of calls using the same query, but needing different
   * responses.
   *
   * Default: true
   */
  persist?: boolean,

  /**
   * A custom handler that lets you return a custom `nock` response for this mock.
   * `req` is the `nock` request, and it expects you to return [statusCode, serverResponse], like:
   * [200, { data: { id: '123 } }].
   */
  customHandler?: (
    req: *,
    config: {|
      query: string,
      operationName: string,
      variables: ?Variables
    |}
  ) => [number, ServerResponse] | Promise<[number, ServerResponse]>,

  /**
   * Sometimes you need to change the server response object dynamically for a query mock.
   * This allows you to do so. Example:
   * changeServerResponse: (config, response) => ({ ...response, invalidToken: true })
   */
  changeServerResponse?: ChangeServerResponseFn
|};

export type MockGraphQLRecord = {|
  id: string,
  queryMockConfig: MockGraphQLConfig,
  resolveQueryPromise?: Promise<mixed>
|};

export type RecordedGraphQLQuery = {|
  /**
   * The id of the query. Same as the query name, ex: `query QueryName { ... }`.
   */
  id: string,

  /**
   * Variables used in this specific call.
   */
  variables: ?Variables,

  /**
   * Headers used for this specific call.
   */
  headers: { [key: string]: string },

  /**
   * Full response object returned by the server for this specific call.
   */
  response: ServerResponse
|};

type QueryStoreObj = {
  [queryName: string]: Array<MockGraphQLRecord>
};

export type ChangeServerResponseFn = (
  mockQueryConfig: MockGraphQLConfig,
  serverResponse: ServerResponse
) => ServerResponse;

type CreateQueryMockConfig = {|
  changeServerResponse?: ChangeServerResponseFn
|};

export class QueryMock {
  _calls: Array<RecordedGraphQLQuery> = [];
  _queries: QueryStoreObj = {};
  _changeServerResponseFn: ChangeServerResponseFn = defaultChangeServerResponseFn;

  constructor(config: ?CreateQueryMockConfig) {
    if (!config) {
      return;
    }

    const { changeServerResponse } = config;

    if (changeServerResponse) {
      this._changeServerResponseFn = changeServerResponse;
    }
  }

  _addCall(call: RecordedGraphQLQuery) {
    this._calls.push(call);
  }

  reset() {
    this._calls = [];
    this._queries = {};
  }

  getCalls(): Array<RecordedGraphQLQuery> {
    return [...this._calls];
  }

  _getOrCreateMockQueryHolder(id: string): Array<MockGraphQLRecord> {
    if (!this._queries[id]) {
      this._queries[id] = [];
    }

    return this._queries[id];
  }

  mockQuery(config: MockGraphQLConfig) {
    this._getOrCreateMockQueryHolder(config.name).push(
      createMockGraphQLRecord(config)
    );
  }

  mockQueryWithControlledResolution(config: MockGraphQLConfig): () => void {
    let resolver = null;

    const resolveQueryPromise = new Promise(resolve => {
      resolver = resolve;
    });

    const resolveQueryFn = () => {
      let interval = setInterval(() => {
        if (resolver) {
          clearInterval(interval);
          resolver();
        }
      }, 50);
    };

    this._getOrCreateMockQueryHolder(config.name).push(
      createMockGraphQLRecord(config, resolveQueryPromise)
    );

    return resolveQueryFn;
  }

  _getQueryMock(name: string, variables: ?Variables): ?MockGraphQLRecord {
    const queryMockHolder = this._queries[name];

    if (!queryMockHolder || queryMockHolder.length < 1) {
      return null;
    }

    let matchingQueryMock: ?MockGraphQLRecord = null;

    for (let i = 0; i <= queryMockHolder.length - 1; i += 1) {
      const thisQueryMock = queryMockHolder[i];

      const {
        matchVariables,
        matchOnVariables,
        ignoreThesePropertiesInVariables
      } = thisQueryMock.queryMockConfig;

      // Use custom variables match function if it exists
      if (matchVariables && matchVariables(variables || {})) {
        matchingQueryMock = thisQueryMock;
        break;
      }

      // Bail if this query mock is not configured to match on variables. We handle that case below after the loop.
      if (!matchOnVariables) {
        continue;
      }

      /**
       * Get the ID of this particular mocked query using the provided mock's data.
       * This enables us to check if this mock matches, accounting for any properties
       * that are to be ignored in the mock variables.
       */
      const processedIdForProvidedMockData = getQueryMockID(
        name,
        variables,
        ignoreThesePropertiesInVariables || []
      );

      if (processedIdForProvidedMockData === thisQueryMock.id) {
        matchingQueryMock = thisQueryMock;
        break;
      }
    }

    /**
     * If we got all the way here it means we found no matches.
     * We'll check if any of the mocked queries has variable matching off,
     * and if so return that. We start from the latest added queries.
     */
    for (let i = queryMockHolder.length - 1; i >= 0; i -= 1) {
      const thisQueryMock = queryMockHolder[i];

      if (!thisQueryMock.queryMockConfig.matchOnVariables) {
        matchingQueryMock = thisQueryMock;
        break;
      }
    }

    if (matchingQueryMock) {
      return matchingQueryMock.queryMockConfig.persist
        ? matchingQueryMock
        : queryMockHolder
            .splice(queryMockHolder.indexOf(matchingQueryMock), 1)
            .pop();
    }

    return null;
  }

  setup(graphQLURL: string) {
    this.reset();

    const theUrl = url.parse(graphQLURL);

    nock(`${theUrl.protocol || 'https:'}//${theUrl.host || 'localhost'}`)
      .persist()
      .post(theUrl.path || '/')
      .reply(getNockRequestHandlerFn(this));
  }

  cleanup() {
    nock.cleanAll();
    nock.enableNetConnect();
    nock.restore();
  }
}
