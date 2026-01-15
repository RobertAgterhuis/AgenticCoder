# 03. Handoff Manager Specification

**Component**: Orchestration Engine - Phase 3  
**Purpose**: Coordinate data transfer between agents  
**Date**: January 13, 2026  
**Status**: Specification

---

## 📖 Overview

The Handoff Manager ensures reliable, validated data transfer between agents. It:
1. Validates data contracts
2. Transforms data between formats
3. Transfers artifacts
4. Tracks handoff success/failure

---

## 🔄 Handoff Flow

```
Phase N Complete
    │
    ├─→ Collect Outputs
    │   ├─> Gather generated artifacts
    │   ├─> Record metrics
    │   └─> Capture logs
    │
    ├─→ Validate Data Contract
    │   ├─> Check schema compliance
    │   ├─> Validate content
    │   └─> Verify checksums
    │
    ├─→ Transform Data
    │   ├─> Convert format if needed
    │   ├─> Enrich context
    │   └─> Prepare for next agent
    │
    ├─→ Transfer Artifacts
    │   ├─> Copy to expected location
    │   ├─> Register in manifest
    │   └─> Update state
    │
    ├─→ Validate Readiness
    │   ├─> Check next agent prerequisites
    │   ├─> Verify all inputs available
    │   └─> Confirm execution can start
    │
    └─→ Trigger Next Phase
```

---

## 📊 Data Contracts

### Example: @code-architect → @nodejs-specialist

```json
{
  "handoff_id": "ho_008_to_013",
  "from_agent": "@code-architect",
  "from_phase": 8,
  "to_agent": "@nodejs-specialist",
  "to_phase": 13,
  "contract": {
    "sends": {
      "code-architecture.json": {
        "schema": "code-architecture.schema.json",
        "description": "Architecture decisions and module structure",
        "required_fields": [
          "modules",
          "api_structure",
          "dependencies",
          "coding_standards"
        ],
        "example": {
          "modules": ["users", "posts", "comments"],
          "api_structure": "rest",
          "database_models": ["User", "Post"]
        }
      },
      "module-structure.json": {
        "schema": "module-structure.schema.json",
        "description": "Directory and file structure"
      }
    },
    "expects_in_return": {
      "express-app.json": {
        "schema": "express-output.schema.json",
        "timeout_minutes": 120,
        "expected_in": 120,
        "if_missing": "retry",
        "critical": true
      },
      "api-routes.json": {
        "schema": "api-routes.schema.json",
        "critical": true
      },
      "tests": {
        "type": "directory",
        "minimum_test_coverage": 0.8,
        "critical": false
      }
    }
  },
  "timing": {
    "phase_8_expected_end": "2026-01-13T11:30:00Z",
    "phase_13_can_start_after": "2026-01-13T11:30:00Z",
    "phase_13_expected_end": "2026-01-13T15:30:00Z"
  }
}
```

---

## 🎯 Core Methods

### validateDataContract()
```typescript
async function validateDataContract(
  handoff: Handoff,
  fromOutput: AgentOutput,
  toInputRequirements: Phase
): Promise<ContractValidation> {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    artifacts_available: []
  };
  
  // Check all required artifacts present
  for (const [artifactName, spec] of Object.entries(handoff.contract.sends)) {
    const artifact = fromOutput.artifacts[artifactName];
    
    if (!artifact && spec.required !== false) {
      validation.valid = false;
      validation.errors.push(`Missing required artifact: ${artifactName}`);
      continue;
    }
    
    // Validate schema
    try {
      validateJsonSchema(artifact.content, spec.schema);
      validation.artifacts_available.push(artifactName);
    } catch (error) {
      validation.valid = false;
      validation.errors.push(`Schema validation failed for ${artifactName}: ${error.message}`);
    }
    
    // Validate required fields
    for (const field of spec.required_fields || []) {
      if (!artifact.content.hasOwnProperty(field)) {
        validation.valid = false;
        validation.errors.push(`Missing required field in ${artifactName}: ${field}`);
      }
    }
  }
  
  if (!validation.valid && hasRequiredErrors(validation.errors)) {
    throw new HandoffValidationError(validation.errors.join(', '));
  }
  
  return validation;
}
```

### transferArtifacts()
```typescript
async function transferArtifacts(
  handoff: Handoff,
  fromPhaseArtifacts: Artifact[],
  toPhase: Phase
): Promise<TransferResult> {
  const transferred: Artifact[] = [];
  const failed: FailedTransfer[] = [];
  
  for (const artifact of fromPhaseArtifacts) {
    try {
      // Determine destination
      const destination = `tee-output/artifacts/phase_${toPhase.phase}/${artifact.name}`;
      
      // Copy artifact
      copyFile(artifact.path, destination);
      
      // Calculate checksum
      const checksum = calculateChecksum(destination);
      
      // Register in manifest
      registerArtifact({
        name: artifact.name,
        source_phase: handoff.from_phase,
        destination_phase: toPhase.phase,
        original_path: artifact.path,
        transferred_path: destination,
        transferred_at: now(),
        checksum: checksum,
        original_checksum: artifact.checksum,
        checksum_valid: checksum === artifact.checksum
      });
      
      transferred.push({...artifact, path: destination});
      
    } catch (error) {
      failed.push({
        artifact: artifact.name,
        error: error.message
      });
    }
  }
  
  return {
    transferred: transferred,
    failed: failed,
    success: failed.length === 0
  };
}
```

### transformData()
```typescript
async function transformData(
  artifact: Artifact,
  fromFormat: string,
  toFormat: string
): Promise<Artifact> {
  if (fromFormat === toFormat) {
    return artifact; // No transformation needed
  }
  
  const transformKey = `${fromFormat}_to_${toFormat}`;
  const transformer = getTransformer(transformKey);
  
  if (!transformer) {
    throw new Error(`No transformer available: ${transformKey}`);
  }
  
  const transformed = transformer.transform(artifact.content);
  
  return {
    ...artifact,
    content: transformed,
    format: toFormat,
    transformed_from: fromFormat
  };
}
```

---

## 📋 Artifact Manifest

```json
{
  "artifacts": [
    {
      "id": "artifact_001",
      "name": "code-architecture.json",
      "source_phase": 8,
      "destination_phases": [13],
      "created_by": "@code-architect",
      "created_at": "2026-01-13T10:45:00Z",
      "path": "tee-output/artifacts/phase_8/code-architecture.json",
      "checksum": "abc123def456",
      "size_bytes": 2048,
      "schema": "code-architecture.schema.json",
      "schema_valid": true,
      "transferred_to": [
        {
          "phase": 13,
          "transferred_at": "2026-01-13T10:45:30Z",
          "transfer_checksum": "abc123def456",
          "status": "success"
        }
      ]
    }
  ]
}
```

---

## ✅ Handoff Validation Rules

1. ✅ All required artifacts present
2. ✅ Artifacts match schemas
3. ✅ Checksums validate
4. ✅ Required fields present
5. ✅ Data types correct
6. ✅ No missing dependencies
7. ✅ Transfer successful
8. ✅ Next agent can start

---

**Next**: Read `04_state-machine.md` to understand state tracking.
