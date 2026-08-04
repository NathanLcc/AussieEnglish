async function request(path, options = {}) {
  const requestOptions = {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" }
  };

  if (options.body !== undefined) {
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(path, requestOptions);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({ message: "服务器返回了无法识别的内容" }));
  if (!response.ok) {
    const error = new Error(data.message || "请求失败");
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  get(path) {
    return request(path);
  },
  post(path, body) {
    return request(path, { method: "POST", body });
  },
  put(path, body) {
    return request(path, { method: "PUT", body });
  },
  delete(path) {
    return request(path, { method: "DELETE" });
  }
};
