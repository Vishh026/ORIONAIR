const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken')

async function authuser(req,res,next){
    const { token } = req.cookies;
    if(!token){
        return res.status(401).json({message: "Unauthorized"})
    }
    try {

        const decoded = jwt.verify(token,process.env.SECRET_KEY);
    const user = await userModel.findById(decoded.id)
        req.user = user;
        next()

    } catch (error) {
        return res.status(401).json({message: "Unauthorized"})
        
    }


}


module.exports = {authuser}