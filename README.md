# Playwright Enhanced MCP

playwright-enhanced MCP 是基于 Microsoft Playwright MCP 的增强版，保留了原生所有功能并增加了针对 Uni-app、Element Plus 及 Gemini 3 视觉增强功能，调用前请务必阅读该文档。

## 增强功能

### 1. Uni-app 组件支持

原生 Playwright 不支持 Uni-app 自定义组件，增强版提供：

- `page.smart.uniFill(index, value)` - 填充 uni-input
- `page.smart.uniClick(textOrIndex)` - 点击 uni-button
- `page.smart.uniTextarea(value)` - 填充 uni-textarea
- `page.smart.uniPicker(pickerIndex, optionIndex)` - 选择 uni-picker

### 2. 智能重试

网络不稳定或异步渲染延迟时自动重试：

- `page.smart.retry(fn, { retries: 3, delay: 300 })` - 通用重试逻辑
- `page.smart.clickWithRetry(selector)` - 带重试的点击
- `page.smart.fillWithRetry(selector, value)` - 带重试的填充

### 3. Element Plus 复杂组件

针对 Vue3 常用组件库 Element Plus 的简化操作：

- `page.smart.elSelect(index, optionIndex)` - 下拉选择器
- `page.smart.elTreeSelect(index, nodeText)` - 树形选择器
- `page.smart.elDatePicker(index, date)` - 日期选择器

### 4. 复合等待

多条件并行检测，提升脚本鲁棒性：

- `page.smart.waitForAny({ url, notUrl, selector, text })` - 任一条件满足即返回
- `page.smart.waitForAPI(urlPattern, { method })` - 等待特定接口响应

### 5. 视觉逻辑增强 (Gemini 3 Powered)

**核心突破**：利用 Gemini 3 的原生像素级定位（Pixel-Precise Pointing）处理 DOM 无法触达的场景：

- `page.smart.visualLocate(description)` - **视觉定位**：通过自然语言描述（如 "右上角的关闭按钮"）获取 [x, y] 坐标。
- `page.smart.visualClick(description)` - **视觉点击**：结合截图与推理，直接点击目标，绕过所有 CSS/XPath 限制。
- `page.smart.visualAssert(expectation)` - **逻辑断言**：通过视觉理解判断状态（如 "判断进度条是否已经读满"）。
- `page.smart.visualDiff(baselinePath)` - **智感比对**：由 AI 判断 UI 变化是否属于“破坏性变更”，忽略像素级扰动。

### 6. 诊断取证与 JS 兜底

- `page.smart.diagnose()` - 获取页面当前 A11y 树、控制台报错及性能诊断。
- `page.smart.screenshot(name)` - 自动加时间戳的截图保存。
- `page.smart.jsClick(selector)` - 当原生点击被拦截（如被其他元素覆盖）时的 JS 强行触发。

---

## 使用方法

### MCP 客户端配置 (Windsurf / Cursor / VSCode)

编辑 `mcp_config.json`：

```json
{
  "mcpServers": {
    "playwright-enhanced": {
      "command": "~/Coding/mcp/playwright-mcp/start-enhanced.sh"
    }
  }
}

```

### 命令行直接启动

```bash
node ~/Coding/mcp/playwright-mcp/cli.js \
  --browser chrome \
  --init-page ~/Coding/mcp/playwright-mcp/init-page-enhanced.ts \
  --timeout-action 5000 \
  --timeout-navigation 30000

```

---

## 原生功能 (Legacy Support)

保留所有原生 `playwright-mcp` 工具：

- `browser_snapshot`, `browser_click`, `browser_fill_form`, `browser_type`, `browser_navigate`, `browser_evaluate`, `browser_run_code` 等。

---

## 示例

### 场景 A：Uni-app 自动化

```javascript
// 使用 browser_run_code 调用增强功能
async (page) => {
  await page.smart.uniFill(0, 'admin_user');
  await page.smart.uniFill(1, 'secure_pass');
  await page.smart.uniClick('登录');
}

```

### 场景 B：视觉自愈 (Vision-First Fallback)

当 DOM 结构在打包后发生混淆，导致常规选择器失效时：

```javascript
async (page) => {
  try {
    // 优先尝试高效率的常规操作
    await page.smart.clickWithRetry('button#submit-btn');
  } catch (e) {
    // 逻辑内核自愈：启用 Gemini 3 进行视觉定位点击
    console.warn("DOM 定位失败，启动 Gemini 视觉定位器...");
    await page.smart.visualClick("位于页面底部的橙色提交按钮");
    
    // 视觉确认结果
    const isSuccess = await page.smart.visualAssert("页面是否显示了‘发送成功’的提示？");
    return { status: isSuccess ? "recovered" : "failed" };
  }
}

```

---

## 版本信息

- 基于: @playwright/mcp v0.0.54
- 增强版本: 1.0.0
- 许可: Apache-2.0
