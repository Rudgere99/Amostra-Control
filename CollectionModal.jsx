.api-status-bar {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  padding: 11px 15px;
  border: 1px solid rgba(148, 163, 184, .18);
  border-radius: 999px;
  background: rgba(15, 23, 42, .62);
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(14px);
}

.api-status-bar--with-user {
  flex-wrap: wrap;
}

.api-status-bar--with-user strong {
  color: var(--text);
  margin-left: 8px;
}

.api-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--orange);
  box-shadow: 0 0 0 5px rgba(245, 158, 11, .14);
}

.api-dot--ok {
  background: var(--green);
  box-shadow: 0 0 0 5px rgba(34, 197, 94, .14);
}

.mini-link {
  border: 0;
  background: transparent;
  color: var(--blue-soft);
  font-weight: 900;
  padding: 0 4px;
}

.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, .22), transparent 34%),
    var(--bg);
}

.login-card {
  width: min(480px, 100%);
  background: linear-gradient(160deg, rgba(15, 23, 42, .92), rgba(30, 41, 59, .76));
  border: 1px solid var(--border);
  border-radius: 26px;
  padding: 28px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.login-brand h1 {
  margin: 0;
  font-size: 24px;
}

.login-brand h1 span {
  color: var(--orange);
}

.login-brand p,
.login-title p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.login-title {
  margin: 24px 0 18px;
}

.login-title h2 {
  margin: 6px 0;
  font-size: 30px;
  letter-spacing: -.05em;
}

.login-form {
  display: grid;
  gap: 14px;
}

.login-button {
  width: 100%;
  justify-content: center;
  margin-top: 4px;
}

.login-status {
  margin-top: 18px;
  margin-bottom: 0;
}
