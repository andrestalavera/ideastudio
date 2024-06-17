namespace IdeaStudio.Website.Models;

record Experience(string Title, string Company, string Mode, string Interval, string Location, string Description, IEnumerable<string> Responsibilities, IEnumerable<string> Skills);
