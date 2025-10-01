import {asyncHandler} from '../utils/asyncHandler.js'
const registerUser = asyncHandler( async (req , res) => {
   // get user data from frontend
   // validation
   // check if user already exists
   // check for img
   // upload them to cloudinary, avatar
   // create user object 
   // remove pwd and refresh token
   // check user creation
   // return res 
   const {username,email} =req.body;
   console.log(username,email)
})
export default registerUser