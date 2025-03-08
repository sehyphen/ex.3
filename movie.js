// Import sqlite3 package
// with .verbose(): more detailed error log. Without .verbose(): less detailed error log. 
const sqlite3 = require('sqlite3').verbose();

// Open the SQLite database (assuming it's in the same directory as the script)
const db = new sqlite3.Database('rtfilms.db', function(err) {
  if (err) {
    console.error('Error opening database: ' + err.message);
    return;
  }
  console.log('Connected to the RTfilms SQLite database.');
});

// Prepare a query 
const query = 'SELECT * FROM films WHERE FilmCode = ? OR Year = ?';

// Prepare the statement
const stmt = db.prepare(query);

  
// the search parameters to be planted in the ? placeholder, the first for filmcode, and second for year
let parameters = ["LOTR2001", "1993"];

// results: the results of the query
stmt.all(parameters, function(err, results) {
  if (err) {
    console.error('Error reading data: ' + err.message);
    return;
  }
  
  // Loop through the results and print FilmCode and Title
  console.log('Films:');
  
  results.forEach(function(row) {
    console.log(row.FilmCode + '\t' + row.Title + '\t' + row.Year);
  });
  
  /**  same as:
  for (let row of results){
    console.log(row.FilmCode + '\t' + row.Title + '\t' + row.Year);
  }
  **/

});

// Finalize the statement after using it
stmt.finalize();
app.listen(3001, () => { // Use a different port
    console.log('Server running on port 3001');
  });
  app.get('/', async (req, res) => { 
    // Code to handle movie details
  });
  
  app.get('/mymovie', (req, res) => {
    res.redirect(`/?title=${req.query.film}`);
  });
  
// Close the database connection after reading the data
db.close(function(err) {
  if (err) {
    console.error('Error closing database: ' + err.message);
    return;
  }
  console.log('Closed the database connection.');
});