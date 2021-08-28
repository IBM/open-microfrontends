# JavaScript Module Initialization

This is the specification for javascript
support in microfrontends

To execute this specification, use
	gauge run specs

This is a context step that runs before every scenario
We're preparing all lazy loading related test sites to
be served by our http server
* Start server with "js-module-mocks"

## JS execution for server side rendered microfrontends
* Load page "ssr-example"
`module-src` attribute is added by server side rendering if js should be executed
* "mf-app" element must have "module-src" attribute with value "/ssr/bundle.js"
make sure the ssr part only contains the button but not the greeting
* Must not display "Hello World"
click the button and verify that the greeting was added (by js)
* Click Button "print greeting"
* Must display "Hello World"

## JS execution for lazy loaded microfrontends
* Load page "lazy-example"
* Must not display "Hello World"
click the button and verify that the greeting was added (by js)
* Click Button "print greeting"
* Must display "Hello World"
