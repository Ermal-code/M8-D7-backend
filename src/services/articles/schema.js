const { Schema, model } = require("mongoose");

const ArticleSchema = new Schema(
  {
    headLine: String,
    subHead: String,
    content: String,
    category: {
      name: String,
      img: String,
    },
    author: { type: Schema.Types.ObjectId, ref: "Author" },
    cover: String,
    reviews: [
      {
        text: String,
        user: String,
      },
    ],
    claps: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = model("Article", ArticleSchema);
