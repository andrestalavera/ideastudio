using System.Text;
using System.Text.RegularExpressions;

namespace IdeaStudio.Website.Services;

public partial interface ISeoService
{
	string GenerateSlug(string? input);
}

public partial class SeoService : ISeoService
{
	[GeneratedRegex(@"\p{Mn}", RegexOptions.CultureInvariant)]
	protected static partial Regex DiacriticsRegex();

	[GeneratedRegex(@"[ .:,'""/()\&\-_@]+", RegexOptions.CultureInvariant)]
	protected static partial Regex SpecialCharactersRegex();

	[GeneratedRegex(@"-+", RegexOptions.CultureInvariant)]
	protected static partial Regex ConsecutiveHyphensRegex();

	public string GenerateSlug(string? input)
	{
		if (string.IsNullOrWhiteSpace(input)) return string.Empty;

		string lower = input.ToLowerInvariant();
		string normalized = lower.Normalize(NormalizationForm.FormD);
		string withoutDiacritics = DiacriticsRegex().Replace(normalized, string.Empty);

		string withSpecialHandled = withoutDiacritics
			.Replace(".", "dot")
			.Replace("#", "sharp");

		string withoutSpecialCharacters = SpecialCharactersRegex().Replace(withSpecialHandled.Trim(), "-");
		string slug = ConsecutiveHyphensRegex().Replace(withoutSpecialCharacters, "-").Trim('-');

		if (!string.IsNullOrEmpty(slug) && char.IsDigit(slug[0]))
		{
			slug = "id-" + slug;
		}
		return slug;
	}
}
