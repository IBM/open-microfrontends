import {Examples} from "./mock-type";
import {template} from "./html-template";

export default <Examples>{
    "hello-strangler-example": {
        url: "http://localhost:8080/strangler-hw",
        html: template(`<mf-app name="@test/mf1"><h1>Hello Strangler World</h1></mf-app>`,
            `window.env = { MICROFRONTEND_API_HOST: "http://localhost:8081" };`)
    },
    "strangler-lazy-example": {
        url: "http://localhost:8080/strangler-lazy",
        html: template(`<mf-app name="@test/strangler-lazy"></mf-app>`,
            `window.env = { MICROFRONTEND_API_HOST: "http://localhost:8081" };`)
    }
};

