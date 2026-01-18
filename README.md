# Playwright MCP 增强版

基于 Microsoft Playwright MCP 的增强版，保留所有原生功能，增加以下能力：

## 增强功能

### 1. Uni-app 组件支持
原生 Playwright 不支持 Uni-app 自定义组件，增强版提供：
- `page.smart.uniFill(index, value)` - 填充 uni-input
- `page.smart.uniClick(textOrIndex)` - 点击 uni-button
- `page.smart.uniTextarea(value)` - 填充 uni-textarea
- `page.smart.uniPicker(pickerIndex, optionIndex)` - 选择 uni-picker

### 2. 智能重试
网络不稳定时自动重试：
- `page.smart.retry(fn, { retries: 3, delay: 300 })` - 通用重试
- `page.smart.clickWithRetry(selector)` - 带重试的点击
- `page.smart.fillWithRetry(selector, value)` - 带重试的填充

### 3. Element Plus 复杂组件
简化 Element Plus 组件操作：
- `page.smart.elSelect(index, optionIndex)` - 下拉选择
- `page.smart.elTreeSelect(index, nodeText)` - 树形选择器
- `page.smart.elDatePicker(index, date)` - 日期选择器

### 4. 复合等待
多条件并行检测：
- `page.smart.waitForAny({ url, notUrl, selector, text })` - 任一满足即返回
- `page.smart.waitForAPI(urlPattern, { method })` - 等待 API 响应

### 5. 诊断取证
- `page.smart.diagnose()` - 获取页面诊断信息
- `page.smart.screenshot(name)` - 截图保存

### 6. JS 兜底
当原生方法失败时的备选：
- `page.smart.jsClick(selector)` - JS 直接点击
- `page.smart.jsFill(selector, value)` - JS 直接填充

## 使用方法

### Windsurf / Cursor / VSCode MCP 配置

```json
{
  "mcpServers": {
    "playwright-enhanced": {
      "command": "~/Coding/mcp/playwright-mcp/start-enhanced.sh"
    }
  }
}
```

### 或使用 node 直接启动

```bash
node ~/Coding/mcp/playwright-mcp/cli.js \
  --browser chrome \
  --init-page ~/Coding/mcp/playwright-mcp/init-page-enhanced.ts \
  --timeout-action 5000 \
  --timeout-navigation 30000
```

## 原生功能

保留所有原生 playwright-mcp 功能：
- `browser_snapshot` - A11y 快照（ref 选择器）
- `browser_click` - 点击（基于 ref）
- `browser_fill_form` - 表单填充
- `browser_type` - 文本输入
- `browser_navigate` - 导航
- `browser_console_messages` - 控制台消息
- `browser_network_requests` - 网络请求
- `browser_take_screenshot` - 截图
- `browser_evaluate` - 执行 JS
- `browser_run_code` - 执行 Playwright 代码
- 等等...

## 示例

### 使用原生 snapshot + 增强 Uni-app 支持

```javascript
// 1. 使用原生 browser_snapshot 获取页面结构
// 2. 根据 ref 进行操作
// 3. 遇到 Uni-app 组件时，使用 browser_run_code 调用增强功能

// browser_run_code 示例：
async (page) => {
  // 使用增强的 Uni-app 功能
  await page.smart.uniFill(0, '13800000000');
  await page.smart.uniFill(1, 'password123');
  await page.smart.uniClick('登录');
  
  // 等待登录成功
  const result = await page.smart.waitForAny({ 
    url: '/home', 
    notUrl: 'login' 
  });
  
  return result;
}
```

## 版本信息

- 基于: @playwright/mcp v0.0.54
- 增强版本: 1.0.0
- 许可: Apache-2.0
