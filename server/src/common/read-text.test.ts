import fs from "fs";
import path from "path";
import {readText} from "./read-text";

test('read text from stream', async () => {
    const mockPath = path.join(__dirname, "..", "..", "test", "mocks", "mf-test", "mf-config.json");

    const readStream = fs.createReadStream(mockPath, {
        encoding: "utf-8"
    })

    const json = await readText(readStream);

    expect(json).toEqual(fs.readFileSync(mockPath, {encoding: "utf-8"}));
});
