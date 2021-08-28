import {Examples} from "./mock-type";
import {template} from "./html-template";

export default <Examples>{
    "hello-world-example": {
        url: "http://localhost:8080/hw",
        html: template(`<mf-app name="@test/mf1"><h1>Hello World</h1></mf-app>`)
    },
    "simple-text-example": {
        url: "http://localhost:8080/simple-text",
        html: template(`<mf-app name="@test/mf1">simple text</mf-app>`)
    },
    "multi-element-example": {
        url: "http://localhost:8080/multi-element",
        html: template(`<mf-app name="@test/mf1"><div><span>Hi</span><span>World</span></div><h2>Multi Element</h2></mf-app>`)
    },
    "multi-mf-example": {
        url: "http://localhost:8080/multi-mf",
        html: template(`<mf-app name="@test/mf1"><h1>Hello Mf1</h1></mf-app><mf-app name="@test/mf2"><h1>Hello Mf2</h1></mf-app>`)
    }
};

