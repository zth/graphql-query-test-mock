# Changelog

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
