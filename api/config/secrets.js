module.exports = {
    db: process.env.MONGODB|| 'mongodb://heroku_app24545297:uotnmtqdrrk3eu6vocuss2ebc8@ds033767.mongolab.com:33767/heroku_app24545297',

    testdb: 'mongodb://localhost/test-datefinder-api',

    sessionSecret: process.env.SESSION_SECRET || 'secretsecretsecretsecret',

    // distance in meters for the range of search
    maxDistance: 3500
};
