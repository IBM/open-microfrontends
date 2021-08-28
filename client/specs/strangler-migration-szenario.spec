# Steangler Migration Szenario

This is the specification to support
stangler migrations. One Standalone Application can include Microfrontends,
even if the app itself is not running behind the integration server.

To execute this specification, use
	gauge run specs

This is a context step that runs before every scenario
We're preparing all ssr related test sites to be served
by our http server
* Start server with "strangler-mocks"

## Keeps Server Side Rendered Markup
* Load page "hello-strangler-example"
* Must display "Hello Strangler World"

## Lazy loads microfrontends from integration server
* Load page "strangler-lazy-example"
* "mf-app" element must have "name" attribute
* "mf-app" element must have "lazy" attribute
* Must display "lazy loaded strangler content"