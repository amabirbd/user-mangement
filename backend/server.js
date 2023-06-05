const path = require("path");
const express = require("express");
const colors = require("colors");
const dotenv = require("dotenv").config();
const cors = require("cors");

const session = require("express-session");
const csurf = require("csurf");
const cookieParser = require("cookie-parser");

const { errorHandler } = require("./middleware/errorMiddleware");
// const connectDB = require("./config/db");
const port = process.env.PORT || 5000;

// connectDB();

const app = express();

//session
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(cookieParser());
app.use(csurf({ cookie: true }));

// Set CSRF token in a cookie
app.use(csurf({ cookie: { key: "_csrf", sameSite: true } }));

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.json("Hello from backend"));

app.use("/api/users", require("./routes/userRoutes"));

app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));
