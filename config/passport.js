// load all the things we need
var LocalStrategy       = require('passport-local').Strategy;
var FacebookStrategy    = require('passport-facebook').Strategy;
var TwitterStrategy     = require('passport-twitter').Strategy;
var GoogleStrategy      = require('passport-google-oauth').OAuth2Strategy;
var VKontakteStrategy = require('passport-vkontakte').Strategy;
var OdnoklassnikiStrategy = require('passport-odnoklassniki').Strategy;
var http = require('http');
var request = require('request');

// load up the user model
var User       = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
            User.findOne({ 'local.email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.'));

                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

                // all is well, return user
                else
                    return done(null, user);
            });
        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        // create the user
                        var newUser            = new User();

                        newUser.local.email    = email;
                        newUser.local.password = newUser.generateHash(password);

                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            return done(null, newUser);
                        });
                    }

                });
            // if the user is logged in but has no local account...
            } else if ( !req.user.local.email ) {
                // ...presumably they're trying to connect a local account
                // BUT let's check if the email used to connect a local account is being used by another user
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    if (err)
                        return done(err);
                    
                    if (user) {
                        return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
                        // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                    } else {
                        var user = req.user;
                        user.local.email = email;
                        user.local.password = user.generateHash(password);
                        user.save(function (err) {
                            if (err)
                                return done(err);
                            
                            return done(null,user);
                        });
                    }
                });
            } else {
                // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                return done(null, req.user);
            }

        });

    }));
    // =========================================================================
    // Vkontakte ================================================================
    // =========================================================================
    passport.use(new OdnoklassnikiStrategy({
            clientID: 'ODNOKLASSNIKI_APP_ID',
            clientPublic: 'ODNOKLASSNIKI_APP_PUBLIC_KEY',
            clientSecret: 'ODNOKLASSNIKI_APP_SECRET_KEY',
            callbackURL: "http://localhost:8080/auth/odnoklassniki/callback"
        },
        function(req, token, refreshToken, profile, done) {
            req.user ? req.logout() : ''
            // asynchronous
            process.nextTick(function() {
                    console.log(profile) // Print the google web page.
                // check if the user is already logged in
                /*if (!req.user) {

                    User.findOne({ 'vk.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);

                        if (user) {

                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.vk.token) {
                                user.vk.token  = token;
                                //user.vk.photos = photos ? photos[0].photo_100 : '/images/icon/unknown-user-pic.jpg';
                                //user.facebook.name   = profile.name.givenName + ' ' + profile.name.familyName;
                                user.vk.name   = profile.displayName;
                                user.vk.email  = null;

                                user.save(function(err) {
                                    if (err)
                                        return done(err);

                                    return done(null, user);
                                });
                            }

                            return done(null, user); // user found, return that user
                        } else {
                            // if there is no user, create them
                            var newUser             = new User();

                            newUser.vk.id     = profile.id;
                            newUser.vk.token  = token;
                            //newUser.vk.photos = photos ? photos[0].photo_100 : '/images/icon/unknown-user-pic.jpg';
                            //newUser.facebook.name   = profile.name.givenName + ' ' + profile.name.familyName;
                            newUser.vk.name   = profile.displayName;
                            newUser.vk.email  = null;

                            newUser.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, newUser);
                            });
                        }
                    });

                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user            = req.user; // pull the user out of the session

                    user.facebook.id    = profile.id;
                    user.facebook.token = token;
                    user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                    user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                    user.save(function(err) {
                        if (err)
                            return done(err);

                        return done(null, user);
                    });

                }*/
            });

        }
    ));
    // =========================================================================
    // Vkontakte ================================================================
    // =========================================================================
    passport.use(new VKontakteStrategy(
        {
            clientID:     5646716, // VK.com docs call it 'API ID', 'app_id', 'api_id', 'client_id' or 'apiId'
            clientSecret: 'TO4UtLdwdpGrtnvPZlWn',
            callbackURL:  "http://localhost:8080/auth/vkontakte/callback",
            scope: ['email'],
            profileFields: ['email', 'picture.type(large)']
        },
        function(req, token, refreshToken, profile, done) {
            req.user ? req.logout() : ''
            // asynchronous
            process.nextTick(function() {

                request('https://api.vk.com/method/users.get?user_id='+profile.id+'&v=5.23&fields=photo_100', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        console.log(JSON.parse(body)) // Print the google web page.
                        // check if the user is already logged in
                        var photos = JSON.parse(body).response;
                        if (!req.user) {

                            User.findOne({ 'vk.id' : profile.id }, function(err, user) {
                                if (err)
                                    return done(err);

                                if (user) {

                                    // if there is a user id already but no token (user was linked at one point and then removed)
                                    if (!user.vk.token) {
                                        user.vk.token  = token;
                                        user.vk.photos = photos ? photos[0].photo_100 : '/images/icon/unknown-user-pic.jpg';
                                        //user.facebook.name   = profile.name.givenName + ' ' + profile.name.familyName;
                                        user.vk.name   = profile.displayName;
                                        user.vk.email  = null;

                                        user.save(function(err) {
                                            if (err)
                                                return done(err);

                                            return done(null, user);
                                        });
                                    }
                                    return done(null, user); // user found, return that user
                                } else {
                                    // if there is no user, create them
                                    var newUser             = new User();

                                    newUser.vk.id     = profile.id;
                                    newUser.vk.token  = token;
                                    newUser.vk.photos = photos ? photos[0].photo_100 : '/images/icon/unknown-user-pic.jpg';
                                    //newUser.facebook.name   = profile.name.givenName + ' ' + profile.name.familyName;
                                    newUser.vk.name   = profile.displayName;
                                    newUser.vk.email  = null;

                                    newUser.save(function(err) {
                                        if (err)
                                            return done(err);
                                        notification.emit('user', {id: 1, text: 'Мы рады приветствовать нового юзера '+ newUser.vk.name, title: 'New user'});


                                        return done(null, newUser);
                                    });
                                }
                            });

                        } else {
                            // user already exists and is logged in, we have to link accounts
                            var user            = req.user; // pull the user out of the session

                            user.vk.id    = profile.id;
                            user.vk.token = token;
                            user.vk.name  = profile.name.givenName + ' ' + profile.name.familyName;
                            user.vk.email = (profile.emails[0].value || '').toLowerCase();

                            user.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, user);
                            });

                        }
                    }
                })
            });

        }
    ));
    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        profileFields: ['id', 'displayName', 'picture.type(large)', 'email'],
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {
        req.user ? req.logout() : ''
        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.facebook.token) {
                            user.facebook.token  = token;
                            user.facebook.photos = profile.photos ? profile.photos[0].value : '/images/icon/unknown-user-pic.jpg';
                                //user.facebook.name   = profile.name.givenName + ' ' + profile.name.familyName;
                            user.facebook.name   = profile.displayName;
                            user.facebook.email  = (profile.emails[0].value || '').toLowerCase();

                            user.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser             = new User();

                        newUser.facebook.id     = profile.id;
                        newUser.facebook.token  = token;
                        newUser.facebook.photos = profile.photos ? profile.photos[0].value : '/images/icon/unknown-user-pic.jpg';
                        //newUser.facebook.name   = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook.name   = profile.displayName;
                        newUser.facebook.email  = (profile.emails[0].value || '').toLowerCase();

                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                            notification.emit('user', {id: 1, text: 'Мы рады приветствовать нового юзера '+ newUser.facebook.name, title: 'New user'});

                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user            = req.user; // pull the user out of the session

                user.facebook.id    = profile.id;
                user.facebook.token = token;
                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                user.save(function(err) {
                    if (err)
                        return done(err);
                        
                    return done(null, user);
                });

            }
        });

    }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({

        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, tokenSecret, profile, done) {
        req.user ? req.logout() : ''
        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {
                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.twitter.token) {
                            user.twitter.token       = token;
                            user.twitter.username    = profile.username;
                            user.twitter.displayName = profile.displayName;

                            user.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser                 = new User();

                        newUser.twitter.id          = profile.id;
                        newUser.twitter.token       = token;
                        newUser.twitter.username    = profile.username;
                        newUser.twitter.displayName = profile.displayName;

                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                            notification.emit('user', {id: 1, text: 'Мы рады приветствовать нового юзера '+ newUser.twitter.name, title: 'New user'});

                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user                 = req.user; // pull the user out of the session

                user.twitter.id          = profile.id;
                user.twitter.token       = token;
                user.twitter.username    = profile.username;
                user.twitter.displayName = profile.displayName;

                user.save(function(err) {
                    if (err)
                        return done(err);

                    return done(null, user);
                });
            }

        });

    }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {
        req.user ? req.logout() : ''
        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'google.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);
                    
                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.google.token) {
                            user.google.token = token;
                            user.google.name  = profile.displayName;
                            user.google.photos  = profile._json.picture;
                            user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                            user.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser           = new User();

                        newUser.google.id     = profile.id;
                        newUser.google.token  = token;
                        newUser.google.name   = profile.displayName;
                        newUser.google.photos = profile._json.picture;
                        newUser.google.email  = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                            notification.emit('user', {id: 1, text: 'Мы рады приветствовать нового юзера '+ newUser.google.name, title: 'New user'});
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user               = req.user; // pull the user out of the session

                user.google.id    = profile.id;
                user.google.token = token;
                user.google.name  = profile.displayName;
                user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                user.save(function(err) {
                    if (err)
                        return done(err);
                        
                    return done(null, user);
                });

            }

        });

    }));

};
