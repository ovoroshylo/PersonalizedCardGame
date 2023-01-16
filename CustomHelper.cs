using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PersonalizedCardGame;
using PersonalizedCardGame.Hubs;
using System.IO;
using System.Configuration;
//using Microsoft.AspNetCore.Cors;
using Nancy.Json;
using PersonalizedCardGame.Models;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using System.Reflection;
using System.Collections.Concurrent;
/*using PersonalizedCardGame.Models.ViewModels;*/
using Microsoft.AspNetCore.Authorization;
using Newtonsoft.Json;

namespace PersonalizedCardGame
{
    public class CustomHelper
    {
        public bool ExceptionLog(GameLoggingRequest request)
        {

            try
            {
                /*using (var context = new DBCardGameContext())
                {

                    var l = request.UserIdentityFromCookie.Length;

                    context.ExceptionLog.Add(new Models.ExceptionLog()
                    {
                        Created = DateTime.Now,
                        ErrorLog = request.ErrorLog,
                        GameCode = request.GameCode,
                        PlayerUniqueId = request.UserIdentityFromCookie,
                        GameHash = request.GameHash,
                        LogEntryTypeId = request.LogEntryTypeId,
                        ConnectionId = request.ConnectionId,
                        IsActive = true
                    });
                    context.SaveChanges();
                }*/

                return true;

            }
            catch (Exception ex)
            {

                return false;
            
            }

        
        
        
        }





    }
}
