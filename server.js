/*********************************************************************************
*WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.

* 
*  Name: ____Amir Vassell_____ Student ID: 154737209 Date: ___November 23, 2022___
*
*  Cyclic Web App URL: https://yellow-haddock-vest.cyclic.app/
*
*  GitHub Repository URL: https://github.com/AmirV18/web322-app.git
*
********************************************************************************/ 

var express = require("express"); 
const res = require("express/lib/response")
var app = express(); 
var blogService = require ('./blog-service.js')
const authData = require('./auth-service.js')
const clientSession = require("client-sessions")

const multer = require("multer");
const upload = multer();

const cloudinary = require('cloudinary').v2;

const streamifier = require('streamifier');

const exphbs = require('express-handlebars');
const stripJs = require('strip-js');

app.engine('.hbs', exphbs.engine({ extname: '.hbs',
    helpers:{
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        }, //HELPER 1
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }, //HELPER 2
        safeHTML: function(context){
            return stripJs(context);
        }, //HELPER 3 
        formatDate: function(dateObj){
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
        } //HELPER 4
    } //brace for helpers
}));
app.set('view engine', '.hbs');

var HTTP_PORT = process.env.PORT || 8080;
var path = require("path");

//require blog-service module - can be used to interact with data from server.js
var blogService = require('./blog-service.js')
const { rmSync } = require("fs");
const { brotliDecompress } = require("zlib");

cloudinary.config({
    cloud_name: 'dvujduppr',
    api_key: '796685354338326',
    api_secret: 'Di_BUGp22RP2Qf7FocPdccOWXBg',
    secure: true
});

app.use(express.urlencoded({extended: true}));

app.use(function(req,res,next){ //ADDED IN A4
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});


//STATIC ROUTE
app.use(express.static("public"));


//COOKIES/SESSIONS

app.use(clientSession({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "week10example_web322", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
  }))

  app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
  });

  function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
  }
//////////////////

//REDIRECTING ROUTE
app.get("/", (req, res) => {
    res.redirect('/blog');
});

//about route 
app.get("/about", (req,res) => {
    //res.sendFile(path.join(__dirname, "/views/about.html"));

    res.render('about', {
        layout: 'main'
    });

});



// posts 
app.get("/posts", ensureLogin,(req,res) =>{ //UPDATE

    if(req.query.category){
        blogService.getPostsByCategory(req.query.category)
        .then((data) => {
            //res.json(data);
            if(data.length > 0){
            res.render('posts', {
                posts : data
            })}else{
                res.render("posts",{ message: "no results" });
            }
        })
        .catch((err) =>{
            res.render('posts',{
                message: err
            })
        })
    }else if(req.query.minDate){
        blogService.getPostsByMinDate(req.category.minDate)
        .then((data)=>{
            //res.json(data);
            if(data.length > 0){
                res.render('posts', {
                    posts : data
                })}else{
                    res.render("posts",{ message: "no results" });
                }
        })
    }else{
    blogService.getAllPosts()
    .then((data) => {
        //res.json(data);
        if(data.length > 0){
            res.render('posts', {
                posts : data
            })
        }else{
                res.render("posts",{ message: "no results" });
            }
    })
    .catch((err) => {
        //res.json({message: err});
        res.render('posts', {
            message: err
        })
    })
    }
    //
})

app.get("/posts/add", ensureLogin, (req, res) =>{
    //res.sendFile(path.join(__dirname, "/views/addPost.html"));
    blogService.getAllCategories().then((categories) =>{
        res.render('addPost', {
            category: categories,
            layout: 'main'
        });
    }).catch(() =>{
        res.render("addPost", {
            data: [],
            layout: 'main'
        }); 
    })
})

app.get("/posts/:value", ensureLogin,(req, res) =>{
    //console.log(req.params.value)
    if(req.params.value){
        blogService.getPostById(req.params.value)
        .then((data) =>{
            res.json(data)
        })
    }
})

