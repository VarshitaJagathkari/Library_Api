const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// Middleware for parsing JSON
app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'varshita', // Replace with your MySQL username
  password: 'password', // Replace with your MySQL password
  database: 'library', // Replace with your desired database name
});

// Create a 'books' table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    author VARCHAR(255)
  )
`);

// Retrieve all books
app.get('/api/books', (req, res) => {
  db.query('SELECT * FROM books', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ books: results });
    }
  });
});

// Add a new book
app.post('/api/books', (req, res) => {
  const newBook = req.body;
  // Validation: Check if 'title' and 'author' are present in the request body
  if (!newBook.title || !newBook.author) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  // Check for duplicate entry based on title and author
  db.query('SELECT * FROM books WHERE title = ? AND author = ?', [newBook.title, newBook.author], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length > 0) {
      return res.status(409).json({ error: 'Duplicate book entry' });
    }

    // Insert the new book into the database
    db.query('INSERT INTO books (title, author) VALUES (?, ?)', [newBook.title, newBook.author], (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json({ message: 'Book added successfully', book: newBook });
      }
    });
  });
});

// Update book details
app.put('/api/books/:id', (req, res) => {
  const bookId = req.params.id;
  const updatedBook = req.body;

  // Validation: Check if 'title' or 'author' is present in the request body
  if (!updatedBook.title && !updatedBook.author) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  // Check if the book exists
  db.query('SELECT * FROM books WHERE id = ?', [bookId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Update the book details in the database
    const updateQuery = 'UPDATE books SET title = ?, author = ? WHERE id = ?';
    const updateParams = [
      updatedBook.title || results[0].title,
      updatedBook.author || results[0].author,
      bookId,
    ];

    db.query(updateQuery, updateParams, (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json({ message: 'Book updated successfully', book: { ...results[0], ...updatedBook } });
      }
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});