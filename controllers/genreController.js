const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

const Genre = require("../models/genre");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();
  res.render('genre_list', {
    title: 'Genre List',
    genre_list: allGenres,
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const err = new Error("Invalid ID");
    err.status = 422;

    return next(err);
  }

  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (genre == null) {
    const err = new Error("Genre not found");
    err.status = 404;

    return next(err);
  }

  res.render("genre_detail", {
    title: "Genre detail",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = asyncHandler(async (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
});

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate & sanitize the name field.
  body("name", "Genre name must contain at least 3 characters.")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation & sanitization.
  asyncHandler(async function (req, res, next) {
    const errors = validationResult(req);

    // Create a genre object with escaped & trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });

      return;
    } else {
      // Data from form is valid.
      // Check if Genre with the same name already exists.
      const genreExists = await Genre.findOne({ name: req.body.name })
        .collation({ locale: "en", strength: 2 })
        .exec();
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to genre detail page.
        res.redirect(genre.url);
      }
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (genre == null) {
    res.redirect("/catalog/genres");
  }

  res.render("genre_delete", {
    title: "Delete Genre",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  await Genre.findByIdAndDelete(req.body.genreid);

  res.redirect("/catalog/genres");
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Genre update GET");
});

// Handle Genre update on POST.
exports.genre_update_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Genre update POST");
});