using System;

namespace FlightBookingSystem.Web.Helpers
{
    public static class SearchHelper
    {
        public static bool ContainsKeyword(this string? source, string keyword)
        {
            return !string.IsNullOrEmpty(source) &&
                   source.Contains(keyword, StringComparison.OrdinalIgnoreCase);
        }
    }
}