declare module 'graphql-query-test-mock' {
  type Variables = { [key: string]: any };
  type Data = { [key: string]: any };

  type ServerResponse = {
    data: Data
  };

  export type MockGraphQLConfig = {
    name: string,
    data: Data,
    variables?: Variables,
    matchOnVariables?: boolean,
    matchVariables?: (variables: Variables) => boolean | Promise<boolean>,
    status?: number,
    persist?: boolean,
    customHandler?: (req: any) => [number, any],
    changeServerResponse?: ChangeServerResponseFn
  };

  export type MockGraphQLRecord = {
    queryMockConfig: MockGraphQLConfig,
    resolveQueryPromise?: Promise<any>
  };

  export type RecordedGraphQLQuery = {
    id: string,
    variables?: Variables,
    headers: { [key: string]: string },
    response: ServerResponse
  };

  type QueryStoreObj = {
    [queryName: string]: Array<MockGraphQLRecord>
  };

  export type ExtractOperationIdFn = <T>(data: T) => string;

  export type ChangeServerResponseFn = (
    mockQueryConfig: MockGraphQLConfig,
    serverResponse: ServerResponse
  ) => ServerResponse;

  type CreateQueryMockConfig = {
    extractOperationId?: ExtractOperationIdFn,
    changeServerResponse?: ChangeServerResponseFn
  };

  export class QueryMock {
    constructor(config?: CreateQueryMockConfig);

    addCall(call: RecordedGraphQLQuery): void;
    reset(): void;
    getCalls(): Array<RecordedGraphQLQuery>;
    getOrCreateMockQueryHolder(id: string): Array<MockGraphQLRecord>;
    mockQuery(config: MockGraphQLConfig): void;
    mockQueryWithControlledResolution(config: MockGraphQLConfig): () => void;
    getQueryMock(name: string): MockGraphQLRecord | undefined;
    setup(graphQLURL: string): void;
  }
}
