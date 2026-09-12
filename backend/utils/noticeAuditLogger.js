const fs = require("fs");
const path = require("path");

const LOG_PATH = process.env.NOTICE_LOG_PATH
  ? path.resolve(process.env.NOTICE_LOG_PATH)
  : path.join(__dirname, "..", "..", "notice_logs.txt");

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const extractNoticeForLog = (noticeLike) => {
  if (!noticeLike) return null;

  const notice =
    typeof noticeLike.toObject === "function"
      ? noticeLike.toObject({ depopulate: true })
      : noticeLike;

  return {
    id: notice._id ? String(notice._id) : notice.id ? String(notice.id) : null,
    title: typeof notice.title === "string" ? notice.title : "",
    content:
      typeof notice.content === "string"
        ? notice.content
        : typeof notice.description === "string"
          ? notice.description
          : "",
    category: typeof notice.category === "string" ? notice.category : "",
    priority: typeof notice.priority === "string" ? notice.priority : "",
    isPinned: Boolean(notice.isPinned),
    expiryDate: toIsoOrNull(notice.expiryDate),
    image: typeof notice.image === "string" ? notice.image : "",
    createdBy: notice.createdBy ? String(notice.createdBy) : null,
    postedBy: notice.postedBy ? String(notice.postedBy) : null,
    createdAt: toIsoOrNull(notice.createdAt),
    updatedAt: toIsoOrNull(notice.updatedAt)
  };
};

const getRequestIp = (req) => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string" && xForwardedFor.trim()) {
    return xForwardedFor.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || null;
};

const resolveActor = async (req, UserModel) => {
  const actor = {
    id: req.user?.id ? String(req.user.id) : null,
    role: req.user?.role ? String(req.user.role) : null
  };

  if (!UserModel || !actor.id) return actor;

  try {
    const user = await UserModel.findById(actor.id).select(
      "name username email role"
    );
    if (!user) return actor;

    return {
      id: actor.id,
      role: user.role || actor.role || null,
      name: user.name || "",
      username: user.username || "",
      email: user.email || ""
    };
  } catch {
    return actor;
  }
};

const logNoticeChange = async ({
  action,
  req,
  noticeBefore,
  noticeAfter,
  meta,
  UserModel
}) => {
  try {
    const timestamp = new Date().toISOString();
    const actor = await resolveActor(req, UserModel);
    const before = extractNoticeForLog(noticeBefore);
    const after = extractNoticeForLog(noticeAfter);

    const entry = {
      timestamp,
      action,
      actor,
      noticeId: after?.id || before?.id || null,
      before,
      after,
      request: {
        method: req.method,
        path: req.originalUrl,
        ip: getRequestIp(req),
        userAgent: req.headers["user-agent"] || ""
      },
      meta: meta || {}
    };

    void fs.promises.appendFile(LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (err) {
    console.error("Failed to write notice audit log:", err?.message || err);
  }
};

module.exports = {
  extractNoticeForLog,
  logNoticeChange,
  getNoticeLogPath: () => LOG_PATH
};

