const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/movies', express.static('movies'));

const db = new sqlite3.Database('rtfilms.db');

// Promisify database functions
const getFilm = (title) => {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT FilmCode, Title, Year, Score 
            FROM Films 
            WHERE Title = ?
        `, [title], (err, film) => {
            if (err || !film) reject('Movie not found');
            resolve(film);
        });
    });
};

const getFilmDetails = (code) => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT Attribute, Value 
            FROM FilmDetails 
            WHERE FilmCode = ?
        `, [code], (err, details) => {
            if (err) reject(err);
            resolve(details);
        });
    });
};

const getReviews = (code) => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT ReviewerName, Affiliation, ReviewText, Rating 
            FROM Reviews 
            WHERE FilmCode = ?
        `, [code], (err, reviews) => {
            if (err) reject(err);
            resolve(reviews);
        });
    });
};

app.get('/', async (req, res) => {
    try {
        const title = req.query.title;
        if (!title) return res.status(400).send('Missing title parameter');

        const film = await getFilm(title);
        const details = await getFilmDetails(film.FilmCode);
        const reviews = await getReviews(film.FilmCode);

        const movie = {
            code: film.FilmCode,
            name: film.Title,
            year: film.Year,
            rating: film.Score,
            genre: '',
            runtime: '',
            starring: ''
        };

        details.forEach(({Attribute, Value}) => {
            movie[Attribute.toLowerCase()] = Value;
        });

        const formattedReviews = reviews.map(review => ({
            critic_name: review.ReviewerName,
            publication: review.Affiliation,
            text: review.ReviewText,
            rating: review.Rating >= 60 ? 'FRESH' : 'ROTTEN'
        }));

        res.render('movie', { movie, reviews: formattedReviews });
    } catch (error) {
        res.status(404).send(error);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
app.get('/test', (req, res) => {
    res.send('Server is working!');
  });