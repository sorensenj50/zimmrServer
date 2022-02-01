const { read } = require("../src/getCypher")
const { write } = require("../src/postCypher")
const { proc } = require("../src/processingFuncs")

class AltTestObject {
    constructor(func, params, result, message) {
        this.func = func
        this.params = params
        this.result = result
        this.message = message
    }
}

class TestObject {
    constructor(setFunction, getFunction, setParams, getParams, processingFunction, idealResult, message, type) {
        this.setFunction = setFunction
        this.getFunction = getFunction
        this.setParams = setParams
        this.getParams = getParams
        this.processingFunction = processingFunction
        this.idealResult = idealResult
        this.message = message
        this.type = type
    }

    customSort(result) {
        if (result == null || this.type == null) {
            return result
        } else if (this.type == "String Array") {
            result.sort()
            return result
        } else if (this.type == "userlist") {

            function compare(a, b) {
                if (a.userID > b.userID) return 1;
                if (b.userID > a.userID) return -1;

                return 0;
            }

            result.users.sort(compare)
            return result
        } else if (this.type == "feed") {
            console.log("Sorting Feed")
            function compare(a, b) {
                if (a.date < b.date) return 1
                if (a.date > b.date) return -1

                return 0
            }
            result.events.sort(compare)
            return result
        } else if (this.type == "groups") {
            function compare(a, b) {
                if (a.mostRecentMessageDate < b.mostRecentMessageDate) return 1
                if (a.mostRecentMessageDate > b.mostRecentMessageDate) return -1

                return 0
            }

            result.groups.sort(compare)
            return result
        }
    }
}

class UserRelationship extends TestObject {
    constructor(setFunction, user, viewed, message, ideal) {
        const params = [user, viewed]
        super(setFunction, testCypher.getUserRelationship, params, params, testProc.processRelationship, ideal, message, "String Array")
    }
}

class UserList extends TestObject {
    constructor(getFunction, params, message, ideal) {
        super(null, getFunction, params, params, proc.processUsers, ideal, message, "userlist")
    }
}

class EventRelationship extends TestObject {
    constructor(setFunction, user, eventID, message, ideal) {
        const params = [user, eventID]
        super(setFunction, testCypher.getEventRelationship, params, params, testProc.processRelationship, ideal, message, "String Array")
    }
}

class Feed extends TestObject {
    constructor(getFunction, params, ideal, message) {
        const actualParams = [...params, proc.getLaggedDate()]
        super(null, getFunction, null, actualParams, proc.processEvents, ideal, message, "feed")
    }
}

class User extends TestObject {
    constructor(user, viewed, ideal, message) {
        super(null, read.getUser, null, [user, viewed], proc.processUser, ideal, message, null)
    }
}

class Groups extends TestObject {
    constructor(userID, ideal, message) {
        super(null, read.getGroups, null, [userID], proc.processGroups, ideal, message, "groups")
    }
}

class Connections extends TestObject {
    constructor(userID, otherID, message, ideal) {
        const setFriendParams = [userID, otherID]
        const getConnectionsParams = [userID, userID]
        const setConnectionsParams = [userID, otherID]

        super([testCypher.fabricateFriendship, write.addConnections], read.getConnections,
            [setFriendParams, setConnectionsParams], getConnectionsParams, testProc.simpleProcessConnections, ideal, message, "userlist")
    }
}

class ConnectionsRemoval extends  TestObject {
    constructor(userID, otherID, message, ideal) {
        const setFriendParams = [userID, otherID]
        const getConnectionsParams = [userID, userID]
        const setConnectionsParams = [userID, otherID]

        super([write.removeConnections, write.decreaseLinks], read.getConnections,
            [setFriendParams, setConnectionsParams], getConnectionsParams, testProc.simpleProcessConnections, ideal, message, "userlist")
    }
}

class GroupRelationship extends TestObject {
    constructor(setFunction, userID, groupID, message, ideal) {
        super(setFunction, testCypher.getGroupRelationship, [userID, groupID], [userID, groupID], testProc.processRelationship, ideal, message, "String Array");
    }
}

class MessageEvent extends  TestObject {
    constructor(setFunction, setParams, getParams, message, ideal) {

        super(setFunction, testCypher.getEventRelationshipAndNumSeen,
            setParams, getParams, testProc.processRelationshipWithNumMessages, ideal, message)
    }
}

class Search extends TestObject {
    constructor(userID, searchTerm, message, ideal) {
        super(null, read.userSearch, null, [userID, searchTerm], proc.processUsers, ideal, message, "userlist")
    }
}

