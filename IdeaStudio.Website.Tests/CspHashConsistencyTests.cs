using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// Guards against CSP hash drift. The <c>script-src</c> in <c>netlify.toml</c>
/// allowlists each inline bootstrap script in <c>wwwroot/index.html</c> by its
/// sha256. If an inline script is edited without recomputing the hash (see
/// <c>scripts/csp-hashes.mjs</c>), the browser blocks it in production — which
/// silently broke <c>&lt;base href&gt;</c> and, with it, framework loading on
/// nested routes. These tests fail CI before such a drift can ship.
/// </summary>
public class CspHashConsistencyTests
{
    // Mirrors scripts/csp-hashes.mjs: inline <script> blocks (those without a src).
    private static readonly Regex ScriptBlock =
        new(@"<script\b([^>]*)>([\s\S]*?)</script>", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex HasSrc = new(@"\bsrc\s*=", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex Sha256Token = new(@"'sha256-[A-Za-z0-9+/=]+'", RegexOptions.Compiled);

    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    private static string IndexHtml => Path.Combine(RepoRoot, "IdeaStudio.Website", "wwwroot", "index.html");
    private static string NetlifyToml => Path.Combine(RepoRoot, "netlify.toml");

    private static List<string> InlineScriptHashes(string html)
    {
        // Normalize CRLF -> LF: Netlify serves LF (pinned by .gitattributes
        // `*.html text eol=lf`) and the browser hashes those exact bytes. A CRLF
        // checkout (core.autocrlf=true) would otherwise compute the wrong hashes.
        html = html.Replace("\r\n", "\n");
        List<string> hashes = [];
        foreach (Match m in ScriptBlock.Matches(html))
        {
            if (HasSrc.IsMatch(m.Groups[1].Value)) continue;
            byte[] digest = SHA256.HashData(Encoding.UTF8.GetBytes(m.Groups[2].Value));
            hashes.Add($"'sha256-{Convert.ToBase64String(digest)}'");
        }
        return hashes;
    }

    private static string CspScriptSrc()
    {
        string toml = File.ReadAllText(NetlifyToml);
        // The Content-Security-Policy value is a single quoted string on one line.
        Match line = Regex.Match(toml, @"Content-Security-Policy\s*=\s*""([^""]*)""");
        Assert.True(line.Success, "Could not find Content-Security-Policy in netlify.toml");
        Match scriptSrc = Regex.Match(line.Groups[1].Value, @"script-src\s([^;]*)");
        Assert.True(scriptSrc.Success, "Could not find script-src directive in CSP");
        return scriptSrc.Groups[1].Value;
    }

    [Fact]
    public void EveryInlineScript_HasMatchingHash_InNetlifyCsp()
    {
        string scriptSrc = CspScriptSrc();
        HashSet<string> allowlisted = Sha256Token.Matches(scriptSrc).Select(m => m.Value).ToHashSet();

        List<string> missing = InlineScriptHashes(File.ReadAllText(IndexHtml))
            .Where(h => !allowlisted.Contains(h))
            .ToList();

        Assert.True(
            missing.Count == 0,
            "Inline <script> blocks in wwwroot/index.html are not allowlisted in netlify.toml script-src. " +
            "Run `cd IdeaStudio.Website && node scripts/csp-hashes.mjs` and update the CSP. Missing:\n" +
            string.Join("\n", missing));
    }

    [Fact]
    public void CspHasNoStaleHashes_NotBackingAnyInlineScript()
    {
        string scriptSrc = CspScriptSrc();
        HashSet<string> allowlisted = Sha256Token.Matches(scriptSrc).Select(m => m.Value).ToHashSet();
        HashSet<string> live = InlineScriptHashes(File.ReadAllText(IndexHtml)).ToHashSet();

        List<string> stale = allowlisted.Where(h => !live.Contains(h)).ToList();

        Assert.True(
            stale.Count == 0,
            "netlify.toml script-src contains sha256 hashes that no inline script produces (drift). " +
            "Remove them or recompute via scripts/csp-hashes.mjs. Stale:\n" + string.Join("\n", stale));
    }

    [Fact]
    public void BaseHref_IsStatic_NotAssignedByInlineScript()
    {
        string html = File.ReadAllText(IndexHtml);

        // A static <base href="/"> cannot be CSP-blocked; a JS-assigned one can,
        // which breaks _framework/* resolution on nested routes.
        Assert.Contains("<base href=\"/\"", html);
        Assert.DoesNotContain("getElementsByTagName('base')", html);
    }
}
