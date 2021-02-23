const jwt = require("jsonwebtoken");
const AuthorModel = require("../../services/authors/schema");
const { verifyJWT } = require("./index");

const authorize = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decodedToken = await verifyJWT(token);
    console.log("decoded: ", decodedToken);
    const author = await AuthorModel.findOne({ _id: decodedToken._id });

    if (!author) {
      const err = new Error(`Author with id: ${decodedToken._id} not found!`);
      err.httpStatusCode = 404;
      next(err);
    } else {
      req.token = token;
      req.author = author;
      next();
    }
  } catch (error) {
    const err = new Error("You are not authenticated for this action");
    err.httpStatusCode = 401;
    next(err);
  }
};

const adminOnly = async (req, res, next) => {
  if (req.author && req.author.role === "admin") next();
  else {
    const err = new Error(
      "You are not authorized for this action. Admins only!"
    );
    err.httpStatusCode = 403;
    next(err);
  }
};

module.exports = { authorize, adminOnly };
