import fs from "fs";
import path from "path";

import { isArray } from "lodash";
import { v4 } from "uuid";

import util, { CollectionType, EnrichModelType, ModelTypeBase, QueryType } from "./util";
import DiskDB from ".";

export default class Collection<CollectionModelType> {
	private _filePath: string;

	constructor(private db: DiskDB<any>, private collectionName: string) {
		this._filePath = path.join(this.db._db.path, this.collectionName + ".json");
	}

	find(
		query?: QueryType<EnrichModelType<CollectionModelType>>
	): EnrichModelType<CollectionModelType>[] {
		try {
			let collection: CollectionType<EnrichModelType<CollectionModelType>> = JSON.parse(
				util.readFromFile(this._filePath)
			);

			return !query || Object.keys(query).length === 0
				? collection
				: new util.ObjectSearcher().findAllInObject(collection, query, true);
		} catch {
			// file does not exist
			return [];
		}
	}

	findOne(
		query?: QueryType<EnrichModelType<CollectionModelType>>
	): EnrichModelType<CollectionModelType> | undefined {
		try {
			let collection: CollectionType<EnrichModelType<CollectionModelType>> = JSON.parse(
				util.readFromFile(this._filePath)
			);

			if (query) {
				let results = new util.ObjectSearcher().findAllInObject(collection, query, false);

				return results.length ? results[0] : undefined;
			} else {
				return collection.length ? collection[0] : undefined;
			}
		} catch {
			// file does not exist
			return undefined;
		}
	}

	save(
		data: Omit<EnrichModelType<CollectionModelType>, "_id">
	): EnrichModelType<CollectionModelType>;
	save(
		data: Omit<EnrichModelType<CollectionModelType>, "_id">[]
	): EnrichModelType<CollectionModelType>[];
	save(
		data:
			| Omit<EnrichModelType<CollectionModelType>, "_id">
			| Omit<EnrichModelType<CollectionModelType>, "_id">[]
	): EnrichModelType<CollectionModelType> | EnrichModelType<CollectionModelType>[] {
		let collection: CollectionType<EnrichModelType<CollectionModelType>>;

		try {
			collection = JSON.parse(util.readFromFile(this._filePath)) as CollectionType<
				EnrichModelType<CollectionModelType>
			>;
		} catch {
			// file does not exist
			collection = [];
		}

		if (isArray(data)) {
			/*
			if (data.length === 1) {
				if (isArray(data[0]) && data[0].length > 0) {
					data = data[0];
				}
			}*/

			let retCollection = [];

			for (let i = data.length - 1; i >= 0; i--) {
				let newData = {
					...data[i],
					_id: v4().replace(/-/g, ""),
				} as EnrichModelType<CollectionModelType>;
				collection.push(newData);
				retCollection.push(newData);
			}

			util.writeToFile(this._filePath, collection);

			return retCollection;
		} else {
			let newData = {
				...data,
				_id: v4().replace(/-/g, ""),
			} as EnrichModelType<CollectionModelType>;

			collection.push(newData);

			util.writeToFile(this._filePath, collection);

			return newData;
		}
	}

	update(
		query: QueryType<EnrichModelType<CollectionModelType>>,
		data: EnrichModelType<CollectionModelType>,
		options?: {
			multi?: boolean;
			upsert?: boolean;
		}
	) {
		let ret: {
			updated: number;
			inserted: number;
		} = { updated: 0, inserted: 0 };

		let collection: CollectionType<EnrichModelType<CollectionModelType>>;

		try {
			collection = JSON.parse(util.readFromFile(this._filePath));
		} catch {
			// file does not exist
			collection = [];
		}

		let records = util.finder(collection, query, true);

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
				data._id = v4().replace(/-/g, "");
				collection.push(data);
				ret.updated = 0;
				ret.inserted = 1;
			} else {
				ret.updated = 0;
				ret.inserted = 0;
			}
		}

		util.writeToFile(this._filePath, collection);

		return ret;
	}

	remove(query?: QueryType<EnrichModelType<CollectionModelType>>, multi: boolean = true) {
		if (fs.existsSync(this._filePath)) {
			if (query) {
				let collection: CollectionType<EnrichModelType<CollectionModelType>> = JSON.parse(
					util.readFromFile(this._filePath)
				);

				collection = util.removeFiltered(collection, query, multi);

				util.writeToFile(this._filePath, collection);
			} else {
				util.removeFile(this._filePath);

				delete this.db[this.collectionName];
			}
		}
	}

	count() {
		try {
			return (
				JSON.parse(util.readFromFile(this._filePath)) as CollectionType<
					EnrichModelType<CollectionModelType>
				>
			).length;
		} catch {
			// file does not exist
			return 0;
		}
	}
}
