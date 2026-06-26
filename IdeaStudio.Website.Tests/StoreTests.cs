using IdeaStudio.Website.Services;
using IdeaStudio.Website.State;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using Microsoft.JSInterop.Infrastructure;
using Moq;

namespace IdeaStudio.Website.Tests;

public class StoreTests
{
    private static Store<AppState> NewStore() => new(AppState.Initial, AppReducer.Reduce);

    [Fact]
    public void Reduce_SameInput_ProducesEqualOutput()
    {
        AppState state = AppState.Initial;

        AppState first = AppReducer.Reduce(state, new SetTheme("light"));
        AppState second = AppReducer.Reduce(state, new SetTheme("light"));

        Assert.Equal(first, second);
    }

    [Fact]
    public void Reduce_DoesNotMutateOriginalState()
    {
        AppState original = AppState.Initial;

        AppReducer.Reduce(original, new SetTheme("light"));
        AppReducer.Reduce(original, new SetCulture("en"));
        AppReducer.Reduce(original, new SetConsent(ConsentStatus.Granted));

        Assert.Equal("dark", original.Theme);
        Assert.Equal("fr", original.Culture);
        Assert.Equal(ConsentStatus.Unknown, original.Consent);
    }

    [Fact]
    public void Reduce_NoOpAction_ReturnsSameReference()
    {
        AppState state = AppState.Initial;

        AppState next = AppReducer.Reduce(state, new SetTheme("dark"));

        Assert.Same(state, next);
    }

    [Fact]
    public void Dispatch_SetTheme_TransitionsState()
    {
        Store<AppState> store = NewStore();

        store.Dispatch(new SetTheme("light"));

        Assert.Equal("light", store.State.Theme);
    }

    [Fact]
    public void Dispatch_ToggleTheme_FlipsTheme()
    {
        Store<AppState> store = NewStore();

        store.Dispatch(new ToggleTheme());
        Assert.Equal("light", store.State.Theme);

        store.Dispatch(new ToggleTheme());
        Assert.Equal("dark", store.State.Theme);
    }

    [Fact]
    public void Dispatch_SetCulture_TransitionsState()
    {
        Store<AppState> store = NewStore();

        store.Dispatch(new SetCulture("en"));

        Assert.Equal("en", store.State.Culture);
    }

    [Fact]
    public void Dispatch_SetConsent_TransitionsState()
    {
        Store<AppState> store = NewStore();

        store.Dispatch(new SetConsent(ConsentStatus.Granted));

        Assert.Equal(ConsentStatus.Granted, store.State.Consent);
    }

    [Fact]
    public void Changed_OnRealChange_Fires()
    {
        Store<AppState> store = NewStore();
        int fired = 0;
        store.Changed += () => fired++;

        store.Dispatch(new SetTheme("light"));

        Assert.Equal(1, fired);
    }

    [Fact]
    public void Changed_OnNoOpDispatch_DoesNotFire()
    {
        Store<AppState> store = NewStore();
        int fired = 0;
        store.Changed += () => fired++;

        store.Dispatch(new SetTheme("dark"));

        Assert.Equal(0, fired);
    }

    [Fact]
    public async Task ThemeService_SetThemeAsync_RoundTripsThroughStore()
    {
        Store<AppState> store = NewStore();
        Mock<IJSRuntime> js = new();
        js.Setup(j => j.InvokeAsync<IJSVoidResult>(It.IsAny<string>(), It.IsAny<object?[]?>()))
            .Returns(new ValueTask<IJSVoidResult>(Mock.Of<IJSVoidResult>()));
        ThemeService service = new(js.Object, store);

        await service.SetThemeAsync("light");

        Assert.Equal("light", store.State.Theme);
    }

    [Fact]
    public async Task ThemeService_GetThemeAsync_HydratesStoreFromJs()
    {
        Store<AppState> store = NewStore();
        Mock<IJSRuntime> js = new();
        js.Setup(j => j.InvokeAsync<string>(It.IsAny<string>(), It.IsAny<object?[]?>()))
            .Returns(new ValueTask<string>("light"));
        ThemeService service = new(js.Object, store);

        string theme = await service.GetThemeAsync();

        Assert.Equal("light", theme);
        Assert.Equal("light", store.State.Theme);
    }

    [Fact]
    public async Task ConsentService_AcceptAsync_RoundTripsThroughStore()
    {
        Store<AppState> store = NewStore();
        Mock<IJSRuntime> js = new();
        js.Setup(j => j.InvokeAsync<object>(It.IsAny<string>(), It.IsAny<object?[]?>()))
            .Returns(new ValueTask<object>(new object()));
        ConsentService service = new(js.Object, TimeProvider.System, store);
        int fired = 0;
        service.OnChanged += () => fired++;

        await service.AcceptAsync();

        Assert.True(service.HasDecided);
        Assert.True(service.IsGranted);
        Assert.Equal(ConsentStatus.Granted, store.State.Consent);
        Assert.Equal(1, fired);
    }

    [Fact]
    public async Task ConsentService_DeclineAsync_RoundTripsThroughStore()
    {
        Store<AppState> store = NewStore();
        Mock<IJSRuntime> js = new();
        js.Setup(j => j.InvokeAsync<object>(It.IsAny<string>(), It.IsAny<object?[]?>()))
            .Returns(new ValueTask<object>(new object()));
        ConsentService service = new(js.Object, TimeProvider.System, store);

        await service.DeclineAsync();

        Assert.True(service.HasDecided);
        Assert.False(service.IsGranted);
        Assert.Equal(ConsentStatus.Denied, store.State.Consent);
    }

    [Fact]
    public async Task ConsentService_OnChanged_NoOpRepeat_DoesNotFireAgain()
    {
        Store<AppState> store = NewStore();
        Mock<IJSRuntime> js = new();
        js.Setup(j => j.InvokeAsync<object>(It.IsAny<string>(), It.IsAny<object?[]?>()))
            .Returns(new ValueTask<object>(new object()));
        ConsentService service = new(js.Object, TimeProvider.System, store);
        int fired = 0;
        service.OnChanged += () => fired++;

        await service.AcceptAsync();
        await service.AcceptAsync();

        Assert.Equal(1, fired);
    }

    [Fact]
    public async Task CultureService_SetCultureAsync_RoundTripsThroughStore()
    {
        Store<AppState> store = NewStore();
        CultureService service = new(Mock.Of<IJSRuntime>(), new TestNavigationManager(), store);
        int fired = 0;
        service.CultureChanged += () => fired++;

        await service.SetCultureAsync("en");

        Assert.Equal("en", service.CurrentCulture.Name);
        Assert.Equal("en", store.State.Culture);
        Assert.Equal(1, fired);
    }

    [Fact]
    public async Task CultureService_SetCultureAsync_SameCulture_DoesNotFire()
    {
        Store<AppState> store = NewStore();
        CultureService service = new(Mock.Of<IJSRuntime>(), new TestNavigationManager(), store);
        int fired = 0;
        service.CultureChanged += () => fired++;

        await service.SetCultureAsync("fr");

        Assert.Equal(0, fired);
    }

    private sealed class TestNavigationManager : NavigationManager
    {
        public TestNavigationManager() => Initialize("https://localhost/", "https://localhost/fr");
    }
}
