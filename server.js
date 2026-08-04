const path = require("path");
const express = require("express");
const session = require("express-session");
const database = require("./db");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const learningRoutes = require("./src/routes/learningRoutes");
const masteryRoutes = require("./src/routes/masteryRoutes");
const quizRoutes = require("./src/routes/quizRoutes");
const SqliteSessionStore = require("./src/repositories/sessionStore");
const passwordService = require("./src/services/passwordService");
const userRepository = require("./src/repositories/userRepository");

const app = express();
const port = Number(process.env.PORT) || 3000;
const productionMode = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || "development-only-change-this-secret";

if (productionMode && !process.env.SESSION_SECRET) {
  throw new Error("生产环境必须设置 SESSION_SECRET");
}

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(
  session({
    name: "aussieLearningSession",
    secret: sessionSecret,
    store: new SqliteSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: productionMode
    }
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/mastery", masteryRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api", (request, response) => {
  response.status(404).json({ message: "接口不存在" });
});
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (request, response) => {
  response.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((error, request, response, next) => {
  console.error(error);
  if (response.headersSent) {
    next(error);
    return;
  }

  response.status(500).json({ message: "服务器暂时无法处理请求" });
});

async function seedAdmin() {
  const existingAdmin = await userRepository.findUserWithPassword("admin");
  if (existingAdmin) {
    return;
  }

  const password = await passwordService.hashPassword("admin");
  await userRepository.createUser("admin", password, "admin");
}

async function startServer() {
  await database.initializeDatabase();
  await seedAdmin();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Aussie Learning 已启动：http://localhost:${port}`);
    console.log(`SQLite 数据库：${database.databasePath}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("服务启动失败", error);
    process.exit(1);
  });
}

module.exports = { app, startServer };
