const fs = require("fs"); // required at the top of your module

//globally declared 
var posts = []
var categories = []

//exported functions - initialize 

module.exports.initialize = function(){
    return new Promise(function(resolve, reject){
        fs.readFile("./data/posts.json", 'utf8', (err, data) =>{
            if (err) reject("unable to read file");
            posts = JSON.parse(data);
            resolve(data)
        })

        fs.readFile("./data/categories.json", 'utf8', (err, data) => {
            if (err) reject("unable to read file");
            categories = JSON.parse(data);
            resolve(data) 
        })
    })
}

// getAllPosts()

module.exports.getAllPosts = function(){
    return new Promise(function(resolve, reject){
        if(posts.length === 0) reject("no results returned");
        resolve(posts)
    })
}

//getPublishedPosts()
module.exports.getPublishedPosts = function(){
    return new Promise(function(resolve, reject){
        var publishedPosts = []
        let i = 0
        do {
            if(posts[i].published === true){
                publishedPosts.push(posts[i])
            }
            i++
        } while (i!=posts.length)

        if(publishedPosts.length === 0) {
             reject("no results returned")
        }
       
        resolve(publishedPosts)
    })
}

//getAllCategories()

module.exports.getAllCategories = function() {
    return new Promise(function(resolve, reject){
        if(categories.length === 0) reject("no results returned");
        resolve(categories)
    })
}

//Adding a new post
module.exports.addPost = (postData) => {
    return new Promise((resolve, reject) => {
        if(posts) {
            if(postData.published == null){
                postData.published = false;
            }else{
                postData.published = true;
            }
            postData.id = posts.length + 1;
            let currentDate = new Date().toJSON().slice(0,10);
            postData.postDate = currentDate;
            posts.push(postData);
            resolve(postData);
        }else{
            console.log("Post not available!");
            reject()
        }
    })
}

//Grabbing a new post by category
module.exports.getPostsByCategory = (category) =>{
    return new Promise((resolve, reject) => {
        const categoryPosts = posts.filter((post) => {
            return post.category == category;
        })

        categoryPosts.length > 0 ? resolve(categoryPosts) : reject("no results returned");
        // let categoryPosts = [];

        // for(let i = 0; i < posts.length; i++){
        //     //var post;
        //     if (categoryPosts[i].category == category){
        //         categoryPosts[i] = posts[i];
        //     }
        // }

        // if(categoryPosts){
        //     resolve(categoryPosts);
        // }else{
        //     reject("No posts not found");
        // }

    })
}

module.exports.getPostsByMinDate = (minDateStr) =>{
    return new Promise((resolve, reject) => {
        const minDatePosts = posts.filter((post) => {
            return new Date(post.postDate) >= new Date(minDateStr);
        })

        minDatePosts.length > 0 ? resolve(minDatePosts) : reject("no results returned");
    })
}

module.exports.getPostById = (id) =>{
    return new Promise((resolve, reject) => {
        for(let i = 0; i < posts.length; i++){
            var post;
            if (posts[i].id == id){
                post = posts[i];
            }
        }

        if(post){
            resolve(post);
        }else{
            reject("Post not found");
        }

        
    })
}

module.exports.getPublishedPostsByCategory = (category) =>{
    return new Promise(function(resolve, reject){
        var publishedPostsByCategory =  [];

        for(let i = 0; i < posts.length; i++){
            if(posts[i].published == true && posts[i].category == category){
                publishedPostsByCategory.push(posts[i]);
        }
    }


        if(publishedPostsByCategory.length === 0) {
            reject("no results returned")
       }
      
       resolve(publishedPostsByCategory);
    })
}

