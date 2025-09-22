import dotenv from 'dotenv'
import mongoose from 'mongoose';
import connectDB from './db/index.js';
import {app} from "./app.js"
dotenv.config({
  path : './env'
})
connectDB()
.then(()=>{
    app.on("error",(error)=>{
       console.log("Error:" , error);
    })
    const PORT = process.env.PORT || 4001
  app.listen(PORT,()=>{
    console.log("Server is listening at PORT: ", PORT)
  })
})
.catch((err)=>{
  console.log("MONGO_DB connection failed : " , err)
})






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