var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs  = require('express-handlebars');

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/homework");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


// Routes
app.get("/", function(req, res){
    db.Article.find({}, function(err, data) {
        if (err) throw err;
        res.render("index", {results: data});
    })
})
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    axios.get("https://www.nytimes.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // Now, we grab every h2 within an article tag, and do the following:
    $("div.css-6p6lnl").each(function(i, element) {
      // Save an empty result object
      var result = {};
        
      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .find("div.css-k8gosa.esl82me3")
        .text();
      result.summary = $(this)
        .find("p.e1n8kpyg0")
        .text();        
      result.link = $(this)
        .find("a")
        .attr("href");
        console.log(result.summary)
      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {

          res.redirect("/");
        })
    });
    });
});

app.get("/api/delete", function(req, res) {
    db.Article.remove({}, function(err, data) {
        if (err) throw err;
        db.Comment.remove({}, function(err, data) {
            if (err) throw err;
            res.redirect("/");
        })
    })
});

app.get("/api/commented", function(req, res) {
    db.Comment.find({}, function(err, data) {
        if (err) throw err;
        
        var articles = []
        for (var i = 0; i < data.length; i++) {
            var comment = data[i];
            var art = [];
            db.Article.find({_id: comment.articleId}, function(err, d) {
                // console.log("d" + d);
                // console.log("i" + comment)
                d["comment"] = (comment)
                console.log("NEW", d);
                art.push(d);
            });
            console.log(art)
            articles = art;
        }
        console.log("Articles" + articles);

        res.render("comment", {results: articles});
    })
});

app.post("/api/commented", function(req, res) {
    
    db.Comment.create({body: req.body.data, articleId: req.body.id}, function(err, data) {
        if(err) throw err;
        res.json(data)
    });
});

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});