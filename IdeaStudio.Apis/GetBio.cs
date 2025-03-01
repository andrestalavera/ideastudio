using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace IdeaStudio.Apis;

public class GetBio
{
	private readonly ILogger<GetBio> _logger;

	public GetBio(ILogger<GetBio> logger)
	{
		_logger = logger;
	}

	[Function("GetBio")]
	public IActionResult Run([HttpTrigger(AuthorizationLevel.Function, "get", "post")] HttpRequest req)
	{
		_logger.LogInformation("C# HTTP trigger function processed a request.");
		return new OkObjectResult("Welcome to Azure Functions!");
	}
}
