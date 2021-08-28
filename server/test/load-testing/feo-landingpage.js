import { sleep, group } from "k6";
import http from "k6/http";

export const options = {
    stages: [
        { duration: "1m", target: 100 },
        { duration: "1m", target: 150 },
        { duration: "1m", target: 175 },
        { duration: "1m", target: 150 },
        { duration: "1m", target: 0 },
    ],
    thresholds: { http_req_duration: ["avg<750"] },
};

export default function main() {
    let response;

    group(
        "page_1 - http://feo-landingpage.eu-de.mybluemix.net/ratenkredit",
        function () {
            response = http.get(
                "http://feo-landingpage.eu-de.mybluemix.net/ratenkredit",
                {
                    headers: {
                        Host: "feo-landingpage.eu-de.mybluemix.net",
                        Accept:
                            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
                        "Accept-Encoding": "gzip, deflate",
                        Connection: "keep-alive",
                        "Upgrade-Insecure-Requests": "1",
                    },
                }
            );
            response = http.get(
                "http://feo-landingpage.eu-de.mybluemix.net/_mf-api/assets/main.umd.js",
                {
                    headers: {
                        Host: "feo-landingpage.eu-de.mybluemix.net",
                        Accept: "*/*",
                        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
                        "Accept-Encoding": "gzip, deflate",
                        Connection: "keep-alive",
                    },
                }
            );
            response = http.get(
                "http://feo-landingpage.eu-de.mybluemix.net/favicon.ico",
                {
                    headers: {
                        Host: "feo-landingpage.eu-de.mybluemix.net",
                        Accept: "image/webp,*/*",
                        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
                        "Accept-Encoding": "gzip, deflate",
                        Connection: "keep-alive",
                    },
                }
            );
            response = http.get(
                "http://feo-landingpage.eu-de.mybluemix.net/_mf-api/mf/%40ratenkredit%2Frechner",
                {
                    headers: {
                        Host: "feo-landingpage.eu-de.mybluemix.net",
                        Accept: "*/*",
                        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
                        "Accept-Encoding": "gzip, deflate",
                        Connection: "keep-alive",
                    },
                }
            );
            response = http.get(
                "https://feo-ratenkreditrechner-cdn.eu-de.mybluemix.net/static/css/main.css",
                {
                    headers: {
                        Host: "feo-ratenkreditrechner-cdn.eu-de.mybluemix.net",
                        Accept: "text/css,*/*;q=0.1",
                        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
                        "Accept-Encoding": "gzip, deflate, br",
                        Connection: "keep-alive",
                    },
                }
            );
            response = http.get(
                "https://feo-ratenkreditrechner-cdn.eu-de.mybluemix.net/static/js/bundle.js",
                {
                    headers: {
                        Host: "feo-ratenkreditrechner-cdn.eu-de.mybluemix.net",
                        Accept: "*/*",
                        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
                        "Accept-Encoding": "gzip, deflate, br",
                        Origin: "http://feo-landingpage.eu-de.mybluemix.net",
                        Connection: "keep-alive",
                    },
                }
            );
        }
    );

    group(
        "page_2 - http://feo-landingpage.eu-de.mybluemix.net/termin",
        function () {
            response = http.get("http://feo-landingpage.eu-de.mybluemix.net/termin", {
                headers: {
                    Host: "feo-landingpage.eu-de.mybluemix.net",
                    Accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
                    "Accept-Encoding": "gzip, deflate",
                    Connection: "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                },
            });
            response = http.get(
                "http://feo-landingpage.eu-de.mybluemix.net/_mf-api/assets/main.umd.js",
                {
                    headers: {
                        Host: "feo-landingpage.eu-de.mybluemix.net",
                        Accept: "*/*",
                        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
                        "Accept-Encoding": "gzip, deflate",
                        Connection: "keep-alive",
                    },
                }
            );
            response = http.get(
                "http://feo-landingpage.eu-de.mybluemix.net/favicon.ico",
                {
                    headers: {
                        Host: "feo-landingpage.eu-de.mybluemix.net",
                        Accept: "image/webp,*/*",
                        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
                        "Accept-Encoding": "gzip, deflate",
                        Connection: "keep-alive",
                    },
                }
            );
        }
    );

    // Automatically added sleep
    sleep(1);
}
