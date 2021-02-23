const express = require("express");

const AuthorModel = require("./schema");
const { authenticate, refreshToken } = require("../../utils/auth");
const { authorize, adminOnly } = require("../../utils/auth/middlewares");
const passport = require("passport");

const router = express.Router();

router.get("/", authorize, adminOnly, async (req, res, next) => {
  try {
    const authors = await AuthorModel.find();
    res.status(200).send(authors);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/me", authorize, async (req, res, next) => {
  try {
    res.status(200).send(req.author);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const newAuthor = new AuthorModel(req.body);
    const { _id } = await newAuthor.save();

    res.status(201).send(_id);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.put("/me", async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    updates.forEach((update) => req.author[update] === req.body[update]);
    await req.author.save();

    res.status(200).send(req.author);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/me", async (req, res, next) => {
  try {
    await req.author.deleteOne();

    res.status(203).send("Author deleted");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const author = await AuthorModel.findByCredentials(email, password);

    const { token, refreshToken } = await authenticate(author);

    res.cookie("accessToken", token, {
      httpOnly: true,
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/authors/refreshToken",
    });

    res.send("OK");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/logoutAll", authorize, async (req, res, next) => {
  try {
    req.author.refreshTokens = [];
    await req.author.save();
    res.send();
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/refreshToken", async (req, res, next) => {
  const oldRefreshToken = req.body.refreshToken;
  if (!oldRefreshToken) {
    const err = new Error("Refresh token missing");
    err.httpStatusCode = 400;
    next(err);
  } else {
    try {
      const newTokens = await refreshToken(oldRefreshToken);
      res.status(200).send(newTokens);
    } catch (error) {
      console.log(error);
      const err = new Error(error);
      err.httpStatusCode = 403;
      next(err);
    }
  }
});

router.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/googleRedirect",
  passport.authenticate("google"),
  async (req, res, next) => {
    try {
      res.cookie("accessToken", req.user.tokens.token, {
        httpOnly: true,
      });

      res.cookie("refreshToken", req.user.tokens.refreshToken, {
        httpOnly: true,
        path: "/authors/refreshToken",
      });

      res.status(200).redirect(`${process.env.FE_URL}/home`);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);
module.exports = router;
