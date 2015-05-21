var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PCSchema = new Schema(
	{ "_id": String, "resources": {} },
	{ "collection": "PCColl" });

exports.PCModel = mongoose.model("PCModel", PCSchema);
