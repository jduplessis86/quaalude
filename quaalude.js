let request = require('request')

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');


var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

// require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

// launch with:
// > node quaalude.js

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// required for passport
app.use(session({ secret: 'MethaqualoneMandraxQuinazolinone' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('Quaalude launched on port' + port);

app.get('/', (req, res) => res.send('Check out /tsdata'));

// Right now just serving as a pass through
app.get('/tsdata/:sym', (req, res) => {

  const pickleRisk = 'http://localhost:5000/history/' + req.params.sym;

  request(pickleRisk, ((symbol, responseObj) => {
    return (pErr, pReq, pBody) => {
      if (pErr) {
        console.log (pErr);
        console.log ("Could not retrieve data from pickleRisk for: " + symbol);
        return;
      }
  
      console.log ("Received data from pickleRisk for " + req.params.sym);
  
      datesAndCloses = JSON.parse(pBody);
      responseObj.json(datesAndCloses);
    }
  })(req.params.sym, res));
});

// BUG: any kind of unexpected response (e.g. HTML) causes crashes.

app.get('/multitsdata', (req, res) => {
  console.log ('Multi Symbol Request')

  const pickleRisk = 'http://localhost:5000/multihistory?symbols=' + req.query.symbols;

  request(pickleRisk, ((symbols, responseObj) => {
    return (pErr, pReq, pBody) => {
      if (pErr) {
        console.log (pErr);
        console.log ("Could not retrieve data from pickleRisk for: " + symbols);
        return;
      }

      console.log('Received multidata from pickleRisk for ' + symbols);
      responseObj.json(JSON.parse(pBody))
    }
  })(req.query.symbols, res));
});

app.listen(port, () => console.log(`Quaalude launched on port ${port}!`));
