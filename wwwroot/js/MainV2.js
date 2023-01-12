
var CurrentConnectionId = "111";
var CurrentUserId = "1";
var CurrentUserSerialNumber = "1";
var TotalPlayers = 6;
var GameId = 0;
var IsDealer = true;
var Sno = 3;
var GameCode = "";
var CardSelectedValue = "";
var CommunityCardSelectedValue = "";
var PlayerNetStatus = [];
var CurrentHandTransaction; // {GameHand:1, TransactionList: ["owe to 1", "owe to 2"]};
var AllHandTransactionList = []; /// array of CurrentHandTransaction
var FinalPlayerNetStatusTemp = [];
var GameHashOrginal;
var GameSteps = [];
var connection;
var IsCommunityLock = false;
var IsSitOut = false;


var BetTakeLocalValue = 0;
var DealLocalValue = 0;
var AnteLocalValue = 0;


var UserIdentity = {
    UserName: 'steph',
    UniqueId: 'guid', // to be fetched from ajax
    ConnectionId: 'signalr connectionid',
    GameCode: '1312313'
};


// region game props - specific thread
var GameHash = {
    LastActionPerformed: [], // [{PlayerSno:2, Action: 'Bet 2' }]
    GameHand: 1,
    Transaction: [], // [{GameHand:1, TransactionList: []}];
    FinalTransaction: [],
    PlayerNetStatus: [], // [{PlayerId:s1pk213i29031, Status:-12},{PlayerId:s2pk213i29031, Status:12}]
    BetStatus: "New hand. No bet yet.",
    BetStatusSno: 0,
    IsRoundSettlement: "N",
    CurrentBet: 0, // for new req of call
    GameId: "1",
    Deck: GetNewDeck(), /// brandnew deck from common
    ActivePlayers: [{
        PlayerId: "1" // combined username+ConnectionId
        ,
        PlayerName: "P1",
        PlayerCards: [{
            Value: "AD",
            Presentation: "private"
        }, {
            Value: "AD",
            Presentation: "private"
        }],
        PlayerAmount: 0 // taken - bet = amount
        ,
        ConnectionId: "111",
        CurrentRoundStatus: 0


    },
    {
        PlayerId: "2",
        PlayerName: "P2",
        PlayerCards: [{
            Value: "AD",
            Presentation: "private"
        }, {
            Value: "AH",
            Presentation: "private"
        }],
        PlayerAmount: 0 // taken - bet = amount
        ,
        ConnectionId: "222",
        CurrentRoundStatus: 0
    },
    {
        PlayerId: "3",
        PlayerName: "P3",
        PlayerCards: [{
            Value: "2C",
            Presentation: "private"
        }, {
            Value: "5S",
            Presentation: "private"
        }],
        PlayerAmount: 0 // taken - bet = amount
        ,
        ConnectionId: "333",
        CurrentRoundStatus: 0
    },
    {
        PlayerId: "4",
        PlayerName: "P4",
        PlayerCards: [{
            Value: "10S",
            Presentation: "private"
        }, {
            Value: "10H",
            Presentation: "private"
        }],
        PlayerAmount: 0 // taken - bet = amount
        ,
        ConnectionId: "444",
        CurrentRoundStatus: 0
    },
    {
        PlayerId: "5",
        PlayerName: "P5",
        PlayerCards: [{
            Value: "4H",
            Presentation: "private"
        }, {
            Value: "6D",
            Presentation: "private"
        }],
        PlayerAmount: 0 // taken - bet = amount
        ,
        ConnectionId: "555",
        CurrentRoundStatus: 0
    }
    ],
    Steps: [{
        RoundId: 1,
        Step: {
            Id: 1,
            PlayerId: 1,
            Action: "bet",
            Amount: 100
        }
    },
    {
        RoundId: 1,
        Step: {
            Id: 2,
            PlayerId: 2,
            Action: "bet",
            Amount: 100
        }
    },
    {
        RoundId: 1,
        Step: {
            Id: 3,
            PlayerId: 3,
            Action: "pass",
            Amount: 0
        }
    }
    ],
    PreviousStep: 3,
    NextStep: 4,
    CurrentUser: 1, // one who will play step 4
    PrevSno: 2,
    PotSize: 0,
    ModifiedDate: new Date(),
    Round: 1,
    CommunityCards: [{
        Value: "4H",
        Presentation: "public"
    }, {
        Value: "6D",
        Presentation: "public"
    }],
    PlayerHandsAfterEachRound: [],
    DiscardedCards: [], // { PlayerSno: 1, CardDiscarded: [{Value:"AH",Presentation: "private"}]}
    ContinuityPlayers: [], // players that were folded intentionally or due to server
    NumberOfCommunities: 0,
    CompleteHand: [{
        RoundId: 1,
        RoundStatus: "Started",
        ActivePlayers: [1, 2],
        Better: 1,
        CurrentPlayer: 2,
        PreviousPlayer: 0,
        NextPlayer: 1,
        LastPlayer: 1
    },
    {
        RoundId: 2,
        RoundStatus: "Started",
        ActivePlayers: [1, 2],
        Better: 2,
        CurrentPlayer: 1,
        PreviousPlayer: 0,
        NextPlayer: 2,
        LastPlayer: 2
    }
    ],
    Settlement: [{
        PlayerId: 1,
        PlayerAmount: 100,
        PlayerStatus: "positive"
    },
    {
        PlayerId: 2,
        PlayerAmount: -50,
        PlayerStatus: "negative"
    }, {
        PlayerId: 2,
        PlayerAmount: -50,
        PlayerStatus: "negative"
    }
    ],
    AccountDetail: [] // [{PlayerId:1,Amount:-50}];

}

function createCookie(cookieName, cookieValue, daysToExpire) {
    var date = new Date();
    date.setTime(date.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));
    document.cookie = cookieName + "=" + cookieValue + "; expires=" + date.toGMTString();
}

function accessCookie(cookieName) {
    var name = cookieName + "=";
    var allCookieArray = document.cookie.split(';');
    for (var i = 0; i < allCookieArray.length; i++) {
        var temp = allCookieArray[i].trim();
        if (temp.indexOf(name) == 0)
            return temp.substring(name.length, temp.length);
    }
    return "";
}


async function start() {
    try {

        if (connection.state == "Connected")
            return;

        await connection.start();
        if (connection.state == "Connected" || connection.state == "Reconnected") {
            // join game 

            //Disable send button until connection is established
            //document.getElementById("sendButton").disabled = true;



            var TempResponse = "";

            connection.on("ReceiveMessage", function (message) {
                var msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                var encodedMsg = user + " says " + msg;
                // var li = document.createElement("li");
                // li.textContent = encodedMsg;
                // document.getElementById("messagesList").appendChild(li);
                TempResponse = message;
                alert("Try again in few seconds..");


            });



            connection.on("ReceiveNotification", function (gamecode, playerid, notificationmessage) {


                if (GameHash.GameId == gamecode) {

                    //ViewNotification(notificationmessage);
                }
            });



            connection.on("ReceiveCancelHandNotification", function (gamecode) {


                $('#ModalInfoCancelHand').modal("show");

            });








            connection.on("ReceiveEndGameSummary", function (gamecode) {


                try {

                    $('.EndGameForCurrent').show();
                    if (GameHash.GameId == gamecode) {



                        //disable if sno is not dealer 
                        if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer != "Y") {

                            $('.EndGameForCurrent').hide();
                            ShowSummaryV2();

                            //ShowSummary();
                        }
                    }
                }
                catch (err) {

                    GameLogging(err, 2);
                }
            });

            connection.on("ReceiveEndHandSummary", function (gamecode) {

                try {


                    $('.EndGameForCurrent').show();
                    $('.SettleRound').show();

                    if (GameHash.GameId == gamecode) {

                        //disable if sno is not dealer 
                        if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer != "Y") {

                            $('.SettleRound').hide();
                            $('.EndGameForCurrent').hide();
                            ShowHandSettleHand();
                        }
                    }

                }
                catch (err) {


                    GameLogging(err, 2);

                }

            });

            connection.on("OtherPlayerDisconnected", function (PlayerConnectionId, UserId) {

                OtherPlayerDisconnected(PlayerConnectionId, UserId);

            });


            connection.on("ReceiveHashV1", function (IsHashUpdated) {

                try {

                    _GetUpdatedGameHash(GameHash.GameId);
                    UpdateView();
                    console.log(" ReceiveHashV1  " + GameHash.GameId);
                }
                catch (err) {
                    GameLogging(err, 2);

                }
            });













        }
        console.log("SignalR Connected.");
    } catch (err) {
        console.log(err);
        setTimeout(start, 5000);
    }
};



function ClearCookieFunction() {
    createCookie("UserIdentity", "", 2000);
    location.reload();


}




// new validateuser function
function ValidateUserConnection() {

    var CustomCookie = accessCookie("UserIdentity");
    //debugger;
    if (CustomCookie == "") {
        // ajax call to get unique identity

        model = {
            "request": "UNIQUEIDENTITY"
        };
        var dataResponse;
        $.ajax({
            url: 'api/GameV2/_GetUserIdentity',
            type: 'POST',
            contentType: 'application/json;',
            data: JSON.stringify("uniqueidentity"),
            async: false,
            success: function (data) {
                //debugger;
                dataResponse = data;
                console.log("url: 'api/GameV2/_CreateGame',---------success");
            },
            complete: function (res) {

                //debugger;
                console.log(dataResponse);
                //StartGame(dataResponse);
                createCookie("UserIdentity", dataResponse, 2000);
                createCookie("IsIdentityRenewed", "2", 2000);
                localStorage.removeItem("LastGameCode"); //, GameCode);
                localStorage.removeItem("UserId") //, model.UserId);
                CustomCookie = accessCookie("UserIdentity");

                var url = "/GameClass?UserIdentity=" + CustomCookie + "";
                connection = new signalR.HubConnectionBuilder().withUrl(url).withAutomaticReconnect([0, 0, 10000]).build();
                connection.onclose(function () {
                    start();
                });

                connection.onreconnected(connectionId => {
                    console.log("connected with " + connectionId + " --> " + connection.state === signalR.HubConnectionState.Connected);

                });

                start();



            }
        });
    }
    else {

        var url = "/GameClass?UserIdentity=" + CustomCookie + "";
        connection = new signalR.HubConnectionBuilder().withUrl(url).withAutomaticReconnect([0, 0, 10000]).build();
        connection.onclose(function () {
            start();
        });

        connection.onreconnected(connectionId => {
            console.log("connected with " + connectionId + " --> " + connection.state === signalR.HubConnectionState.Connected);

        });

        start();

    }

    // set cookie and start connection

}


function _GetUpdatedGameHash(gameid) {


    $('.spinner').show();


    model = {
        "request": "UNIQUEIDENTITY"
    };
    var result;
    $.ajax({
        url: 'api/GameV2/_GetGameHash',
        type: 'POST',
        contentType: 'application/json;',
        data: gameid == undefined ? GameHash.GameId : gameid,
        async: false,
        success: function (data) {
            result = data;
            console.log("url: 'api/GameV2/_CreateGame',---------success");
        },
        complete: function (res) {

            try {
                GameHashOrginal = JSON.parse(result);
                GameHash = JSON.parse(result);
                //UpdateView();
                $('.spinner').hide();
            }
            catch (err) {
                $('.spinner').hide();
                console.log(err);
                ExceptionLogging(err);
            }


        }

    })
        .done(function (result) {
        });


}


function OtherPlayerDisconnected(PlayerConnectionId, UserId) {
    console.log('OtherPlayerDisconnected' + '   ' + PlayerConnectionId + '     ' + UserId);

    console.log(" PlayerConnectionId " + PlayerConnectionId);
    // var li = document.createElement("li");
    // li.textContent = encodedMsg;
    // document.getElementById("messagesList").appendChild(li);
    ////debugger;
    //
    //GameHash = JSON.parse(GameHash1);
    PlayerConnectionId = "pk2" + UserId.split("pk2")[1];

    if (GameHash.ActivePlayers.filter(x => x.PlayerId.includes(PlayerConnectionId)).length == 1) {
        var snumber = GameHash.ActivePlayers.filter(x => x.PlayerId.includes(PlayerConnectionId))[0].Sno;

        GameHash.ContinuityPlayers = GameHash.ContinuityPlayers.filter(x => x.PlayerId.includes(PlayerConnectionId) == false);
        //OnPlayerAction();
        var grtrSno = -1; var lsrSno = -1;
        //GameHash.ActivePlayers.filter(x => x.PlayerId.includes(PlayerConnectionId))[0].IsFolded = "Y";
        if (GameHash.ActivePlayers.sort(y => y.Sno).filter(x => x.IsFolded == "N" && x.Sno > snumber).length > 0)
            grtrSno = GameHash.ActivePlayers.sort(y => y.Sno).filter(x => x.IsFolded == "N" && x.Sno > snumber)[0].Sno;
        if (GameHash.ActivePlayers.sort(y => y.Sno).filter(x => x.IsFolded == "N" && x.Sno > 0).length > 0)
            lsrSno = GameHash.ActivePlayers.sort(y => y.Sno).filter(x => x.IsFolded == "N" && x.Sno > 0)[0].Sno;

        if (GameHash.ActivePlayers.filter(x => x.PlayerId.includes(PlayerConnectionId))[0].IsCurrent == "Y") {


            $.each(GameHash.ActivePlayers, function (i, obj) { obj.IsCurrent = "N"; });


            if (GameHash.ActivePlayers.filter(x => x.Sno > snumber && x.IsFolded == "N").length == 0) {
                //GameHash.ActivePlayers.sort(x => x.Sno).filter(x => x.IsFolded == "N")[0].IsDealer = "Y";
                GameHash.ActivePlayers.sort(x => x.Sno).filter(x => x.IsFolded == "N")[0].IsCurrent = "Y";
                GameHash.GetBetStatus = GetBetStatus(GameHash.ActivePlayers.sort(x => x.Sno).filter(x => x.IsFolded == "N")[0].Sno);
            }
            else {
                //GameHash.ActivePlayers.sort(x => x.Sno).filter(x => x.Sno > Sno)[0].IsDealer = "Y";
                GameHash.ActivePlayers.sort(x => x.Sno).filter(x => x.Sno > snumber)[0].IsCurrent = "Y";
                GameHash.GetBetStatus = GetBetStatus(GameHash.ActivePlayers.sort(x => x.Sno).filter(x => x.Sno > snumber)[0].Sno);

            }

        }

        if (GameHash.ActivePlayers.filter(x => x.PlayerId.includes(PlayerConnectionId))[0].IsDealer == "Y") {

            $.each(GameHash.ActivePlayers, function (i, obj) { obj.IsDealer = "N"; });

            if (GameHash.ActivePlayers.sort(y => y.Sno).filter(x => x.Sno < snumber && x.IsFolded == "N").length == 0) {
                //GameHash.ActivePlayers.sort(x => x.Sno).filter(x => x.IsFolded == "N")[0].IsDealer = "Y";
                // for removing deal duplication
                $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                    obj2.IsDealer = "N";

                });
                GameHash.ActivePlayers.sort(y => y.Sno).filter(x => x.IsFolded == "N" && x.Sno > snumber)[0].IsDealer = "Y";
            }
            else {
                //GameHash.ActivePlayers.sort(x => x.Sno).filter(x => x.Sno > Sno)[0].IsDealer = "Y";
                // for removing deal duplication
                $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                    obj2.IsDealer = "N";

                });
                // for removing deal duplication
                $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                    obj2.IsDealer = "N";

                });
                GameHash.ActivePlayers.sort(y => y.Sno).filter(x => x.Sno < snumber && x.IsFolded == "N")[0].IsDealer = "Y";

            }


        }

        GameHash.ActivePlayers.filter(x => x.PlayerId.includes(PlayerConnectionId))[0].IsDealer = "N";
        GameHash.ActivePlayers.filter(x => x.PlayerId.includes(PlayerConnectionId))[0].IsCurrent = "N";
        //GameHash.ActivePlayers.filter(x => x.PlayerId.includes(PlayerConnectionId))[0].IsFolded = "N";
        GameHash.ContinuityPlayers.push(GameHash.ActivePlayers.filter(x => x.PlayerId.includes(PlayerConnectionId))[0]);

        if (GameHash.ActivePlayers.filter(x => (x.Sno == Sno && (x.IsCurrent == "Y" || x.IsDealer == "Y"))).length > 0) {

            UpdateGameHash(GameHash.GameId);

        }

    }

    UpdateView();
    //UpdateGameHash(GameHash.GameId);




}



