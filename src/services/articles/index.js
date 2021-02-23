const express = require("express");
const mongoose = require("mongoose");
const q2m = require("query-to-mongo");
const ArticleModel = require("./schema");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await ArticleModel.countDocuments(query.criteria);

    const articles = await ArticleModel.find(
      query.criteria,
      query.options.fields
    )
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort)
      .populate("author", { _id: 0, name: 1, img: 1 });
    res.status(200).send({ links: query.links("/articles", total), articles });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const article = await ArticleModel.findById(req.params.id).populate({
      path: "author",
      select: "name img",
    });

    if (article) {
      res.status(200).send(article);
    } else {
      const err = new Error();
      err.message = `Article Id: ${req.params.id} not found`;
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const newArticle = new ArticleModel(req.body);
    const { _id } = await newArticle.save();
    res.status(201).send(_id);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const modifiedArticle = await ArticleModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        runValidators: true,
        new: true,
      }
    );
    if (modifiedArticle) {
      res.status(200).send(modifiedArticle);
    } else {
      const err = new Error();
      err.message = `Article Id: ${req.params.id} not found`;
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleteArticle = await ArticleModel.findByIdAndDelete(req.params.id);
    if (deleteArticle) {
      res.status(203).send("Article Deleted");
    } else {
      const err = new Error();
      err.message = `Article Id: ${req.params.id} not found`;
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/:id/reviews/", async (req, res, next) => {
  try {
    const { reviews } = await ArticleModel.findById(req.params.id); // {
    //   reviews: 1,
    //   _id: 0,
    // });
    // article = article.toObject();
    // const { reviews } = article;

    if (reviews) {
      res.status(200).send(reviews);
    } else {
      const err = new Error();
      err.message = `Article Id: ${req.params.id} not found`;
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/:id/reviews/:reviewID", async (req, res, next) => {
  try {
    // const articleID = await ArticleModel.findById(req.params.id);
    const { reviews } = await ArticleModel.findById(req.params.id, {
      _id: 0,
      reviews: {
        $elemMatch: { _id: mongoose.Types.ObjectId(req.params.reviewID) },
      },
    });

    if (reviews && reviews.length > 0) {
      res.status(200).send(reviews[0]);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      // if (!articleID) {
      //   err.message = `Article Id: ${req.params.id} not found`;
      // } else if (!articleID && reviews.length === 0) {
      //   err.message = `Article Id: ${req.params.id} and review Id: ${req.params.reviewID} not found`;
      // } else {
      //   err.message = `Review Id: ${req.params.reviewID} not found`;
      // }
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/:id/reviews", async (req, res, next) => {
  try {
    const updatedArticle = await ArticleModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          reviews: req.body,
        },
      },
      { runValidators: true, new: true }
    );

    res.status(201).send(updatedArticle);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.put("/:id/reviews/:reviewID", async (req, res, next) => {
  try {
    const { reviews } = await ArticleModel.findById(req.params.id, {
      _id: 0,
      reviews: {
        $elemMatch: { _id: mongoose.Types.ObjectId(req.params.reviewID) },
      },
    });
    if (reviews && reviews.length > 0) {
      const reviewToReplace = { ...reviews[0].toObject(), ...req.body };

      const modifiedReview = await ArticleModel.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
          "reviews._id": mongoose.Types.ObjectId(req.params.reviewID),
        },
        {
          $set: { "reviews.$": reviewToReplace },
        },
        { runValidators: true, new: true }
      );
      res.status(200).send(modifiedReview);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/:id/reviews/:reviewID", async (req, res, next) => {
  try {
    const modifiedReview = await ArticleModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          reviews: {
            _id: mongoose.Types.ObjectId(req.params.reviewID),
          },
        },
      },
      { new: true }
    );
    res.status(203).send(modifiedReview);
  } catch (error) {
    console.log(error);
    next(error);
  }
});
module.exports = router;
