import {Readable} from "stream";

export const readText = (body: Readable): Promise<string> => new Promise((resolve, reject) => {
    let input = "";
    body.setEncoding('utf8')
    body.on('data', d => input += d)
    body.on('end', () => {
        try {
            resolve(input);
        } catch (e) {
            reject(e);
        }
    })
});