var mongoose = require("mongoose"); //this model is going to be saved in mongoose so we need mongoose
var passportLocalMongoose = require("passport-local-mongoose"); // passport + mongoose will work together
var Schema = mongoose.Schema; // prime a variable with the mongoose Schema definition

var UserSchema = new Schema({ //new mongoose Schema called UserSchema with definitions
	username: {type: String, unique: true, required:true},
	password: String,
	email: {type: String, unique: true, required:true},
	resetPasswordToken: String,
    resetPasswordExpires: Date

});

UserSchema.plugin(passportLocalMongoose); // the implementation of passport as plugin with  UserSchema

module.exports = (UserSchema); //return the UserSchema