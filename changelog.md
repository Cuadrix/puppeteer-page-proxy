# Change log
### [1.2.2] - 2020-02-09
#### Patches
- Fixed code indentation.
- Updated examples.
- Optimization.
### [1.2.0] - 2020-02-09
#### Major changes
- Added capability to change proxy per request.
- Added capability of changing the proxy if a page is already using one.
- Replaced [Request](https://github.com/request/request) with [Got](https://github.com/sindresorhus/got) for forwarding requests.
- Added [tough-cookie](https://github.com/salesforce/tough-cookie) for handling cookies
- Now communicates directly with Chrome DevTools Protocol when getting cookies
#### Minor changes
- Added a simple type enforcer and proxy validator.
- Removed some redundant code.
- Removed obsolete 'cache' parameter