// IdeaStudio.Website/Services/IConsentService.cs
using System.Text.Json;
using Microsoft.JSInterop;

namespace IdeaStudio.Website.Services;

/// <summary>Cookie / tracker consent state, persisted in localStorage with a
/// 13-month expiry (CNIL maximum).</summary>
public interface IConsentService
{
    bool HasDecided { get; }
    bool IsGranted { get; }
    event Action? OnChanged;
    Task LoadAsync();
    Task AcceptAsync();
    Task DeclineAsync();
    Task ResetAsync();
}

public sealed class ConsentService(IJSRuntime js, TimeProvider clock) : IConsentService
{
    private const string StorageKey = "idea_consent";
    private static readonly TimeSpan Expiry = TimeSpan.FromDays(395); // ~13 months
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IJSRuntime js = js;
    private readonly TimeProvider clock = clock;

    private bool decided;
    private bool granted;

    public bool HasDecided => decided;
    public bool IsGranted => granted;
    public event Action? OnChanged;

    public async Task LoadAsync()
    {
        string? raw = null;
        try { raw = await js.InvokeAsync<string?>("localStorage.getItem", StorageKey); }
        catch (JSException) { /* prerender or storage unavailable */ }
        catch (JSDisconnectedException) { /* circuit gone */ }

        if (string.IsNullOrWhiteSpace(raw)) { decided = false; granted = false; return; }

        StoredConsent? parsed;
        try { parsed = JsonSerializer.Deserialize<StoredConsent>(raw, JsonOpts); }
        catch (JsonException) { decided = false; granted = false; return; }

        if (parsed is null || (parsed.State != "granted" && parsed.State != "denied"))
        {
            decided = false; granted = false; return;
        }

        DateTimeOffset stored = DateTimeOffset.FromUnixTimeMilliseconds(parsed.Ts);
        if (clock.GetUtcNow() - stored > Expiry)
        {
            decided = false; granted = false; return;
        }

        decided = true;
        granted = parsed.State == "granted";
    }

    public Task AcceptAsync() => PersistAsync(true);
    public Task DeclineAsync() => PersistAsync(false);

    public async Task ResetAsync()
    {
        try { await js.InvokeAsync<object>("localStorage.removeItem", StorageKey); }
        catch (JSException) { /* storage gone */ }
        catch (JSDisconnectedException) { /* circuit gone */ }
        decided = false;
        granted = false;
        OnChanged?.Invoke();
    }

    private async Task PersistAsync(bool grant)
    {
        long ts = clock.GetUtcNow().ToUnixTimeMilliseconds();
        StoredConsent payload = new(grant ? "granted" : "denied", ts);
        string raw = JsonSerializer.Serialize(payload);
        try { await js.InvokeAsync<object>("localStorage.setItem", StorageKey, raw); }
        catch (JSException) { /* storage gone — keep in-memory state anyway */ }
        catch (JSDisconnectedException) { /* circuit gone */ }
        decided = true;
        granted = grant;
        OnChanged?.Invoke();
    }

    private sealed record StoredConsent(string State, long Ts);
}