class GetInvites {


}





const testProc = {

    processRelationship: function(result) {
        if (result.records[0] == undefined) {
            return null
        } else {
            return [result.records[0].get(0)]
        }
    },

    processRelationships: function(result) {
        if (result.records[0] == undefined) {
            console.log(result)
            return null
        } else {
            return result.records.map(record => { return record.get(0) })
        }
    },

    processRelationshipWithNumMessages: function(result) {
        if (result.records[0] == undefined) {
            return null
        } else {
            console.log(result.records[0])
            let rel = [result.records[0].get(0), result.records[0].get(1) == null ? 0: result.records[0].get(1)]
            console.log(rel)
            return rel
        }
    },

    basicProcess: function(result) {
        return result.records
    },

    processNumberOfRecords: function(result) {
        console.log(result.records[0])
        return result.records.length
    },

    create_UUID: function() {
        let dt = new Date().getTime();
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid;
    },

    processNumber: function(result) {
        return parseInt(result.records[0].get(0))
    },

    getRandomPhoneNumber: function() {
        return Math.floor(Math.random() * 10000000000).toString()
    },

    processRelationshipDirection: function(result) {
        return { selfIsStart: result.records[0].get(0) }
    },

    getEmptyGroupParams: function(creatorID) {
        return [creatorID, "groupID", "name", ["members"]]
    },

    getEmptyEventParams: function(creatorID) {
        return [creatorID, "eventID", "description", ["userID", "userID"], 1, 1231231231231, 0]
    },

    getEmptyUserParams: function() {
        return ["userID", "firstName", "lastName", "userName", "fullName", "phoneNumber"]
    },

    simpleProcessConnections: function(result) {
        const complexProcessed = proc.processUsers(result)
        console.log(complexProcessed)

        const simpleProcessed =  complexProcessed.users.map(user => {
            const object = {userID: user.userID, links: user.links}
            return object
        })

        complexProcessed.users = simpleProcessed
        return complexProcessed
    },

    getObjectValues: function(object) {
        return Object.keys(object).map(key => { return object[key]})
    },

    emptyProcess: function(result) {
        return result
    }
}



