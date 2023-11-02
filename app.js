import dotenv from "dotenv";
import express from "express";
import userRoute from "./routes/userRoute.js";
import adminRoute from "./routes/adminRoute.js";
import morgan from "morgan";
import path from "path";
import { connectToDatabase } from "./config/connection.js";
import session from "express-session";
import { sessionSecret } from "./config/collection.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static(path.resolve() + "/public/"));

app.use(
  session({
    secret: sessionSecret,
    saveUninitialized: true,
    resave: false,
  })
);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Assuming you have an async function to start your application
export async function startApp() {
  try {
    await connectToDatabase();
    return true;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return false;
  }
}

app.use("/admin", adminRoute);
app.use("/", userRoute);

// Call the async function to start the application
startApp().then((connected) => {
  if (connected) {
    const server = app.listen(port, () => {
      console.log("Server running!");
      console.log(`http://localhost:${port}`);
    });
  } else {
    // Handle the MongoDB connection error here, e.g., gracefully exit the app or return an error response.
    console.error(
      "Application failed to start due to MongoDB connection error."
    );
  }
});
