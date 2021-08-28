import {IO} from "fp-ts/IO";
import {envConfigEither, envConfigEitherAsInt} from "./env-config.effect";
import {Lazy} from "fp-ts/function";
import {
    createContextToken,
    createReader,
    HttpError,
    Logger,
    LoggerLevel,
    LoggerTag,
    LoggerToken,
    useContext
} from "@marblejs/core";
import {BehaviorSubject, of, timer} from "rxjs";
import {MicrofrontendConfigurations} from "../model/microfrontends";
import {mergeMap, tap} from "rxjs/operators";
import {batchedServiceDiscoveryWorkflow, serviceDiscoveryWorkflow} from "../workflows/mf-service-discovery";
import {fetchConfig} from "./fetch-config.effect";
import {microfrontendLookup} from "./microfrontend-lookup.effect";

/**
 * Configuration item for the mf service discovery refresh rate.
 * Value must be provided in ms.
 *
 * defaults value (5000ms) was chosen based on the envoy default for its dns refresh rate
 */
export const mfConfigRefreshRate: IO<number> = envConfigEitherAsInt("MF_CONFIG_REFRESH_RATE", 5000);

/**
 * Configuration item for the endpoint that is used to fetch the remote microfrontend configuration.
 * Must be the same path for all microfrontends
 */
export const mfConfigEndpoint: IO<string> = envConfigEither("MF_CONFIG_ENDPOINT", "/mf-config");

export const prepareStreamingWorkflow = (config: MicrofrontendConfigurations, replay: BehaviorSubject<MicrofrontendConfigurations>, logger: Logger): Lazy<void> => () => {
    // refresh dns and microfrontend config at the defined refresh rate
    timer(mfConfigRefreshRate(), mfConfigRefreshRate())
        // fetch list of available applications
        .pipe(mergeMap(() => of(microfrontendLookup())))

        .pipe(tap((appAddresses) => logger({ tag: LoggerTag.CORE, type: 'ServiceDiscovery', level: LoggerLevel.INFO,
            message: `Refresh configurations for microfrontends with addresses: ${JSON.stringify(appAddresses)}`,
        })()),)

        // run our workflow
        .pipe(serviceDiscoveryWorkflow(fetchConfig))

        // once we get an update we should update the config
        .subscribe((mfConfig) => {
            if (mfConfig instanceof HttpError) {
                logger({ tag: LoggerTag.CORE, type: 'ServiceDiscovery', level: LoggerLevel.ERROR,
                    message: `Refresh configuration failed: ${mfConfig.message}`,
                })();
                // TODO: mark config as stale and remove on next error if already stale
                // will be re-added if it works with the next refresh interval, but in the meantime we should stop
                // forwarding requests to this microfrontend..
                return;
            }

            // update config for the given microfrontend
            config[mfConfig.scope] = mfConfig;

            // publish update
            replay.next(config);
        });
};

export const prepareBatchedWorkflow = (config: MicrofrontendConfigurations, replay: BehaviorSubject<MicrofrontendConfigurations>, startWorkflow: Lazy<void>, logger: Logger): Lazy<void> => () => {
    return new Promise((resolve) => {
        // prepare workflow input
        of(microfrontendLookup())

            // pipe list of applications to service discovery workflow
            .pipe(
                tap((appAddresses) => logger({ tag: LoggerTag.CORE, type: 'ServiceDiscovery', level: LoggerLevel.INFO,
                    message: `Found the following microfrontend addresses at startup: ${JSON.stringify(appAddresses)}`,
                })()),
                batchedServiceDiscoveryWorkflow(fetchConfig)
            )

            // handle workflow output
            .subscribe(mfConfigs => {
                // apply config
                mfConfigs.forEach((c => {
                    if (c instanceof HttpError) {
                        logger({
                            tag: LoggerTag.CORE, type: 'ServiceDiscovery', level: LoggerLevel.ERROR,
                            message: `Initial configuration load failed: ${c.message}`,
                        })();
                    } else {
                        // if config was loaded successfully we add it to our global config object
                        config[c.scope] = c;
                    }
                }));

                // start workflow for continuous refreshes
                startWorkflow();

                // publish our first update so it can be used by the application
                replay.next(config);

                // resolve dependency, so the application will be started to handle requests
                resolve(replay);
            });
    });
}

/**
 * DI Token
 */
export const MicrofrontendServiceDiscoverySubjectToken = createContextToken<BehaviorSubject<MicrofrontendConfigurations>>('MicrofrontendServiceDiscoverySubject');

/**
 * Our main Effect that is provided through the MarbleJS DI mechanism
 */
export const MicrofrontendServiceDiscoverySubject = createReader(async (ask) => {
    const logger = useContext(LoggerToken)(ask);

    const replay = new BehaviorSubject<MicrofrontendConfigurations>({});
    const config: MicrofrontendConfigurations = {};

    // main workflow should be started once we've loaded the initial set of configuration
    const startStreamingWorkflow = prepareStreamingWorkflow(config, replay, logger);
    const runBatchedWorkflow = prepareBatchedWorkflow(config, replay, startStreamingWorkflow, logger);

    // mark this dependency ready if we have done the first DNS Lookup complete
    return runBatchedWorkflow();
})
