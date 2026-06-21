#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Target the compliance tracking arrays directly
const dataPath = path.join(__dirname, 'data.js');

process.stdin.on('data', (chunk) => {
  try {
    const request = JSON.parse(chunk.toString());
    
    // Respond to MCP tool listing requests
    if (request.method === "tools/list") {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0", id: request.id,
        result: {
          tools: [{
            name: "get_compliance_violations",
            description: "Retrieves active compliance alerts, security vulnerabilities, or failing tests recorded in CrowObservability.",
            inputSchema: { type: "object", properties: {} }
          }]
        }
      }) + "\n");
    }
    
    // Respond to tool invocation queries
    if (request.method === "tools/call") {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0", id: request.id,
        result: {
          content: [{
            type: "text",
            text: "CrowObservability Audit Notice: 1 Critical SOC2 failure detected in config/compliance.json (Unencrypted LLM logging risk)."
          }]
        }
      }) + "\n");
    }
  } catch (e) {
    // Graceful catch for malformed RPC framing
  }
});