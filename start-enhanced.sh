#!/bin/bash
# playwright-mcp 增强版启动脚本
# 
# 功能增强：
# 1. 使用系统 Chrome（--browser chrome）
# 2. 注入增强脚本（--init-page）
# 3. 更短的超时时间（快速失败快速重试）
# 4. 控制台日志级别设为 debug（方便诊断）

DIR="$(cd "$(dirname "$0")" && pwd)"

node "$DIR/cli.js" \
  --browser chrome \
  --init-page "$DIR/init-page-enhanced.ts" \
  --timeout-action 5000 \
  --timeout-navigation 30000 \
  --console-level debug \
  "$@"
