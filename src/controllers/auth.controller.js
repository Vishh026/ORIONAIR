const usermodel = require('../models/user.model');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function registerUser(req, res) {
  const {
    fullname: { firstname, lastname },
    password,
    email,
    username,
  } = req.body;

  // if (
  //     !fullname ||
  //     typeof fullname !== 'object' ||
  //     !fullname.firstname ||
  //     !fullname.lastname
  //   ) {
  //     return res.status(400).json({ message: "Please provide firstname and lastname" });
  //   }

  const isUserAlredyExist = await usermodel.findOne({ email });

  if (isUserAlredyExist) {
    return res.status(201).json({ message: "User alredy exist" });
  }
  const hashPassowrd = await bcrypt.hash(password, 10);

  const user = await usermodel.create({
    fullname: {firstname,lastname},
    email,
    username,
    password: hashPassowrd,
  });

  const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);

  res.cookie("token", token);

  res.status(201).json({
    message: "User Register Successfully",
    user: {
      email: user.email,
      fullname: user.fullname,
      id: user._id,
      username:user.username
    },
  });
}

async function loginUser(req, res) {
  const { usernameoremail, password } = req.body;

  const user = await usermodel.findOne({
    $or:[{email: usernameoremail},{username:usernameoremail}]
  });

  if (!user) {
    return res.redirect("/login?error = Invalid Password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.redirect(`/login?eroor=Invalid Password`);
  }

  const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
  console.log("token",token);
  
  res.cookie("token", token);

  return res.status(200).json({
    message: "User logged in sucessfully",
    user: {
      usernameoremail: user.usernameoremail,
      id: user._id,
    },
  });
}

module.exports = { registerUser, loginUser };
