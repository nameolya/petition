(function () {
    const express = require("express");
    const app = express();
    const db = require("./db");
    var cookieSession = require("cookie-session");
    const { secret } = require("./secrets.json");
    const csurf = require("csurf");

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
        console.log("req.session:", req.session);
        res.redirect("/petition");
    });

    app.get("/petition", (req, res) => {
        res.render("petition");
    });

    app.post("/petition", (req, res) => {
        if ((req.body.first, req.body.last, req.body.signature)) {
            db.addName(req.body.first, req.body.last, req.body.signature)
                .then(() => {
                    console.log("first, last:", req.body.first, req.body.last);
                    console.log("new record added");
                    req.session.sigID = response.rows[0].id;
                    console.log("req.session.sigID:", req.session.sigID);
                    res.redirect("/signed");
                })
                .catch((err) => {
                    console.log("error in addName:", err);
                });
        } else {
            res.redirect("/petition");
        }
    });

    app.get("/signed", (req, res) => {
        if (req.session.sigID) {
            db.getCountSignature()
                .then((results) => {
                    console.log("Total Signed:", results);
                    res.render("signed", {
                        count: results.rows[0].count,
                        signature: results.rows[0].signature,
                    });
                })
                .catch((err) => {
                    console.log("err in getCount:", err);
                });
        } else {
            console.log("/signed: out of cookie-session redirect");
            res.redirect("/petition");
        }
    });

    app.get("/signers", (req, res) => {
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
            res.redirect("/petition");
        }
    });

    app.listen(8080, () => console.log("server is listening..."));
})();
