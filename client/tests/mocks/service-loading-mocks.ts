import {Examples} from "./mock-type";
import {template} from "./html-template";

export default <Examples>{
    "service-loading-example": {
        url: "http://localhost:8080/service-loading",
        html: template(`<mf-app name="@test/service-dependant-app"></mf-app>`)
    },
};

