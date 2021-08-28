# Server Side Rendering Support

This is the specification to support
server side rendered microfrontends

To execute this specification, use
	gauge run specs

This is a context step that runs before every scenario
We're preparing all ssr related test sites to be served
by our http server
* Start server with "ssr-mocks"

## Keeps Server Side Rendered Markup
* Load page "hello-world-example"
* Must display "Hello World"

## Keeps prerendered simple text
* Load page "simple-text-example"
* Must display "simple text"

## Keeps prerendered complex markup
* Load page "multi-element-example"
* Must display "Hi"
* Must display "World"
* Must display "Multi Element"

## Keeps server side rendering for multiple microfrontends
* Load page "multi-mf-example"
* Must display "Hello Mf1"
* Must display "Hello Mf2"
