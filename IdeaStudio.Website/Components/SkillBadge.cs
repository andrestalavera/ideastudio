using System.Collections.Frozen;
using System.Runtime.CompilerServices;

namespace IdeaStudio.Website.Components;

public static class SkillBadge
{
    private static readonly FrozenDictionary<string, string> skillToBadgeMap =
     CreateSkillMappings().ToFrozenDictionary(StringComparer.OrdinalIgnoreCase);

    private const string FaGlobePointer = "fa-globe-pointer";
    private const string FaDatabase = "fa-database";
    private const string FaCubes = "fa-cubes";
    private const string FaMobileNotch = "fa-mobile-notch";
    private const string FaLock = "fa-lock";
    private const string FaUsers = "fa-users";
    private const string FaBolt = "fa-bolt";
    private const string FaPlug = "fa-plug";
    private const string FaArrowProgress = "fa-arrow-progress";
    private const string FaChartPieSimpleCircleDollar = "fa-chart-pie-simple-circle-dollar";
    private const string FaHardDrive = "fa-hard-drive";
    private const string FaSitemap = "fa-sitemap";
    private const string FaFlask = "fa-flask";
    private const string FaCodeBranch = "fa-code-branch";
    private const string FaMonitorWaveform = "fa-monitor-waveform";
    private const string FaCloud = "fa-cloud";

    private static Dictionary<string, string> CreateSkillMappings() => new()
    {
        // Technologies web & front-end
        ["javascript"] = FaGlobePointer,
        ["typescript"] = FaGlobePointer,
        ["angular"] = FaGlobePointer,
        ["react"] = FaGlobePointer,
        ["vue"] = FaGlobePointer,
        ["web"] = FaGlobePointer,
        ["blazor"] = FaGlobePointer,
        ["swagger"] = FaGlobePointer,
        ["asp.net"] = FaGlobePointer,

        // Base de données
        ["sql"] = FaDatabase,
        ["db"] = FaDatabase,
        ["data"] = FaDatabase,
        ["graphql"] = FaDatabase,
        ["entity framework"] = FaDatabase,

        // Conteneurs
        ["docker"] = FaCubes,
        ["kubernetes"] = FaCubes,

        // Mobile
        ["xamarin"] = FaMobileNotch,
        ["mobile"] = FaMobileNotch,

        // Sécurité
        ["key vault"] = FaLock,
        ["security"] = FaLock,
        ["authentication"] = FaLock,
        ["authorization"] = FaLock,

        // Identity
        ["active directory"] = FaUsers,
        ["aad"] = FaUsers,
        ["entra"] = FaUsers,
        ["managed identities"] = FaUsers,

        // Serverless
        ["azure functions"] = FaBolt,
        ["serverless"] = FaBolt,
        ["lambda"] = FaBolt,

        // API
        ["api"] = FaPlug,
        ["rest"] = FaPlug,

        // DevOps
        ["service bus"] = FaArrowProgress,
        ["ci/cd"] = FaArrowProgress,
        ["bicep"] = FaArrowProgress,
        ["logic apps"] = FaArrowProgress,
        ["power apps"] = FaArrowProgress,

        // Monitoring
        ["monitor"] = FaMonitorWaveform,
        ["ops"] = FaMonitorWaveform,

        // Finance
        ["finops"] = FaChartPieSimpleCircleDollar,
        ["banking"] = FaChartPieSimpleCircleDollar,

        // Infrastructure
        ["storage"] = FaHardDrive,
        ["architecture"] = FaSitemap,
        ["microservices"] = FaSitemap,
        ["onion"] = FaSitemap,
        ["hexagonal"] = FaSitemap,

        // Tests
        ["test"] = FaFlask,
        ["ddd"] = FaFlask,

        // Version control
        ["git"] = FaCodeBranch,
        ["devops"] = FaCodeBranch,

        // Cloud
        ["azure"] = FaCloud,
        ["cloud"] = FaCloud
    };

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public static string GetSkillIcon(string? skill)
    {
        if (string.IsNullOrWhiteSpace(skill))
            return "fa-code";

        if (skillToBadgeMap.GetAlternateLookup<ReadOnlySpan<char>>().TryGetValue(skill.AsSpan().Trim(), out string? exactMatch))
            return exactMatch;

        string normalizedSkill = skill.Trim().ToLowerInvariant();
        foreach ((string? key, string? badge) in skillToBadgeMap)
        {
            if (normalizedSkill.Contains(key))
                return badge;
        }

        return "fa-code";
    }
}
