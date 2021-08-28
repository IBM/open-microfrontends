# Frontend Orchestrator

A cloud native orchestrator for microfrontends.

## Microfrontend Configuration

Must provide config Endpoint and return config JSON: `GET /mf-config`

```json
{
  "routes": [
    "/foo/**"
  ]
}
```

### Routes

Route matching is done via `Micromatch`, all its matching features 
can be used to define routes that should be handled by a microfrontend: 
https://github.com/micromatch/micromatch#matching-features

> The example route `/foo/**` will forward all requests 
> beginning with `/foo` to the microfrontend.

If multiple Microfrontends are configured to handle the same route, 
all requests will be forwarded to the first configuration we find.

> ! Warning ! all routes starting with `/_mf-api/` are reserved and cannot be used by any microfrontend.
> This route is reserved for the internal api used for lazy loading etc.

## Docker Usage

Pull latest container
```
$ docker pull ghcr.io/alexanderbartels/fe-orchestrator:latest
```

start docker container:
```
$ docker run -d --publish 1337:1337 --env MF_APP_<name>=http://<microfrontend-ip-or-dns-name>:3000 ghcr.io/alexanderbartels/fe-orchestrator  
```

## Server Configuration

in general, we follow the convention over configuration approach.
There is only one kind of mandatory configuration: Which Microfrontends to connect to. 

### Connect Microfrontends

In order to connect a microfrontend, define an env variable that is prefixed with `MF_APP_`.
You can connect as much microfrontends as you like. The value of each environment variable 
must contain a valid microfrontend address, consist of `<protocol>://host:port`. Without any URL

Example for a single connected microfrontend:

```
MF_APP_SOME_APPLICATION=http://localhost:8081
``` 

Example for multiple microfrontends:

```
MF_APP_SOME_APPLICATION=http://localhost:8081
MF_APP_SOME_OTHER_APPLICATION=http://localhost:8082
MF_APP_FOO=http://127.0.0.1:8083
```

> The configured address should be routed using a load balancer which 
> uses the circuit breaker pattern to prevent failing instances from being used.
> This is important to create a stable production environment
>
> Most cloud platforms like cloud foundry or kubernetes provide 
> these capabilities out of the box for you.

### Port & Host

* `PORT=<number / int>` Defaults to 1337.
* `LISTEN_ON_HOST=<string>` Defaults to 0.0.0.0 (for usage in docker container)


### Microfrontend Configuration Refresh

Interval to refresh the microfrontend configuration. 
Will be fetched via http request from every connected microfrontend.
The environment variables for connected microfrontends are also reread. 
In case there is a connection change (new `MF_APP_<name>` env variable defined).

* `MF_CONFIG_REFRESH_RATE=<number / int>` Value in ms. Defaults to 5000.

### Microfrontend Configuration Fetching

Configuration will be loaded via GET requests from every microfrontend in the defined interval.
If the request is failing, or an invalid configuration will be received the microfrontend gets ignored.

* `MF_CONFIG_ENDPOINT=<string>` Defaults to `/mf-config`

### Microfrontend Connection 

A dedicated connection pool will be created for every connected microfrontend.

* `MF_HTTP_CONNECTION_POOL_SIZE=<number / int>` Defaults to 10.

Timeout in ms. If a request to a microfrontend takes longer than the specified timeout (defaults to 3 seconds), trigger a failure.

* `MF_HTTP_CIRCUIT_BREAKER_TIMEOUT=<number / int>` Defaults to 3000

Error threshold in percent (from 0 to 1, e.g. 0.5 means 50%). 

* `MF_HTTP_CIRCUIT_BREAKER_ERROR_THRESHOLD=<number / float>` Defaults to 0.5 (50%) When 50% of requests fail, trip the circuit

Reset timeout in ms. If in failure mode requests are send again to a microfrontend after waiting for the specified timeout.

* `MF_HTTP_CIRCUIT_BREAKER_RESET_TIMEOUT=<number / int>` Defaults to 3000 (30 seconds)


### Under Pressure Handling

If there is to much load on the server we don't accept new requests 
in order to fulfil the current requests without risk to crashing the whole server.
As this software will usually run behind a load Balancer other instances will receive these requests.
These properties are in place because we follow the **Fail Fast** method.

* `MF_MAX_EVENT_LOOP_DELAY=<number / int>` Value in ms. Defaults to 1000. Define 0 to deactivate this check.
* `MF_MAX_EVENT_LOOP_UTILIZATION=<number / float>` Value in percent (0.01 to 1). Defaults to 0.98. Define 0 to deactivate this check.

### Development Configuration

* `MF_CONFIG_JS_BUNDLE_PATH=<string>` (Defaults to /app-client/dist/mf-orchestrator.umd.js). 
  Default value is defined based on the docker build process, it should not be changed in production. 