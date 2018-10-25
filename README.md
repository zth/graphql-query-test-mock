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

#### Make sure the query mock is initialized and reset between each set

In order for old mocks to not stick around between tests, we'll need to set up and tear down our mock between each test. We'll use Jests `setupFiles` and `setupTestFramework` files to accomplish that.
`setupFiles` will run _once before every test suite_, allowing us to initialize our `QueryMock`. `setupTestFramework` runs once before _each test_, allowing us to reset all query mocks before each test.
Please follow [Jests instructions on adding those files to your project](https://jestjs.io/docs/en/configuration.html), then continue here.

```javascript
// in the setupTestFramework file
import { queryMock } from '../path/to/your/queryMock';

// This is run before each test, making sure we always reset our mock
beforeEach(() => {
  queryMock.reset();
});
```

```javascript
// in the setupFiles file
import { queryMock } from '../path/to/your/queryMock';

// This is run before each test suite, setting up the mock base with your GraphQL API URL.
queryMock.setup(GRAPHQL_API_URL); // Variable containing the URL for your GraphQL API. This must match what you're making requests to in your client code.
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

# More exhaustive docs will come soon!
