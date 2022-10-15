/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
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


//STATIC ROUTE
app.use(express.static("public"));

//REDIRECTING ROUTE
app.get("/", (req, res) => {
    res.redirect('/about');
});

//about route 
app.get("/about", (req,res) => {
    res.sendFile(path.join(__dirname, "/views/about.html"));
});



// posts 
app.get("/posts", (req,res) =>{ //UPDATE

    if(req.query.category){
        blogService.getPostByCategory(req.query.category).then((data) => {
            res.json(data);
        })
    }else if(req.query.minDate){
        blogService.getPostsByMinDate(req.category.minDate).then((data)=>{
            res.json(data);
        })
    }else{
    blogService.getAllPosts().then((data) => {
        res.json(data);
    }).catch((err) => {
        res.json({message: err});
    })
    }
    //
})

app.get("/posts/add", (req, res) =>{
    res.sendFile(path.join(__dirname, "/views/addPost.html"));
})

app.get("/post/value", (req, res) =>{
    if(req.query.id){
        blogService.getPostById(req.query.id).then((data) =>{
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
        res.json(data);
     }).catch((err) => {
        res.json({message: err});
     })
});

//blog 
app.get("/blog", (req,res) =>{
    blogService.getAllCategories().then((data) => {
        res.json(data);
    }).catch((err) => {
        res.json({message: err});
    })
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

