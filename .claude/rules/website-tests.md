---
paths:
  - IdeaStudio.Website.Tests/**/*
description: Test conventions for IdeaStudio
---

# Test Conventions

- Tests in `IdeaStudio.Website.Tests/`
- `IntegrationTests.cs` — integration tests
- Run: `dotnet test IdeaStudio.sln`
- Naming: `MethodName_Scenario_ExpectedResult`
- Add tests for all new public methods
