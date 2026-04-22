# MCP Terraform Server

An MCP (Model Context Protocol) server that provides Terraform validation and planning tools.

## Features

This server provides two main tools:

### 1. `terraform_validate`
Validates Terraform configuration files in a directory, checking for syntax errors and internal consistency.

**Parameters:**
- `working_directory` (string, optional): Directory containing Terraform files (default: current directory)
- `json_output` (boolean, optional): Return output in JSON format (default: false)

### 2. `terraform_plan`
Creates an execution plan showing what actions Terraform will take. Does not make any changes to real resources.

**Parameters:**
- `working_directory` (string, optional): Directory containing Terraform files (default: current directory)
- `var_file` (string, optional): Path to a variable file
- `target` (string, optional): Specific resource to target
- `destroy` (boolean, optional): Create a destroy plan (default: false)

## Prerequisites

- Node.js 18 or higher
- Terraform installed and available in PATH

## Installation

```bash
npm install
```

## Usage

### Running the Server

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

### Claude Desktop Integration

Add this to your Claude Desktop configuration:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "terraform": {
      "command": "node",
      "args": ["/path/to/mcp-terraform/src/index.js"]
    }
  }
}
```

## Examples

Once configured, you can ask Claude to:

- "Validate my Terraform configuration in the current directory"
- "Run a Terraform plan for the infrastructure in ./terraform-project"
- "Check if my Terraform files are valid and show the plan"

## Security Note

This server executes Terraform commands on your local system. Ensure you trust the Terraform configurations you're working with and understand the implications of the commands being executed.

## License

MIT
