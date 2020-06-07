(function () {
    const express = require("express");
    const app = express();
    const db = require("./db");
    var cookieSession = require("cookie-session");
    const { secret } = require("./secrets.json");
    const csurf = require("csurf");
    const { hash, compare } = require("./bc");

    // setting up cookie-session:

    app.use(
        cookieSession({
            secret: secret,
            maxAge: 1000 * 60 * 60 * 24 * 14,
        })
    );

    /// setting up Handelbars as Express template engine:
    const hb = require("express-handlebars");
    app.engine("handlebars", hb());
    app.set("view engine", "handlebars");

    // recognizes incoming request as a string:
    app.use(
        express.urlencoded({
            extended: false,
        })
    );

    // protecting against CSRF and clickjacking:
    app.use(csurf());
    app.use(function (req, res, next) {
        res.locals.csrfToken = req.csrfToken();
        res.setHeader("x-frame-options", "deny");
        next();
    });

    /// serving static folder:

    app.use(express.static("./public"));

    //______

    app.get("/", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        res.redirect("/register");
    });

    app.get("/register", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        console.log("req.session.userID:", req.session.userID);
        if (req.session.userID) {
            console.log("this user is already registered");
            res.redirect("/login");
        } else {
            res.render("register");
        }
    });

    app.post("/register", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        if (
            req.body.first &&
            req.body.last &&
            req.body.email &&
            req.body.password
        ) {
            hash(req.body.password)
                .then((hashedPw) => {
                    db.addAccount(
                        req.body.first,
                        req.body.last,
                        req.body.email,
                        hashedPw
                    )
                        .then((results) => {
                            console.log("new record added");
                            req.session.userID = results.rows[0].id;
                            console.log(
                                "req.session.userID:",
                                req.session.userID
                            );
                            res.redirect("/petition");
                        })
                        .catch((err) => {
                            console.log("error in addAccount:", err);
                            res.render("register");
                        });
                })
                .catch((err) => {
                    console.log("error in hash:", err);
                    res.render("register");
                });
        } else {
            console.log("the form is not filled in properly");
            res.render("register");
        }
    });

    app.get("/login", (req, res) => {
        console.log("req.session.userID:", req.session.userID);
        console.log(`ran ${req.method} at ${req.url} route`);
        res.render("login");
    });

    app.post("/login", (req, res) => {
        console.log("req.session.userID:", req.session.userID);
        console.log(`ran ${req.method} at ${req.url} route`);
        if (req.body.email && req.body.password) {
            db.getHashedPw(req.body.email)
                .then((results) => {
                    console.log("hashed password and id:", results);
                    compare(req.body.password, results.rows[0].password).then(
                        (match) => {
                            console.log("match yes/no:", match);
                            if (match) {
                                req.session.userID = results.rows[0].id;
                                req.session.userName = results.rows[0].first;
                                req.session.userSurname = results.rows[0].last;
                                console.log(
                                    "req.session(ID, Name, Last name):",
                                    req.session
                                );

                                db.sigCheck(req.session.userID)
                                    .then((results) => {
                                        console.log("results:", results);
                                        if (results.rows[0].count == 0) {
                                            console.log(
                                                "user hasn't signed the petition yet"
                                            );
                                            res.redirect("/petition");
                                        } else {
                                            console.log(
                                                "the user has already signed the petition"
                                            );
                                            req.session.sigID =
                                                req.session.userID;
                                            // results.rows[0].id;
                                            console.log(
                                                "req.session.sigID:",
                                                req.session.sigID
                                            );
                                            res.redirect("/signed");
                                        }
                                    })
                                    .catch((err) => {
                                        console.log("error in sigCheck", err);
                                        res.render("login");
                                    });
                            } else {
                                console.log("password doesn't match");
                                res.render("login");
                            }
                        }
                    );
                })
                .catch((err) => {
                    console.log("error in getHashedPw", err);
                    res.render("login");
                });
        } else {
            console.log("the form is not filled in properly");
            res.render("login");
        }
    });

    app.get("/petition", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        console.log("req.session.userID:", req.session.userID);
        if (req.session.userID) {
            if (req.session.sigID) {
                res.redirect("/signed");
            } else {
                res.render("petition", {
                    name: req.session.userName,
                });
            }
        } else {
            res.redirect("/register");
        }
    });

    app.post("/petition", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        if (req.body.signature) {
            db.addSignature(req.body.signature, req.session.userID)
                .then((results) => {
                    console.log("new signature added");
                    req.session.sigID = results.rows[0].id;
                    console.log("req.session.sigID:", req.session.sigID);
                    res.redirect("/signed");
                })
                .catch((err) => {
                    console.log("error in addSignature:", err);
                });
        } else {
            console.log("the form is not signed in properly");
            res.redirect("/petition");
        }
    });

    app.get("/signed", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        if (req.session.sigID) {
            db.getCount()
                .then((results) => {
                    let count = results.rows[0].count;
                    db.getSignature(req.session.userID).then((results) => {
                        res.render("signed", {
                            count: count,
                            signature: results.rows[0].signature,
                        });
                    });
                })
                .catch((err) => {
                    console.log("err in getCount:", err);
                });
        } else {
            console.log("/signed: out of cookie-session redirect");
            res.redirect("/register");
        }
    });

    app.get("/signers", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        if (req.session.sigID) {
            db.getNames()
                .then((results) => {
                    console.log("List of persons signed:", results);
                    let signers = [];
                    for (let i = 0; i < results.rows.length; i++) {
                        let fullName = " ";
                        fullName +=
                            results.rows[i].first + " " + results.rows[i].last;
                        signers.push(fullName);
                    }
                    res.render("signers", {
                        signers: signers,
                    });
                })
                .catch((err) => {
                    console.log("err in getNames:", err);
                });
        } else {
            console.log("/signers: out of cookie-session redirect");
            res.redirect("/register");
        }
    });

    app.listen(8080, () => console.log("server is listening..."));
})();
