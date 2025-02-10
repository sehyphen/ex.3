const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

// חיבור למסד הנתונים
const db = new sqlite3.Database('./rtfilms.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

app.get('/', (req, res) => {
    let movieTitle = req.query.title; // שינוי שם המשתנה למניעת התנגשות

    if (!movieTitle) {
        return res.status(400).send('Missing movie title');
    }

    const moviePath = path.join(__dirname, 'moviefiles2025', movieTitle);
    const posterPath = `/moviefiles2025/${movieTitle}/poster.png`; // תיקון נתיב לתמונה

    db.get("SELECT * FROM movies WHERE code = ?", [movieTitle], (err, movieData) => {
        if (err) {
            console.error('Error fetching movie:', err.message);
            return res.status(500).send('Internal Server Error');
        }

        if (!movieData) {
            return res.status(404).send('Movie not found');
        }

        db.all("SELECT * FROM reviews WHERE movie_code = ?", [movieTitle], (err, reviews) => {
            if (err) {
                console.error('Error fetching reviews:', err.message);
                return res.status(500).send('Error retrieving reviews');
            }

            res.render('movie', { movie: movieData, reviews, posterPath });
        });
    });
});

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
