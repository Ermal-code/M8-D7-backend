const { Schema, model } = require("mongoose");

const ReviewSchema = new Schema({
  text: "string",
  user: "string",
});

module.exports = model("Review", ReviewSchema);
