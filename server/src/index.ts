import {bindEagerlyTo, createServer, HttpServer} from '@marblejs/core';
import { IO } from 'fp-ts/lib/IO';
import { listener } from './http.listener';
import {MicrofrontendServiceDiscoverySubject, MicrofrontendServiceDiscoverySubjectToken} from "./effects/service-discovery.effect";
import {RequestClients} from "./effects/request.effect";
import {envConfigEither, envConfigEitherAsInt} from "./effects/env-config.effect";

const port = envConfigEitherAsInt("PORT", 1337);
const host = envConfigEither("LISTEN_ON_HOST", "0.0.0.0");

const server = createServer({
    port: port(),
    hostname: host(),
    listener,
    dependencies: [
        // bind eagerly to make sure the first service discovery workflow is resolved before we accept http requests
        bindEagerlyTo(MicrofrontendServiceDiscoverySubjectToken)(MicrofrontendServiceDiscoverySubject)
    ]
});

// main fn to handle async await to start the http server
const main: IO<Promise<HttpServer>> = async () => {
    return await (await server)();
}

// graceful shutdown http server
const shutdown: (httpServer: HttpServer) => IO<void> = (httpServer) => () => {
    console.log("Termination signal received. Graceful stopping server");
    httpServer!.close(() => {
        RequestClients.getInstance().closeAll().then(() => {
            console.log('Http server stopped.');
            process.exit();
        });
    });
}

// start server and register graceful shutdown handler
main().then((s) => {
    process.on('SIGTERM', shutdown(s));
    process.on('SIGINT', shutdown(s));
});