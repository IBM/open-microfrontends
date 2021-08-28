import {Readable} from "stream";

export const readJson = (body: Readable): Promise<JSON> => new Promise((resolve, reject) => {
    let input = "";
    body.setEncoding('utf8')
    body.on('data', d => input += d)
    body.on('end', () => {
        try {
            resolve(JSON.parse(input));
        } catch (e) {
            reject(e);
        }
    })
});