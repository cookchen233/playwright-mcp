#!/bin/bash
# playwright-mcp 增强版启动脚本
#
# 功能增强：
# 1. 使用系统 Chrome（--browser chrome）
# 2. 注入增强脚本（--init-page）
# 3. 更短的超时时间（快速失败快速重试）
# 4. 控制台日志级别设为 debug（方便诊断）

DIR="$(cd "$(dirname "$0")" && pwd)"

NODE_BIN="$(command -v node 2>/dev/null || true)"
if [ -z "$NODE_BIN" ] && [ -f "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
  NODE_BIN="$(command -v node 2>/dev/null || true)"
fi
if [ -z "$NODE_BIN" ]; then
  echo "[playwright-enhanced] ERROR: node not found in PATH (and nvm not available)." >&2
  echo "[playwright-enhanced] Hint: configure Windsurf to use an absolute node path, or ensure PATH includes node." >&2
  exit 1
fi

echo "[playwright-enhanced] Starting Playwright Enhanced v1.0.0"
echo "[playwright-enhanced] Features: Uni-app, Element Plus, Smart Retry, Enhanced Diagnostics"

# 直接使用原始 CLI，增强功能通过 init-page 脚本注入
"$NODE_BIN" "$DIR/cli.js" \
  --browser chrome \
  --init-page "$DIR/init-page-enhanced.ts" \
  --timeout-action 5000 \
  --timeout-navigation 30000 \
  --console-level debug \
  "$@"
