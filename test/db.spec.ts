import fs from "fs";
import path from "path";

import TSDiskDB from "../src";
import { ModelTypeBase } from "../src/util";

const dbDirectory = path.join(path.dirname(__filename), "tmp");

const omitIdMonad = <T>({ _id, ...rest }: T & ModelTypeBase): T => rest as any as T;

type DBStructure = {
	collection1: {
		num: number;
		str: string;
	};
	collection2: {
		obj: {
			func: (y: number) => number;
		};
	};
};

type DBCollections = (keyof DBStructure)[];

let collections1: Omit<DBCollections, "collection2"> = ["collection1"];
let collections2: DBCollections = ["collection1", "collection2"];

type DBTestVariant = {
	variant: string;
	collections: DBCollections;
	db: TSDiskDB<Partial<DBStructure>>;
	directory: string;
};

let db1 = new TSDiskDB<Omit<DBStructure, "collection2">>(),
	db2 = new TSDiskDB<DBStructure>();

const dbTestVariants: DBTestVariant[] = [
	{
		variant: "just one collection",
		collections: collections1,
		db: db1,
		directory: path.join(dbDirectory, "db1"),
	},
	{
		variant: "two (and all) collections",
		collections: collections2,
		db: db2,
		directory: path.join(dbDirectory, "db2"),
	},
];

beforeAll(() => {
	if (fs.existsSync(dbDirectory)) {
		console.log(`Cleaning DB directory ${dbDirectory} before running tests...`);

		fs.rmSync(dbDirectory, { recursive: true });
	}

	fs.mkdirSync(dbDirectory);

	for (let dbTestVariant of dbTestVariants) {
		fs.mkdirSync(dbTestVariant.directory);
	}
});

describe("DB initialization passes ('connect' function)", () => {
	test.each<DBTestVariant>(dbTestVariants)("", ({ collections, db, directory }) => {
		expect(() => db.connect(directory, collections)).not.toThrowError();
	});
});

describe("Initialization ('connect' function) works properly", () => {
	describe.each<DBTestVariant>(dbTestVariants)(
		"connects to $variant",
		({ collections, db, directory }) => {
			test(`DB instance to contain only collections: ${collections.join(", ")}`, () => {
				expect(new Set(Object.getOwnPropertyNames(db.collections))).toEqual(
					new Set(collections)
				);
			});

			test(`filesystem instance to contain only serialized collections: ${collections.join(
				", "
			)}`, () => {
				expect(new Set(fs.readdirSync(directory))).toEqual(
					new Set(collections.map((collection) => `${collection}.json`))
				);
			});
		}
	);
});

describe("Collection operations", () => {
	let objects: DBStructure["collection1"][] = [1, 1, 2, 3, 4].map((i) => ({
		num: i,
		str: `Test #${i}`,
	}));

	function fillWithData() {
		for (let object of objects) {
			db1.collections.collection1.save([object]);
		}
	}

	afterEach(() => {
		// restore original state
		db1.collections.collection1.remove();
		fillWithData();
	});

	test("Has a count() === 0 in initial, empty state", () => {
		expect(db1.collections.collection1.count()).toStrictEqual(0);
	});

	test("Passes iterative insertion of 4 elements", () => {
		expect(() => {
			fillWithData();
		}).not.toThrowError();
	});

	test(`Contains ${objects.length} elements after iterative insertion`, () => {
		expect(db1.collections.collection1.count()).toStrictEqual(objects.length);
		expect(db1.collections.collection1.find().length).toStrictEqual(objects.length); // check if count works for real
	});

	test("Bulk removal without query empties the collection & removes it from collections list", () => {
		db1.collections.collection1.remove();

		expect(db1.collections.collection1.count()).toStrictEqual(0);
		expect(db1.collections.collection1.find().length).toStrictEqual(0); // check if count works for real
	});

	test("Selection via findOne() with a query not matching any entity present in collection returns undefined", () => {
		expect(
			db1.collections.collection1.findOne({
				num: -9999,
			})
		).toStrictEqual(undefined);
	});

	test("Selection via findOne() without a query returns the first element in collection", () => {
		expect({
			...db1.collections.collection1.findOne(),
			_id: undefined, // the ID field is not applicable here
		}).toStrictEqual({
			...objects[0],
			_id: undefined, // the ID field is not applicable here
		});
	});

	test("Selective removal of elements from a collection drops just them", () => {
		let indices = [1, 3];

		const originalEntriesWithIDs = db1.collections.collection1.find();

		for (let index of indices) {
			db1.collections.collection1.remove(objects[index], false);
		}

		expect(new Set(db1.collections.collection1.find())).toEqual(
			new Set(originalEntriesWithIDs.filter((_, idx) => !indices.includes(idx)))
		);
	});

	test("Removal of elements via full queries empties the collection", () => {
		for (let object of objects) {
			db1.collections.collection1.remove(object);
		}

		expect(db1.collections.collection1.count()).toStrictEqual(0);
	});

	test("Removal of elements via partial queries empties the collection", () => {
		for (let object of objects) {
			db1.collections.collection1.remove({
				num: object.num,
			});
		}

		expect(db1.collections.collection1.count()).toStrictEqual(0);
	});

	test("Removal of ambiguous elements via partial queries matching multiple elements with multi=false removes the first occurence", () => {
		db1.collections.collection1.remove(
			{
				num: 1,
			},
			false
		);

		expect(db1.collections.collection1.count()).toStrictEqual(objects.length - 1); // ensure just one elements was dropped
		expect(new Set(db1.collections.collection1.find().map(omitIdMonad))).toEqual(
			new Set(objects.slice(1))
		);
		expect({
			...db1.collections.collection1.findOne(),
			_id: undefined, // the ID field is not applicable here
		}).toStrictEqual({
			...objects[1],
			_id: undefined, // the ID field is not applicable here
		}); // the newly-first element should be the previosuly-second element, having num equal to first element's num (which should have been deleted)
	});

	test("Removal of ambiguous elements via partial queries matching multiple elements with multi=true removes all occurences", () => {
		db1.collections.collection1.remove(
			{
				num: 1,
			},
			true
		);

		expect(db1.collections.collection1.count()).toStrictEqual(objects.length - 2); // ensure all 2 occurences was dropped
		expect(new Set(db1.collections.collection1.find().map(omitIdMonad))).toEqual(
			new Set(objects.slice(2))
		);
		expect({
			...db1.collections.collection1.findOne(),
			_id: undefined, // the ID field is not applicable here
		}).toStrictEqual({
			...objects[2],
			_id: undefined, // the ID field is not applicable here
		}); // the newly-first element should be the previosuly-second element, having num equal to first element's num (which should have been deleted)
	});
});

afterAll(() => {
	console.log(`Cleaning DB directory ${dbDirectory} after running tests...`);
	fs.rmSync(dbDirectory, { recursive: true });
});
