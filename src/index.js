require("dotenv").config();
import mongoose from 'mongoose';
import { DB_NAME} from "./constants";
import connectDB from './db/index.js';
connectDB()







/*import express from 'express';
const app = express();
( async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error",(error)=>{
       console.log("Error:" , error);
       throw error
    })
    app.listen(process.env.PORT , () =>{
        console.log(`server is running on port : ${process.env.PORT}`)
    })
  } catch (error) {
    console.log("Error:",error)
    throw error
  }
})()
*/