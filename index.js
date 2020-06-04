const express = require("express");
const app = express();
const db = require("./db");
var cookieSession = require("cookie-session");
// const cookieParser = require("cookie-parser");

// app.use(
//     cookieSession({
//         secret: secret,
//         maxAge: 1000 * 60 * 60 * 24 * 14,
//     })
// );

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

///
app.use(express.static("./public"));

///

// app.use((req, res, next) => {
//     console.log("middleware running");
//     console.log(`ran ${req.method} at ${req.url} route`);
//     if (!req.cookies.petSigned && req.url != "/petition") {
//         res.redirect("/petition");
//     } else {
//         next();
//     }
// });

app.get("/petition", (req, res) => {
    res.render("petition");
});

app.post("/petition", (req, res) => {
    // res.cookie("petSigned", true);
    db.addName(req.body.first, req.body.last, req.body.signature)
        .then(() => {
            console.log("new record added");
            res.redirect("/signed");
        })
        .catch((err) => {
            console.log("error in addName:", err);
        });
});

app.get("/signed", (req, res) => {
    db.getCount()
        .then((results) => {
            res.render("signed", results);
        })
        .catch((err) => {
            console.log("err in getCount:", err);
        });
});

app.get("/signers", (req, res) => {
    db.getNames()
        .then((results) => {
            console.log("results:", results);
        })
        .catch((err) => {
            console.log("err in getNames:", err);
        });
});

app.listen(8080, () => console.log("server is listening..."));
