
function Invoker(functionName, message) {

    connection.invoke("SendMessage2", user, message, test).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();

}



// methods for v1 enhancements 

function ReceiveNotification(gamecode, playerid, notificationmessage) {

}


function SendNotification(gamecode, playerid, notificationmessage) {
    connection.invoke("SendNotification", gamecode, playerid, notificationmessage).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
}



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

