const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors()); // Allow cross-origin requests from any domain
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', (error) => console.error('Error connecting to MongoDB:', error));
db.once('open', () => console.log('Connected to MongoDB database'));

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

const UserModel = mongoose.model('User', UserSchema);

const secretKey = process.env.JWT_SECRET_KEY;

// Login route
app.post('/api/login', async (req, res) => {
  const { username, password} = req.body;

  console.log(`Received login request for username "${username}" and password "${password}"`);

  // Check if the username and password are valid
  const user = await UserModel.findOne({ username, password });
  if (!user) {
    res.status(401).send('Invalid username or password');
    return;
  }

  // Generate a JWT token and send it back to the client
  const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
  res.send(token);
});

// Register route
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;

  // Check if the username is already taken
  const existingUser = await UserModel.findOne({ username });
  if (existingUser) {
    res.status(409).send('Username already taken');
    return;
  }

  // Create a new user
  const newUser = new UserModel({ username, password, role });
  await newUser.save();

  res.send('User created successfully');
});

// Protected route
app.get('/api/protected', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send('Authorization header missing');
    return;
  }

  // Get the JWT token from the Authorization header
  const token = authHeader.split(' ')[1];

  // Verify the JWT token
  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) {
      res.status(401).send('Invalid token');
      return;
    }

    // Get the user ID from the decoded JWT token
    const userId = decoded.userId;

    // Check if the user exists in the database
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(401).send('Invalid token');
      return;
    }

    // Send the protected resource
    res.send('Protected resource');
  });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
