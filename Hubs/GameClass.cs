using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;
using Nancy.Json;
using System;
using System.Linq;
using System.Collections.Concurrent;
using PersonalizedCardGame.Models;
using PersonalizedCardGame;
using System.Text;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json.Linq;

namespace PersonalizedCardGame.Hubs
{
    public class GameClass : Hub
    {
        public static List<string> ConnectionIds = new List<string>();
        public static bool IsBusy = false;
        private static readonly ConcurrentDictionary<string, string> Users = new ConcurrentDictionary<string, string>();

        public int SendMessage(string user, string message)
        {
            try
            {
                if (IsBusy == false)
                {
                    IsBusy = true;
                    var val1 = Context.ConnectionId;
                    var val2 = Context.User;
                    var val3 = Clients.Caller;

                    ConnectionIds.Add(user + "===" + message);

                    Clients.All.SendAsync("ReceiveMessage", user, message);
                    return 1;
                }
                else
                {
                    return 0;
                }
            }
            catch (Exception ex)
            {
                return -1;
            }
        }

        public async Task SendNotification(string gamecode, string playerid, string notificationmessage)
        {
            var val1 = Context.ConnectionId;
            var val2 = Context.User;
            var val3 = Clients.Caller;

            // ConnectionIds.Add(user + "===" + message);

            await Clients.All.SendAsync("ReceiveNotification", gamecode, playerid, notificationmessage);
        }


        public async Task GameLog(string GameCode, string ActionName, string PlayerUniqueId, string PlayerName)
        {



        }




        public async Task SendEndGameSummary(string gamecode)
        {
            var val1 = Context.ConnectionId;
            var val2 = Context.User;
            var val3 = Clients.Caller;

            // ConnectionIds.Add(user + "===" + message);

            await Clients.All.SendAsync("ReceiveEndGameSummary", gamecode);
        }



        public async Task SendEndHandSummary(string gamecode)
        {
            var val1 = Context.ConnectionId;
            var val2 = Context.User;
            var val3 = Clients.Caller;

            // ConnectionIds.Add(user + "===" + message);

            await Clients.All.SendAsync("ReceiveEndHandSummary", gamecode);
        }




        public async Task SendMessage2(string user, string message, string test)
        {
            var val1 = Context.ConnectionId;
            var val2 = Context.User;
            var val3 = Clients.Caller;

            ConnectionIds.Add(user + "===" + message);

            JavaScriptSerializer js = new JavaScriptSerializer();
            string jsonData = js.Serialize(ConnectionIds); // {"Name":"C-

            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }




        public async Task ReceiveOnLoad(string user, string message)
        {
            var val1 = Context.ConnectionId;
            var val2 = Context.User;
            var val3 = Clients.Caller;

            // string val1 = "";
            JavaScriptSerializer js = new JavaScriptSerializer();
            string jsonData = js.Serialize(ConnectionIds); // {"Name":"C-



            await Clients.All.SendAsync("ReceiveMessage", user, jsonData);
        }


        public override Task OnConnectedAsync()
        {

            //var x = Clients.Caller

            HttpContext httpContext = Context.GetHttpContext();
            //xx.Session.TryGetValue("UserId",out a);
            // var CurrentUser = Encoding.ASCII.GetString(a);
            //xx.Request.HttpContext.
            var customQuerystring = httpContext.Request.QueryString.Value.Split("&").FirstOrDefault().Split("=").LastOrDefault();


            using (var _context = new DBCardGameContext())
            {

                var player = _context.Player.Where(x => x.PlayerUniqueId == customQuerystring).FirstOrDefault();
                if (player != null)
                {
                    player.LastActionTime = DateTime.Now;
                    player.Modified = DateTime.Now;
                    player.SignalRconnectionId = Context.ConnectionId;
                    player.IsConnected = true;

                    _context.SaveChanges();

                }
                else
                {

                    _context.Player.Add(new Player() { Created = DateTime.Now, IsConnected = true, LastActionTime = DateTime.Now, PlayerUniqueId = customQuerystring, SignalRconnectionId = Context.ConnectionId });
                    _context.SaveChanges();



                }
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {


            using (var _context = new DBCardGameContext())
            {

                try
                {

                    var disconnectedplayer = _context.Player.Where(x => x.SignalRconnectionId == Context.ConnectionId).FirstOrDefault();

                    if (disconnectedplayer != null)
                    {

                        if (disconnectedplayer.CurrentGameCode != "" && disconnectedplayer.CurrentGameCode != null)
                        {



                            disconnectedplayer.IsConnected = false;
                            disconnectedplayer.IsActive = false;
                            disconnectedplayer.IsCurrent = false;
                            disconnectedplayer.IsDealer = false;
                            disconnectedplayer.IsFolded = false;

                            _context.SaveChanges();


                            var allrelatedplayers = _context.Player.Where(x => x.CurrentGameCode == disconnectedplayer.CurrentGameCode).ToList();
                            foreach (var ar in allrelatedplayers)
                            {
                                Clients.Client(ar.SignalRconnectionId).SendAsync("OtherPlayerDisconnected", Context.ConnectionId, disconnectedplayer.UserName);

                            }


                        }
                    }
                }
                catch (Exception ex)
                {



                }
            }



            Task tsk = new Task(() =>
            {

            });

            return tsk;
            //return base.OnDisconnectedAsync();

        }




    }




}