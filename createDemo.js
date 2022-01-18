const { demoUsers, connections, friendShips, demoEvents,
    demoGroups, eventsJoinObject, requestors, userIDsObject,
    links, receivers, dismissObject
} = require("./demoData")

const { write } = require("../postCypher")
const { testProc, testCypher } = require("./testFuncs")




function createDemo(executor) {
    return new Promise(resolve => {
        createUsers(executor, demoUsers)
            .then(_ => {
                console.log("Users Created")
                return createFriendShips(executor, friendShips)
            })
            .then(_ => {
                console.log("Friendships Created")
                return createConnections(executor, connections, links)
            })
            .then(_ => {
                console.log("Connections Created")
                return createEvents(executor, demoEvents)
            })
            .then(_ => {
                console.log("Events Created")
                return eventsAttend(executor, eventsJoinObject)
            })
            .then(_ => {
                console.log("Events Joined")
                return eventsDismiss(executor, dismissObject)
            })
            .then(_ => {
                console.log("Events Dismissed")
                return friendRequests(executor, requestors, receivers)
            })
            .then(_ => {
                console.log("Friend Requests Sent")
                resolve("Demonstration Database Created")
            })
    })

}

function createUsers(executor, demoUsers) {
    let promises = []
    demoUsers.users.forEach(user => {
        promises.push(executor.writeQuery(write.createUser, user.getParams()))
    })

    return Promise.all(promises)


}

function createFriendShips(executor, friendShips) {
    let promises = []
    const userIDs = Object.keys(friendShips)
    userIDs.forEach(userID => {
        const otherIDs = friendShips[userID]
        otherIDs.forEach(otherID => {
            promises.push(executor.writeQuery(testCypher.fabricateFriendship, [userID, otherID]))
        })
    })

    return Promise.all(promises)
}

function createConnections(executor, connections, links) {
    let promises = []

    for (let i = 0; i < connections.length; i ++) {
        const connectionID = connections[i]
        const link = links[i]

        promises.push(executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.kennedy, connectionID, link]))
    }
    return Promise.all(promises)
}

function createEvents(executor, demoEvents) {
    let promises = []
    demoEvents.events.forEach(event => {
        promises.push(executor.writeQuery(write.createEvent, event.getParams()))
    })

    return Promise.all(promises)
}

function createGroups(executor, demoGroups) {
    let promises = []
    demoGroups.groups.forEach(group => {
        promises.push(executor.writeQuery(write.createGroup, group.getParams()))
    })

    return Promise.all(promises)
}

function groupsJoin(executor, demoGroups) {
    let promises = []

    demoGroups.groups.forEach(group => {


        const users = group.members

        users.forEach(userID => {

            promises.push(executor.writeQuery(write.guardJoinGroup, [userID, group.id]))
        })
    })

    return Promise.all(promises)
}

function eventsAttend(executor, joinObject) {
    let promises = []

    const eventIDs = Object.keys(joinObject)
    eventIDs.forEach(eventID => {
        const attendees = joinObject[eventID]
        attendees.forEach(userID => {
            promises.push(executor.writeQuery(testCypher.rsvpEventSetNumAttending, [userID, eventID, attendees.length + 1])) // +1 for host
        })
    })

    return Promise.all(promises)

}
function eventsDismiss(executor, dismissObject) {
    let promises = []

    const eventIDs = Object.keys(dismissObject)
    eventIDs.forEach(eventID => {
        const attendees = dismissObject[eventID]
        attendees.forEach(userID => {
            promises.push(executor.writeQuery(write.dismissEvent, [userID, eventID]))
        })
    })

    return Promise.all(promises)
}



function friendRequests(executor, requestors, receivers) {
    let promises = []
    requestors.forEach(requestID => {
        promises.push(executor.writeQuery(write.sendFriendRequest, [requestID, userIDsObject.kennedy]))
    })

    receivers.forEach(receiveID => {
        promises.push(executor.writeQuery(write.sendFriendRequest, [userIDsObject.kennedy, receiveID]))
    })


    return Promise.all(promises)
}

