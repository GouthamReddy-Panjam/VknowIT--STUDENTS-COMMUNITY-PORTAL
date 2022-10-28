const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const mongoose = require("mongoose");
const multer = require("multer");
const gridFsStorage = require("multer-gridfs-storage");
const grid = require("gridfs-stream");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto")
const session = require("express-session");
const passport = require("passport").Passport, userpassport = new passport(), adminpassport = new passport();
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.set("view engine", "ejs");

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cookieParser());

app.use(session({
  secret: "This is the little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(adminpassport.initialize());
app.use(adminpassport.session());

app.use(userpassport.initialize());
app.use(userpassport.session());

mongoose.connect("mongodb+srv://admin:nrVecz5KMGGxbB19@cluster0.dstvw.mongodb.net/userDB" || "http://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  name: String,
  username: { //username = email
    type: String,
    require: true,
    unique: true,
    sparse: true
  },
  age: String,
  phoneNumber: String,
  password: String,
  answers: []
});

const adminSchema = new mongoose.Schema({
  name: String,
  username: {
    type: String,
    require: true,
    unique: true,
    sparse: true
  },
  age: Number,
  phoneNumber: Number,
  password: String
});

const questionSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  questiontitle: {
    type: String,
    required: true,
    unique: true
  },
  question: {
    type: String,
    required: true
  },
  questiontags: {
    type: String
  },
  answers: [],
  upvotes: [],
  time: String,
  status: String
}, {
  timestamps: true
});

adminSchema.plugin(passportLocalMongoose);
const Admin = new mongoose.model("Admin", adminSchema);
adminpassport.use(Admin.createStrategy("local"));
adminpassport.serializeUser(function(admin, done) {
  done(null, admin);
});
adminpassport.deserializeUser(function(admin, done) {
  done(null, admin);
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
userpassport.use(User.createStrategy("local"));
userpassport.serializeUser(function(user, done) {
  done(null, user);
});
userpassport.deserializeUser(function(user, done) {
  done(null, user);
});

const Question = new mongoose.model("Question", questionSchema);

var email = "";
var otp = "";

function validateCookie(req, res, next) {
  const {
    cookies
  } = req;
  if ("session_id" in cookies) {
    next();
  } else {
    res.status(403).redirect("/logIn");
  }
}

app.route("/")
  .get(async function(req, res) {
    const {
      cookies
    } = req

    const questions = await Question.find({
      status: "active"
    });

    var count = 0;
    const As = questions[0].answers;
    As.forEach(a => {
      if(a.status == 'active' || a.status == 'Active'){
        count++;
      }
    })

    res.render("home", {
      questions: questions,
      c: count
    });
  })
  .post();

app.route("/user")
  .get(validateCookie, async function(req, res) {
    const {
      cookies
    } = req
    const userName = await User.find({
      username: cookies.session_id
    });
    console.log(userName);

    const question = await Question.find({
      username: userName[0].name
    });

    res.render("user", {
      u: userName,
      q: question
    })
  })
  .post();

app.route("/signUp")
  .get(function(req, res) {
    res.render("loginSignUp.ejs");
  })
  .post(function(req, res) {
    User.register({
      name: req.body.name,
      age: req.body.age,
      username: req.body.username, //username = email
      phoneNumber: req.body.phoneNumber
    }, req.body.password, function(err, user) {
      if (err) {
        res.redirect("/signUp");
      } else {
        userpassport.authenticate("local")(req, res, function() {
          res.redirect("/logIn");
        });
      }
    });
  });

app.route("/logIn")
  .get(function(req, res) {
    res.clearCookie("session_id");
    res.clearCookie("question_id");
    res.render("loginSignUp.ejs");
  })
  .post(function(req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
    req.login(user, function(err) {
      if (err) {} else {
        userpassport.authenticate("local")(req, res, function() {
          res.cookie("session_id", user.username);
          res.redirect("/");
        });
      }
    });
  });

function validateEmailAccessibility(email) {
  return User.findOne({
    email: email
  }).then(function(result) {
    return result !== null;
  });
};
app.route("/forgot-index.html")
  .get(function(req, res) {
    res.render("forgotIndex");
  })
  .post(function(req, res, err) {
    email = req.body.email;
    validateEmailAccessibility(email).then(function(valid) {
      if (valid) {
        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'noreply@codekaroyaaro.com',
            pass: 'Noreply@2021!'
          }
        });
        otp = Math.floor(100000 + Math.random() * 900000)
        var mailOptions = {
          from: 'noreply@codekaroyaaro.com',
          to: email,
          subject: 'OTP for reset password',
          text: 'Kindly use this OTP for resetting your password: ' + otp
        }
        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log("Error: " + error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        res.redirect("/submitOTP");
      } else {
        res.send("Please enter valid email");
      }
    });
  });

