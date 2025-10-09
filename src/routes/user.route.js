import {Router} from "express"
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    getUserChannelProfile ,
    changeCurrentPassword,
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCover,
    getWatchHistory 
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {upload} from '../middlewares/multer.middleware.js';
const router = Router();
router.route('/register').post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
          {
            name : "coverImage",
            maxCount : 1
        },
    ]),
    registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJwt , logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(verifyJwt,changeCurrentPassword);
router.route('current-user').post(verifyJwt,getCurrentUser);
router.route('/update-account').patch(verifyJwt,updateAccountDetails)
router.route('/avatar').patch(verifyJwt,upload.single("avatar") , updateUserAvatar)
router.route('coverImage').post(verifyJwt, upload.single('cover-img'),updateUserCover)
router.route('/c/:username').get(verifyJwt,getUserChannelProfile)
router.route('watchHistory').get(verifyJwt,getWatchHistory)
export default router