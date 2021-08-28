import {Examples} from "./mock-type";
import {template} from "./html-template";

export default <Examples>{
    "lazy-mf-example": {
        url: "http://localhost:8080/lazy",
        html: template(`<mf-app name="@test/lazy" lazy><h1>Hello Lazy MF skeleton - will be removed by lazy rendering</h1></mf-app>`),
    },
    "lazy-mf-viewport-example": {
        url: "http://localhost:8080/lazy-viewport-loading",
        html: template(`<div style="min-height: 100vh; margin-bottom: 100px;">spacer text to prevent immediate mf loading</div><mf-app name="@test/lazy" lazy="viewport"></mf-app>`),
    },
    "lazy-mf-cancel-viewport-example": {
        url: "http://localhost:8080/lazy-viewport-cancel",
        html: template(`<div style="min-height: 100vh; margin-bottom: 100px;">cancel-test .... spacer text to prevent immediate mf loading</div><mf-app name="@test/lazy" lazy="viewport"></mf-app>`),
    },
    "lazy-mf-fallback-example": {
        url: "http://localhost:8080/lazy-fallback",
        html: template(`<mf-app name="@test/lazy"></mf-app>`)
    }
};

