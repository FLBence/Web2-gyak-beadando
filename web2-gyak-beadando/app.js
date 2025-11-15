const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const expressLayouts = require("express-ejs-layouts");

const app = express();

// Template engine
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

// Static assets (Dimension theme)
app.use("/assets", express.static("assets"));

app.use(bodyParser.urlencoded({ extended: true }));

// Session settings
app.use(session({
    secret: "nagyon_titkos_kulcs",
    resave: false,
    saveUninitialized: true
}));

// Simple in-memory user database (beadandóhoz bőven elég)
let users = [
    { username: "admin", password: "admin", role: "admin" },
    { username: "teszt", password: "teszt", role: "user" }
];

// Middleware – login required
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

// Middleware – admin required
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== "admin")
        return res.status(403).send("Nincs jogosultságod!");
    next();
}

/* ===========================
    ROUTES
=========================== */

// Főoldal
app.get("/", (req, res) => {
    res.render("index", {
        user: req.session.user,
        page: "index",
        });
});

// Regisztráció
app.get("/register", (req, res) => {
    res.render("register", {
        user: req.session.user,
        page: "register"
    });
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    // új felhasználó létrehozása
    users.push({
        username,
        password,
        role: "user"
    });

    // automatikus bejelentkezés
    req.session.user = {
        username,
        role: "user"
    };

    res.redirect("/");
});

// Bejelentkezés
app.get("/login", (req, res) => {
    res.render("login", {
        user: req.session.user,
        page: "login"
    });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const found = users.find(u =>
        u.username === username && u.password === password
    );

    if (!found) {
        return res.send("Hibás felhasználónév vagy jelszó!");
    }

    req.session.user = {
        username: found.username,
        role: found.role
    };

    res.redirect("/");
});

// Kijelentkezés
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// Üzenetek (csak bejelentkezve)
app.get("/uzenetek", requireLogin, (req, res) => {
    res.render("uzenetek", {
        user: req.session.user
    });
});

// Admin oldal (csak adminnak)
app.get("/admin", requireAdmin, (req, res) => {
    res.render("admin", {
        user: req.session.user,
        users
    });
});
//Adatbázis oldal
app.get("/adatbazis", (req, res) => {
    res.render("adatbazis", {
        user: req.session.user,
        page: "adatbazis"
    });
});
//kapcsolat oldal
app.get("/kapcsolat", (req, res) => {
    res.render("kapcsolat", {
        user: req.session.user,
        page: "kapcsolat"
    });
});
//CRUD fül
app.get("/crud", (req, res) => {
    res.render("crud", {
        user: req.session.user,
        page: "crud"
    });
});
// Server indítása
app.listen(3000, () =>
    console.log("Szerver fut: http://localhost:3000")
);
