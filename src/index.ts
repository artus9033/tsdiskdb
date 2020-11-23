import path from "path";

import { red as e, green as s } from "chalk";

import Collection from "./collection";
import util from "./util";

type ValuesOf<T extends any[]> = T[number];

class DiskDB<
	CollectionTypes extends {
		[key: string]: object;
	}
> {
	public _db = {
		path: "",
	};

	collections: { [T in keyof CollectionTypes]: Collection<CollectionTypes[T]> } = {} as any;

	public connect(path: string, collections: Array<keyof CollectionTypes>) {
		if (util.isValidPath(path)) {
			this._db.path = path;

			console.log(s("Successfully connected to : " + path));

			if (collections) {
				this.loadCollections(collections as string[]);
			}
		} else {
			console.log(
				e(
					"The DB Path [" +
						path +
						"] does not seem to be valid. Recheck the path and try again"
				)
			);

			return false;
		}
		return this;
	}

	public loadCollections(collections: Array<keyof CollectionTypes>) {
		if (!this._db) {
			console.log(
				e(
					"Initialize the DB before you add collections. Use : ",
					"db.connect('path-to-db');"
				)
			);
			return false;
		}

		if (typeof collections === "object" && collections.length) {
			for (var i = 0; i < collections.length; i++) {
				var p = path.join(
					this._db.path,
					((collections[i] as string).indexOf(".json") >= 0
						? collections[i]
						: collections[i]) + ".json"
				);

				if (!util.isValidPath(p)) {
					util.writeToFile(p);
				}

				var _c = (collections[i] as string).replace(".json", "");
				this.collections[collections[i]] = new Collection(this, _c);
			}
		} else {
			console.log(
				e(
					"Invalid Collections Array.",
					"Expected Format : ",
					"['collection1','collection2','collection3']"
				)
			);
		}

		return this;
	}
}

export default DiskDB;
