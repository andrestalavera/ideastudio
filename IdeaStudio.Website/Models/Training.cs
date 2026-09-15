namespace IdeaStudio.Website.Models;

/// <summary>
/// A single training course from the public catalogue, rendered on the training hub,
/// on /services/formateur and in full on its own page.
/// </summary>
public sealed class Training
{
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public required string Summary { get; init; }
    public required string Category { get; init; }

    /// <summary>The programme, one entry per module. Module durations add up to <see cref="DurationDays"/>.</summary>
    public required IReadOnlyList<TrainingModule> Modules { get; init; }

    /// <summary>What the participants can do once the course is over.</summary>
    public IReadOnlyList<string>? Objectives { get; init; }

    public string? Prerequisites { get; init; }
    public int? DurationDays { get; init; }
    public string? Level { get; init; }
    public string? Audience { get; init; }

    /// <summary>How the course checks that the objectives are met.</summary>
    public string? Evaluation { get; init; }

    public IReadOnlyList<FaqEntry>? Faq { get; init; }

    /// <summary>Exam this course prepares for. The trainer holds no certification.</summary>
    public string? Certification { get; init; }
}

/// <summary>One module of a training programme.</summary>
public sealed class TrainingModule
{
    public required string Title { get; init; }
    public required IReadOnlyList<string> Points { get; init; }

    /// <summary>Fraction of a day spent on this module (0.25, 0.5, 1…).</summary>
    public double? DurationDays { get; init; }

    /// <summary>The hands-on exercise that closes the module.</summary>
    public string? Workshop { get; init; }
}
