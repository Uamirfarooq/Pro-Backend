import dotenv from "dotenv";
dotenv.config({
  path: "./env",
});
import DB_connect from "./db/index.js";
import app from "./app.js";
import home from "./controllers/home.js";
import jokesApi from "./controllers/jokes.js";

DB_connect().then(() => {
    app.get("/", home);
    app.get("/api/jokes", jokesApi);
    app.listen(process.env.PORT, () => {
      console.log(`your App is Runnig At PORT  ${process.env.PORT}`);
    });
  })
  .catch((err) => {});

// import dotenv from "dotenv"
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";

// dotenv.config();

// require ('dotenv').config({
//     path: './env'
// })

// function database() {
//     try {
//         const connectionInstance = mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
//         console.log(`\n Database Connected and Connection Host is : ${connectionInstance}`);

//     } catch (error) {
//         console.log("MongoDB connection Error : ", error );
//         process.exit(1)
//     }
// }

// database()

// ( async () => {
//     try {
//         const connectionInstance = await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
//          console.log(`\n Database Connected and Connection Host is : ${connectionInstance}`);
//     } catch (error) {
//         console.log("MongoDB connection Error : ", error );
//         process.exit(1)
//     }
// })()
