const path = require('path');
const connectDB = require('./config/db');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const app = express();

const Users = require('./models/users.js'); //created model loading here
const Inventory = require('./models/inventory.js');
const ShoppingList = require('./models/shoppingList.js'); //created model loading here
const Todo = require('./models/todo.js');

require('dotenv').config();
const PORT = process.env.PORT || 3000;

app
  .use(express.json())
  .use(cors())
  .use('/user', require('./routes/userRoutes'))
  .use('/shoppingList', require('./routes/shoppingList'))
  .use('/inventory', require('./routes/inventory'))
  .use('/todo', require('./routes/todo'))
  .use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  .get('/', (req, res)=>{
    res.send('hello world!')
  })
  .listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
  });

//Google Auth
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = '187413557289-oc5grf2uj2h0obja29sccfekgvd1mn39.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

//MIDDLEWARE

app.set('view engine', 'ejs');
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res)=>{
    res.render('index');
})

app.get('/login', (req, res)=>{
    res.render('login');
})

app.post('/login', (req, res)=>{
    let token = req.body.token;

    console.log(token);

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        // const domain = payload
        console.log(payload);
      }
      verify()
      .then(()=>{
        res.cookie('session-token', token);
        res.send('success');
      }).
      catch(console.error);
})

app.get('/dashboard', checkAuthenticated, (req, res)=>{
    let user = req.user;
    res.render('dashboard', {user});
})

app.get('/protectedRoute', checkAuthenticated, (req, res)=>{
    res.render('protectedroute');
})

app.get('/logout', (req, res)=>{
    res.clearCookie('session-token');
    res.redirect('/login')
})

//Check Authenticated Function

function checkAuthenticated(req, res, next){
    let token = req.cookies['session-token'];

    let user = {};
    async function verify(){
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID, //Specify CLIENT_ID of app that accesses backend.
        });
        const payload = ticket.getPayload();
        user.name = payload.name;
        user.email = payload.email;
        user.picture = payload.picture;
    }
    verify()
    .then(()=>{
        req.user = user;
        next();
    })
    .catch(err=>{
        res.redirect('/login')
    })
}


module.exports = app;