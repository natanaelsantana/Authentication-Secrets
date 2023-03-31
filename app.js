//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require ("mongoose");
const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require("passport-local-mongoose");
const { application } = require('express');



const app = express();

app.use(express.static('public'));
app.set("view engine", "ejs"),
app.use(bodyParser.urlencoded ({
    extended:true
}));

app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false,
    //cookie: { secure: true }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password:String 
})

//passport already set hash, thats why we excluded md5
userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema)

//this configure passport to use a strategy function to authenticate User
passport.use(User.createStrategy());

/*This two lines keeps the user authenticated during the session
turning possible to access entire website without login again and keeping him logged
until he log out*/
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function (req, res) {
    res.render("home")
})

app.get("/login", function (req, res) {
    res.render("login")
    
})

app.get("/register", function (req, res) {
    res.render("register")

})

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated ()) {
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
});

/*Passport oficial site say to use "POST" instead "GET" in order to prevent some accidental 
log out request, but it doesn't function propely, so i used "GET"*/
app.get('/logout', function(req, res, next){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
        });
});


app.post("/register", function (req,res) {

    User.register({username: req.body.username}, req.body.password, function (err,user){
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req,res, function () {
                res.redirect("/secrets")
            });
        };
    });

   
})

app.post("/login", function (req,res) {
    const user = new User ({
        username : req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req,res, function () {
                res.redirect("/secrets")
        })
    }

      });
})


app.listen(3000,function() {
    console.log("server started on port 3000")
})
