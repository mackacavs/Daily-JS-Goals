const express = require('express');
const exphbs = require('express-handlebars');

const app = express();

app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

const port = 5000;

app.listen(port, () => {
  console.log(`App is listening on port ${port}`)
})

app.get('/', (req, res) => {
  res.render('index')
});

app.get('/about', (req, res) => {
  res.render("about")
})