
import { Step, BeforeSuite, AfterSuite, DataStoreFactory } from "gauge-ts";
import {
    $, click,
    closeBrowser,
    evaluate,
    goto, intercept,
    openBrowser,
    scrollDown,
    text, waitFor
} from 'taiko';
import assert = require("assert");
import * as fs from "fs";
import * as path from "path";
import {Examples} from "./mocks/mock-type";
const mockServer = require("mockttp").getLocal();


export default class StepImplementation {
    @BeforeSuite()
    public async beforeSuite() {
        await mockServer.start(8080);
        await openBrowser({ headless: false });

        await intercept(`/_mf-api/mf/${encodeURIComponent("@test/lazy")}`,
            request => request.respond({ headers: { "x-foo": "bar" }, body: "<h1>lazy loaded content</h1>" })
        );

        await intercept(`http://localhost:8081/_mf-api/mf/${encodeURIComponent("@test/strangler-lazy")}`,
            request => request.respond({ headers: { "x-foo": "bar" }, body: "<h1>lazy loaded strangler content</h1>" })
        );

        await intercept(`/_mf-api/mf/${encodeURIComponent("@test/js-with-lazy")}`,
            request => request.respond({ headers: { "Link": "</ssr/bundle.js>; rel=\"module-src\"" }, body: "<button id=\"greeter\">print greeting</button><div id=\"greeting\"><!-- greetings added by js --></div>" })
        );

        await intercept("/ssr/bundle.js", req =>req.respond({
            headers: {
                "content-type": "application/javascript"
            },
            body: "export const bootstrap = (el) => { console.log('##init ssr bundle', el); el.querySelector('#greeter').addEventListener('click', () => { el.querySelector('#greeting').innerHTML = '<h1>Hello World</h1>'; }); }"
        }))

        // -----------
        // MOCK Service Loading Endpoints
        // -----------

        await intercept(`/_mf-api/mf/${encodeURIComponent("@test/service-dependant-app")}`,
            request => request.respond({ headers: { "Link": "</load-service-bundle.js>; rel=\"module-src\"" }, body: "<h2>Test Service Loading ... </h2>" })
        );

        await intercept("/load-service-bundle.js", req =>req.respond({
            headers: {
                "content-type": "application/javascript"
            },
            body: "export const bootstrap = (el) => { console.log('##init load service bundle', el); el.loadService('@scope/some-service').then(someService => someService.printHelloWorld()); };"
        }));

        await intercept(`/_mf-api/mf/service/${encodeURIComponent("@scope/some-service")}`, req =>req.respond({
            headers: {
                "content-type": "application/javascript"
            },
            body: "export const printHelloWorld = () => { console.log('##printHelloWorld'); document.body.innerHTML = '<h1>Hello Service World</h1>'; }"
        }));

        // -----------
    }

    @AfterSuite()
    public async afterSuite() {
        await closeBrowser();
        await mockServer.stop();
    };

    @Step("Start server with <mock>")
    public async startServer(mock: string) {
        // load specified mocks
        const examples = require(`./mocks/${mock}.ts`).default;
        // save examples to szenario store
        DataStoreFactory.getScenarioDataStore().put("EXAMPLES", examples);

        await mockServer.get("/bundle.js")
            .thenReply(
                200,
                fs.readFileSync(path.join(__dirname, "..", "dist", "mf-orchestrator.umd.js"))
            );

        const keys = Object.keys(examples);
        for (let index = 0; index < keys.length; index++) {
            const k = keys[index];
            await  mockServer.get(examples[k].url).thenReply(200, examples[k].html);
        }
    }

    @Step("Load page <example>")
    public async loadPage(ex: string) {
        const examples: Examples =  DataStoreFactory.getScenarioDataStore().get("EXAMPLES");
        const example = examples[ex];

        if(!example) {
            throw new Error("Unknown Example [" + ex + "], use one of: " + Object.keys(examples).join(", "));
        }

        await goto(example.url);
    }

    @Step("Must display <message>")
    public async mustDisplay(message: string) {
        assert.ok(await text(message).exists(0, 0));
    }

    @Step("Must not display <message>")
    public async mustNotDisplay(message: string) {
        assert.ok(!(await text(message).exists(0, 0)));
    }

    @Step("<el> element must have <attr> attribute")
    public async elHasAttrDefined(el: string, attr: string) {
        const hasAttr = await evaluate(
            $(el),
            (element, args) => element.hasAttribute(args!.attr),
            { args: { attr } }
        );

        assert.ok(hasAttr);
    }

    @Step("<el> element must not have <attr> attribute")
    public async elHasNotAttr(el: string, attr: string) {
        const hasAttr = await evaluate(
            $(el),
            (element, args) => element.hasAttribute(args!.attr),
            { args: { attr } }
        );

        assert.ok(!hasAttr);
    }

    @Step("<el> element must have <attr> attribute with value <val>")
    public async elHasAttr(el: string, attr: string, val: string) {
        const attrVal = await evaluate(
            $(el),
            (element, args) => element.getAttribute(args!.attr),
            { args: { attr } }
            );

        assert.strictEqual(attrVal, val);
    }

    @Step("Click Button <btnText>")
    public async clickButton(btnText: string) {
        await click(btnText);
    }


    @Step("Scroll down and wait for <ev> event")
    public async waitForEvent(ev: string) {
        await evaluate(
            $("body"),
            (element, args) => {
                console.log("Add event listener...");
                element.addEventListener(args!.eventName, () => {
                    element.setAttribute("EVENT_FIRED", args!.eventName);
                }, {
                    once: true
                })
            },
            { args: { eventName: ev } }
        );

        // scroll down and give page some time to load
        await scrollDown();
        await waitFor(20);

        const event = await evaluate(
            $("body"),
            (element, args) => element.getAttribute("EVENT_FIRED")
        );

        assert.strictEqual(event, ev);
    }

    @Step("Cancel lazy loading")
    public async cancelLazyLoading() {
        await evaluate(
            $("body"),
            element => {
                element.addEventListener("MicrofrontendWillLoad", (event) => {
                    console.log("Cancel mf loading,", event);
                    event.preventDefault();
                }, {
                    once: true
                })
            }
        );
    }
}
