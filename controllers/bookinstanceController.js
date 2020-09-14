var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const {body, validationResult} = require('express-validator');

const async = require('async');
var debug = require('debug')('bookinstance');
// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {

    BookInstance.find()
      .populate('book')
      .exec(function (err, list_bookinstances) {
        if (err) { 
            debug('list error: ' + err);
            return next(err); }
        // Successful, so render
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
      });
      
  };

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
    
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance){
        if (err) {
            debug('detail error: ' + err);
            return next(err);}
        if(bookinstance==null){
            var err = new Error('Book copy not found');
            err.status = 404;
            debug('detail error: ' + err);
            return next(err);
        }

        res.render('bookinstance_detail', {title: 'Copy: ' +bookinstance.book.title, bookinstance: bookinstance})
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    
    Book.find({}, 'title').exec(function(err, books){
        if(err){
            debug('create-get error: ' + err);
            return next(err);}
        res.render('bookinstance_form', {title: 'Create Book', book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    body('book').escape(),
    body('imprint').escape(),
    body('status').trim().escape(),
    body('due_back').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { 
                        debug('create-post error: ' + err);
                        return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { 
                    debug('create-post-save error: ' + err);
                    return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) {
    BookInstance.findById(req.params.id).populate('book')
    .exec(function(err, results){
        if (err) {
            debug('delete error: ' + err);
            return next(err);}
        if (results==null){res.redirect('/catalog/bookinstance');}
        res.render('bookinstance_delete', {bookinstance: results})
    });
};


// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {

    BookInstance.findByIdAndDelete(req.body.bookinstanceid,function(err){
        if(err) {
            debug('delete-post error: ' + err);
            return next(err);}
        else{
            res.redirect('/catalog/bookinstances');
        }
    });
};


// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {

    async.parallel({
        book_list: function(callback){
            Book.find({},'title').exec(callback);
        },
        bookinstance: function(callback){
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        },
    },function(err, results){
        if (err){
            debug('update-get error: ' + err);
            return next(err);}
        if (results.bookinstance=='undefined'){
            res.redirect('/catalog/bookinstances');
        }
        res.render('bookinstance_form', {title: "Update Book Instance", book_list: results.book_list, bookinstance: results.bookinstance})
    });

};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
        
    // Sanitize fields.
    body('book').escape(),
    body('imprint').escape(),
    body('status').trim().escape(),
    body('due_back').toDate(),
        
    // Process request after validation and sanitization.
    (req, res, next) => {
    
        // Extract the validation errors from a request.
        const errors = validationResult(req);
    
        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
        {   book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });
    
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title').exec(function (err, books) {
                if (err) { 
                    debug('update-post error: ' + err);
                    return next(err); }
                // Successful, so render.
                res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            BookInstance.findByIdAndUpdate(bookinstance.id, bookinstance, {}, function (err, theBookInstance) {
                if (err) { 
                    debug('update-post error: ' + err);
                    return next(err); }
                // Successful - redirect to new record.
                res.redirect(theBookInstance.url);
            });
        }
    }
];
