#!/usr/bin/env node
/**
 * Playwright MCP 增强版包装器
 * 
 * 通过 monkey patching 来修改 server name 和 version
 */

// 检查环境变量
const isEnhanced = process.env.PLAYWRIGHT_MCP_ENHANCED === 'true';
const enhancedName = process.env.PLAYWRIGHT_MCP_NAME || 'Playwright Enhanced';
const enhancedVersion = process.env.PLAYWRIGHT_MCP_VERSION || '1.0.0';

if (isEnhanced) {
  console.log(`[playwright-enhanced] Starting ${enhancedName} v${enhancedVersion}`);
  
  // 动态修改 mcpServer.start 函数
  try {
    const mcpServerModule = require('playwright/lib/mcp/sdk/server');
    const originalStart = mcpServerModule.start;
    
    mcpServerModule.start = async (factory, serverConfig) => {
      // 修改 factory 信息
      const enhancedFactory = {
        ...factory,
        name: enhancedName,
        nameInConfig: 'playwright-enhanced',
        version: enhancedVersion
      };
      
      console.log(`[playwright-enhanced] Server info: ${enhancedFactory.name} v${enhancedFactory.version}`);
      
      // 调用原始 start 函数
      return originalStart(enhancedFactory, serverConfig);
    };
  } catch (error) {
    console.error('[playwright-enhanced] Warning: Could not patch server info:', error.message);
    console.log('[playwright-enhanced] Falling back to standard mode');
  }
}

// 启动原始 CLI
require('./cli.js');
