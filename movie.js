const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 4000;

// Set database path outside the route so it's accessible everywhere
let dbPath = path.join(__dirname, 'db', 'rtfilms.db');

// Middleware to serve static files
app.use(express.static('public'));

// Open the database outside the route
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        process.exit(1); // Exit the application if DB connection fails
    }
    console.log("Connected to the database.");
});

// Route to handle movie requests
app.get('/', (req, res) => {
    let movie = req.query.title;
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

    // Normalize movie title for matching
    const normalizedMovie = movie.toLowerCase().replace(/\s+/g, "");

    // Get movie data and reviews in a single query
    db.get("SELECT * FROM FILMS WHERE LOWER(REPLACE(title, ' ', '')) = ?", [normalizedMovie], (err, row) => {
        if (err) {
            console.error("Error querying database:", err.message);
            res.status(500).send("Database query error");
            return;
        }

        if (!row) {
            return res.send(`
                <html>
                <head><title>Movie Not Found - Tomatoes Rancid</title></head>
                <body>
                    <h1>Movie Not Found</h1>
                    <p>We couldn't find the movie "${movie}". Please try another title.</p>
                </body>
                </html>
            `);
        }

        // Get movie reviews from REVIEWS table
        db.all("SELECT * FROM REVIEWS WHERE FILMCODE = ?", [row.FILMCODE], (err, reviews) => {
            if (err) {
                console.error("Error querying reviews:", err.message);
                res.status(500).send("Error fetching reviews");
                return;
            }

            // If no reviews found, display a message
            if (!reviews || reviews.length === 0) {
                console.log("No reviews found for movie:", row.title);
                reviews = [{ review_text: "No reviews available", rating: "FRESH", reviewer: "N/A", publication: "N/A" }];
            }

            // Ensure 'starring' and 'genre' are not undefined before splitting
            const starring = row.starring ? row.starring.split(',').join('<br>') : 'N/A';
            const genre = row.genre ? row.genre.split(',').join(', ') : 'N/A';

            // Check if row.links is valid before parsing it as JSON
            let links = [];
            try {
                if (row.links) {
                    links = JSON.parse(row.links);
                }
            } catch (e) {
                console.error("Error parsing links:", e.message);
            }

            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${row.title} - Tomatoes Rancid</title>
                    <link href="/movie.css" type="text/css" rel="stylesheet">
                    <link href="/images/rotten.gif" type="image/gif" rel="shortcut icon" />
                </head>
                <body>
                    <div class="banner">
                        <img src="/images/banner.png" alt="Tomatoes Rancid" />
                    </div>
                    <h1>${row.title} (${row.year})</h1>
                    <div class="container">
                        <div class="rating-section">
                            <div class="rating">
                                <img src="/images/${row.rating >= 60 ? 'freshbig.png' : 'rottenbig.png'}" alt="Rating" />
                                <span>${row.rating}%</span>
                            </div>
                        </div>
                        <div class="content">
                            <div class="left">
                                <div class="reviews-section">
                                    ${reviews.map(review => `
                                        <div class="review">
                                            <div class="review-content">
                                                <img src="/images/${review.rating === 'FRESH' ? 'fresh.gif' : 'rotten.gif'}" alt="Review" />
                                                <q>${review.review_text}</q>
                                            </div>
                                            <div class="review-details">
                                                <img src="/images/critic.gif" alt="Critic" />
                                                <p>${review.reviewer} <br /> ${review.publication}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="right">
                                <div>
                                    <img src="/${normalizedMovie}/poster.png" alt="Movie Poster">
                                </div>
                                <div class="movie-info">
                                    <dl>
                                        <dt>Starring</dt>
                                        <dd>${starring}</dd>
                                        <dt>Director</dt>
                                        <dd>${row.director}</dd>
                                        <dt>Rating</dt>
                                        <dd>${row.mpaa_rating}</dd>
                                        <dt>Theatrical Release</dt>
                                        <dd>${row.release_date}</dd>
                                        <dt>Movie Synopsis</dt>
                                        <dd>${row.synopsis}</dd>
                                        <dt>Runtime</dt>
                                        <dd>${row.runtime} mins</dd>
                                        <dt>Genre</dt>
                                        <dd>${genre}</dd>
                                        <dt>Box Office</dt>
                                        <dd>$${row.box_office} million</dd>
                                        <dt>Links</dt>
                                        <dd>
                                            <ul>
                                                ${links.map(link => `<li><a href="${link.url}" target="_blank">${link.text}</a></li>`).join('')}
                                            </ul>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div class="footer">
                            (1-${reviews.length} of ${reviews.length})
                        </div>
                    </div>
                </body>
                </html>
            `);
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log("Trying to open DB at:", dbPath);
});
