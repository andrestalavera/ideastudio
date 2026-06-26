using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// Covers the lead-gen / conversion path: the pure validation rules extracted
/// from Contact.razor (email shape, honeypot, message min-length, consent).
/// </summary>
public class ContactValidationTests
{
    // Sentinel messages so tests assert WHICH rule fired, not localized copy.
    private static readonly ContactErrorMessages Messages =
        new("REQUIRED", "EMAIL", "MESSAGE", "CONSENT");

    private const string Name = nameof(ContactFormModel.Name);
    private const string Email = nameof(ContactFormModel.Email);
    private const string Message = nameof(ContactFormModel.Message);
    private const string Consent = nameof(ContactFormModel.Consent);

    /// <summary>A model that passes every rule; tweak per test for the failing case.</summary>
    private static ContactFormModel ValidModel() => new()
    {
        Name = "Andrés",
        Email = "andres@ideastud.io",
        Message = "Hello, I would like to discuss a project.",
        Consent = true,
    };

    [Fact]
    public void Validate_MissingName_RequiredError()
    {
        ContactFormModel model = ValidModel();
        model.Name = "";

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Equal("REQUIRED", errors[Name]);
    }

    [Fact]
    public void Validate_WhitespaceName_RequiredError()
    {
        ContactFormModel model = ValidModel();
        model.Name = "   ";

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Equal("REQUIRED", errors[Name]);
    }

    [Fact]
    public void Validate_MissingEmail_RequiredError()
    {
        ContactFormModel model = ValidModel();
        model.Email = "";

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Equal("REQUIRED", errors[Email]);
    }

    [Fact]
    public void Validate_BlankEmail_RequiredError()
    {
        ContactFormModel model = ValidModel();
        model.Email = "   ";

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Equal("REQUIRED", errors[Email]);
    }

    [Theory]
    [InlineData("foo@")]
    [InlineData("foo.com")]
    [InlineData("a@b")]
    [InlineData("@b.com")]
    [InlineData("foo@bar@baz.com")]
    [InlineData("foo bar@baz.com")]
    [InlineData("foo@ bar.com")]
    public void Validate_MalformedEmail_EmailError(string email)
    {
        ContactFormModel model = ValidModel();
        model.Email = email;

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Equal("EMAIL", errors[Email]);
    }

    [Theory]
    [InlineData("andres@ideastud.io")]
    [InlineData("a@b.co")]
    [InlineData("first.last@sub.example.com")]
    public void Validate_ValidEmail_NoEmailError(string email)
    {
        ContactFormModel model = ValidModel();
        model.Email = email;

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.False(errors.ContainsKey(Email));
    }

    [Fact]
    public void Validate_EmailWithSurroundingWhitespace_Trimmed_NoEmailError()
    {
        ContactFormModel model = ValidModel();
        model.Email = "  andres@ideastud.io  ";

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.False(errors.ContainsKey(Email));
    }

    [Fact]
    public void Validate_MessageUnderMinLength_MessageError()
    {
        ContactFormModel model = ValidModel();
        model.Message = new string('a', ContactFormModel.MinMessageLength - 1); // 9 chars

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Equal("MESSAGE", errors[Message]);
    }

    [Fact]
    public void Validate_MessageAtMinLength_NoMessageError()
    {
        ContactFormModel model = ValidModel();
        model.Message = new string('a', ContactFormModel.MinMessageLength); // 10 chars

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.False(errors.ContainsKey(Message));
    }

    [Fact]
    public void Validate_MessageWhitespacePadShortOfMin_MessageError()
    {
        ContactFormModel model = ValidModel();
        // Length 10 but trims to 3 — min-length is measured after trimming.
        model.Message = "   abc    ";

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Equal("MESSAGE", errors[Message]);
    }

    [Fact]
    public void Validate_EmptyMessage_RequiredError()
    {
        ContactFormModel model = ValidModel();
        model.Message = "";

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Equal("REQUIRED", errors[Message]);
    }

    [Fact]
    public void Validate_ConsentUnchecked_ConsentError()
    {
        ContactFormModel model = ValidModel();
        model.Consent = false;

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Equal("CONSENT", errors[Consent]);
    }

    [Fact]
    public void Validate_AllValid_NoErrors()
    {
        ContactFormModel model = ValidModel();

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Empty(errors);
    }

    [Fact]
    public void Validate_MultipleFieldsInvalid_AllReported()
    {
        ContactFormModel model = new(); // everything empty / unchecked

        Dictionary<string, string> errors = model.Validate(Messages);

        Assert.Equal("REQUIRED", errors[Name]);
        Assert.Equal("REQUIRED", errors[Email]);
        Assert.Equal("REQUIRED", errors[Message]);
        Assert.Equal("CONSENT", errors[Consent]);
    }

    // --- Honeypot contract ------------------------------------------------
    // Contact.razor's HandleSubmit short-circuits to a (fake) success WITHOUT
    // sending when IsSpam is true. IsSpam is the testable surface of that
    // contract; it is independent of field validation.

    [Fact]
    public void IsSpam_HoneypotFilled_True()
    {
        ContactFormModel model = ValidModel();
        model.Website = "http://spam.example";

        Assert.True(model.IsSpam);
    }

    [Fact]
    public void IsSpam_HoneypotEmpty_False()
    {
        ContactFormModel model = ValidModel();

        Assert.False(model.IsSpam);
    }

    [Fact]
    public void IsSpam_HoneypotWhitespace_False()
    {
        ContactFormModel model = ValidModel();
        model.Website = "   ";

        Assert.False(model.IsSpam);
    }

    [Fact]
    public void IsValidEmail_StaticHelper_MatchesRegexRules()
    {
        Assert.True(ContactFormModel.IsValidEmail("andres@ideastud.io"));
        Assert.False(ContactFormModel.IsValidEmail("foo@"));
    }
}
