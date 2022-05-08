console.log("Starting up...")

const exec = require("child_process").execSync;
const vdf = require('vdf');

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const REGEX = new RegExp(/AppID\s+:\s+\d+,\s+change\s+number\s+:\s+\d+\/\d+,\s+last\s+change\s+:\s+\w+\s+\w+\s+\d+\s+\d+:\d+:\d+\s+\d+\s+([\W\w]+).*/);
const CLIENT_ID = 252490;
const SERVER_ID = 258550;


function log(message, id) {
    const date = new Date();
    if (id === CLIENT_ID) {
        console.log('[' + date.toISOString() + '] CLIENT: ' + message);
    } else if (id === SERVER_ID) {
        console.log('[' + date.toISOString() + '] SERVER: ' + message);
    } else {
        console.log('[' + date.toISOString() + '] DEFAULT: ' + message);
    }
}

let serverCmdInfo = {};
let clientCmdInfo = {};
let firstExecution = true;

function updateSteamInfo(gameId) {
    log("Updating steam info", gameId)

    const start = process.hrtime();

    const result = exec(`/home/steam/steamcmd/steamcmd.sh +login anonymous +app_info_print ${gameId} +exit`, {
        timeout: firstExecution ? 30000 : 5000
    }).toString();

    const end = process.hrtime(start);
    log("Took " + (end[0] * 1000 + end[1] / 1000000) + " MS to execute", gameId)
    firstExecution = false;

    const matches = result.match(REGEX);
    if (matches && matches.length > 1) {
        try {
            if (gameId === CLIENT_ID) {
                clientCmdInfo = vdf.parse(matches[1]);
            } else if (gameId === SERVER_ID) {
                serverCmdInfo = vdf.parse(matches[1]);
            }
            log("Parsed data", gameId)
        } catch (e) {
            console.error(e);
        }
    } else {
        console.error("Failed to match regex", gameId)
    }
}




app.listen(PORT, async function () {
    log("HTTP Server is running on port " + PORT);
    setInterval(() => {
        try {
            updateSteamInfo(CLIENT_ID);
        } catch (e) {
            console.error("Failed to fetch client data")
        }
    }, 10000)
    await new Promise(resolve => setTimeout(resolve, 5000));
    setInterval(() => {
        try {
            updateSteamInfo(SERVER_ID);
        } catch (e) {
            console.error("Failed to fetch server data")
        }
    }, 10000)
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send();
})



app.get('/server', function (req, res) {
    res.json(serverCmdInfo);
});
app.get('/server/public', function (req, res) {
    try {
        res.json(serverCmdInfo[SERVER_ID]["depots"]["branches"]["public"]);
    } catch {
        res.status(500);
    }
});


app.get('/client', function (req, res) {
    res.json(clientCmdInfo);
});
app.get('/client/public', function (req, res) {
    try {
        res.json(clientCmdInfo[CLIENT_ID]["depots"]["branches"]["public"]);
    } catch {
        res.status(500);
    }
});