$(document).on("click", ".BtnResume", function () {

    try {


        JoinGame(localStorage.getItem("UserId").split("pk2")[0], localStorage.getItem("UserId").split("pk2")[1], localStorage.getItem("LastGameCode"));
    } catch (err) {

        GameLogging(err, 2);

    }
});


$(document).on("click", ".MyModalEndHand_Yes", function () {


    //  JoinGame(localStorage.getItem("UserId").split("pk2")[0], localStorage.getItem("UserId").split("pk2")[1], localStorage.getItem("LastGameCode"));
    // leave the amount as it is 
    SettleRound("MyModalEndHand_Yes");
    $("#MyModalEndHand").modal("hide");



});


$(document).on("click", ".MyModalEndHand_No", function () {

    $("#MyModalEndHand").modal("hide");
});


$(document).on("click", ".PlayerCard", function () {

    $('.Discard').hide();
    // $('.ShowAll').hide();
    $('.PassCard').hide();


    if (GameHash.ActivePlayers.filter(x => x.Sno == Sno && x.IsFolded == "Y").length == 1)
        return;


    if ($(this).parents().parent().hasClass("PlayerView")) {

        if ($(this).hasClass('Selected')) {
            $(this).removeClass('Selected');
            if ($(".PlayerCard.Selected").length == 0) {
                $('.PassCard').hide();
                $('.Discard').hide();
            }
            //$('.CardActions').hide();
            //$('.CardActions').fadeOut("slow");


        } else {
            $(this).addClass('Selected');
            //$('.PassPlayers').fadeIn("slow");
            //  $('.CardActions').fadeIn("slow");
            // $('.PassCard').show();
            $('.Discard').show();
            $('.PassCard').show();
            $('.ShowAll').show();

        }

    } else {
        alert("card does not belong to you");

    }



    //JoinGame(localStorage.getItem("UserId").split("pk2")[0], localStorage.getItem("UserId").split("pk2")[1], localStorage.getItem("LastGameCode"));

});

$(document).on("click", ".GenerateCode", function () {


    $('#GameCode').val(GenerateCode());


});

$(document).on("click", ".BtnStart", function () {


    if ($('#UserName').val() == "" || $('#GameCode').val() == "") {
        alert("Enter username & Generate Game Code to share");
    } else {
        GameCode = $('#GameCode').val();
        $("#HomeScreen").hide();
        $("#GameBoard").show();

        $('.spinner').show();
        CreateGame();

        setTimeout(function () {
            $('.spinner').hide();
        }, 2000)
    }

});

function copyInvitation() {
    /* Get the text field */
    var copyText = document.getElementById("GameCode");

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    document.execCommand("copy");

    /* Alert the copied text */
    alert("Copied code: " + copyText.value);
}

$(document).on("click", ".BtnLeave", function () {


    $('#myModalLeave').find('.modal-body').html("Are you sure you want to leave the game?");
    $('#myModalLeave').modal('show');

});

$(document).on("click", ".BtnLeave_Yes", function () {


    var GameHashTemp = JSON.parse(JSON.stringify(GameHash));

    GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsFolded = "Y";
    GameHash.ContinuityPlayers = GameHash.ContinuityPlayers.filter(x => x.Sno != Sno);


    UpdateGameHash(GameHash.GameId);

    localStorage.removeItem("LastGameCode");
    localStorage.removeItem("UserId");


    setTimeout(function () {

        location.reload();

    }, 1500)


});

$(document).on("click", ".BtnJoin", function () {


    if ($('#UserName1').val() == "" || $('#GameCode1').val() == "") {
        alert("Enter username & Generate Game Code to join");
    } else {

        GameCode = $('#GameCode1').val();
        JoinGame($('#UserName1').val(), connection.connectionId, GameCode);
    }
});

$(document).on("click", ".BackToMenu", function () {

    ShowSummaryV2();


});



function ShowSummaryV2() {

    if (GameHash.PotSize == 0) {




        $('#SettlementModalEndGame').find('.SettleUp-tbody').html("");
        var htmSettleUpBody = '<table style="width:100%;"><tr><td>Name</td><td>Amount</td><td>Transaction</td></tr>';
        var resp = CalculateEndHand(GameHash);
        $.each(resp.GameHashTemp.ActivePlayers.sort(function (a, b) {
            return a.PlayerNetStatusFinal - b.PlayerNetStatusFinal
        }), function (i, obj) {

            var tmpAmount = obj.PlayerNetStatusFinal;

            var tmpTransactionMessage = "";
            $.each(resp.ArrTransaction.filter(x => x["from"] == obj.PlayerId), function (cnt, obj2) {

                tmpTransactionMessage += obj.PlayerId.split("pk2")[0] + " owes " + obj2["amount"] + " to " + obj2["to"].split("pk2")[0] + ",<br/>";
            });


            htmSettleUpBody += '<tr><td>' + obj.PlayerId.split("pk2")[0] + '</td><td>' + tmpAmount + '</td><td>' + tmpTransactionMessage + '</td></tr>';

        });


        htmSettleUpBody += "</table>";



        $('#SettlementModalEndGame').find('.SettleUp-tbody').append(htmSettleUpBody);




        $('#SettlementModalEndGame').modal({
            backdrop: 'static',
            keyboard: false
        });

        $('#SettlementModalEndGame').modal('show');

        if (GameHash.ActivePlayers.filter(x => x.IsDealer == "Y")[0].Sno == Sno)
            SendEndGameSummary(GameHash.GameId);

    } else {
        alert("Game cannot be ended when pot is not settled. Please distribute the Pot First");

    }

}


$(document).on("click", ".BtnSitOut", function () {


    try {


        IsSitOut = true;
        $('.BtnSitOut').hide();
        $('.BtnRejoin').show();
        PlayerActionSitOut();

        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0];
        GameHash.Steps.push({
            RoundId: GameHash.Round,
            Step: {
                PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: "fold",
                Amount: 0
            }
        });

        if (GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno).length == 1)
            GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno)[0].Action = {
                PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: "Sit out",
                Amount: 0
            };
        else
            GameHash.LastActionPerformed.push({
                PlayerSno: Sno,
                Action: {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: "Sit out",
                    Amount: 0
                }
            });


        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsFolded = "Y";


        //$.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards, function (i, obj) { obj.Presentation = "public" });

        if (GameHash.ContinuityPlayers.filter(x => x.Sno == Sno).length == 0)
            GameHash.ContinuityPlayers.push(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0]);

        if (GameHash.ActivePlayers.filter(x => x.Sno > Sno && x.IsFolded == "N").length == 0) {
            GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(x => x.IsFolded == "N")[0].IsCurrent = "Y";
            GameHash.BetStatus = GetBetStatus(GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(x => x.IsFolded == "N")[0].Sno);

            if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer == "Y") {

                // for removing deal duplication
                $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                    obj2.IsDealer = "N";

                });

                GameHash.ActivePlayers.sort(function (a, b) { return a.Sno - b.Sno }).filter(x => x.Sno != Sno && x.IsFolded == "N")[0].IsDealer = "Y";


            }

        } else {
            GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(x => x.Sno > Sno && x.IsFolded == "N")[0].IsCurrent = "Y";
            GameHash.BetStatus = GetBetStatus(GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(x => x.Sno > Sno && x.IsFolded == "N")[0].Sno);

            if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer == "Y") {
                // for removing deal duplication
                $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                    obj2.IsDealer = "N";

                });

                GameHash.ActivePlayers.sort(function (a, b) { return a.Sno - b.Sno }).filter(x => x.Sno != Sno && x.IsFolded == "N")[0].IsDealer = "Y";
            }

        }

        $.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards, function (i, obj) {


            obj.Presentation = "private";


        });


        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer = "N";
        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsCurrent = "N";

        UpdateGameHash(GameHash.GameId);

        //OnPlayerAction();



        try {
            var msg = GameHash.Steps[GameHash.Steps.length - 1].Step.Action + " - by " + localStorage.getItem("UserId").split("pk2")[0];
            SendNotification(GameHash.GameId, "", msg);
        } catch (err) {
            console.log(err);
            ExceptionLogging(err);
        }



        //OnPlayerAction();
        // stop at the current position and wait for the game to over ;
    }
    catch (err) {

        GameLogging(err, 2)
    }



});



$(document).on("click", ".BtnRejoin", function () {


    PlayerActionRejoin();
    $('.BtnRejoin').hide();
    $('.BtnSitOut').show();

    IsSitOut = false;

});





$(document).on("click", ".EndGameForCurrent", function () {


    try {


        GameCode = "";
        localStorage.removeItem("LastGameCode"); //, GameCode);
        localStorage.removeItem("UserId") //, model.UserId);

        if (GameHash.ActivePlayers.filter(x => x.Sno == Sno).length == 1) {
            GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsFolded = "Y";

            if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer == "Y") {
                if (GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.IsFolded == "N" && y.Sno > Sno).length > 0) {

                    // for removing deal duplication
                    $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                        obj2.IsDealer = "N";

                    });

                    GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.IsFolded == "N" && y.Sno > Sno)[0].IsDealer = "Y";

                } else if (GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.IsFolded == "N").length > 0) {

                    // for removing deal duplication
                    $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                        obj2.IsDealer = "N";

                    });

                    GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.IsFolded == "N")[0].IsDealer = "Y";
                }
                GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer = "N";
            }
            if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsCurrent == "Y") {
                if (GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.IsFolded == "N" && y.Sno > Sno).length > 0) {
                    GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.IsFolded == "N" && y.Sno > Sno)[0].IsCurrent = "Y";

                } else if (GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.IsFolded == "N").length > 0) {
                    GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.IsFolded == "N")[0].IsCurrent = "Y";
                }
                GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsCurrent = "N";
            }


            GameHash.ContinuityPlayers.push(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0]);


            GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsCurrent = "N";
        }




        UpdateGameHash(GameHash.GameId);
        $('.spinner').show();

        setTimeout(function () { location.reload(); }, 3000)



    } catch (err) {

        GameLogging(err, 2)
    }

});

$(document).on("click", ".BtnSettle", function () {

    //try {

    //    ShowHandSettleHand();
    //    if (GameHash.PotSize == 0)
    //        SendEndHandSummary(GameHash.GameId);

    //} catch (err) {

    //    GameLogging(err,2)
    //}

    // ShowHandSettleHand();


    GameHash.LastActionPerformed = [];
    $('.PlayerAction').html("");
    $('.SettleRound').trigger('click');
    GameHash.IsRoundSettlement = "Y";


});


$(document).on("click", ".SettleRound", function () {

    //GameHash.Transaction = [];

    $.each(GameHash.ActivePlayers, function (i, obj) {

        if (obj.PlayerNetStatusFinal == undefined)
            obj.PlayerNetStatusFinal = 0;

        obj.PlayerNetStatusFinal = obj.PlayerNetStatusFinal + obj.PlayerAmount;
        obj.PlayerAmount = 0;
        obj.Balance = 0;
        obj.CurrentRoundStatus = 0;


    });

    SettleRound("SettleRound");

});

function ModalInfoCancelHandPrompt_Yes() {

    //GameHash.Transaction = [];
    $('#ModalInfoCancelHandPrompt').modal('hide');
    $.each(GameHash.ActivePlayers, function (i, obj) {

        if (obj.PlayerNetStatusFinal == undefined)
            obj.PlayerNetStatusFinal = 0;

        if (obj.PlayerAmount < 0) {
            GameHash.PotSize = GameHash.PotSize + obj.PlayerAmount;
        }


        obj.PlayerAmount = 0;
        obj.Balance = 0;
        obj.CurrentRoundStatus = 0;

        obj.PlayerCards = [];
    });

    GameHash.CommunityCards = [];
    GameHash.Deck = GetNewDeck();


    GameHash.Steps.push({
        RoundId: GameHash.Round,
        Step: {
            PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
            PlayerSno: Sno,
            Action: "Cancelled Hand",
            Amount: 0
        }
    });



    UpdateGameHash(GameHash.GameId);
    SendCancelHandNotification();






}



function SendCancelHandNotification() {

    $('.spinner').show();
    model = {
        "NotificationType": "CancelHand",
        "GameCode": GameHash.GameId,
        "NotificationMessage": "hand has been cancelled by dealer"

    };

    // //debugger;

    var responseData;
    $.ajax({
        url: 'api/GameV2/_SendCancelHandNotification',
        type: 'POST',
        async: true,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {
            responseData = data;
            console.log("url: 'api/GameV2/Hand Cancelled',---------success");

            UpdateView();
            $('#ModalInfoCancelHand').modal('show');

            GameLogging(GameHash, 1);
            $('.spinner').hide();

        }

    })
        .done(function (result) {

            console.log("Updated hash:" + responseData);

        });


}



$(document).on("click", ".BtnCancelHand", function () {


    $('#ModalInfoCancelHandPrompt').modal('show');

});









$(document).on("click", ".Bet", function () {

    //logic


    try {


        var betamount = $('#BetTakeValue').val(); // for active user

        if (betamount == "") {
            SendNotification(GameCode, "", "bet amount is required");
            return;
        }

        if (betamount < (parseFloat(GameHash.CurrentBet) - parseFloat(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].CurrentRoundStatus))) {
            alert("Minimum bet is:" + (parseFloat(GameHash.CurrentBet) - parseFloat(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].CurrentRoundStatus)).toString());
            return;
        } else {
            // $('.Player[data-sno="' + Sno + '"]').find('.PlayerActions').hide();
            var playeramount_hash = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount;
            GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount = parseFloat(playeramount_hash) - parseFloat(betamount);
            GameHash.PotSize = parseFloat(GameHash.PotSize) + parseFloat(betamount);


            //for continuing round 
            GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].CurrentRoundStatus = parseFloat(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].CurrentRoundStatus) + parseFloat(betamount);


            var msg1 = "bet:" + betamount;
            if (parseFloat(GameHash.CurrentBet) < betamount) {
                msg1 = "raised by:" + (parseFloat(betamount) - parseFloat(GameHash.CurrentBet)).toString() + "- bet:" + betamount;
                GameHash.CurrentBet = parseFloat(betamount);

            }


            GameHash.Steps.push({
                RoundId: GameHash.Round,
                Step: {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: msg1,
                    Amount: betamount
                }
            });

            if (GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno).length == 1)
                GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno)[0].Action = {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: msg1,
                    Amount: betamount
                };
            else
                GameHash.LastActionPerformed.push({
                    PlayerSno: Sno,
                    Action: {
                        PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                        PlayerSno: Sno,
                        Action: msg1,
                        Amount: betamount
                    }
                });


            OnPlayerAction();

            try {
                var msg = GameHash.Steps[GameHash.Steps.length - 1].Step.Action + " - by " + localStorage.getItem("UserId").split("pk2")[0] + " Amount : " + betamount;
                SendNotification(GameHash.GameId, "", msg);
            } catch (err) {
                console.log(err);
            }

        }

        $('#BetTakeValue').val("");
        // view

    } catch (err) {

        GameLogging(err, 2);
    }

});



$(document).on("click", ".AddToPot", function () {

    //logic

    try {



        var betamount = $('#BetTakeValue').val(); // for active user


        if (betamount < 1) {
            alert("minimum amount:1");
            return;
        } else {


            GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount = parseFloat(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount) - parseFloat(betamount);
            GameHash.PotSize = parseFloat(GameHash.PotSize) + parseFloat(betamount);

            var msg1 = " added to pot";

            GameHash.Steps.push({
                RoundId: GameHash.Round,
                Step: {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: msg1,
                    Amount: betamount
                }
            });

            if (GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno).length == 1)
                GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno)[0].Action = {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: msg1,
                    Amount: betamount
                };
            else
                GameHash.LastActionPerformed.push({
                    PlayerSno: Sno,
                    Action: {
                        PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                        PlayerSno: Sno,
                        Action: msg1,
                        Amount: betamount
                    }
                });



            try {
                var msg = GameHash.Steps[GameHash.Steps.length - 1].Step.Action + " - by " + localStorage.getItem("UserId").split("pk2")[0] + " Amount : " + betamount;
                SendNotification(GameHash.GameId, "", msg);
                UpdateGameHash(GameHash.GameId);
            } catch (err) {
                console.log(err);
            }

        }

        $('#BetTakeValue').val("1");
        // view

    } catch (err) {

        GameLogging(err, 2)
    }

});




