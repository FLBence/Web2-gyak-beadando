const express = require("express");
const fs = require('fs');
const path = require('path');
const session = require("express-session");
const bodyParser = require("body-parser");
const expressLayouts = require("express-ejs-layouts");

const app = express();
const db = require("./db");

// Template engine
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

// Static assets (Dimension theme)
app.use("/assets", express.static("assets"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
const DATA_FILE = path.join(__dirname, 'users.json');
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}
// Session settings
app.use(session({
    secret: "nagyon_titkos_kulcs",
    resave: false,
    saveUninitialized: true
}));

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

//ADATBÁZIS
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

app.get('/adatbazis', (req, res) => {

    const pilotakQuery = "SELECT * FROM pilota";
    const gpQuery = "SELECT * FROM gp";
    const eredQuery = "SELECT * FROM eredmeny";

    db.query(pilotakQuery, (err, pilotak) => {
        if (err) throw err;

        db.query(gpQuery, (err, gp) => {
            if (err) throw err;

            db.query(eredQuery, (err, eredmeny) => {
                if (err) throw err;

                pilotak.forEach(p => p.szuldat = formatDate(p.szuldat));
                gp.forEach(g => g.datum = formatDate(g.datum));
                eredmeny.forEach(e => e.datum = formatDate(e.datum));

                res.render('adatbazis', {
                    pilotak,
                    gp,
                    eredmeny,
                    user: req.session.user,
                    page: 'adatbazis'
                });
            });
        });
    });
});


/* ===========================
    ROUTES
=========================== */

//kapcsolat
app.post('/kapcsolat', (req, res) => {
    const { nev, email, uzenet } = req.body;

    const sql = "INSERT INTO uzenetek (nev, email, uzenet) VALUES (?, ?, ?)";

    db.query(sql, [nev, email, uzenet], (err) => {
        if (err) throw err;

        res.redirect('/uzenetek');
    });
});

//Üzenetek
app.get('/uzenetek', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const sql = "SELECT * FROM uzenetek ORDER BY kuldve DESC";

    db.query(sql, (err, rows) => {
        if (err) throw err;

        res.render('uzenetek', {
            uzenetek: rows,
            user: req.session.user
        });
    });
});

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
    console.log("Bejövő POST:", req.body);

    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(DATA_FILE));

    const newUser = {
        id: Date.now(),
        username,
        password,
        role: "user"
    };

    users.push(newUser);
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));

    console.log("Mentve JSON-be!");

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

    const users = JSON.parse(fs.readFileSync(DATA_FILE));
    const user = users.find(
        u => u.username === username && u.password === password
    );
    if (!user) {
        return res.status(401).send("Hibás felhasználónév vagy jelszó!");
    }
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
