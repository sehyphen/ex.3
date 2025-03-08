const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const port = 3000;

// הגדרת EJS כמנוע תבניות
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// הגדרת תיקיות סטטיות
app.use(express.static("public"));

// חיבור למסד הנתונים SQLite
const db = new sqlite3.Database("./db/rtfilms.db", sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

// נתיב ראשי שמציג סרט לפי שאילתת URL
app.get("/", (req, res) => {
    const movieTitle = req.query.title;
    if (!movieTitle) {
        return res.send("Missing movie title parameter");
    }

    // שליפת נתוני הסרט מהמסד
    const query = `SELECT * FROM movies WHERE code = ?`;
    db.get(query, [movieTitle], (err, movie) => {
        if (err) {
            return res.status(500).send("Database error");
        }
        if (!movie) {
            return res.status(404).send("Movie not found");
        }

        // שליפת הביקורות
        const reviewQuery = `SELECT * FROM reviews WHERE movie_code = ?`;
        db.all(reviewQuery, [movieTitle], (err, reviews) => {
            if (err) {
                return res.status(500).send("Database error");
            }
            
            res.render("movie", { movie, reviews });
        });
    });
});

// הפעלת השרת
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
