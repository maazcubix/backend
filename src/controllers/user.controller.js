import { User } from "../models/user.model.js";
import { ApiResponsone } from "../../utils/Apiresponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { upload } from "../../utils/cloudinary.js";
import { ApiError } from "../../utils/error.js";

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

export { registerUser };
