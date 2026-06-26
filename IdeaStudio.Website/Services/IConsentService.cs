// IdeaStudio.Website/Services/IConsentService.cs
using System.Text.Json;
using IdeaStudio.Website.State;
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

public sealed class ConsentService : IConsentService, IDisposable
{
    private const string StorageKey = "idea_consent";
    private static readonly TimeSpan Expiry = TimeSpan.FromDays(395); // ~13 months
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IJSRuntime js;
    private readonly TimeProvider clock;
    private readonly Store<AppState> store;
    private ConsentStatus lastSeen;

    public ConsentService(IJSRuntime js, TimeProvider clock, Store<AppState> store)
    {
        this.js = js;
        this.clock = clock;
        this.store = store;
        lastSeen = store.State.Consent;
        store.Changed += RelayConsentChange;
    }

    public bool HasDecided => store.State.Consent != ConsentStatus.Unknown;
    public bool IsGranted => store.State.Consent == ConsentStatus.Granted;
    public event Action? OnChanged;

    public async Task LoadAsync()
    {
        string? raw = null;
        try { raw = await js.InvokeAsync<string?>("localStorage.getItem", StorageKey); }
        catch (JSException) { /* prerender or storage unavailable */ }
        catch (JSDisconnectedException) { /* circuit gone */ }

        store.Dispatch(new SetConsent(Resolve(raw)));
    }

    public Task AcceptAsync() => PersistAsync(true);
    public Task DeclineAsync() => PersistAsync(false);

    public async Task ResetAsync()
    {
        try { await js.InvokeAsync<object>("localStorage.removeItem", StorageKey); }
        catch (JSException) { /* storage gone */ }
        catch (JSDisconnectedException) { /* circuit gone */ }
        store.Dispatch(new SetConsent(ConsentStatus.Unknown));
    }

    public void Dispose() => store.Changed -= RelayConsentChange;

    private ConsentStatus Resolve(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) { return ConsentStatus.Unknown; }

        StoredConsent? parsed;
        try { parsed = JsonSerializer.Deserialize<StoredConsent>(raw, JsonOpts); }
        catch (JsonException) { return ConsentStatus.Unknown; }

        if (parsed is null || (parsed.State != "granted" && parsed.State != "denied"))
        {
            return ConsentStatus.Unknown;
        }

        DateTimeOffset stored = DateTimeOffset.FromUnixTimeMilliseconds(parsed.Ts);
        if (clock.GetUtcNow() - stored > Expiry)
        {
            return ConsentStatus.Unknown;
        }

        return parsed.State == "granted" ? ConsentStatus.Granted : ConsentStatus.Denied;
    }

    private async Task PersistAsync(bool grant)
    {
        long ts = clock.GetUtcNow().ToUnixTimeMilliseconds();
        StoredConsent payload = new(grant ? "granted" : "denied", ts);
        string raw = JsonSerializer.Serialize(payload);
        try { await js.InvokeAsync<object>("localStorage.setItem", StorageKey, raw); }
        catch (JSException) { /* storage gone — keep in-memory state anyway */ }
        catch (JSDisconnectedException) { /* circuit gone */ }
        store.Dispatch(new SetConsent(grant ? ConsentStatus.Granted : ConsentStatus.Denied));
    }

    private void RelayConsentChange()
    {
        ConsentStatus current = store.State.Consent;
        if (current == lastSeen) { return; }
        lastSeen = current;
        OnChanged?.Invoke();
    }

    private sealed record StoredConsent(string State, long Ts);
}
