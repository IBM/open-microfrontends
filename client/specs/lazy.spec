# Lazy Microfrontend Loading

This is the specification to support
lazy loaded microfrontends

To execute this specification, use
	gauge run specs

This is a context step that runs before every scenario
We're preparing all lazy loading related test sites to
be served by our http server
* Start server with "lazy-mocks"

## Microfrontends with a defined lazy attribute will be lazy loaded
* Load page "lazy-mf-example"
* "mf-app" element must have "lazy" attribute
* Must display "lazy loaded content"

## Microfrontend lazy loading can be cancled
We're using viewport lazy loading so we have a chance to register the eventhandler before the loading is executed.
* Load page "lazy-mf-cancel-viewport-example"
* Cancel lazy loading
* "mf-app" element must have "lazy" attribute with value "viewport"
* Must not display "lazy loaded content"
* Scroll down and wait for "MicrofrontendWillLoad" event
* Must not display "lazy loaded content"

## Microfrontends with a lazy attribute set to viewport will be loaded once they are near the viewport
* Load page "lazy-mf-viewport-example"
* "mf-app" element must have "lazy" attribute with value "viewport"
* Must not display "lazy loaded content"
* Scroll down and wait for "MicrofrontendLoaded" event
* Must display "lazy loaded content"


## Fallback to lazy loading

Normally a microfrontend is lazy loaded if the the lazy attribute is specified (see other scenarios).
If the lazy attribute isn't present the microfrontend should be rendered on the server side.
In case the server side rendering fails, we will try it on the client again.

Another case why falling back to lazy loading make sense is when a page is served which doesn't run
behind the server side component, so that there is no chance for correct server side rendering.

Both scenarios (failed server side rendering and pages that aren't served behind the server side component)
can be identified because they have a name attribute defined, but they are missing the module-src attribute
(the js implementation to load for a microfrontend) and don't contain any content.

This behaviour should increase the stability of websites/webapps using this framework.

* Load page "lazy-mf-fallback-example"
* "mf-app" element must have "name" attribute
* "mf-app" element must have "lazy" attribute
* Must display "lazy loaded content"