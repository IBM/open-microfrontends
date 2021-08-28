const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

// Simple microfrontend mock server for testing
const requestHandler = (request, response) => {
    console.log(request.url)

    if (request.url === "/mf-config") {
        response.setHeader("Content-Type","application/json");
        response.end(fs.readFileSync(path.join(__dirname, "mf-config.json")))

    // handle root page request, typically this is handled by CMS or some kind of a layouting Service
    } else if (request.url === "/test/index.html"){
        response.setHeader("Content-Type","text/html");
        response.end('<!doctype html><html><head><title>MF Test</title></head><body><h1>MF Test Headline</h1><mf-app name="@mf-test/foobar" data-blubba-ba-ba="312" data-xxx-yyy="some value" data-foo="bar"><h2>mf skeleton</h2></mf-app></body></html>')

    // handle root page request, typically this is handled by CMS or some kind of a layout-service
    } else if (request.url === "/test/lazy"){
        response.setHeader("Content-Type","text/html");
        response.end('<!doctype html><html><head><title>MF Test</title></head><body><h1>MF Test Headline</h1><mf-app name="@mf-test/foobar" lazy data-foo="bar"><h2>mf skeleton</h2></mf-app><br /><hr /><br /><mf-app name="@mf-test/greeter" lazy></mf-app></body></html>')

    // handle app foobar js module load
    } else if (request.url === "/test/mf-test-foobar.js"){
        response.setHeader("Content-Type","text/javascript");
        response.end('import {someVar} from "a"; export const bootstrap = (el) => { el.querySelector("button").addEventListener("click", () => { el.loadService("@mf-test/some-service").then(someService => console.log(someService.hello, " World! >>> ", someVar)); }); };')

    // handle app greeter js module load
    } else if (request.url === "/test/mf-test-greeter.js"){
        response.setHeader("Content-Type","text/javascript");
        response.end('import {someVar} from "a"; export const bootstrap = (el) => { el.querySelector("button").addEventListener("click", () => { el.loadService("@mf-test/some-service").then(someService => console.log(someService.hello, " World! >>> ", someVar)); }); };')


        // handle service load requests
    } else if (request.url === "/test/some-service-1.0.0.js"){
        response.setHeader("Content-Type","text/javascript");
        response.end('export const hello = "hey hey";')

    // route to handle @mf-test/foobar microfrontend requests
    } else if (request.url === "/some/internal/path/to/my-mf-foobar.html"){
        console.log("render microfrontend app: ", request.headers);
        response.setHeader("Content-Type","text/html");
        response.setHeader("Link", "</test/mf-test-foobar.js>; rel=\"module-src\", <@mf-test/some-runtime:1>; rel=\"runtime\", </some/mf/css/style.css>; rel=\"stylesheet\"");
        response.end('<h2>MF Foobar</h2><button>print greeting</button><div id="greeting"><!-- js add the greeting here ... --></div>')

    // route to handle @mf-test/greeter microfrontend requests
    } else if (request.url === "/some/internal/path/to/my-mf-greeter.html"){
        console.log("render microfrontend app: ", request.headers);
        response.setHeader("Content-Type","text/html");
        // we're relying on a newer version of the runtime than the other microfrontend
        response.setHeader("Link", "</test/mf-test-greeter.js>; rel=\"module-src\", <@mf-test/some-runtime:2>; rel=\"runtime\"");
        response.end('<h2>MF Greeter</h2><button>print a great greeting</button>')

    // handle runtime request
    } else if (request.url === "/test/some-runtime/v1"){
        response.setHeader("Content-Type","application/json");
        response.end('{ "css": ["/test/runtime.css"], "imports": { "a": "/test/a.js"}}')

    // handle runtime request
    } else if (request.url === "/test/some-runtime/v2"){
        response.setHeader("Content-Type","application/json");
        // our newer version depends on an alternative implementation for a
        response.end('{ "css": ["/test/runtime.css"], "imports": { "a": "/test/a-newer.js"}}')

    // handle runtime a.js requests
    } else if (request.url === "/test/a.js"){
        response.setHeader("Content-Type","text/javascript");
        response.end('export const someVar = "hey runtime world";')

    // handle runtime a-newer.js requests
    } else if (request.url === "/test/a-newer.js"){
        response.setHeader("Content-Type","text/javascript");
        response.end('export const someVar = "hey v2 runtime world, i am better and faster and nicer and so on...! :)";')


    // handle runtime css requests
    } else if (request.url === "/test/runtime.css"){
        response.setHeader("Content-Type","text/css");
        response.end('body { background: #e0e0e0; }')

    // print hello as fallback
    } else {
        console.log("Fallback request: ", request.url);
        response.setHeader("Content-Type","text/plain");
        response.end('Hello Node.js Server!')
    }
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
})