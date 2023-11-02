import { MongoClient } from "mongodb";

const state = {
  db: null,
};

export async function connectToDatabase() {
  // Connection URL
  const url = "mongodb://127.0.0.1:27017";
  const dbName = "SE";
  const client = new MongoClient(url);
  try {
    // Use connect method to connect to the server
    await client.connect();
    console.log("Connected successfully to server");
    state.db = client.db(dbName);
    return true;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return false;
  }
}

export function getDb() {
  return state.db;
}
