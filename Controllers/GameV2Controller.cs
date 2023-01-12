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
using PersonalizedCardGame.Models;
using Microsoft.AspNetCore.Authorization;

namespace PersonalizedCardGame.Controllers
{
    [AllowAnonymous]
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class GameV2Controller : ControllerBase
    {

        private IHubContext<GameClass> _HubContext;
        private CustomHelper _helper;
        private DBCardGameContext _CardGameContext;

        public GameV2Controller(IHubContext<GameClass> hubcontext, DBCardGameContext context)
        {
            _CardGameContext = context;
            if (_HubContext == null)
            {
                _HubContext = hubcontext;
            }

            if (_helper == null)
                _helper = new CustomHelper();
        }

        [HttpGet]
        public string TestGet()
        {
            return "helloword";

        }

        [HttpPost]
        public string TestGet1()
        {
            return "helloword";

        }

        [HttpPost]
        public IActionResult _CreateGame([FromBody] CreateGame model)
        {
            var resp = new CommonResponse();
            try
            {
                var gameresp = _CardGameContext.GameHashTemp.Where(x => x.GameCode == model.GameCode).FirstOrDefault();

                // temporary if not keeping the records
                List<GameHashTemp> deps = _CardGameContext.GameHashTemp.Where(x => x.Created < DateTime.Now.AddDays(-10) && x.Modified < DateTime.Now.AddDays(-10)).ToList();
                _CardGameContext.GameHashTemp.RemoveRange(deps);
                _CardGameContext.SaveChanges();

                if (gameresp == null)
                {
                    resp.Message = "Success";
                    resp.ResponseCode = "100";

                    //for unittesting 
                    JavaScriptSerializer js = new JavaScriptSerializer();
                    var gameplayerhash = js.Deserialize<ActivePlayer>(model.GamePlayerHash);

                    _CardGameContext.GameHashTemp.Add(new GameHashTemp() { Created = DateTime.Now, GameCode = model.GameCode, GameHash = model.GameHash, IsActive = true, GamePlayerHash = model.GamePlayerHash });

                    var currentplayer = _CardGameContext.Player.Where(x => x.PlayerUniqueId == model.PlayerUniqueId).FirstOrDefault();
                    currentplayer.CurrentGameCode = model.GameCode;
                    currentplayer.IsConnected = true;
                    currentplayer.IsDealer = true;
                    currentplayer.IsActive = true;
                    currentplayer.UserName = model.UserId;
                    _CardGameContext.SaveChanges();

                    return Ok(resp);
                }
                else
                {
                    resp.Message = "Game Already exist. Please try with new code";
                    resp.ResponseCode = "150";
                    return Ok(resp);
                }

            }
            catch (Exception ex)
            {
                _helper.ExceptionLog(new GameLoggingRequest() { ErrorLog = ex.Message, GameCode = model.GameCode, GameHash = model.GameHash, UserIdentityFromCookie = model.PlayerUniqueId });
                resp.Message = "error";
                resp.ResponseCode = "101";
                return Ok(resp);
            }

        }

        [HttpPost]
        public IActionResult _JoinGame([FromBody] CreateGame model)
        {

            try
            {
                var resp = new CommonResponse();
                var gameresp = _CardGameContext.GameHashTemp.Where(x => x.GameCode == model.GameCode && x.IsActive == true).FirstOrDefault();
                if (gameresp != null)
                {

                    gameresp.GamePlayerHash = model.GamePlayerHash;

                    var currentplayer = _CardGameContext.Player.Where(x => x.PlayerUniqueId == model.PlayerUniqueId).FirstOrDefault();
                    currentplayer.CurrentGameCode = model.GameCode;
                    currentplayer.IsConnected = true;
                    currentplayer.IsActive = true;
                    currentplayer.UserName = model.UserId;

                    _CardGameContext.SaveChanges();
                    return Ok(gameresp);


                }
                else
                {
                    return Ok(null);

                }
                // PersonalizedCardGame.Hubs.GameClass.
            }
            catch (Exception ex)
            {

                ExceptionLogger(" RequestModel " + model.UserId + " --> " + ex.InnerException.ToString() + MethodBase.GetCurrentMethod());
                return Ok(null);
            }
        }

        [HttpPost]
        public IActionResult _PlayerAction([FromBody] PlayerGenericActionRequest model)
        {

            var resp = new PlayerActionResponse();
            try
            {
                var playertmp = _CardGameContext.Player.Where(x => x.UserName == model.PlayerUniqueId).FirstOrDefault();


                if (playertmp != null)
                {
                    if (model.ActionCode == "SitOut")
                    {
                        playertmp.IsSitOut = true;
                        playertmp.Modified = DateTime.Now;
                    }
                    else if (model.ActionCode == "Rejoin")
                    {

                        playertmp.IsSitOut = false;
                        playertmp.Modified = DateTime.Now;

                    }


                    _CardGameContext.SaveChanges();
                    resp.ErrCode = "100";
                    resp.ErrMessage = "success";
                }
                else
                {
                    resp.ErrCode = "101";
                    resp.ErrMessage = "Player not found";

                }


                _helper.ExceptionLog(new GameLoggingRequest()
                {
                    ConnectionId = model.ConnectionId,
                    ErrorLog = model.ActionCode,
                    GameCode = model.GameCode,
                    GameHash = model.GameHash,
                    LogEntryTypeId = 1,
                    UserIdentityFromCookie = model.PlayerUniqueId
                });
            }
            catch (Exception ex)
            {

                resp.ErrCode = "102";
                resp.ErrMessage = ex.Message;

            }

            return Ok(resp);

        }


        [HttpPost]
        public IActionResult _GetGamePlayers([FromBody] PlayerGenericActionRequest model)
        {

            var resp = new PlayerActionResponse();
            try
            {
                var playerlist = _CardGameContext.Player.Where(x => x.CurrentGameCode == model.GameCode && x.Created > DateTime.Now.AddDays(-1)).OrderByDescending(x => x.Created).ToList().TakeLast(10);
                if (playerlist != null)
                {
                    var lst = playerlist.ToList();
                    return Ok(playerlist.ToList());

                }
                else
                {
                    return Ok(new List<Player>());

                }
            }
            catch (Exception ex)
            {
                return Ok(null);
            }
        }

        [HttpPost]
        public IActionResult _GetGameHash([FromBody] string GameCode)
        {
            try
            {
                if (!string.IsNullOrEmpty(GameCode))
                {

                    var resp = new CommonResponse();
                    var gameresp = _CardGameContext.GameHashTemp.Where(x => x.GameCode == GameCode && x.IsActive == true).FirstOrDefault();
                    if (gameresp != null)
                    {
                        return Ok(gameresp.GameHash);
                    }
                    else
                    {
                        return Ok("error- game not found " + GameCode);
                    }
                    // PersonalizedCardGame.Hubs.GameClass.
                }
                else
                {
                    ExceptionLogger(" RequestModel  --> requested for empty code ");
                    return Ok("error");

                }
            }
            catch (Exception ex)
            {

                ExceptionLogger(" RequestModel  --> " + ex.InnerException.ToString() + MethodBase.GetCurrentMethod());
                return Ok("error");
            }
        }


        [HttpPost]
        public IActionResult _UpdateGameHash([FromBody] UpdateHashRequest model)
        {

            var resp = new CommonResponse();

            var PrevHash = _CardGameContext.GameHashTemp.Where(x => x.GameCode == model.GameCode).FirstOrDefault();
            var players = _CardGameContext.Player.Where(x => x.IsActive == true && x.CurrentGameCode == model.GameCode).ToList();
            using (var transaction = _CardGameContext.Database.BeginTransaction())
            {
                try
                {
                    var gameresp = _CardGameContext.GameHashTemp.Where(x => x.GameCode == model.GameCode).FirstOrDefault();
                    if (gameresp != null)
                    {
                        gameresp.GameHash = model.GameHash;
                        gameresp.Modified = DateTime.Now;
                        var userid = _CardGameContext.Player.Where(x => x.PlayerUniqueId == model.PlayerUniqueId).FirstOrDefault().Id;
                        _CardGameContext.GameLog.Add(new GameLog() { Created = DateTime.Now, GameId = gameresp.Id, PlayerId = userid, Action = model.ActionMessage });
                        int updated = _CardGameContext.SaveChanges();

                        transaction.Commit();

                        if (updated == 2)
                        {
                            foreach (var p in players)
                            {
                                _HubContext.Clients.Client(p.SignalRconnectionId).SendAsync("ReceiveHashV1", "100");
                            }
                            return Ok("success");

                        }
                        else
                        {
                            return Ok("Error");
                        }

                    }
                    else
                    {
                        return Ok("Error");

                    }
                }
                catch (Exception ex)
                {

                    transaction.Rollback();

                    foreach (var p in players)
                    {
                        _HubContext.Clients.Client(p.SignalRconnectionId).SendAsync("ReceiveHashV1", PrevHash.GameHash, "100");
                    }

                    ExceptionLogger("UpdateGameHash from" + model.UserId + " --> " + ex.InnerException.ToString());

                    return Ok("error");

                }
                // PersonalizedCardGame.Hubs.GameClass.
            }
        }


        [HttpPost]
        public IActionResult _SendCancelHandNotification([FromBody] SendNotificationRequest model)
        {
            try
            {

                var players = _CardGameContext.Player.Where(x => x.IsActive == true && x.CurrentGameCode == model.GameCode).ToList();
                int updated = _CardGameContext.SaveChanges();

                foreach (var p in players)
                {
                    _HubContext.Clients.Client(p.SignalRconnectionId).SendAsync("ReceiveCancelHandNotification", "100");
                }
                return Ok("success");


            }
            catch (Exception ex)
            {
                return Ok("error");

            }
            // PersonalizedCardGame.Hubs.GameClass.

        }

        [HttpPost]
        public string ExceptionLogger([FromBody] string request)
        {
            return "";

        }

        [HttpPost]
        public IActionResult GameLogginExtension([FromBody] GameLoggingRequest model)
        {
            var resp = new CommonResponse();

            var x = model.GameHash.Length;

            var tsk = _helper.ExceptionLog(model);



            if (tsk == true)
            {
                resp.Message = "success";
                resp.ResponseCode = "100";

            }
            else
            {
                resp.Message = "error";
                resp.ResponseCode = "101";

            }

            return Ok(resp);


        }

        // first time if player dont have unique id 
        [HttpPost]
        public JsonResult _GetUserIdentity([FromBody] string request)
        {
            try
            {
                var guid = Guid.NewGuid().ToString();
                _CardGameContext.Player.Add(new Player() { Created = DateTime.Now, PlayerUniqueId = guid, IsActive = true });
                _CardGameContext.SaveChanges();
                return new JsonResult(guid);

            }
            catch (Exception ex)
            {
                ExceptionLogger(ex.ToString());
                return new JsonResult(ex.ToString());
            }

        }

        // after creating uniqueid and updating connection id 
        [HttpPost]
        public IActionResult _UpdateUserIdentity([FromBody] string request)
        {
            try
            {

                JavaScriptSerializer js = new JavaScriptSerializer();
                var req = js.Deserialize<UpdateUserIdentityRequest>(request);


                var player = _CardGameContext.Player.Where(x => x.PlayerUniqueId == req.PlayerUniqueId).FirstOrDefault();
                if (player != null)
                {
                    player.LastActionTime = DateTime.Now;
                    player.Modified = DateTime.Now;
                    player.SignalRconnectionId = req.SignalRConnectionId;
                    player.IsConnected = true;

                }
                _CardGameContext.SaveChanges();

                return Ok("success");

            }
            catch (Exception ex)
            {
                return Ok("error");
            }

        }
    }
}