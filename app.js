//declare all the variables which use the installed packages
var express                = require("express");
var mongoose               = require("mongoose"); 
var bodyParser             = require("body-parser");
var passport               = require("passport");
var LocalStrategy          = require("passport-local");
var passportLocalMoongoose = require("passport-local-mongoose");
var UserSchema             = require("./models/user");
var NoteSchema			   = require("./models/notes")
var User                   = mongoose.model("User", UserSchema);
var Note                   = mongoose.model("Note", NoteSchema);
var async                  = require("async");
var nodemailer             = require("nodemailer");
var crypto                 = require("crypto");
var app                    = express();
var methodOverride         = require("method-override");

app.set('view engine', 'ejs');
app.use(express.static(__dirname +'/public/'));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended:true}));

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
});



//mongoose connect to mongo database
mongoose.connect("mongodb://localhost/notebook_app", {useNewUrlParser:true});
mongoose.set('useCreateIndex', true);
//Authorization setup with passport
app.use(require("express-session")({
	secret: "However difficult life may seem, there is always something you can do and succeed at.",
	resave: false,
	saveUninitialized: false
}));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));
app.use(passport.initialize());
app.use(passport.session());



//ROUTES
//GET REGISTER/INDEX PAGE

app.get("/", function(req, res){
	res.render("index");
});

//REGISTER POST INFO REDIRECT TO TASKS
app.post("/", function(req,res){
	 var newUser = new User({
        username: req.body.username,
        email: req.body.email,
   
      });

    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
           console.log("Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/tasks"); 
        });
    });
});
//LOGIN ROUTES
//GET LOGIN PAGE
app.get("/login", function(req, res){
	res.render("login");
});

//POST FOR AUTHENTICATE
app.post("/login", passport.authenticate("local",{
	successRedirect: "/tasks",
	failureRedirect: "/login"
}), function(req,res){
	
});


//********RESET AND RECOVER LOGIC

app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          console.log('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'acaciaholliday@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'acaciaholliday@gmail.com',
        subject: 'Notebook Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        console.log('success An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

app.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      console.log('Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          console.log('Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            console.log("Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'acaciaholliday@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'acaciaholliday@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
      	console.log('Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/login');
  });
});
//***END OF RECOVERY LOGIC



//RECOVER PASSWORD
app.get("/forgot", function(req, res){
	res.render("forgot");
})

//LOGOUT
app.get("/logout",isLoggedIn, function(req, res){
	req.logout();
	res.redirect("/login");
})

//MIDDLWARE
function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

//GET TASKS PAGE ONLY IF LOGGED IN
app.get("/tasks", isLoggedIn, function(req, res){
	res.render("tasks");
});

//NOTES ROUTES
//GET NOTES PAGE
app.get("/notes", isLoggedIn, function(req,res){

	Note.find({"author.id":req.user._id}, function(err, usernotes) {
		if(err){
			console.log(err);
		} else{
			console.log(usernotes);
			res.render("notes", {notes:usernotes});
		}

	});
});

//TIMER 
app.get("/timer", isLoggedIn, function(req,res){
	res.render("timer");
})

//CHART

//NEW NOTE FORM
app.get("/notes/new",isLoggedIn, function(req,res){
	res.render("new");
});
//POST NEW NOTE
app.post("/notes",isLoggedIn, function(req, res){

	Note.create(req.body.note, function(err, newlyCreated){
		if(err){
			console.log(err);
			console.log("Note failed to save");
		}else{
			newlyCreated.author.id = req.user._id;
			newlyCreated.save();
			res.redirect("/notes");
		}
	});
	
});


//SHOW SPECIFIC NOTE ROUTE
app.get("/note/:id",isLoggedIn, function(req,res){
	Note.findById(req.params.id, function(err, FoundNote){
		if(err){
			console.log(err);
			res.redirect("/notes");

		}else{
			res.render("show", {note:FoundNote});
		}
	});
});

//EDIT SPECIFIC NOTE ROUTE
app.get("/note/:id/edit",isLoggedIn, function(req, res){
	Note.findById(req.params.id, function(err, FoundNote){
		if(err){
			console.log(err);
			res.redirect("/notes");

		}else{
			res.render("edit", {note:FoundNote});
		}
	});


});


//UPDATE ROUTE
app.put("/note/:id/edit", isLoggedIn, function(req,res){
	Note.findByIdAndUpdate(req.params.id, req.body.note, function(err, updatedNote){
		if(err){
			console.log(err);
			res.redirect("/notes");
		}else{
			updatedNote.date = Date.now;
			updatedNote.save();
			res.redirect("/notes");
		}
	});
})

//DELETE ROUTE
app.delete("/note/:id/delete",isLoggedIn, function(req,res){
	//destroy blog
	Note.findByIdAndRemove(req.params.id, function(err){
		if(err){
			console.log(err);
			res.redirect("/notes");
		}else{
			res.redirect("/notes");
		}
	});
});




app.listen(3000, process.env.IP, function(){
	console.log("Notebook Started, you can do it!")
});