const testCypher = {

    getUserAndAllRelationships: function(tx, userID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[r]-(n) " +
            "RETURN self, n",
            {"userID": userID})
    },

    getUserRelationship: function(tx, userID, viewedID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[r]-(other:USER {userID: $viewedID})" +
            "RETURN TYPE(r)",
            {"userID": userID, "viewedID": viewedID})
    },

    getEventRelationship: function(tx, userID, eventID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[r]-(event:EVENT {eventID: $eventID}) " +
            "RETURN TYPE(r)",
            {"userID": userID, "eventID": eventID})
    },

    getGroupRelationship: function(tx, userID, groupID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[r]-(group:GROUP {groupID: $groupID}) " +
            "RETURN TYPE(r) ",
            {"userID": userID, "groupID": groupID})
    },

    getEventRelationshipAndNumSeen: function(tx, userID, eventID) {
        return tx.run("" +
            "MATCH (user:USER {userID: $userID})-[r]-(event:EVENT {eventID: $eventID})" +
            "RETURN TYPE(r), r.numSeen",
            {"userID": userID, "eventID": eventID})
    },

    getNumUsers: function(tx, userID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID}) " +
            "RETURN self ",
            {"userID": userID})
    },

    getNumEvents: function(tx, eventID) {
        return tx.run("" +
            "MATCH (event:EVENT {eventID: $eventID}) " +
            "RETURN event ",
            {"eventID": eventID})
    },

    getNumGroups: function(tx, groupID) {
        return tx.run("" +
            "MATCH (group:GROUP {groupID: $groupID}) " +
            "RETURN group ",
            {"groupID": groupID})
    },

    getGroupName: function(tx, groupID) {
        return tx.run("" +
            "MATCH (group:GROUP {groupID: $groupID}) " +
            "RETURN group ",
            {"groupID": groupID})
    },

    getEventDescription: function(tx, eventID) {
        return tx.run("" +
            "MATCH (event:EVENT {eventID: $eventID}) " +
            "RETURN event.description",
            {"eventID": eventID})
    },

    getNumInvited: function(tx, eventID) {
        return tx.run("" +
            "MATCH (event:EVENT {eventID: $eventID}) " +
            "MATCH (event)-[:INVITE]-(user:USER) " +
            "RETURN user ",
            {"eventID": eventID})
    },

    getNumInvitedGroup: function(tx, groupID) {
        return tx.run("" +
            "MATCH (group:GROUP {groupID: $groupID}) " +
            "MATCH (group)-[:GROUP_MEMBER_REQUEST]-(user:USER) " +
            "RETURN user ",
            {"groupID": groupID})
    },

    fabricateFriendship: function(tx, userID, otherUserID) {
        return tx.run(
            "MATCH (self:USER {userID: $userID}) " +
            "MATCH (other:USER {userID: $otherUserID}) " +
            "WHERE NOT exists ( (self)-[:FRIEND]-(other) )" +
            "CREATE (self)-[:FRIEND]->(other) ",
            {"userID": userID, "otherUserID": otherUserID})
    },

    fabricateConnection: function(tx, userID, otherUserID, links) {
        return tx.run("" +
            "MATCH (user: USER {userID: $userID}) " +
            "MATCH (other: USER {userID: $otherUserID}) " +
            "CREATE (user)-[r:CONNECTION {links: $links}]->(other) ",
            {"userID": userID, "otherUserID": otherUserID, "links": links})
    },

    getGroupEventRelationship: function(tx, eventID, groupID) {
        return tx.run("" +
            "MATCH (event:EVENT {eventID: $eventID})-[r]-(group:GROUP {groupID: $groupID}) " +
            "RETURN TYPE(r)",
            {"eventID": eventID, "groupID": groupID,})
    },

    deleteGroupEventRelationship: function(tx, eventID, groupID) {
        return tx.run("" +
            "MATCH (event:EVENT {eventID: $eventID})-[r]-(group:GROUP {groupID: $groupID}) " +
            "RETURN TYPE(r)",
            {"eventID": eventID, "groupID": groupID,})
    },

    getNumAttending: function(tx, eventID) {
        return tx.run("" +
            "MATCH (event: EVENT {eventID: $eventID}) " +
            "RETURN event.numAttending ",
            {"eventID": eventID})
    },

    deleteAllNodes: function(tx) {
        return tx.run("" +
            "MATCH (n) " +
            "DETACH DELETE n")
    },

    getUserRelationshipDirection: function(tx, userID, otherID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[r]-(other:USER {userID: $otherID})" +
            "RETURN startNode(r) = self",
            {"userID": userID, "otherID": otherID})
    },

    deleteUserRelationships: function(tx, userIDs) {
        return tx.run("" +
            "MATCH (user:USER) " +
            "WHERE user.userID in $userIDs " +
            "MATCH (user)-[r]-(n) " +
            "DELETE r ",
            {"userIDs": userIDs})
    },

    deleteEvent: function(tx, eventID) {
        return tx.run("" +
            "MATCH (event:EVENT {eventID: $eventID}) " +
            "DETACH DELETE event")
    },

    deleteAllRelationships: function(tx) {
        return tx.run("" +
            "MATCH (n)-[r]-(n2) " +
            "DELETE r")
    },

    fabricateInvite: function(tx, userID, eventID) {
        return tx.run("" +
            "MATCH (event:EVENT {eventID: $eventID}) " +
            "MATCH (user:USER {userID: $userID}) " +
            "CREATE (event)-[:INVITE]->(user) ",
            {"userID": userID, "eventID": eventID})
    },

    fabricateAttend: function(tx, userID, eventID) {
        return tx.run("" +
            "MATCH (event:EVENT {eventID: $eventID}) " +
            "MATCH (user:USER {userID: $userID}) " +
            "CREATE (event)-[:ATTEND]->(user) ",
            {"userID": userID, "eventID": eventID})
    },

    rsvpEventSetNumAttending: function(tx, userID, eventID, numAttending) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[r:INVITE]-(event:EVENT {eventID: $eventID})" +
            "CREATE (self)-[:ATTEND {numSeen: r.numSeen}]->(event) " +
            "DELETE r " +
            "SET event.numAttending = $numAttending",
            {"userID": userID, "eventID": eventID, "numAttending": numAttending})
    },
}


module.exports = { testCypher, testProc, TestObject, UserList, Feed, MessageEvent, AltTestObject,
    UserRelationship, User, Groups, EventRelationship, GroupRelationship, Connections, ConnectionsRemoval, Search }