app.route("/submitOTP")
  .get(function(req, res) {
    res.render("submitOTP");
  })
  .post(function(req, res, err) {
    otpenetered = req.body.otp;
    if (otp == otpenetered) {
      res.redirect("/resetpassword");
      otp = "";
      otpentered = "";
    } else {
      //console.log(err)
      // res.redirect('/logIn');
    }
  });

app.route("/resetpassword")
  .get(function(req, res) {
    res.render("resetpassword")
  })
  .post(function(req, res, err) {
    email: req.body.email;
    User.findByUsername(email).then(function(sanitizedUser) {
      if (sanitizedUser) {
        sanitizedUser.setPassword(req.body.password, function() {
          sanitizedUser.save();
          res.redirect("/logIn");
        });
      } else {
        res.redirect("/forgot-index.html")
      }
    }, function(err) {});
  });

app.route("/addQuestion")
  .get(validateCookie, function(req, res) {
    res.render("addQuestion");
  })
  .post(async function(req, res) {
    const {
      cookies
    } = req

    const user = await User.findOne({
      username: cookies.session_id
    })

    const dateObj = new Date();

    t = dateObj.toDateString() + " " + dateObj.toTimeString()
    t = t.slice(0, 24);

    const question = new Question({
      questiontitle: req.body.questiontitle,
      question: req.body.editor1,
      questiontags: req.body.questiontag,
      username: user.name,
      time: t,
      status: "active"
    });

    question.save(function(err) {
      if (!err) {
        res.redirect("/addQuestion");
      } else {
        //console.log(err);
      }
    });
  });

app.route("/searchResults")
  .post(async function(req, res) {
    const searchQuestion = req.body.SearchBar
    const question = await Question.find({
      "questiontitle": {
        $regex: searchQuestion
      }
    });
    questions = []
    questions.push(question)
    if (questions[0].length > 0) {
      res.render("searchResults", {
        questions: questions
      });
    } else {
      res.render("nosearchResults")
    }
  });

app.route("/answer/:title")
  .get(async function(req, res) {
    var requestedTitle = req.params.title;
    res.cookie("question_id", requestedTitle);
    questions = []
    questions = await Question.find({
      questiontitle: requestedTitle
    })
    var count = 0;
    const As = questions[0].answers;
    As.forEach(a => {
      if(a.status == 'active' || a.status == 'Active'){
        count++;
      }
    })
    res.render("answers", {
      q: questions,
      c: count
    });
  })
  .post();

app.route("/upvote/:title")
  .get(validateCookie,async function(req, res) {
    var requestedTitle = req.params.title;
    console.log(requestedTitle);
    questions = []
    questions = await Question.find({
      questiontitle: requestedTitle
    })

    const {
      cookies
    } = req

    upv = questions[0].upvotes

    varFound = false;
    for (let i = 0; i < upv.length; i++) {
      if (upv[i].username === cookies.session_id) {
        varFound = true
      }
    }

    if (varFound) {
      await Question.updateOne({
        questiontitle: requestedTitle
      }, {
        $pull: {
          "upvotes": {
            username: cookies.session_id
          }
        }
      });
    } else {
      await Question.updateOne({
        questiontitle: requestedTitle
      }, {
        $push: {
          "upvotes": {
            username: cookies.session_id
          }
        }
      });
    }

    questions = await Question.find({
      questiontitle: requestedTitle
    });

    upv = questions[0].upvotes

    console.log(upv);

    res.redirect("/");
  });

app.route("/postanswers")
  .get(validateCookie, function(req, res) {
    res.render("postanswers")
  })
  .post(async function(req, res) {
    const {
      cookies
    } = req
    console.log(cookies);

    const user = await User.findOne({
      username: cookies.session_id
    })

    const dateObj = new Date();
    t = dateObj.toDateString() + " " + dateObj.toTimeString()
    t = t.slice(0, 24);

    var answer = req.body.editor1;

    await Question.updateOne({
      questiontitle: cookies.question_id
    }, {
      $push: {
        "answers": {
          username: user.name,
          answer: answer,
          time: t,
          status: "active"
        }
      }
    });

    await User.updateOne({
      username: cookies.session_id
    }, {
      $push: {
        "answers": {
          username: user.name
        }
      }
    });

    res.redirect("/");
  });

app.route("/unanswered")
  .get(async function(req, res) {
    const question = await Question.find({
      $and: [{
          answers: []
        },
        {
          status: "active"
        }
      ]
    });

    if (question.length != 0) {
      questions = []
      questions.push(question)
      res.render("unanswered", {
        questions: questions
      });
    } else {
      res.render("answered");
    }
  })
  .post()

app.route("/latest")
  .get(async function(req, res) {
    questions = []
    questions = await Question.find({
      status: "active"
    }).sort({
      '_id': -1
    });

    res.render("latest", {
      q: questions
    });
  })
  .post()

app.route("/contributors")
  .get(function(req, res) {
    res.render("contributors");
  });

