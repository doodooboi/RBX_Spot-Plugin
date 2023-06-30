const tokenValidator = require('./tokenValidator')

async function main() {
  const session = new tokenValidator();
  await session.checkTokenValidity();

  if (!session.isAlive) {
   console.log('Previous token expired or not found, generating a new one.');
   await session.generate();
  }

  return (session.accessToken);
}

module.exports.main = main