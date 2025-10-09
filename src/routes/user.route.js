import {Router} from "express"
import {loginUser, logoutUser, registerUser,refreshAccessToken,getUserChannelProfile} from "../controllers/user.controller.js";
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
router.route('/login/:username').post(getUserChannelProfile);
router.route('/logout').post(verifyJwt , logoutUser);
router.route('/refresh-token').post(refreshAccessToken)
export default router