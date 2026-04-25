// IdeaStudio.Website.Tests/ConsentServiceTests.cs
using IdeaStudio.Website.Services;
using Microsoft.JSInterop;
using Moq;

namespace IdeaStudio.Website.Tests;

public class ConsentServiceTests
{
    private const string Key = "idea_consent";

    private static (ConsentService svc, Mock<IJSRuntime> js, FakeTimeProvider clock) Make(
        string? storedRaw = null,
        DateTimeOffset? now = null)
    {
        Mock<IJSRuntime> js = new();
        js.Setup(j => j.InvokeAsync<string?>("localStorage.getItem", It.Is<object[]>(a => (string)a[0] == Key)))
            .ReturnsAsync(storedRaw);
        FakeTimeProvider clock = new(now ?? new DateTimeOffset(2026, 4, 26, 12, 0, 0, TimeSpan.Zero));
        ConsentService svc = new(js.Object, clock);
        return (svc, js, clock);
    }

    [Fact]
    public async Task LoadAsync_NoStoredValue_HasDecidedFalse()
    {
        (ConsentService svc, _, _) = Make(storedRaw: null);
        await svc.LoadAsync();
        Assert.False(svc.HasDecided);
        Assert.False(svc.IsGranted);
    }

    [Fact]
    public async Task LoadAsync_StoredGrantedRecent_HasDecidedTrueGrantedTrue()
    {
        DateTimeOffset now = new(2026, 4, 26, 12, 0, 0, TimeSpan.Zero);
        long ts = now.AddDays(-30).ToUnixTimeMilliseconds();
        string raw = $"{{\"state\":\"granted\",\"ts\":{ts}}}";
        (ConsentService svc, _, _) = Make(storedRaw: raw, now: now);
        await svc.LoadAsync();
        Assert.True(svc.HasDecided);
        Assert.True(svc.IsGranted);
    }

    [Fact]
    public async Task LoadAsync_StoredDeniedRecent_HasDecidedTrueGrantedFalse()
    {
        DateTimeOffset now = new(2026, 4, 26, 12, 0, 0, TimeSpan.Zero);
        long ts = now.AddDays(-30).ToUnixTimeMilliseconds();
        string raw = $"{{\"state\":\"denied\",\"ts\":{ts}}}";
        (ConsentService svc, _, _) = Make(storedRaw: raw, now: now);
        await svc.LoadAsync();
        Assert.True(svc.HasDecided);
        Assert.False(svc.IsGranted);
    }

    [Fact]
    public async Task LoadAsync_StoredOlderThanThirteenMonths_HasDecidedFalse()
    {
        DateTimeOffset now = new(2026, 4, 26, 12, 0, 0, TimeSpan.Zero);
        long ts = now.AddDays(-396).ToUnixTimeMilliseconds(); // > 395-day expiry
        string raw = $"{{\"state\":\"granted\",\"ts\":{ts}}}";
        (ConsentService svc, _, _) = Make(storedRaw: raw, now: now);
        await svc.LoadAsync();
        Assert.False(svc.HasDecided);
    }

    [Fact]
    public async Task LoadAsync_StoredMalformedJson_HasDecidedFalse()
    {
        (ConsentService svc, _, _) = Make(storedRaw: "{not-json}");
        await svc.LoadAsync();
        Assert.False(svc.HasDecided);
    }

    [Fact]
    public async Task AcceptAsync_PersistsGrantedAndRaisesOnChanged()
    {
        (ConsentService svc, Mock<IJSRuntime> js, _) = Make();
        await svc.LoadAsync();
        int fired = 0;
        svc.OnChanged += () => fired++;
        await svc.AcceptAsync();
        Assert.True(svc.HasDecided);
        Assert.True(svc.IsGranted);
        Assert.Equal(1, fired);
        js.Verify(j => j.InvokeAsync<object>(
            "localStorage.setItem",
            It.Is<object[]>(a => (string)a[0] == Key && ((string)a[1]).Contains("\"granted\""))),
            Times.Once);
    }

    [Fact]
    public async Task DeclineAsync_PersistsDeniedAndRaisesOnChanged()
    {
        (ConsentService svc, Mock<IJSRuntime> js, _) = Make();
        await svc.LoadAsync();
        int fired = 0;
        svc.OnChanged += () => fired++;
        await svc.DeclineAsync();
        Assert.True(svc.HasDecided);
        Assert.False(svc.IsGranted);
        Assert.Equal(1, fired);
        js.Verify(j => j.InvokeAsync<object>(
            "localStorage.setItem",
            It.Is<object[]>(a => (string)a[0] == Key && ((string)a[1]).Contains("\"denied\""))),
            Times.Once);
    }

    [Fact]
    public async Task ResetAsync_RemovesStorageAndRaisesOnChanged()
    {
        DateTimeOffset now = new(2026, 4, 26, 12, 0, 0, TimeSpan.Zero);
        long ts = now.AddDays(-30).ToUnixTimeMilliseconds();
        string raw = $"{{\"state\":\"granted\",\"ts\":{ts}}}";
        (ConsentService svc, Mock<IJSRuntime> js, _) = Make(storedRaw: raw, now: now);
        await svc.LoadAsync();
        int fired = 0;
        svc.OnChanged += () => fired++;
        await svc.ResetAsync();
        Assert.False(svc.HasDecided);
        Assert.Equal(1, fired);
        js.Verify(j => j.InvokeAsync<object>(
            "localStorage.removeItem",
            It.Is<object[]>(a => (string)a[0] == Key)),
            Times.Once);
    }
}

internal sealed class FakeTimeProvider : TimeProvider
{
    private DateTimeOffset now;
    public FakeTimeProvider(DateTimeOffset start) => now = start;
    public override DateTimeOffset GetUtcNow() => now;
    public void Advance(TimeSpan by) => now = now.Add(by);
}
