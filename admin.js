const express = require('express');

const { selectUsers, takeAdmin, giveAdmin } = require('./db');

const router = express.Router();

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// Hjálpar middleware sem athugar hvort notandi sé innskráður og hleypir okkur
// þá áfram, annars sendir á /login
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.redirect('/login');
}

async function openAdmin(req, res) {
  const userList = await selectUsers();
  const isLoggedIn = req.isAuthenticated();
  let displayName = '';
  if (isLoggedIn) {
    displayName = req.user.name;
  }
  const isAdmin = req.user.admin;
  return res.render('admin', { title: 'admin', userList, isLoggedIn, displayName, isAdmin });
}

async function updateAdmins(req, res) {
  await takeAdmin();
  const id = req.body.id; // eslint-disable-line
  if (id) {
    if (typeof id === 'string') {
      await giveAdmin(id);
    } else {
      for (let i of id) { // eslint-disable-line
        await giveAdmin(i);
      }
    }
  }
  res.redirect('/admin');
}

router.get('/', ensureLoggedIn, catchErrors(openAdmin));
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
router.post('/', updateAdmins);

module.exports = router;