$(document).on("click", ".Call", function () {


    if (GameHash.CurrentBet == 0) {

        alert("Cannot call on bet - 0");

    } else {

        var betamount = GameHash.CurrentBet;
        //current player call for continuing round 
        var currentplayerbet = betamount - parseFloat(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].CurrentRoundStatus);
        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].CurrentRoundStatus = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].CurrentRoundStatus + currentplayerbet;

        var msg1 = "called with " + currentplayerbet;


        // $('.Player[data-sno="' + Sno + '"]').find('#BetTakeValue').val(GameHash.CurrentBet);
        //$('.Player[data-sno="' + Sno + '"]').find('#BetTakeValue').val(); // for active user
        var playeramount_hash = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount;
        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount = parseFloat(playeramount_hash) - parseFloat(currentplayerbet);
        GameHash.PotSize = parseFloat(GameHash.PotSize) + parseFloat(currentplayerbet);

        //GameHash.CurrentBet = parseFloat(GameHash.CurrentBet) + parseFloat(betamount);

        GameHash.Steps.push({
            RoundId: GameHash.Round,
            Step: {
                PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: msg1,
                currentplayerbet: betamount
            }
        });

        if (GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno).length == 1)
            GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno)[0].Action = {
                PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: msg1,
                currentplayerbet: betamount
            };
        else
            GameHash.LastActionPerformed.push({
                PlayerSno: Sno,
                Action: {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: msg1,
                    currentplayerbet: betamount
                }
            });

        OnPlayerAction();


        try {
            var msg = GameHash.Steps[GameHash.Steps.length - 1].Step.Action + " - by " + localStorage.getItem("UserId").split("pk2")[0] + " Amount : " + currentplayerbet;
            SendNotification(GameHash.GameId, "", msg);
        } catch (err) {
            console.log(err);
        }


        $('#BetTakeValue').val("");
        // view
    }
});



$(document).on("click", ".Discard", function () {

    //logic
    //var betamount = $('.Player[data-sno="' + Sno + '"]').find('#BetTakeValue').val(); // for active user
    //var playeramount_hash = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount;
    //GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount = parseFloat(playeramount_hash) - parseFloat(betamount);
    //GameHash.PotSize = parseFloat(GameHash.PotSize) + parseFloat(betamount);

    var $selectedCard = $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard.Selected');

    $.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno), function (i, obj) {

        for (var count = 0; count < $selectedCard.length; count++) {
            GameHash.DiscardedCards.push({
                Sno: obj.Sno,
                PlayerCards: {
                    Value: $($selectedCard[count]).data("cardvalue"),
                    Presentation: $($selectedCard[count]).data("presentation")
                }
            });
            obj.PlayerCards = obj.PlayerCards.filter(x => x.Value != $($selectedCard[count]).data("cardvalue"));
        }

    });

    GameHash.Steps.push({
        RoundId: GameHash.Round,
        Step: {
            PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
            PlayerSno: Sno,
            Action: "Discarded",
            Amount: 0
        }
    });



    try {
        var msg = GameHash.Steps[GameHash.Steps.length - 1].Step.Action + " - by " + localStorage.getItem("UserId").split("pk2")[0];
        SendNotification(GameHash.GameId, "", msg);
    } catch (err) {
        console.log(err);
    }


    UpdateGameHash(GameHash.GameId);

    $('#myModal').hide("modal");

    //OnPlayerAction();


    // view

});



$(document).on("click", ".Take", function () {

    try {
        //logic
        var takeamount = ($('#BetTakeValue').val() == "" || $('#BetTakeValue').val() == "0") ? GameHash.PotSize : $('#BetTakeValue').val(); // for active user
        if (takeamount > GameHash.PotSize || takeamount < 0) {
            SendNotification(GameCode, "", "" + GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId.split("pk2")[0] + " is trying to take " + takeamount + " from pot.");
            return;

        } else {

            var playeramount_hash = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount;
            GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount = parseFloat(playeramount_hash) + parseFloat(takeamount);
            GameHash.PotSize = parseFloat(GameHash.PotSize) - parseFloat(takeamount);


            GameHash.Steps.push({
                RoundId: GameHash.Round,
                Step: {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: "take",
                    Amount: takeamount
                }
            });

            if (GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno).length == 1)
                GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno)[0].Action = {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: "take",
                    Amount: takeamount
                };
            else
                GameHash.LastActionPerformed.push({
                    PlayerSno: Sno,
                    Action: {
                        PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                        PlayerSno: Sno,
                        Action: "take",
                        Amount: takeamount
                    }
                });



            $('#BetTakeValue').val("");

            //OnPlayerAction();
            // view

            UpdateGameHash(GameHash.GameId);

            try {
                var msg = GameHash.Steps[GameHash.Steps.length - 1].Step.Action + " - by " + localStorage.getItem("UserId").split("pk2")[0] + " Amount : " + takeamount;
                SendNotification(GameHash.GameId, "", msg);
            } catch (err) {
                console.log(err);
            }

        }


    } catch (err) {

        GameLogging(err, 2);
    }
});


$(document).on("click", ".Show", function () {

    //$.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards, function (i, obj) {

    //    obj.Presentation = "public";

    //});

    var $selectedCard = $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard.Selected');


    if ($selectedCard.length == 0) {
        $.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards, function (i, obj2) {
            obj2.Presentation = "public";
        });
    }
    else {
        $.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno), function (i, obj) {

            for (var count = 0; count < $selectedCard.length; count++) {
                // GameHash.DiscardedCards.push({ Sno: obj.Sno, PlayerCards: { Value: $($selectedCard[count]).data("cardvalue"), Presentation: $($selectedCard[count]).data("presentation") } });
                obj.PlayerCards.filter(x => x.Value == $($selectedCard[count]).data("cardvalue"))[0].Presentation = "public";
            }

        });
    }
    $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard').removeClass('Selected');

    UpdateGameHash(GameHash.GameId);

    $('#myModal').hide("modal");

    // OnPlayerAction();

}); // check = pass



$(document).on("click", ".ShowAll", function () {

    //$.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards, function (i, obj) {

    //    obj.Presentation = "public";

    //});

    //var selectedCard = $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard.Selected');

    //$.each(selectedCard, function (counter1, obj1) {

    //        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.filter(x => x.Value == $(obj1).data('cardvalue'))[0].Presentation = "public";
    //        //for (var count = 0; count < $selectedCard.length; count++) {
    //        //    // GameHash.DiscardedCards.push({ Sno: obj.Sno, PlayerCards: { Value: $($selectedCard[count]).data("cardvalue"), Presentation: $($selectedCard[count]).data("presentation") } });
    //        //    obj.PlayerCards.filter(x => x.Value == $($selectedCard[count]).data("cardvalue"))[0].Presentation = "public";
    //        //}


    //});


    var $selectedCard = $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard.Selected');


    if ($selectedCard.length == 0) {
        $.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards, function (i, obj2) {
            obj2.Presentation = "public";
        });
    }
    else {
        $.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno), function (i, obj) {

            for (var count = 0; count < $selectedCard.length; count++) {
                // GameHash.DiscardedCards.push({ Sno: obj.Sno, PlayerCards: { Value: $($selectedCard[count]).data("cardvalue"), Presentation: $($selectedCard[count]).data("presentation") } });
                obj.PlayerCards.filter(x => x.Value == $($selectedCard[count]).data("cardvalue"))[0].Presentation = "public";
            }

        });
    }

    $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard').removeClass('Selected');

    UpdateGameHash(GameHash.GameId);

    $('#myModal').hide("modal");

    // OnPlayerAction();

}); // check = pass




$(document).on("click", ".Ante", function () {


    if (GameHash.ActivePlayers.filter(x => x.IsFolded == "N" && x.IsDealer == "N").length > 0) {

        var anteValue = $("#txtAnte").val();
        GameHash.Steps.push({
            RoundId: GameHash.Round,
            Step: {
                PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: "Ante:" + anteValue,
                Amount: anteValue
            }
        });

        if (GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno).length == 1)
            GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno)[0].Action = {
                PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: "Ante:" + anteValue,
                Amount: anteValue
            };
        else
            GameHash.LastActionPerformed.push({
                PlayerSno: Sno,
                Action: {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: "Ante:" + anteValue,
                    Amount: anteValue
                }
            });




        var potAdd = 0;


        $.each(GameHash.ActivePlayers.filter(x => x.IsFolded == "N"), function (i, obj) {

            obj.PlayerAmount = parseFloat(obj.PlayerAmount) - parseFloat(anteValue);
            potAdd = parseFloat(potAdd) + parseFloat(anteValue);

        });



        GameHash.PotSize = parseFloat(GameHash.PotSize) + parseFloat(potAdd);
        var msg = "Ante: " + anteValue + "";
        SendNotification(GameHash.GameId, "", msg);



        UpdateGameHash(GameHash.GameId);


    } else {
        alert("No Active Player");

    }

    // OnPlayerAction();

}); // check = pass




$(document).on("click", ".Fold", function () {

    try {

        GameHash.Steps.push({
            RoundId: GameHash.Round,
            Step: {
                PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: "fold",
                Amount: 0
            }
        });

        if (GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno).length == 1)
            GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno)[0].Action = {
                PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: "fold",
                Amount: 0
            };
        else
            GameHash.LastActionPerformed.push({
                PlayerSno: Sno,
                Action: {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: "fold",
                    Amount: 0
                }
            });


        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsFolded = "Y";


        //$.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards, function (i, obj) { obj.Presentation = "public" });

        if (GameHash.ContinuityPlayers.filter(x => x.Sno == Sno).length == 0)
            GameHash.ContinuityPlayers.push(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0]);


        if (GameHash.ActivePlayers.filter(x => x.IsFolded == "N").length == 0) {
            console.log('all folded')
        }
        else if (GameHash.ActivePlayers.filter(x => x.Sno > Sno && x.IsFolded == "N").length == 0) {
            GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(x => x.IsFolded == "N")[0].IsCurrent = "Y";
            GameHash.BetStatus = GetBetStatus(GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(x => x.IsFolded == "N")[0].Sno);
            //  if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer == "Y")
            //      GameHash.ActivePlayers.sort(function (a, b) { return a.Sno - b.Sno }).filter(x => x.IsFolded == "N")[0].IsDealer = "Y";

        } else {
            GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(x => x.Sno > Sno && x.IsFolded == "N")[0].IsCurrent = "Y";
            GameHash.BetStatus = GetBetStatus(GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(x => x.Sno > Sno && x.IsFolded == "N")[0].Sno);
            // if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer == "Y")
            //     GameHash.ActivePlayers.sort(function (a, b) { return a.Sno - b.Sno }).filter(x => x.Sno > Sno && x.IsFolded == "N")[0].IsDealer = "Y";


        }

        $.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards, function (i, obj) {


            obj.Presentation = "private";


        });


        //GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer = "N";
        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsCurrent = "N";

        UpdateGameHash(GameHash.GameId);

        //OnPlayerAction();



        try {
            var msg = GameHash.Steps[GameHash.Steps.length - 1].Step.Action + " - by " + localStorage.getItem("UserId").split("pk2")[0];
            SendNotification(GameHash.GameId, "", msg);
        } catch (err) {
            console.log(err);
            ExceptionLogging(err);
        }



        //OnPlayerAction();
        // stop at the current position and wait for the game to over ;
    } catch (err) {

        GameLogging(err, 2)
    }
});

$(document).on("click", ".Pass", function () {


    try {

        // var betamount = $('.Player[data-sno="' + Sno + '"]').find('#BetTakeValue').val(); // for active user

        if ((parseFloat(GameHash.CurrentBet) - parseFloat(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].CurrentRoundStatus)) != 0) {

            alert("Cannot check when the bet is not 0");
            SendNotification(GameCode, "", "Cannot check when the bet is not 0");
            return;
        } else {
            // $('.Player[data-sno="' + Sno + '"]').find('.PlayerActions').hide();
            var betamount = 0;
            var playeramount_hash = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount;
            GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerAmount = parseFloat(playeramount_hash) - parseFloat(betamount);
            GameHash.PotSize = parseFloat(GameHash.PotSize) + parseFloat(betamount);


            GameHash.Steps.push({
                RoundId: GameHash.Round,
                Step: {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: "Pass",
                    Amount: betamount
                }
            });

            if (GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno).length == 1)
                GameHash.LastActionPerformed.filter(x => x.PlayerSno == Sno)[0].Action = {
                    PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                    PlayerSno: Sno,
                    Action: "Pass",
                    Amount: betamount
                };
            else
                GameHash.LastActionPerformed.push({
                    PlayerSno: Sno,
                    Action: {
                        PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                        PlayerSno: Sno,
                        Action: "Pass",
                        Amount: betamount
                    }
                });



            //GameHash.CurrentBet = parseFloat(GameHash.CurrentBet) + parseFloat(betamount);
            OnPlayerAction();

            try {
                var msg = GameHash.Steps[GameHash.Steps.length - 1].Step.Action + " - by " + localStorage.getItem("UserId").split("pk2")[0] + " Amount : " + 0;
                SendNotification(GameHash.GameId, "", msg);
            } catch (err) {
                console.log(err);
                ExceptionLogging(err);
            }

        }

        $('.Player[data-sno="' + Sno + '"]').find('#BetTakeValue').val(BetTakeLocalValue);

    } catch (err) {

        GameLogging(err, 2);
    }
});


$(document).on("click", ".PassDeal", function () {

    //$('.PassDeal').attr('data-original-title', "Click to see the option");
    $('.tooltip-inner').html('');
    var tmphtml = "";
    if (GameHash.ActivePlayers.filter(x => x.IsFolded == "N" && x.Sno != Sno).length > 0) {
        $.each(GameHash.ActivePlayers.filter(x => x.IsFolded == "N" && x.Sno != Sno), function (i, obj) {

            tmphtml += '<button class="btn-sm btn-primary" onclick="PassDealPlayer(' + obj.Sno + '); ">' + obj.PlayerId.split("pk2")[0] + '</button><br/>';

            //var tmphtml = '<button class="btn-sm btn-primary" onclick="PassDealPlayer(' + obj.Sno + '); ">' + obj.PlayerId.split("pk2")[0] + '</button>';
            // $('.PassDeal').attr('data-original-title', tmphtml);
            //$('.PassDeal').attr('title', tmphtml);

            //  $('.PassDealPopUpPlayers').append('<button class="btn-sm btn-primary" onclick="PassDealPlayer(' + obj.Sno + ');">' + obj.PlayerId.split("pk2")[0] + '</button>');


        });

        $('.tooltip-inner').html(tmphtml);
        $('.tooltip-inner').append('<button class="btn-sm btn-danger" onclick="BodyClick()">Close</button');

    }
    else {
        //$('.PassDeal').attr('data-title', "No active player!");
        $('.tooltip-inner').html("No active player!");
    }
    //  $('#PassDealPopUp').show("modal");



});


$(document).on("click", ".PassCard", function () {

    $('.tooltip-inner').html('');


    if (GameHash.ActivePlayers.filter(x => x.IsFolded == "N" && x.Sno != Sno).length > 0) {
        $.each(GameHash.ActivePlayers.filter(x => x.Sno != Sno), function (i, obj) {

            $('.tooltip-inner').append('<button class="btn-sm btn-primary" onclick="PassCard(this);" style="border:none;margin-top:3%;margin-left:1%;" data-playersno="' + obj.Sno + '">' + obj.PlayerId.split("pk2")[0] + '</button><br/>');
        });

        var t1 = 0;
        while (t1 <= GameHash.NumberOfCommunities) {
            $('.tooltip-inner').append('<button class="btn-sm btn-success" onclick="PassCard(this);" style="border:none;margin-top: 3%;margin-right:2%;" data-playersno="X" data-communityindex="' + t1 + '">Community ' + (t1 + 1) + '</button><br>');
            t1++;

        }


        $('.tooltip-inner').append('<button class="btn-sm btn-danger" onclick="BodyClick()">Close</button');



    }
    else {
        $('.tooltip-inner').html("No active player!");
    }
    //  $('#PassDealPopUp').show("modal");

});







