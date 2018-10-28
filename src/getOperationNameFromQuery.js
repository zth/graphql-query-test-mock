// @flow strict
import { parse } from 'graphql/language/parser';

export function getOperationNameFromQuery(query: string): string {
  try {
    const { definitions } = parse(query);
    const definition = definitions.length > 0 ? definitions[0] : null;

    const operationName =
      definition && definition.name && definition.name.value
        ? definition.name.value
        : null;

    if (!operationName) {
      throw new Error();
    }

    return String(operationName);
  } catch (e) {
    throw new Error('Could not find query name.');
  }
}
