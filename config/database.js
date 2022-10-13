const mongoose = require('mongoose');

exports.connect = async () =>{
    await mongoose
        .connect(process.env.DBURI, { useNewUrlParser: true })
        .then(()=> console.log("DB1 connecton Successful "))
        .catch((err)=>{
            console.log(err)
        })
}