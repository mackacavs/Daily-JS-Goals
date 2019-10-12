const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const session = require('express-session')
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const bcrypt = require('bcryptjs')
const passport = require('passport')

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

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(methodOverride('_method'))

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))

app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
  res.render('index')
});

app.get('/goals/add', (req, res) => {
  res.render('goals/add')
});

app.get('/goals/edit/:id', (req, res) => {
  Goal.findOne({
    _id: req.params.id
  })
    .then(goal => {
      res.render('goals/edit', {
        goal: goal
      })
    })
});

app.get('/goals/index', (req, res) => {
  Goal.find().sort()
    .then(goals => {
      res.render('goals/index', {
        goals: goals
      })
    })
});

app.post('/goals', (req, res) => {
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
      howToComplete: req.body.how
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

app.put('/goals/:id', (req, res) => {
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

app.delete('/goals/:id', (req, res) => {
  Goal.deleteOne({ _id: req.params.id })
    .then(() => {
      res.redirect("/goals/index")
    })
})

app.get('/users/login', (req, res) => {
  res.render('users/login')
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

app.listen(port, () => {
  console.log(`App is listening on port ${port}`)
})