$(document).on("click", ".BtnShuffle", function () {

    var val1 = getRandomInt(1, GameHash.Deck.length);
    GameHash.Deck = shuffleDeck(GameHash.Deck);

    UpdateGameHash(GameHash.GameId);

    try {
        var msg = "Deck shuffled - by " + localStorage.getItem("UserId").split("pk2")[0];
        SendNotification(GameHash.GameId, "", msg);
    } catch (err) {
        console.log(err);
        ExceptionLogging(err);
    }

    //OnPlayerAction();

});



$(document).on("click", ".CommunityCard", function () {

    $('.CommunityCard').removeClass("Selected");
    CardSelectedValue = $(this).data("cardvalue");
    $(this).addClass('Selected');
    $("#SelectedCommunityCard").hide();
    var src1 = $($('.CommunityCard.Selected')[0]).attr("src")
    $(".imgSelectedCard").html('<img src="' + window.location.origin + '/' + src1 + '" id="SelectedCommunityCard" style="width:50px;height:100px;" />')
    $('.TakeCommunityCard').find('.ShowOption').show();
    if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer == "Y") {
        //$('.TakeCommunityCard').find('.ShowOption').show();
        if ($('.TakeCommunityCard').find('.TakeToCommunity').length == 0)
            $('.TakeCommunityCard').append('<button class="btn-sm btn-danger TakeToCommunity" onclick="TakeCommunityCard(-2);">Move to deck</button >');
    } else {
        $('.TakeCommunityCard').find('.TakeToCommunity').remove();
        // $('.TakeCommunityCard').find('.ShowOption').hide();
    }




    $("#SelectedCommunityCard").show();


    $('#myModal').find(".modal-header").html("Community Card");
    $('#myModal').find(".modal-body").html($('#CommunityCardClickPopUp').html());
    $('#myModal').show("modal");


});


//for localvalues
$(document).on("keyup", "#BetTakeValue", function () { BetTakeLocalValue = $(this).val(); });
$(document).on("keyup", "#txtAnte", function () { txtAnte = $(this).val(); });
$(document).on("keyup", "#DealValue", function () { DealLocalValue = $(this).val(); });






function UpdateGameHash(code) {

    $('.spinner').show();

    model = {
        "UserId": localStorage.getItem("UserId"),
        "GameCode": code,
        "GameHash": JSON.stringify(GameHash),
        "ConnectionId": connection.connectionId,
        "PlayerUniqueId": accessCookie("UserIdentity"),
        "ActionMessage": "Joined"

    };

    // //debugger;

    var responseData;
    $.ajax({
        url: 'api/GameV2/_UpdateGameHash',
        type: 'POST',
        async: true,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {
            responseData = data;
            console.log("url: 'api/GameV2/_CreateGame',---------success");

            $('#ResumeGameModal').modal('hide');
            UpdateView();
            GameLogging(GameHash, 1);
            $('.spinner').hide();

        }

    })
        .done(function (result) {

            console.log("Updated hash:" + responseData);

        });

}


function BodyClick() {

    $("[data-toggle='tooltip']").tooltip('hide');
}


function PassDealPlayer(newdealerSno) {

    $("[data-toggle='tooltip']").tooltip('hide');

    if (newdealerSno == -1) {
        $('#PassDealPopUp').hide();
        return;
    }

    // for removing deal duplication
    $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

        obj2.IsDealer = "N";

    });
    GameHash.ActivePlayers.filter(x => x.Sno == newdealerSno)[0].IsDealer = "Y";
    GameHash.ActivePlayers.filter(x => x.Sno == newdealerSno)[0].IsCurrent = "N";


    $.each(GameHash.ActivePlayers, function (i, obj) {

        obj.IsCurrent = "N";

    });


    if (GameHash.ActivePlayers.sort(function (a, b) {
        return a.Sno - b.Sno
    }).filter(x => x.Sno > newdealerSno).length == 0) {
        (GameHash.ActivePlayers.sort(function (a, b) {
            return a.Sno - b.Sno
        }).filter(y => y.IsFolded == "N")[0]).IsCurrent = "Y";

    } else {
        (GameHash.ActivePlayers.sort(function (a, b) {
            return a.Sno - b.Sno
        }).filter(y => y.IsFolded == "N" && y.Sno > newdealerSno)[0]).IsCurrent = "Y";

    }


    UpdateGameHash(GameHash.GameId);

    $('#myModal').hide("modal");


}



function TakeCommunityCard(val) {
    if (val == "1") {
        var comindex = GameHash.CommunityCards.filter(y => y.Value == CardSelectedValue)[0].CommunityIndex;
        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.push(GameHash.CommunityCards.filter(y => y.Value == CardSelectedValue)[0]);
        GameHash.CommunityCards = GameHash.CommunityCards.filter(x => x.Value != CardSelectedValue);
        if (GameHash.CommunityCards.filter(x => x.CommunityIndex == comindex).length == 0) {
            GameHash.NumberOfCommunities -= 1;
            $.each(GameHash.CommunityCards.filter(x => x.CommunityIndex > comindex), function (i, obj) {
                obj.CommunityIndex = obj.CommunityIndex - 1
            });
        }
        //GameHash.NumberOfCommunities -= 1;
        if (GameHash.CommunityCards)
            UpdateGameHash(GameHash.GameId);

        SendNotification(GameCode, "", localStorage.getItem("UserId").split("pk2")[0] + " has taken community card");


    } else if (val == "2") {
        GameHash.CommunityCards.filter(x => x.Value == CardSelectedValue)[0].Presentation = "public"; //$('.CommunityCard[data-cardvalue="' + CardSelectedValue + '"]').length

        UpdateGameHash(GameHash.GameId);


        SendNotification(GameCode, "", localStorage.getItem("UserId").split("pk2")[0] + " Community Card shown");


    } else if (val == "-1") {
        $('.CommunityCard').removeClass('Selected');
        $('#CommunityCardClickPopUp').hide();

    } else if (val == "-2") {


        var comindex = GameHash.CommunityCards.filter(y => y.Value == CardSelectedValue)[0].CommunityIndex;
        GameHash.Deck.push(CardSelectedValue);
        GameHash.CommunityCards = GameHash.CommunityCards.filter(y => y.Value != CardSelectedValue);
        // GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.push(GameHash.CommunityCards.filter(y => y.Value == CardSelectedValue)[0]);
        GameHash.CommunityCards = GameHash.CommunityCards.filter(x => x.Value != CardSelectedValue);
        if (GameHash.CommunityCards.filter(x => x.CommunityIndex == comindex).length == 0) {
            GameHash.NumberOfCommunities -= 1;
            $.each(GameHash.CommunityCards.filter(x => x.CommunityIndex > comindex), function (i, obj) {
                obj.CommunityIndex = obj.CommunityIndex - 1
            });
        }

        UpdateGameHash(GameHash.GameId);

        SendNotification(GameCode, "", localStorage.getItem("UserId").split("pk2")[0] + " moved the card to Deck");
    }

    CardSelectedValue = "";

    $('#myModal').find(".modal-header").html("");
    $('#myModal').find(".modal-body").html("");
    $('#myModal').hide("modal");

}


//$('.Player[data-sno="' + obj.Sno + '"]').



function GenerateCode(length) {
    var result = '';
    var characters = '1386540';
    var charactersLength = characters.length;
    for (var i = 0; i < charactersLength; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function Deal(obj) {

    try {

        var val1 = getRandomInt(0, GameHash.Deck.length);
        GameHash.Deck = shuffleDeck(GameHash.Deck);

        // //debugger;
        var NumOfCard = $('#DealValue').val();

        if (GameHash.Deck.length < NumOfCard) {
            alert("Deck only contains " + GameHash.Deck.length);
            return;
        }

        if (NumOfCard == "" || NumOfCard == 0) {
            SendNotification(GameCode, "", "Cannot deal zero or less cards");
            return;

        }

        if ($('input[name="CardDealType"]:checked').val() == undefined) {
            SendNotification(GameCode, "", "Select deal type");
            return;
        }

        var PlayerId = $(obj).data("value");
        // to every one
        if (PlayerId == -1) {
            NumberOfPlayer = GameHash.ActivePlayers.length;
            $($('.Player' + x1).find('.CommunityCardAnimated')).show(1000).hide(1000);
            for (var i = 0; i < NumOfCard; i++) {
                for (var j = 0; j < NumberOfPlayer; j++) {
                    var x1 = j + 1;
                    if (GameHash.ActivePlayers.filter(x => x.Sno == x1)[0].IsFolded == "N") {
                        // [{ Value: "AD", Presentation: "private" }, { Value: "AD", Presentation: "private" }]
                        rand1 = getRandomInt(0, GameHash.Deck.length)
                        GameHash.ActivePlayers.filter(x => x.Sno == x1)[0].PlayerCards.push({
                            Value: GameHash.Deck[0],
                            Presentation: $('input[name="CardDealType"]:checked').val()
                        });
                        Deck = GameHash.Deck.filter(x => x != GameHash.Deck[0]);
                        GameHash.Deck = Deck;
                    }

                }
            }

            $('input[name="CardDealType"]').prop('checked', false);
            $('#DealValue').val(DealLocalValue);
            SendNotification(GameCode, "", "Dealt " + NumOfCard + " cards by " + localStorage.getItem("UserId").split("pk2")[0]);
            UpdateGameHash(GameHash.GameId);


        } else if (PlayerId > 0 && GameHash.ActivePlayers.filter(x => x.IsFolded == "N" && x.Sno == PlayerId).length == 1) {
            NumberOfPlayer = GameHash.ActivePlayers.length;
            $($('.Player' + PlayerId).find('.CommunityCardAnimated')).show(1000).hide(1000);
            for (var i = 0; i < NumOfCard; i++) {

                var rand1 = getRandomInt(0, GameHash.Deck.length - 1);

                // [{ Value: "AD", Presentation: "private" }, { Value: "AD", Presentation: "private" }]
                GameHash.ActivePlayers.filter(x => x.Sno == PlayerId)[0].PlayerCards.push({
                    Value: GameHash.Deck[rand1],
                    Presentation: $('input[name="CardDealType"]:checked').val()
                });
                Deck = GameHash.Deck.filter(x => x != GameHash.Deck[rand1]);
                GameHash.Deck = Deck;
            }


            $('input[name="CardDealType"]').prop('checked', false);
            $('#DealValue').val("");

            UpdateGameHash(GameHash.GameId);

        } else if (PlayerId == "X") {
            $('.PassCommunity').html("");

            var count1 = 0;
            while (count1 < GameHash.NumberOfCommunities) {
                $('.PassCommunity').append('<button class="btn-sm btn-primary" onclick="PassCardToCommunity(' + (count1 + 1) + '); ">' + (count1 + 1) + '</button>');
                count1++;

            }

            //var x = GameHash.NumberOfCommunities == 0 ? "1" : GameHash.NumberOfCommunities

            // $('.PassCommunity').append('<button class="btn-sm btn-success" style="margin:2%;" onclick="PassCardToCommunity(-1);">' + (GameHash.NumberOfCommunities + 1) + '</button>');
            //$('.PassCommunity').append('<button class="btn-sm btn-danger" onclick="PassCardToCommunity(-2);">Close</button>');


            $('#myModal').find(".modal-header").html("Choose Community");
            $('#myModal').find(".modal-body").html($('.PassCommunity').html());

            $('#myModal').show("modal");

            //$('#DealToCommunityPopUp').show();

        }

    } catch (err) {

        GameLogging(err, 2);

    }



}


function ShowLoader() {


    $('.loader').show();
    $('.customPanel').hide();



}

function HideLoader() {

    $('.loader').hide(1000);
    $('.customPanel').show(500);
}


// controller

// from controller
function CreateGame() {

    try {

        GameHash.Steps = [];
        GameHash.CommunityCards = [];
        GameHash.ActivePlayers = [];
        GameHash.ContinuityPlayers = [];
        GameHash.DiscardedCards = [];
        GameHash.GameId = GameCode;
        GameHash.ActivePlayers.push({
            PlayerId: ($('#UserName').val() + "pk2" + accessCookie("UserIdentity")) // combined username+ConnectionId
            ,
            PlayerName: "P1",
            PlayerCards: [] // [{ Value: "AD", Presentation: "private" }, { Value: "AD", Presentation: "private" }]
            ,
            PlayerAmount: 0 // taken - bet = amount
            ,
            ConnectionId: connection.connectionId,
            Sno: 1,
            IsDealer: "Y",
            IsCurrent: "N",
            IsFolded: "N",
            CurrentRoundStatus: 0,
            PlayerUniqueId: accessCookie("UserIdentity")

        });
        Sno = 1;

        model = {
            "UserId": ($('#UserName').val() + "pk2" + accessCookie("UserIdentity")),
            "GameCode": $('#GameCode').val(),
            "GameHash": JSON.stringify(GameHash),
            "ConnectionId": connection.connectionId,
            "PlayerUniqueId": accessCookie("UserIdentity"),
            "GamePlayerHash": JSON.stringify(GameHash.ActivePlayers)
        };

        ////debugger;
        //var person =
        $.ajax({
            url: 'api/GameV2/_CreateGame',
            type: 'POST',
            contentType: 'application/json;',
            data: JSON.stringify(model),
            async: false,
            success: function (data) {

                console.log("url: 'api/GameV2/_CreateGame',---------success");
            }

        })
            .done(function (result) {
                console.log(result);
                StartGame(result);

            });


        //UpdateView();

    } catch (err) {

        GameLogging(err, 2);
    }
}



function StartGame(result) {


    try {

        localStorage.setItem("LastGameCode", GameCode);
        localStorage.setItem("UserId", ($('#UserName').val() + "pk2" + accessCookie("UserIdentity")));
        GameHash.IsRoundSettlement = "Y";
        UpdateGameHash(GameHash.GameId);
        UpdateView();

    } catch (err) {

        GameLogging(err, 2)
    }

}




function ExceptionLogging(err1) {


    console.log("exception : " + err1);


    var req1 = {
        "GameId": GameHash.GameId,
        "PlayerDetail": GameHash.ActivePlayers.filter(x => x.Sno == Sno),
        "GameHashDate": new Date(),
        "ErrorDetail": err1
    };


    try {


        //var arrReport = [];
        //if (localStorage.getItem("ErrorReport") == null)
        //    arrReport.push(req1);
        //else
        //{
        //    arrReport = JSON.parse(localStorage.getItem("ErrorReport"));
        //    arrReport.push(req1);
        //}
        //localStorage.setItem("ErrorReport", JSON.stringify(arrReport));

        request = JSON.stringify(req1);

        $.ajax({
            url: 'api/GameV2/ExceptionLogger',
            type: 'POST',
            async: true,
            contentType: 'application/json;',
            data: JSON.stringify(request),
            success: function (data) {
                console.log("sent error report to server" + data);

            },
            error: function (data1) {
                alert(data1 + "\n" + "please contact admin and send the screenshot");

            }
        });

    } catch (err) {

        alert(err.stack.toString() + "\n" + "please contact admin and send the screenshot");

    }

}



function GameLogging(err, entrytype) {

    if (entrytype == 2)
        errMessage = JSON.stringify(err, Object.getOwnPropertyNames(err))
    else
        errMessage = JSON.stringify(err);


    model = {
        "ErrorLog": errMessage,
        "GameCode": GameHash.GameId,
        "GameHash": JSON.stringify(GameHash),
        "ConnectionId": connection.connectionId,
        "UserIdentityFromCookie": accessCookie("UserIdentity"),
        "LogEntryTypeId": entrytype
    };

    $.ajax({
        url: 'api/GameV2/GameLogginExtension',
        type: 'POST',
        async: true,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {
            console.log("sent error report to server" + data);

        },
        error: function (data1) {
            alert(data1 + "\n" + "please contact admin and send the screenshot");

        },
        complete: function (res) {

            console.log(res);

        }
    });


}




function PlayerActionSitOut() {

    var model = { PlayerUniqueId: localStorage.getItem("UserId"), GameCode: localStorage.getItem("LastGameCode"), ActionCode: "SitOut", GameHash: JSON.stringify(GameHash), ConnectionId: connection.ConnectionId };

    $.ajax({
        url: 'api/GameV2/_PlayerAction',
        type: 'POST',
        async: false,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {

            console.log("url: 'api/GameV2/_CreateGame',---------success");
        }

    })
        .done(function (result) {
            return result;

        });

}


function PlayerActionRejoin() {


    var model = { PlayerUniqueId: localStorage.getItem("UserId"), GameCode: localStorage.getItem("LastGameCode"), ActionCode: "Rejoin", GameHash: JSON.stringify(GameHash), ConnectionId: connection.ConnectionId };

    $.ajax({
        url: 'api/GameV2/_PlayerAction',
        type: 'POST',
        async: false,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {

            console.log("url: 'api/GameV2/_CreateGame',---------success");
        }

    })
        .done(function (result) {
            return result;


        });

}

function PlayerActionLog(actionId) {

    var model = { PlayerUniqueId: localStorage.getItem("UserId"), GameCode: localStorage.getItem("LastGameCode"), ActionCode: actionId, GameHash: JSON.stringify(GameHash), ConnectionId: connection.ConnectionId };

    $.ajax({
        url: 'api/GameV2/_PlayerAction',
        type: 'POST',
        async: false,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {

            console.log("url: 'api/GameV2/_CreateGame',---------success");
        }

    })
        .done(function (result) {
            return result;


        });


}

function GetCurrentGamePlayerList() {

    var model = { PlayerUniqueId: localStorage.getItem("UserId"), GameCode: localStorage.getItem("LastGameCode"), ActionCode: "GetPlayerList" };
    var resp;
    $.ajax({
        url: 'api/GameV2/_GetGamePlayers',
        type: 'POST',
        async: false,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {

            console.log("url: 'api/GameV2/_CreateGame',---------success");
        }

    })
        .done(function (result) {
            resp = result;

        });

    return resp;
}




async function JoinGame(UserId, ConnectionId, GameCode) {

    localStorage.setItem("LastGameCode", GameCode);
    var tmpPreviousPlayerList = GetCurrentGamePlayerList();

    _GetUpdatedGameHash(GameCode);

    $('.spinner').show();


    model = {
        "UserId": (UserId + "pk2" + accessCookie("UserIdentity")),
        "GameCode": GameCode,
        "GameHash": JSON.stringify(GameHash),
        "ConnectionId": connection.connectionId,
        "PlayerUniqueId": accessCookie("UserIdentity"),
        "GamePlayerHash": JSON.stringify(GameHash.ActivePlayers)

    };

    // //debugger;
    //var person =
    $.ajax({
        url: 'api/GameV2/_JoinGame',
        type: 'POST',
        async: false,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {

            console.log("url: 'api/GameV2/_CreateGame',---------success");
        }

    })
        .done(function (result) {

            $('.spinner').hide();


            if (result == undefined || result == null) {

                localStorage.removeItem("LastGameCode"); //, GameCode);
                localStorage.removeItem("UserId") //, model.UserId);
                alert('Game over or no game found with Current Joining Code');
            }
            else if (result == "101") {
                localStorage.removeItem("LastGameCode"); //, GameCode);
                localStorage.removeItem("UserId") //, model.UserId);
                alert('House full. Please try later or contact the Dealer');
            }
            else {


                $("#HomeScreen").hide();
                $("#GameBoard").show();
                var userid1 = UserId + "pk2" + accessCookie("UserIdentity");


                //localstorage
                localStorage.setItem("LastGameCode", GameCode);
                localStorage.setItem("UserId", userid1);



                console.log(result);
                GameHash = JSON.parse(result.GameHash);
                GameHash.GameId = GameCode;
                // GameHash.GameId = GameCode

                if (GameHash.ActivePlayers.length < 6 && GameHash.ActivePlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity")).length == 0) {

                    Sno = GameHash.ActivePlayers.length + 1;
                    var IsCurrent1 = "N"; var IsDealer1 = "N";

                    // if player is second pos
                    if (GameHash.ActivePlayers.filter(x => x.IsDealer == "Y").length > 0) {
                        if (Sno == (GameHash.ActivePlayers.filter(x => x.IsDealer == "Y")[0].Sno + 1))
                            IsCurrent1 = "Y";
                    }

                    //else if (GameHash.ActivePlayers.filter(x => x.IsDealer == "Y").length == 0) {
                    //    IsDealer1 = "Y";
                    //}

                    GameHash.ActivePlayers.push({
                        PlayerId: model.UserId,
                        PlayerName: "P4",
                        PlayerCards: [],
                        PlayerAmount: 0,
                        ConnectionId: connection.connectionId,
                        Sno: Sno,
                        IsDealer: "N",
                        IsCurrent: IsCurrent1,
                        IsFolded: "N",
                        CurrentRoundStatus: 0,
                        PlayerUniqueId: accessCookie("UserIdentity")

                    });

                    if (GameHash.IsRoundSettlement == "N") {

                        GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsFolded = "Y";
                        GameHash.ContinuityPlayers.push(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0]);

                    }





                    UpdateGameHash(GameHash.GameId);
                    UpdateView();
                    $('#HomeScreen').hide();
                    $('#GameBoard').show();
                }
                else if (GameHash.ActivePlayers.length < 6 && GameHash.ActivePlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity") && x.IsFolded == "N").length == 1 && GameHash.ContinuityPlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity")).length == 1) {

                    Sno = GameHash.ActivePlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity"))[0].Sno;
                    var IsCurrent1 = "N";

                    var ExistingPlayer1 = GameHash.ActivePlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity"))[0];
                    ExistingPlayer1.ConnectionId == connection.connectionId;
                    // ExistingPlayer1.IsCurrent = IsCurrent1;
                    // ExistingPlayer1.IsFolded = "N";
                    // ExistingPlayer1.IsDealer = "N";
                    // ExistingPlayer1.CurrentRoundStatus = 0;
                    //ExistingPlayer1.PlayerId = model.UserId;
                    GameHash.ContinuityPlayers = GameHash.ContinuityPlayers.filter(x => x.PlayerUniqueId != accessCookie("UserIdentity"));
                    GameHash.ActivePlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity"))[0] = ExistingPlayer1;

                    //if (GameHash.IsRoundSettlement == "N") {

                    //    GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsFolded = "Y";
                    //    if (GameHash.ContinuityPlayers.filter(x => x.Sno == Sno).length == 0)
                    //        GameHash.ContinuityPlayers.push(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0]);
                    //}
                    UpdateGameHash(GameHash.GameId);
                    UpdateView();
                    $('#HomeScreen').hide();
                    $('#GameBoard').show();

                }
                else if (GameHash.ActivePlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity") && x.IsFolded == "Y").length == 1) {
                    if (GameHash.ContinuityPlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity")).length == 0)
                        GameHash.ContinuityPlayers.push(GameHash.ActivePlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity"))[0]);
                    Sno = GameHash.ActivePlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity"))[0].Sno;
                    UpdateGameHash(GameHash.GameId);
                    UpdateView();
                    $('#HomeScreen').hide();
                    $('#GameBoard').show();

                }

                //alert("Please wait for the dealer to settle up");
                $('#HomeScreen').hide();
                $('#GameBoard').show();
                //UpdateGameHash(GameHash.GameId);
                Sno = GameHash.ActivePlayers.filter(x => x.PlayerUniqueId == accessCookie("UserIdentity"))[0].Sno;
                //UpdateGameHash(GameHash.GameId);
                UpdateView();
                //localStorage.removeItem("LastGameCode");
                //localStorage.removeItem("UserId");
                //location.reload();


            }




            if (GameHash.ActivePlayers.filter(x => x.IsDealer == "Y").length == 0) {

                // for removing deal duplication
                $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                    obj2.IsDealer = "N";

                });

                GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer = "Y";
                UpdateGameHash(GameHash.GameId);
                UpdateView();

            }



        });




    $('#ResumeGameModal').modal('hide')

}



