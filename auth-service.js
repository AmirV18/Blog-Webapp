const bcrypt = require('bcryptjs');
var mongoose = require('mongoose');

const env = require('dotenv');
env.config();

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
       let db = mongoose.createConnection(process.env.MONGO_URI);

       db.on('error', (err)=>{
           reject(err); // reject the promise with the provided error
       });
       db.once('open', ()=>{
          User = db.model("users", userSchema);
          resolve();
       });
   });
};

module.exports.registerUser = (userData) =>{ //this is sending undefined data from register route
   return new Promise((resolve, reject) => {
      if(userData.password != userData.password2){
         reject("PASSWORDS DO NOT MATCH!");
      }else{
         bcrypt.hash(userData.password, 10).then((hash)=>{
            userData.password = hash;
            let newUser = new User(userData);
            console.log(newUser + "\nDebugging here in register user function");
            newUser.save((err)=>{
               if(err){
                  if(err.code == 11000){
                     reject("USERNAME IS TAKEN");
                  }else{
                     reject("There was an error creating the user: " + err);
                  }
               }else{
                  resolve();
               }
            });
         }).catch((err) => {
           // console.log(err)
            reject("ERROR WITH PASSWORD ENCRYPTION")
        });
      }
   });
}

module.exports.checkUser = (userData) =>{
   return new Promise((resolve, reject) =>{
      //console.log(userName);
      User.find({userName : userData.userName}) //problem is here
      .exec()
      .then((user) =>{
         if(user.length == 0){
            reject("Unable to find user: " + userData.userName)
         }
         else{
            bcrypt.compare(userData.password, user[0].password).then((result) => { //updated to check against users[0] password instead of hash
              // result === true if it matches and result === false if it does not match
              if (result === true) {
                user[0].loginHistory.push({
                  dateTime: (new Date()).toString(),
                  userAgent: userData.userAgent
                });
                User.updateOne(
                  { userName: user[0].userName },
                  { $set: { loginHistory: user[0].loginHistory } }
                ).exec()
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



