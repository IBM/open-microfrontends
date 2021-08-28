import {Examples} from "./mock-type";
import {template} from "./html-template";

export default <Examples>{
    "ssr-example": {
        url: "http://localhost:8080/js-with-ssr",
        html: template(`<mf-app name="@test/js-with-ssr" module-src="/ssr/bundle.js"><button id="greeter">print greeting</button><div id="greeting"><!-- greetings added by js --></div></mf-app>`)
    },
    "lazy-example": {
        url: "http://localhost:8080/js-with-lazy",
        html: template(`<mf-app name="@test/js-with-lazy"></mf-app>`)
    }
};

