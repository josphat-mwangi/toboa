const mongoose = require('mongoose');

const dataSchema = mongoose.Schema({
    name:{
        type    : String,
        required: true
    },
    phoneNumber:{
        type    : Number,
        required: true
    },
   
    county:{
        type    : String,
        required: true
    }
});

module.exports = mongoose.model("Data", dataSchema);