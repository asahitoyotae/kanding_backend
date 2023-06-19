const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();

//Enable CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "https://kanding-001-p8u3.vercel.app"],
  })
);

//Connect to MongoDB
dotenv.config();
mongoose.connect(process.env.DATABASE_CONNECT);

//API endpoints
const authRoutes = require("./user_auth/auth");
const chatCompletion = require("./chatCompletion/completion");

//Middleware
app.use(express.json());

//Routes Middleware
app.use("/api/users", authRoutes);
app.use("/api/chat", chatCompletion);

app.listen(8000, () => console.log("Server is live on http://localhost:8000"));
