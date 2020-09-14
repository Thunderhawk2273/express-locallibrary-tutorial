var Genre = require('../models/genre');

var Book = require('../models/book');
var async = require('async');
var debug = require('debug')('genre');


const validator = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find().populate('genre').sort([['name', 'ascending']])
    .exec(function(err, list_genre){
        if (err) {
            debug('list error: ' + err);
            return next(err);}
        //Successful, so render
        res.render('genre_list', {title: 'Genre List', genre_list: list_genre});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback);
        },

        genre_books: function(callback){
            Book.find({'genre': req.params.id }).exec(callback);
        },

    }, function(err, results){
        //if error other than results
        if (err) {
            debug('detail error: ' + err);
            return next(err);}
        //if no results for genre
        if(results.genre==null){//no results
            var err = new Error('Genre not found');
            err.status = 404;
            debug('detail error: ' + err);
            return next(err);
        }
        //if results retrieved successfully
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books})

    }
    );
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    validator.body('name', 'Genre name required').trim().isLength({min: 1}),

    validator.body('name').escape(),

    (req, res, next) => {
        const errors = validator.validationResult(req);
        //make new genre with escaped characters and trimmed data
        var genre = new Genre(
            {name: req.body.name}
        );

        if (!errors.isEmpty()){
            //If there are errors
            res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()});
        }
        else{
            //Data is valid
            //Check if Genre with same name already exists
            Genre.findOne({'name':req.body.name})
            .exec(function(err, found_genre){
                if (err) {
                    debug('create-post error: ' + err);
                    return next(err);}//if error
                if (found_genre){//if we found genre, return it's url
                    res.redirect(found_genre.url);
                }
                else{
                    genre.save(function (err){
                        if(err){
                            debug('create-post error: ' + err);
                            return next(err);}
                        res.redirect(genre.url);
                    })
                }
            })
        }
    }
]

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function(callback){
            Book.find({'genre': req.params.id}).exec(callback);
        },

    }, function(err, results){
        if(err){
            debug('delete-get error: ' + err);
            return next(err);}
        if(results.genre === null){
           res.redirect('/catalog/genres');
        }else{
            res.render('genre_delete', {title: "Delete Genre", genre: results.genre, genre_books: results.genre_books});
        }
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function(callback){
            Book.find({'genre': req.params.id}).exec(callback);
        },

    }, function(err, results){
        if(err){
            debug('delete-post error: ' + err);
            return next(err);}
        if(results.genre_books.length > 0){
            res.render('genre_delete', {title: "Delete Genre", genre: results.genre, genre_books: results.genre_books});
        }else{
            Genre.findByIdAndDelete(req.body.genreid).exec(function(err){
                if(err){
                    debug('delete-post error: ' + err);
                    return next(err);}
                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id, function(err, results){
        if(err){
            debug('update-get error: ' + err);
            return next(err);}
        res.render('genre_form', {title: 'Update Genre', genre: results});
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    validator.body('name', 'Genre name required').trim().isLength({min: 1}),

    validator.body('name').escape(),

    (req, res, next) => {
        const errors = validator.validationResult(req);

        var genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        });

        if (!errors.isEmpty()){
            res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors.array()});
        }
        else{
            Genre.findOne({'name':req.body.name}).exec(function(err, found_genre){
                if (err) {
                    debug('update-post error: ' + err);
                    return next(err);}
                if (found_genre){console.log('We found the genre');res.redirect(found_genre.url);}
                else {
                    console.log(
                        'We did not find the genre. Renaming it now.'
                    );
                    Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, theGenre){
                    if(err){return next(err);}
                    res.redirect(theGenre.url);
                    });
                }
            });
        }
    }
];