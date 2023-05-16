import * as fs from "fs-extra";

const persistDir = "./data";

/**
 * Convert a file into a base64 string.
 *
 * @param name  The name of the file to be converted.
 *
 * @return Promise A base 64 representation of the file
 */
const getContentFromArchives = (name: string): string =>
	fs.readFileSync("test/resources/archives/" + name).toString("base64");

/**
 * Removes all files within the persistDir.
 */
function clearDisk(): void {
	fs.removeSync(persistDir);
}

export {getContentFromArchives, clearDisk};
