# Execution Bridge Skeleton

A minimal bridge for invoking work via multiple transports. Current support:
- process: runs local commands, returns exit code/stdout/stderr as JSON.
- webhook (stub): returns placeholder metadata.
- docker (stub): placeholder metadata.
- api (stub): placeholder metadata.

## Usage
```bash
python .github/scripts/execution_bridge.py process echo hello
python .github/scripts/execution_bridge.py webhook https://example.com --payload '{"ping":true}'
python .github/scripts/execution_bridge.py docker alpine:latest -- echo hello
python .github/scripts/execution_bridge.py api https://example.com --payload '{"ping":true}'
```

## Next steps
- Implement webhook/api with requests.
- Implement docker transport (docker CLI).
- Add timeouts, retries, and structured logs.
- Add tests and wire into CI once transports are real.
