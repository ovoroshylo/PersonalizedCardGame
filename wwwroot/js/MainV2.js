/* eslint-disable brace-style */
/* eslint-disable camelcase */
/* eslint-disable no-undef */
/*
     ------------------ BEGIN variable definition and initialization ------------------
*/
let Sno = 3
let GameCode = ''
let CardSelectedValue = ''
let PlayerNetStatus = []
let CurrentHandTransaction // {GameHand:1, TransactionList: ["owe to 1", "owe to 2"]};
let FinalPlayerNetStatusTemp = []
let connection
let IsSitOut = false

let BetTakeLocalValue = 0
let DealLocalValue = 0
const AnteLocalValue = 0

// region game props - specific thread
let GameHash = {
    /**
       * [{PlayerSno:2, Action: 'Bet 2' }]
       * PlayerSno: Sno of the player
       * Action: Last Action message of the specific player
      */
    LastActionPerformed: [], // [{PlayerSno:2, Action: 'Bet 2' }]
    GameHand: 1,
    /*
       * transaction list for end game summary table
      */
    Transaction: [],
    FinalTransaction: [],
    /**
       * Player's final status of betting amount.
       * PlayerId: player's unique id.
       * Status: betting amount.
      */
    PlayerNetStatus: [], // [{PlayerId:s1pk213i29031, Status:-12},{PlayerId:s2pk213i29031, Status:12}]
    BetStatus: 'New hand. No bet yet.',
    BetStatusSno: 0,
    IsRoundSettlement: 'N',
    CurrentBet: 0, // for new req of call
    GameId: '1',
    Deck: GetNewDeck(), /// brandnew deck from common
    // Active Player List
    ActivePlayers: [{
        PlayerId: '1', // combined username+ConnectionId
        PlayerName: 'P1',
        PlayerCards: [{
            Value: 'AD',
            Presentation: 'private'
        }, {
            Value: 'AD',
            Presentation: 'private'
        }],
        PlayerAmount: 0, // taken - bet = amount
        ConnectionId: '111',
        CurrentRoundStatus: 0
    },
    {
        PlayerId: '2',
        PlayerName: 'P2',
        PlayerCards: [{
            Value: 'AD',
            Presentation: 'private'
        }, {
            Value: 'AH',
            Presentation: 'private'
        }],
        PlayerAmount: 0, // taken - bet = amount
        ConnectionId: '222',
        CurrentRoundStatus: 0
    },
    {
        PlayerId: '3',
        PlayerName: 'P3',
        PlayerCards: [{
            Value: '2C',
            Presentation: 'private'
        }, {
            Value: '5S',
            Presentation: 'private'
        }],
        PlayerAmount: 0, // taken - bet = amount
        ConnectionId: '333',
        CurrentRoundStatus: 0
    },
    {
        PlayerId: '4',
        PlayerName: 'P4',
        PlayerCards: [{
            Value: '10S',
            Presentation: 'private'
        }, {
            Value: '10H',
            Presentation: 'private'
        }],
        PlayerAmount: 0, // taken - bet = amount
        ConnectionId: '444',
        CurrentRoundStatus: 0
    },
    {
        PlayerId: '5',
        PlayerName: 'P5',
        PlayerCards: [{
            Value: '4H',
            Presentation: 'private'
        }, {
            Value: '6D',
            Presentation: 'private'
        }],
        PlayerAmount: 0, // taken - bet = amount
        ConnectionId: '555',
        CurrentRoundStatus: 0
    }
    ],
    // Steps of game.
    Steps: [{
        RoundId: 1,
        Step: {
            Id: 1,
            PlayerId: 1,
            Action: 'bet',
            Amount: 100
        }
    },
    {
        RoundId: 1,
        Step: {
            Id: 2,
            PlayerId: 2,
            Action: 'bet',
            Amount: 100
        }
    },
    {
        RoundId: 1,
        Step: {
            Id: 3,
            PlayerId: 3,
            Action: 'pass',
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
    // Current Round Number.
    Round: 1,
    // Cards of community
    CommunityCards: [{
        Value: '4H',
        Presentation: 'public'
    }, {
        Value: '6D',
        Presentation: 'public'
    }],
    PlayerHandsAfterEachRound: [],
    DiscardedCards: [], // { PlayerSno: 1, CardDiscarded: [{Value:"AH",Presentation: "private"}]}
    ContinuityPlayers: [], // players that were folded intentionally or due to server
    NumberOfCommunities: 0,
    CompleteHand: [{
        RoundId: 1,
        RoundStatus: 'Started',
        ActivePlayers: [1, 2],
        Better: 1,
        CurrentPlayer: 2,
        PreviousPlayer: 0,
        NextPlayer: 1,
        LastPlayer: 1
    },
    {
        RoundId: 2,
        RoundStatus: 'Started',
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
        PlayerStatus: 'positive'
    },
    {
        PlayerId: 2,
        PlayerAmount: -50,
        PlayerStatus: 'negative'
    }, {
        PlayerId: 2,
        PlayerAmount: -50,
        PlayerStatus: 'negative'
    }
    ],
    AccountDetail: [] // [{PlayerId:1,Amount:-50}];
}

/*
     ------------------ END variable definition and initialization ------------------
*/

/*
     ------------------ BEGIN event definition ------------------
*/

/*
 * "Resume" Button Click event
 * Only if you already joined game or created game
*/
$(document).on('click', '.BtnResume', function () {
    try {
        JoinGame(GetUserNameFromLocalStorage(), GetConnectionIdFromLocalStorage(), GetLastGameCode())
    } catch (err) {
        GameLogging(err, 2)
    }
})

/*
 * "Start" Button Click event
*/
$(document).on('click', '.BtnStart', function () {
    if ($('#UserName').val() === '' || $('#GameCode').val() === '') {
        alert('Enter username & Generate Game Code to share')
    } else {
        GameCode = $('#GameCode').val()

        // hide homescreen and go into GameBoard
        $('#HomeScreen').hide()
        $('#GameBoard').show()

        // show please wait spinner for 2 seconds.
        $('.spinner').show()

        // Create game
        CreateGame()

        setTimeout(function () {
            $('.spinner').hide()
        }, 2000)
    }
})

/*
 * "GenerateCode" Button Click event
*/
$(document).on('click', '.GenerateCode', function () {
    $('#GameCode').val(GenerateCode())
})

/*
 * "Join" Button Click event
*/
$(document).on('click', '.BtnJoin', function () {

    let userName = $('#UserName1').val()
    let gameCode = $('#GameCode1').val()

    if (userName === '' || gameCode === '') {
        alert('Enter username & Generate Game Code to join')
    } else {
        JoinGame(userName, connection.connectionId, gameCode)
    }
})

/*
 * "Ante" Button click Event
*/
$(document).on('click', '.Ante', function () {

    // Ante action only available when there is at least one active players beside dealer that not folded
    if (FilterActivePlayer(x => x.IsFolded === 'N' && x.IsDealer === 'N').length > 0) {

        const anteValue = parseFloat($('#txtAnte').val())

        AddStepAndSetLastActionPerformed(Sno, {
            Action: 'Ante: ' + anteValue,
            Amount: anteValue
        })

        // Update every ActivePlayer's PlayerAmount
        let potAdd = 0

        $.each(FilterActivePlayer(x => x.IsFolded === 'N'), function (i, obj) {
            obj.PlayerAmount -= anteValue
            potAdd += anteValue
        })

        // Update GameHash's total potsize(+= anteValue * ActivePlayers.length)
        GameHash.PotSize += potAdd

        // Send Notification
        SendNotification(GameHash.GameId, '', 'Ante: ' + anteValue + '')

        // Update GameHash
        UpdateGameHash(GameHash.GameId)
    }

    // If not
    else {
        alert('No Active Player')
    }
})

/*
 * "PassDeal" click Event.
*/
$(document).on('click', '.PassDeal', function () {
    // initialize tooltip
    $('.tooltip-inner').html('')

    const unfoldedActivePlayers = FilterActivePlayer(x => x.IsFolded === 'N' && x.Sno !== Sno)

    // Add Player List to pass Deal (except you and not folded also)
    if (unfoldedActivePlayers.length > 0) {

        let tmphtml = ''
        $.each(unfoldedActivePlayers, function (i, obj) {
            tmphtml += '<button class="btn-sm btn-primary" onclick="PassDealPlayer(' + obj.Sno + '); ">' + GetUserNameFromPlayerId(obj.PlayerId) + '</button><br/>'
        })

        $('.tooltip-inner').html(tmphtml)
        $('.tooltip-inner').append('<button class="btn-sm btn-danger" onclick="BodyClick()">Close</button')
    }

    // If there is no such player, Add "No Active Player" to tooltip.
    else {
        $('.tooltip-inner').html('No active player!')
    }
})

/*
 * "AddToPot" click Event.
*/
$(document).on('click', '.AddToPot', function () {

    // logic
    try {
        const betamount = $('#BetTakeValue').val() // for active user

        // check betamount is at least 1.
        if (betamount < 1) {
            alert('minimum amount: 1')
            return
        } else {

            let currentPlayer = GetActivePlayerBySno(Sno)

            AddAmountToPot(currentPlayer, betamount)

            const actionMsg = ' added to pot'

            //Add step and set LastAction
            AddStepAndSetLastActionPerformed(Sno, {
                Action: actionMsg,
                Amount: betamount
            })

            // Send Notification and UpdateGameHash
            UpdateGameHash(GameHash.GameId)
            SendNotification(GameHash.GameId, '', GetNotificationMsg(actionMsg, betamount))

        }

        // initialize BetTakeValue to 1.
        $('#BetTakeValue').val('1')
    } catch (err) {
        GameLogging(err, 2)
    }
})

/*
 * "Take" click Event.
*/
$(document).on('click', '.Take', function () {
    try {
        /*
            Get takeamount
            If BetTakeValue is more than 1, take BetTakeValue.
            Else, Take all of Game's Current PotSize.
        */
        const betTakeValule = $('#BetTakeValue').val()
        const currentPlayer = GetActivePlayerBySno(Sno)
        const takeamount = (betTakeValule === '' || betTakeValule === '0') ? GameHash.PotSize : parseFloat(betTakeValule)

        // check if takeamount is between 0 ~ GameHash.Potsize
        if (takeamount > GameHash.PotSize || takeamount < 0) {
            SendNotification(GameCode, '', '' + GetUserNameFromPlayerId(currentPlayer.PlayerId) + ' is trying to take ' + takeamount + ' from pot.')
            return
        } else {

            AddAmountToPot(currentPlayer, -(takeamount))

            const actionMsg = 'take'

            AddStepAndSetLastActionPerformed(Sno, {
                Action: actionMsg,
                Amount: takeamount
            })

            // initialilze BetTakeValue
            $('#BetTakeValue').val('')

            // UpdateGameHash
            UpdateGameHash(GameHash.GameId)

            // Send Notification
            SendNotification(GameHash.GameId, '', GetNotificationMsg(actionMsg, takeamount))
        }
    } catch (err) {
        GameLogging(err, 2)
    }
})

/*
 * "Cancel Hand" click Event.
*/
$(document).on('click', '.BtnCancelHand', function () {
    $('#ModalInfoCancelHandPrompt').modal('show')
})

/*
 * "End hand" click event.
*/
$(document).on('click', '.BtnSettle', function () {
    // Intialize GameHash's LastActionPerformed
    GameHash.LastActionPerformed = []
    $('.PlayerAction').html('')
    $('.SettleRound').trigger('click')

    // Set IsRoundSettlement "Y"
    GameHash.IsRoundSettlement = 'Y'
})

/*
 * "Leave Game" click event.
 * Just show confirm modal
*/
$(document).on('click', '.BtnLeave', function () {
    // confirm modal show.
    $('#myModalLeave').find('.modal-body').html('Are you sure you want to leave the game?')
    $('#myModalLeave').modal('show')
})

/*
 * "Yes" on Leave Confirm modal click event.
*/
$(document).on('click', '.BtnLeave_Yes', function () {
    // Set currentPlayer's IsFolded "Y" and add you to the ContinuityPlayers.
    GetActivePlayerBySno(Sno).IsFolded = 'Y'
    GameHash.ContinuityPlayers = FilterContinuityPlayer(x => x.Sno !== Sno)

    // UpdateGameHash
    UpdateGameHash(GameHash.GameId)

    clearLocalStorage()

    // reload after 1500 ms.
    setTimeout(function () {
        location.reload()
    }, 1500)
})

/*
 * "Game Over" click event.
*/
$(document).on('click', '.BackToMenu', function () {
    // Show Summary
    ShowSummaryV2()
})

/*
 * "Yes" on MyModalEndHand click event.
*/
$(document).on('click', '.MyModalEndHand_Yes', function () {
    SettleRound('MyModalEndHand_Yes')
    $('#MyModalEndHand').modal('hide')
})

/*
 * "No" on MyModalEndHand click event.
*/
$(document).on('click', '.MyModalEndHand_No', function () {
    $('#MyModalEndHand').modal('hide')
})

/*
 * "SitOut" click event.
*/
$(document).on('click', '.BtnSitOut', function () {
    try {
        // set IsSitOut true
        IsSitOut = true

        // Show "Rejoin" button instead of "Sit Out" button.
        $('.BtnSitOut').hide()
        $('.BtnRejoin').show()

        // Perform SitOut action
        PlayerActionSitOut()

        const actionMsg = 'fold'

        AddStepAndSetLastActionPerformed(Sno, {
            Action: actionMsg,
            Amount: 0
        })

        const currentPlayer = GetActivePlayerBySno(Sno)

        // Set current player's IsFolded as "Y"
        currentPlayer.IsFolded = 'Y'

        // Add current player to ContinuityPlayers list.
        if (FilterContinuityPlayer(x => x.Sno === Sno).length === 0)
            GameHash.ContinuityPlayers.push(currentPlayer)

        // If all of the players that folded now has joined in the game before you
        if (GetUnfoldedActivePlayersAfterSno().length === 0) {

            // Sort ActivePlayers by Sno and set first folded player's IsCurrent "Y".
            SetFirstUnfoldedPlayerAsCurrent()

            // Set BetStatus as first folded player's betstatus.
            GameHash.BetStatus = GetBetStatus(GetFirstUnfoldedPlayerAfterSno().Sno)
        }

        // there is at least one player folded that joined in the game after you.
        else {

            // Sort ActivePlayers by Sno and set first folded player that joined after me as current.
            SetFirstUnfoldedPlayerAsCurrent(Sno)

            // Set BetStatus as first after-me-joined unfolded player's betstatus.
            GameHash.BetStatus = GetBetStatus(GetFirstUnfoldedPlayerAfterSno(Sno).Sno)
        }

        // If current player is Dealer, set first unfolded player as Dealer
        if (currentPlayer.IsDealer === 'Y') {
            // Set first unfolded player as dealer.
            SetFirstUnfoldedPlayerAsDealer()
        }

        // SitOuted player's card must be all private until he rejoin again.
        $.each(currentPlayer.PlayerCards, function (i, obj) {
            obj.Presentation = 'private'
        })

        // Set CurrentPlayer's Delaer state and current state as false
        currentPlayer.IsDealer = 'N'
        currentPlayer.IsCurrent = 'N'

        // UpdateGameHash
        UpdateGameHash(GameHash.GameId)

        SendNotification(GameHash.GameId, '', GetNotificationMsg(actionMsg))
    } catch (err) {
        GameLogging(err, 2)
    }
})

/*
 * "Rejoin" button clicked.
*/
$(document).on('click', '.BtnRejoin', function () {
    // Add PlayerAction
    PlayerActionRejoin()

    // Show "SitOut" button instead of "Rejoin"
    $('.BtnRejoin').hide()
    $('.BtnSitOut').show()

    // Set IsSitOut false.
    IsSitOut = false
})

/*
 * Click card image
*/
$(document).on('click', '.PlayerCard', function () {
    // hide "Discard" and "Pass Card" button
    $('.Discard').hide()
    $('.PassCard').hide()

    let currentPlayer = GetActivePlayerBySno(Sno)

    // if current player is folded, just do nothing.
    if (currentPlayer.IsFolded === 'Y') { return }

    // You can only control your owned card, not others.
    if ($(this).parents().parent().hasClass('PlayerView')) {
        // toggle selection and button show.

        if ($(this).hasClass('Selected')) {
            $(this).removeClass('Selected')
            if ($('.PlayerCard.Selected').length === 0) {
                $('.PassCard').hide()
                $('.Discard').hide()
            }
        } else {
            $(this).addClass('Selected')
            $('.Discard').show()
            $('.PassCard').show()
            $('.ShowAll').show()
        }
    } else {
        alert('card does not belong to you')
    }
})

/*
 * "EndGame For Current" button on Summary modal clicked.
*/
$(document).on('click', '.EndGameForCurrent', function () {
    try {
        GameCode = ''
        clearLocalStorage()

        let currentPlayer = GetActivePlayerBySno(Sno)

        if (currentPlayer) {
            // Set current player as folded.
            currentPlayer.IsFolded = 'Y'

            // if current player is dealer
            if (currentPlayer.IsDealer === 'Y') {

                // if there are players that joined after me and not folded
                if (GetUnfoldedActivePlayersAfterSno(Sno).length > 0) {

                    // Set first unfolded player after Sno as dealer
                    SetFirstUnfoldedPlayerAsDealer(Sno)
                }

                // if there are players that joined before me and not folded
                else if (GetUnfoldedActivePlayersAfterSno().length > 0) {

                    // Set first unfolded player as dealer.
                    SetFirstUnfoldedPlayerAsDealer()
                }

            }

            // is you are current player
            if (currentPlayer.IsCurrent === 'Y') {

                // if there are players that joined after me and not folded
                if (GetUnfoldedActivePlayersAfterSno(Sno).length > 0) {
                    // Set first unfolded player after Sno as Current player
                    SetFirstUnfoldedPlayerAsCurrent(Sno)
                }

                // if there are players that joined before me and not folded
                else if (GetUnfoldedActivePlayersAfterSno().length > 0) {
                    // Set first unfolded player as dealer.
                    SetFirstUnfoldedPlayerAsCurrent()
                }

            }

            // Add Current Player into ContinuityPlayers
            GameHash.ContinuityPlayers.push(currentPlayer)
            currentPlayer.IsDealer = "N"
            currentPlayer.IsCurrent = "N"
        }

        // Update GameHash
        UpdateGameHash(GameHash.GameId)
        $('.spinner').show()
        setTimeout(function () { location.reload() }, 3000)
    } catch (err) {
        GameLogging(err, 2)
    }
})

/**
 * "New Deal" button clicked.
*/
$(document).on('click', '.SettleRound', function () {
    // Update every active player's PlayerNetStatusFinal and set PlayerAmount, Balance, CurrentRoundStatus all 0 since we start a new deal.
    $.each(GameHash.ActivePlayers, function (i, obj) {

        if (obj.PlayerNetStatusFinal === undefined) { obj.PlayerNetStatusFinal = 0 }

        obj.PlayerNetStatusFinal = obj.PlayerNetStatusFinal + obj.PlayerAmount
        obj.PlayerAmount = 0
        obj.Balance = 0
        obj.CurrentRoundStatus = 0
    })

    SettleRound('SettleRound')
})

/**
 * "Bet" button clicked.
*/
$(document).on('click', '.Bet', function () {
    try {
        // get betamount
        let betamount = $('#BetTakeValue').val()
        const currentPlayer = GetActivePlayerBySno(Sno)

        // you should input betammount
        if (betamount === '') {
            // eslint-disable-next-line no-undef
            alert('bet amount is required')
            return
        }

        betamount = parseFloat(betamount)

        // betamount must be more than currentBet amount - your current round status
        if (betamount < (GameHash.CurrentBet - currentPlayer.CurrentRoundStatus)) {
            // eslint-disable-next-line no-undef
            alert('Minimum bet is:' + GameHash.CurrentBet - currentPlayer.CurrentRoundStatus.toString())
            return
        }

        // if betamount is suitable.
        else {

            AddAmountToPot(currentPlayer, betamount)

            // for continuing round
            currentPlayer.CurrentRoundStatus += betamount

            let actionMsg = 'bet:' + betamount

            // if you betted more than Game's CurrentBet
            if (GameHash.CurrentBet < betamount) {
                actionMsg = ' raised by:' + (betamount - GameHash.CurrentBet) + '- bet:' + betamount
                GameHash.CurrentBet = betamount
            }

            AddStepAndSetLastActionPerformed(Sno, {
                Action: actionMsg,
                Amount: betamount
            })

            // Update GameStatus
            OnPlayerAction()
            SendNotification(GameHash.GameId, '', GetNotificationMsg(actionMsg, betamount));
        }

        // init BetTakeValue
        $('#BetTakeValue').val('')
    } catch (err) {
        GameLogging(err, 2)
    }
})

/**
 * "Call" button clicked
*/
$(document).on('click', '.Call', function () {
    // You can only call when Current Bet is more than 0.
    if (GameHash.CurrentBet === 0) {
        alert('Cannot call on bet - 0')
    } else {
        const betamount = GameHash.CurrentBet
        const currentPlayer = GetActivePlayerBySno(Sno)
        const currentplayerbet = betamount - currentPlayer.CurrentRoundStatus

        currentPlayer.CurrentRoundStatus = betamount

        const actionMsg = 'called with ' + currentplayerbet

        AddAmountToPot(currentPlayer, currentplayerbet)

        AddStepAndSetLastActionPerformed(Sno, {
            Action: actionMsg,
            currentplayerbet: betamount
        })

        // Update Game status
        OnPlayerAction()

        SendNotification(GameHash.GameId, '', GetNotificationMsg(actionMsg, currentplayerbet))

        // BetTake value init
        $('#BetTakeValue').val('')
    }
})

/**
 * "Discard" button clicked
*/
$(document).on('click', '.Discard', function () {

    // find selected card to discard
    const $selectedCard = GetSelectedCardsBySno(Sno)
    const currentPlayer = GetActivePlayerBySno(Sno)

    /*
        1. Add Selected Cards to DiscardedCards list.
        2. Remove selected Cards from ActivePlayers PlayerCards list.
    */
    for (let count = 0; count < $selectedCard.length; count++) {

        const cardvalue = $($selectedCard[count]).data('cardvalue')
        const presentation = $($selectedCard[count]).data('presentation')

        // add to discardedCards list
        GameHash.DiscardedCards.push({
            Sno: Sno,
            PlayerCards: {
                Value: cardvalue,
                Presentation: presentation
            }
        })

        // remove selected cards from playercards list
        currentPlayer.PlayerCards = currentPlayer.PlayerCards.filter(x => x.Value !== cardvalue)
    }

    const actionMsg = 'Discarded'

    // Add Discarded steps
    AddStepAndSetLastActionPerformed(Sno, {
        action: actionMsg,
        Amount: 0
    })

    UpdateGameHash(GameHash.GameId)
    SendNotification(GameHash.GameId, '', GetNotificationMsg(actionMsg))

    $('#ChooseCommunityModal').hide('modal')
})

/**
 * "Show" button clicked.
*/
$(document).on('click', '.ShowAll', function () {
    // get selected cards
    const $selectedCard = GetSelectedCardsBySno(Sno)
    const currentPlayer = GetActivePlayerBySno(Sno)

    // if none cards are selected, you show all of your cards to public
    if ($selectedCard.length === 0) {
        SetPlayerCardsPresentation(currentPlayer.PlayerCards, 'public')
    }

    // else only shows selected cards
    else {
        for (let count = 0; count < $selectedCard.length; count++) {
            currentPlayer.PlayerCards.filter(x => x.Value === $($selectedCard[count]).data('cardvalue'))[0].Presentation = 'public'
        }
    }

    // cancel selection
    $selectedCard.removeClass('Selected')
    UpdateGameHash(GameHash.GameId)

    $('#ChooseCommunityModal').hide('modal')
})

/**
 * "Fold" button clicked
*/
$(document).on('click', '.Fold', function () {
    try {
        const currentPlayer = GetActivePlayerBySno(Sno)
        const actionMsg = 'fold'

        //Add step and set last action of player
        AddStepAndSetLastActionPerformed(Sno, {
            Action: actionMsg,
            Amount: 0
        })

        // Set IsFolded
        currentPlayer.IsFolded = 'Y'

        // Add you to ContinuityPlayers because you folded out.
        if (FilterContinuityPlayer(x => x.Sno === Sno).length === 0)
            GameHash.ContinuityPlayers.push(currentPlayer)

        // alert when all of the players folded.
        if (FilterActivePlayer(x => x.IsFolded === 'N').length === 0)
            alert('all players folded')

        // If there is somebody not folded and joined after current player
        else if (GetUnfoldedActivePlayersAfterSno(Sno).length === 0) {
            SetFirstUnfoldedPlayerAsCurrent()
            GameHash.BetStatus = GetBetStatus(GetFirstUnfoldedPlayerAfterSno().Sno)
        }

        // Otherwise
        else {
            SetFirstUnfoldedPlayerAsCurrent(Sno)
            GameHash.BetStatus = GetBetStatus(GetFirstUnfoldedPlayerAfterSno(Sno).Sno)
        }

        // when you fold, you have to make all of your cards to private.
        SetPlayerCardsPresentation(currentPlayer.PlayerCards, 'private')

        // mark your current as "N" since you are leaving
        currentPlayer.IsCurrent = 'N'

        UpdateGameHash(GameHash.GameId)
        SendNotification(GameHash.GameId, '', GetNotificationMsg(actionMsg))
        
    } catch (err) {
        GameLogging(err, 2)
    }
})

/**
 * "Check" button clicked
*/
$(document).on('click', '.Pass', function () {
    try {
        const currentPlayer = GetActivePlayerBySno(Sno)

        // You can only check when the bet is 0
        if ((GameHash.CurrentBet - currentPlayer.CurrentRoundStatus) !== 0) {
            alert('Cannot check when the bet is not 0')
            return
        } else {

            const actionMsg = 'Pass'
            AddStepAndSetLastActionPerformed(Sno, {
                Action: actionMsg,
                Amount: 0
            });

            // Update Game Status
            OnPlayerAction()
            SendNotification(GameHash.GameId, '', GetNotificationMsg(actionMsg, 0))
        }

        // Set BetTakeValue
        $('.Player[data-sno="' + Sno + '"]').find('#BetTakeValue').val(BetTakeLocalValue)
    } catch (err) {
        GameLogging(err, 2)
    }
})

/**
 * "Pass Card" button clicked
*/
$(document).on('click', '.PassCard', function () {
    // initialize tooltip
    $('.tooltip-inner').html('')

    // If there is at least one player except you that is not folded.
    const unfoldedPlayersExceptMe = FilterActivePlayer(x => x.IsFolded === 'N' && x.Sno !== Sno)

    if (unfoldedPlayersExceptMe.length > 0) {

        // Append players
        $.each(unfoldedPlayersExceptMe, function (i, obj) {
            $('.tooltip-inner').append('<button class="btn-sm btn-primary" onclick="PassCard(this);" style="border:none;margin-top:3%;margin-left:1%;" data-playersno="' + obj.Sno + '">' + GetUserNameFromPlayerId(obj.PlayerId) + '</button><br/>')
        })

        // Append Communities
        let t1 = 0
        while (t1 <= GameHash.NumberOfCommunities) {
            $('.tooltip-inner').append('<button class="btn-sm btn-success" onclick="PassCard(this);" style="border:none;margin-top: 3%;margin-right:2%;" data-playersno="X" data-communityindex="' + t1 + '">Community ' + (t1 + 1) + '</button><br>')
            t1++
        }

        // AddCloseButton
        $('.tooltip-inner').append('<button class="btn-sm btn-danger" onclick="BodyClick()">Close</button')
    }
    else {
        $('.tooltip-inner').html('No active player!')
    }
})

/**
 * When you click cards in Community list.
*/
$(document).on('click', '.CommunityCard', function () {

    // cancel selection of that card.
    $('.CommunityCard').removeClass('Selected')

    // Show Community Card Modal
    CardSelectedValue = $(this).data('cardvalue')
    $(this).addClass('Selected')

    $('#SelectedCommunityCard').hide()
    const src1 = $($('.CommunityCard.Selected')[0]).attr('src')
    $('.imgSelectedCard').html('<img src="' + window.location.origin + '/' + src1 + '" id="SelectedCommunityCard" style="width:50px;height:100px;" />')
    $('.TakeCommunityCard').find('.ShowOption').show()
    if (FilterActivePlayer(x => x.Sno === Sno)[0].IsDealer === 'Y') {
        if ($('.TakeCommunityCard').find('.TakeToCommunity').length === 0) { $('.TakeCommunityCard').append('<button class="btn-sm btn-danger TakeToCommunity" onclick="TakeCommunityCard(-2);">Move to deck</button >') }
    } else {
        $('.TakeCommunityCard').find('.TakeToCommunity').remove()
    }
    $('#SelectedCommunityCard').show()

    $('#ChooseCommunityModal').find('.modal-header').html('Community Card')
    $('#ChooseCommunityModal').find('.modal-body').html($('#CommunityCardClickPopUp').html())
    $('#ChooseCommunityModal').show('modal')
})

$(document).on('keyup', '#BetTakeValue', function () { BetTakeLocalValue = $(this).val() })
$(document).on('keyup', '#txtAnte', function () { txtAnte = $(this).val() })
$(document).on('keyup', '#DealValue', function () { DealLocalValue = $(this).val() })

/*
     ------------------ END event definition ------------------
*/

/*
     ------------------ BEGIN basic function definition ------------------
*/

/*
 * Generate Player Id from userName and userId.
 * return {userName}pk2{userId}
*/
function GeneratePlayerId(userName, userId) {
    return userName + 'pk2' + userId
}

/**
 * Get UserId
 * */
function GetUserId() {
    return accessCookie('UserIdentity')
}

/*
 * Get UserName from UserName + pk2 + ConnectionId formatted string.
*/
function GetUserNameFromPlayerId(playerId) {
    return playerId.split('pk2')[0]
}

/*
 * Get ConnectionId from UserName + pk2 + ConnectionId formatted string.
*/
function GetConnectionIdFromPlayerId(playerId) {
    return playerId.split('pk2')[1]
}

/**
 * Returns parameter string with its first letter capitalized
 *
 * @param {string} str - The string to capitalize
 */
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/*
     ------------------ END basic function definition ------------------
*/

/*
     ------------------ BEGIN common function definition ------------------
*/

/*
    Generating Invitation Code(length = 7)
*/
function GenerateCode() {
    let invitation_code = ''
    const characters = '1386540'
    const charactersLength = characters.length
    for (let i = 0; i < charactersLength; i++) {
        invitation_code += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return invitation_code
}

/*
 * Copy Inviation Code in the input to the Clipboard.
*/
// eslint-disable-next-line no-unused-vars
function copyInvitation() {
    /* Get the text field */
    const copyText = document.getElementById('GameCode')

    /* Select the text field */
    copyText.select()
    copyText.setSelectionRange(0, 99999)

    /* Copy the text inside the text field */
    document.execCommand('copy')

    /* Alert the copied text */
    alert('Copied code: ' + copyText.value)
}

/*
 * Show Summary
 * Only when GameHash.PotSize = 0, you will be available for ShowSummary.
*/
function ShowSummaryV2() {
    // If PotSize = 0
    if (GameHash.PotSize === 0) {

        const currentPlayer = GetActivePlayerBySno(Sno)

        // intialize SettleMent modal.
        $('#SettlementModalEndGame').find('.SettleUp-tbody').html('')

        let htmSettleUpBody = '<table style="width:100%;"><tr><td>Name</td><td>Amount</td><td>Transaction</td></tr>'

        // Get Balance and transactionList
        const resp = CalculateEndHand(GameHash)

        /*
            * Display each player's balance and transaction in a table.
        */
        $.each(resp.GameHashTemp.ActivePlayers.sort(function (a, b) {
            return a.PlayerNetStatusFinal - b.PlayerNetStatusFinal
        }), function (i, obj) {

            let tmpTransactionMessage = ''
            $.each(resp.ArrTransaction.filter(x => x.from === obj.PlayerId), function (cnt, obj2) {
                tmpTransactionMessage += GetUserNameFromPlayerId(obj.PlayerId) + ' owes ' + obj2.amount + ' to ' + GetUserNameFromPlayerId(obj2.PlayerId) + ',<br/>'
            })
            htmSettleUpBody += '<tr><td>' + obj.PlayerId.split('pk2')[0] + '</td><td>' + obj.PlayerNetStatusFinal + '</td><td>' + tmpTransactionMessage + '</td></tr>'
        })

        htmSettleUpBody += '</table>'

        $('#SettlementModalEndGame').find('.SettleUp-tbody').append(htmSettleUpBody)

        // Show SettleMent Modal
        $('#SettlementModalEndGame').modal({
            backdrop: 'static',
            keyboard: false
        })

        $('#SettlementModalEndGame').modal('show')

        // If current player is Dealer, send EndGameSummary to all of players.
        if (currentPlayer.IsDealer === 'Y')
            SendEndGameSummary(GameHash.GameId)
    }

    // If PotSize is more than 0, you can't show summary
    else {
        alert('Game cannot be ended when pot is not settled. Please distribute the Pot First')
    }
}

function SendCancelHandNotification() {
    $('.spinner').show()
    model = {
        NotificationType: 'CancelHand',
        GameCode: GameHash.GameId,
        NotificationMessage: 'hand has been cancelled by dealer'

    }

    let responseData
    $.ajax({
        url: 'api/GameV2/_SendCancelHandNotification',
        type: 'POST',
        async: true,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {
            responseData = data
            console.log("url: 'api/GameV2/_SendCancelHandNotification',---------success")

            UpdateView()
            $('#ModalInfoCancelHand').modal('show')

            GameLogging(GameHash, 1)
            $('.spinner').hide()
        }
    })
        .done(function () {
            console.log('Updated hash:' + responseData)
        })
}

/**
 * Update Game Hash in the GameHashTemp table as Current GameHash global variable value
 * And what's important is that invoke SignalR message "ReceiveHashV1" to game players(it's in the server-side code).
 * @param
 * code: GameCode to update.
 * ActionMsg: ActionMsg indicating which action updates UpdateGameHash
*/
function UpdateGameHash(code, ActionMsg = 'Joined') {
    $('.spinner').show()

    model = {
        UserId: localStorage.getItem('UserId'),
        GameCode: code,
        GameHash: JSON.stringify(GameHash),
        ConnectionId: connection.connectionId,
        PlayerUniqueId: GetUserId(),
        ActionMessage: ActionMsg
    }

    $.ajax({
        url: 'api/GameV2/_UpdateGameHash',
        type: 'POST',
        async: true,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {
            console.log("url: 'api/GameV2/_UpdateGameHash',---------", data)
            $('#ResumeGameModal').modal('hide')
            UpdateView()
            GameLogging(GameHash, 1)
            $('.spinner').hide()
        }
    })
}

/*
 * Update Main Window View based on global variables defined above.
*/
function UpdateView() {
    try {
        // OtherPlayers_Prev: Players that joined before current player
        const OtherPlayers_Prev = FilterActivePlayer(x => x.Sno < Sno)

        // OtherPlayers_Next: Players that joined after current player
        const OtherPlayers_Next = FilterActivePlayer(x => x.Sno > Sno)

        // CurrentPlayer
        const CurrentPlayer = FilterActivePlayer(x => x.Sno === Sno)[0]

        // If you sit out, show "Rejoin" button instead.
        if (IsSitOut === true) {
            $('.BtnSitOut').hide()
            $('.BtnRejoin').show()
        }

        // if all of cards in community, don't display community cards.
        if (GameHash.Deck.length === 52) {
            $('.PlayerX.row').hide()
        }

        // else show community card bucket.
        else {
            $('.PlayerX.row').show()
        }

        // show last action's of every active players.
        ShowLastAction()

        /*
            * Show every bit of component of GameHash
            */

        $('.PassPlayers').html('<h3>Pass to</h3>')
        $('#pop-up').hide()
        $('#DealToCommunityPopUp').hide()
        $('#CommunityCardClickPopUp').hide()
        $('#PassDealPopUp').hide()
        $('.PlayerName').html('Empty seat')

        $.each(FilterActivePlayer(x => x.Sno !== Sno), function (i, obj) {
            if (i === 0) { $('.PassPlayers').append('<span class="text-dark">Player: </span>') }

            $('.PassPlayers').append('<button class="btn-sm btn-primary" onclick="PassCard(this);" style="border:none;margin-top:3%;margin-left:1%;" data-playersno="' + obj.Sno + '">' + obj.PlayerId.split('pk2')[0] + '</button>')
        })

        let t1 = 0
        while (t1 < GameHash.NumberOfCommunities) {
            if (t1 === 0) { $('.PassPlayers').append('<hr><span class="text-dark">Community: </span>') }

            $('.PassPlayers').append('<button class="btn-sm btn-success" onclick="PassCard(this);" style="border:none;margin-top: 3%;margin-right:2%;" data-playersno="X" data-communityindex="' + t1 + '">' + (t1 + 1) + '</button>')
            t1++
        }

        if (GameHash.NumberOfCommunities === 0) { $('.PassPlayers').append('<hr><span class="text-dark">Community: </span>') }

        $('.PassPlayers').append('<button class="btn-sm btn-success" style="border:none;margin-top: 3%;margin-right:2%;" onclick="PassCard(this);" data-playersno="X" data-communityindex="' + GameHash.NumberOfCommunities + '">' + (GameHash.NumberOfCommunities + 1) + '</button>')

        $('.Player').removeClass('PlayerFolded')

        $('.DivGameCode').html("<span class='badge badge-success'>Game #<br>" + GameHash.GameId + '</span>')

        if (GameHash.BetStatus !== undefined && GameHash.BetStatus !== '') {
            $('#status').html(GameHash.BetStatus)

            if (Sno === GameHash.BetStatusSno) { $('#self').attr('style', 'z-index:50;border: 3px solid red !important; background-color: #ffff006e;') } else { $('#self').attr('style', 'z-index:50;') }
        }

        if (CurrentPlayer !== undefined) {
            const netstatus = CurrentPlayer.PlayerNetStatusFinal === undefined ? 'NA' : CurrentPlayer.PlayerNetStatusFinal
            $('.PlayerView').find('.PlayerName').html(CurrentPlayer.PlayerId.split('pk2')[0])
            $('.PlayerView').find('.PlayerStatus').html(CurrentPlayer.PlayerAmount)
            $('.PlayerView').find('.PlayerStatusNet').html(netstatus)
            $('.PlayerView').attr('data-Sno', Sno)
        }

        $('.DealerStatus').hide()
        $('.ActiveStatus').hide()

        $('.PlayerX').find('.CommunityCard').remove()
        $('.PlayerX').parent().find('.PlayerStatus').html(GameHash.PotSize)
        $('.CommunityCardAction').html('')

        const uniqueRanks = []

        $($('.PlayerX').parent().find('.CommunityCardAnimated')).show(300).hide(300)
        $('.PlayerX').html('')

        GameHash.NumberOfCommunities = 5
        for (let x = 0; x < 5; x++) {
            $('.PlayerX').append('<div style="width:20%;color:white;" id="CommunityIndex' + x + '">' + (x + 1) + '<br></div>')
        }

        for (let k = 0; k < GameHash.NumberOfCommunities; k++) {
            // '<div class="CommunityCardPile' + (k + 1) + '">';

            // $('.PlayerX').append('<img src="/Cards/' + cardimage + '.png" class="CommunityCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '"></div>');

            // $('.CommunityCardAction').append('<label class="CommunityCardActionLabel" style="text-decoration: underline;cursor:pointer;" onclick="ShowCommunityCard(' + (i + 1) + ')" data-value="' + i + '">' + (i + 1) + '</label>')

            let $htmCommunity = ''
            $.each(GameHash.CommunityCards.filter(x => x.CommunityIndex === k), function (i, obj) {
                let cardimage = ''
                if (obj.Value.length === 3) {
                    cardimage = (obj.Value[2] + obj.Value[0] + obj.Value[1])

                    const tmp = obj.Value[0] + obj.Value[1]
                    // for pile
                    if (uniqueRanks.filter(x => x === tmp).length === 0) { uniqueRanks.push(tmp) }
                } else {
                    cardimage = (obj.Value[1] + obj.Value[0])
                    // for pile
                    if (uniqueRanks.filter(x => x === obj.Value[0]).length === 0) { uniqueRanks.push(obj.Value[0]) }
                }
                cardimage = obj.Presentation === 'public' ? cardimage : 'backside'

                $htmCommunity += '<img src="/Cards/' + cardimage + '.png" class="CommunityCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '" data-communityindex="' + k + '">'
            })

            if ($htmCommunity !== '') { $('.PlayerX').find('#CommunityIndex' + k).append($htmCommunity) }
            // $htmCommunity += '</div>';

            $('.CommunityCardAction').append('<label class="CommunityCardActionLabel" style="text-decoration: underline;cursor:pointer;" onclick="ShowCommunityCard(' + (k + 1) + ')" data-value="-1">' + (k + 1) + '</label>')
        }
        $('.CommunityCardAction').append('<label class="CommunityCardActionLabel" style="text-decoration: underline;cursor:pointer;" onclick="ShowCommunityCard(-1)" data-value="-1">All</label>')

        for (let i = 0; i < 5; i++) {
            $('.PlayerX').find('#CommunityIndex' + i).append('<div class="CommunityCardDrop" data-cardvalue="-1" data-presentation="public" data-communityindex="' + i + '"  ondrop="dropToCommunity(event);" draggable="false" ondragover="allowDropCommunity(event)" ondragend="dragEndCommunity(event)" ondragleave="dragEndCommunity(event)">+</div></div>')
        }

        $('.CardDealPlayer').html('')
        $('.CardDealPlayer').append('<label style="text-decoration: underline;cursor:pointer;" onClick="Deal(this);" data-value="-1"> All </label>')
        $('.CardDealPlayer').append('<label style="text-decoration: underline;cursor:pointer;" onClick="Deal(this);" data-value="X"> Community </label>')
        $.each(FilterActivePlayer(x => x.IsFolded === 'N'), function (i, obj) {
            $('.CardDealPlayer').append('<label style="text-decoration: underline;cursor:pointer;" onClick="Deal(this);" data-value="' + obj.Sno + '"> ' + obj.PlayerId.split('pk2')[0] + ' </label>')
        })

        ShowLogging()

        // empty user cards
        $('.Player').find('.PlayerDeck').html('')

        const ptrDisable = []
        // sno below current sno
        let ptr = 6
        for (let i = 1; i <= OtherPlayers_Prev.length; i++) {
            const prev = OtherPlayers_Prev.filter(x => x.Sno === Sno - i)[0]

            const netstatusprev = prev.PlayerNetStatusFinal === undefined ? 'NA' : prev.PlayerNetStatusFinal

            $('.Player' + ptr).attr('data-Sno', prev.Sno)
            $('.Player' + ptr).find('.PlayerName').html(prev.PlayerId.split('pk2')[0])
            $('.Player' + ptr).find('.PlayerStatus').html(prev.PlayerAmount)
            $('.Player' + ptr).find('.PlayerStatusNet').html(netstatusprev)
            ptrDisable.push('.Player' + ptr)
            ptr--
        }

        ptr = 2
        for (let i = 1; i <= OtherPlayers_Next.length; i++) {
            const next = OtherPlayers_Next.filter(x => x.Sno === Sno + i)[0]

            const netstatusnext = next.PlayerNetStatusFinal === undefined ? 'NA' : next.PlayerNetStatusFinal

            $('.Player' + ptr).attr('data-Sno', next.Sno)
            $('.Player' + ptr).find('.PlayerName').html(next.PlayerId.split('pk2')[0])
            $('.Player' + ptr).find('.PlayerStatus').html(next.PlayerAmount)
            $('.Player' + ptr).find('.PlayerStatusNet').html(netstatusnext)

            ptrDisable.push('.Player' + ptr)
            ptr++
        }

        $('.Player').show()

        if (FilterActivePlayer(x => x.IsDealer === 'Y').length > 0) { $('.Player[data-sno="' + FilterActivePlayer(x => x.IsDealer === 'Y')[0].Sno + '"]').find('.DealerStatus').show() }

        if (FilterActivePlayer(x => x.IsCurrent === 'Y').length > 0) { $('.Player[data-sno="' + FilterActivePlayer(x => x.IsCurrent === 'Y')[0].Sno + '"]').find('.ActiveStatus').show() }

        // folded player

        if (FilterActivePlayer(x => x.Sno === Sno)[0].IsCurrent === 'Y') {
            $('.PlayerActions').show()
            $('.Bet').prop('disabled', false)
            $('.Call').prop('disabled', false)
            $('.Pass').prop('disabled', false)

            // $('.Player[data-sno="' + Sno + '"]').find()

            // Active deactive dealer tag
        } else {
            // $('.PlayerActions').hide();

            // $(".Bet").hide();
            $('.Bet').prop('disabled', true)
            // $(".Call").hide();
            $('.Call').prop('disabled', true)
            // $(".Pass").hide();
            $('.Pass').prop('disabled', true)

            // $('.PlayerDealer').hide();
        }

        if (FilterActivePlayer(x => x.Sno === Sno)[0].IsDealer === 'Y') {
            $('.PlayerDealer').show()
            // $('.Pass').hide();
            $('.PlayerActions').show()
            // $(".Bet").show(); $(".Call").show(); $(".Pass").show();
            $('.Bet').prop('disabled', false)
            $('.Call').prop('disabled', false)
            $('.Pass').prop('disabled', false)
            $('.BtnSettle').prop('disabled', false)
            $('.BackToMenu').prop('disabled', false)
            $('.BtnCancelHand').prop('disabled', false)
        } else {
            $('.PlayerDealer').hide()
            $('.BtnSettle').prop('disabled', true)
            $('.BackToMenu').prop('disabled', true)
            $('.BtnCancelHand').prop('disabled', true)
        }

        if (FilterActivePlayer(x => x.Sno === Sno)[0].IsCurrent === 'Y') {
            // $('.PlayerDealer').show();
            // $('.Pass').show();
            $('.PlayerActions').show()
            // $(".Bet").show(); $(".Call").show(); $(".Pass").show();
            $('.Bet').prop('disabled', false)
            $('.Call').prop('disabled', false)
            $('.Pass').prop('disabled', false)
        } else {
            // $('.PlayerDealer').hide();

            //  $('.PlayerActions').hide();
            // $('.Pass').hide(); $('.Bet').hide(); $('.Call').hide();
            $('.Bet').prop('disabled', true)
            $('.Call').prop('disabled', true)
            $('.Pass').prop('disabled', true)
        }

        // update dealt card for owner user
        for (let i = 0; i < GameHash.ActivePlayers.length; i++) {
            const ThisPlayerCardDeck = GameHash.ActivePlayers[i].PlayerCards
            // if (GameHash.ActivePlayers[i].Sno === Sno)
            //    ThisPlayerCardDeck = SwapCard();

            $('.Player[data-sno="' + GameHash.ActivePlayers[i].Sno + '"]').find('.PlayerDeck').html('')
            $.each(ThisPlayerCardDeck, function (count, obj) {
                // user view
                if ((GameHash.ActivePlayers[i].Sno === Sno && obj.Presentation === 'private')) {
                    const cardimage = obj.Value.length === 3 ? (obj.Value[2] + obj.Value[0] + obj.Value[1]) : (obj.Value[1] + obj.Value[0])

                    $('.Player[data-sno="' + GameHash.ActivePlayers[i].Sno + '"]').find('.PlayerDeck').append('<img src="/Cards/' + cardimage + '.png" class="PlayerCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '" title="' + obj.Presentation + '" draggable="true" ondragstart="drag(event)">')
                } else if (GameHash.ActivePlayers[i].Sno === Sno && obj.Presentation === 'public') {
                    const cardimage = obj.Value.length === 3 ? (obj.Value[2] + obj.Value[0] + obj.Value[1]) : (obj.Value[1] + obj.Value[0])

                    $('.Player[data-sno="' + GameHash.ActivePlayers[i].Sno + '"]').find('.PlayerDeck').append('<img src="/Cards/' + cardimage + '.png" class="PlayerCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '" title="' + obj.Presentation + '" draggable="true" ondragstart="drag(event)">')
                } else if (GameHash.ActivePlayers[i].Sno !== Sno && obj.Presentation === 'private') {
                    $('.Player[data-sno="' + GameHash.ActivePlayers[i].Sno + '"]').find('.PlayerDeck').append('<img src="/Cards/backside.png" class="PlayerCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '" title="' + obj.Presentation + '" draggable="false" ondragstart="drag(event)">')
                } else if (GameHash.ActivePlayers[i].Sno !== Sno && obj.Presentation === 'public') {
                    const cardimage = obj.Value.length === 3 ? (obj.Value[2] + obj.Value[0] + obj.Value[1]) : (obj.Value[1] + obj.Value[0])

                    $('.Player[data-sno="' + GameHash.ActivePlayers[i].Sno + '"]').find('.PlayerDeck').append('<img src="/Cards/' + cardimage + '.png" class="PlayerCard" data-cardvalue="' + obj.Value + '" data-presentation="' + obj.Presentation + '" title="' + obj.Presentation + '" draggable="false" ondragstart="drag(event)">')
                }
            })
        }

        // Folded or disconnected users
        $.each(GameHash.ActivePlayers, function (i, obj) {
            $('.Player[data-sno="' + obj.Sno + '"]').removeClass('bg-active')
            if (obj.IsFolded === 'Y') { $('.Player[data-sno="' + obj.Sno + '"]').addClass('PlayerFolded') } else if (obj.IsCurrent === 'Y') { $('.Player[data-sno="' + obj.Sno + '"]').addClass('bg-active') }
        })

        $('.owl-item').find('.Player').removeClass('d-none')

        $('.owl-item').find('.Player[data-sno=""]').addClass('d-none')

        // for other users

        $('#BetTakeValue').val('')
        $('#DealValue').val(DealLocalValue)
        $('#txtAnte').val(AnteLocalValue)

        // hiding all buttons
        $('#BetTakeValue').hide()
        $('.Bet').hide()
        $('.ShowAll').hide()
        $('.Pass').hide()
        $('.Call').hide()
        $('.Fold').hide()
        $('.Take').hide()
        $('.AddToPot').hide()
        $('.Discard').hide()
        $('.PassCard').hide()

        // show all the time
        $('#BetTakeValue').show()
        $('.Take').show()
        $('.AddToPot').show()

        // new rule
        if (FilterActivePlayer(x => x.Sno === Sno)[0].PlayerCards.length > 0) {
            $('.ShowAll').show()
        }

        // card dealt / no bet yet // after first bet
        if (FilterActivePlayer(x => x.Sno === Sno && x.IsCurrent === 'Y').length === 1 && FilterActivePlayer(x => x.Sno === Sno && x.IsCurrent === 'Y')[0].PlayerCards.length > 0) {
            $('#BetTakeValue').show()
            $('.Bet').show()
            $('.ShowAll').show()
            // $('.PassCard').show();
            $('.Take').show()
            $('.AddToPot').show()
            $('.Fold').show()

            if (GameHash.CurrentBet === 0) {
                // no bet
                $('.Pass').show()
            }

            if (GameHash.CurrentBet > 0) {
                // first bet or any bet

                $('.Call').show()
            }
        }
    } catch (err) {
        GameLogging(err, 2)
    }
}

/*
 * Show Last Action performed by each active players.
*/
function ShowLastAction() {
    try {
        // If there is not LastActionPerformed
        if (GameHash.LastActionPerformed === undefined || GameHash.LastActionPerformed.length === 0) {
            $('.PlayerAction').html('')
        }

        // Else display each player's LastActionPerformed.
        $.each(GameHash.LastActionPerformed, function (i, obj) {
            $('.Player[data-sno="' + obj.PlayerSno + '"]').find('.PlayerAction').html(obj.Action.Action)
        })
    } catch (err) {
        GameLogging(err, 2)
    }
}

/*
 * hide tooltip
*/
// eslint-disable-next-line no-unused-vars
function BodyClick() {
    $("[data-toggle='tooltip']").tooltip('hide')
}

/**
 * Pass Deal to newdealerSno
 * @param
 * newdealerSno: newdealerSno
*/
// eslint-disable-next-line no-unused-vars
function PassDealPlayer(newdealerSno) {
    $("[data-toggle='tooltip']").tooltip('hide')

    // if newdelaer is not set
    if (newdealerSno === -1) {
        $('#PassDealPopUp').hide()
        return
    }

    // Set newdealerSno as Dealer
    SetDealer(newdealerSno)

    // set current
    if (FilterActivePlayer(x => x.Sno > newdealerSno).length === 0) {
        SetFirstUnfoldedPlayerAsCurrent(-1)
    } else {
        SetFirstUnfoldedPlayerAsCurrent(newdealerSno)
    }

    UpdateGameHash(GameHash.GameId)

    $('#ChooseCommunityModal').hide('modal')
}

// eslint-disable-next-line no-unused-vars
function TakeCommunityCard(val) {
    if (val === '1') {
        const comindex = GameHash.CommunityCards.filter(y => y.Value === CardSelectedValue)[0].CommunityIndex
        FilterActivePlayer(x => x.Sno === Sno)[0].PlayerCards.push(GameHash.CommunityCards.filter(y => y.Value === CardSelectedValue)[0])
        GameHash.CommunityCards = GameHash.CommunityCards.filter(x => x.Value !== CardSelectedValue)

        if (GameHash.CommunityCards.filter(x => x.CommunityIndex === comindex).length === 0) {
            GameHash.NumberOfCommunities -= 1
            $.each(GameHash.CommunityCards.filter(x => x.CommunityIndex > comindex), function (i, obj) {
                obj.CommunityIndex = obj.CommunityIndex - 1
            })
        }
        if (GameHash.CommunityCards) { UpdateGameHash(GameHash.GameId) }

        SendNotification(GameCode, '', GetUserNameFromLocalStorage() + ' has taken community card')
    } else if (val === '2') {
        GameHash.CommunityCards.filter(x => x.Value === CardSelectedValue)[0].Presentation = 'public' // $('.CommunityCard[data-cardvalue="' + CardSelectedValue + '"]').length

        UpdateGameHash(GameHash.GameId)

        SendNotification(GameCode, '', GetUserNameFromLocalStorage() + ' Community Card shown')
    } else if (val === '-1') {
        $('.CommunityCard').removeClass('Selected')
        $('#CommunityCardClickPopUp').hide()
    } else if (val === '-2') {
        const comindex = GameHash.CommunityCards.filter(y => y.Value === CardSelectedValue)[0].CommunityIndex
        GameHash.Deck.push(CardSelectedValue)
        GameHash.CommunityCards = GameHash.CommunityCards.filter(y => y.Value !== CardSelectedValue)
        GameHash.CommunityCards = GameHash.CommunityCards.filter(x => x.Value !== CardSelectedValue)
        if (GameHash.CommunityCards.filter(x => x.CommunityIndex === comindex).length === 0) {
            GameHash.NumberOfCommunities -= 1
            $.each(GameHash.CommunityCards.filter(x => x.CommunityIndex > comindex), function (i, obj) {
                obj.CommunityIndex = obj.CommunityIndex - 1
            })
        }

        UpdateGameHash(GameHash.GameId)

        SendNotification(GameCode, '', GetUserNameFromLocalStorage() + ' moved the card to Deck')
    }

    CardSelectedValue = ''

    $('#ChooseCommunityModal').find('.modal-header').html('')
    $('#ChooseCommunityModal').find('.modal-body').html('')
    $('#ChooseCommunityModal').hide('modal')
}

/**
 * Show Loader and hide customPanel
*/
// eslint-disable-next-line no-unused-vars
function ShowLoader() {
    $('.loader').show()
    $('.customPanel').hide()
}

/*
 * Hide Loader and Show customPanel
*/
// eslint-disable-next-line no-unused-vars
function HideLoader() {
    $('.loader').hide(1000)
    $('.customPanel').show(500)
}

/*
 * Saves GameLog in database
 * param
 * err: error to log
 * entrytype: type of error
*/
function GameLogging(err, entrytype) {
    if (entrytype === 2) { errMessage = JSON.stringify(err, Object.getOwnPropertyNames(err)) } else { errMessage = JSON.stringify(err) }

    model = {
        ErrorLog: errMessage,
        GameCode: GameHash.GameId,
        GameHash: JSON.stringify(GameHash),
        ConnectionId: connection.connectionId,
        UserIdentityFromCookie: GetUserId(),
        LogEntryTypeId: entrytype
    }

    $.ajax({
        url: 'api/GameV2/GameLogginExtension',
        type: 'POST',
        async: true,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function (data) {
            console.log('sent error report to server' + data)
        },
        error: function (data1) {
            alert(data1 + '\n' + 'please contact admin and send the screenshot')
        }
    })
}

/*
 * Remove Specific card in GameHash Deck
*/
function RemoveCardInGameHashDeck(no) {
    Deck = GameHash.Deck.filter(x => x !== GameHash.Deck[no])
    GameHash.Deck = Deck
}

/*
 *  1. Add PlayerCard
 *  2. Remove that card from GameHash.Deck.
*/
function addPlayerCardAndUpdateGameHashDeck(currentPlayerNo) {
    // Generate random index of card to add to the PlayerCard.
    const rand1 = getRandomInt(0, GameHash.Deck.length - 1)
    const currentPlayer = GetActivePlayerBySno(currentPlayerNo)

    // Add PlayerCard, first of shuffeld deck.
    currentPlayer.PlayerCards.push({
        Value: GameHash.Deck[rand1],
        Presentation: $('input[name="CardDealType"]:checked').val()
    })

    // Remove card from the Deck already added to players and Update GameHash's Deck property.
    RemoveCardInGameHashDeck()
}

// Reset CardDealType and DealValue as default.
function initializeDealTypeAndValue() {
    $('input[name="CardDealType"]').prop('checked', false)
    $('#DealValue').val(DealLocalValue)
}

/*
 * Set Last Action Performed.
 * @param
 * current_sno: playerId that you want to set last performed action.
 * action: action of that player.
*/
function SetLastActionPerformed(current_sno, action) {
    // if already set last action performed, just update it.
    if (GameHash.LastActionPerformed.filter(x => x.PlayerSno === current_sno).length === 1) { GameHash.LastActionPerformed.filter(x => x.PlayerSno === current_sno)[0].Action = action }

    // not yet set, so add LastActionPerformed.
    else {
        GameHash.LastActionPerformed.push({
            PlayerSno: current_sno,
            Action: action
        })
    }
}

/*
 * Get Bet Status of player
 * @param
 * snoCurrent: player's Sno
*/
function GetBetStatus(snoCurrent) {
    const betamount = GameHash.CurrentBet

    // current player call for continuing round
    const currentplayerbet = betamount - parseFloat(FilterActivePlayer(x => x.Sno === snoCurrent)[0].CurrentRoundStatus)

    // adding betstatusSno
    GameHash.BetStatusSno = snoCurrent

    return 'The bet is ' + currentplayerbet + ' to ' + FilterActivePlayer(x => x.Sno === snoCurrent)[0].PlayerId.split('pk2')[0]
}

/**
 * Get First unfolded player after Sno
 * @param {integer} Sno - Sno of the player
*/
function GetFirstUnfoldedPlayerAfterSno(Sno = -1) {
    return GameHash.ActivePlayers.sort(function (a, b) {
        return a.Sno - b.Sno
    }).filter(y => y.IsFolded === 'N' && y.Sno > Sno)[0] || {}
}

/**
 * Set Dealer
 * @param {string} newdealerSno - new dealer's Sno
*/
function SetDealer(newdealerSno) {
    //set all player's IsDealer
    $.each(GameHash.ActivePlayers, function (cnt1, obj2) {
        obj2.IsDealer = 'N'
    })

    const newDealer = FilterActivePlayer(x => x.Sno === newdealerSno)[0] || {};
    newDealer.IsDealer = 'Y'
}

/*
 * Set First unfolded player after Sno as dealer
 * @param
 * Sno: player's Sno(-1 as default)
*/
function SetFirstUnfoldedPlayerAsDealer(Sno = -1) {
    SetDealer(GetFirstUnfoldedPlayerAfterSno(Sno))
}

/*
 * Set First unfolded player after Sno as current player
 * @param
 * Sno: player's Sno(-1 as default)
*/
function SetFirstUnfoldedPlayerAsCurrent(Sno = -1) {
    $.each(GameHash.ActivePlayers, function (cnt1, obj2) {
        obj2.IsCurrent = 'N'
    })

    GetFirstUnfoldedPlayerAfterSno(Sno).IsCurrent = 'Y'
}

/**
 * 1. Add _CardValue card to toPlayer.
 * 2. Remove _CardValue card from fromPlayer.
 * @param
 * fromPlayer: player that passes card.
 * toPlayer: player that receives card.
 * _CardValue: passing card value
*/
function passCardToPlayer(fromPlayer, toPlayer, _CardValue) {
    FilterActivePlayer(x => x.Sno === toPlayer)[0].PlayerCards.push(FilterActivePlayer(x => x.Sno === fromPlayer)[0].PlayerCards.filter(y => y.Value === _CardValue)[0])
    RemoveCardFromPlayer(fromPlayer, _CardValue)
}

/**
 * Remove Card from Sno player
 * @param {integer} Sno - Player Sno
 * @param {string} _CardValue - card to remove
*/
function RemoveCardFromPlayer(Sno, _CardValue)
{
    const player = GetActivePlayerBySno(Sno)
    player.PlayerCards = player.PlayerCards.filter(y => y.Value !== _CardValue)
}

/**
 * Returns a log statement with user action data
 *
 * @param {object} actionObj - The action data object
 */
function buildLogStatement(actionObj) {
    let statement = ''
    const actionSplit = actionObj.Action.split(':')
    const amount = actionObj.Amount

    switch (actionSplit[0]) {
        case 'Ante':
            statement = `anted $${amount}`
            break
        case 'Bet':
            statement = `bet $${amount}`
            break
        case 'raised by':
            statement = `raised the bet by ${actionSplit[1].split('-')[0]} to $${amount}`
            break
        // This ones not working..or is it?
        /* case /^called/.test(actionSplit[0]):
              statement = `called the bet of ${amount}`;
              break; */
        case 'take':
            statement = `took $${amount}`
            break
        case 'discarded':
            statement = `discarded ${'# coming soon'} cards`
            break
        case 'fold':
            statement = 'folded'
            break
        default:
            statement = actionObj.Action
            break
    }

    return statement
}

/**
 * Get ActivePlayer by Sno.
 * @param
 * no: Sno tht you want to find
*/
function GetActivePlayerBySno(no) {
    return FilterActivePlayer(x => x.Sno === no)[0]
}

/**
 * Get Current round's Dealer
*/
function GetDealer()
{
    return FilterActivePlayer(x => x.IsDealer === 'Y')[0];
}

/**
 * Get Unfolded ActivePlayers that joined after Sno
 * @param
 * Sno: Get Players joined after this param(default -1)
*/
function GetUnfoldedActivePlayersAfterSno(Sno = -1) {
    return FilterActivePlayer(x => x.Sno > Sno && x.IsFolded === 'N')
}

/**
 * Get ActivePlayer by condition function.
 * @param
 * {function} condition: function to filter.
*/
function FilterActivePlayer(condition) {
    return GameHash.ActivePlayers.filter(condition);
}

/**
 * Get ContinuityPlayer by condition function.
 * @param
 * {function} condition: function to filter.
*/
function FilterContinuityPlayer(condition) {
    return GameHash.ContinuityPlayers.filter(condition);
}

/**
 * Add Step and Set LastAction
 * @param 
 * Sno: player no
 * action: player action
*/
function AddStepAndSetLastActionPerformed(Sno, action = {}) {
    //set init value
    action.PlayerId = GetActivePlayerBySno(Sno).PlayerId;
    action.PlayerSno = Sno;

    //Add step
    GameHash.Steps.push({
        RoundId: GameHash.Round,
        Step: action
    })

    //Set last action
    SetLastActionPerformed(Sno, action)
}

/**
 * Decrease Player Amount and Increase Total Potsize
*/
function AddAmountToPot(player, amount) {
    player.PlayerAmount -= parseFloat(amount)
    GameHash.PotSize += parseFloat(amount)
}

/**
 * Get Notification Message from actionMsg and amount
 * @param {string} actionMsg - actionMsg of player
 * @param {float} amount - amount of player's action
*/
function GetNotificationMsg(actionMsg, amount = -1) {
    return actionMsg + ' - by ' + GetUserNameFromLocalStorage() + amount === -1 ? '' : (' Amount : ' + amount);
}

/**
 * Get Selected Cards of specific player
 * @param {integer} Sno - player Sno
*/
function GetSelectedCardsBySno(Sno) {
    return $('.Player[data-sno="' + Sno + '"]').find('.PlayerCard.Selected')
}

/**
 * Set PlyaerCards Presentation
 * @param {PlayerCards} playerCards - cards to set presentation
 * @param {string} presentation - presentation @default 'private'
*/
function SetPlayerCardsPresentation(playerCards, presentation = 'private')
{
    $.each(playerCards, function (i, obj) {
        obj.Presentation = presentation
    })
}

/**
 * Initialize GameHash
 * @param {string} playerId - playerid of the game creater.
 * @param {string} connectionId - signalr connectionId of the game creater.
 * @param {string} playerUniqueId - playerUniqueId generated from server. 
*/
function initializeGameHash(playerId, connectionId, playerUniqueId)
{
    GameHash.Steps = []
    GameHash.CommunityCards = []
    GameHash.ActivePlayers = []
    GameHash.ContinuityPlayers = []
    GameHash.DiscardedCards = []
    GameHash.GameId = GameCode
    GameHash.ActivePlayers.push({
        PlayerId: playerId,
        PlayerName: 'P1',
        PlayerCards: [],
        PlayerAmount: 0, // taken - bet = amount
        ConnectionId: connectionId,
        Sno: 1,
        IsDealer: 'Y',
        IsCurrent: 'N',
        IsFolded: 'N',
        CurrentRoundStatus: 0,
        PlayerUniqueId: playerUniqueId
    })
    Sno = 1
}

/*
     ------------------ END common function definition ------------------
*/

/*
     ------------------ BEGIN Game controlling function definition ------------------
*/

/*
 * Create New Game
*/
function CreateGame() {
    try {
        /*
            initialize Gamehash
        */
        const userId = GetUserId()
        const generatedPlayerId = GeneratePlayerId($('#UserName').val(), userId)
        initializeGameHash(generatedPlayerId, connection.connectionId, userId)

        /*
        * model for GameHashTemp table
        **/
        model = {
            UserId: generatedPlayerId,
            GameCode,
            GameHash: JSON.stringify(GameHash),
            ConnectionId: connection.connectionId,
            PlayerUniqueId: userId,
            GamePlayerHash: JSON.stringify(GameHash.ActivePlayers)
        }

        $.ajax({
            url: 'api/GameV2/_CreateGame',
            type: 'POST',
            contentType: 'application/json;',
            data: JSON.stringify(model),
            async: false,
            success: function () {
                console.log("url: 'api/GameV2/_CreateGame',---------success")
            }
        }).done(function (result) {
            StartGame(result)
        })
    } catch (err) {
        GameLogging(err, 2)
    }
}

/*
 * Start New Game
*/
function StartGame() {
    try {
        // set local storage LastGameCode and UserId property
        setLocalStorage(GameCode, GeneratePlayerId($('#UserName').val(), GetUserId()))

        GameHash.IsRoundSettlement = 'Y'

        // Update GameHash fectch from server
        UpdateGameHash(GameHash.GameId)

    } catch (err) {
        GameLogging(err, 2)
    }
}

/*
 * Join Game By GameCode
 * param
 * UserName: name you inputed on the join form's "Guest Name" field.
 * ConnectionId: SignalR connectionId of Current User(get from cookie)
 * GameCode: gamecode that you want to join
*/
function JoinGame(UserName, ConnectionId, GameCode) {

    const userId = GetUserId()
    const generatedPlayerId = GeneratePlayerId(UserName, userId)

    // set localstroage's LastGameCode property
    localStorage.setItem('LastGameCode', GameCode)

    // Get GameHash by GameCode and Update global current GameHash
    _GetUpdatedGameHash(GameCode)

    $('.spinner').show()

    model = {
        UserId: generatedPlayerId,
        GameCode,
        GameHash: JSON.stringify(GameHash),
        ConnectionId: connection.connectionId,
        PlayerUniqueId: userId,
        GamePlayerHash: JSON.stringify(GameHash.ActivePlayers)
    }

    $.ajax({
        url: 'api/GameV2/_JoinGame',
        type: 'POST',
        async: false,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function () {
            console.log("url: 'api/GameV2/_JoinGame',---------success")
        }
    }).done(function (result) {
        // result will be GameHash of your GamdeCode which is active
        $('.spinner').hide()

        const dealer = GetDealer()
        const currentPlayer = GetActivePlayerBySno(Sno)
        const ExistingPlayer = FilterActivePlayer(x => x.PlayerUniqueId === userId)[0];

        // if GameHash of gamecode you want is not there
        if (result === undefined || result === null) {
            clearLocalStorage()
            alert('Game over or no game found with Current Joining Code')
        }

        // if result is 101, then House is full so nobody can't connect there anymore.
        /* else if (result === "101") {
                clearLocalStorage();
                alert('House full. Please try later or contact the Dealer');
            } */
        else {
            // Display MainGameBoard
            $('#HomeScreen').hide()
            $('#GameBoard').show()

            // localstorage
            setLocalStorage(GameCode, generatedPlayerId)

            GameHash = JSON.parse(result.GameHash)
            GameHash.GameId = GameCode

            /*
                When there are less than 5 ActivePlayers and you didn't already joined there.
                Add you to the ActivePlayerList and Update.
            */
            if (GameHash.ActivePlayers.length < 6 && ExistingPlayer === undefined) {
                // Set Sno as next index
                Sno = GameHash.ActivePlayers.length + 1

                // IsCurrent1: if you are next to Dealer, set IsCurrent1 as true
                let IsCurrent1 = 'N'
                

                // if player is second pos, set IsCurrent1 as true
                if (dealer !== undefined && Sno === dealer.Sno + 1)
                    IsCurrent1 = 'Y'

                // Add Current User to the ActivePlayersLsit
                GameHash.ActivePlayers.push({
                    PlayerId: model.UserId,
                    PlayerName: 'P4',
                    PlayerCards: [],
                    PlayerAmount: 0,
                    ConnectionId: connection.connectionId,
                    Sno,
                    IsDealer: 'N',
                    IsCurrent: IsCurrent1,
                    IsFolded: 'N',
                    CurrentRoundStatus: 0,
                    PlayerUniqueId: userId

                })

                if (GameHash.IsRoundSettlement === 'N') {
                    currentPlayer.IsFolded = 'Y'
                    GameHash.ContinuityPlayers.push(currentPlayer)
                }

                // Update GameHash in the GameHashTable in database and UpdateView also.
                UpdateGameHash(GameHash.GameId)
            }

            // When there are less than 5 ActivePlayers and you already joined and not foled there and also you added to the ContinuityPlayer list
            else if (GameHash.ActivePlayers.length < 6 && FilterActivePlayer(x => x.PlayerUniqueId === userId && x.IsFolded === 'N').length === 1 && FilterContinuityPlayer(x => x.PlayerUniqueId === userId).length === 1) {

                Sno = ExistingPlayer.Sno
                /*
                    change GameHash ActivePlayers and ContinuityPlayers.
                    1. Change ConnectionId of current player in GameHash.
                    2. Remove current player from ContinuityPlayers
                */
                ExistingPlayer.ConnectionId = connection.connectionId
                GameHash.ContinuityPlayers = FilterContinuityPlayer(x => x.PlayerUniqueId !== userId)

                // Update GameHash by gamecode
                UpdateGameHash(GameHash.GameId)
            }

            // When you already joined there but foleded
            else if (FilterActivePlayer(x => x.PlayerUniqueId === userId && x.IsFolded === 'Y').length === 1) {

                Sno = ExistingPlayer.Sno
                // if you didn't added to ContinuityPlayers list, add you there.
                if (FilterContinuityPlayer(x => x.PlayerUniqueId === userId).length === 0)
                    GameHash.ContinuityPlayers.push(ExistingPlayer)

                UpdateGameHash(GameHash.GameId)
            }

            
            UpdateView()
        }

        // If there's no Dealer, set CurrentPlayer as Dealer
        if (dealer === undefined) {
            currentPlayer.IsDealer = 'Y'
            UpdateGameHash(GameHash.GameId)
        }
    })
    $('#ResumeGameModal').modal('hide')
}

/*
 * When you click Deal type
*/
// eslint-disable-next-line no-unused-vars
function Deal(obj) {
    try {
        // shuffle current deck.
        GameHash.Deck = shuffleDeck(GameHash.Deck)

        // Get Number of card to pass
        const NumOfCard = $('#DealValue').val()

        // By default, Deck has only 50. so NumOfCard shoule be less than 50.
        if (GameHash.Deck.length < NumOfCard) {
            alert('Deck only contains ' + GameHash.Deck.length)
            return
        }

        if (NumOfCard === '' || NumOfCard === 0) {
            alert('Cannot deal zero or less cards')
            return
        }

        if ($('input[name="CardDealType"]:checked').val() === undefined) {
            alert('Select deal type')
            return
        }

        // select which you clicked.
        const PlayerId = $(obj).data('value')

        // Deal Type is "All"
        if (PlayerId === -1) {
            NumberOfPlayer = GameHash.ActivePlayers.length
            for (let i = 0; i < NumOfCard; i++) {
                for (let j = 0; j < NumberOfPlayer; j++) {
                    const currentPlayerNo = j + 1

                    // If j + 1 player is not foleded
                    if (GetActivePlayerBySno(currentPlayerNo).IsFolded === 'N') {
                        addPlayerCardAndUpdateGameHashDeck(currentPlayerNo)
                    }
                }
            }

            initializeDealTypeAndValue()
            UpdateGameHash(GameHash.GameId)
        }

        /*
                Deal Type is specific player
                Check if that specific player is not folded.
            */
        else if (PlayerId > 0 && FilterActivePlayer(x => x.IsFolded === 'N' && x.Sno === PlayerId).length === 1) {
            for (let i = 0; i < NumOfCard; i++) {
                addPlayerCardAndUpdateGameHashDeck(PlayerId)
            }

            initializeDealTypeAndValue()
            UpdateGameHash(GameHash.GameId)
        }

        /*
             *  Deal Type is "Community"
            */
        else if (PlayerId === 'X') {
            // initialize community
            $('.PassCommunity').html('')

            // Add Community list to select which community you want to add card.
            let count1 = 0
            while (count1 < GameHash.NumberOfCommunities) {
                $('.PassCommunity').append('<button class="btn-sm btn-primary" onclick="PassCardToCommunity(' + (count1 + 1) + '); ">' + (count1 + 1) + '</button>')
                count1++
            }

            // Show "Choose Community Modal" show.
            $('#ChooseCommunityModal').find('.modal-header').html('Choose Community')
            $('#ChooseCommunityModal').find('.modal-body').html($('.PassCommunity').html())
            $('#ChooseCommunityModal').show('modal')
        }
    } catch (err) {
        GameLogging(err, 2)
    }
}

/*
 * When you click communit number on "Choose Community" modal.
 * param:
 * num: community number you clicked(upto 5).
*/
// eslint-disable-next-line no-unused-vars
function PassCardToCommunity(num) {
    if (num === -2) {
        $('#ChooseCommunityModal').find('modal-body').html('')
        $('#ChooseCommunityModal').hide('modal')
        CardSelectedValue = ''
    } else {
        const communityposition = (num === -1 ? GameHash.NumberOfCommunities : (num - 1))

        let cnt = 0
        while (cnt < $('#DealValue').val()) {
            const rand1 = getRandomInt(0, GameHash.Deck.length - 1)

            GameHash.CommunityCards.push({
                Value: GameHash.Deck[rand1],
                Presentation: 'public',
                CommunityIndex: communityposition
            })

            RemoveCardInGameHashDeck(rand1)

            cnt++
        }

        if (num === -1) { GameHash.NumberOfCommunities += 1 }

        UpdateGameHash(GameHash.GameId)

        $('#ChooseCommunityModal').find('modal-body').html('')
        $('#ChooseCommunityModal').hide('modal')
    }
}

/*
 * Add SitOut PlayerAction in database.
*/
function PlayerActionSitOut() {
    // model from server
    const model = { PlayerUniqueId: localStorage.getItem('UserId'), GameCode: localStorage.getItem('LastGameCode'), ActionCode: 'SitOut', GameHash: JSON.stringify(GameHash), ConnectionId: connection.ConnectionId }

    // send ajax report to save model in database.
    $.ajax({
        url: 'api/GameV2/_PlayerAction',
        type: 'POST',
        async: false,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function () {
            console.log("url: 'api/GameV2/_PlayerAction',---------success")
        }
    }).done(function (result) {
        return result
    })
}

/*
 * Add Rejoin PlayerAction in database.
*/
function PlayerActionRejoin() {
    // model for server
    const model = { PlayerUniqueId: localStorage.getItem('UserId'), GameCode: localStorage.getItem('LastGameCode'), ActionCode: 'Rejoin', GameHash: JSON.stringify(GameHash), ConnectionId: connection.ConnectionId }

    // send ajax report to save model in database
    $.ajax({
        url: 'api/GameV2/_PlayerAction',
        type: 'POST',
        async: false,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function () {
            console.log("url: 'api/GameV2/_PlayerAction',---------success")
        }
    }).done(function (result) {
        return result
    })
}

/**
 * Set logs of PlayerAction in server.
*/
// eslint-disable-next-line no-unused-vars
function PlayerActionLog(actionId) {
    const model = { PlayerUniqueId: localStorage.getItem('UserId'), GameCode: localStorage.getItem('LastGameCode'), ActionCode: actionId, GameHash: JSON.stringify(GameHash), ConnectionId: connection.ConnectionId }

    $.ajax({
        url: 'api/GameV2/_PlayerAction',
        type: 'POST',
        async: false,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function () {
            console.log("url: 'api/GameV2/_PlayerAction',---------success")
        }

    })
        .done(function (result) {
            return result
        })
}

/**
 *  Get Current Player List from server.
*/
function GetCurrentGamePlayerList() {
    const model = { PlayerUniqueId: localStorage.getItem('UserId'), GameCode: localStorage.getItem('LastGameCode'), ActionCode: 'GetPlayerList' }
    let resp
    $.ajax({
        url: 'api/GameV2/_GetGamePlayers',
        type: 'POST',
        async: false,
        contentType: 'application/json;',
        data: JSON.stringify(model),
        success: function () {
            console.log("url: api/GameV2/_GetGamePlayers',---------success")
        }
    })
        .done(function (result) {
            resp = result
        })

    return resp
}

/**
 * This function does bet action.
 * 1. Update CurrentBet to hieghest bet of current players.
 * 2. Update Dealer
 * 3. Update Current
*/
function OnPlayerAction() {
    try {
        GameLogging(GameHash, 1)

        // Get HighestBet of current players
        const HighestBet = GameHash.ActivePlayers.sort(function (a, b) {
            return b.CurrentRoundStatus - a.CurrentRoundStatus
        })[0].CurrentRoundStatus

        // Set CurrentBet as HighestBet
        GameHash.IsRoundSettlement = 'N'
        GameHash.CurrentBet = HighestBet

        // Get round dealer Sno
        const dealer = GetDealer()

        GameHash.PrevSno = Sno

        // If there is no player that joined after current round dealer and not folded
        if (FilterActivePlayer(y => y.IsFolded === 'N' && y.Sno > Sno).length === 0) {
            SetFirstUnfoldedPlayerAsCurrent()
            GameHash.BetStatus = GetBetStatus(GetFirstUnfoldedPlayerAfterSno().Sno)
        }

        // If there are somebody that joined after current round dealer and folded.
        else {
            SetFirstUnfoldedPlayerAsCurrent(Sno)
            GameHash.BetStatus = GetBetStatus(GetFirstUnfoldedPlayerAfterSno(Sno).Sno)
        }

        // change dealer and end hand

        // If current player is dealer, change dealer
        if (Sno === dealer.Sno) {
            // If current round dealer folded
            if (FilterActivePlayer(y => y.IsFolded === 'N' && y.Sno === dealer.Sno).length === 0) {

                $.each(GameHash.ActivePlayers, function (i, obj) {
                    obj.IsCurrent = 'N'
                    obj.IsDealer = 'N'
                })

                // If there is no body who joined after dealer and folded
                if (Filter(y => y.IsFolded === 'N' && y.Sno > dealer.Sno).length === 0) {

                    const firstUnfoldedPlayer = GetFirstUnfoldedPlayerAfterSno(-1)

                    // change dealer and current
                    SetFirstUnfoldedPlayerAsDealer(-1)
                    SetFirstUnfoldedPlayerAsCurrent(firstUnfoldedPlayer.Sno)

                    // Update betstatus
                    GameHash.BetStatus = GetBetStatus(firstUnfoldedPlayer.Sno)
                } else {
                    const fisrtUnfoldedPlayerAfterDealer = GetFirstUnfoldedPlayerAfterSno(dealer.Sno)
                    let SnoTemp = fisrtUnfoldedPlayerAfterDealer.Sno

                    SetFirstUnfoldedPlayerAsDealer(dealer.Sno)

                    if (FilterActivePlayer(y => y.IsFolded === 'N' && y.Sno > fisrtUnfoldedPlayerAfterDealer.Sno).length > 0) {
                        SnoTemp = GetFirstUnfoldedPlayerAfterSno(SnoTemp).Sno
                    } else {
                        SnoTemp = GetFirstUnfoldedPlayerAfterSno(-1).Sno
                    }

                    GetActivePlayerBySno(SnoTemp).IsCurrent = 'Y'
                    GameHash.BetStatus = GetBetStatus(SnoTemp)
                }
            }
        }

        if (GetUnfoldedActivePlayersAfterSno().length === FilterActivePlayer(x => x.IsFolded === 'N' && x.CurrentRoundStatus === GameHash.CurrentBet).length) {
            GameHash.Round = GameHash.Round + 1

            SendNotification(GameCode, '', 'Round Settled')

            GameHash.CurrentBet = 0

            $.each(GameHash.ActivePlayers, function (i, obj) {
                obj.CurrentRoundStatus = 0
            })
        }

        UpdateGameHash(GameHash.GameId)
    } catch (err) {
        GameLogging(err, 2)
    }
}

/*
 * Pass Card
 * @param
 * obj: jquery object of tooltip inner button
*/
// eslint-disable-next-line no-unused-vars
function PassCard(obj) {
    // tooltip hide
    $("[data-toggle='tooltip']").tooltip('hide')

    // Get PlayerSno from data-playersno attribute
    const PlayerSno = $(obj).data('playersno')

    // Get selectedCard
    const $selectedCard = GetSelectedCardsBySno(Sno)
    const currentPlayer = GetActivePlayerBySno(Sno)

    // If none slected
    if (PlayerSno === -1) {
        $selectedCard.removeClass('Selected')
        CardSelectedValue = ''
        $('.CardActions').hide()
        return
    }

    // If you select one of Community
    else if (PlayerSno === 'X') {
        // Get CommunityIndex from data-communityindex attr.
        const communityindex = $(obj).data('communityindex')

        for (let count = 0; count < $selectedCard.length; count++) {
            const cardvalue = $($selectedCard[count]).data('cardvalue')

            // push selected cards to CommunityCards
            const x1temp = currentPlayer.PlayerCards.filter(y => y.Value === cardvalue)[0]
            x1temp.Presentation = 'public'

            GameHash.CommunityCards.push(x1temp)
            GameHash.CommunityCards.filter(x => x.Value === cardvalue)[0].CommunityIndex = communityindex

            // remove selected cards from playercards
            RemoveCardFromPlayer(Sno, cardvalue)
        }

        // when you insert to the last index, increase NumberOfCommunities.
        if (communityindex === GameHash.NumberOfCommunities) { GameHash.NumberOfCommunities += 1 }

        SendNotification(GameCode, '', GetUserNameFromLocalStorage() + ' moved card to community')
    }

    // If you select specific player
    else {
        $.each(FilterActivePlayer(x => x.Sno === Sno), function () {
            for (let count = 0; count < $selectedCard.length; count++) {
                passCardToPlayer(Sno, PlayerSno, $($selectedCard[count]).data('cardvalue'))
            }
        })
    }

    // cancel selection
    CardSelectedValue = ''
    $('div#pop-up').hide()
    $selectedCard.removeClass('Selected')

    // Update GameHash and send notification
    UpdateGameHash(GameHash.GameId)
}

/**
 * PassCard by drag and drop.
*/
// eslint-disable-next-line no-unused-vars
function PassCardToPlayerByDrop(_ToPassPlayerSno, _CardValue) {
    // tooltip modal hide
    $("[data-toggle='tooltip']").tooltip('hide')

    passCardToPlayer(Sno, _ToPassPlayerSno, _CardValue)
}

/**
 * PassCard to community by drag and drop
*/
// eslint-disable-next-line no-unused-vars
function PassCardToCommunityDrop(_Community, _CardValue) {
    $("[data-toggle='tooltip']").tooltip('hide')

    GameHash.CommunityCards.push({ CommunityIndex: _Community, Value: _CardValue, Presentation: 'public' })
    RemoveCardFromPlayer(Sno, _CardValue)
}

/**
 * Show CommunityCard of CardValue
*/
// eslint-disable-next-line no-unused-vars
function ShowCommunityCard(CardValue) {
    // show all cardvalue to public
    if (CardValue === -1) {
        SetPlayerCardsPresentation(GameHash.CommunityCards, 'public')
    }

    // show specific cardvalue to public
    else {
        SetPlayerCardsPresentation(GameHash.CommunityCards.filter(x => x.CommunityIndex === CardValue), 'public')
    }
    UpdateGameHash(GameHash.GameId)
}

/**
 * Distribute Pot to winers.
*/
// eslint-disable-next-line no-unused-vars
function DistributePot() {
    try {
        //let GameHashTemp = {}
        //GameHashTemp = JSON.stringify(GameHash)
        //GameHashTemp = JSON.parse(GameHashTemp)

        // Get Winners
        const Winners = FilterActivePlayer(x => x.PlayerAmount > 0).sort(function (a, b) {
            return b.PlayerAmount - a.PlayerAmount
        })

        // for every winner, set their balance as PlayerAmount.
        $.each(Winners, function (i, obj) {
            obj.Balance = obj.PlayerAmount
        })

        // Get Loosers.
        const Loosers = FilterActivePlayer(x => x.PlayerAmount < 0).sort(function (a, b) {
            return a.PlayerAmount - b.PlayerAmount
        })

        // Transaction Template Message
        const TransactionMessageTemplate = '[Looser] owes $[Amount] to [Winner]'
        const TransactionList = []
        PlayerNetStatus = []

        for (let i = 0; i < Loosers.length; i++) {
            while (Loosers[i].PlayerAmount < 0) {
                for (let j = 0; j < Winners.length; j++) {
                    if (Winners[j].Balance > 0) {
                        // If Winnner's Amount is bigger than Looser
                        if (Winners[j].PlayerAmount >= Math.abs(Loosers[i].PlayerAmount)) {
                            // Add Transaction string based on Transaction Template Message
                            TransactionList.push(TransactionMessageTemplate.replace('[Looser]', GetUserNameFromPlayerId(Loosers[i].PlayerId))
                                .replace('[Amount]', Math.abs(Loosers[i].PlayerAmount))
                                .replace('[Winner]', GetUserNameFromPlayerId(Winners[j].PlayerId)))

                            /*
                                  Add PlayerNetStatus
                                  1. Looser and it's playerAmount
                                  2. Winnner and it's absolute playerAmount
                              */
                            PlayerNetStatus.push({
                                PlayerId: Loosers[i].PlayerId,
                                Amount: (Loosers[i].PlayerAmount)
                            })

                            PlayerNetStatus.push({
                                PlayerId: Winners[j].PlayerId,
                                Amount: Math.abs(Loosers[i].PlayerAmount)
                            })

                            // Set Balance as difference between them.
                            Winners[j].Balance = parseFloat(Winners[j].Balance) - Math.abs(parseFloat(Loosers[i].PlayerAmount))
                            Loosers[i].PlayerAmount = 0
                        }

                        // Otherwise
                        else {
                            TransactionList.push(TransactionMessageTemplate.replace('[Looser]', GetUserNameFromPlayerId(Loosers[i].PlayerId))
                                .replace('[Amount]', Winners[j].Balance)
                                .replace('[Winner]', GetUserNameFromPlayerId(Winners[j].PlayerId)))

                            // Add PlayerNetStatus
                            PlayerNetStatus.push({
                                PlayerId: Loosers[i].PlayerId,
                                Amount: -(Winners[j].Balance)
                            })

                            PlayerNetStatus.push({
                                PlayerId: Winners[j].PlayerId,
                                Amount: Winners[j].Balance
                            })

                            Loosers[i].PlayerAmount = Loosers[j].PlayerAmount + parseFloat(Winners[j].Balance)
                            Winners[j].Balance = 0
                        }
                    }
                }
            }
        }

        // build FinalPlayerNetStatusTemp
        FinalPlayerNetStatusTemp = []

        $.each(GameHash.PlayerNetStatus, function (i, obj) {
            FinalPlayerNetStatusTemp.push(obj)
        })

        const arr1 = []
        $.each(PlayerNetStatus, function (i, obj2) {
            arr1.push({
                PlayerId: obj2.PlayerId,
                Amount: obj2.Amount
            })
        })

        FinalPlayerNetStatusTemp.push(arr1)

        // Set CurrentHandTransaction
        CurrentHandTransaction = {
            GameHand: GameHash.GameHand,
            TransactionList
        }

        return CurrentHandTransaction
    } catch (err) {
        GameLogging(err, 2)
    }
}

/**
 * When you click "Yes" on Cancel Hand confirm modal
 * intialize GameHash
*/
// eslint-disable-next-line no-unused-vars
function ModalInfoCancelHandPrompt_Yes() {
    $('#ModalInfoCancelHandPrompt').modal('hide')
    $.each(GameHash.ActivePlayers, function (i, obj) {
        // init PlayerNetStatusFinal
        if (obj.PlayerNetStatusFinal === undefined) { obj.PlayerNetStatusFinal = 0 }

        // calcualte PotSize
        if (obj.PlayerAmount < 0) {
            GameHash.PotSize = GameHash.PotSize + obj.PlayerAmount
        }

        // initialze
        obj.PlayerAmount = 0
        obj.Balance = 0
        obj.CurrentRoundStatus = 0

        obj.PlayerCards = []
    })

    // initialize
    GameHash.CommunityCards = []
    GameHash.Deck = GetNewDeck()

    // Add Cancel Hande steps.
    GameHash.Steps.push({
        RoundId: GameHash.Round,
        Step: {
            PlayerId: GetActivePlayerBySno(Sno).PlayerId,
            PlayerSno: Sno,
            Action: 'Cancelled Hand',
            Amount: 0
        }
    })

    // Update GameHash
    UpdateGameHash(GameHash.GameId)

    // Send Cancel hand notification
    SendCancelHandNotification()
}

/*
 * Settle Round
*/
function SettleRound() {
    try {
        // initialize CurrentHandTransaction if it's not set yet
        if (CurrentHandTransaction === undefined) {
            CurrentHandTransaction = {
                GameHand: GameHash.GameHand,
                TransactionList: ['========= unsettled ==========']
            }
        }

        GameHash.Transaction.push(CurrentHandTransaction)

        $.each(PlayerNetStatus, function () {
            GameHash.PlayerNetStatus.push(PlayerNetStatus)
        })

        // ammendment
        const ListForSitOutPlayer = GetCurrentGamePlayerList()

        CurrentHandTransaction = {}

        // GameHash.PotSize = 0;
        GameHash.CommunityCards = []
        $.each(GameHash.ActivePlayers, function (i, obj) {
            if (FilterContinuityPlayer(x => x.Sno === obj.Sno).length === 1) {
                const ExistingPlayer = ListForSitOutPlayer.filter(x => x.UserName === obj.PlayerId)[0];

                // only if sitout is lifted
                if (ExistingPlayer !== undefined) {
                    if (ExistingPlayer.IsSitOut === false || ExistingPlayer.IsSitOut === null) {
                        obj.IsFolded = 'N'
                        GameHash.ContinuityPlayers = FilterContinuityPlayer(x => x.Sno !== obj.Sno)
                    }
                    else
                        obj.IsFolded = 'Y'
                }
                else {
                    obj.IsFolded = 'Y'
                    GameHash.ContinuityPlayers = FilterContinuityPlayer(x => x.Sno !== obj.Sno)
                }
                obj.IsCurrent = 'N'
            }

            obj.PlayerCards = []
            obj.CurrentRoundStatus = 0
        })

        //Add Step
        GameHash.Steps.push({
            RoundId: (GameHash.Round - 1),
            Step: {
                PlayerId: GetActivePlayerBySno(Sno).PlayerId,
                PlayerSno: Sno,
                Action: ' ended hand ',
                Amount: '0 New Hand -->'
            }
        })

        GameHash.Round = 1
        GameHash.CurrentBet = 0
        GameHash.Deck = GetNewDeck()
        GameHash.NumberOfCommunities = 0
        GameHash.GameHand = GameHash.GameHand + 1

        let DealerSno = 0
        try {
            DealerSno = GetDealer().Sno
        } catch (err) {
            GameLogging(err, 2)
            $.each(GameHash.ActivePlayers, function (i, tmp1) {
                tmp1.IsDealer = 'N'
            })

            const tmplist = []
            $.each(GameHash.ContinuityPlayers, function (cnt, objtmp2) {
                tmplist.push(objtmp2.Sno)
            })

            DealerSno = FilterActivePlayer(x => tmplist.filter(y => y === x.Sno).length === 0)[0].Sno

            // for removing deal duplication
            $.each(GameHash.ActivePlayers, function (cnt1, obj2) {
                obj2.IsDealer = 'N'
            })
            FilterActivePlayer(x => tmplist.filter(y => y === x.Sno).length === 0)[0].IsDealer = 'Y'
        }

        $.each(GameHash.ActivePlayers, function (i, obj) {
            obj.IsCurrent = 'N'

        })

        let SnoTemp = DealerSno
        if (GameHash.ActivePlayers.sort(function (a, b) {
            return a.Sno - b.Sno
        }).filter(y => y.IsFolded === 'N').length === 0) {
            if (GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.Sno > SnoTemp).length > 0) {
                GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.Sno > SnoTemp)[0].IsCurrent = 'Y'
            } else {
                GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.Sno < SnoTemp)[0].IsCurrent = 'Y'
            }
        } else if (GameHash.ActivePlayers.sort(function (a, b) {
            return a.Sno - b.Sno
        }).filter(y => y.IsFolded === 'N' && y.Sno > DealerSno).length === 0) {
            SnoTemp = (GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded === 'N')[0]).Sno; // for current
            (FilterActivePlayer(x => x.Sno === SnoTemp)[0]).IsCurrent = 'Y'
        } else {
            if (GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.IsFolded === 'N' && y.Sno > SnoTemp).length > 0) {
                SnoTemp = GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.IsFolded === 'N' && y.Sno > SnoTemp)[0].Sno
            } // for current
            else {
                SnoTemp = GameHash.ActivePlayers.sort(function (a, b) {
                    return a.Sno - b.Sno
                }).filter(y => y.IsFolded === 'N')[0].Sno
            } // for current

            GameHash.ActivePlayers.sort(function (a, b) {
                return a.Sno - b.Sno
            }).filter(y => y.Sno === SnoTemp)[0].IsCurrent = 'Y'
        }

        let SummaryHand = ''
        if (GameHash.Transaction.length > 0) {
            $.each(GameHash.Transaction, function (i, obj) {
                SummaryHand += i + '. ' + obj
            })
        }

        $('#SettlementModal').modal('hide')

        GameHash.Steps.push({
            RoundId: (GameHash.Round - 1),
            Step: {
                PlayerId: FilterActivePlayer(x => x.Sno === Sno)[0].PlayerId,
                PlayerSno: Sno,
                Action: ' ended hand ',
                Amount: '0 ||Summary: ' +
                    SummaryHand + '||  New Hand -->'
            }
        })

        GameHash.BetStatus = 'The bet is 0 to ' + (FilterActivePlayer(x => x.IsCurrent === 'Y')[0]).PlayerId.split('pk2')[0]

        if (FilterActivePlayer(x => x.IsDealer === 'Y')[0].Sno === Sno) {
            GameHash.IsRoundSettlement = 'Y'
            UpdateGameHash(GameHash.GameId)

            SendNotification(GameHash.GameId, '', 'Hand eneded by' + GetUserNameFromLocalStorage())
        }
    } catch (err) {
        GameLogging(err, 2)
    }
}

/**
 * Prints a log of ante-ing, betting, raising, folding, discarding, taking money, and ending hands
 *
 * Prints that information round by round, hand by hand
 *
 * Prints that information into the sidebar (.CustomSideBar) in the DOM
 */
function ShowLogging() {
    // Reference to the left sidebar element where we will insert messages
    const $logElement = $('.CustomSideBar')

    // Clear HTML content from both logging locations
    $logElement.html('')

    // Declare local variables
    let tempRound = ''
    let prevMessage = ''
    let spanClass = ''
    let html = ''
    let htmlRound = ''

    // For each step in the Game Hash's Steps object...
    $.each(GameHash.Steps, function (i, obj) {
        // If the current step object's RoundId DOES NOT equal 0...
        if (obj.RoundId !== '0') {
            // Used in the else block down below for further iterations of this $.each loop (should be removed once this doesn't rewrite the log's entirety)
            prevMessage = obj.Step.Action

            // Assign an even/odd class to be used for an alternating color pattern based on RoundId
            spanClass = obj.RoundId % 2 === 0 ? 'even' : 'odd'

            // Clear local variables for html strings
            htmlRound = ''
            html = ''

            // If tempRound's value does not equal the current step object's RoundId...
            // This block looks like it will only ever be entered onced per round/RoundId
            if (tempRound !== obj.RoundId) {
                // Create an HTML string with the round number and set tempRound's value to match the current RoundId
                htmlRound = `<span class='${spanClass}'>Round: ${obj.RoundId}</span>`
                tempRound = obj.RoundId
            }

            // TEMP - PLEASE REMOVE WHEN FINISHED
            console.log(obj)

            // Invoke helper function to build a log statement with a player action
            const actionText = buildLogStatement(obj.Step)

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
                </span>`

            // Insert HTML string into log sidebar
            $('.CustomSideBar').append(html)
        }

        // Else (the current step object's RoundId DOES equal 0)...
        else {
            // Add 'Ended Hand' to the log
            if (prevMessage !== ' ended hand ') {
                $('.logging').append(' ended hand ')
                $('.CustomSideBar').append(' ended hand ')
            }
            prevMessage = ' ended hand '
        }
    })
}

/**
 *  Settle Hand
*/
function ShowHandSettleHand() {
    try {
        // If PotSize is more than 0, show MyModalEndHand modal
        if (GameHash.PotSize > 0) {
            $('#MyModalEndHand').modal('show')
        }

        // Otherwise
        else if (GameHash.PotSize === 0) {
            GameHash.CurrentBet = 0
            let SumOfEachPlayer = 0.0
            $('.SettleUp-tbody').html('')

            // Sum all player's PlayerAmount
            $.each(GameHash.ActivePlayers, function (i, obj) {
                SumOfEachPlayer = SumOfEachPlayer + obj.PlayerAmount
            })

            // Append transaction
            $.each(GameHash.Transaction, function (i, obj) {
                const tmp1 = obj
                if (tmp1.TransactionList !== undefined) {
                    if (tmp1.TransactionList.length > 0) {
                        let htm1 = "<div class='row'>"

                        htm1 += "<div class='col-md-12'><span>Hand # " + (i + 1) + '*</span></div>'

                        const tmp1 = obj
                        for (let j = 0; j < tmp1.TransactionList.length; j++) {
                            htm1 += "<div class='col-md-2'>" + (j + 1) + ". </div><div class='col-md-10'>" + tmp1.TransactionList[j] + '</div>'
                        }

                        htm1 += '</div>'
                        $('.SettleUp-tbody').append(htm1)
                    }
                }
            })

            const tmp1 = CurrentHandTransaction
            if (tmp1.TransactionList !== undefined) {
                if (tmp1.TransactionList.length > 0) {
                    let htm2 = "<div class='row'>"

                    htm2 += "<div class='col-md-12'><span>Hand # " + GameHash.GameHand + '*</span></div>'

                    for (let j = 0; j < tmp1.TransactionList.length; j++) {
                        htm2 += "<div class='col-md-2'>" + (j + 1) + ". </div><div class='col-md-10'>" + tmp1.TransactionList[j] + '</div>'
                    }

                    htm2 += '</div>'
                    $('.SettleUp-tbody').append(htm2)
                }
            }
        }
    } catch (err) {
        GameLogging(err, 2)
    }
}

// error report
// eslint-disable-next-line no-unused-vars
function SendErrorReport() {

}

/*
 * Calculate Balance of every active players and add transaction.
 * Decide who is looser and who is winner.
*/
function CalculateEndHand(val1) {
    // temporary GameHash
    let tmpGameHash = JSON.stringify(val1)
    tmpGameHash = JSON.parse(tmpGameHash)

    // set each players PlayerNetStatusFinal property.
    $.each(tmpGameHash.ActivePlayers, function (i, obj) {
        // if PlayerNetStatusFinal not set, set it to 0
        if (obj.PlayerNetStatusFinal === undefined || obj.PlayerNetStatusFinal === null) { obj.PlayerNetStatusFinal = 0 }

        // Set PlayerNetStatusFinal += PlayerAmount
        obj.PlayerNetStatusFinal = obj.PlayerNetStatusFinal + obj.PlayerAmount

        // Set Balance as PlayerNetStatusFinal
        if (obj.Balance === undefined || obj.Balance === null) { obj.Balance = 0 }
        obj.Balance = obj.PlayerNetStatusFinal
    })

    const resp = {}
    // Transaction list
    const ArrTransaction = [] // {from:'p1',to:'p2',amount:10};

    // only when potsize = 0
    if (tmpGameHash.PotSize === 0) {
        /*
            * Get Winners sort by Balance(PlayerNetStatusFinal).
            * Winners are players with positive balance.
        */
        const Winners = tmpGameHash.ActivePlayers.filter(x => x.PlayerNetStatusFinal > 0).sort(function (a, b) {
            return b.PlayerNetStatusFinal - a.PlayerNetStatusFinal
        })

        /*
             * Get Loosers sort by Blanace(PlayerNetStatusFinal).
             * Loosers are players with negative balance.
            */
        const Loosers = tmpGameHash.ActivePlayers.filter(x => x.PlayerNetStatusFinal < 0).sort(function (a, b) {
            return a.PlayerNetStatusFinal - b.PlayerNetStatusFinal
        })

        $.each(Loosers, function (i, obj1) {
            if (obj1.Balance < 0) {
                for (let k = 0; k < Winners.length; k++) {
                    // if both looser and winner balance is not 0, Add transaction
                    if (obj1.Balance !== 0 && Winners[k].Balance !== 0) {
                        /*
                            * if Winner's balance is the same as looser's balance, set both of their balance as 0 and add transaction
                        */
                        if (obj1.Balance * (-1) === Winners[k].Balance) {
                            ArrTransaction.push({ from: obj1.PlayerId, to: Winners[k].PlayerId, amount: Winners[k].Balance })
                            obj1.Balance = 0
                            Winners[k].Balance = 0
                        }

                        /*
                            * if loosers's negative balance is bigger than winner's positive balance, set looser's balance as looser.Balance + Winner.Balance
                        */
                        else if (obj1.Balance * (-1) > Winners[k].Balance) {
                            ArrTransaction.push({ from: obj1.PlayerId, to: Winners[k].PlayerId, amount: Winners[k].Balance })
                            obj1.Balance = obj1.Balance + Winners[k].Balance
                            Winners[k].Balance = 0
                        }

                        /*
                            * if looser's negative balance is less than winner's positive balance, set winner's balance as looser.Balance + Winner.Balance
                        */
                        else if (obj1.Balance * (-1) < Winners[k].Balance) {
                            ArrTransaction.push({ from: obj1.PlayerId, to: Winners[k].PlayerId, amount: (obj1.Balance * (-1)) })
                            Winners[k].Balance = obj1.Balance + Winners[k].Balance
                            obj1.Balance = 0
                        }
                    }
                }
            }
        })
    }

    resp.GameHashTemp = tmpGameHash
    resp.ArrTransaction = ArrTransaction

    return resp
}

/*
 * Set GameHash and GameHashOriginal variable.
 * Get GameHash from GameHashTemp table.
 * @param
 * gameid: gameid to fetch GameHash(GameCode field in GameHashTemp table).
*/
function _GetUpdatedGameHash(gameid) {
    // show loading "Please Wait"
    $('.spinner').show()

    // Get GameHash by GameId from the database.
    let result
    $.ajax({
        url: 'api/GameV2/_GetGameHash',
        type: 'POST',
        contentType: 'application/json;',
        data: JSON.stringify(gameid === undefined ? GameHash.GameId : gameid),
        async: false,
        success: function (data) {
            result = data
        },
        complete: function () {
            console.log('GetUpdatedGameHash', JSON.parse(result))
            try {
                GameHashOrginal = JSON.parse(result)
                GameHash = JSON.parse(result)

                // UpdateView();

                // hide loading
                $('.spinner').hide()
            } catch (err) {
                $('.spinner').hide()
                console.log('GetUpdatedGameHashError', err)
                // ExceptionLogging(err);
            }
        }
    })
}

/**
 * Player disconnected
 *
*/
function OtherPlayerDisconnected(PlayerConnectionId, UserId) {
    console.log('PlayerConnectionId: ' + PlayerConnectionId + ' UserId: ' + UserId + ' disconnected')

    PlayerConnectionId = 'pk2' + GetConnectionIdFromPlayerId(UserId)

    const disconnectedPlayer = FilterActivePlayer(x => x.PlayerId.includes(PlayerConnectionId))[0];
    const currentPlayer = GetActivePlayerBySno(Sno)

    // if disconnected player is in ActivePlayerList
    if (disconnectedPlayer !== undefined) {


        // Remove that player from continuityPlayers.
        GameHash.ContinuityPlayers = FilterContinuityPlayer(x => x.PlayerId.includes(PlayerConnectionId) === false)

        //if disconnectedPlayer was current
        if (disconnectedPlayer.IsCurrent === 'Y') {
            $.each(GameHash.ActivePlayers, function (i, obj) { obj.IsCurrent = 'N' })

            if (FilterActivePlayer(x => x.Sno > disconnectedPlayer.Sno && x.IsFolded === 'N').length === 0) {

                SetFirstUnfoldedPlayerAsCurrent();
                GameHash.GetBetStatus = GetBetStatus(GetFirstUnfoldedPlayerAfterSno().Sno)

            }
            else {

                SetFirstUnfoldedPlayerAsCurrent(disconnectedPlayer.Sno)
                GameHash.GetBetStatus = GetBetStatus(GetFirstUnfoldedPlayerAfterSno(disconnectedPlayer.Sno).Sno)

            }
        }

        // if disconnectedPlayer was dealer
        if (disconnectedPlayer.IsDealer === 'Y') {
            if (FilterActivePlayer(x => x.Sno > disconnectedPlayer.Sno && x.IsFolded === 'N').length === 0) {
                SetFirstUnfoldedPlayerAsDealer()
            } else {
                SetFirstUnfoldedPlayerAsDealer(disconnectedPlayer.Sno)
            }
        }

        // Set current Player IsDealer = "N", IsCurrent = "N".
        disconnectedPlayer.IsDealer = 'N'
        disconnectedPlayer.IsCurrent = 'N'

        // Add to ContinuityPlayers
        GameHash.ContinuityPlayers.push(disconnectedPlayer)

        // If you are current or dealer, Update Game Hash.
        if (currentPlayer.IsCurrent === 'Y' || currentPlayer.IsDealer === 'Y')
            UpdateGameHash(GameHash.GameId)
    }
    UpdateView()
}

/*
     ------------------ END Game controlling function definition ------------------
*/

/*
     ------------------ BEGIN Cookie Related function definition ------------------
*/

/*
    Initialize Cookie
*/
function ClearCookieFunction() {
    createCookie('UserIdentity', '', 2000)
    location.reload()
}

/*
    set coookie's cookieName = cookieValue with expiration of daysToExpire
    @params
    cookieName: cookie propery name
    cookieValue: cookie propery value
    daysToExpire: cookie expiration time
*/
function createCookie(cookieName, cookieValue, daysToExpire) {
    const date = new Date()
    date.setTime(date.getTime() + (daysToExpire * 24 * 60 * 60 * 1000))
    document.cookie = cookieName + '=' + cookieValue + '; expires=' + date.toGMTString()
}

/*
    get cookieValue of cookieName
    @params
    cookieName: cookie propery name that you want to get
*/
function accessCookie(cookieName) {
    const name = cookieName + '='
    const allCookieArray = document.cookie.split(';')
    for (let i = 0; i < allCookieArray.length; i++) {
        const temp = allCookieArray[i].trim()
        if (temp.indexOf(name) === 0) { return temp.substring(name.length, temp.length) }
    }
    return ''
}

/*
 * Clear Local Storage
*/
function clearLocalStorage() {
    localStorage.removeItem('LastGameCode')
    localStorage.removeItem('UserId')
}

/*
    Set New UserIdentity
    @params
    UniqueId: new user's unique id get from server.
*/
function setNewUserIdentityCookie(UniqueId) {
    // set New UserIdentity Cookie as UniqueId and IsIdentityRenewed flag as 2
    createCookie('UserIdentity', UniqueId, 2000)
    createCookie('IsIdentityRenewed', '2', 2000)

    // clear LocalStorage
    clearLocalStorage()
}

/*
 * Set Local Storage LastGameCode and UserId propery
 * @params
 * CurrentGameCode: LastGameCode propery value in Localstorage
 * PlayerId: UserId propery value in Localstorage
*/
function setLocalStorage(CurrentGameCode, PlayerId) {
    localStorage.setItem('LastGameCode', CurrentGameCode)
    localStorage.setItem('UserId', PlayerId)
}

/*
 * Parse UserId from LocalStorage
*/
function GetUserNameFromLocalStorage() {
    const UserId = localStorage.getItem('UserId')
    if (UserId === undefined) { return '' }

    return GetUserNameFromPlayerId(UserId)
}

/*
 * Parse ConnectionId from LocalStorage
*/
function GetConnectionIdFromLocalStorage() {
    const UserId = localStorage.getItem('UserId')
    if (UserId === undefined) { return '' }

    return GetConnectionIdFromPlayerId(UserId)
}

/*
 * Parse LastGameCode from LocalStorage
*/
function GetLastGameCode() {
    return localStorage.getItem('LastGameCode')
}

/*
     ------------------ END Cookie Related function definition ------------------
*/

/*
     ------------------ BEGIN SingalR Related function definition ------------------
*/

/*
    start SingalR connection
*/
async function start() {
    try {
        // check if you already connected to signalR
        if (connection.state === signalR.HubConnectionState.Connected) { return }

        // unless you already connected, connect now.
        await connection.start()

        // you connected successfully
        if (connection.state === signalR.HubConnectionState.Connected || connection.state === signalR.HubConnectionState.Reconnecting) {
            /*
                      set connection's event.
                  */

            connection.on('ReceiveMessage', function (message) {
                const msg = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                const encodedMsg = user + ' says ' + msg
                TempResponse = encodedMsg
                alert('Try again in few seconds..')
            })

            /**
                   *  ReceiveCancelHandNotification
                   *  ModalInfoCancelHand Modal show.
                  */
            connection.on('ReceiveCancelHandNotification', function () {
                $('#ModalInfoCancelHand').modal('show')
            })

            /*
                   * Receive End Game Summary
                  */
            connection.on('ReceiveEndGameSummary', function (gamecode) {
                try {
                    $('.EndGameForCurrent').show()

                    // Only if you are in the same Game
                    if (GameHash.GameId === gamecode) {
                        // If you 're not dealer, hide Modal
                        if (FilterActivePlayer(x => x.Sno === Sno)[0].IsDealer !== 'Y') {
                            $('.EndGameForCurrent').hide()
                            ShowSummaryV2()
                        }
                    }
                } catch (err) {
                    GameLogging(err, 2)
                }
            })

            /**
                   * Receive End Hand Summary
                  */
            connection.on('ReceiveEndHandSummary', function (gamecode) {
                try {
                    $('.EndGameForCurrent').show()
                    $('.SettleRound').show()

                    // Only if you are in the same Game
                    if (GameHash.GameId === gamecode) {
                        // If you 're not dealer, hide Modal
                        if (FilterActivePlayer(x => x.Sno === Sno)[0].IsDealer !== 'Y') {
                            $('.SettleRound').hide()
                            $('.EndGameForCurrent').hide()
                            ShowHandSettleHand()
                        }
                    }
                } catch (err) {
                    GameLogging(err, 2)
                }
            })

            /**
                   * OtherPlayer Disconnected
                   * @param
                   * PlayerConnectionId: disconnected player's connectionId.
                   * UserId: disconnnected player's UserId.
                  */
            connection.on('OtherPlayerDisconnected', function (PlayerConnectionId, UserId) {
                OtherPlayerDisconnected(PlayerConnectionId, UserId)
            })

            /**
                   * Receive new Updated Game Hash.
                  */
            connection.on('ReceiveHashV1', function () {
                try {
                    _GetUpdatedGameHash(GameHash.GameId)
                    UpdateView()
                    console.log(' ReceiveHashV1  ' + GameHash.GameId)
                } catch (err) {
                    GameLogging(err, 2)
                }
            })
        }
        console.log('SignalR Connected.')
    } catch (err) {
        console.log(err)
        setTimeout(start, 5000)
    }
}

/*
 * Build connection with UserIdentity.
 * Different from start function above.
 * It only builds connection and call start function.
*/
function startConnectionWithUserIdentity(UserIdentity) {
    const url = '/GameClass?UserIdentity=' + UserIdentity + ''
    connection = new signalR.HubConnectionBuilder().withUrl(url).build()

    // when connection close, automatically start connection again.
    connection.onclose(function () {
        start()
    })

    /* connection.onreconnected(connectionId => {
          console.log("connected with " + connectionId + " --> " + connection.state === signalR.HubConnectionState.Connected);
      }); */

    start()
}

/*
 * check if UserIdentity cookie has been set and if not set, get uniqueId from server and set it to the value of UserIdentity cookie.
 * Then start signalR connection.
*/
function ValidateUserConnection() {
    const CustomCookie = accessCookie('UserIdentity')
    // if UserIdentity has not been set yet
    if (CustomCookie === '') {
        let UniqueId

        // send ajax request to get unique identity id.
        $.ajax({
            url: 'api/GameV2/_GetUserIdentity',
            type: 'POST',
            contentType: 'application/json;',
            async: false,
            success: function (data) {
                UniqueId = data
                console.log("url: 'api/GameV2/_GetUserIdentity', ---------success", 'UserIdentityId: ' + UniqueId)
            },
            complete: function () {
                setNewUserIdentityCookie(UniqueId)
                startConnectionWithUserIdentity(UniqueId)
            }
        })
    }
    // if UserIdentity has been set
    else {
        startConnectionWithUserIdentity(CustomCookie)
    }
}

/*
     ------------------ END SingalR Related function definition ------------------
*/

$(window).on('load', function () {
    /*
          only run on Chrome browser.
      */
    if (navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1) {
        alert('Sorry, you are using Safari. Please sign in with Google Chrome')
        window.location = 'https://www.google.com/aclk?sa=l&ai=DChcSEwjf_q7Y7uLvAhVHtO0KHQG9AQEYABAAGgJkZw&sig=AOD64_2uz0f1EMIR2V4FLqk7-elfrDjgjA&q&adurl&ved=2ahUKEwi1rqjY7uLvAhXRa8AKHRQNAUUQ0Qx6BAgCEAE'
    } else if (navigator.userAgent.indexOf('Firefox') !== -1 && navigator.userAgent.indexOf('Chrome') === -1) {
        alert('Sorry, you are using Firefox. Please sign in with Google Chrome')
        window.location = 'https://www.google.com/aclk?sa=l&ai=DChcSEwjf_q7Y7uLvAhVHtO0KHQG9AQEYABAAGgJkZw&sig=AOD64_2uz0f1EMIR2V4FLqk7-elfrDjgjA&q&adurl&ved=2ahUKEwi1rqjY7uLvAhXRa8AKHRQNAUUQ0Qx6BAgCEAE'
    }

    $('a').click(function (e) { e.preventDefault(); $(this).trigger('click') })

    // if it's new client
    if (accessCookie('IsIdentityRenewed') !== '2') {
        ClearCookieFunction()
    }

    $('.CardActions').hide()
    ValidateUserConnection()

    // handle refresh or connection lost
    if (localStorage.getItem('LastGameCode') !== undefined && localStorage.getItem('LastGameCode') !== null && localStorage.getItem('UserId') !== null && localStorage.getItem('UserId') !== undefined) {
        $('#ResumeGameModal').modal('show')
        // ShowLoader();
    }
})
