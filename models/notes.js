var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var NoteSchema = new Schema({
	title:String,
	text:String,
	date: { type: Date, default: Date.now },
	author:{
			id:{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	}
});


module.exports =(NoteSchema);