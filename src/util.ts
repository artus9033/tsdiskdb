var fs = require("fs");
var merge = require("merge");

export type ModelTypeBase = { _id: string };
export type CollectionType<ModelType extends ModelTypeBase = ModelTypeBase> = Array<ModelType>;
export type QueryType<ModelType extends ModelTypeBase> = Partial<ModelType> | undefined | null;
export type EnrichModelType<ModelType> = ModelType & ModelTypeBase;

export class util {
	static isValidPath(path: string) {
		return fs.existsSync(path);
	}

	static writeToFile(outputFilename: string, content?: CollectionType) {
		if (!content) {
			content = [];
		}
		fs.writeFileSync(outputFilename, JSON.stringify(content, null, 0));
	}

	static readFromFile(file: string) {
		return fs.readFileSync(file, "utf-8");
	}

	static removeFile(file: string) {
		return fs.unlinkSync(file);
	}

	static updateFiltered<ModelType extends ModelTypeBase>(
		collection: CollectionType<ModelType>,
		query: QueryType<ModelType> = {},
		data: Object,
		multi?: boolean
	) {
		// break 2 loops at once - multi : false
		loop: for (var i = collection.length - 1; i >= 0; i--) {
			var c = collection[i];

			for (var p in query) {
				if (p in c && c[p] == query[p]) {
					collection[i] = merge(c, data);
					if (!multi) {
						break loop;
					}
				}
			}
		}

		return collection;
	}

	static removeFiltered<ModelType extends ModelTypeBase>(
		collection: CollectionType<ModelType>,
		query: QueryType<ModelType> = {},
		multi?: boolean
	) {
		// break 2 loops at once -  multi : false
		loop: for (var i = collection.length - 1; i >= 0; i--) {
			var c = collection[i];
			for (var p in query) {
				if (p in c && c[p] == query[p]) {
					collection.splice(i, 1);
					if (!multi) {
						break loop;
					}
				}
			}
		}
		return collection;
	}

	static finder<ModelType extends ModelTypeBase>(
		collection: CollectionType<ModelType>,
		query: QueryType<ModelType> = {},
		multi?: boolean
	) {
		var retCollection = [];

		loop: for (var i = collection.length - 1; i >= 0; i--) {
			var c = collection[i];
			for (var p in query) {
				if (p in c && c[p] == query[p]) {
					retCollection.push(collection[i]);
					if (!multi) {
						break loop;
					}
				}
			}
		}

		return retCollection;
	}

	/** recursive finder **/
	static ObjectSearcher = class {
		results = [];
		objects = [];
		resultIDS = {};

		findAllInObject(object: Object, valueOBj: Object, isMulti?: boolean) {
			for (var objKey in object) {
				this.performSearch(object[objKey], valueOBj, object[objKey]);
				if (!isMulti && this.results.length == 1) {
					return this.results;
				}
			}

			while (this.objects.length !== 0) {
				var objRef = this.objects.pop();
				this.performSearch(objRef["_obj"], valueOBj, objRef["parent"]);
				if (!isMulti && this.results.length == 1) {
					return this.results;
				}
			}

			return this.results;
		}

		performSearch(object: Object, valueOBj: Object, opt_parentObj?: Object) {
			for (var criteria in valueOBj) {
				var query = {};
				query[criteria] = valueOBj[criteria];
				this.searchObject(object, query, opt_parentObj);
			}

			for (var i = 0; i < this.results.length; i++) {
				var result = this.results[i];
				for (var field in valueOBj) {
					if (result[field] !== undefined) {
						if (result[field] !== valueOBj[field]) {
							this.results.splice(i, 1);
						}
					}
				}
			}
		}

		searchObject = function (object: Object, valueOBj: Object, opt_parentObj?: Object) {
			for (var objKey in object) {
				if (typeof object[objKey] != "object") {
					if (valueOBj[objKey] == object[objKey]) {
						if (opt_parentObj !== undefined) {
							if (this.resultIDS[opt_parentObj["_id"]] === undefined) {
								this.results.push(opt_parentObj);
								this.resultIDS[opt_parentObj["_id"]] = "";
							}
						} else {
							if (this.resultIDS[object["_id"]] === undefined) {
								this.results.push(object);
								this.resultIDS[object["_id"]] = "";
							}
						}
					}
				} else {
					var obj = object;
					if (opt_parentObj !== undefined) {
						obj = opt_parentObj;
					}
					var objRef = {
						parent: obj,
						_obj: object[objKey],
					};

					this.objects.push(objRef);
				}
			}
		};
	};
}

export default util;
