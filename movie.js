const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 4000;

// קביעת הנתיב למסד הנתונים
let dbPath = path.join(__dirname, 'db', 'rtfilms.db');

// Middleware לשירות קבצים סטטיים (לשירות HTML, CSS, תמונות וכו')
app.use(express.static('public'));

// נתיב ראשי להצגת דף הבית
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// נתיב לחיפוש סרטים
app.get('/movie', (req, res) => {
    let movie = req.query.title;
    
    if (!movie) {
        return res.sendFile(path.join(__dirname, 'public', 'error.html'));
    }

    const normalizedMovie = movie.toLowerCase().replace(/\s+/g, "");

    let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error("Error opening database:", err.message);
            return res.status(500).send("Database connection error.");
        }
    });

    db.get("SELECT * FROM FILMS WHERE LOWER(REPLACE(title, ' ', '')) = ?", [normalizedMovie], (err, row) => {
        if (err) {
            console.error("Error querying database:", err.message);
            db.close();
            return res.status(500).send("Database query error.");
        }

        if (!row) {
            db.close();
            return res.sendFile(path.join(__dirname, 'public', 'error.html'));
        }

        db.all("SELECT * FROM REVIEWS WHERE FILMCODE = ?", [row.FILMCODE], (err, reviews) => {
            if (err) {
                console.error("Error querying reviews:", err.message);
                db.close();
                return res.status(500).send("Error fetching reviews.");
            }

            db.close();

            // יצירת עמוד HTML דינמי
            let htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${row.Title} - Tomatoes Rancid</title>
                    <link rel="stylesheet" href="/movie.css">
                </head>
                <body>
                    <h1>${row.Title} (${row.Year})</h1>
                    <img src="/images/${row.FILMCODE}.jpg" alt="${row.Title} Poster">

                    <p><strong>Director:</strong> ${row.director}</p>
                    <p><strong>Genre:</strong> ${row.genre}</p>
                    <p><strong>Box Office:</strong> $${row.box_office} million</p>

                    <h3>Reviews</h3>
                    <ul>
                        ${reviews.map(review => `
                            <li>
                                <img src="/images/${review.rating === 'FRESH' ? 'fresh.gif' : 'rotten.gif'}" alt="Review">
                                <q>${review.review_text}</q> - ${review.reviewer}, ${review.publication}
                            </li>
                        `).join('')}
                    </ul>
                </body>
                </html>
            `;

            res.send(htmlContent);
        });
    });
});

// הפעלת השרת
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});