import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js'
import { upload } from '../middlewares/multer.middleware.js';
import {uploadOnCloudinary} from '../utils/cloudinay.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken'
const generateAccessandRefreshToken = async(userId)=>{
  try{
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken()
     
    user.refreshToken = RefreshToken;
    await user.save({validateBeforeSave : false})
     return {AccessToken, RefreshToken}
  } catch (err) {
     throw new ApiError(500, 'something went wrong will generating refresh and access token')
  }
}
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
const loginUser = asyncHandler(async(req,res) => {
    // req body
    // username or email
    // find the user
    // password check
    // access & refresh token
    // send cookie
    const {email,username,password} = req.body
    if (!username && !email){
      throw new ApiError(400, ' username or email is required')
    }
    const user = await User.findOne({
      $or : [{username}, {email}]
    })
    if (!user){
     throw new ApiError(404 , " user doesn't exist")
    }
    const isPassword = await user.isPasswordCorrect(password);
      if (!isPassword){
     throw new ApiError(404 , "Invalid user creditials")
    }

    const {AccessToken, RefreshToken} = await generateAccessandRefreshToken(user._id);
     console.log("AccessToken : ",AccessToken)
     console.log("RefreshToken : ",RefreshToken)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
      httpOnly : true,
      secure : true
    }
    return res
    .status(200)
    .cookie("accessToken" , AccessToken , options)
    .cookie("refreshToken" , RefreshToken , options)
    .json(
      new ApiResponse(
        200,
        {
          user : loggedInUser,AccessToken,RefreshToken
        },
        "User logged In successfully"
      )
    )
})

const logoutUser = asyncHandler(async (req,res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set : {
        refreshToken : undefined
      }
    }
  )
      const options = {
      httpOnly : true,
      secure : true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200 , {} , "User Logged Out"))
})
const refreshAccessToken = asyncHandler(async ( req,res)=>{
  try {
    const incomingRefreshToken = req.cookies.RefreshToken || req.body.RefreshToken;
    if(!incomingRefreshToken){
      throw new ApiError(401 , "unauthorized request")
    }
    const decodedToken = jwt.verify(   // verify that both the tokens match or not
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id); // decoded token is verified it would return the payload(data)
     if(!user){
       throw new ApiError(401,'Invalid refresh token')
     }
     if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, 'Refresh token is expired')
     }
        const options = {
        httpOnly : true,
        secure : true
      }
     const {accessToken,refreshToken} = await  generateAccessandRefreshToken(user._id)
      return res
      .status(200)
      .cookie("accessToken",accessToken, options)
      .cookie("refreshToken",refreshToken ,options)
      .json(
        new ApiResponse(
          200,
          {accessToken,refreshToken: refreshToken},
          "Access token is refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }
})

export {registerUser,loginUser,logoutUser,refreshAccessToken}