const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Example API route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Tampa Mixtape API!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
