namespace IdeaStudio.Website;

public static partial class LoggerExtensions
{

    [LoggerMessage(EventId = 1, Level = LogLevel.Critical, Message = "HTTP error loading data from {Url}: {Message}")]
    public static partial void HttpError(this ILogger logger, string url, string message, Exception ex);

    [LoggerMessage(EventId = 2, Level = LogLevel.Critical, Message = "Request canceled loading data from {Url}: {Message}")]
    public static partial void HttpRequestCanceled(this ILogger logger, string url, string message, Exception ex);

    [LoggerMessage(EventId = 3, Level = LogLevel.Critical, Message = "JSON error loading data from {Url}: {Message}")]
    public static partial void JsonError(this ILogger logger, string url, string message, Exception ex);

    [LoggerMessage(EventId = 4, Level = LogLevel.Critical, Message = "Unknown error: {Message}")]
    public static partial void Exception(this ILogger logger, string message, Exception ex);
}
