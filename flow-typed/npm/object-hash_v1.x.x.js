// flow-typed signature: c4660288ee9448120f76989773c472fc
// flow-typed version: 7116c6f404/object-hash_v1.x.x/flow_>=v0.25.x

/**
 * Flow libdef for 'object-hash'
 * See https://www.npmjs.com/package/object-hash
 * by Vincent Driessen, 2018-12-21
 */

declare module 'object-hash' {
  declare type Options = {|
    algorithm?: 'sha1' | 'sha256' | 'md5',
    excludeValues?: boolean,
    encoding?: 'buffer' | 'hex' | 'binary' | 'base64',
    ignoreUnknown?: boolean,
    unorderedArrays?: boolean,
    unorderedSets?: boolean,
    unorderedObjects?: boolean,
    excludeKeys?: string => boolean
  |};

  declare export default (
    value: { +[string]: mixed } | Array<mixed>,
    options?: Options
  ) => string;
}
