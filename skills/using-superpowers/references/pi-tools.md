# Pi Tool Mapping

Skills describe actions; on Pi they resolve to the tools exposed by the current
session. Prefer these lowercase tool names and the package-provided compatibility
tools over instructions written for another harness.

| Skill action | Pi tool or procedure |
| --- | --- |
| Read a file | `read` |
| Write a new file | `write` |
| Make a targeted edit | `edit` |
| Run a command | `bash` |
| Load a named skill | package-provided `Skill`, backed by Pi's resolved skill list |
| Track a multi-step task | package-provided `TodoWrite` when available; otherwise the plan or a repo-local checklist |
| Dispatch independent work | optional `subagent` from `pi-subagents`, when installed |

## Skill Loading

The package-provided `Skill({ skill })` tool loads only skills exposed by Pi's
native resource discovery. Do not scan git checkouts, npm directories, settings,
or arbitrary project paths to find a skill. If a name is unavailable, use the
names Pi supplied or continue without that optional skill.

## Subagents

`pi-subagents` is optional. When its `subagent` tool is available, use it for
Full-route delegation and risk-gated review according to the active workflow.
When it is unavailable, execute sequentially in the current session and record
that the optional capability was absent. Do not fabricate `Task(...)` calls or
assume a generic Agent API exists.

## Task Lists

This package provides `TodoWrite` as an in-session task list. It resets at session
start and does not replace the durable plan or progress ledger required by Full.
Use the native task tool only when it is actually present; never claim a todo was
persisted if the tool did not persist it.

## Long-Running Processes

Pi core has no background Bash. For a process that must survive the current tool
call, use a persistent terminal mechanism available on the host, such as tmux,
or ask the user to start the command in a separate persistent terminal. Verify
its status and retain its output/state path before referring to the process.
