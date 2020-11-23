import path from "path";

import { isArray } from "lodash";
import uuid from "uuid";

import util, { CollectionType, EnrichModelType, ModelTypeBase, QueryType } from "./util";
import DiskDB from ".";

export default class Collection<ModelType extends ModelTypeBase> {
	private _f: string;

	constructor(private db: DiskDB<any>, private collectionName: string) {
		this._f = path.join(this.db._db.path, this.collectionName + ".json");
	}

	find(query?: QueryType<ModelType>): EnrichModelType<ModelType>[] {
		var collection = JSON.parse(util.readFromFile(this._f));

		if (!query || Object.keys(query).length === 0) {
			return collection;
		} else {
			var searcher = new util.ObjectSearcher();
			return searcher.findAllInObject(collection, query, true);
		}
	}

	findOne(query?: QueryType<ModelType>): EnrichModelType<ModelType> {
		var collection = JSON.parse(util.readFromFile(this._f));

		if (!query) {
			return collection[0];
		} else {
			var searcher = new util.ObjectSearcher();
			return searcher.findAllInObject(collection, query, false)[0];
		}
	}

	save(data: Omit<ModelType, "_id">): EnrichModelType<ModelType>;
	save(data: Omit<ModelType, "_id">[]): EnrichModelType<ModelType>[];
	save(
		data: Omit<ModelType, "_id"> | Omit<ModelType, "_id">[]
	): EnrichModelType<ModelType> | EnrichModelType<ModelType>[] {
		var collection = JSON.parse(util.readFromFile(this._f)) as CollectionType<ModelType>;

		if (isArray(data)) {
			/*
			if (data.length === 1) {
				if (isArray(data[0]) && data[0].length > 0) {
					data = data[0];
				}
			}*/

			var retCollection = [];

			for (var i = data.length - 1; i >= 0; i--) {
				let d = {
					...data[i],
					_id: uuid.v4().replace(/-/g, ""),
				} as ModelType;
				collection.push(d);
				retCollection.push(d);
			}

			util.writeToFile(this._f, collection);

			return retCollection;
		}

		let newData = {
			...data,
			_id: uuid.v4().replace(/-/g, ""),
		} as ModelType;

		collection.push(newData);

		util.writeToFile(this._f, collection);

		return newData;
	}

	update(
		query: QueryType<ModelType>,
		data: ModelType,
		options?: {
			multi?: boolean;
			upsert?: boolean;
		}
	) {
		var ret: {
				updated: number;
				inserted: number;
			} = { updated: 0, inserted: 0 },
			collection = JSON.parse(util.readFromFile(this._f)) as CollectionType<ModelType>; // update

		var records = util.finder(collection, query, true);

		if (records.length) {
			if (options && options.multi) {
				collection = util.updateFiltered(collection, query, data, true);
				ret.updated = records.length;
				ret.inserted = 0;
			} else {
				collection = util.updateFiltered(collection, query, data, false);
				ret.updated = 1;
				ret.inserted = 0;
			}
		} else {
			if (options && options.upsert) {
				data._id = uuid.v4().replace(/-/g, "");
				collection.push(data);
				ret.updated = 0;
				ret.inserted = 1;
			} else {
				ret.updated = 0;
				ret.inserted = 0;
			}
		}

		util.writeToFile(this._f, collection);

		return ret;
	}

	remove(query?: QueryType<ModelType>, multi?: boolean) {
		if (query) {
			var collection = JSON.parse(util.readFromFile(this._f));
			if (typeof multi === "undefined") {
				multi = true;
			}
			collection = util.removeFiltered(collection, query, multi);

			util.writeToFile(this._f, collection);
		} else {
			util.removeFile(this._f);

			delete this.db[this.collectionName];
		}

		return true;
	}

	count() {
		return (JSON.parse(util.readFromFile(this._f)) as CollectionType<ModelType>).length;
	}
}
