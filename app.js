require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-local');

const apply = require('./apply');
const register = require('./register');
const admin = require('./admin');
// const login = require('./login');
const applications = require('./applications');
const users = require('./users');

/* todo sækja stillingar úr env */
const {
  HOST: hostname = '127.0.0.1',
  PORT: port = 3000,
  SESSION_SECRET: sessionSecret,
} = process.env;

if (!sessionSecret) {
  console.error('Add SESSION_SECRET to .env');
  process.exit(1);
}

const app = express();

// Skilgreina session sem express notar
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  maxAge: 24 * 60 * 1000, // 1 dagur
}));

/**
 * Athugar hvort username og password sé til í notandakerfi.
 * Callback tekur við villu sem fyrsta argument, annað argument er
 * - `false` ef notandi ekki til eða lykilorð vitlaust
 * - Notandahlutur ef rétt
 *
 * @param {string} username Notandanafn til að athuga
 * @param {string} password Lykilorð til að athuga
 * @param {function} done Fall sem kallað er í með niðurstöðu
 */
async function strat(username, password, done) {
  try {
    const user = await users.findByUsername(username);
    if (!user) {
      return done(null, false);
    }

    // Verður annað hvort notanda hlutur ef lykilorð rétt, eða false
    const result = await users.comparePasswords(password, user);
    return done(null, result);
  } catch (err) {
    console.error(err);
    return done(err);
  }
}

// Notum local strategy með „strattinu“ okkar til að leita að notanda
passport.use(new Strategy(strat));


// Geymum id á notanda í session, það er nóg til að vita hvaða notandi þetta er
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Sækir notanda út frá id
passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Látum express nota passport með session
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

/**
* Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
*
* @param {string} field Middleware sem grípa á villur fyrir
* @param {array} errors Fylki af villum frá express-validator pakkanum
* @returns {boolean} `true` ef `field` er í `errors`, `false` annars
*/
function isInvalid(field, errors) {
  return Boolean(errors.find(i => i.param === field));
}

app.locals.isInvalid = isInvalid;

app.route('/login')
  .get((req, res) => { // Þegar /login er opnað
    if (req.isAuthenticated()) {
      res.redirect('/applications');
    } else {
      let message = '';

      // Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
      // og hreinsum skilaboð
      if (req.session.messages && req.session.messages.length > 0) {
        message = req.session.messages.join(', ');
        req.session.messages = [];
      }
      const data = {
        title: 'Innskráning',
        errors: [],
        message,
      };
      res.render('login', data);
    }
  })

  .post(// Þetta notar strat að ofan til að skrá notanda inn
    passport.authenticate('local', {
      failureMessage: 'Notendanafn eða lykilorð vitlaust.',
      failureRedirect: '/login',
    }),

    // Ef við komumst hingað var notandi skráður inn, senda á /admin
    (req, res) => {
      res.redirect('/admin');
    },
  );

app.use('/', apply);
app.use('/register', register);
app.use('/applications', applications);
app.use('/admin', admin);


function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { page: 'error', title: '404', error: '404 fannst ekki' });
}

function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { page: 'error', title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, hostname, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});
