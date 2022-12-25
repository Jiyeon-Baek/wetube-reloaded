import Video, { formatHashtags } from "../models/Video";
import User from "../models/User";
import Comment from "../models/Comment";

export const home = async (req, res) => {
  // home
  // //logger should be after the action, but db is slow so logger comes first
  // Video.find({}, (error, videos) => {
  //   console.log("error : ", error);
  //   console.log("videos: ", videos);
  // }); // empty : search everything
  const videos = await Video.find({})
    .sort({ createdAt: "desc" })
    .populate("owner");

  return res.render("home", { pageTitle: "Home", videos });
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id).populate("owner").populate("comments");

  if (!video) {
    return res.render("404", { pageTitle: "Video not found." });
  }
  return res.render("watch", {
    pageTitle: video.title,
    video,
  });
};

export const getEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  //const id = req.params.id
  if (!video) {
    return res.render("404", { pageTitle: "Video not found." });
  }

  if (String(video.owner) !== String(req.session.user._id)) {
    req.flash("error", "Not authorized");
    return res.status(403).redirect("/");
  }
  return res.render("edit", {
    pageTitle: `Edit: ${video.title}`,
    video,
  });
};

export const postEdit = async (req, res) => {
  const { id } = req.params; //:id
  const {
    user: { _id },
  } = req.session;
  const { title, description, hashtags } = req.body;
  const video = await Video.exists({ _id: id });

  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }

  if (String(video.owner) !== String(req.session.user._id)) {
    req.flash("error", "You are not the the owner of the video.");
    return res.status(403).redirect("/");
  }

  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  }); //word.startsWith('#' ? word : `#${word}`)
  req.flash("success", "Changes saved.");
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "Upload Video" });
};

export const postUpload = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { video, thumb } = req.files;
  //we will add a video to the videos array
  const { title, description, hashtags } = req.body;

  //const isHeroku=process.env.NODE_ENV === "production"
  try {
    const newVideo = await Video.create({
      title,
      description,
      // fileUrl: isHeroku ? video[0].location : video[0].path,
      fileUrl: video[0].location,
      // thumbUrl: isHeroku ? thumb[0].location : thumb[0].path,
      thumbUrl: thumb[0].location,
      owner: _id,
      hashtags: Video.formatHashtags(hashtags),
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(400).render("upload", {
      pageTitle: "Upload Video",
      errorMessage: error._message,
    });
  }
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  //delete vs remove - use delete
  const video = await Video.findById(id);

  if (String(video.owner) !== String(req.session.user._id)) {
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndDelete(id);
  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: new RegExp(`${keyword}`, "i"), //i: low&up
      },
    }).populate("owner");
    // return res.render("search", { pageTitle: "Search", videos });
  }

  return res.render("search", { pageTitle: "Search", videos });
};

export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views = video.meta.views + 1;
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const {
    session: { user },
    body: { text },
    params: { id },
  } = req;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  const comment = await Comment.create({
    text,
    owner: user._id,
    video: id,
  });
  video.comments.push(comment._id);
  video.save();

  return res.status(201).json({ newCommentId: comment._id });
};

export const deleteComment = async (req, res) => {
  const {
    params: { id: commentId },
  } = req;
  const {
    session: {
      user: { _id: userId },
    },
  } = req;
  const comment = await Comment.findById(commentId)
    .populate("owner")
    .populate("video");
  const video = comment.video;
  const user = await User.findById(userId);

  // 현재 로그인 된 유저의 아이디와 댓글 소유쥬 아이디 같은가?
  if (String(userId) !== String(comment.owner._id)) {
    return res.sendStatus(404);
  }
  if (!video) {
    return res.sendStatus(404);
  }

  //댓글 삭제, 비디오에서 댓글 배열 삭제, 유저에서 댓글 배열 삭제
  user.comments.splice(user.comments.indexOf(commentId), 1);
  await user.save();
  video.comments.splice(video.comments.indexOf(commentId), 1);
  await video.save();
  await Comment.findByIdAndRemove(commentId);

  return res.status(200);
};
