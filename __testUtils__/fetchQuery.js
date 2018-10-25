// @flow
type Operation = {
  text: string
};

export const GRAPHQL_API_URL = 'http://localhost/graphql';

export type FetchQueryConfig = {
  query: string,
  variables?: { [key: string]: mixed }
};

export function fetchQuery(
  operation: Operation,
  variables?: { [key: string]: mixed }
): Promise<*> {
  const config: FetchQueryConfig = {
    query: operation.text,
    variables
  };

  return fetch(GRAPHQL_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(config)
  }).then(response => response.json());
}
