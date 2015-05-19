// load the things we need
var mongoose = require('mongoose')
var bcrypt	 = require('bcrypt-nodejs')


// define the schema for our user model
var userSchema = mongoose.Schema({
	username: String,
	password: String,
	role: String,
	suspended: Boolean,
})

// methods...
// generating a hash
userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

// checking if password is valid
userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password)
}


// create the model for users and expose it to our app
var User =
module.exports = mongoose.model('User', userSchema)


// XXX add a root user...
User.findOne({username: 'root'}, function(err, user){
	if(err){
		return err
	}

	if(user){
		return user

	} else {
		var root = new User()

		root.username = 'root'
		root.password = root.generateHash('root')
		root.role = 'root'

		root.save(function(err){
			if(err){
				console.log('!!!!', err)
			} else {
				console.log('XXX added stub root user...')
			}
		})

		return root
	}
})


// vim:set ts=4 sw=4 nowrap :
