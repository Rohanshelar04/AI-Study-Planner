const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).send("Token does not exist");
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);


        const { userId } = payload;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).send("User does not exist");
        }

        req.user = user;

        next();
    }
    catch (err) {
        return res.status(401).send("Authentication failed: " + err.message);
    }
};

module.exports = auth;