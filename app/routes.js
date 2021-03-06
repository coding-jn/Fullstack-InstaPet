const user = require("./models/user");

module.exports = function(app, passport, db, multer, ObjectId) {

// Image Upload Code =========================================================================
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + ".png")
  }
});
var upload = multer({storage: storage}); 

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
      res.render('login.ejs', { message: req.flash('loginMessage') });
      });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('posts').find({postedBy: req.user.local.username}).toArray((err, mainResult) => {
          db.collection('comments').find().toArray((err, result) => {
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            posts: mainResult,
            comments: result
          })
        })
      })
    });

    // FEED SECTION =========================
    app.get('/feed', function(req, res) {
      db.collection('posts').find().toArray((err, mainResult) => {
        db.collection('comments').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('feed.ejs', {
          user : req.user,
          posts: mainResult,
          comments: result
        })
      })
    })
  });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// post & comment routes ===============================================================
    app.get('/posts', function(req, res) {
      db.collection('posts').find({_id: whichPost}).toArray((err, mainResult) => {
        db.collection('comments').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('postPages.ejs', {
          user : req.user,
          posts: mainResult,
          comments: result,
        })
      })
    })
    });

    app.post('/posts', upload.single('file-to-upload'), (req, res) => {
      db.collection('posts').save({postedBy: req.user.local.username, img: 'images/uploads/' + 
      req.file.filename, caption: req.body.caption, likes: 0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })

    app.post('/comments', (req, res) => {
      let postId = ObjectId(req.body.forPost)
      let page = req.body.onPage
      db.collection('comments').save({postedBy: req.user.local.username, forPost: postId, comment: req.body.comment}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/' + page)
      })
    })

    app.put('/posts', (req, res) => {
      let postId = ObjectId(req.body.postId)
      db.collection('posts')
      .findOneAndUpdate({_id: postId}, { 
        $set: {
          likes: req.body.likes + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.delete('/posts', (req, res) => {
      let postId = ObjectId(req.body.postId)
      db.collection('posts').findOneAndDelete({_id: postId}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// profile routes ===============================================================

app.get('/profilePages/:whatUser', function(req, res) {
  let whatUser = req.params.whatUser
  db.collection('posts').find({postedBy: whatUser}).toArray((err, mainResult) => {
    db.collection('comments').find().toArray((err, result) => {
    if (err) return console.log(err)
    res.render('profilePages.ejs', {
      user : req.user,
      account: req.params.whatUser,
      posts: mainResult,
      comments: result,
    })
  })
})
});

// post routes ===============================================================

app.get('/postPages/:whichPost', function(req, res) {
  let whichPost = ObjectId(req.params.whichPost)
  db.collection('posts').find({_id: whichPost}).toArray((err, mainResult) => {
    db.collection('comments').find().toArray((err, result) => {
    if (err) return console.log(err)
    res.render('postPages.ejs', {
      user : req.user,
      posts: mainResult,
      comments: result,
    })
  })
})
});

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