app.post("/posts/add",ensureLogin ,upload.single("featureImage"), (req,res) => {
    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
    
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
    
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }
    
        upload(req).then((uploaded)=>{
            processPost(uploaded.url);
        });
    }else{
        processPost("");
    }
     
    function processPost(imageUrl){
        req.body.featureImage = imageUrl;
         blogService.addPost(req.body).then(() => {
            res.redirect("/posts");
         })
        // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts
    } 
    
})
app.get("/posts/delete/:id", ensureLogin, (req, res) =>{
    if(req.params.id){
        blogService.deletePostById(req.params.id).then(() =>{
            res.redirect("/posts");
        }).catch((err) =>{
            res.status(500).send("Unable to remove post/ post not found. Error: " + err);
        })
    }
})

//categories 
app.get("/categories", ensureLogin, (req,res) => {
    blogService.getAllCategories().then((data) => {
        //res.json(data);
        if(data.length > 0){
        res.render('categories', {
            categories: data
        })}else{
            res.render("categories",{ message: "no results" });
        }
     }).catch((err) => {
        //res.json({message: err});
        res.render('categories',{
            message: err
        })
     })
});

app.get("/categories/add", ensureLogin, (req, res) =>{
    //res.sendFile(path.join(__dirname, "/views/addPost.html"));
    res.render('addCategory', {
        layout: 'main'
    });
})

app.post("/categories/add", ensureLogin, (req, res) =>{
    console.log(req.body);
    blogService.addCategory(req.body).then(() => {
        res.redirect("/categories");
     })
})

app.get("/categories/delete/:id", ensureLogin,(req, res) =>{
    if(req.params.id){
        blogService.deleteCategoryById(req.params.id).then(() =>{
            res.redirect("/categories");
        }).catch((err) =>{
            res.status(500).send("Unable to remove category/ category not found. Error: " + err);
        })
    }
})


//blog 
app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogService.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogService.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0]; 

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogService.getAllCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})

});
// app.get("/blog", (req,res) =>{
   
//     // blogService.gePublishedPosts().then((data) => {
//     //     res.json(data);
//     // }).catch((err) => {
//     //     res.json({message: err});
//     // })
// });

app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogService.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogService.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the post by "id"
        //HERE
        viewData.post = await blogService.getPostById(req.params.id);
    }catch(err){
        viewData.message = "No results"; 
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogService.getAllCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})
});

//LOGIN ROUTES

app.get("/login", (req, res) =>{
    res.render("login", {
        layout: 'main'
    })
})

app.get("/register", (req, res) =>{
    res.render("register", {
        layout: 'main'
    })
})

app.post("/register", (req, res) =>{
    authData.registerUser(req.body).then(() =>{ //removed data from inside .then
        //something is wrong in registerUser
        
        res.render("register",{
            successMessage: "User created"
        })
    }).catch((err) =>{
        res.render("register", {
            errorMessage: err, userName: req.body.userName
        })
    })
})

app.post("/login", (req,res) =>{
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body).then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
    
        res.redirect('/posts');
    }).catch((err)=>{
        res.render("login", {
            errorMessage: err, userName: req.body.userName
        })
    }) 
})

app.get("/logout", (req, res) =>{
    req.session.reset();
  res.redirect("/");
})

app.get("/userHistory", ensureLogin, (req, res) =>{
    res.render("userHistory", {
        layout : 'main'
    })
})
/////////////

//NO MATCHING ROUTE
app.use((req,res) => {
    res.render('404.hbs', {
        layout: 'main'
    })
    //res.status(404).send("Page Not Found");
});

blogService.initialize()
.then(authData.initialize)
.then(() =>{
    app.listen(HTTP_PORT, () => {
        console.log('Express HTTP server is listening to the port', HTTP_PORT)
    })
}).catch(() => {
    console.log('Error: Server not started')
})
