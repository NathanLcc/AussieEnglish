function requireLogin(request, response, next) {
  if (!request.session.user) {
    response.status(401).json({ message: "请先登录" });
    return;
  }

  next();
}

function requireAdmin(request, response, next) {
  if (!request.session.user) {
    response.status(401).json({ message: "请先登录" });
    return;
  }

  if (request.session.user.role !== "admin") {
    response.status(403).json({ message: "需要管理员权限" });
    return;
  }

  next();
}

module.exports = { requireAdmin, requireLogin };
