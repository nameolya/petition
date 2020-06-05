const spicedPg = require("spiced-pg");
var db = spicedPg("postgres:postgres:postgres@localhost:5432/signatures");

module.exports.addName = (first, last, signature) => {
    return db.query(
        `INSERT INTO signatures (first, last, signature) VALUES ($1, $2, $3) RETURNING id`,
        [first, last, signature]
    );
};

module.exports.getCount = () => {
    return db.query(`SELECT COUNT(*), signature FROM signatures`);
};

module.exports.getNames = () => {
    return db.query(`SELECT first, last FROM signatures`);
};
