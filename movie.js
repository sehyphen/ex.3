const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const port = 4000;

// קביעת הנתיב למסד הנתונים
let dbPath = path.join(__dirname, 'db', 'rtfilms.db');

// Middleware לשירות קבצים סטטיים
app.use(express.static('public'));

// חיבור למסד הנתונים
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        process.exit(1);
    }
    console.log("Connected to the database.");

    // בדיקת חיבור וטעינת טבלאות
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error("Error retrieving tables:", err.message);
        } else {
            console.log("Tables in database:", tables);
        }
    });
});

// נתיב ראשי להצגת מידע על סרטים
app.get('/', (req, res) => {
    let movie = req.query.title;
    
    console.log("Movie title from query:", movie);

    if (!movie) {
        return res.send(`
            <html>
            <head><title>Welcome to Tomatoes Rancid</title></head>
            <body>
                <h1>Welcome to Tomatoes Rancid</h1>
                <p>Please provide a movie title in the URL, e.g., <a href="?title=ThePrincessBride">Click here for The Princess Bride</a></p>
            </body>
            </html>
        `);
    }

    // התאמת שם הסרט לצורך השוואה
    const normalizedMovie = movie.toLowerCase().replace(/\s+/g, "");

    db.get("SELECT * FROM FILMS WHERE LOWER(REPLACE(title, ' ', '')) = ?", [normalizedMovie], (err, row) => {
        if (err) {
            console.error("Error querying database:", err.message);
            res.status(500).send("Database query error");
            return;
        }

        if (!row) {
            console.log("No movie found with title: ${movie}");
            return res.send(`
                <html>
                <head><title>Movie Not Found</title></head>
                <body>
                    <h1>Movie Not Found</h1>
                    <p>We couldn't find the movie "${movie}". Please try another title.</p>
                </body>
                </html>
            `);
        }

        console.log("Movie data:", row);

        db.all("SELECT * FROM REVIEWS WHERE FILMCODE = ?", [row.FILMCODE], (err, reviews) => {
            if (err) {
                console.error("Error querying reviews:", err.message);
                res.status(500).send("Error fetching reviews");
                return;
            }

            if (!reviews || reviews.length === 0) {
                console.log("No reviews found for movie:", row.Title);
                reviews = [{ review_text: "No reviews available", rating: "FRESH", reviewer: "N/A", publication: "N/A" }];
            }

            const starring = row.starring ? row.starring.split(',').join('<br>') : 'N/A';
            const genre = row.genre ? row.genre.split(',').join(', ') : 'N/A';

            let links = [];
            if (row.links && typeof row.links === "string") {
                try {
                    links = JSON.parse(row.links);
                } catch (e) {
                    console.error("Error parsing JSON in links:", e.message);
                }
            }

            // חיפוש תמונת פוסטר
            let posterPath = "default_poster.jpg"; // תמונה ברירת מחדל
            if (fs.existsSync(path.join(__dirname, 'public', normalizedMovie, 'poster.png'))) {
                posterPath = "${normalizedMovie}/poster.png";
            } else if (fs.existsSync(path.join(__dirname, 'public', normalizedMovie, 'poster.jpg'))) {
                posterPath = "${normalizedMovie}/poster.jpg";
            }

            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${row.Title} - Tomatoes Rancid</title>
                    <link href="/movie.css" type="text/css" rel="stylesheet">
                    <link href="/images/rotten.gif" type="image/gif" rel="shortcut icon" />
                </head>
                <body>
                    <h1>${row.Title} (${row.Year})</h1>
                    <img src="/${posterPath}" alt="Movie Poster">
                    <p><strong>Director:</strong> ${row.director}</p>
                    <p><strong>Starring:</strong> ${starring}</p>
                    <p><strong>Rating:</strong> ${row.mpaa_rating}</p>
                    <p><strong>Release Date:</strong> ${row.release_date}</p>
                    <p><strong>Synopsis:</strong> ${row.synopsis}</p>
                    <p><strong>Runtime:</strong> ${row.runtime} mins</p>
                    <p><strong>Genre:</strong> ${genre}</p>
                    <p><strong>Box Office:</strong> $${row.box_office} million</p>
                    
                    <h3>Reviews</h3>
                    <ul>
                        ${reviews.map(review => `
                            <li>
                                <img src="/images/${review.rating === 'FRESH' ? 'fresh.gif' : 'rotten.gif'}" alt="Review" />
                                <q>${review.review_text}</q> - ${review.reviewer}, ${review.publication}
                            </li>
                        `).join('')}
                    </ul>
                    
                    <h3>Links</h3>
                    <ul>
                    ${links.map(link => <li><a href="${link.url}" target="_blank">${link.text}</a></li>).join('')}
                    </ul>
                </body>
                </html>
            `);
        });
    });
});

// הפעלת השרת
app.listen(port, () => {
    console.log("Server running on http://localhost:${port}");
    console.log("Trying to open DB at:", dbPath);
});