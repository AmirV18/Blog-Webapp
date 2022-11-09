/*********************************************************************************
*WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.

* 
*  Name: ____Amir Vassell_____ Student ID: 154737209 Date: ___October 3, 2022___
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
        } //HELPER 3 
    } //brace for helpers
}));
app.set('view engine', '.hbs');

var HTTP_PORT = process.env.PORT || 8080;
var path = require("path");

//require blog-service module - can be used to interact with data from server.js
var blogService = require('./blog-service.js')
const { rmSync } = require("fs")

cloudinary.config({
    cloud_name: 'dvujduppr',
    api_key: '796685354338326',
    api_secret: 'Di_BUGp22RP2Qf7FocPdccOWXBg',
    secure: true
});

app.use(function(req,res,next){ //ADDED IN A4
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});


//STATIC ROUTE
app.use(express.static("public"));

//REDIRECTING ROUTE
app.get("/", (req, res) => {
    res.redirect('/about');
});

//about route 
app.get("/about", (req,res) => {
    //res.sendFile(path.join(__dirname, "/views/about.html"));

    res.render('about', {
        layout: 'main'
    });

});



// posts 
app.get("/posts", (req,res) =>{ //UPDATE

    if(req.query.category){
        blogService.getPostsByCategory(req.query.category)
        .then((data) => {
            //res.json(data);
            res.render('posts', {

                posts : data
            })
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
            res.render('posts', {
                posts : data
            })
        })
    }else{
    blogService.getAllPosts()
    .then((data) => {
        //res.json(data);
        res.render('posts', {
            posts: data
        })
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

app.get("/posts/add", (req, res) =>{
    //res.sendFile(path.join(__dirname, "/views/addPost.html"));
    
    res.render('addPost', {
        layout: 'main'
    });
})

app.get("/posts/:value", (req, res) =>{
    //console.log(req.params.value)
    if(req.params.value){
        blogService.getPostById(req.params.value)
        .then((data) =>{
            res.json(data)
        })
    }
})

app.post("/posts/add",upload.single("featureImage"), (req,res) => {
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

//categories 
app.get("/categories", (req,res) => {
    blogService.getAllCategories().then((data) => {
        //res.json(data);
        res.render('categories', {
            categories: data
        })
     }).catch((err) => {
        //res.json({message: err});
        res.render('categories',{
            message: err
        })
     })
});

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

//NO MATCHING ROUTE
app.use((req,res) => {
    res.status(404).send("Page Not Found");
});

blogService.initialize().then(() =>{
    app.listen(HTTP_PORT, () => {
        console.log('Express HTTP server is listening to the port', HTTP_PORT)
    })
}).catch(() => {
    console.log('Error: Server not started')
})

