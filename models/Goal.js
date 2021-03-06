const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Goal = new Schema({
  objective: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  howToComplete: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  date: {
    type: String,
    default: new Date().toDateString()
  }
});

mongoose.model('goals', Goal)
