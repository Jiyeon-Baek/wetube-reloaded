import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import { registerView } from "./controllers/videoController";

const s3 = new aws.S3({
  credentials: {
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

//aws를 heroku에서 사용할때만
//const isHeroku = process.env.NODE_ENV === "production"

const s3ImageUploader = multerS3({
  s3: s3,
  bucket: "wetube-reloaded-jy/images",
  acl: "public-read",
});

const s3VideoUploader = multerS3({
  s3: s3,
  bucket: "wetube-reloaded-jy/videos",
  acl: "public-read",
});

export const localsMiddleware = (req, res, next) => {
  //Use var in pug file

  res.locals.loggedIn = Boolean(req.session.loggedIn);
  res.locals.siteName = "Wetube";
  res.locals.loggedInUser = req.session.user || {};
  console.log(res.locals.loggedInUser);
  // res.locals.isHeroku = isHeroku;

  next();
};

export const protectorMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "Log in first.");
    return res.redirect("/login");
  }
};

export const publicOnlyMiddleware = (req, res, next) => {
  if (!req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "Not authorized");
    return res.redirect("/");
  }
};

export const avatarUpload = multer({
  dest: "uploads/avatars/",
  limits: {
    fileSize: 3000000,
  },
  storage: s3ImageUploader,
  // storage: isHeroku ? s3ImageUploader : undefined,
});

export const videoUpload = multer({
  dest: "uploads/videos",
  limits: {
    fileSize: 10000000,
  },
  storage: s3VideoUploader,
  // storage: isHeroku ? s3VideoUploader : undefined,
});
