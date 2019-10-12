let errors = [];

if (req.body.password != req.body.password2) {
  errors.push({ text: "The passwords don't match" })
}

if (req.body.password.length < 6) {
  errors.push({ text: "The password is too short" })
}

if (errors.length > 0) {
  res.render('users/register', {
    errors: errors,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    password2: req.body.password2
  })
} else {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        req.flash('error_msg', "Email already in use");
        res.redirect('/users/register')
      } else {
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password

        })
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save()
              .then(user => {
                req.flash('success_msg', 'You are now registered')
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