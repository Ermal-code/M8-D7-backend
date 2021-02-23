const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AuthorModel = require("../../services/authors/schema");
const { authenticate } = require("./index");

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: `${process.env.BE_URL}/authors/googleRedirect`,
    },
    async (request, accessToken, refreshToken, profile, next) => {
      const newAuthor = {
        googleId: profile.id,
        name: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        img: profile.photos[0].value,
        role: "user",
        refreshTokens: [],
      };

      try {
        const author = await AuthorModel.findOne({ googleId: profile.id });

        if (author) {
          const tokens = await authenticate(author);

          next(null, { author, tokens });
        } else {
          const createdAuthor = new AuthorModel(newAuthor);
          await createdAuthor.save();
          const tokens = await authenticate(createdAuthor);

          next(null, { author: createdAuthor, tokens });
        }
      } catch (error) {
        console.log(error);
        next(error);
      }
    }
  )
);

passport.serializeUser(function (user, next) {
  next(null, user);
});
