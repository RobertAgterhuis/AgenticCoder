# Resource Analyzer (Component 2)

**Component**: BAR-02  
**Purpose**: Parse Bicep templates and analyze resources for AVM transformation

## What it does

- Parses Bicep into a structured model:
  - `parameters`, `variables`, `resources`, `outputs`
- Extracts key resource details:
  - symbolic name, resource type, apiVersion
  - top-level properties (including `location`, `tags`, `dependsOn`)
  - dependencies (explicit `dependsOn` + implicit `<symbol>.id` references)
- Analyzes each resource against an AVM registry:
  - finds candidate AVM module by resource type
  - classifies properties as standard/custom/unsupported
  - computes complexity score + difficulty
  - generates recommendations

## Files

- `ResourceAnalyzer.js` – main implementation
- `test/ResourceAnalyzer.test.js` – Node test runner suite

## Usage

```javascript
import ResourceAnalyzer from './ResourceAnalyzer.js';
import AVMRegistry from '../01-avm-registry/AVMRegistry.js';

const analyzer = new ResourceAnalyzer();
const registry = new AVMRegistry();
await registry.initialize();

const { parsed, analyses, report } = await analyzer.analyzeTemplate(bicepCode, registry);
console.log(parsed.resources.length);
console.log(report.overall_complexity);
```

## Run tests

```powershell
node --test bicep-avm-resolver/02-resource-analyzer/test/ResourceAnalyzer.test.js
```
