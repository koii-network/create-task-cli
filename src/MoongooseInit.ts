import mongoose from "mongoose";

export default async function initialize(): Promise<mongoose.Connection> {
  console.log(
    "Connecting to Database",
    process.env.MONGO_CONNECTION_STRING || ""
  );
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING || "");
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function () {
    // we're connected!
    console.log("Connected To Database");
  });
  return db;
}
