const spicedPg = require("spiced-pg");
var db = spicedPg("postgres:postgres:postgres@localhost:5432/signatures");

module.exports.addAccount = (first, last, email, hashedPw) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first, last`,
        [first, last, email, hashedPw]
    );
};

module.exports.getHashedPw = (email) => {
    return db.query(
        `SELECT id, first, last, password FROM users WHERE email = $1`,
        [email]
    );
};

module.exports.sigCheck = (sessionUserID) => {
    return db.query(`SELECT COUNT(*) FROM signatures WHERE user_id = $1`, [
        sessionUserID,
    ]);
};

module.exports.addSignature = (signature, id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING id`,
        [signature, id]
    );
};

module.exports.getCount = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`);
};

module.exports.getSignature = (sessionUserID) => {
    return db.query(`SELECT signature FROM signatures WHERE user_id = $1`, [
        sessionUserID,
    ]);
};

module.exports.getSigners = () => {
    return db.query(
        `SELECT first, last, age, city, url FROM users INNER JOIN signatures ON users.id=signatures.user_id LEFT JOIN user_profiles ON signatures.user_id=user_profiles.user_id;`
    );
};

module.exports.addProfile = (age, city, url, sessionUserID) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [age, city, url, sessionUserID]
    );
};
