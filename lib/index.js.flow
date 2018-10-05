// @flow strict
import nock from 'nock';
import url from 'url';
import {
  DEFAULT_CONFIG,
  defaultChangeServerResponseFn,
  defaultExtractOperationIdFn
} from './defaults';
import { handleNockRequest } from './handleNockRequest';
import type { Data, ServerResponse, Variables } from './types';

export type MockGraphQLConfig = {|
  name: string,
  data: Data,
  error: Data,
  variables?: Variables,
  matchOnVariables?: boolean,
  matchVariables?: (variables: Variables) => boolean | Promise<boolean>,
  status?: number,
  persist?: boolean,
  customHandler?: (req: *) => [number, mixed],
  changeServerResponse?: ChangeServerResponseFn
|};

export type MockGraphQLRecord = {|
  queryMockConfig: MockGraphQLConfig,
  resolveQueryPromise?: Promise<mixed>
|};

export type RecordedGraphQLQuery = {|
  id: string,
  variables: ?Variables,
  headers: { [key: string]: string },
  response: ServerResponse
|};

type QueryStoreObj = {
  [queryName: string]: Array<MockGraphQLRecord>
};

export type ExtractOperationIdFn = <T: Object>(data: T) => string;

export type ChangeServerResponseFn = (
  mockQueryConfig: MockGraphQLConfig,
  serverResponse: ServerResponse
) => ServerResponse;

type CreateQueryMockConfig = {|
  extractOperationId?: ExtractOperationIdFn,
  changeServerResponse?: ChangeServerResponseFn
|};

export class QueryMock {
  _calls: Array<RecordedGraphQLQuery> = [];
  _queries: QueryStoreObj = {};
  _extractOperationIdFn: ExtractOperationIdFn = defaultExtractOperationIdFn;
  _changeServerResponseFn: ChangeServerResponseFn = defaultChangeServerResponseFn;

  constructor(config: ?CreateQueryMockConfig) {
    if (!config) {
      return;
    }

    const { extractOperationId, changeServerResponse } = config;

    if (extractOperationId) {
      this._extractOperationIdFn = extractOperationId;
    }

    if (changeServerResponse) {
      this._changeServerResponseFn = changeServerResponse;
    }
  }

  addCall(call: RecordedGraphQLQuery) {
    this._calls.push(call);
  }

  reset() {
    this._calls = [];
    this._queries = {};
  }

  getCalls(): Array<RecordedGraphQLQuery> {
    return [...this._calls];
  }

  getOrCreateMockQueryHolder(id: string): Array<MockGraphQLRecord> {
    if (!this._queries[id]) {
      this._queries[id] = [];
    }

    return this._queries[id];
  }

  mockQuery(config: MockGraphQLConfig) {
    this.getOrCreateMockQueryHolder(config.name).push({
      queryMockConfig: {
        ...DEFAULT_CONFIG,
        ...config
      }
    });
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

    this.getOrCreateMockQueryHolder(config.name).push({
      queryMockConfig: {
        ...DEFAULT_CONFIG,
        ...config
      },
      resolveQueryPromise
    });

    return resolveQueryFn;
  }

  getQueryMock(name: string): ?MockGraphQLRecord {
    const queryMockHolder = this._queries[name];

    if (!queryMockHolder || queryMockHolder.length < 1) {
      return null;
    }

    return queryMockHolder[0].queryMockConfig.persist
      ? queryMockHolder[0]
      : queryMockHolder.shift();
  }

  setup(graphQLURL: string) {
    this.reset();

    const theUrl = url.parse(graphQLURL);

    nock(`${theUrl.protocol || 'https:'}//${theUrl.host || 'localhost'}`)
      .persist()
      .post(theUrl.path || '/')
      .reply(handleNockRequest(this));
  }
}
