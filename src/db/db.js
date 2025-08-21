const mongoose = require('mongoose')

async function connectDB(req,res){
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Connected to DB");
        
    } catch (error) {
        console.log("Error connecting to database",error);
        
    }
}

module.exports = connectDB