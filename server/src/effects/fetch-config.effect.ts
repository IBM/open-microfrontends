import {FetchApplicationConfig} from "../workflows/mf-service-discovery";
import {request} from "./request.effect";
import {HttpError, HttpStatus} from "@marblejs/core";
import {ContentType} from "@marblejs/core/dist/+internal/http";
import {readJson} from "../common/read-json";
import {MicrofrontendConfiguration} from "../model/microfrontends";
import * as t from "io-ts";
import {pipe} from "fp-ts/pipeable";
import {fold} from "fp-ts/Either";
import {PathReporter} from "io-ts/PathReporter";
import {mfConfigEndpoint} from "./service-discovery.effect";

export const fetchConfig: FetchApplicationConfig = async (address) => {

    let statusCode;
    let headers;
    let body;

    try {
        const response = await request(address)(mfConfigEndpoint(), "GET");
        statusCode = response.statusCode;
        headers = response.headers;
        body = response.body;
    } catch (e) {
        return new HttpError(
    `Unable to connect to microfrontend at [${address}] with path [${mfConfigEndpoint()}]. Original Error: ${e.message}`,
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }


    // fail fast if status code is not ok.
    if (statusCode !== HttpStatus.OK) {
        return new HttpError(
            `Unable to resolve microfrontend configuration due to status code != Ok. 
              Received Status code = [${statusCode}] for URL = [${address}${mfConfigEndpoint()}].`,
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    // fail fast if content type is not json (split ; to support headers like 'application/json; charset=utf-8')
    if (headers["content-type"].split(";")[0].trim() !== ContentType.APPLICATION_JSON) {
        return new HttpError(
            `Unable to resolve microfrontend configuration due to invalid content-type header.
              Expected [${ContentType.APPLICATION_JSON}] but got [${headers["content-type"]}] for URL = [${address}${mfConfigEndpoint()}].`,
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    // read JSON from stream
    try {
        const configJson = await readJson(body);
        const result = MicrofrontendConfiguration.decode({
            ...configJson,
            // enrich config with address so it can be used for proxying requests
            address: address
        });

        // failure handler
        const onLeft = (errors: t.Errors) => undefined;
        // success handler
        const onRight = (c: MicrofrontendConfiguration) => c;

        const parsedJSON = pipe(result, fold(onLeft, onRight));

        // if json cannot be parsed into our MicrofrontendConfiguration Model
        // we fail with a parsing error
        if (parsedJSON === undefined) {
            return new HttpError(PathReporter.report(result).join("\n"), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return parsedJSON;
    } catch (e) {
        return new HttpError(
    `${e.message} for URL = [${address}${mfConfigEndpoint()}].`,
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}