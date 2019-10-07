# Changelog

## master

...

## 0.12.1

- Fix memory leak issue (thanks @msimulcik!).

## 0.12.0

- Add `graphqlErrors` prop to query mock config, to support returning actual GraphQL errors, and not just server errors.

## 0.11.1

- Fixes bug with operation names not properly picked up when fragments appear before the operation in the query, courtesy of @msimulcik.

## 0.11.0

- Drop support for Node < 8.

## 0.10.3

- Improved error messages for missing mocks.
- Variables now match regardless of property order in variable objects.

## 0.10.2

- Adds a method to clean up `nock`.

## 0.10.1

- Updating TypeScript definitions.

## 0.10.0

- `customHandler` can now be async and return a promise. This should simplify experimenting with automocking and other things needing async.

## 0.9.6

- Bug fix from accidental mutation. Mutability is fun, but hard!

## 0.9.5

- Added `ignoreThesePropertiesInVariables: Array<string>` to the mock config, which basically is a more convenient way of
  filtering out unstable variables you may use in your queries (like dates).
- Support mocking the same query multiple times with different variables without needing to resort to re-mocking after
  a query mock has been used. This should be quite a bit more convenient, allowing you to do something like this:

```javascript
queryMock.mockQuery({
  name: 'SomeQuery',
  variables: {
    first: true
  },
  data: firstData
});

queryMock.mockQuery({
  name: 'SomeQuery',
  variables: {
    second: true
  },
  data: secondData
});
```

...instead of like before:

```javascript
queryMock.mockQuery({
  name: 'SomeQuery',
  variables: {
    first: true
  },
  data: firstData
});

/**
 * Your operation consuming the mock would have to be run and done before you could re-mock the query
 * to return your second response.
 */

someThingThatConsumesTheQueryAbove();

queryMock.mockQuery({
  name: 'SomeQuery',
  variables: {
    second: true
  },
  data: secondData
});
```

## 0.9.4

- Greatly improved error messages. `graphql-query-test-mock` will now print all sorts of (hopefully) helpful
  information about why your mock failed, like exactly why the variables did not match, what queries are currently mocked
  and so on. Try it!

## 0.9.3

- TypeScript bindings (thanks to @chagasaway!).

## 0.9.2

- Automatically discover the name of the query/mutation, removing the need to provide an explicit
  id/name for every operation.

## 0.9.1

- Allow to set a custom error that `nock` throws when the mock tells the server to fail (thanks to @chagasaway!).
