import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/error.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    console.log(req?.cookies);
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new ApiError(404, "Unauthorized Request ");
    const decodedToken = jwt.verify(token, "maaaz");
  
    const user = await User.findById(decodedToken?._id).select(
      "-password-refreshToken"
    );
    if (!user) throw new ApiError(401, "invalid access token");
  
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    throw new ApiError(404,"some thing went wrong")
    
  }
});
