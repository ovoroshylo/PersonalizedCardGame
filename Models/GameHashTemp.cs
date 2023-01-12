using System;
using System.Collections.Generic;

namespace PersonalizedCardGame.Models
{
    public partial class GameHashTemp
    {
        public long Id { get; set; }
        public string GameCode { get; set; }
        public string GameHash { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? Created { get; set; }
        public DateTime? Modified { get; set; }
        public string GamePlayerHash { get; set; }
    }
}
