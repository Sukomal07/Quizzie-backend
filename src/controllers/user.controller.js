import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/error.js'
import { ApiResponse } from '../utils/response.js'
import User from "../models/user.model.js";


export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
        throw new ApiError(400, "All feilds are required")
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
        throw new ApiError(409, "User with this email already exists")
    }

    const user = new User({
        name,
        email,
        password
    })

    try {
        await user.validate()
    } catch (error) {
        const validationErrors = [];
        for (const key in error.errors) {
            validationErrors.push(error.errors[key].message);
        }
        throw new ApiError(400, validationErrors.join(', '));
    }

    await user.save()
    user.password = undefined

    res.status(201).json(
        new ApiResponse(201, user, "User created successfully")
    )
})

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new ApiError(400, 'All feilds are required')
    }

    const user = await User.findOne({ email }).select("+password")

    if (!user) {
        throw new ApiError(404, "User does not exists")
    }

    const isCorrectPassword = await user.isPasswordCorrect(password)

    if (!isCorrectPassword) {
        throw new ApiError(401, 'Invalid user credentials')
    }

    user.password = undefined

    const accessToken = await user.generateAccessToken()

    const options = {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
        secure: process.env.NODE_ENV === "Development" ? false : true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }

    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(201, user, `Welcome back ${user.name}`))
})

export const logoutUser = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
        secure: process.env.NODE_ENV === "Development" ? false : true,
    }

    res
        .status(200)
        .clearCookie("accessToken", options)
        .json(
            new ApiResponse(200, '', "logout successfully")
        )
})

export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id)
    res.status(200).json(
        new ApiResponse(200, user, 'User fetched successfully')
    )
})

export const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const existingUser = await User.findOne({ email: req.body?.email });

    if (existingUser) {
        if (existingUser.email === req.body?.email) {
            throw new ApiError(400, "Email is already in use");
        }
    }

    for (const key in req.body) {
        user[key] = req.body[key];
    }

    try {
        await user.validate()
    } catch (error) {
        const validationErrors = [];
        for (const key in error.errors) {
            validationErrors.push(error.errors[key].message);
        }
        throw new ApiError(400, validationErrors.join(', '));
    }
    const updatedUser = await user.save();

    res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully"));
})
