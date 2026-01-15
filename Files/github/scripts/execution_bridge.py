"""Execution Bridge skeleton implementing basic transport selection.

Currently supports process transport; stubs for webhook, docker, api.
Aligns with ExecutionBridge specs (Plan-B) for future expansion.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class ExecutionResult:
    transport: str
    exit_code: int
    stdout: str
    stderr: str
    metadata: Dict[str, Any]

    def to_json(self) -> str:
        return json.dumps({
            "transport": self.transport,
            "exit_code": self.exit_code,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "metadata": self.metadata,
        })


def run_process(cmd: List[str]) -> ExecutionResult:
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    stdout, stderr = proc.communicate()
    return ExecutionResult(
        transport="process",
        exit_code=proc.returncode,
        stdout=stdout,
        stderr=stderr,
        metadata={"cmd": cmd},
    )


def run_webhook(url: str, payload: Optional[Dict[str, Any]] = None) -> ExecutionResult:
    # Stub: implement HTTP POST with requests in future.
    return ExecutionResult(
        transport="webhook",
        exit_code=0,
        stdout="",
        stderr="webhook transport stub",
        metadata={"url": url, "payload": payload or {}},
    )


def run_docker(image: str, args: List[str]) -> ExecutionResult:
    # Stub: implement docker run invocation in future.
    return ExecutionResult(
        transport="docker",
        exit_code=0,
        stdout="",
        stderr="docker transport stub",
        metadata={"image": image, "args": args},
    )


def run_api(url: str, payload: Optional[Dict[str, Any]] = None) -> ExecutionResult:
    # Stub: implement REST call in future.
    return ExecutionResult(
        transport="api",
        exit_code=0,
        stdout="",
        stderr="api transport stub",
        metadata={"url": url, "payload": payload or {}},
    )


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Execution Bridge skeleton")
    sub = parser.add_subparsers(dest="transport", required=True)

    p_proc = sub.add_parser("process")
    p_proc.add_argument("cmd", nargs=argparse.REMAINDER, help="Command to run")

    p_webhook = sub.add_parser("webhook")
    p_webhook.add_argument("url")
    p_webhook.add_argument("--payload", help="JSON payload", default="{}")

    p_docker = sub.add_parser("docker")
    p_docker.add_argument("image")
    p_docker.add_argument("args", nargs=argparse.REMAINDER, help="Args to pass")

    p_api = sub.add_parser("api")
    p_api.add_argument("url")
    p_api.add_argument("--payload", help="JSON payload", default="{}")

    args = parser.parse_args(argv)

    if args.transport == "process":
        if not args.cmd:
            parser.error("process requires a command")
        result = run_process(args.cmd)
    elif args.transport == "webhook":
        result = run_webhook(args.url, json.loads(args.payload))
    elif args.transport == "docker":
        result = run_docker(args.image, args.args or [])
    elif args.transport == "api":
        result = run_api(args.url, json.loads(args.payload))
    else:
        parser.error(f"unknown transport {args.transport}")

    sys.stdout.write(result.to_json() + "\n")
    return 0 if result.exit_code == 0 else result.exit_code


if __name__ == "__main__":
    raise SystemExit(main())
