import {IO} from "fp-ts/IO";
import {
    MicrofrontendApplicationAddress,
    MicrofrontendConfiguration,
    MicrofrontendRequest
} from "../model/microfrontends";
import {Client, Pool} from "undici";
import {envConfigEitherAsFloat, envConfigEitherAsInt} from "./env-config.effect";
import CircuitBreaker from "opossum";

const connectionPoolSize = envConfigEitherAsInt("MF_HTTP_CONNECTION_POOL_SIZE", 10);

/**
 * Timeout in ms.
 * If a request to a microfrontend takes longer than the specified timeout (defaults to 3 seconds), trigger a failure.
 */
const circuitBreakerTimeout = envConfigEitherAsInt("MF_HTTP_CIRCUIT_BREAKER_TIMEOUT", 3000);

/**
 * Error threshold in percent (from 0 to 1, e.g. 0.5 means 50%)
 * When 50% of requests fail, trip the circuit
 */
const circuitBreakerErrorThreshold = envConfigEitherAsFloat("MF_HTTP_CIRCUIT_BREAKER_ERROR_THRESHOLD", 0.5);

/**
 * Reset timeout in ms.
 * If in failure mode requests are send again to a microfrontend after waiting for the specified timeout.
 */
const circuitBreakerResetTimeout = envConfigEitherAsInt("MF_HTTP_CIRCUIT_BREAKER_RESET_TIMEOUT", 3000);

const doRequest = (client: Client): MicrofrontendRequest =>
    (path, method = "GET", headers, body) => {
        return client.request({
            path,
            method,
            headers,
            body
        }) as Promise<Client.ResponseData>;
    }

export class RequestClients {
    private static instance?: RequestClients;

    private clients: {[address: string]: Client} = {};
    private requestCircuitBreaker: {[adress: string]: CircuitBreaker} = {};

    private constructor() {}

    public static getInstance() {
        if (this.instance) return this.instance;
        return this.instance = new RequestClients();
    }

    public getClient(address: MicrofrontendApplicationAddress): Client {
        if (this.clients[address]) return this.clients[address];

        // internally we create a connection pool, but our users don't need to know about,
        // that's why we're using the Client interface as public api
        this.clients[address] = new Pool(address, {
            connections: connectionPoolSize()
        });

        this.requestCircuitBreaker[address] = new CircuitBreaker(doRequest(this.clients[address]), {
            timeout: circuitBreakerTimeout(),
            errorThresholdPercentage: circuitBreakerErrorThreshold() * 100,
            resetTimeout: circuitBreakerResetTimeout()
        });

        return this.clients[address];
    }

    public getCircuitBreaker(address: MicrofrontendApplicationAddress): CircuitBreaker {
        // make sure client and circuit breaker are created
        this.getClient(address);

        return this.requestCircuitBreaker[address];
    }

    public closeAll(): Promise<void[]>{
        if (Object.keys(this.clients).length === 0) {
            return Promise.all([new Promise<void>(r => r())]);
        }

        return Promise.all(Object.keys(this.clients).map(c => this.clients[c].close()))
    }
}

/**
 * TODO: refactor to use request effect..
 */
export const requestIO: IO<Promise<MicrofrontendConfiguration>> = () => {
    return "" as any;
}

export const request = (address: MicrofrontendApplicationAddress): MicrofrontendRequest =>
    (path, method, headers, body) => {
    return RequestClients.getInstance()
        .getCircuitBreaker(address)
        .fire(
            path,
            method,
            headers,
            body
        ) as Promise<Client.ResponseData>;
}