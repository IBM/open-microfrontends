import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

let waitingTimeTrend = new Trend('waiting_time');

export default function () {
    let res = http.get('http://127.0.0.1:1337/test/something');

    waitingTimeTrend.add(res.timings.waiting);

    check(res, { 'status was 200': (r) => r.status == 200 });
    sleep(1);
}