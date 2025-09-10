// Import the express app
const app = require('./app');

// Define the port to run the server on
const PORT = process.env.PORT || 5000;

// Start the server and listen for requests
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
