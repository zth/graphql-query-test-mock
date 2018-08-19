import { GRAPHQL_API_URL } from '../__testUtils__/fetchQuery';
import { queryMock } from '../__testUtils__/queryMock';

global.fetch = require('node-fetch');
queryMock.setup(GRAPHQL_API_URL);