function UpdateView() {

    try {


        var OtherPlayers_Prev = GameHash.ActivePlayers.filter(x => x.Sno < Sno);
        var OtherPlayers_Next = GameHash.ActivePlayers.filter(x => x.Sno > Sno);
        var CurrentPlayer = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0];

        if (IsSitOut == true) {
            $('.BtnSitOut').hide();
            $('.BtnRejoin').show()


        }


        if (GameHash.Deck.length == 52) {
            $('.PlayerX.row').hide();

        }
        else {
            $('.PlayerX.row').show();

        }


        ShowLastAction();


        //if (GameHash.ActivePlayers.filter(x => x.Sno == Sno && x.IsDealer == "Y" && x.IsCurrent == "Y").length == 1 && GameHash.IsRoundSettlement == "Y")
        //{
        //    alert("round settlement");
        //    $('.BtnSettle').trigger('click');
        //    GameHash.IsRoundSettlement = "N";
        //    return;


        // filling player pass card pop up
        $('.PassPlayers').html('<h3>Pass to</h3>');
        $('#pop-up').hide();
        $('#DealToCommunityPopUp').hide();
        $('#CommunityCardClickPopUp').hide();
        // $('input[name="CardDealType"][value="public"]').prop('checked', true);
        $('#PassDealPopUp').hide();
        $('.PlayerName').html("Empty seat");

        $.each(GameHash.ActivePlayers.filter(x => x.Sno != Sno), function (i, obj) {

            if (i == 0)
                $('.PassPlayers').append('<span class="text-dark">Player: </span>');

            $('.PassPlayers').append('<button class="btn-sm btn-primary" onclick="PassCard(this);" style="border:none;margin-top:3%;margin-left:1%;" data-playersno="' + obj.Sno + '">' + obj.PlayerId.split("pk2")[0] + '</button>');
        });

        var t1 = 0;
        while (t1 < GameHash.NumberOfCommunities) {

            if (t1 == 0)
                $('.PassPlayers').append('<hr><span class="text-dark">Community: </span>');

            $('.PassPlayers').append('<button class="btn-sm btn-success" onclick="PassCard(this);" style="border:none;margin-top: 3%;margin-right:2%;" data-playersno="X" data-communityindex="' + t1 + '">' + (t1 + 1) + '</button>');
            t1++;
            // $('.PassPlayers').append('<hr><button class="btn-sm btn-danger" onclick="PassCard(this);" style="margin-left: 10%;margin-right:10%;border:none;margin-top: 3%;" data-playersno="-1">Close</button>');
        }

        if (GameHash.NumberOfCommunities == 0)
            $('.PassPlayers').append('<hr><span class="text-dark">Community: </span>');

        $('.PassPlayers').append('<button class="btn-sm btn-success" style="border:none;margin-top: 3%;margin-right:2%;" onclick="PassCard(this);" data-playersno="X" data-communityindex="' + GameHash.NumberOfCommunities + '">' + (GameHash.NumberOfCommunities + 1) + '</button>');


        $('.Player').removeClass('PlayerFolded');


        $('.DivGameCode').html("<span class='badge badge-success'>Game #<br>" + GameHash.GameId + "</span>");

        if (GameHash.BetStatus != undefined && GameHash.BetStatus != "") {


            $('#status').html(GameHash.BetStatus);

            if (Sno == GameHash.BetStatusSno)
                $('#self').attr("style", "z-index:50;border: 3px solid red !important; background-color: #ffff006e;");
            else
                $('#self').attr("style", "z-index:50;");

        }

        if (CurrentPlayer != undefined) {
            var netstatus = CurrentPlayer.PlayerNetStatusFinal == undefined ? "NA" : CurrentPlayer.PlayerNetStatusFinal;
            $('.PlayerView').find('.PlayerName').html(CurrentPlayer.PlayerId.split('pk2')[0]);
            $('.PlayerView').find('.PlayerStatus').html(CurrentPlayer.PlayerAmount);
            $('.PlayerView').find('.PlayerStatusNet').html(netstatus);
            $('.PlayerView').attr('data-Sno', Sno);
        }

        $('.DealerStatus').hide();
        $('.ActiveStatus').hide();

        // Setting community cards
        $('.PlayerX').find('.CommunityCard').remove();
        $('.PlayerX').parent().find('.PlayerStatus').html(GameHash.PotSize);
        $('.CommunityCardAction').html("");
        // <label class="CommunityCardActionLabel" data-value="1"> All </label>

        var uniqueRanks = [];

        $($('.PlayerX').parent().find('.CommunityCardAnimated')).show(300).hide(300);
        $('.PlayerX').html("");


        GameHash.NumberOfCommunities = 5;
        for (var x = 0; x < 5; x++) {
            $('.PlayerX').append('<div style="width:20%;color:white;" id="CommunityIndex' + x + '">' + (x + 1) + '<br></div>');

        }


        for (var k = 0; k < GameHash.NumberOfCommunities; k++) {

            // '<div class="CommunityCardPile' + (k + 1) + '">';

            //$('.PlayerX').append('<img src="/Cards/' + cardimage + '.png" class="CommunityCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '"></div>');

            //$('.CommunityCardAction').append('<label class="CommunityCardActionLabel" style="text-decoration: underline;cursor:pointer;" onclick="ShowCommunityCard(' + (i + 1) + ')" data-value="' + i + '">' + (i + 1) + '</label>')


            var $htmCommunity = "";
            $.each(GameHash.CommunityCards.filter(x => x.CommunityIndex == k), function (i, obj) {

                var cardimage = "";
                if (obj.Value.length == 3) {
                    cardimage = (obj.Value[2] + obj.Value[0] + obj.Value[1])

                    var tmp = obj.Value[0] + obj.Value[1];
                    // for pile
                    if (uniqueRanks.filter(x => x == tmp).length == 0)
                        uniqueRanks.push(tmp);
                } else {
                    cardimage = (obj.Value[1] + obj.Value[0]);
                    //for pile
                    if (uniqueRanks.filter(x => x == obj.Value[0]).length == 0)
                        uniqueRanks.push(obj.Value[0]);
                }
                cardimage = obj.Presentation == "public" ? cardimage : 'backside';


                $htmCommunity += '<img src="/Cards/' + cardimage + '.png" class="CommunityCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '" data-communityindex="' + k + '">';

            });
            if ($htmCommunity != "")
                $('.PlayerX').find('#CommunityIndex' + k).append($htmCommunity);
            //$htmCommunity += '</div>';

            $('.CommunityCardAction').append('<label class="CommunityCardActionLabel" style="text-decoration: underline;cursor:pointer;" onclick="ShowCommunityCard(' + (k + 1) + ')" data-value="-1">' + (k + 1) + '</label>');

        }
        $('.CommunityCardAction').append('<label class="CommunityCardActionLabel" style="text-decoration: underline;cursor:pointer;" onclick="ShowCommunityCard(-1)" data-value="-1">All</label>');


        for (var i = 0; i < 5; i++) {
            $('.PlayerX').find('#CommunityIndex' + i).append('<div class="CommunityCardDrop" data-cardvalue="-1" data-presentation="public" data-communityindex="' + i + '"  ondrop="dropToCommunity(event);" draggable="false" ondragover="allowDropCommunity(event)" ondragend="dragEndCommunity(event)" ondragleave="dragEndCommunity(event)">+</div></div>');

        }


        $('.CardDealPlayer').html('');
        $('.CardDealPlayer').append('<label style="text-decoration: underline;cursor:pointer;" onClick="Deal(this);" data-value="-1"> All </label>');
        $('.CardDealPlayer').append('<label style="text-decoration: underline;cursor:pointer;" onClick="Deal(this);" data-value="X"> Community </label>');
        //$('#CardDealPlayer').append('<option value="-1">All players</option>');
        $.each(GameHash.ActivePlayers.filter(x => x.IsFolded == "N"), function (i, obj) {
            //.append('<option value="' + obj.Sno + '">' + obj.PlayerId.split('pk2')[0] + '</option>');
            $('.CardDealPlayer').append('<label style="text-decoration: underline;cursor:pointer;" onClick="Deal(this);" data-value="' + obj.Sno + '"> ' + obj.PlayerId.split('pk2')[0] + ' </label>');
        });


        ShowLogging();

        // empty user cards
        $('.Player').find('.PlayerDeck').html('');

        var ptrDisable = [];
        //sno below current sno
        var ptr = 6;
        for (var i = 1; i <= OtherPlayers_Prev.length; i++) {
            var prev = OtherPlayers_Prev.filter(x => x.Sno == Sno - i)[0];

            var netstatusprev = prev.PlayerNetStatusFinal == undefined ? "NA" : prev.PlayerNetStatusFinal;

            $('.Player' + ptr).attr('data-Sno', prev.Sno);
            $('.Player' + ptr).find('.PlayerName').html(prev.PlayerId.split('pk2')[0]);
            $('.Player' + ptr).find('.PlayerStatus').html(prev.PlayerAmount);
            $('.Player' + ptr).find('.PlayerStatusNet').html(netstatusprev);
            ptrDisable.push('.Player' + ptr);
            ptr--;
        }

        var ptr = 2;
        for (var i = 1; i <= OtherPlayers_Next.length; i++) {
            var next = OtherPlayers_Next.filter(x => x.Sno == Sno + i)[0];

            var netstatusnext = next.PlayerNetStatusFinal == undefined ? "NA" : next.PlayerNetStatusFinal;

            $('.Player' + ptr).attr('data-Sno', next.Sno);
            $('.Player' + ptr).find('.PlayerName').html(next.PlayerId.split('pk2')[0]);
            $('.Player' + ptr).find('.PlayerStatus').html(next.PlayerAmount);
            $('.Player' + ptr).find('.PlayerStatusNet').html(netstatusnext);

            ptrDisable.push('.Player' + ptr);
            ptr++;
        }

        $('.Player').show();


        var FoldPlayer = GameHash.ActivePlayers.filter(x => x.IsFolded == "Y");

        if (GameHash.ActivePlayers.filter(x => x.IsDealer == "Y").length > 0)
            $('.Player[data-sno="' + GameHash.ActivePlayers.filter(x => x.IsDealer == "Y")[0].Sno + '"]').find('.DealerStatus').show();

        if (GameHash.ActivePlayers.filter(x => x.IsCurrent == "Y").length > 0)
            $('.Player[data-sno="' + GameHash.ActivePlayers.filter(x => x.IsCurrent == "Y")[0].Sno + '"]').find('.ActiveStatus').show();

        //folded player
        $.each(FoldPlayer, function (i, obj) {

            if (GameHash.ContinuityPlayers.filter(x => x.Sno == obj.Sno).length == 1) {
                // $('.Player[data-sno="' + obj.Sno + '"]').find('.ActiveStatus').html('Active').hide();
                //GameHash.ActivePlayers.filter(x => x.Sno == obj.Sno)[0].IsFolded = "N";
            } else {
                //$('.Player[data-sno="' + obj.Sno + '"]').find('.ActiveStatus').html('Folded').show();
            }
        });

        if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsCurrent == "Y") {

            $('.PlayerActions').show();
            //$(".Bet").show(); $(".Call").show(); $(".Pass").show();
            $(".Bet").prop('disabled', false);
            $(".Call").prop('disabled', false);
            $(".Pass").prop('disabled', false);

            // $('.Player[data-sno="' + Sno + '"]').find()

            // Active deactive dealer tag


        } else {

            //$('.PlayerActions').hide();


            // $(".Bet").hide();
            $(".Bet").prop('disabled', true);
            // $(".Call").hide();
            $(".Call").prop('disabled', true);
            // $(".Pass").hide();
            $(".Pass").prop('disabled', true);


            //$('.PlayerDealer').hide();
        }


        if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsDealer == "Y") {

            $('.PlayerDealer').show();
            //$('.Pass').hide();
            $('.PlayerActions').show();
            // $(".Bet").show(); $(".Call").show(); $(".Pass").show();
            $(".Bet").prop('disabled', false);
            $(".Call").prop('disabled', false);
            $(".Pass").prop('disabled', false);
            $('.BtnSettle').prop('disabled', false);
            $('.BackToMenu').prop('disabled', false);
            $('.BtnCancelHand').prop('disabled', false);

        } else {
            $('.PlayerDealer').hide();
            $('.BtnSettle').prop('disabled', true);
            $('.BackToMenu').prop('disabled', true);
            $('.BtnCancelHand').prop('disabled', true);


        }

        if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].IsCurrent == "Y") {

            //$('.PlayerDealer').show();
            //$('.Pass').show();
            $('.PlayerActions').show();
            //$(".Bet").show(); $(".Call").show(); $(".Pass").show();
            $(".Bet").prop('disabled', false);
            $(".Call").prop('disabled', false);
            $(".Pass").prop('disabled', false);
        }
        else {
            //$('.PlayerDealer').hide();

            //  $('.PlayerActions').hide();
            //$('.Pass').hide(); $('.Bet').hide(); $('.Call').hide();
            $(".Bet").prop('disabled', true);
            $(".Call").prop('disabled', true);
            $(".Pass").prop('disabled', true);

        }

        // update dealt card for owner user
        for (var i = 0; i < GameHash.ActivePlayers.length; i++) {

            var ThisPlayerCardDeck = GameHash.ActivePlayers[i].PlayerCards;
            //if (GameHash.ActivePlayers[i].Sno == Sno)
            //    ThisPlayerCardDeck = SwapCard();

            $('.Player[data-sno="' + GameHash.ActivePlayers[i].Sno + '"]').find('.PlayerDeck').html('');
            $.each(ThisPlayerCardDeck, function (count, obj) {
                // user view
                if ((GameHash.ActivePlayers[i].Sno == Sno && obj.Presentation == "private")) {
                    var cardimage = obj.Value.length == 3 ? (obj.Value[2] + obj.Value[0] + obj.Value[1]) : (obj.Value[1] + obj.Value[0]);

                    $('.Player[data-sno="' + GameHash.ActivePlayers[i].Sno + '"]').find('.PlayerDeck').append('<img src="/Cards/' + cardimage + '.png" class="PlayerCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '" title="' + obj.Presentation + '" draggable="true" ondragstart="drag(event)">');
                } else if (GameHash.ActivePlayers[i].Sno == Sno && obj.Presentation == "public") {

                    var cardimage = obj.Value.length == 3 ? (obj.Value[2] + obj.Value[0] + obj.Value[1]) : (obj.Value[1] + obj.Value[0]);

                    $('.Player[data-sno="' + GameHash.ActivePlayers[i].Sno + '"]').find('.PlayerDeck').append('<img src="/Cards/' + cardimage + '.png" class="PlayerCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '" title="' + obj.Presentation + '" draggable="true" ondragstart="drag(event)">');

                } else if (GameHash.ActivePlayers[i].Sno != Sno && obj.Presentation == "private") {

                    var cardimage = obj.Value.length == 3 ? (obj.Value[2] + obj.Value[0] + obj.Value[1]) : (obj.Value[1] + obj.Value[0]);

                    $('.Player[data-sno="' + GameHash.ActivePlayers[i].Sno + '"]').find('.PlayerDeck').append('<img src="/Cards/backside.png" class="PlayerCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '" title="' + obj.Presentation + '" draggable="false" ondragstart="drag(event)">');

                } else if (GameHash.ActivePlayers[i].Sno != Sno && obj.Presentation == "public") {

                    var cardimage = obj.Value.length == 3 ? (obj.Value[2] + obj.Value[0] + obj.Value[1]) : (obj.Value[1] + obj.Value[0]);

                    $('.Player[data-sno="' + GameHash.ActivePlayers[i].Sno + '"]').find('.PlayerDeck').append('<img src="/Cards/' + cardimage + '.png" class="PlayerCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '" title="' + obj.Presentation + '" draggable="false" ondragstart="drag(event)">');

                }


            });

        }


        // Folded or disconnected users
        $.each(GameHash.ActivePlayers, function (i, obj) {

            $('.Player[data-sno="' + obj.Sno + '"]').removeClass('bg-active');
            if (obj.IsFolded == "Y")
                $('.Player[data-sno="' + obj.Sno + '"]').addClass('PlayerFolded');
            else if (obj.IsCurrent == "Y")
                $('.Player[data-sno="' + obj.Sno + '"]').addClass('bg-active');

        });

        $('.owl-item').find('.Player').removeClass("d-none");

        $('.owl-item').find('.Player[data-sno=""]').addClass("d-none");

        // for other users

        $('#BetTakeValue').val("");
        $('#DealValue').val(DealLocalValue);
        $('#txtAnte').val(AnteLocalValue);


        // hiding all buttons 
        $('#BetTakeValue').hide();
        $('.Bet').hide();
        $('.ShowAll').hide();
        $('.Pass').hide();
        $('.Call').hide();
        $('.Fold').hide();
        $('.Take').hide();
        $('.AddToPot').hide();
        $('.Discard').hide();
        $('.PassCard').hide();


        //show all the time
        $('#BetTakeValue').show();
        $('.Take').show();
        $('.AddToPot').show();

        // new rule
        if (GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.length > 0) {


            $('.ShowAll').show();
        }

        // card dealt / no bet yet // after first bet
        if (GameHash.ActivePlayers.filter(x => x.Sno == Sno && x.IsCurrent == "Y").length == 1 && GameHash.ActivePlayers.filter(x => x.Sno == Sno && x.IsCurrent == "Y")[0].PlayerCards.length > 0) {
            $('#BetTakeValue').show();
            $('.Bet').show();
            $('.ShowAll').show();
            // $('.PassCard').show();
            $('.Take').show();
            $('.AddToPot').show();
            $('.Fold').show();

            if (GameHash.CurrentBet == 0) {
                // no bet
                $('.Pass').show();

            }

            if (GameHash.CurrentBet > 0) {
                // first bet or any bet

                $('.Call').show();


            }


        }


    } catch (err) {

        GameLogging(err, 2);
    }
}




function ShowLastAction() {

    try {

        if (GameHash.LastActionPerformed == undefined || GameHash.LastActionPerformed.length == 0) {
            $('.PlayerAction').html("");
        }


        $.each(GameHash.LastActionPerformed, function (i, obj) {

            $('.Player[data-sno="' + obj.PlayerSno + '"]').find('.PlayerAction').html(obj.Action.Action);

        });
    } catch (err) {

        GameLogging(err, 2);
    }
}




function AddCard(PlayerSno, CardValue, CardType) // 1, AH, public/private
{

    var $SelectedPlayer = $('.Player[data-sno="' + PlayerSno + '"]');

}


function OnPlayerAction() {


    try {

        GameLogging(GameHash, 1);


        var HighestBet = GameHash.ActivePlayers.sort(function (a, b) {
            return b.CurrentRoundStatus - a.CurrentRoundStatus
        })[0].CurrentRoundStatus;
        GameHash.IsRoundSettlement = "N";
        GameHash.CurrentBet = HighestBet
        //GameHash.Transaction = [];


        // round dealer 
        var DealerSno = GameHash.ActivePlayers.filter(x => x.IsDealer == "Y")[0].Sno;
        var TotActivePlayer = GameHash.ActivePlayers.sort(function (a, b) {
            return a.Sno - b.Sno
        }).filter(y => y.IsFolded == "N").length;
        var newCurrent = "";
        var prevSno = GameHash.PrevSno;


        if (GameHash.ActivePlayers.sort(function (a, b) {
            return a.Sno - b.Sno
        }).filter(y => y.IsFolded == "N" && y.Sno > Sno).length == 0) {



            $.each(GameHash.ActivePlayers, function (i, obj) {

                obj.IsCurrent = "N";
                // obj.IsDealer = "N";

            });


            (GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded == "N")[0]).IsCurrent = "Y";
            newCurrent = (GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded == "N")[0]).Sno;
            GameHash.PrevSno = Sno;



            GameHash.BetStatus = GetBetStatus((GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded == "N")[0]).Sno);

            //UpdateGameHash(GameCode);
        } else {


            $.each(GameHash.ActivePlayers, function (i, obj) {

                obj.IsCurrent = "N";
                // obj.IsDealer = "N";

            });



            GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded == "N" && y.Sno > Sno)[0].IsCurrent = "Y";
            newCurrent = GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded == "N" && y.Sno > Sno)[0].Sno;
            GameHash.PrevSno = Sno;


            GameHash.BetStatus = GetBetStatus(GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded == "N" && y.Sno > Sno)[0].Sno);

            //UpdateGameHash(GameCode);
        }

        //change dealer and end hand 

        if (Sno == DealerSno) {

            if (GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded == "N" && y.Sno == DealerSno).length == 0) {

                $.each(GameHash.ActivePlayers, function (i, obj) {

                    obj.IsCurrent = "N";
                    obj.IsDealer = "N";

                });


                if (GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.IsFolded == "N" && y.Sno > DealerSno).length == 0) {

                    var SnoTemp = (GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.IsFolded == "N")[0]).Sno; // for dealer



                    // for removing deal duplication
                    $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                        obj2.IsDealer = "N";

                    });


                    (GameHash.ActivePlayers.filter(x => x.Sno == SnoTemp)[0]).IsDealer = "Y";


                    SnoTemp = (GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.IsFolded == "N" && y.Sno > SnoTemp)[0]).Sno; // for current
                    (GameHash.ActivePlayers.filter(x => x.Sno == SnoTemp)[0]).IsCurrent = "Y";
                    //  newCurrent = (GameHash.ActivePlayers.sort(function(a,b){return a.Sno-b.Sno}).filter(y => y.IsFolded == "N")[0]).Sno;

                    GameHash.BetStatus = GetBetStatus(GameHash.ActivePlayers.filter(x => x.Sno == SnoTemp)[0].Sno);


                } else {

                    var SnoTemp = GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.IsFolded == "N" && y.Sno > DealerSno)[0].Sno; // for dealer;

                    // for removing deal duplication
                    $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                        obj2.IsDealer = "N";

                    });


                    GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.Sno == SnoTemp)[0].IsDealer = "Y";

                    if (GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.IsFolded == "N" && y.Sno > SnoTemp).length > 0)
                        SnoTemp = GameHash.ActivePlayers.sort(function (a, b) {
                            return a.Sno - b.Sno
                        }).filter(y => y.IsFolded == "N" && y.Sno > SnoTemp)[0].Sno; // for current
                    else
                        SnoTemp = GameHash.ActivePlayers.sort(function (a, b) {
                            return a.Sno - b.Sno
                        }).filter(y => y.IsFolded == "N")[0].Sno; // for current

                    GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.Sno == SnoTemp)[0].IsCurrent = "Y";

                    GameHash.BetStatus = GetBetStatus(GameHash.ActivePlayers.sort(function (a, b) {
                        return a.Sno - b.Sno
                    }).filter(y => y.Sno == SnoTemp)[0].Sno);


                }
            }
            //$('.BtnSettle').trigger('click');


        }



        if (GameHash.ActivePlayers.filter(x => x.IsFolded == "N").length == GameHash.ActivePlayers.filter(x => x.IsFolded == "N" && x.CurrentRoundStatus == GameHash.CurrentBet).length) {

            // alert("1596");

            GameHash.Round = GameHash.Round + 1;

            SendNotification(GameCode, "", "Round Settled");

            GameHash.CurrentBet = 0;

            $.each(GameHash.ActivePlayers, function (i, obj) {

                obj.CurrentRoundStatus = 0;

            });


        }


        UpdateGameHash(GameHash.GameId);

    } catch (err) {
        GameLogging(err, 2);

    }



}




