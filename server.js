var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require('express-handlebars');
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var PORT = 3000;
var app = express();
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static("public"));
mongoose.connect("mongodb://localhost/homework");
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");
app.get("/", function (req, res) {
    db.Article.find({}, function (err, data) {
        if (err) throw err;
        res.render("index", {
            results: data
        });
    })
})
app.get("/scrape", function (req, res) {
    axios.get("https://www.nytimes.com/").then(function (response) {
        var $ = cheerio.load(response.data);
        $("div.css-6p6lnl").each(function (i, element) {
            var result = {};
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
            db.Article.create(result)
                .then(function (dbArticle) {
                    res.redirect("/");
                })
        });
    });
});
app.get("/api/delete", function (req, res) {
    db.Article.remove({}, function (err, data) {
        if (err) throw err;
        db.Comment.remove({}, function (err, data) {
            if (err) throw err;
            res.redirect("/");
        })
    })
});
app.get("/api/commented", function (req, res) {
    db.Comment.find({}, function (err, data) {
        if (err) throw err;
        var articles = []
        for (var i = 0; i < data.length; i++) {
            var comment = data[i];
            var art = [];
            db.Article.find({
                _id: comment.articleId
            }, function (err, d) {
                d["comment"] = (comment)
                console.log("NEW", d);
                art.push(d);
            });
            console.log(art)
            articles = art;
        }
        console.log("Articles" + articles);
        res.render("comment", {
            results: articles
        });
    })
});
app.post("/api/commented", function (req, res) {
    db.Comment.create({
        body: req.body.data,
        articleId: req.body.id
    }, function (err, data) {
        if (err) throw err;
        res.json(data)
    });
});
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});