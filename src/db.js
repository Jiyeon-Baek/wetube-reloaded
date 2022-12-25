import mongoose from "mongoose";

mongoose.connect(process.env.DB_URL, {
  //useNewUrlParser: true,
  //useUnifiedTopology: true,
}); //specify folder name

const db = mongoose.connection;

const handleOpen = () => console.log("Connected to DB ♣");
const handleError = () => console.log("DB Error : ");
db.on("error", handleError);
db.once("open", handleOpen);