function ViewNotification(msg) {


    var $htmlNotif = $('.AlertNotification').html().replace("[message]", msg);

    $('.GeneralMessage').append($htmlNotif);
    $(".alert-success").fadeTo(2000, 500).slideUp(1000, function () {
        $('.GeneralMessage').find(".alert-success").remove();
    });

}


function PassCard(obj) {

    $("[data-toggle='tooltip']").tooltip('hide');

    var PlayerSno = $(obj).data("playersno");
    var $selectedCard = $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard.Selected');

    if (PlayerSno == -1) {
        $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard.Selected').removeClass('Selected');
        CardSelectedValue = "";
        $('.CardActions').hide();
        return;

    } else if (PlayerSno == "X") {

        var communityindex = $(obj).data('communityindex');

        $.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno), function (i, obj) {

            for (var count = 0; count < $selectedCard.length; count++) {
                // GameHash.DiscardedCards.push({ Sno: obj.Sno, PlayerCards: { Value: $($selectedCard[count]).data("cardvalue"), Presentation: $($selectedCard[count]).data("presentation") } });
                // obj.PlayerCards.filter(x => x.Value == $($selectedCard[count]).data("cardvalue"))[0].Presentation = "public";
                var x1temp = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.filter(y => y.Value == $($selectedCard[count]).data("cardvalue"))[0];
                x1temp.Presentation = "public";
                GameHash.CommunityCards.push(x1temp);
                GameHash.CommunityCards.filter(x => x.Value == $($selectedCard[count]).data("cardvalue"))[0].CommunityIndex = communityindex;
                obj.PlayerCards = obj.PlayerCards.filter(y => y.Value != $($selectedCard[count]).data("cardvalue"));
            }


        });


        if (communityindex == GameHash.NumberOfCommunities)
            GameHash.NumberOfCommunities += 1;



        CardSelectedValue = "";
        $('div#pop-up').hide();
        $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard.Selected').removeClass("Selected");
        UpdateGameHash(GameHash.GameId);


        SendNotification(GameCode, "", localStorage.getItem("UserId").split("pk2")[0] + " moved card to community");


    }
    else {



        $.each(GameHash.ActivePlayers.filter(x => x.Sno == Sno), function (i, obj) {

            for (var count = 0; count < $selectedCard.length; count++) {

                //  GameHash.CommunityCards.push(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.filter(y => y.Value == $($selectedCard[count]).data("cardvalue"))[0]);
                //  GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.filter(y => y.Value != CardSelectedValue);

                GameHash.ActivePlayers.filter(x => x.Sno == PlayerSno)[0].PlayerCards.push(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.filter(y => y.Value == $($selectedCard[count]).data("cardvalue"))[0]);
                GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.filter(y => y.Value != $($selectedCard[count]).data("cardvalue"));

            }

        });

        CardSelectedValue = "";
        $('div#pop-up').hide();
        $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard.Selected').removeClass("Selected");
        UpdateGameHash(GameHash.GameId);
    }


}



