import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js'
import { upload } from '../middlewares/multer.middleware.js';
import {uploadOnCloudinary} from '../utils/cloudinay.js';
import { ApiResponse } from '../utils/ApiResponse.js';
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
   const {fullname,username,email,password} = req.body;
  //  console.log(username,email)
   if ( 
     [fullname,username,email,password].some(field => field?.trim() === "")
   ){
    throw new ApiError(400,"All fields are required")
   }
   
  const existedUser = await User.findOne({
    $or : [{username},{email}]
   })
   if (existedUser){
    throw new ApiError(409,"User already exists")
   }
   const avatarLocalPath = req.files?.avatar[0]?.path;
   let coverImgLocalPath ;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImgLocalPath = req.files?.coverImage[0]?.path;
   }
   if(!avatarLocalPath){
     throw new ApiError(400, "Avatar file is required " )
   }
   const avatar = await  uploadOnCloudinary(avatarLocalPath);
   const coverImage = coverImgLocalPath ? await uploadOnCloudinary(coverImgLocalPath) : null;
   if(!avatar){
   throw new ApiError(400,'Avatar file is required')
   }

  const user = await User.create({
    fullname,
    avatar : avatar.url,
    coverimg : coverImage?.url || '',
    email,
    password,
    username : username.toLowerCase()
   })
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    )
    if(!createdUser){
      throw new ApiError(500,'Something went wrong while registering user')
    }
    return res.status(201).json(
      new ApiResponse(200,createdUser, 'User Registered Successfully')
    )
})
export default registerUser