import path from "path";

import chalk from "chalk";

import Collection from "./collection";
import util from "./util";

const { blueBright, green, red, yellowBright } = chalk;

export * as util from "./util";
export * as collection from "./collection";

class DiskDB<
	CollectionTypes extends {
		[key: string]: object;
	}
> {
	constructor(private LOG_TAG: string = "TSDiskDB") {}

	public _db = {
		path: "",
	};

	collections: { [T in keyof CollectionTypes]: Collection<CollectionTypes[T]> } = {} as any;

	private log(...args: any[]) {
		console.log(blueBright`[${this.LOG_TAG}]`, ...args);
	}

	private success(...args: any[]) {
		console.log(blueBright`[${this.LOG_TAG}]`, ...args.map((arg) => green(arg)));
	}

	private warn(...args: any[]) {
		console.warn(blueBright`[${this.LOG_TAG}]`, ...args.map((arg) => yellowBright(arg)));
	}

	private error(...args: any[]) {
		console.error(blueBright`[${this.LOG_TAG}]`, ...args.map((arg) => red(arg)));
	}

	public connect(path: string, collections: Array<keyof CollectionTypes>) {
		if (util.isValidPath(path)) {
			this._db.path = path;

			this.success(`Successfully connected to ${path}`);

			if (collections) {
				this.loadCollections(collections as string[]);
			}
		} else {
			const message = `The DB Path '${path}' does not seem to be valid. Recheck the path and try again`;

			this.error(message);

			throw new Error(message);
		}

		return this;
	}

	public loadCollections(collections: Array<keyof CollectionTypes>) {
		if (!this._db) {
			const message = `Initialize the DB before you add collections: db.connect('path-to-db', ['collection1', ...]);`;

			this.error(message);

			throw new Error(message);
		}

		if (typeof collections === "object" && collections.length) {
			for (let index = 0; index < collections.length; index++) {
				const collectionJsonPath = path.join(
					this._db.path,
					((collections[index] as string).indexOf(".json") >= 0
						? collections[index]
						: collections[index]) + ".json"
				);

				if (!util.isValidPath(collectionJsonPath)) {
					util.writeToFile(collectionJsonPath);
				}

				const oldCollectionName = (collections[index] as string).replace(".json", "");
				this.collections[collections[index]] = new Collection(this, oldCollectionName);
			}
		} else {
			const message =
				"Invalid collections array - expected format: ['collection1','collection2','collection3', ...]";

			this.error(message);

			throw new Error(message);
		}

		return this;
	}
}

export default DiskDB;
