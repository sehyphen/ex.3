const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const port = 4000;

// הגדרת מנוע התבניות EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware לשירות קבצים סטטיים
app.use(express.static('public'));

// קביעת הנתיב למסד הנתונים
let dbPath = path.join(__dirname, 'db', 'rtfilms.db');

// חיבור למסד הנתונים
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        process.exit(1);
    }
    console.log("Connected to the database.");
});

// נתיב להצגת מידע על סרטים
app.get('/', (req, res) => {
    let movie = req.query.title;
    
    if (!movie) {
        return res.render('index', { error: "Please provide a movie title." });
    }

    const normalizedMovie = movie.toLowerCase().replace(/\s+/g, "");

    db.get("SELECT * FROM FILMS WHERE LOWER(REPLACE(title, ' ', '')) = ?", [normalizedMovie], (err, row) => {
        if (err) {
            console.error("Error querying database:", err.message);
            return res.render('index', { error: "Database query error" });
        }

        if (!row) {
            return res.render('index', '{ error: No movie found with title: ${movie}}');
        }

        db.all("SELECT * FROM REVIEWS WHERE FILMCODE = ?", [row.FILMCODE], (err, reviews) => {
            if (err) {
                console.error("Error querying reviews:", err.message);
                return res.render('index', { error: "Error fetching reviews" });
            }

            if (!reviews || reviews.length === 0) {
                reviews = [{ review_text: "No reviews available", rating: "FRESH", reviewer: "N/A", publication: "N/A" }];
            }

            let posterPath = default_poster.jpg;
            if (fs.existsSync(path.join(__dirname, 'public', normalizedMovie, 'poster.png'))) {
                posterPath = '${normalizedMovie}/poster.png';
            } else if (fs.existsSync(path.join(__dirname, 'public', normalizedMovie, 'poster.jpg'))) {
                posterPath =' ${normalizedMovie}/poster.jpg';
            }

            res.render('movie', { movie: row, reviews, posterPath });
        });
    });
});

// הפעלת השרת
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// סגירת החיבור למסד הנתונים כאשר השרת נסגר
process.on('SIGINT', () => {
    console.log("\nClosing database connection...");
    db.close((err) => {
        if (err) {
            console.error("Error closing database:", err.message);
        } else {
            console.log("Database connection closed.");
        }
        process.exit(0);
    });
});