(function () {
    const express = require("express");
    const app = express();
    const db = require("./db");
    var cookieSession = require("cookie-session");
    let secret;
    if (process.env.PORT) {
        secret = process.env.secret;
    } else {
        secret = require("./secrets").secret;
    }
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

    /// setting up cookies:

    app.use((req, res, next) => {
        console.log("middleware running");
        console.log(`ran ${req.method} at ${req.url} route`);
        console.log(
            "req.session.userID, req.session.sigID:",
            req.session.userID,
            req.session.sigID
        );
        if (
            !req.session.userID &&
            !req.session.sigID &&
            req.url != "/register" &&
            req.url != "/login"
        ) {
            console.log("redirect: user shall register or to log in");
            res.redirect("/register");
        } else if (
            req.session.userID &&
            !req.session.sigID &&
            req.url != "/petition" &&
            req.url != "/profile"
        ) {
            console.log("redirect: user shall sign the petition first");
            res.redirect("/petition");
        } else if (
            req.session.userID &&
            req.session.sigID &&
            (req.url == "/register" ||
                req.url == "/login" ||
                req.url == "/petition" ||
                req.url == "/profile")
        ) {
            console.log("redirect: user has already signed the petition");
            res.redirect("/signed");
        } else {
            next();
        }
    });

    /// routes: ______

    app.get("/", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        res.redirect("/register");
    });
    // REGISTER---

    app.get("/register", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        console.log("req.session.userID:", req.session.userID);
        res.render("register");
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
                            req.session.userName = results.rows[0].first;
                            req.session.userSurname = results.rows[0].last;
                            console.log("req.session:", req.session);
                            res.redirect("/profile");
                        })
                        .catch((err) => {
                            console.log("error in addAccount:", err);
                            res.render("register", {
                                err:
                                    "oops, something went wrong! please try again!",
                            });
                        });
                })
                .catch((err) => {
                    console.log("error in hash:", err);
                    res.render("register", {
                        err: "oops, something went wrong! please try again!",
                    });
                });
        } else {
            console.log("the form is not filled in properly");
            res.render("register", {
                err: "please fill in all the required fields!",
            });
        }
    });
    //// LOG IN---

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
                                            res.redirect("/profile");
                                        } else {
                                            console.log(
                                                "the user has already signed the petition"
                                            );
                                            req.session.sigID =
                                                req.session.userID;

                                            console.log(
                                                "req.session.sigID:",
                                                req.session.sigID
                                            );
                                            res.redirect("/signed");
                                        }
                                    })
                                    .catch((err) => {
                                        console.log("error in sigCheck", err);
                                        res.render("login", {
                                            err:
                                                "oops, something went wrong, please try again!",
                                        });
                                    });
                            } else {
                                console.log("password doesn't match");
                                res.render("login", {
                                    err: "oops! wrong password! try again",
                                });
                            }
                        }
                    );
                })
                .catch((err) => {
                    console.log("error in getHashedPw", err);
                    res.render("login", {
                        err: "oops, something went wrong, please try again!",
                    });
                });
        } else {
            console.log("the form is not filled in properly");
            res.render("login", {
                err: "please fill in all the required fields",
            });
        }
    });
    ///// PROFILE------

    app.get("/profile", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        console.log("req.session.userID:", req.session.userID);

        res.render("profile", {
            name: req.session.userName,
        });
    });

    app.post("/profile", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        if (
            req.body.url.startsWith("http://") ||
            req.body.url.startsWith("https://") ||
            req.body.url == ""
        ) {
            console.log("req.body.age", req.body.age);
            if (!req.body.age) {
                req.body.age = "0";
            }
            db.addProfile(
                req.body.age,
                req.body.city,
                req.body.url,
                req.session.userID
            )
                .then((results) => {
                    console.log(
                        "new profile record added with id:",
                        results.rows[0].id
                    );
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log("error in addProfile:", err);
                    res.render("profile", {
                        name: req.session.userName,
                        err: "oops, something went wrong, please try again!",
                    });
                });
        } else {
            console.log("the url is not valid");
            res.render("profile", {
                name: req.session.userName,
                err: "please enter a valid url",
            });
        }
    });

    /// PETITION--------

    app.get("/petition", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        console.log("req.session.userID:", req.session.userID);

        res.render("petition", {
            name: req.session.userName,
        });
    });

    app.post("/petition", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        console.log("req.session.userName:", req.session.userName);
        if (req.body.signature) {
            db.addSignature(req.body.signature, req.session.userID)
                .then(() => {
                    console.log("new signature added");
                    req.session.sigID = req.session.userID;
                    console.log("req.session.sigID:", req.session.sigID);
                    res.redirect("/signed");
                })
                .catch((err) => {
                    console.log("error in addSignature:", err);
                    res.render("petition", {
                        err: "oops, something went wrong, please try again!",
                    });
                });
        } else {
            console.log("the form is not signed in properly");
            res.render("petition", {
                err: "oops, looks like you didn't sign it! try again please",
                name: req.session.userName,
            });
        }
    });
    ////SIGNED-----

    app.get("/signed", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        db.getCount()
            .then((results) => {
                let count = results.rows[0].count;
                db.getSignature(req.session.userID).then((results) => {
                    res.render("signed", {
                        count: count,
                        signature: results.rows[0].signature,
                        name: req.session.userName,
                    });
                });
            })
            .catch((err) => {
                console.log("err in getCount:", err);
            });
    });
    /// SIGNERS----

    app.get("/signers", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        db.getSigners()
            .then((results) => {
                console.log("List of persons signed:", results.rows);
                let signers = [];
                for (let i = 0; i < results.rows.length; i++) {
                    let fullName = " ";
                    fullName +=
                        results.rows[i].first + " " + results.rows[i].last;
                    signers.push({
                        fullname: fullName,
                        age: results.rows[i].age,
                        city: results.rows[i].upper,
                        url: results.rows[i].url,
                    });
                }
                res.render("signers", {
                    signers: signers,
                });
            })
            .catch((err) => {
                console.log("err in getSigners:", err);
            });
    });

    ///SIGNERS BY CITY---

    app.get("/signers:city", (req, res) => {
        console.log(`ran ${req.method} at ${req.url} route`);
        console.log("req.params.city: ", req.params.city.slice(1));
        db.getSignersByCity(req.params.city.slice(1))
            .then((results) => {
                console.log(
                    "List of persons signed in this city:",
                    results.rows
                );
                let signers = [];
                for (let i = 0; i < results.rows.length; i++) {
                    let fullName = " ";
                    fullName +=
                        results.rows[i].first + " " + results.rows[i].last;
                    signers.push({
                        fullname: fullName,
                        age: results.rows[i].age,
                        url: results.rows[i].url,
                    });
                }
                res.render("signers", {
                    signers: signers,
                    cityselected: req.params.city.slice(1).toUpperCase(),
                });
            })
            .catch((err) => {
                console.log("err in getSigners:", err);
            });
    });

    app.listen(process.env.PORT || 8080, () =>
        console.log("server is listening...")
    );
})();
