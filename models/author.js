var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
    {
        first_name: {type: String, required: true, maxlength: 100},
        family_name: {type: String, required: true, maxlength: 100},
        date_of_birth: {type: Date},
        date_of_death: {type: Date},
    }
);

//Virtual for author's full name
AuthorSchema.virtual('name').get(function() {
    var fullname = '';
    if (this.first_name && this.family_name) {
        fullname = this.family_name + ', ' + this.first_name;
    }
    if(!this.first_name || !this.family_name){
        fullname = '';
    }

    return fullname;
});

//Virtual for author's lifespan
AuthorSchema.virtual('birthday_formatted').get(function (){
    return (this.date_of_birth) ? moment(this.date_of_birth).format('MM/DD/YYYY') : '';
});


AuthorSchema.virtual('deathday_formatted').get(function(){
    return (this.date_of_death) ? moment(this.date_of_death).format('MM/DD/YYYY') : '';
});


//Virtual for author's urls
AuthorSchema.virtual('url').get(function (){
    return '/catalog/author/' + this._id;
});

module.exports = mongoose.model('Author', AuthorSchema);