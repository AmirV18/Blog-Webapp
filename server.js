/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: ____Amir Vassell_____ Student ID: 154737209 Date: ___October 3, 2022___
*
*  Cyclic Web App URL: ________________________________________________________
*
*  GitHub Repository URL: ______________________________________________________
*
********************************************************************************/ 

var express = require("express"); 
const res = require("express/lib/response")
var app = express(); 
var blogService = require ('./blog-service.js')

var HTTP_PORT = process.env.PORT || 8080;
var path = require("path");

//require blog-service module - can be used to interact with data from server.js
var blogService = require('./blog-service.js')
const { rmSync } = require("fs")

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
app.get("/posts", (req,res) =>{
    blogService.getAllPosts().then((data) => {
        res.json(data);
    }).catch((err) => {
        res.json({message: err});
    })
});

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

