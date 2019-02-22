
/* todo útfæra virkni fyrir notendur */

/* hasha password og senda í gagnagrunn */
// ...
const bcrypt = require('bcrypt');

const { insertUser, selectUsers } = require('./db');


async function hashPassword(data) {
  const hashdata = data;
  const hash = bcrypt.hashSync(data.password, 10);

  hashdata.password = hash;
  await insertUser(hashdata);
}


async function comparePasswords(password, user) {
  const ok = await bcrypt.compare(password, user.password);

  if (ok) {
    return user;
  }

  return false;
}

async function findByUsername(username) {
  const list = await selectUsers();

  const found = list.find(u => u.username === username);

  if (found) {
    return Promise.resolve(found);
  }

  return Promise.resolve(null);
}

async function findById(id) {
  const list = await selectUsers();

  const found = list.find(u => u.id === id);

  if (found) {
    return Promise.resolve(found);
  }

  return Promise.resolve(null);
}


module.exports = {
  hashPassword,
  comparePasswords,
  findByUsername,
  findById,
};
