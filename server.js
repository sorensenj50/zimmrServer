const { proc, QueryExecutor } = require('./processingFuncs')
const { read } = require('./getCypher')
const { write } = require("./postCypher")
const { hostEvent } = require("./hostEvent")


// stuff for neo4j
const uri = 'neo4j+s://10681f25.databases.neo4j.io';
const user = 'neo4j';
const password = 'GRy2om_UHnf7_Sf8CqIam4PEnyULBaJRxRlUAQCoLu4';


const neo4j = require('neo4j-driver')

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const executor = new QueryExecutor(driver)

// stuff for server
const express = require("express");
const app = express();


app.use(express.static('public'));
app.use(express.json());
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => { console.log(`Listening on port ${PORT}`) })


// used in auth
app.get("/userIDCheck", (req, res) => {
    const userID = req.query.userID;

    console.log("Received User ID Check Request " + userID)
    const result = executor.readQuery(read.checkIfUserIDExists, [userID])
    proc.sendJSON(res, result, proc.processExistenceCheck)
})

app.get("/userNameCheck", (req, res) => {
    const userName = req.query.userName;

    console.log("Received Check User Name Request" + req.query.userName)
    const result = executor.readQuery(read.checkIfUserNameExists, [userName])
    proc.sendJSON(res, result, proc.processExistenceCheck)
})

app.post("/newUser", (req, res) => {
    const body = req.body;

    console.log("Received Create User Request"  + body.userID)
    console.log(body)
    const params = [body.userID, body.firstName, body.userName, body.fullName, body.hasImage == "true", body.phoneNumber, body.creationDate]
    const user = executor.writeQuery(write.createUser, params)
    proc.handlePostRequest([user], res)
})



// profile

app.get("/user", (req, res) => {
    const userID = req.query.userID
    const otherID = req.query.otherID
    const date = proc.getCurrentDate()

    console.log("Received View Profile Request: " + otherID)

    const user = executor.readQuery(read.getUser, [userID, otherID])
    const pastEvents = executor.readQuery(read.getPastEvents, [userID, otherID, date])
    proc.handleProfile(res, user, pastEvents)

})

app.post("/userAction", (req, res) => {
    const userID = req.query.userID;
    const otherID = req.query.otherID;
    const type = req.query.type;


    console.log("Received User Post Request: " + type)

    if (type == "sendFriendRequest") {
        const friendRequestPromise = executor.writeQuery(write.sendFriendRequest, [userID, otherID])
        proc.handlePostRequest([friendRequestPromise], res)
    } else if (type == "acceptFriendRequest") {
        const addFriendPromise = executor.writeQuery(write.guardAddFriend, [userID, otherID])
        const myNewConnections = executor.writeQuery(write.addConnections, [userID, otherID])
        const otherNewConnections = executor.writeQuery(write.addConnections, [otherID, userID])
        proc.handlePostRequest([addFriendPromise, myNewConnections, otherNewConnections], res)

    } else if (type == "deleteRequest") {
        const deletePromise = executor.writeQuery(write.deleteReceivedRequest, [userID, otherID])
        proc.handlePostRequest([deletePromise], res)
    }
})

// events

app.get("/events", (req, res) => {
    const userID = req.query.userID;
    const otherID = req.query.userID;
    const time = req.query.time;

    // six hour lag
    const currentDate = proc.getLaggedDate();

    console.log("Received Feed Request: " + userID + " time: " + time)

    if (time == "past") {
        const feedPromise = executor.readQuery(read.getPastEvents, [userID, otherID, currentDate])
        proc.sendJSON(res, feedPromise, proc.processEvents)
    } else if (time == "future") {
        const feedPromise = executor.readQuery(read.getFutureEvents, [userID, currentDate])
        proc.sendJSON(res, feedPromise, proc.processEvents)
    }
})

app.post("/eventAction", (req, res) => {
    const userID = req.query.userID;
    const eventID = req.query.eventID;
    const actionType = req.query.type;


    console.log("Received Event Action Request. userID: " + userID + " eventID: " + eventID)
    console.log(actionType)


    if (actionType == "attend") {
        const rsvpPromise = executor.writeQuery(write.rsvpEvent, [userID, eventID])
        proc.handlePostRequest([rsvpPromise], res)
    } else if (actionType == "dismiss") {
        const dismissPromise = executor.writeQuery(write.dismissEvent, [userID, eventID])
        proc.handlePostRequest([dismissPromise], res)
    } else if (actionType == "leave") {
        const leavePromise = executor.writeQuery(write.leaveEvent, [userID, eventID])
        proc.handlePostRequest([leavePromise], res)
    } else if (actionType == "cancel") {
        const cancelPromise = executor.writeQuery(write.cancelEvent, [userID, eventID])
        proc.handlePostRequest([cancelPromise], res)
    } else if (actionType == "updateMessageNumber") {
        const newNumber = parseInt(req.query.newNumber)
        const updateMessages = executor.writeQuery(write.updateMessagesEvent, [userID, eventID, newNumber])
        proc.handlePostRequest([updateMessages], res)
    }
})

app.post("/host", (req, res) => {
    const query = req.query
    const body = req.body
    console.log("Host Event:" + query.userID);
    console.log(body)

    const hostEventPromise = hostEvent(executor, query, body)
    hostEventPromise.then(_ => {
        const newFeed = executor.readQuery(read.getFutureEvents, [query.userID, proc.getLaggedDate()])
        proc.sendJSON(res, newFeed, proc.processEvents)
    })
})

// user list

app.get("/userList", (req, res) => {
    const userID = req.query.userID;
    const type = req.query.type;
    const otherID = req.query.otherID;

    console.log("Received User List Get Request: " + type)

    if (type == "invite") {
        const invitePromise = executor.readQuery(read.getInvitedToEvent, [userID, otherID])
        proc.sendJSON(res, invitePromise, proc.processUsers)
    } else if (type == "attend") {
        const attendingPromise = executor.readQuery(read.getAttendingEvent, [userID, otherID])
        proc.sendJSON(res, attendingPromise, proc.processUsers)
    } else if (type == "friends") {
        const friendsPromise = executor.readQuery(read.getFriends, [userID, otherID])
        proc.sendJSON(res, friendsPromise, proc.processUsers)
    } else if (type == "connections") {
        const connectionsPromise = executor.readQuery(read.getConnections, [userID, otherID])
        proc.sendJSON(res, connectionsPromise, proc.processUsers)
    } else if (type == "mutualFriends") {
        const linkingFriendsPromise = executor.readQuery(read.getLinkingFriends, [userID, otherID])
        proc.sendJSON(res, linkingFriendsPromise, proc.processUsers)
    } else if (type == "receivedRequests") {
        const receivedRequestsPromise = executor.readQuery(read.getReceivedRequests, [userID])
        proc.sendJSON(res, receivedRequestsPromise, proc.processUsers)
    } else if (type == "search") {
        const searchPromise = executor.readQuery(read.userSearch, [userID, req.query.searchTerm + "*"])
        proc.sendJSON(res, searchPromise, proc.processUsers)
    }
})

// app post group


app.get("/info", (req, res) => {
    console.log("Info Request")
    const infoObject = {
        releaseDate: "Jan 18, 2021",
        version: "1.0",
        notes: {
            change1: "Connection to Neo4j production database",
            change2: "Production app.yaml",
            change3: "info get endpoint for version tracking"
        }
    }
    res.json(infoObject)
})

app.get("/neo4jTest", (req, res) => {
    const p1 = executor.readQuery(read.getUser, ["", ""])
    p1.then(_ => {
        res.json({ status: "success" } )
    })
})

