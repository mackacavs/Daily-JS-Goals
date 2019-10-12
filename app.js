const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const session = require('express-session')
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const flash = require('connect-flash');

const { ensureAuthenticated } = require('./helpers/auth');

const app = express();

const port = 5000;

mongoose.connect('mongodb://localhost/jsToLearn', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("We have connected")
  });

require('./models/Goal');
const Goal = mongoose.model('goals')

require('./models/User');
const User = mongoose.model('users')

require('./config/passport')(passport)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(methodOverride('_method'))

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null
  next();
})

app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
  res.render('index')
});

app.get('/goals/add', ensureAuthenticated, (req, res) => {
  res.render('goals/add')
});

app.get('/goals/edit/:id', ensureAuthenticated, (req, res) => {
  Goal.findOne({
    _id: req.params.id
  })
    .then(goal => {
      res.render('goals/edit', {
        goal: goal
      })
    })
});

app.get('/goals/index', ensureAuthenticated, (req, res) => {
  Goal.find({ user: req.user.id }).sort()
    .then(goals => {
      res.render('goals/index', {
        goals: goals
      })
    })
});

app.post('/goals', ensureAuthenticated, (req, res) => {
  errors = []
  if (!req.body.objective) {
    errors.push({ text: "Please enter an objective" })
  }

  if (!req.body.description) {
    errors.push({ text: "Please enter a description" })
  }

  if (!req.body.how) {
    errors.push({ text: "Please tell yourself how" })
  }

  if (errors.length === 0) {
    const newObjective = {
      objective: req.body.objective,
      description: req.body.description,
      howToComplete: req.body.how,
      user: req.user.id
    }
    new Goal(newObjective)
      .save()
      .then(goal => {
        res.redirect('/goals/index')
      })
  } else {
    res.render('goals/add', {
      errors: errors,
      objective: req.body.objective,
      description: req.body.description,
      howToComplete: req.body.how
    })
  }
});

app.put('/goals/:id', ensureAuthenticated, (req, res) => {
  Goal.findOne({
    _id: req.params.id
  })
    .then(goal => {
      goal.objective = req.body.objective;
      goal.description = req.body.description;
      goal.howToComplete = req.body.how;

      goal.save()
        .then(goal => {
          res.redirect('/goals/index')
        })
    })
})

app.delete('/goals/:id', ensureAuthenticated, (req, res) => {
  Goal.deleteOne({ _id: req.params.id })
    .then(() => {
      req.flash('success_msg', 'Goal deleted')
      res.redirect("/goals/index")
    })
})

app.get('/users/register', (req, res) => {
  res.render('users/register')
})


app.post('/users/register', (req, res) => {
  let errors = [];

  if (req.body.password != req.body.passwordConfirm) {
    errors.push({ text: "The passwords don't match" })
  }

  if (req.body.password.length < 6) {
    errors.push({ text: "The password is too short" })
  }

  if (errors.length > 0) {

    res.render('users/register', {
      errors: errors,
      email: req.body.email,
      password: req.body.password,
      password2: req.body.passwordConfirm
    })
  } else {
    User.findOne({ email: req.body.email })
      .then(user => {
        if (user) {
          errors.push({ text: "That email has already been used" })
          res.render('users/register', {
            errors: errors,
            email: req.body.email,
            password: req.body.password,
            password2: req.body.password2
          })
        } else {
          const newUser = new User({
            email: req.body.email,
            password: req.body.password
          })
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser.save()
                .then(user => {
                  console.log("Hello")
                  console.log(user)
                  res.redirect('/users/login')
                })
                .catch(err => {
                  console.log(err)
                  return;
                })
            });
          })
        }
      })
  }
})

app.get('/users/login', (req, res) => {
  res.render('users/login')
})

app.post('/users/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/goals/index',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next)
})

app.get('/users/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You have logged out')
  res.redirect('/users/login')
});




app.listen(port, () => {
  console.log(`App is listening on port ${port}`)
})