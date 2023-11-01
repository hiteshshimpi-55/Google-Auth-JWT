const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { default: axios } = require("axios");

require("dotenv").config();
app.use(cors());

app.get("/auth/google", async (req, res) => {
  const code = req.query.code;
  try {
    const { id_token, access_token } = await googleOAuthHandler(code);
    console.log({ id_token, access_token });
    const googleUser = await getGoogleUser(id_token, access_token);
    console.log({ googleUser });

    // Generate JWT tokens (access token and refresh token)
    const accessToken = jwt.sign({ user: googleUser }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '15m', // Adjust the expiration time as needed
    });

    const refreshToken = jwt.sign({ user: googleUser }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: '30d', // Adjust the expiration time as needed
    });

    // You can send the tokens as a response or handle them as needed
    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.log("Failed to authenticate: " + error.message);
    // Handle the error and possibly redirect to an error page.
  }
});

app.listen(3030, () => {
  console.log("Listening to port 3030...");
});

async function googleOAuthHandler(code) {
  const url = "https://oauth2.googleapis.com/token";
  const data = `code=${encodeURIComponent(code)}&client_id=${process.env.GOOGLE_AUTH_CLIENT_ID}&client_secret=${process.env.GOOGLE_AUTH_CLIENT_SECRET}&redirect_uri=http://localhost:3030/auth/google&grant_type=authorization_code`;

  try {
    const res = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return res.data;
  } catch (error) {
    console.log("Failed to fetch data: " + error.message);
    throw error;
  }
}

async function getGoogleUser(id_token, access_token) {
  try {
    const res = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log("Failed to fetch user info: " + error.message);
    throw error;
  }
}
