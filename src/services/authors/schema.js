const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const AuthorSchema = new Schema(
  {
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, dropDups: true },
    password: { type: String },
    img: {
      type: String,
      required: true,
      default:
        "https://www.kindpng.com/picc/m/421-4212275_transparent-default-avatar-png-avatar-img-png-download.png",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      default: "user",
    },
    refreshTokens: [{ type: String }],
    googleId: String,
  },
  { timestamps: true }
);

AuthorSchema.methods.toJSON = function () {
  const author = this;
  const authorObj = author.toObject();

  delete authorObj.password;
  delete authorObj.__v;

  return authorObj;
};

AuthorSchema.statics.findByCredentials = async function (email, plainPW) {
  const author = await this.findOne({ email });

  if (author) {
    const isMatch = await bcrypt.compare(plainPW, author.password);
    if (isMatch) return author;
    else return null;
  } else {
    return null;
  }
};

AuthorSchema.pre("save", async function (next) {
  const author = this;
  const plainPw = author.password;

  if (author.isModified("password")) {
    author.password = await bcrypt.hash(plainPw, 12);
  }
  next();
});

const AuthorModel = model("Author", AuthorSchema);

module.exports = AuthorModel;