function resetDatabase(executor) {
    return new Promise(resolve => {
        const deleteAll = executor.writeQuery(testCypher.deleteAllNodes, [])
        deleteAll.then(_ => {
            console.log("All Deleted")
            createDemo(executor).then(_ => {
                resolve("Database Reset")
            })
        })
    })

}

module.exports = { resetDatabase, createDemo }

// function createDemo_old(driver, res) {
//     return new Promise(resolve => {
//
//         let user_sessions = []
//         let user_promises = []
//         for (let i = 0; i < demoUsers.array.length; i++) {
//             const demoUser = demoUsers.array[i]
//
//             const session = driver.session();
//             const promise = session.writeTransaction(tx => createUser(tx, demoUser.uid, demoUser.firstName, demoUser.lastName, demoUser.userName, demoUser.fullName, demoUser.phoneNumber))
//             user_sessions.push(session)
//             user_promises.push(promise)
//         }
//
//         Promise.all(user_promises).then(_ => {
//             user_sessions.forEach(session => {
//                 session.close()
//             })
//
//
//
//
//
//             const friendShips = [kennedy_friend, tyler_friend, jake_friend, wesley_friend, veronica_friend, grace_friend,
//                 zach_friend, theodore_friend, leonore_friend, felix_friend, elenore_friend, maribel_friend, taylor_friend,
//                 jeremy_friend, peter_friend, ben_friend, nathan_friend]
//
//             let friend_sessions = []
//             let friend_promises = []
//             friendShips.forEach(object => {
//                 object.other.forEach(friend => {
//                     const session = driver.session();
//                     const promise = session.writeTransaction(tx => addFriend(tx, object.base, friend))
//                     friend_sessions.push(session)
//                     friend_promises.push(promise)
//                 })
//             })
//
//             Promise.all(friend_promises).then(_ => {
//                 friend_sessions.forEach(session => { session.close() })
//
//                 const connections = [userIDsObject.tyler, userIDsObject.jake, userIDsObject.wesley, userIDsObject.veronica,
//                     userIDsObject.grace, userIDsObject.zach, userIDsObject.theodore, userIDsObject.felix, userIDsObject.elenore,
//                     userIDsObject.leonore, userIDsObject.maribel, userIDsObject.taylor]
//                 const links = [3, 2, 3, 1, 4, 3, 1, 2, 1, 1, 1, 1]
//
//                 let connection_sessions = []
//                 let connection_promises = []
//                 for (let i = 0; i < connections.length; i++) {
//                     const session = driver.session();
//                     const promise = session.writeTransaction(tx => fabricateConnection(tx, userIDsObject.kennedy, connections[i], links[i]))
//                     connection_sessions.push(session)
//                     connection_promises.push(promise)
//                 }
//
//
//                 Promise.all(connection_promises).then(_ => {
//                     connection_sessions.forEach(session => { session.close() })
//
//                     let event_sessions = []
//                     let event_promises = []
//
//                     demoEvents.events.forEach(event => {
//                         const session = driver.session();
//                         const create_event_promise = session.writeTransaction(tx =>
//                             createEvent(tx, event.hostID, event.eventID, event.description, event.invited, event.invited.length, event.date, 0))
//                         event_sessions.push(session)
//                         event_promises.push(create_event_promise)
//                     })
//
//                     let group_sessions = []
//                     let group_promises = []
//
//                     demoGroups.groups.forEach(group => {
//                         const session = driver.session()
//                         const create_group_promise = session.writeTransaction(tx => createGroup(tx, group.creatorID, group.id, group.name, group.members))
//                         group_sessions.push(session)
//                         group_promises.push(create_group_promise)
//                     })
//
//
//
//                     Promise.all(event_promises.concat(group_promises)).then(_ => {
//                         event_sessions.forEach(session => { session.close() })
//                         group_sessions.forEach(session => { session.close() })
//
//                         const attendID = [userIDsObject.kennedy, userIDsObject.jake, userIDsObject.alayna, userIDsObject.weston, userIDsObject.zach,
//                             userIDsObject.grace, userIDsObject.julia, userIDsObject.isaac, userIDsObject.maribel, userIDsObject.kennedy]
//
//                         const events = [eventIDsObject.seven, eventIDsObject.six, eventIDsObject.six,
//                             eventIDsObject.one, eventIDsObject.one, eventIDsObject.four, eventIDsObject.four, eventIDsObject.five, eventIDsObject.five, eventIDsObject.five]
//
//                         let attendSessions = []
//                         let attendPromises = []
//                         for (let i = 0; i < events.length; i++) {
//                             const session = driver.session()
//                             const promise = session.writeTransaction(tx => rsvpEvent(tx, attendID[i], events[i]))
//                             attendSessions.push(session)
//                             attendPromises.push(promise)
//                         }
//
//                         let groupSessions = []
//                         let groupPromises = []
//
//                         demoGroups.groups.forEach(group => {
//                             group.members.forEach(member => {
//                                 const session = driver.session()
//                                 const promise = session.writeTransaction(tx => guardJoinGroup(tx, member, group.id))
//                                 groupSessions.push(session)
//                                 groupPromises.push(promise)
//                             })
//                         })
//
//                         Promise.all(attendPromises.concat(groupPromises)).then(_ => {
//                             attendSessions.forEach(session => { session.close() })
//                             groupSessions.forEach(session => { session.close() })
//
//                             const requests = [userIDsObject.zach, userIDsObject.veronica, userIDsObject.grace, userIDsObject.paul, userIDsObject.felix]
//                             let request_sessions = []
//                             let request_promises = []
//
//                             requests.forEach(req => {
//                                 const session = driver.session()
//                                 if (req == userIDsObject.veronica) {
//                                     const promise = session.writeTransaction(tx => sendFriendRequest(tx, userIDsObject.kennedy, req))
//                                     request_promises.push(promise)
//                                 } else if (req == userIDsObject.paul) {
//                                     const promise = session.writeTransaction(tx => sendFriendRequest(tx, req, userIDsObject.leonore))
//                                     request_promises.push(promise)
//                                 } else {
//                                     const promise = session.writeTransaction(tx => sendFriendRequest(tx, req, userIDsObject.kennedy))
//                                     request_promises.push(promise)
//                                 }
//                                 request_sessions.push(session)
//
//                             })
//
//                             let groupMessageSessions = []
//                             let groupMessagePromises = []
//
//                             demoGroups.groups.forEach(group => {
//                                 if (group.message != null) {
//                                     const session = driver.session()
//                                     const promise = session.writeTransaction(tx => updateMessagesGroup(tx, userIDsObject.kennedy, group.id, group.message, group.date))
//                                     groupMessageSessions.push(session)
//                                     groupMessagePromises.push(promise)
//                                 }
//                             })
//
//                             let messageSeenSessions = []
//                             let messageSeenPromises = []
//
//                             demoEvents.events.forEach(event => {
//                                 if (event.numMessages != 0) {
//                                     const session = driver.session()
//                                     const promise = session.writeTransaction(tx => updateMessagesEvent(tx, event.messageSeer, event.eventID, event.numMessages))
//                                     messageSeenSessions.push(session)
//                                     messageSeenPromises.push(promise)
//                                 }
//                             })
//
//                             Promise.all(request_promises.concat(groupMessagePromises).concat(messageSeenPromises)).then(_ => {
//                                 console.log("Relationships Completed")
//                                 request_sessions.forEach(session => { session.close() })
//                                 groupMessageSessions.forEach(session => { session.close() })
//
//                                 if (res != null) {
//                                     console.log("SENT RESPONSE")
//                                     res.json({ status: "successful" })
//                                     resolve("Resolved")
//                                 } else {
//                                     resolve("Resolved")
//                                 }
//                             })
//                         })
//                     })
//                 })
//             })
//         })
//     })
//
// }


function reset(driver, res) {
    return new Promise(resolve => {
        const session = driver.session();
        const deleteDemo = session.writeTransaction(tx => deleteAllNodes(tx))
        deleteDemo.then(_ => {
            session.close()
            console.log("Everything Deleted")
            createDemo(driver, res).then(value => {
                console.log(value)
                resolve("Database Reset")
            })
        })
    })
}

module.export = { reset }