// const { demoUsers, demoEvents, demoGroups } = require('./demoData')
// const { read } = require("/getCypher")
// const { proc } = require("/processingFunctions")
// const { utils } = require("./TestFuncs")
// const { testCypher } = require("./testCypher")
//
// class TestObject {
//     constructor(setFunction, getFunction, setParams, getParams, processingFunction, idealResult, message, type) {
//         this.setFunction = setFunction
//         this.getFunction = getFunction
//         this.setParams = setParams
//         this.getParams = getParams
//         this.processingFunction = processingFunction
//         this.idealResult = idealResult
//         this.message = message
//         this.type = type
//     }
//
//     customSort(result) {
//         if (result == null || this.type == null) {
//             return result
//         } else if (this.type == "String Array") {
//             result.sort()
//             return result
//         } else if (this.type == "userlist") {
//
//             function compare(a, b) {
//                 if (a.userID > b.userID) return 1;
//                 if (b.userID > a.userID) return -1;
//
//                 return 0;
//             }
//
//             result.users.sort(compare)
//             return result
//         } else if (this.type == "feed") {
//             console.log("Sorting Feed")
//             function compare(a, b) {
//                 if (a.date < b.date) return 1
//                 if (a.date > b.date) return -1
//
//                 return 0
//             }
//             result.events.sort(compare)
//             return result
//         } else if (this.type == "groups") {
//             function compare(a, b) {
//                 if (a.mostRecentMessageDate < b.mostRecentMessageDate) return 1
//                 if (a.mostRecentMessageDate > b.mostRecentMessageDate) return -1
//
//                 return 0
//             }
//
//             result.groups.sort(compare)
//             return result
//         }
//     }
// }
//
// class UserRelationship extends TestObject {
//     constructor(setFunction, user, viewed, message, ideal) {
//         const params = [user, viewed]
//         super(setFunction, tes.getUserRelationship, params, params, utils.processRelationship, ideal, message, "String Array")
//     }
// }
//
// class UserList extends TestObject {
//     constructor(getFunction, params, message, ideal) {
//         super(null, getFunction, params, params, proc.processUsers, ideal, message, "userlist")
//     }
// }
//
// class EventRelationship extends TestObject {
//     constructor(setFunction, user, eventID, message, ideal) {
//         const params = [user, eventID]
//         super(setFunction, read.getEventRelationship, params, params, proc.processRelationship, ideal, message, "String Array")
//     }
// }
//
// class Feed extends TestObject {
//     constructor(getFunction, params, ideal, message) {
//         const actualParams = [...params, new Date().getTime() / 1000]
//         super(null, getFunction, null, actualParams, processEvents, ideal, message, "feed")
//     }
// }
//
// class User extends TestObject {
//     constructor(user, viewed, ideal, message) {
//         super(null, getUser, null, [user, viewed], processUser, ideal, message, null)
//     }
// }
//
// class Groups extends TestObject {
//     constructor(userID, ideal, message) {
//         super(null, getGroups, null, [userID], processGroups, ideal, message, "groups")
//     }
// }
//
// function executeTest(testObject) {
//     return new Promise(resolve => {
//         if (Array.isArray(testObject.setFunction)) {
//             const firstSet = executor.writeQuery(testObject.setFunction[0], testObject.setParams[0])
//             firstSet.then(_ => {
//                 const secondSet = executor.writeQuery(testObject.setFunction[1], testObject.setParams[1])
//                 secondSet.then(_ => {
//                     const get = executor.writeQuery(testObject.getFunction, testObject.getParams)
//                     get.then(result => {
//                         resolve(testObject.processingFunction(result))
//                     })
//                 })
//             })
//         } else if (testObject.setFunction != null) {
//             const set = executor.writeQuery(testObject.setFunction, testObject.setParams)
//             set.then(_ => {
//                 const get = executor.readQuery(testObject.getFunction, testObject.getParams)
//                 get.then(result => {
//                     resolve(testObject.processingFunction(result));
//                 })
//             })
//         } else {
//             const get = executor.readQuery(testObject.getFunction, testObject.getParams)
//             get.then(result => {
//                 resolve(testObject.processingFunction(result))
//             })
//         }
//     })
// }
//
// function testWrapper(testObject) {
//     test(testObject.message, () => {
//         return executeTest(testObject).then(processed => {
//             const proc_sorted = testObject.customSort(processed)
//             const ideal_sorted = testObject.customSort(testObject.idealResult)
//             expect(proc_sorted).toEqual(ideal_sorted);
//         })
//     })
// }
//
// // deletes everything and sets up bank of users
// function unitTestsSetUp(executor) {
//     const deleteAll = executor.writeQuery(deleteAllNodes, [])
//     deleteAll.then(_ => {
//         demoUsers.array.forEach(user => {executor.writeQuery(createUser, [user.uid, user.firstName, user.lastName, user.userName, user.fullName, user.phoneNumber])})
//     })
// }
//
// function beforeEventAction() {
//
// }