app.route("/adminPage")
  .get(async function(req, res) {
    const question = await Question.find({
      status: "active"
    });
    questions = []
    questions.push(question)
    // console.log("\n active Questions \n" + question)

    res.render("activeQues", {
      questions: questions
    });
  })
  .post();

app.route("/admin/answer/:title")
  .get(async function(req, res) {
    var requestedTitle = req.params.title;
    res.cookie("question_id", requestedTitle);
    questions = []
    questions = await Question.find({
      questiontitle: requestedTitle
    })
    res.render("activeAnswers", {
      q: questions
    });
  })
  .post();

app.route("/disabledQues")
  .get(async function(req, res) {
    const question = await Question.find({
      status: "disable"
    });
    questions = []
    questions.push(question)
    // console.log("\n disabled Questions \n" + question)
    res.render("disableQues", {
      questions: questions
    })
  })
  .post();

app.route("/updateStatusToDisable/:title")
  .get(async function(req, res) {
    var reqTitle = req.params.title;
    console.log(reqTitle)
    await Question.updateOne({
      questiontitle: reqTitle
    }, {
      $set: {
        status: "disable"
      }
    })
    res.redirect("/adminPage")
  })
  .post();

app.route("/updateAnswerToDisable/:title")
  .get(async function(req, res) {
    var reqTitle = req.params.title;
    console.log(reqTitle)
    const{
      cookies
    } = req
    var question = await Question.find({
      questiontitle: cookies.question_id
    })
    var As = question[0].answers;

    As.forEach(answer =>{
      if(answer.time == reqTitle){
        answer.status = 'deactive'
      }
    })
    console.log("local"+As)
    await Question.updateOne({
      questiontitle: cookies.question_id
    },{$set:{
      answers: As
    }})

    question = await Question.find({
      questiontitle: cookies.question_id
    })
    As = question[0].answers;

    console.log(As)

    res.redirect("/adminPage")
  })
  .post();

  app.route("/updateAnswerToActive/:title")
  .get(async function(req, res) {
    var reqTitle = req.params.title;
    console.log(reqTitle)
    const{
      cookies
    } = req
    var question = await Question.find({
      questiontitle: cookies.question_id
    })
    var As = question[0].answers;

    As.forEach(answer =>{
      if(answer.time == reqTitle){
        answer.status = 'active'
      }
    })
    console.log("local"+As)
    await Question.updateOne({
      questiontitle: cookies.question_id
    },{$set:{
      answers: As
    }})

    question = await Question.find({
      questiontitle: cookies.question_id
    })
    As = question[0].answers;

    console.log(As)

    res.redirect("/adminPage")
  })
  .post();

app.route("/updateStatusToActive/:title")
  .get(async function(req, res) {
    var reqTitle = req.params.title;
    console.log(reqTitle)

    await Question.update({
      questiontitle: reqTitle
    }, {
      $set: {
        status: "active"
      }
    })

    res.redirect("/disabledQues")
  })
  .post();

app.route("/adminLogin")
  .get(function(req, res) {
    res.clearCookie("session_id");
    res.render("adminLogin");
  })
  .post(function(req, res) {
    const admin = new Admin({
      username: req.body.username,
      password: req.body.password
    });
    req.login(admin, function(err) {
      if (err) {} else {
        adminpassport.authenticate("local")(req, res, function() {
          res.cookie("session_id", admin.username)
          res.redirect("/adminPage");
        });
      }
    });
  });

app.route("/adminSignUp")
  .get(function(req, res) {
    res.render("adminSignup");
  })
  .post(function(req, res) {
    Admin.register({
      name: req.body.name,
      age: req.body.age,
      username: req.body.username, //username = email
      phoneNumber: req.body.phoneNumber
    }, req.body.password, function(err, admin) {
      if (err) {
        console.log(err);
        res.redirect("/adminSignUp");
      } else {
        adminpassport.authenticate("local")(req, res, function() {
          res.redirect("/adminLogin");
        });
      }
    });
  })

app.route("/admin/postanswers")
  .get(validateCookie, function(req, res) {
    res.render("adminPostAnswer");
  })
  .post(async function(req, res) {
    const {
      cookies
    } = req
    console.log(cookies);

    const user = await User.findOne({
      username: cookies.session_id
    })

    const dateObj = new Date();
    t = dateObj.toDateString() + " " + dateObj.toTimeString()
    t = t.slice(0, 24);

    var answer = req.body.editor1;

    await Question.updateOne({
      questiontitle: cookies.question_id
    }, {
      $push: {
        "answers": {
          username: user.name,
          answer: answer,
          time: t,
          status: "active"
        }
      }
    });

    await User.updateOne({
      username: cookies.session_id
    }, {
      $push: {
        "answers": {
          username: user.name
        }
      }
    });

    res.redirect("/adminPage");
  });


app.route("/contributors")
  .get(function(req, res) {
    res.render("contributors");
  });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.")
})
