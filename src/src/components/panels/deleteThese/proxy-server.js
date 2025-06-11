const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.post('/api/token', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', 'user8');
    params.append('password', 'User8?');
    params.append('scope', '');
    params.append('client_id', 'string');
    params.append('client_secret', 'string');

    const response = await axios.post(
      'https://meta-test.rasa.capital/mock-api/token',
      params,
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(4000, () => {
  console.log('Proxy server running on http://localhost:4000');
});