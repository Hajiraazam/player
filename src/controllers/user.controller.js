import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js'
import { upload } from '../middlewares/multer.middleware.js';
import {uploadOnCloudinary} from '../utils/cloudinay.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';
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
const changeCurrentPassword = asyncHandler(async (req,res) => {
  const {oldPassword , newPassword} = req.body;
   const user = await User.findById(req.user?._id);
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
   if(!isPasswordCorrect){
     throw new ApiError(400, "Invalid Password")
   }
   user.password = newPassword;
   await user.save({validateBeforeSave : false})
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password is modified"))
})
const getCurrentUser = asyncHandler(async(req,res) => {
  return res
  .status(200)
  .json(200,req.user,"current user fetched successfully")
})
const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullname,email} = req.body
  if(!fullname || !email){
   throw new ApiError(400,"All fields are required")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { 
      $set : {
        fullname,
        email,
      }
    },
    {new:true}
    ).select('-password')
  return res.status(200)
  .json(new ApiResponse(200,user,"Account datails updated successfully"))
})
const updateUserAvatar = asyncHandler(async(req,res) => {
   const avatarLocalPath = req.file?.path
   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   if(!avatar.url){
      throw new ApiError(400,"Error while uploading on Avatar")
   }
   const user = await User.findByIdAndUpdate(
    req.user?._id,
    { 
      $set : {
        avatar: avatar.url
      }
    },
    {new:true}
   ).select(("-password"))
   return res
   .status(200)
   .json(
    new ApiResponse(200,user,"Avatar uploaded successfully")
   )
})
const updateUserCover = asyncHandler(async(req,res) => {
   const coverLocalPath = req.file?.path
   if(!coverLocalPath){
    throw new ApiError(400,"Cover Image file is missing")
   }
   const cover = await uploadOnCloudinary(coverLocalPath)
   if(!cover.url){
      throw new ApiError(400,"Error while uploading CoverImage")
   }
   const user = await User.findByIdAndUpdate(
    req.user?._id,
    { 
      $set : {
        cover: cover.url
      }
    },
    {new:true}
   ).select(("-password"))
   return res
   .status(200)
   .json(
    new ApiResponse(200,user,"CoverImage uploaded successfully")
   )
})
const getUserChannelProfile = asyncHandler(async(req,res) => {
   const {username} = req.params
   if(!username?.trim()){
    throw new ApiError(400, "username is missing")
   }
    const channel = await User.aggregate([
      {
        $match:{
          username : username?.toLowerCase()
        }
      },
      {
        $lookup :{
          from : "subscriptions",
          localField : "_id" ,
          foreignField :"channel",
          as:"subscribers"
        } 
      },
            {
        $lookup :{
          from : "subscriptions",
          localField : "_id" ,
          foreignField :"subscriber",
          as:"subscribedTo"
        } 
      },
      {
        $addFields : {
          subcribersCount : {
            $size : "$subscriber"
          },
          subscribedChannelCount :{
            $size : "$subscribedTo"
          },
     isSubscribed: {
      $in: [req.user?._id, "$subscribers.subscriber"] 
    }
        }
      },
      {
      $project : {
        fullname : 1,
         username : 1,
         subcribersCount : 1,
         subscribedChannelCount : 1,
         isSubscribed : 1,
         avatar : 1,
         coverImage : 1,
         email : 1,
      }}
    ])
    console.log(channel)
    if (!channel?.length){
      throw new ApiError(404, "Channel doesn't exist")
    }
    return res.status(200).json(
      new ApiResponse(200,channel[0] , "user fetched successfully!")
    )
})
const getWatchHistory = asyncHandler(async(req,res)=>{
   const user = await User.aggregate([
    {
      $match : {
        _id : new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup :{
        from : "videos",
        localField : "watchHistory",
        foreignField : "_id",
        as : "watchHistory",
        pipeline : [
          {
            $lookup : {
              from : "users",
              localField :"owner",
              foreignField : "_id",
              as : "owner",
              pipeline : [
                {
                  $project : {
                    fullname : 1,
                    username : 1,
                    avatar : 1,
                  }
                },
                {
                  $addFields : {
                    owner : {
                      $first : "$owner"
                    }
                  }
                }
              ]
            }
          }
        ]
      } 
    }
   ])
   return res
   .status(200)
   .json(
    new ApiResponse(200,user[0].watchHistory,"WatchedHistory fetched successfully")
   )
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCover,
  getUserChannelProfile,
  getWatchHistory
}