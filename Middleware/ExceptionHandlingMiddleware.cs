using System.Net;
using System.Text.Json;

namespace Warehouse.Middleware
{
    // Trajtues global i gabimeve: i kthen përjashtimet e rregullave të biznesit në
    // përgjigje miqësore JSON ({ message }) që frontend-i i lexon, në vend të 500-ës.
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                var (status, message) = ex switch
                {
                    InvalidOperationException => (HttpStatusCode.BadRequest, ex.Message),
                    ArgumentException         => (HttpStatusCode.BadRequest, ex.Message),
                    KeyNotFoundException      => (HttpStatusCode.NotFound, ex.Message),
                    _                          => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
                };

                // Gabimet e papritura (500) i logojmë; mesazhin real nuk ia ekspozojmë klientit.
                if (status == HttpStatusCode.InternalServerError)
                    _logger.LogError(ex, "Unhandled exception on {Path}", context.Request.Path);

                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)status;
                await context.Response.WriteAsync(JsonSerializer.Serialize(new { message }));
            }
        }
    }
}
