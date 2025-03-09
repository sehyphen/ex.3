const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

// Middleware to serve static files
app.use(express.static('public'));

// Route to handle movie requests
app.get('/', (req, res) => {
    let movie = req.query.title;
    if (!movie) {
        return res.status(400).send("Missing movie title");
    }
    
    let dbPath = path.join(__dirname, 'db', 'rtfilms.db');
    let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

    db.get("SELECT title, rating, poster FROM movies WHERE code = ?", [movie], (err, row) => {
        if (err) {
            res.status(500).send("Database error");
            return;
        }
        if (!row) {
            res.status(404).send("Movie not found");
            return;
        }
        
        db.all("SELECT reviewer, review_text, rating FROM reviews WHERE movie_code = ?", [movie], (err, reviews) => {
            if (err) {
                res.status(500).send("Database error");
                return;
            }
            
            let freshImage = row.rating >= 60 ? "freshbig.png" : "rottenbig.png";
            let posterPath = `${movie}/poster.png`;
            
            let reviewHtml = reviews.map((r, i) => {
                let img = r.rating === "FRESH" ? "fresh.gif" : "rotten.gif";
                return `<div class="review"><img src="${img}" alt="Rating"> <p><strong>${r.reviewer}</strong>: ${r.review_text}</p></div>`;
            });
            
            let leftReviews = reviewHtml.slice(0, Math.ceil(reviewHtml.length / 2)).join('');
            let rightReviews = reviewHtml.slice(Math.ceil(reviewHtml.length / 2)).join('');
            
            res.send(`
                <html>
                <head>
                    <title>Tomatoes Rancid</title>
                    <link rel="stylesheet" href="styles.css">
                </head>
                <body>
                    <h1>${row.title}</h1>
                    <img src="${posterPath}" alt="Poster">
                    <img src="${freshImage}" alt="Freshness">
                    <div class="reviews-container">
                        <div class="reviews left">${leftReviews}</div>
                        <div class="reviews right">${rightReviews}</div>
                    </div>
                    <footer>${reviews.length} of ${reviews.length - 1}</footer>
                </body>
                </html>
            `);
        });
    });

    db.close();
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
