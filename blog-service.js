const Sequelize = require('sequelize');

const user_and_default_database = "akrbtfvq";
const password_for_postgres = "3fOApTKNRCmEvoL4iU-jpmk28qnI0hMV";
const server_for_postgres = "jelani.db.elephantsql.com";
// set up sequelize to point to our postgres database
var sequelize = new Sequelize(user_and_default_database, user_and_default_database, password_for_postgres, {
    host: server_for_postgres,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

var Post = sequelize.define("Post", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN
});

var Category = sequelize.define("Category", {
  category: Sequelize.STRING
});

Post.belongsTo(Category, {foreignKey: 'category'});

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(() =>{
        console.log("DATABASE SYNC SUCCESSFUL");
        resolve();
    }).catch((err) => {
        console.log("DATABASE SYNC FAILED: " + err);
        reject("Unable to sync database");
    })
  });
};

module.exports.getAllPosts = function () {
  return new Promise((resolve, reject) => {
    Post.findAll().then((postData) => {
        console.log(postData)
        resolve(postData);
    }).catch((err) => {
        reject("No results returned" + err);
    })
  });
};

module.exports.getPublishedPosts = function () {
   return new Promise((resolve, reject) => {
    Post.findAll({
        where: {
            published: true
        }
    }).then((publishedPostData) => {
        resolve(publishedPostData);
    }).catch((err) => {
        reject("No published posts found" + err);
    })
  });
};

module.exports.getAllCategories = function () {
    return new Promise((resolve, reject) => {
    Category.findAll().then((categoryData) => {
        resolve(categoryData);
    }).catch((err) => {
        reject("No results returned" + err);
    })
  });
};

//Adding a new post
module.exports.addPost = (postData) => {
   return new Promise((resolve, reject) => {
    
    postData.published = (postData.published) ? true : false;
    for (key in postData) {
       if(postData.key == ""){
        postData.key = null;
       }
    }
    postData.postDate = new Date();

    Post.create(postData)
    .then(() =>{
        resolve();
    })
    .catch(() =>{
        reject("Unable to create post");
    })
  });
};

//Grabbing a new post by category
module.exports.getPostsByCategory = (id) => {
   return new Promise((resolve, reject) => {
    Post.findAll({
        where: {
            category: id
        }
    }).then((categoryData) => {
        resolve(categoryData);
    }).catch((err) => {
        reject("No category found" + err);
    })
  });
};

module.exports.getPostsByMinDate = (minDateStr) => {
  return new Promise((resolve, reject) => {
    const { gte } = Sequelize.Op;

    Post.findAll({
      where: {
        postDate: {
          [gte]: new Date(minDateStr),
        }
      }
    }).then((posts) => {
        resolve(posts);
    }).catch((err) => {
        reject("No results returned: " + err);
    })
  });
};

module.exports.getPostById = (id) => {
  return new Promise((resolve, reject) => {
    Post.findAll({
        where: {
            id: id
        }
    }).then((postData) => {
        resolve(postData[0]);
    }).catch((err) => {
        reject("No post found" + err);
    })
  });
};

module.exports.getPublishedPostsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Post.findAll({
        where: {
            published: true,
            category : category
        }
    }).then((categoryData) => {
        console.log(categoryData)
        resolve(categoryData);
    }).catch((err) => {
        reject("No published posts found in this category" + err);
    })
  });
};

module.exports.addCategory = (categoryData) => {
    return new Promise((resolve, reject) => {
      for (key in categoryData) {
         if(categoryData.key == ""){
          categoryData.key = null;
         }
      }
  
      Category.create(categoryData)
      .then(() =>{
          resolve();
      })
      .catch(() =>{
          reject("Unable to create category");
      })
    });
  };

  module.exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: {
                id: id
            }
        }).then(() =>{
            resolve();
        }).catch((err)=>{
            console.log("Category deletion error. Error: " + err);
            reject();
        })
    });
  };

  module.exports.deletePostById = (id) => {
    return new Promise((resolve, reject) => {
        Post.destroy({
            where: {
                id: id
            }
        }).then(() =>{
            resolve();
        }).catch((err)=>{
            console.log("Post deletion error. Error: " + err);
            reject();
        })
    });
  };