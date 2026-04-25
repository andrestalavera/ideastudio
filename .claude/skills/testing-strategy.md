---
name: testing-strategy
description: Test writing guide for IdeaStudio
---

# Testing Strategy

## Unit Tests
- Extension methods in `ExtensionsTests.cs`
- Model serialization/deserialization
- Naming: `MethodName_Scenario_ExpectedResult`

## Integration Tests
- Service interactions in `IntegrationTests.cs`
- Component rendering with bUnit if available

## Running
```bash
dotnet test IdeaStudio.sln
dotnet test --filter "FullyQualifiedName~ClassName"  # specific class
```