function PassCardToPlayerByDrop(_ToPassPlayerSno, _CardValue) {

    $("[data-toggle='tooltip']").tooltip('hide');

    //var PlayerSno = $(obj).data("playersno");
    var $selectedCard = $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard[data-cardvalue=""]');

    GameHash.ActivePlayers.filter(x => x.Sno == _ToPassPlayerSno)[0].PlayerCards.push(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.filter(y => y.Value == _CardValue)[0]);
    GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.filter(y => y.Value != _CardValue);

}


function PassCardToCommunityDrop(_Community, _CardValue) {

    $("[data-toggle='tooltip']").tooltip('hide');

    //var PlayerSno = $(obj).data("playersno");

    GameHash.CommunityCards.push({ CommunityIndex: _Community, Value: _CardValue, Presentation: "public" });
    GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards = GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards.filter(y => y.Value != _CardValue);

}






function PassCardToCommunity(num) {




    if (num == -2) {
        //$('#DealToCommunityPopUp').hide();
        $('#myModal').find("modal-body").html("");
        $('#myModal').hide("modal");

        CardSelectedValue = "";
    } else {


        var pres_type = $('input[name="CardDealType"]:checked').val() == undefined ? "public" : $('input[name="CardDealType"]:checked').val();

        var communityposition = (num == -1 ? GameHash.NumberOfCommunities : (num - 1));


        var cnt = 0;
        while (cnt < $('#DealValue').val()) {

            var rand1 = getRandomInt(0, GameHash.Deck.length - 1);

            GameHash.CommunityCards.push({
                Value: GameHash.Deck[rand1],
                Presentation: "public",
                CommunityIndex: communityposition
            });
            Deck = GameHash.Deck.filter(x => x != GameHash.Deck[rand1]);
            GameHash.Deck = Deck;
            cnt++;
        }
        if (num == -1)
            GameHash.NumberOfCommunities += 1;


        UpdateGameHash(GameHash.GameId);

        $('#myModal').find("modal-body").html("");
        $('#myModal').hide("modal");


    }
}

function ToggleLogDiv() {
    var x = document.getElementById("logging", "inviteCode");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}


function ShowCommunityCard(CardValue) {

    if (CardValue == -1) {

        $.each(GameHash.CommunityCards, function (i, obj) {

            obj.Presentation = "public";

        });

    } else {

        $.each(GameHash.CommunityCards.filter(x => x.CommunityIndex == CardValue), function (i, obj) {

            obj.Presentation = "public";

        });
    }
    UpdateGameHash(GameHash.GameId);
}



// view generators - for new functionality 

function GetBetStatus(snoCurrent) {


    var betamount = GameHash.CurrentBet;
    //current player call for continuing round 
    var currentplayerbet = betamount - parseFloat(GameHash.ActivePlayers.filter(x => x.Sno == snoCurrent)[0].CurrentRoundStatus);
    // GameHash.ActivePlayers.filter(x => x.Sno == snoCurrent)[0].CurrentRoundStatus = GameHash.ActivePlayers.filter(x => x.Sno == snoCurrent)[0].CurrentRoundStatus + currentplayerbet;

    var msg1 = "The bet is " + currentplayerbet + " to " + GameHash.ActivePlayers.filter(x => x.Sno == snoCurrent)[0].PlayerId.split("pk2")[0];

    //adding betstatusto
    GameHash.BetStatusSno = snoCurrent;


    return msg1;
}


function SwapCard() {

    var CardsToSwap = JSON.stringify(GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerCards);
    CardsToSwap = JSON.parse(CardsToSwap);

    $.each(CardsToSwap, function (i, obj) {

        var rank = obj.Value[0];
        if (rank == "1")
            rank = 10;
        else if (rank == "J")
            rank = 11;
        else if (rank == "Q")
            rank = 12;
        else if (rank == "K")
            rank = 13;
        else if (rank == "A")
            rank = 14;
        obj.rank = rank;
    });

    return CardsToSwap.sort(function (a, b) {
        return a.rank - b.rank
    });


}




function DistributePot() {

    try {

        var GameHashTemp = {};
        GameHashTemp = JSON.stringify(GameHash);
        GameHashTemp = JSON.parse(GameHashTemp);


        var TotalPlayers = GameHashTemp.ActivePlayers.length;
        var Winners = GameHashTemp.ActivePlayers.filter(x => x.PlayerAmount > 0).sort(function (a, b) {
            return b.PlayerAmount - a.PlayerAmount
        });

        // adding balance to winner  
        $.each(Winners, function (i, obj) {

            obj.Balance = obj.PlayerAmount;

        });

        var Loosers = GameHashTemp.ActivePlayers.filter(x => x.PlayerAmount < 0).sort(function (a, b) {
            return a.PlayerAmount - b.PlayerAmount
        });

        var TransactionMessageTemplate = "[Looser] owes $[Amount] to [Winner]";
        var TransactionList = [];
        PlayerNetStatus = [];

        for (var i = 0; i < Loosers.length; i++) {


            while (Loosers[i].PlayerAmount < 0) {
                for (var j = 0; j < Winners.length; j++) {
                    if (Winners[j].Balance > 0) {
                        TransactionMessageTemplate = "[Looser] owes $[Amount] to [Winner]";

                        if (Winners[j].PlayerAmount >= Math.abs(Loosers[i].PlayerAmount)) {


                            Winners[j].Balance = parseFloat(Winners[j].Balance) - Math.abs(parseFloat(Loosers[i].PlayerAmount));

                            TransactionMessageTemplate = TransactionMessageTemplate.replace("[Looser]", Loosers[i].PlayerId.split("pk2")[0])
                                .replace("[Amount]", Math.abs(Loosers[i].PlayerAmount))
                                .replace("[Winner]", Winners[j].PlayerId.split("pk2")[0]);
                            TransactionList.push(TransactionMessageTemplate);


                            //math trans
                            PlayerNetStatus.push({
                                PlayerId: Loosers[i].PlayerId,
                                Amount: (Loosers[i].PlayerAmount)
                            });
                            PlayerNetStatus.push({
                                PlayerId: Winners[j].PlayerId,
                                Amount: Math.abs(Loosers[i].PlayerAmount)
                            });

                            Loosers[i].PlayerAmount = 0;




                        } else {




                            TransactionMessageTemplate = TransactionMessageTemplate.replace("[Looser]", Loosers[i].PlayerId.split("pk2")[0])
                                .replace("[Amount]", Winners[j].Balance)
                                .replace("[Winner]", Winners[j].PlayerId.split("pk2")[0]);
                            TransactionList.push(TransactionMessageTemplate);



                            PlayerNetStatus.push({
                                PlayerId: Loosers[i].PlayerId,
                                Amount: -(Winners[j].Balance)
                            });
                            PlayerNetStatus.push({
                                PlayerId: Winners[j].PlayerId,
                                Amount: Winners[j].Balance
                            });


                            Loosers[i].PlayerAmount = Loosers[j].PlayerAmount + parseFloat(Winners[j].Balance);
                            Winners[j].Balance = 0;


                        }
                    }

                }
            }




        }


        FinalPlayerNetStatusTemp = [];

        $.each(GameHash.PlayerNetStatus, function (i, obj) {
            FinalPlayerNetStatusTemp.push(obj);

        });

        var arr1 = [];
        $.each(PlayerNetStatus, function (i, obj2) {


            arr1.push({
                PlayerId: obj2.PlayerId,
                Amount: obj2.Amount
            });



        });

        FinalPlayerNetStatusTemp.push(arr1);


        CurrentHandTransaction = {
            "GameHand": GameHash.GameHand,
            "TransactionList": TransactionList
        };


        return CurrentHandTransaction;


    } catch (err) {
        GameLogging(err, 2);

    }
}



function DistributePotFinal() {

    try {



        var GameHashTemp = JSON.stringify(GameHash);
        GameHashTemp = JSON.parse(GameHashTemp);


        $.each(GameHashTemp.ActivePlayers, function (i, obj) {

            if (obj.PlayerNetStatusFinal == undefined)
                obj.PlayerNetStatusFinal = 0;

            obj.PlayerNetStatusFinal = obj.PlayerNetStatusFinal + obj.PlayerAmount;


        })


        var TotalPlayers = GameHashTemp.ActivePlayers.length;
        var Winners = GameHashTemp.ActivePlayers.filter(x => x.PlayerNetStatusFinal > 0).sort(function (a, b) {
            return b.PlayerNetStatusFinal - a.PlayerNetStatusFinal
        });

        // adding balance to winner  
        $.each(Winners, function (i, obj) {

            obj.Balance = obj.PlayerNetStatusFinal;

        });

        var Loosers = GameHashTemp.ActivePlayers.filter(x => x.PlayerNetStatusFinal < 0).sort(function (a, b) {
            return a.PlayerNetStatusFinal - b.PlayerNetStatusFinal
        });

        var TransactionMessageTemplate = "[Looser] owes $[Amount] to [Winner]";
        var TransactionList = [];
        //PlayerNetStatus = [];




        for (var i = 0; i < Loosers.length; i++) {
            while (Loosers[i].PlayerNetStatusFinal < 0) {
                for (var j = 0; j < Winners.length; j++) {


                    if (Winners[j].Balance > 0) {
                        TransactionMessageTemplate = "[Looser] owes $[Amount] to [Winner]";

                        if (Winners[j].PlayerNetStatusFinal >= Math.abs(Loosers[i].PlayerNetStatusFinal)) {



                            TransactionMessageTemplate = TransactionMessageTemplate.replace("[Looser]", Loosers[i].PlayerId.split("pk2")[0])
                                .replace("[Amount]", Math.abs(Loosers[i].PlayerNetStatusFinal))
                                .replace("[Winner]", Winners[j].PlayerId.split("pk2")[0]);
                            TransactionList.push(TransactionMessageTemplate);

                            Loosers[i].PlayerNetStatusFinal = 0;
                            Winners[j].Balance = parseFloat(Winners[j].Balance) + Math.abs(parseFloat(Loosers[i].PlayerNetStatusFinal));




                        } else {


                            TransactionMessageTemplate = TransactionMessageTemplate.replace("[Looser]", Loosers[i].PlayerId.split("pk2")[0])
                                .replace("[Amount]", Winners[j].Balance)
                                .replace("[Winner]", Winners[j].PlayerId.split("pk2")[0]);
                            TransactionList.push(TransactionMessageTemplate);
                            Loosers[i].PlayerNetStatusFinal = Loosers[j].PlayerNetStatusFinal + parseFloat(Winners[j].Balance);


                            Winners[j].Balance = 0;




                        }
                    }
                }

            }



        }


        var FinalHandTransaction = {
            "GameHand": "Game Summary",
            "TransactionList": TransactionList
        };

        return FinalHandTransaction;

        //  return CurrentHandTransaction;


    } catch (err) {

        GameLogging(err, 2);

    }



}



function SettleHand_Click() {

    try {
        var PotSize = GameHash.PotSize;
        var TotalPlayers = GameHash.ActivePlayers;
        var PlayerHands = GameHash.PlayerHandsAfterEachRound.filter(x => x.RoundId == GameHash.RoundId);

        GameHash.CurrentBet = 0;
        var SumOfEachPlayer = 0.0;
        $('.SettleUp-tbody').html('');
        $.each(GameHash.ActivePlayers, function (i, obj) {

            SumOfEachPlayer = SumOfEachPlayer + parseFloat(obj.PlayerAmount);


        });

    } catch (err) {
        GameLogging(err, 2);

    }


}



function SettleRound(SettleType) {

    try {

        if (CurrentHandTransaction == undefined) {
            CurrentHandTransaction = {
                GameHand: GameHash.GameHand,
                TransactionList: ["========= unsettled =========="]
            };
        }

        GameHash.Transaction.push(CurrentHandTransaction);


        $.each(PlayerNetStatus, function (i, obj) {
            GameHash.PlayerNetStatus.push(PlayerNetStatus);
        })


        //ammendment
        var ListForSitOutPlayer = GetCurrentGamePlayerList();




        CurrentHandTransaction = {}


        // GameHash.PotSize = 0;
        GameHash.CommunityCards = [];
        $.each(GameHash.ActivePlayers, function (i, obj) {

            if (GameHash.ContinuityPlayers.filter(x => x.Sno == obj.Sno).length == 1) {

                //only if sitout is lifted
                if (ListForSitOutPlayer.filter(x => x.UserName == obj.PlayerId).length > 0) {
                    if (ListForSitOutPlayer.filter(x => x.UserName == obj.PlayerId)[0].IsSitOut == false || ListForSitOutPlayer.filter(x => x.UserName == obj.PlayerId)[0].IsSitOut == null) {
                        obj.IsFolded = "N";
                        GameHash.ContinuityPlayers = GameHash.ContinuityPlayers.filter(x => x.Sno != obj.Sno);

                    }
                    else {
                        obj.IsFolded = "Y";

                    }
                }
                else {
                    obj.IsFolded = "Y";
                    GameHash.ContinuityPlayers = GameHash.ContinuityPlayers.filter(x => x.Sno != obj.Sno);

                }


                obj.IsCurrent = "N";
                // obj.IsDealer = "N";
            }


            //obj.PlayerAmount = 0;
            obj.PlayerCards = [];
            obj.CurrentRoundStatus = 0;
        });
        // parseInt(GameHash.Round + 1);
        GameHash.Steps.push({
            RoundId: (GameHash.Round - 1),
            Step: {
                PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: " ended hand ",
                Amount: "0 New Hand -->"
            }
        });
        GameHash.Round = 1;
        GameHash.CurrentBet = 0;
        GameHash.Deck = GetNewDeck();
        GameHash.NumberOfCommunities = 0;
        GameHash.GameHand = GameHash.GameHand + 1;


        var DealerSno = 0;
        try {

            DealerSno = GameHash.ActivePlayers.filter(x => x.IsDealer == "Y")[0].Sno;
        } catch (err) {

            GameLogging(err, 2);
            $.each(GameHash.ActivePlayers, function (i, tmp1) {
                tmp1.IsDealer = "N";

            });

            var tmplist = [];
            $.each(GameHash.ContinuityPlayers, function (cnt, objtmp2) {
                tmplist.push(objtmp2.Sno);
            });


            DealerSno = GameHash.ActivePlayers.filter(x => tmplist.filter(y => y == x.Sno).length == 0)[0].Sno;

            // for removing deal duplication
            $.each(GameHash.ActivePlayers, function (cnt1, obj2) {

                obj2.IsDealer = "N";

            });
            GameHash.ActivePlayers.filter(x => tmplist.filter(y => y == x.Sno).length == 0)[0].IsDealer = "Y";
        }

        $.each(GameHash.ActivePlayers, function (i, obj) {

            obj.IsCurrent = "N";
            //obj.IsDealer = "N";

        });

        var SnoTemp = DealerSno;
        if (GameHash.ActivePlayers.sort(function (a, b) {
            return a.Sno - b.Sno
        }).filter(y => y.IsFolded == "N").length == 0) {
            if (GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.Sno > SnoTemp).length > 0) {

                GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.Sno > SnoTemp)[0].IsCurrent = "Y";
            }
            else {


                GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.Sno < SnoTemp)[0].IsCurrent = "Y";


            }
        }
        else if (GameHash.ActivePlayers.sort(function (a, b) {
            return a.Sno - b.Sno
        }).filter(y => y.IsFolded == "N" && y.Sno > DealerSno).length == 0) {

            //var SnoTemp = (GameHash.ActivePlayers.sort(function (a, b) { return a.Sno - b.Sno }).filter(y => y.IsFolded == "N")[0]).Sno; // for dealer
            //(GameHash.ActivePlayers.filter(x => x.Sno == SnoTemp)[0]).IsDealer = "Y";

            SnoTemp = (GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded == "N")[0]).Sno; // for current
            (GameHash.ActivePlayers.filter(x => x.Sno == SnoTemp)[0]).IsCurrent = "Y";
            //  newCurrent = (GameHash.ActivePlayers.sort(function(a,b){return a.Sno-b.Sno}).filter(y => y.IsFolded == "N")[0]).Sno;

        } else {

            //var SnoTemp = GameHash.ActivePlayers.sort(function (a, b) { return a.Sno - b.Sno }).filter(y => y.IsFolded == "N" && y.Sno > DealerSno)[0].Sno; // for dealer;
            //GameHash.ActivePlayers.sort(function (a, b) { return a.Sno - b.Sno }).filter(y => y.Sno == SnoTemp)[0].IsDealer = "Y";

            if (GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded == "N" && y.Sno > SnoTemp).length > 0)
                SnoTemp = GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.IsFolded == "N" && y.Sno > SnoTemp)[0].Sno; // for current
            else
                SnoTemp = GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.IsFolded == "N")[0].Sno; // for current

            GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.Sno == SnoTemp)[0].IsCurrent = "Y";
        }



        var SummaryHand = "";
        if (GameHash.Transaction.length > 0) {

            $.each(GameHash.Transaction, function (i, obj) {

                SummaryHand += i + ". " + obj;

            });

        }

        $('#SettlementModal').modal('hide');



        GameHash.Steps.push({
            RoundId: (GameHash.Round - 1),
            Step: {
                PlayerId: GameHash.ActivePlayers.filter(x => x.Sno == Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: " ended hand ",
                Amount: "0 ||Summary: " +
                    SummaryHand + "||  New Hand -->"
            }
        });


        GameHash.BetStatus = "The bet is 0 to " + (GameHash.ActivePlayers.filter(x => x.IsCurrent == "Y")[0]).PlayerId.split('pk2')[0];


        if (GameHash.ActivePlayers.filter(x => x.IsDealer == "Y")[0].Sno == Sno) {
            GameHash.IsRoundSettlement = "Y";
            UpdateGameHash(GameHash.GameId);





            SendNotification(GameHash.GameId, "", "Hand eneded by" + localStorage.getItem("UserId").split("pk2")[0]);
        }

    } catch (err) {
        GameLogging(err, 2);

    }


}



