using System.Collections.Frozen;
using System.Runtime.CompilerServices;

namespace IdeaStudio.Website.Shared;

public static class SkillBadgeOptimized
{
	private static readonly FrozenDictionary<string, string> SkillToBadgeMap =
		CreateSkillMappings().ToFrozenDictionary(StringComparer.OrdinalIgnoreCase);

	private static Dictionary<string, string> CreateSkillMappings() => new()
	{
		// Technologies web & front-end
		["javascript"] = "fa-globe-pointer",
		["typescript"] = "fa-globe-pointer",
		["angular"] = "fa-globe-pointer",
		["react"] = "fa-globe-pointer",
		["vue"] = "fa-globe-pointer",
		["web"] = "fa-globe-pointer",
		["blazor"] = "fa-globe-pointer",
		["swagger"] = "fa-globe-pointer",
		["asp.net"] = "fa-globe-pointer",

		// Base de données
		["sql"] = "fa-database",
		["db"] = "fa-database",
		["data"] = "fa-database",
		["graphql"] = "fa-database",
		["entity framework"] = "fa-database",

		// Conteneurs
		["docker"] = "fa-cubes",
		["kubernetes"] = "fa-cubes",

		// Mobile
		["xamarin"] = "fa-mobile-notch",
		["mobile"] = "fa-mobile-notch",

		// Sécurité
		["key vault"] = "fa-lock",
		["security"] = "fa-lock",
		["authentication"] = "fa-lock",
		["authorization"] = "fa-lock",

		// Identity
		["active directory"] = "fa-users",
		["aad"] = "fa-users",
		["entra"] = "fa-users",
		["managed identities"] = "fa-users",

		// Serverless
		["azure functions"] = "fa-bolt",
		["serverless"] = "fa-bolt",
		["lambda"] = "fa-bolt",

		// API
		["api"] = "fa-plug",
		["rest"] = "fa-plug",

		// DevOps
		["service bus"] = "fa-arrow-progress",
		["ci/cd"] = "fa-arrow-progress",
		["bicep"] = "fa-arrow-progress",
		["logic apps"] = "fa-arrow-progress",
		["power apps"] = "fa-arrow-progress",

		// Finance
		["finops"] = "fa-chart-pie-simple-circle-dollar",

		// Infrastructure
		["storage"] = "fa-hard-drive",
		["architecture"] = "fa-sitemap",
		["microservices"] = "fa-sitemap",
		["onion"] = "fa-sitemap",
		["hexagonal"] = "fa-sitemap",

		// Tests
		["test"] = "fa-flask",
		["ddd"] = "fa-flask",

		// Version control
		["git"] = "fa-code-branch",
		["devops"] = "fa-code-branch",

		// Monitoring
		["monitor"] = "fa-monitor-waveform",

		// Cloud
		["azure"] = "fa-cloud",
		["cloud"] = "fa-cloud"
	};

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	public static string GetSkillBadge(string skill)
	{
		if (string.IsNullOrWhiteSpace(skill))
			return "fa-code";

		ReadOnlySpan<char> skillSpan = skill.AsSpan().Trim();

		// Recherche exacte avec AlternateLookup (.NET 9)
		FrozenDictionary<string, string>.AlternateLookup<ReadOnlySpan<char>> lookup = SkillToBadgeMap.GetAlternateLookup<ReadOnlySpan<char>>();
		if (lookup.TryGetValue(skillSpan, out string? exactMatch))
			return exactMatch;

		// Recherche partielle optimisée
		string normalizedSkill = skill.Trim().ToLowerInvariant();
		foreach ((string? key, string? badge) in SkillToBadgeMap)
		{
			if (normalizedSkill.Contains(key))
				return badge;
		}

		return "fa-code";
	}
}
