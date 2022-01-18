const { write } = require("../postCypher");
const { testCypher, testProc } = require("./testFuncs");
const { demoUsers, userIDsObject, demoGroups, demoEvents, groupIDsObject, eventIDsObject } = require("./demoData")
const e = require("express");

const beforeAfter = {

    afterEachDeleteRel: function(executor) {
        return executor.writeQuery(testCypher.deleteAllRelationships, [])
    },

    beforeEventAction: function(executor) {
        const event = demoEvents[eventIDsObject.one]
        return executor.writeQuery(write.createEvent(event.hostID, event.eventID, event.description, event.invited, event.invited.length, event.date, event.numberMessages))
    },

    beforeAllPost: function(executor) {
        return new Promise(resolve => {
            console.log("Deleting All Nodes")
            const deleted = executor.writeQuery(testCypher.deleteAllNodes, [])
            deleted.then(_ => {
                let promises = []
                console.log("Setting Up Bank of Users")
                demoUsers.users.forEach(user => {
                    const promise = executor.writeQuery(write.createUser, user.getParams())
                    promises.push(promise)
                })


                const tokenEvent = executor.writeQuery(write.createEvent, testProc.getEmptyEventParams(userIDsObject.kennedy))
                const tokenGroup = executor.writeQuery(write.createGroup, testProc.getEmptyGroupParams(userIDsObject.kennedy))

                promises.push(tokenEvent)
                promises.push(tokenGroup)

                Promise.all(promises).then(_ => {
                    console.log("Resolved")
                    resolve("finished")
                })
            })
        })
    },

    beforeRemovingFriends: function(executor) {
        const p1 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.jake, userIDsObject.eric])
        const p2 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.montana, userIDsObject.montana])
        const p3 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.kennedy, userIDsObject.maribel, 2])
        const p4 = executor.writeQuery(write.sendFriendRequest, [userIDsObject.francisco, userIDsObject.weston])

        return Promise.all([p1, p2, p3, p4])
    },



    beforeAddingFriend: function(executor) {
        return new Promise(resolve => {
            const p1 = executor.writeQuery(write.sendFriendRequest, [userIDsObject.kennedy, userIDsObject.zach])
            const p2 = executor.writeQuery(write.sendFriendRequest, [userIDsObject.veronica, userIDsObject.peter])
            const p3 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.taylor, userIDsObject.maribel, 1])
            const p4 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.veronica, userIDsObject.peter, 2])
            const p5 = executor.writeQuery(write.sendFriendRequest, [userIDsObject.theodore, userIDsObject.francisco])
            const p6 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.leonore, userIDsObject.montana])


            Promise.all([p1, p2, p3, p4, p5, p6]).then(_ => {
                resolve("Finished")
            })
        })
    },

    beforeAddingConnections: function(executor) {
        const p1 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.jeremy, userIDsObject.frank])
        const p2 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.jeremy, userIDsObject.caroline])
        const p3 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.peter, userIDsObject.caroline])
        const p4 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.ben, userIDsObject.alex])
        const p5 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.nathan, userIDsObject.ben])
        const p6 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.nathan, userIDsObject.joe])
        const p7 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.nathan, userIDsObject.peter])

        const p8 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.jeremy, userIDsObject.peter, 1])

        return Promise.all([p1, p2, p3, p4, p5, p6, p7, p8])
    },

    beforeRemovingConnections: function(executor) {
        const p1 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.jeremy, userIDsObject.frank])
        const p2 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.jeremy, userIDsObject.caroline])
        const p3 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.peter, userIDsObject.caroline])
        const p4 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.ben, userIDsObject.alex])
        const p5 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.nathan, userIDsObject.ben])
        const p6 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.nathan, userIDsObject.joe])
        const p7 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.nathan, userIDsObject.peter])
        const p8 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.joe, userIDsObject.julia])
        const p9 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.jeremy, userIDsObject.joe])
        const p22 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.tyler, userIDsObject.joe])
        const p23 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.tyler, userIDsObject.ben])
        const p25 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.julia, userIDsObject.ben])

        const p10 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.jeremy, userIDsObject.peter, 1])
        const p11 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.joe, userIDsObject.frank, 1])
        const p12 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.joe, userIDsObject.peter, 2])
        const p13 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.joe, userIDsObject.caroline, 1])
        const p14 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.nathan, userIDsObject.caroline, 1])
        const p15 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.alex, userIDsObject.nathan, 1])
        const p16 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.joe, userIDsObject.ben, 3])
        const p17 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.julia, userIDsObject.jeremy, 1])
        const p18 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.julia, userIDsObject.nathan, 2])
        const p19 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.alex, userIDsObject.julia, 1])
        const p20 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.tyler, userIDsObject.julia, 2])
        const p21 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.peter, userIDsObject.ben, 2])

        const p24 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.kennedy, userIDsObject.zach])

        return Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21, p22, p23, p24])
    },

    beforeEventMessage: function(executor) {
        return new Promise(resolve => {
            const p1 = executor.writeQuery(write.createEvent, testProc.getEmptyEventParams(userIDsObject.kennedy))

            p1.then(_ => {
                console.log("Past Event Creation")
                const p2 = executor.writeQuery(testCypher.fabricateInvite, [userIDsObject.theodore, "eventID"])
                const p3 = executor.writeQuery(testCypher.fabricateAttend, [userIDsObject.weston, "eventID"])

                Promise.all([p2, p3]).then(_ => {
                    resolve("resolved")
                })
            })
        })
    },

    beforeGetConnections: function(executor) {
        const p1 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.nathan, userIDsObject.ben, 2])
        const p2 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.nathan, userIDsObject.peter, 3])
        return Promise.all([p1, p2])
    },

    beforeEventAction: function(executor) {
        return new Promise(resolve => {
            return executor.writeQuery(write.createEvent, demoEvents[eventIDsObject.one].getParams())
                .then(_ => {
                    console.log("Creating Test Event")
                    return executor.writeQuery(write.rsvpEvent, [userIDsObject.julia, eventIDsObject.one])
                })
                .then(_ => {
                    console.log("First Person Attending")
                    return executor.writeQuery(write.rsvpEvent, [userIDsObject.weston, eventIDsObject.one])
                })
                .then(_ => {
                    resolve("Finished Before Event Action Set up")
                })
        })
    },

    beforeEventUniquenessTest: function(executor) {
        return executor.writeQuery(write.createUser, demoEvents[eventIDsObject.one].getParams())
    },


    afterAllEventAction: function(executor) {
        return new Promise(resolve => {
            const p1 = executor.writeQuery(testCypher.deleteEvent, [eventIDsObject.one])
        })
    },

    beforeGetExtraInvites: function(executor) {
        const p1 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.kennedy, userIDsObject.alayna])
        const p2 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.kennedy, userIDsObject.eric])
        const p3 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.kennedy, userIDsObject.zach])
        const p4 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.kennedy, userIDsObject.taylor, 3])
        const p5 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.kennedy, userIDsObject.maribel, 4])

        const p6 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.joe, userIDsObject.frank])
        const p7 = executor.writeQuery(testCypher.fabricateFriendship, [userIDsObject.joe, userIDsObject.ben])

        const p8 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.francisco, userIDsObject.taylor, 3])
        const p9 = executor.writeQuery(testCypher.fabricateConnection, [userIDsObject.francisco, userIDsObject.veronica, 2])

        return Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9])
    },

}

module.exports =  { beforeAfter }