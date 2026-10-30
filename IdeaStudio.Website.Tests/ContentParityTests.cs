using System.Text.Json;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// Guards FR/EN parity of the content under wwwroot. Each data/*-fr.json file must have
/// the same shape as its -en twin (same object keys, same array lengths, recursively),
/// and the two i18n string tables must define the same keys. A missing bullet, tag or
/// location in one language is drift, not a translation choice.
/// </summary>
public class ContentParityTests
{
    public static TheoryData<string> DataPairs()
    {
        TheoryData<string> data = [];
        foreach (string fr in Directory.GetFiles(Path.Combine(Wwwroot(), "data"), "*-fr.json").Order())
        {
            data.Add(Path.GetFileName(fr)[..^"-fr.json".Length]);
        }
        return data;
    }

    [Theory]
    [MemberData(nameof(DataPairs))]
    public void DataPair_FrAndEn_HaveSameShape(string name)
    {
        using JsonDocument fr = Load(Path.Combine("data", $"{name}-fr.json"));
        using JsonDocument en = Load(Path.Combine("data", $"{name}-en.json"));

        List<string> differences = [];
        CompareShape(fr.RootElement, en.RootElement, "$", differences);

        Assert.True(differences.Count == 0, $"{name}: FR/EN shape differs at{Environment.NewLine}{string.Join(Environment.NewLine, differences)}");
    }

    [Fact]
    public void I18n_FrAndEn_DefineSameKeys()
    {
        using JsonDocument fr = Load(Path.Combine("i18n", "fr.json"));
        using JsonDocument en = Load(Path.Combine("i18n", "en.json"));

        string[] frKeys = [.. fr.RootElement.EnumerateObject().Select(p => p.Name).Order()];
        string[] enKeys = [.. en.RootElement.EnumerateObject().Select(p => p.Name).Order()];

        Assert.Equal(frKeys, enKeys);
    }

    private static void CompareShape(JsonElement fr, JsonElement en, string path, List<string> differences)
    {
        if (fr.ValueKind != en.ValueKind)
        {
            differences.Add($"{path}: {fr.ValueKind} vs {en.ValueKind}");
            return;
        }

        switch (fr.ValueKind)
        {
            case JsonValueKind.Object:
                HashSet<string> enNames = [.. en.EnumerateObject().Select(p => p.Name)];
                foreach (JsonProperty property in fr.EnumerateObject())
                {
                    if (en.TryGetProperty(property.Name, out JsonElement other))
                    {
                        CompareShape(property.Value, other, $"{path}.{property.Name}", differences);
                    }
                    else
                    {
                        differences.Add($"{path}.{property.Name}: missing in EN");
                    }
                    enNames.Remove(property.Name);
                }
                differences.AddRange(enNames.Select(n => $"{path}.{n}: missing in FR"));
                break;

            case JsonValueKind.Array:
                int frLength = fr.GetArrayLength();
                int enLength = en.GetArrayLength();
                if (frLength != enLength)
                {
                    differences.Add($"{path}: {frLength} items vs {enLength}");
                    return;
                }
                for (int i = 0; i < frLength; i++)
                {
                    CompareShape(fr[i], en[i], $"{path}[{i}]", differences);
                }
                break;
        }
    }

    private static JsonDocument Load(string relativePath)
        => JsonDocument.Parse(File.ReadAllText(Path.Combine(Wwwroot(), relativePath)));

    private static string Wwwroot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "IdeaStudio.sln")))
            dir = dir.Parent;
        if (dir is null)
            throw new InvalidOperationException("Could not locate repo root from " + AppContext.BaseDirectory);
        return Path.Combine(dir.FullName, "IdeaStudio.Website", "wwwroot");
    }
}
