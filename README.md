# Filter Rules Statistics Tool

A command-line tool that analyzes ad-blocking filter lists and generates statistical reports. Uses the `@adguard/agtree` library to parse filter rules and outputs comprehensive statistics about rule composition, modifier usage, scriptlets, and redirect resources.

The stats are published daily to [https://ameshkov.github.io/filter-rules-stats/](https://ameshkov.github.io/filter-rules-stats/).

If you'd like to change the set of filter lists analyzed, you can modify the
configuration file at `config.yaml`.

## Features

- **Multi-source Analysis**: Download and analyze filter lists from multiple URLs
- **Rule Categorization**: Count rules by type (network, cosmetic, scriptlet, HTML filtering, etc.)
- **Modifier Statistics**: Track usage of all rule modifiers
- **Scriptlet Analysis**: Identify scriptlet usage with syntax detection (AdGuard, uBlock, ABP)
- **Redirect Tracking**: Count redirect resource usage
- **Dual Output**: Generate both JSON and HTML reports
- **GitHub Actions Ready**: Automated daily analysis with GitHub Pages deployment

## Installation

```bash
# Clone the repository
git clone https://github.com/ameshkov/filter-rules-stats.git
cd filter-rules-stats

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

## Usage

### Basic Usage

```bash
# Run with default configuration
pnpm run start

# Or use the development mode
pnpm run dev
```

### CLI Options

```text
Usage: filter-rules-stats [options]

Options:
  -c, --config <path>  Path to configuration file (default: "config.yaml")
  -o, --output <dir>   Output directory (default: "./output")
  --json-only          Generate only JSON output
  --html-only          Generate only HTML output
  -v, --verbose        Enable verbose logging
  -V, --version        Output the version number
  -h, --help           Display help for command
```

### Examples

```bash
# Use a custom configuration file
pnpm run start -- --config my-config.yaml

# Output to a specific directory
pnpm run start -- --output ./reports

# Generate only JSON output with verbose logging
pnpm run start -- --json-only --verbose
```

## Configuration

Create a `config.yaml` file to define the filter lists to analyze:

```yaml
groups:
  - name: uBlock filters - Ads
    urls:
      - https://raw.githubusercontent.com/uBlockOrigin/uAssetsCDN/refs/heads/main/filters/filters.min.txt

  - name: AdGuard Base filter
    urls:
      - https://filters.adtidy.org/windows/filters/1.txt

  - name: EasyList
    urls:
      - https://easylist.to/easylist/easylist.txt
```

### Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `groups` | array | Yes | List of filter list groups to analyze |
| `groups[].name` | string | Yes | Human-readable name for the filter group |
| `groups[].urls` | array | Yes | List of URLs pointing to filter list files |

## Output

### JSON Output (`stats.json`)

Structured statistics including:

- Generation timestamp
- Per-group statistics:
  - Total rule count
  - Rule type breakdown
  - Modifier usage counts
  - Scriptlet usage with syntax breakdown
  - Redirect resource usage
  - Parsing errors

### HTML Report (`index.html`)

A styled, responsive HTML report with:

- Navigation between groups
- Summary cards with key metrics
- Detailed tables for rule types, modifiers, scriptlets, and redirects
- Collapsible error sections

## GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/analyze.yml`) that:

1. Runs daily at midnight UTC
2. Can be triggered manually
3. Generates statistics reports
4. Deploys the HTML report to GitHub Pages

### Setup GitHub Pages

1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. The workflow will automatically deploy on the next run

## Development

```bash
# Run in development mode
pnpm run dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Type check
pnpm run lint

# Build for production
pnpm run build
```

## Project Structure

```text
filter-rules-stats/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── config/               # Configuration loading
│   ├── downloader/           # Filter list downloading
│   ├── parser/               # Rule parsing with @adguard/agtree
│   ├── analyzer/             # Statistical analysis
│   ├── output/               # JSON and HTML generation
│   └── types/                # TypeScript types
├── tests/                    # Unit tests
├── .github/workflows/        # GitHub Actions
├── config.yaml               # Default configuration
└── package.json
```

## License

MIT
