const spicedPg = require("spiced-pg");
var db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/signatures"
);

module.exports.addAccount = (first, last, email, hashedPw) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first`,
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
        `SELECT first, last, age, UPPER(city), url FROM users INNER JOIN signatures ON users.id=signatures.user_id LEFT JOIN user_profiles ON signatures.user_id=user_profiles.user_id;`
    );
};

module.exports.getSignersByCity = (city) => {
    return db.query(
        `SELECT first, last, age, url FROM users INNER JOIN signatures ON users.id=signatures.user_id LEFT JOIN user_profiles ON signatures.user_id=user_profiles.user_id  WHERE UPPER(city) = $1;`,
        [city]
    );
};

module.exports.addProfile = (age, city, url, sessionUserID) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [age || null, city, url, sessionUserID]
    );
};

module.exports.getUser = (sessionUserID) => {
    return db.query(
        `SELECT first, last, email, age, city, url FROM users JOIN user_profiles ON users.id=user_profiles.user_id WHERE users.id = $1`,
        [sessionUserID]
    );
};

module.exports.editPassword = (hashedPw, sessionUserID) => {
    return db.query(`UPDATE users SET password=$1 WHERE id=$2;`, [
        hashedPw,
        sessionUserID,
    ]);
};

module.exports.editAccount = (sessionUserID, first, last, email) => {
    return db.query(
        `UPDATE users SET first=$2,last=$3,email=$4 WHERE id=$1 RETURNING first`,
        [sessionUserID, first, last, email]
    );
};

module.exports.editProfile = (age, city, url, sessionUserID) => {
    return db.query(
        `UPDATE user_profiles SET age=$1, city=$2, url=$3 WHERE user_id=$4;`,
        [age || null, city, url, sessionUserID]
    );
};

module.exports.deleteSignature = (sessionUserID) => {
    return db.query(`DELETE FROM signatures WHERE user_id = $1`, [
        sessionUserID,
    ]);
};
