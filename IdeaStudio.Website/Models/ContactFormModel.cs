using System.Text.RegularExpressions;

namespace IdeaStudio.Website.Models;

/// <summary>
/// The contact-form state plus its pure, Blazor-independent validation logic.
/// Lives outside the Razor <c>@code</c> block so the conversion-path rules
/// (email shape, honeypot, message length, consent) are unit-testable without
/// rendering. <see cref="Pages.Contact"/> binds to this and calls
/// <see cref="Validate"/> / <see cref="IsSpam"/>; the rules here must stay
/// identical to the page's previous inline behaviour.
/// </summary>
public sealed class ContactFormModel
{
    /// <summary>Minimum trimmed length for the message body.</summary>
    public const int MinMessageLength = 10;

    // Same pattern the page used inline: a non-empty local part, a single '@',
    // and a dotted domain, none of which may contain whitespace or extra '@'.
    private static readonly Regex EmailRegex =
        new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled, TimeSpan.FromSeconds(1));

    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Subject { get; set; }
    public string Message { get; set; } = "";
    public bool Consent { get; set; }

    /// <summary>Honeypot field — hidden from humans, tempting to bots.</summary>
    public string? Website { get; set; }

    /// <summary>
    /// True when the honeypot is filled. Callers treat this as spam and silently
    /// short-circuit (accept without sending) rather than surfacing an error.
    /// </summary>
    public bool IsSpam => !string.IsNullOrWhiteSpace(Website);

    /// <summary>True when <paramref name="email"/> matches the form's email shape.</summary>
    public static bool IsValidEmail(string email) => EmailRegex.IsMatch(email);

    /// <summary>
    /// Validates the field values and returns a field-name → message map of
    /// errors. An empty dictionary means the form is valid. Keys are the
    /// property names (<c>Name</c>, <c>Email</c>, <c>Message</c>, <c>Consent</c>).
    /// </summary>
    public Dictionary<string, string> Validate(ContactErrorMessages messages)
    {
        Dictionary<string, string> errors = new();

        if (string.IsNullOrWhiteSpace(Name))
        {
            errors[nameof(Name)] = messages.Required;
        }

        if (string.IsNullOrWhiteSpace(Email))
        {
            errors[nameof(Email)] = messages.Required;
        }
        else if (!EmailRegex.IsMatch(Email.Trim()))
        {
            errors[nameof(Email)] = messages.Email;
        }

        if (string.IsNullOrWhiteSpace(Message))
        {
            errors[nameof(Message)] = messages.Required;
        }
        else if (Message.Trim().Length < MinMessageLength)
        {
            errors[nameof(Message)] = messages.Message;
        }

        if (!Consent)
        {
            errors[nameof(Consent)] = messages.Consent;
        }

        return errors;
    }
}

/// <summary>
/// Localized error strings handed to <see cref="ContactFormModel.Validate"/> so
/// the validation logic stays free of culture/UI concerns.
/// </summary>
public sealed record ContactErrorMessages(string Required, string Email, string Message, string Consent);
