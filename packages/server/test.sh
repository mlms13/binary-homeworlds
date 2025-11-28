#!/bin/bash
output=$(vitest run 2>&1)
exit_code=$?
if [ $exit_code -eq 1 ] && echo "$output" | grep -q "No test files found"; then
  echo "No test files found - exiting successfully"
  exit 0
fi
exit $exit_code
