import express from "express";
import morgan from "morgan";
import session from "express-session";
import rootRouter from "./routers/rootRouter";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import apiRouter from "./routers/apiRouter";
import { localsMiddleware } from "./middlewares";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import flash from "express-flash";

const app = express();
const logger = morgan("dev");

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Orinn", "*");
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  res.header("Cross-Origin-Embedder-Policy", "credentialless");
  res.header("Access-Control-Allow-Headers");
  res.header("Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(flash());
app.use(localsMiddleware);
app.use("/uploads", express.static("uploads"));
app.use("/static", express.static("assets"));
app.use("/", rootRouter);
app.use("/videos", videoRouter);
app.use("/users", userRouter);
app.use("/api", apiRouter);

export default app;
