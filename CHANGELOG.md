# Leakage - Changelog

## v0.3.0

- Support for asynchronous tests ([#7](https://github.com/andywer/leakage/issues/7))

## v0.2.0

- Added simple integration test and Travis CI config
- Renamed `iteration()` method to `iterate` as described in the docs (kept `iteration` for b/c, though)
- Supporting node 4+ (was node 6+ before)
- Faster installation, since only `lib/` is published

## v0.1.0

Initial release. Working `iterate()` method, detailed error, but no support for async functions and no unit tests yet.
