const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

const {ObjectId} =  require('mongodb');

var {mongoose}  = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate')

var app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

app.post( '/todos' , authenticate , ( req , res ) => {
  var newTodo = new Todo({
    text: req.body.text,
    _creator: req.user.id
  })
  newTodo.save().then( doc => {
    res.send(doc);
  }).catch( err => {
    res.status(400).send(err);
  })
});//POST create todos '/todos'

app.get('/todos' , authenticate ,( req , res ) => {
  Todo.find({ _creator: req.user.id })
    .then( todos => {
      res.send({todos});
    })
    .catch( err => {
      res.status(400).send(err);
    })
});//GET get all todos '/todos'

app.get('/todos/:id', authenticate , (req,res) => {
  var id = req.params.id
  if(!ObjectId.isValid(id)){
    return res.status(404).send();
  }
  Todo.findOne({
    _id: id,
    _creator: req.user._id
  }).then(todo => {
    if(!todo){
      return res.status(404).send();
    }
    res.send({todo});
  }).catch( err => {
    res.status(400).send();
  })
});//GET get todo with id '/todos/:id'

app.delete('/todos/:id' , authenticate , (req,res) => {
  var id = req.params.id;
  if(!ObjectId.isValid(id)){
    return res.status(404).send();
  }

  Todo.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if(!todo){
      return res.status(404).send();
    }
    res.send(todo);
  }).catch((e) => {
    res.status(400).send();
  })
});//DELETE delete todo with id '/todos/:id'

app.patch('/todos/:id' , authenticate , (req,res) => {
  var id = req.params.id;
  if(!ObjectId.isValid(id)){
    return res.status(404).send();
  }
  var body = _.pick(req.body , ['text' , 'completed']);
  if(_.isBoolean(body.completed) && body.completed){
    body.completedAt = new Date().getTime();
  }else{
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate({
    _id: id,
    _creator: req.user._id
  } , { $set: body} , {new: true})
    .then(todo => {
      if(!todo){
        res.status(404).send();
      }
      res.send({todo});
    })
    .catch(e => {
      res.status(400).send();
    });
});//PATCH patch todo with id '/todos/:id'

app.post('/users' , (req,res) => {
  var body = _.pick(req.body , ['email','password']);
  var user = new User(body);
  user.save()
    .then(() => {
      return user.generateAuthToken();
    })
    .then((token) => {
      res.header('x-auth' , token).send(user);
    })
    .catch(e => {
      res.status(400).send(e);
    });
});//POST create users '/users'

app.get('/users/me' , authenticate , (req,res) => {
  res.send(req.user);
});//GET authenticate users '/users/me'

app.post('/users/login' , (req,res) => {
  var body = _.pick(req.body , ['email' , 'password']);
  User.findByCredentials(body.email , body.password)
    .then(user => {
      return user.generateAuthToken()
        .then(token => {
          res.header('x-auth' , token).send(user);
        });
    })
    .catch(err => {
       res.status(400).send();
    });
});//POST login users '/users/login'

app.delete('/users/me/token' , authenticate , (req,res) => {
  req.user.removeToken(req.token)
    .then(() => {
      res.status(200).send();
    } , () => {
      res.status(400).send();
    });
});//POST logout users '/users/me/token'

app.listen( port , () => {
  console.log(`Started listening to port : ${port}...`);
})