/**
 * Returns parameter string with its first letter capitalized
 * 
 * @param {string} str - The string to capitalize
 */
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Returns a log statement with user action data
 * 
 * @param {object} actionObj - The action data object
 */
function buildLogStatement(actionObj) {
    let statement = '',
        actionSplit = actionObj.Action.split(':'),
        amount = actionObj.Amount;

    switch (actionSplit[0]) {
        case 'Ante':
            statement = `anted $${amount}`;
            break;
        case 'Bet':
            statement = `bet $${amount}`;
            break;
        case 'raised by':
            statement = `raised the bet by ${actionSplit[1].split('-')[0]} to $${amount}`;
            break;
        // This ones not working..or is it?
        /* case /^called/.test(actionSplit[0]):
            statement = `called the bet of ${amount}`;
            break; */
        case 'take':
            statement = `took $${amount}`;
            break;
        case 'discarded':
            statement = `discarded ${'# coming soon'} cards`;
            break;
        case 'fold':
            statement = 'folded';
            break;
        default:
            statement = actionObj.Action;
            break;
    }

    return statement;
}


/**
 * Prints a log of ante-ing, betting, raising, folding, discarding, taking money, and ending hands
 * 
 * Prints that information round by round, hand by hand
 * 
 * Prints that information into the sidebar (.CustomSideBar) in the DOM
 */
function ShowLogging() {

    // TEMP: PLEASE REMOVE ONCE WORK IS COMPLETED
    console.log("A call has been made to the new & improved ShowLogging() function");

    // Reference to the left sidebar element where we will insert messages
    let $logElement = $('.CustomSideBar');

    // Clear HTML content from both logging locations
    $logElement.html('');

    // Declare local variables
    var tempRound = '',
        prevMessage = '',
        spanClass = '',
        html = '',
        htmlRound = '';

    // For each step in the Game Hash's Steps object...
    $.each(GameHash.Steps, function (i, obj) {

        // If the current step object's RoundId DOES NOT equal 0...
        if (obj.RoundId != "0") {

            // Used in the else block down below for further iterations of this $.each loop (should be removed once this doesn't rewrite the log's entirety)
            prevMessage = obj.Step.Action;

            // Assign an even/odd class to be used for an alternating color pattern based on RoundId
            spanClass = obj.RoundId % 2 === 0 ? 'even' : 'odd';

            // Clear local variables for html strings
            htmlRound = '';
            html = '';

            // If tempRound's value does not equal the current step object's RoundId...
            // This block looks like it will only ever be entered onced per round/RoundId
            if (tempRound != obj.RoundId) {
                // Create an HTML string with the round number and set tempRound's value to match the current RoundId
                htmlRound = `<span class='${spanClass}'>Round: ${obj.RoundId}</span>`;
                tempRound = obj.RoundId;
            }

            // TEMP - PLEASE REMOVE WHEN FINISHED
            console.log(obj);

            // Invoke helper function to build a log statement with a player action
            let actionText = buildLogStatement(obj.Step);

            /* 
                Construct an HTML string literal with the relevant information:
                    
                        Round Number HTML element: htmlRound (constructed earlier, might be empty)
                        Odd/Even Class: spanClass (for coloring purposes based on logic above)
                        Player Name: obj.Step.PlayerId.split('pk2')[0]
                        Player Action/Amount: actionText (constructed above)
            */
            html =
                `<br />
                ${htmlRound.length > 0 ? `${htmlRound}<br />` : ''}
                <br />
                &nbsp;&nbsp;&#8594;&nbsp;
                <span class='${spanClass}'>
                    <strong>${capitalizeFirstLetter(obj.Step.PlayerId.split('pk2')[0])}</strong>
                    ${actionText}
                </span>`;

            // Insert HTML string into log sidebar
            $('.CustomSideBar').append(html);
        }

        // Else (the current step object's RoundId DOES equal 0)...
        else {

            // Add 'Ended Hand' to the log
            if (prevMessage != " ended hand ") {
                $('.logging').append(" ended hand ");
                $('.CustomSideBar').append(" ended hand ");
            }
            prevMessage = " ended hand ";
        }
    });
}

//function ShowLogging() {

//    try {

//        // logging
//        $('.logging').html('');
//        $('.CustomSideBar').html('');


//        var tempRound = "";
//        var prevMessage = "";
//        $.each(GameHash.Steps, function (i, obj) {



//            if (obj.RoundId != "0") {

//                prevMessage = obj.Step.Action;

//                var spanClass = "";
//                if (obj.RoundId % 2 == 0)
//                    spanClass = "even";
//                else
//                    spanClass = "odd";



//                var html = "";
//                var htmlRound = "";
//                if (tempRound != obj.RoundId) {
//                    tempRound = obj.RoundId;
//                    htmlRound += "<span class='" + spanClass + "'>Round: " + obj.RoundId + "</span>";
//                }

//                html = "<br>" + htmlRound + "<br>&#8594<span class='" + spanClass + "'><strong>" + obj.Step.PlayerId.split('pk2')[0] + "</strong>-" + obj.Step.Action + (obj.Step.Action == "take" ? " " + obj.Step.Amount : "") + "</span>";
//                $('.logging').append(html);


//                html = "";

//                html = "<br>" + htmlRound + "<br>&#8594<span class='" + spanClass + "'><strong>" + obj.Step.PlayerId.split('pk2')[0] + "</strong>-" + obj.Step.Action + (obj.Step.Action == "take" ? (" " + obj.Step.Amount) : "") + "</span>";
//                $('.CustomSideBar').append(html);
//            } else {

//                if (prevMessage != " ended hand ") {
//                    $('.logging').append(" ended hand ");
//                    $('.CustomSideBar').append(" ended hand ");
//                }
//                prevMessage = " ended hand ";
//            }


//        });



//        if ($('.CustomSideBar:visible').length == 1) {

//            $('.logging').hide();

//        }

//    } catch (err) {

//        GameLogging(err, 2);

//    }

//}



function ShowSummary() {


}



function ShowHandSettleHand() {

    try {

        // $('#SettlementModal').modal('show');
        if (GameHash.PotSize > 0) {
            $('#MyModalEndHand').modal('show');
        } else if (GameHash.PotSize == 0) {

            var transactions = DistributePot();



            var PotSize = GameHash.PotSize;
            var TotalPlayers = GameHash.ActivePlayers;
            var PlayerHands = GameHash.PlayerHandsAfterEachRound.filter(x => x.RoundId == GameHash.RoundId);

            GameHash.CurrentBet = 0;
            var SumOfEachPlayer = 0.0;
            $('.SettleUp-tbody').html('');
            $.each(GameHash.ActivePlayers, function (i, obj) {

                SumOfEachPlayer = SumOfEachPlayer + parseFloat(obj.PlayerAmount);


            });




            $.each(GameHash.Transaction, function (i, obj) {


                var tmp1 = obj;
                if (tmp1.TransactionList != undefined) {
                    if (tmp1.TransactionList.length > 0) {
                        var htm1 = "<div class='row'>";

                        htm1 += "<div class='col-md-12'><span>Hand # " + (i + 1) + "*</span></div>";

                        var tmp1 = obj;
                        for (var j = 0; j < tmp1.TransactionList.length; j++) {
                            htm1 += "<div class='col-md-2'>" + (j + 1) + ". </div><div class='col-md-10'>" + tmp1.TransactionList[j] + "</div>";
                        }

                        htm1 += "</div>";
                        $('.SettleUp-tbody').append(htm1);

                    }
                }

            });


            var tmp1 = CurrentHandTransaction;
            if (tmp1.TransactionList != undefined) {
                if (tmp1.TransactionList.length > 0) {
                    var htm2 = "<div class='row'>";

                    htm2 += "<div class='col-md-12'><span>Hand # " + GameHash.GameHand + "*</span></div>";


                    for (var j = 0; j < tmp1.TransactionList.length; j++) {
                        htm2 += "<div class='col-md-2'>" + (j + 1) + ". </div><div class='col-md-10'>" + tmp1.TransactionList[j] + "</div>";
                    }

                    htm2 += "</div>";
                    $('.SettleUp-tbody').append(htm2);


                }
            }




            //var FinalTrans = DistributePotFinal();

            //if (FinalTrans != undefined) {
            //    if (FinalTrans.TransactionList != undefined && FinalTrans.TransactionList.length > 0) {
            //        var htm2 = "<div class='row'><div class='col-md-12'><span>=================================</span></div>";

            //        htm2 += "<div class='col-md-12'><span>" + FinalTrans.GameHand + "*</span></div>";


            //        for (var j = 0; j < FinalTrans.TransactionList.length; j++) {
            //            htm2 += "<div class='col-md-2'>" + (j + 1) + ". </div><div class='col-md-10'>" + FinalTrans.TransactionList[j] + "</div>";
            //        }

            //        htm2 += "</div>";
            //        $('#SettlementModal').find('.SettleUp-tbody').append(htm2);

            //    }

            //}

            // $('#SettlementModal').modal('show');



        }
    } catch (err) {

        GameLogging(err, 2);
    }
}





//error report
function SendErrorReport() {



}



function CalculateEndHand(val1) {

    var tmpGameHash = JSON.stringify(val1);
    tmpGameHash = JSON.parse(tmpGameHash);

    $.each(tmpGameHash.ActivePlayers, function (i, obj) {
        if (obj.PlayerNetStatusFinal == undefined || obj.PlayerNetStatusFinal == null)
            obj.PlayerNetStatusFinal = 0;
        obj.PlayerNetStatusFinal = obj.PlayerNetStatusFinal + obj.PlayerAmount

        if (obj.Balance == undefined || obj.Balance == null)
            obj.Balance = 0;

        obj.Balance = obj.PlayerNetStatusFinal;

    })


    var resp = {};
    var ArrTransaction = []; // {from:'p1',to:'p2',amount:10};


    if (tmpGameHash.PotSize == 0) {

        var TotalPlayers = tmpGameHash.ActivePlayers.length;
        var Winners = tmpGameHash.ActivePlayers.filter(x => x.PlayerNetStatusFinal > 0).sort(function (a, b) {
            return b.PlayerNetStatusFinal - a.PlayerNetStatusFinal
        });

        var Neutral = tmpGameHash.ActivePlayers.filter(x => x.PlayerNetStatusFinal == 0).sort(function (a, b) {
            return b.PlayerNetStatusFinal - a.PlayerNetStatusFinal
        });


        var Loosers = tmpGameHash.ActivePlayers.filter(x => x.PlayerNetStatusFinal < 0).sort(function (a, b) {
            return a.PlayerNetStatusFinal - b.PlayerNetStatusFinal
        });


        $.each(Loosers, function (i, obj1) {

            if (obj1.Balance < 0) {

                for (var k = 0; k < Winners.length; k++) {
                    if (obj1.Balance != 0 && Winners[k].Balance != 0) {

                        if (obj1.Balance * (-1) == Winners[k].Balance) {
                            ArrTransaction.push({ 'from': obj1.PlayerId, 'to': Winners[k].PlayerId, 'amount': Winners[k].Balance });
                            obj1.Balance = 0;
                            Winners[k].Balance = 0;

                        }
                        else if (obj1.Balance * (-1) > Winners[k].Balance) {

                            ArrTransaction.push({ 'from': obj1.PlayerId, 'to': Winners[k].PlayerId, 'amount': Winners[k].Balance });
                            obj1.Balance = obj1.Balance + Winners[k].Balance;
                            Winners[k].Balance = 0;
                        }
                        else if (obj1.Balance * (-1) < Winners[k].Balance) {


                            ArrTransaction.push({ 'from': obj1.PlayerId, 'to': Winners[k].PlayerId, 'amount': (obj1.Balance * (-1)) });

                            Winners[k].Balance = obj1.Balance + Winners[k].Balance;

                            obj1.Balance = 0;



                        }
                    }

                }
            }

        });

    }

    resp.GameHashTemp = tmpGameHash;
    resp.ArrTransaction = ArrTransaction;
    return resp;
}




$(window).on("load", function () {

    if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
        alert('Sorry, you are using Safari. Please sign in with Google Chrome');

        window.location = 'https://www.google.com/aclk?sa=l&ai=DChcSEwjf_q7Y7uLvAhVHtO0KHQG9AQEYABAAGgJkZw&sig=AOD64_2uz0f1EMIR2V4FLqk7-elfrDjgjA&q&adurl&ved=2ahUKEwi1rqjY7uLvAhXRa8AKHRQNAUUQ0Qx6BAgCEAE'
    }
    else if (navigator.userAgent.indexOf('Firefox') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
        alert('Sorry, you are using Firefox. Please sign in with Google Chrome');

        window.location = 'https://www.google.com/aclk?sa=l&ai=DChcSEwjf_q7Y7uLvAhVHtO0KHQG9AQEYABAAGgJkZw&sig=AOD64_2uz0f1EMIR2V4FLqk7-elfrDjgjA&q&adurl&ved=2ahUKEwi1rqjY7uLvAhXRa8AKHRQNAUUQ0Qx6BAgCEAE'
    }




    $('a').click(function (e) { e.preventDefault(); $(this).trigger('click'); });

    if (accessCookie("IsIdentityRenewed") != "2") {
        ClearCookieFunction();
    }

    $('.CardActions').hide();
    ValidateUserConnection();

    // to handle refresh or connection lost // if connected again then it would be in waiting list as folded.
    if (localStorage.getItem("LastGameCode") != undefined && localStorage.getItem("LastGameCode") != null && localStorage.getItem("UserId") != null && localStorage.getItem("UserId") != undefined) {

        $('#ResumeGameModal').modal("show");
        //ShowLoader();

    }



});
