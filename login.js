const express = require('express');

const router = express.Router();

const tryLogin = require('./app');

function login(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/applications');
  } else {
    const data = {
      title: 'Innskráning',
      errors: [],
    };
    res.render('login', data);
  }
}


router.post('/login', tryLogin);
router.get('/', login);

module.exports = router;
