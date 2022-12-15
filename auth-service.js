const bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = new Schema({
   "userName" : {
      "type" : String,
      "unique" : true
   },
   "password" : String,
   "email" : String,
   "loginHistory" : [{
      "dateTime" : Date, 
      "userAgent" : String
   }]
});

let User;

module.exports.initialize = function () {
   return new Promise(function (resolve, reject) {
       let db = mongoose.createConnection("mongodb+srv://amirvassell:Vassell13@web322.8plla5p.mongodb.net/web322_a6");

       db.on('error', (err)=>{
           reject(err); // reject the promise with the provided error
       });
       db.once('open', ()=>{
          User = db.model("users", userSchema);
          resolve();
       });
   });
};

module.exports.registerUser = (userData) =>{
   return new Promise((resolve, reject) => {
      if(userData.password != userData.password2){
         reject("PASSWORDS DO NOT MATCH!");
      }else{
         bcrypt.hash(userData.password, 10).then((hash)=>{
            userData.password = hash;
            let newUser = new User(userData);
            newUser.save().then(() =>{
              //resolve();
            }).catch((err) =>{
               if(err.code == 11000){
                  reject("USERNAME IS TAKEN");
               }else{
                  reject("There was an error creating the user: " + err);
               }
            })
         }).catch((err) => {
            console.log(err)
            reject("ERROR WITH PASSWORD ENCRYPTION")
        })
      }
   })
}

module.exports.checkUser = (userData) =>{
   return new Promise((resolve, reject) =>{
      //console.log(userName);
      User.findOne({userName : userData.userName}) //problem is here
      .exec()
      .then((user) =>{
         if(user.length == 0){
            reject("Unable to find user: " + userData.userName)
         // }else if(users[0].password != userData.password){
         //    reject("Incorrect Password for user: " + userData.userName)
         }
         else{
            bcrypt.compare(userData.password, hash).then((result) => {
              // result === true if it matches and result === false if it does not match
              if (result === true) {
                user.loginHistory.push({
                  dateTime: new Date(),
                  userAgent: userData.userAgent,
                });
                User.updateOne(
                  { userName: user[0].userName },
                  { $set: { loginHistory: user[0].loginHistory } }
                )
                  .exec()
                  .then(() => {
                    resolve(user[0]);
                  })
                  .catch((err) => {
                    reject("There was an error verifying the user: " + err);
                  });
              }else{
               reject("INCORRECT PASSWORD FOR USER: "+ userData.username)
              }
            });
         }
      })
      .catch(()=>{
         //console.log(userData.userName); //////////////
         reject("Unable to find user test: " + userData.userName) ///always go to here for some reason
      })
   })
}



