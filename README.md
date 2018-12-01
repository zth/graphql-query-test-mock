# graphql-query-test-mock

A library to mock GraphQL queries when testing clients making calls to GraphQL-API:s. Ideal for use with something like Jest and Relay Modern/Apollo, but it's not bound to any specific client library.
Focus is on _realistic testing_. We use `nock` to do an as realistic mock as possible - requests will actually be dispatched from your client code, but intercepted at the `http` level by `nock`, allowing
for an as realistic testing environment as you can get without making requests to an actual server.

A few things this library helps with:

- It helps you _mock_ your GraphQL queries for you client.
- It helps you control that your queries and mutations are correct by _matching variables in your requests_, making sure you pass the correct variables.
- It lets you _control when queries resolve_, so you can make sure your loading and intermediate states all appear correct.
- It lets you simulate the API responding with statuses like 401/500, allowing you to test token refreshes, error states, and so on.
- It lets you resolve a sequence of responses, allowing you to test more complex scenarios like pagination and multiple executions of the same query returning different data.

## Installation

```
# nock is a peer dependency, please install that as well
yarn add graphql-query-test-mock nock --dev
```

You'll also need to have a `fetch` implementation available in your environment (`jest` does not come with one by default). You could for example use `node-fetch` and put something like
this in your test setup file:

```
global.fetch = require('node-fetch');
```

## Usage

Below is a detailed instruction on how to use the query mock. There's also an example [repo located here](https://github.com/zth/relay-modern-flow-jest-enzyme-example) which you can clone and check out for yourself.

### Setup

These instructions will assume you're using Jest, but adapting to other test frameworks should not be hard.

#### Create your QueryMock

First, create a file somewhere you can import from your tests. This file should create a QueryMock and export it, looking something like this:

```javascript
import { QueryMock } from 'graphql-query-test-mock';

export const queryMock = new QueryMock();
```

You will use this exported queryMock in your tests.

#### Make sure the query mock is initialized and reset between each test

In order for old mocks to not stick around between tests, we'll need to set up and tear down our mock between each test. We'll use Jests `setupTestFramework` file to accomplish that.
`setupTestFramework` allow us to run stuff before _each test_, allowing us to reset all query mocks and set up the new, fresh mock.
Please follow [Jests instructions on adding those files to your project](https://jestjs.io/docs/en/configuration.html), then continue here.

```javascript
// in the setupTestFramework file
import { queryMock } from '../path/to/your/queryMock';

// This is run before each test, making sure we always reset our mock
beforeEach(() => {
  queryMock.setup(GRAPHQL_API_URL); // Variable containing the URL for your GraphQL API. This must match what you're making requests to in your client code.
});
```

Now we're all set up and ready to mock queries!

### Mocking queries

Check out a fairly complete and exhaustive example of what can be done with this library [here](https://github.com/zth/relay-modern-flow-jest-enzyme-example).
Below is a a simple example using `react-testing-library`, but I do encourage you to look at the repo linked above.

```javascript
import { queryMock } from '../path/to/your/queryMock';
import { wait, render } from 'react-testing-library';
import React from 'react';

describe('Some test Relay Modern test', () => {
  it('should render the logged in users name', async () => {
    // This mocks all queries named 'StartQuery' with the data provided.
    queryMock.mockQuery({
      name: 'StartQuery',
      variables: {
        userId: '123'
      },
      data: {
        user: {
          id: '123',
          name: 'Some Name'
        }
      }
    });

    // This will render a Start-component that displays user 123's first and last name.
    const r = render(<Start userId="123" />);
    await wait(() => r.getByText('Some Name'));
    expect(r.queryByText('Some Name')).toBeTruthy();
  });
});
```

## API Reference

### QueryMock

Create a new `queryMock` by doing: `new QueryMock()`. You then use `queryMock` to handle your mocks.

#### `queryMock.setup(graphQLURL: string)`

Sets up mocking on the specified GraphQL API URL. Make sure you run this before your test suite.

#### `queryMock.reset()`

Resets the `queryMock`, meaning all mocks are removed, and the call history is erased.
Run this before/after each test to make sure you always start fresh.

#### `queryMock.mockQuery(config)`

Mocks a query. `config` looks like this:

```javascript
type MockGraphQLConfig = {|
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
   * If you want, you can return a custom error here that'll be thrown by the API if
   * you return a status like 401. Read more below.
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
  customHandler?: (req: *) => [number, mixed],

  /**
   * Sometimes you need to change the server response object dynamically for a query mock.
   * This allows you to do so. Example:
   * changeServerResponse: (config, response) => ({ ...response, invalidToken: true })
   */
  changeServerResponse?: ChangeServerResponseFn
|};
```

#### `queryMock.mockQueryWithControlledResolution`

The same as `mockQuery` above, but returns a function that lets you manually control when you
want the mock server to resolve the response. Useful when testing loading states and similar things.

Example:

```javascript
const resolveResponse = queryMock.mockQueryWithControlledResolution(...config...);
expect(getElementByText('Loading....')).toBeTruthy();
resolveResponse(); // The data is now returned and your view should be re-rendered with the correct data.
expect(getElementByText('Some text from the API.')).toBeTruthy();
```

#### `queryMock.getCalls()`

Returns `Array<RecordedGraphQLQuery>` where `RecordedGraphQLQuery` looks like this:

```javascript
type RecordedGraphQLQuery = {|
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
```

Useful for various things, for instance checking whether the correct headers are sent:

```javascript
const lastCall = queryMock.getCalls().pop();
expect(lastCall.headers['Authorization']).toBe('Bearer mock-token');
```

## FAQ

##### Why use `nock`, why not just mock `fetch`?

The goal of this library is to get as close as possible to how your queries would
be run in production. Mocking using `nock` ensures that we test that an _actual_ request
is sent to the _correct URL_.

##### How to I handle unstable variables like Date or random things that change for every query?

This is a pretty common thing, for instance when making queries that filter using dates.
You can do something like this to solve it:

```javascript
queryMock.mockQuery({
  name: 'SomeQueryName',
  variables: {
    aPropThatIsStable: true
  },
  ignoreThesePropertiesInVariables: ['fromDate', 'toDate'],
  data: dataYouWantToReturn
});
```

This makes sure that the query is matched on variables, but ignores "fromDate" and "toDate", which otherwise
would never match since they're relative and likely change over some period of time.

##### Creating "real" mock data is very cumbersome! Anything I can do to speed it up?

My personal trick is to add a `console.log` inside of your `fetch` for your framework, like this:

```javascript
...
.then(res => {
    if (__DEV__) {
      console.log({
        name: operation.name, // operation is the first parameter passed to your fetch-function in Relay Modern
        variables,
        data: res
      });
    }
```

This makes it easy to copy the `variables` and `data` from the actual server response.
