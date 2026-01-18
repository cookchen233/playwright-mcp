/**
 * playwright-mcp 增强脚本
 * 
 * 通过 --init-page 参数注入，提供：
 * 1. Uni-app 组件支持（uni-button, uni-input, uni-picker 等）
 * 2. 智能重试（网络不稳定时自动重试）
 * 3. Element Plus 复杂组件简化操作
 * 4. 增强的诊断和取证能力
 * 5. 更短的超时时间（快速失败，快速重试）
 */

// @ts-nocheck
// 类型检查跳过 - 这是运行时注入脚本

export default async ({ page }: { page: any }) => {
  // ========== 1. 注入增强工具到 window 对象 ==========
  await page.addInitScript(() => {
    // @ts-ignore
    window.__playwrightEnhanced = {
      version: '1.0.0',
      
      // Uni-app 组件辅助函数
      uni: {
        // 获取所有 uni-input
        getInputs: () => Array.from(document.querySelectorAll('input.uni-input-input')),
        
        // 获取所有 uni-button
        getButtons: () => Array.from(document.querySelectorAll('uni-button')),
        
        // 点击 uni-button（通过文本）
        clickButton: (text: string) => {
          const btns = document.querySelectorAll('uni-button');
          for (const btn of btns) {
            if (btn.textContent?.includes(text)) {
              (btn as HTMLElement).click();
              return true;
            }
          }
          return false;
        },
        
        // 填充 uni-input（通过索引）
        fillInput: (index: number, value: string) => {
          const inputs = document.querySelectorAll('input.uni-input-input');
          const input = inputs[index] as HTMLInputElement;
          if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          return false;
        },
        
        // 触发 uni-picker change
        selectPicker: (pickerIndex: number, optionIndex: number) => {
          const pickers = document.querySelectorAll('uni-picker');
          if (pickers[pickerIndex]) {
            const event = new CustomEvent('change', { 
              detail: { value: optionIndex }, 
              bubbles: true 
            });
            pickers[pickerIndex].dispatchEvent(event);
            return true;
          }
          return false;
        },
      },
      
      // Element Plus 辅助函数
      el: {
        // 获取所有 el-select
        getSelects: () => Array.from(document.querySelectorAll('.el-select')),
        
        // 获取下拉选项
        getDropdownItems: () => Array.from(document.querySelectorAll('.el-select-dropdown__item')),
        
        // 获取树节点
        getTreeNodes: () => Array.from(document.querySelectorAll('.el-tree-node__content')),
        
        // 获取日期选择器
        getDatePickers: () => Array.from(document.querySelectorAll('.el-date-editor')),
      },
      
      // 诊断信息
      diagnose: () => ({
        url: location.href,
        title: document.title,
        inputs: document.querySelectorAll('input').length,
        buttons: document.querySelectorAll('button').length,
        uniInputs: document.querySelectorAll('input.uni-input-input').length,
        uniButtons: document.querySelectorAll('uni-button').length,
        elSelects: document.querySelectorAll('.el-select').length,
        bodyPreview: document.body?.innerText?.slice(0, 300) || '',
      }),
    };
  });

  // ========== 2. 增强 page 对象 ==========
  
  // 添加 smart 命名空间
  (page as any).smart = {
    
    // ---------- 智能重试 ----------
    
    /**
     * 带重试的操作执行器
     */
    retry: async <T>(
      fn: () => Promise<T>, 
      options: { retries?: number; delay?: number } = {}
    ): Promise<T> => {
      const { retries = 3, delay = 300 } = options;
      let lastError: Error | undefined;
      
      for (let i = 0; i <= retries; i++) {
        try {
          return await fn();
        } catch (e) {
          lastError = e as Error;
          if (i < retries) {
            await page.waitForTimeout(delay * (i + 1));  // 指数退避
          }
        }
      }
      throw lastError;
    },

    /**
     * 带重试的点击
     */
    clickWithRetry: async (selector: string, options: { retries?: number; timeout?: number } = {}) => {
      return (page as any).smart.retry(
        () => page.click(selector, { timeout: options.timeout || 3000 }),
        { retries: options.retries || 2 }
      );
    },

    /**
     * 带重试的填充
     */
    fillWithRetry: async (selector: string, value: string, options: { retries?: number; timeout?: number } = {}) => {
      return (page as any).smart.retry(
        () => page.fill(selector, value, { timeout: options.timeout || 3000 }),
        { retries: options.retries || 2 }
      );
    },

    // ---------- Uni-app 专用 ----------
    
    /**
     * Uni-app 输入框填充（通过索引）
     */
    uniFill: async (index: number, value: string) => {
      const inputs = await page.locator('input.uni-input-input').all();
      if (inputs[index]) {
        await inputs[index].fill(value);
        return true;
      }
      // JS fallback
      return page.evaluate(({ idx, val }) => {
        return (window as any).__playwrightEnhanced?.uni?.fillInput(idx, val) || false;
      }, { idx: index, val: value });
    },

    /**
     * Uni-app 按钮点击（通过文本或索引）
     */
    uniClick: async (textOrIndex: string | number) => {
      if (typeof textOrIndex === 'number') {
        await page.evaluate((idx) => {
          const btns = document.querySelectorAll('uni-button');
          (btns[idx] as HTMLElement)?.click();
        }, textOrIndex);
      } else {
        await page.evaluate((text) => {
          (window as any).__playwrightEnhanced?.uni?.clickButton(text);
        }, textOrIndex);
      }
    },

    /**
     * Uni-app textarea 填充
     */
    uniTextarea: async (value: string) => {
      await page.locator('textarea.uni-textarea-textarea').first().fill(value);
    },

    /**
     * Uni-app picker 选择
     */
    uniPicker: async (pickerIndex: number, optionIndex: number) => {
      await page.evaluate(({ pIdx, oIdx }) => {
        (window as any).__playwrightEnhanced?.uni?.selectPicker(pIdx, oIdx);
      }, { pIdx: pickerIndex, oIdx: optionIndex });
    },

    // ---------- Element Plus ----------
    
    /**
     * Element Plus 下拉选择
     */
    elSelect: async (selectorOrIndex: string | number, optionTextOrIndex: string | number) => {
      // 找到并点击选择器
      const selects = await page.locator('.el-select').all();
      const selectEl = typeof selectorOrIndex === 'number' 
        ? selects[selectorOrIndex] 
        : page.locator(selectorOrIndex);
      
      await selectEl.click();
      await page.waitForSelector('.el-select-dropdown__item', { timeout: 3000 });
      await page.waitForTimeout(150);
      
      // 选择选项
      if (typeof optionTextOrIndex === 'number') {
        const items = await page.locator('.el-select-dropdown__item').all();
        await items[optionTextOrIndex].click();
      } else {
        await page.click(`.el-select-dropdown__item:has-text("${optionTextOrIndex}")`);
      }
    },

    /**
     * Element Plus 树形选择器
     */
    elTreeSelect: async (selectorOrIndex: string | number, nodeText?: string) => {
      const selects = await page.locator('.el-select, .el-tree-select').all();
      const selectEl = typeof selectorOrIndex === 'number'
        ? selects[selectorOrIndex]
        : page.locator(selectorOrIndex);
      
      await selectEl.click();
      await page.waitForSelector('.el-tree-node__content', { timeout: 3000 });
      await page.waitForTimeout(150);
      
      if (nodeText) {
        await page.click(`.el-tree-node__content:has-text("${nodeText}")`);
      } else {
        await page.locator('.el-tree-node__content').first().click();
      }
    },

    /**
     * Element Plus 日期选择器
     */
    elDatePicker: async (selectorOrIndex: string | number, date?: string) => {
      const pickers = await page.locator('.el-date-editor').all();
      const picker = typeof selectorOrIndex === 'number'
        ? pickers[selectorOrIndex]
        : page.locator(selectorOrIndex);
      
      const input = picker.locator('input').first();
      await input.click();
      await page.waitForTimeout(200);
      
      if (date) {
        await input.fill(date);
        await page.keyboard.press('Enter');
      } else {
        // 点击今天或关闭
        const todayBtn = page.locator('button:has-text("今天"), .is-today');
        const count = await todayBtn.count();
        if (count > 0) {
          await todayBtn.first().click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    },

    // ---------- 诊断 ----------
    
    /**
     * 获取页面诊断信息
     */
    diagnose: async () => {
      return page.evaluate(() => {
        return (window as any).__playwrightEnhanced?.diagnose() || {
          url: location.href,
          title: document.title,
        };
      });
    },

    /**
     * 截图保存
     */
    screenshot: async (name?: string) => {
      const path = `/tmp/${name || 'screenshot'}-${Date.now()}.png`;
      await page.screenshot({ path, fullPage: true });
      return path;
    },

    // ---------- 复合等待 ----------
    
    /**
     * 多条件并行等待（任一满足即返回）
     */
    waitForAny: async (
      conditions: { url?: string; notUrl?: string; selector?: string; text?: string },
      timeout = 10000
    ) => {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        // URL 检查
        if (conditions.url) {
          const currentUrl = page.url();
          if (currentUrl.includes(conditions.url)) {
            if (!conditions.notUrl || !currentUrl.includes(conditions.notUrl)) {
              return { matched: 'url', value: currentUrl };
            }
          }
        }
        
        // 选择器检查
        if (conditions.selector) {
          const count = await page.locator(conditions.selector).count().catch(() => 0);
          if (count > 0) return { matched: 'selector', value: conditions.selector };
        }
        
        // 文本检查
        if (conditions.text) {
          const hasText = await page.locator(`text="${conditions.text}"`).count().catch(() => 0);
          if (hasText > 0) return { matched: 'text', value: conditions.text };
        }
        
        await page.waitForTimeout(100);
      }
      
      return { matched: null, timeout: true };
    },

    /**
     * 等待网络响应
     */
    waitForAPI: (urlPattern: string, options: { timeout?: number; method?: string } = {}) => {
      const { timeout = 15000, method } = options;
      
      return new Promise<{ success: boolean; status?: number; body?: any; url?: string }>((resolve) => {
        const handler = async (resp: any) => {
          if (!resp.url().includes(urlPattern)) return;
          if (method && resp.request().method() !== method) return;
          
          let body = null;
          try { body = await resp.json(); } catch (e) {}
          
          page.off('response', handler);
          resolve({ success: true, status: resp.status(), body, url: resp.url() });
        };
        
        page.on('response', handler);
        setTimeout(() => {
          page.off('response', handler);
          resolve({ success: false });
        }, timeout);
      });
    },

    // ---------- JS 兜底 ----------
    
    /**
     * 当原生方法失败时的 JS 兜底点击
     */
    jsClick: async (selector: string) => {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) (el as HTMLElement).click();
        else throw new Error(`Element not found: ${sel}`);
      }, selector);
    },

    /**
     * 当原生方法失败时的 JS 兜底填充
     */
    jsFill: async (selector: string, value: string) => {
      await page.evaluate(({ sel, val }) => {
        const el = document.querySelector(sel) as HTMLInputElement;
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          throw new Error(`Element not found: ${sel}`);
        }
      }, { sel: selector, val: value });
    },
  };

  console.log('[playwright-enhanced] Smart utilities injected');
};
