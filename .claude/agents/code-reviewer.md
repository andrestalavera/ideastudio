---
name: code-reviewer
description: Code review with test coverage checks for IdeaStudio
tools:
  - Read
  - Glob
  - Grep
  - Bash
  - TodoWrite
---

# Code Reviewer

## Checklist

- [ ] `dotnet build IdeaStudio.sln` succeeds
- [ ] `dotnet test IdeaStudio.sln` passes
- [ ] New public methods have tests
- [ ] Components use proper base classes
- [ ] No hardcoded strings (use i18n)
- [ ] No `async void`
- [ ] Services injected via DI
