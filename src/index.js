#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * MCP Server for Terraform
 * Provides tools for terraform validate and plan operations
 */
class TerraformMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mcp-terraform',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'terraform_validate',
          description: 'Validates the Terraform configuration files in a directory. Checks for syntax errors and internal consistency.',
          inputSchema: {
            type: 'object',
            properties: {
              working_directory: {
                type: 'string',
                description: 'The directory containing Terraform configuration files (default: current directory)',
                default: '.'
              },
              json_output: {
                type: 'boolean',
                description: 'Return output in JSON format',
                default: false
              }
            }
          }
        },
        {
          name: 'terraform_plan',
          description: 'Creates an execution plan showing what actions Terraform will take to reach the desired state. Does not make any changes to real resources.',
          inputSchema: {
            type: 'object',
            properties: {
              working_directory: {
                type: 'string',
                description: 'The directory containing Terraform configuration files (default: current directory)',
                default: '.'
              },
              var_file: {
                type: 'string',
                description: 'Path to a variable file to use (optional)'
              },
              target: {
                type: 'string',
                description: 'Resource to target for planning (optional, can be specified multiple times)'
              },
              destroy: {
                type: 'boolean',
                description: 'Create a plan to destroy all resources',
                default: false
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'terraform_validate') {
          return await this.handleValidate(args);
        } else if (name === 'terraform_plan') {
          return await this.handlePlan(args);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true,
        };
      }
    });
  }

  async handleValidate(args) {
    const workingDir = args.working_directory || '.';
    const jsonOutput = args.json_output || false;

    let command = 'terraform validate';
    if (jsonOutput) {
      command += ' -json';
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDir,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      return {
        content: [
          {
            type: 'text',
            text: stdout || stderr || 'Validation completed successfully'
          }
        ]
      };
    } catch (error) {
      throw new Error(`Terraform validate failed: ${error.message}\n${error.stderr || ''}`);
    }
  }

  async handlePlan(args) {
    const workingDir = args.working_directory || '.';
    const varFile = args.var_file;
    const target = args.target;
    const destroy = args.destroy || false;

    let command = 'terraform plan';
    
    if (destroy) {
      command += ' -destroy';
    }
    
    if (varFile) {
      command += ` -var-file="${varFile}"`;
    }
    
    if (target) {
      command += ` -target="${target}"`;
    }

    // Add no-color for cleaner output
    command += ' -no-color';

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDir,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      return {
        content: [
          {
            type: 'text',
            text: stdout || stderr || 'Plan completed successfully'
          }
        ]
      };
    } catch (error) {
      throw new Error(`Terraform plan failed: ${error.message}\n${error.stderr || ''}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Terraform MCP server running on stdio');
  }
}

const server = new TerraformMCPServer();
server.run().catch(console.error);
