const express = require("express");
const validator = require("validator");
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require("../models/User");
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");

router.post("/register", async(req, res) => {
      const {name,email,password}= req.body;

         if(!validator.isEmail(email)){
               return res.status(400).json({
                    message: "Please provide a valid email address."
               });
          }

         if(!validator.isStrongPassword(password)){
               return res.status(400).json({
                     message: "Password must be strong."
               });
         }

        try {
                    const hashedPassword = await bcrypt.hash(password, 10);

                  const user = await User.create({
    name: name,
    email: email,
    password: hashedPassword
});

const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
);

const isProduction = process.env.NODE_ENV === "production";

res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
});

return res.status(201).json({
    message: "Registration successful."
});

        } catch (error) {
                if (error.code === 11000) {
                             return res.status(409).json({
                             message: "An account with this email already exists."
                            });
                 }

                console.log(error);

                    return res.status(500).json({
                                 message: "Registration failed."
                    });
             }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        // JWT comes here
       const token = jwt.sign({userId: user._id},process.env.JWT_SECRET,{expiresIn: "1d"});

        // Cookie comes after JWT
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
        };
        res.cookie("token", token, cookieOptions);

        return res.status(200).json({
                       message: "Login successful."
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
});

router.post("/logout", (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
    });
    res.send("Logged out successfully");
});

router.get("/me", auth, (req, res) => {
    return res.status(200).json({
        authenticated: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
        },
    });
});

module.exports = router;
