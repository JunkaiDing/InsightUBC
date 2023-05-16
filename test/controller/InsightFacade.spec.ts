import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {folderTest} from "@ubccpsc310/folder-test";
use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: IInsightFacade;
	let sectionsValid: string;
	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let roomsValid: string;
	before(function () {
		// This block runs once and loads the datasets.
		sectionsValid = getContentFromArchives("courses.zip");
		sections = getContentFromArchives("pair.zip");
		roomsValid = getContentFromArchives("campus.zip");
		// Just in case there is anything hanging around from a previous run of the test suite
		clearDisk();
	});
	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			facade = new InsightFacade();
		});
		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});
		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			clearDisk();
		});

		// This is a unit test. You should create more like this!
	});
	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
/*
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
			facade = new InsightFacade();
			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				facade.addDataset("rooms", roomsValid, InsightDatasetKind.Rooms),
				facade.addDataset("courses", sections, InsightDatasetKind.Sections),
			];
			return Promise.all(loadDatasetPromises);
		});
		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			clearDisk();
		});
		type PQErrorKind = "ResultTooLargeError" | "InsightError";
		folderTest<unknown, InsightResult[], PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => facade.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult: (actual, expected) => {
					expect(actual).to.have.deep.members(expected);
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});

 */
});
