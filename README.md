# Aussie Learning

用于学习澳洲英语单词、词组和句子的 Node.js 单页应用基础框架。

## 本地启动

环境要求：Node.js 20.17.0 或更高版本。

```bash
npm install
npm start
```

浏览器打开 `http://localhost:3000`。首次启动会在项目根目录自动创建 `aussieLearning.db`，并创建管理员账号：

- 用户名：`admin`
- 密码：`admin`

开发时可使用自动重启模式：

```bash
npm run dev
```

## 学习数据

项目包含可重复运行的完整学习数据种子脚本：

```bash
npm run seed
```

脚本会为 Level 1—5 各准备 200 条内容，每级包含 100 个单词、50 个词组和 50 个句子，共 1,000 条。Level 1 从大学英语六级/B2 难度起步，之后逐级提升至 C2 与学术表达。脚本会按等级、类型和英文内容检查已有记录，因此重复运行不会重复插入。

## 环境变量

生产环境必须配置长随机会话密钥：

```bash
export NODE_ENV=production
export PORT=3000
export SESSION_SECRET="替换为长随机字符串"
npm start
```

生产模式会启用安全 Cookie，因此在 EC2 上应通过带 HTTPS 的 Nginx 或 Application Load Balancer 访问本服务。

## API

### 用户认证

- `GET /api/auth/captcha`：生成登录或注册使用的一次性加法验证码
- `POST /api/auth/register`：注册
- `POST /api/auth/login`：登录
- `POST /api/auth/logout`：登出
- `GET /api/auth/me`：获取当前用户

注册和登录请求体：

```json
{
  "username": "learner01",
  "password": "securePassword",
  "captchaAnswer": 5
}
```

登录和注册前必须先请求验证码。验证码答案保存在服务端会话中，每次登录或注册尝试后立即失效。

### 管理员内容管理

- `GET /api/admin/terms`：内容列表
- `GET /api/admin/terms/:id`：内容详情
- `POST /api/admin/terms`：添加内容
- `PUT /api/admin/terms/:id`：更新内容
- `DELETE /api/admin/terms/:id`：删除内容

添加和更新请求体：

```json
{
  "termContent": "arvo",
  "meaning": "下午",
  "example": "See you this arvo!",
  "termType": "word",
  "level": 1
}
```

### 普通用户学习内容

- `GET /api/learning/levels/:level/terms`：获取指定已解锁等级的全部学习内容
- `GET /api/learning/progress`：获取当前用户各等级的学习或测验进度
- `GET /api/learning/levels/:level/session`：创建或恢复指定等级的学习会话
- `POST /api/learning/levels/:level/navigate`：保存“上一个”或“下一个”的位置
- `POST /api/learning/levels/:level/quiz/answer`：提交并保存当前测验答案
- `POST /api/learning/levels/:level/quiz/retry`：未达到 70% 时重新生成本批测验
- `POST /api/learning/levels/:level/quiz/continue`：通过测验后进入下一批内容
- `POST /api/quiz/submit`：兼容旧客户端的独立测验结算与掌握记录接口
- `GET /api/mastery`：获取当前用户已掌握的全部澳洲表达

学习内容会为每位用户、每个 Level 单独生成并保存随机顺序。每批学习 20 条内容，然后从本批随机抽取 10 条进行选择题测验；准确率达到 70% 才能进入下一批。完成最后一批后才会解锁下一级。学习位置、测验题目、选项、当前题号和结果都保存在 `userLearningProgress` 中。

测验结算请求体：

```json
{
  "level": 1,
  "totalQuestions": 10,
  "correctTermIds": [1, 2, 3, 4, 5, 6, 7, 8]
}
```

旧结算接口会校验并去重 `correctTermIds`，将有效条目逐条写入 `userMastery`，但等级解锁只由完整的分批学习流程处理。

## EC2 部署要点

1. 使用 Ubuntu 或 Amazon Linux EC2，并安装 Node.js 20.17.0 以上版本。
2. 将项目放到固定目录，执行 `npm ci --omit=dev`。
3. 设置 `NODE_ENV`、`PORT` 和 `SESSION_SECRET`，使用 systemd 或 PM2 守护 `npm start`。
4. 将项目目录及 `aussieLearning.db` 所在目录的写权限授予运行服务的系统用户。
5. 在安全组中仅开放 SSH、HTTP 和 HTTPS；端口 3000 只向反向代理开放。
6. 使用 Nginx 或 Application Load Balancer 转发到 `127.0.0.1:3000`，并配置 HTTPS。
7. 定期备份 `aussieLearning.db`；备份前应安排短暂停写或使用 SQLite 在线备份方式。
