import fs from "fs";
import path from "path";
import {readJson} from "./read-json";

test('read json from stream', async () => {
    const mockPath = path.join(__dirname, "..", "..", "test", "mocks", "mf-test", "mf-config.json");

    const readStream = fs.createReadStream(mockPath, {
        encoding: "utf-8"
    })

    const json = await readJson(readStream);

    expect(json).toEqual(JSON.parse(fs.readFileSync(mockPath, {encoding: "utf-8"})));
});
