//invoke "SendMessage2"
function Invoker(functionName, message) {

    connection.invoke("SendMessage2", user, message, test).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();

}

// methods for v1 enhancements 
function ReceiveNotification(gamecode, playerid, notificationmessage) {

}

//invoke "SendNotification"
function SendNotification(gamecode, playerid, notificationmessage) {
    connection.invoke("SendNotification", gamecode, playerid, notificationmessage).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
}

//Invoke SendEndGameSummary
function SendEndGameSummary(gamecode) {
    try {
        connection.invoke("SendEndGameSummary", gamecode).catch(function (err) {
            return console.error(err.toString());
        });
        event.preventDefault();
    }
    catch (err) {
        ExceptionLogging(err.stack.toString());
    }
}

//Invoke "SendEndHandSummary"
function SendEndHandSummary(gamecode) {

    try {

        connection.invoke("SendEndHandSummary", gamecode).catch(function (err) {
            return console.error(err.toString());
        });
        event.preventDefault();
    }
    catch (err) {

        ExceptionLogging(err.stack.toString());
    }

}

