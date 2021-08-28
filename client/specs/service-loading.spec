# Service Loading

This is the specification to support
the loading of services within microfrontends.

To execute this specification, use
	gauge run specs

This is a context step that runs before every scenario
We're preparing all related test sites to be served
by our http server
* Start server with "service-loading-mocks"

## Microfrontends loads Service and executes a function
* Load page "service-loading-example"
* Must display "Hello Service World"