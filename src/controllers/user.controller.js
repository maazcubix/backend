import { User } from "../models/user.model.js";
import { ApiResponsone } from "../../utils/Apiresponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { upload } from "../../utils/cloudinary.js";
import { ApiError } from "../../utils/error.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    //save access token in user doc
    user.refreshToken = await refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Some thing went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    console.log("body is ", req.body);
    const { fullName, email, userName, password } = req.body;
    console.log(email, "email");
    if (
      [fullName, email, userName, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({
      $or: [{ userName }, { email }],
    });

    if (user) {
      new ApiError(400, "user is al ready existed ");
    }
    const avatarLocal = req.files?.avatar[0]?.path;

    if (!avatarLocal) {
      throw new ApiError(400, "avatar needed");
    }

    const avatar = await upload(avatarLocal);

    if (!avatar) throw new ApiError(400, "avatar is needed");

    const newUser = await User.create({
      fullname: fullName,
      avatar: avatar.url,
      email,
      password,
      username: userName,
    });
    console.log(newUser);
    console.log(avatar);

    const createdUSer = await User.findById(newUser?._id).select(
      "-password-refreshToken"
    );
    if (!createdUSer)
      new ApiError(500, "some thing went wrong while creating the user");
    console.log(createdUSer);
    return res
      .status(201)
      .json(
        new ApiResponsone(201, createdUSer, "user registered successfully")
      );
  } catch (error) {
    console.log(error);
  }

  //get body
  //validate user
  // save into db
  // retun msg
});

const loginUser = asyncHandler(async (req, res) => {
  console.log(req.body);
  try {
    const { email, password, username } = req.body;
    if (!username && !email) {
      throw new ApiError(400, "username or email is requried");
    }

    const registerUser = await User.findOne({ $or: [{ username }, { email }] });
    if (!registerUser) throw new ApiError(400, "USer doesn't exist ");

    const isPassValid = await registerUser.isPasswordCorrect(password);
    if (!isPassValid) throw new ApiError(401, "Password is incorrect ");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      registerUser._id
    );
    console.log(await accessToken);
    registerUser.refreshToken = await refreshToken;
    console.log(registerUser);
    // registerUser.select("-password-refreshToken");

    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", await accessToken, options)
      .cookie("refreshToken", await refreshToken, options)
      .json(
        new ApiResponsone(
          200,
          { user: registerUser, accessToken, refreshToken },
          "user logged in successfully"
        )
      );
  } catch (error) {
    console.log(error);
  }
  //get email ,password
  //check user existed
  //match password
  //genearate access and refresh token and save send it to the res
  //
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    console.log(req.user);
    const { _id } = req.user;
    await User.findByIdAndUpdate(
      _id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    res
      .status(200)
      .clearCookie("refreshToken", options)
      .clearCookie("accessToken", options)
      .json(new ApiResponsone(200, {}, "User logout SuccessFully"));
  } catch (error) {
    console.log(error);
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const inComingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!inComingRefreshToken) throw new ApiError(401, "unauthorized request ");
  try {
    const decodedToken = await jwt.verify(inComingRefreshToken, "maaaz");

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new ApiError(410, "User not found ");
    if (inComingRefreshToken !== user?.refreshToken)
      throw new ApiError(410, "refresh token is expired");

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(new ApiResponsone(200, { accessToken, newrefreshToken }));
  } catch (error) {
    throw new ApiError(400, error);
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCheck = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCheck) throw new ApiError(400, "password is incorrect");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponsone(200, {}, "password change successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, { user: req.user }, "User Fetched Successfully");
});

const updateUser = asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) throw new ApiError(400, "username is requried ");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { username } },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponsone(200, user, "user updated successfully"));
});
const changeAvatar = asyncHandler(async (req, res) => {
  const avatarLocal = req.files.path;

  if (avatarLocal) throw new ApiError(400, "Avatar is required");
  const avatar = await upload(avatarLocal);
  if (!avatar.url) throw new ApiError(400, "error while uploading avatar");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponsone(200, user, "avatar updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(400, "username not found");
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriber",
        localField: "_id",
        foreignField: "s",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subsCount: {
          $size: "$subscribers",
        },
        subsToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $condition: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
            subsCount:1,

          },
        },
      },
    },
    {
      $project:{
        fullname:1,
        username:1,
        email:1,
        avatar:1,
        coverImage:1,
        isSubscribed,
        subsCount,
        subsToCount

      }
    }
  ]);
  return res.status(200).json(new ApiResponsone(200,channel,"channel data "))
  console.log(channel);
});

const getUserHistory=asyncHandler(async(req,res)=>{

  const user=await User.aggregate([
    {
      $match:{
        _id:new mongoose.Types.ObjectId(req.user?._id)
      },
      
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHitory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"owner"
              }
            }
          }
        ]
      }
    }
  ])
  return res.status(200).json(new ApiResponsone(200,user[0]?.watchHistory,"history fetched successfully "))



})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUser,
  changeAvatar,
  getUserChannelProfile,
};
