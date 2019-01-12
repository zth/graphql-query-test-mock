declare module 'graphql-query-test-mock' {
  type Variables = { [key: string]: any };
  type Data = { [key: string]: any };

  type CustomHandlerConfigData = {
    query: string;
    operationName: string;
    variables: Variables;
  };

  type ServerResponse = {
    data: Data;
  };

  type NockReturnVal = [number, ServerResponse];

  export type MockGraphQLConfig = {
    name: string;
    data: Data;
    error?: Data;
    variables?: Variables;
    matchOnVariables?: boolean;
    matchVariables?: (variables: Variables) => boolean | Promise<boolean>;
    ignoreThesePropertiesInVariables?: string[];
    status?: number;
    persist?: boolean;
    customHandler?: (
      req: any,
      config: CustomHandlerConfigData
    ) => NockReturnVal | Promise<NockReturnVal>;
    changeServerResponse?: ChangeServerResponseFn;
  };

  export type MockGraphQLRecord = {
    queryMockConfig: MockGraphQLConfig;
    resolveQueryPromise?: Promise<any>;
  };

  export type RecordedGraphQLQuery = {
    id: string;
    variables?: Variables;
    headers: { [key: string]: string };
    response: ServerResponse;
  };

  type QueryStoreObj = {
    [queryName: string]: Array<MockGraphQLRecord>;
  };

  export type ChangeServerResponseFn = (
    mockQueryConfig: MockGraphQLConfig,
    serverResponse: ServerResponse
  ) => ServerResponse;

  type CreateQueryMockConfig = {
    changeServerResponse?: ChangeServerResponseFn;
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
    cleanup(): void;
  }
}
