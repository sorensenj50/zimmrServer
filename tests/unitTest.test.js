const { read } = require("../src/getCypher")
const { write } = require("../src/postCypher")
const { proc, QueryExecutor } = require("./processingFunctions")
const { getExtraInvites } = require("../src/hostEvent")

const { testCypher, testProc, TestObject, UserList, Feed, UserRelationship,
    User, Groups, EventRelationship, GroupRelationship, Connections, ConnectionsRemoval, MessageEvent, Search, AltTestObject } = require("./testFuncs")

const { demoUsers, demoEvents, demoGroups, userIDsObject, eventIDsObject, groupIDsObject, eventsJoinObject } = require("./demoData")
const { demo, resetDatabase } = require("./createDemo")
const { beforeAfter } = require("./beforeAfter")


const uri = 'neo4j+s://e16c9ee5.databases.neo4j.io'; // test database
const user = 'neo4j';
const password = '4KqMAcYQTToW21B-e9VbgwqFp6wRTY-bQDG0avitw3k';

jest.setTimeout(10_000)

const executor = new QueryExecutor(uri, user, password, false)

function executeTest(testObject) { // refactor at some point
    return new Promise(resolve => {
        if (Array.isArray(testObject.setFunction)) {
            const firstSet = executor.writeQuery(testObject.setFunction[0], testObject.setParams[0])
            firstSet.then(_ => {
                const secondSet = executor.writeQuery(testObject.setFunction[1], testObject.setParams[1])
                secondSet.then(_ => {
                    const get = executor.writeQuery(testObject.getFunction, testObject.getParams)
                    get.then(result => {
                        resolve(testObject.processingFunction(result))
                    })
                })
            })
        } else if (testObject.setFunction != null) {
            const set = executor.writeQuery(testObject.setFunction, testObject.setParams)
            set.then(_ => {
                const get = executor.readQuery(testObject.getFunction, testObject.getParams)
                get.then(result => {
                    resolve(testObject.processingFunction(result));
                })
            })
        } else {
            const get = executor.readQuery(testObject.getFunction, testObject.getParams)
            get.then(result => {
                resolve(testObject.processingFunction(result))
            })
        }
    })
}

function testWrapper(testObject) {
    test(testObject.message, () => {
        return executeTest(testObject).then(processed => {
            const proc_sorted = testObject.customSort(processed)
            const ideal_sorted = testObject.customSort(testObject.idealResult)
            expect(proc_sorted).toEqual(ideal_sorted);
        })
    })
}


function altTestWrapper(altTestObject) {
    test(altTestObject.message, async () => {
        const result = await altTestObject.func(...altTestObject.params)
        expect(result.sort()).toEqual(altTestObject.result.sort())
    })
}




describe("post tests", () => {

    beforeAll(async () => {
        await beforeAfter.beforeAllPost(executor)
    })



    describe("check if user exists", () => {

        const userCheck1Result = {
            exists: true
        }
        const userCheckObject1 = new TestObject(null, read.checkIfUserIDExists, null,
            [userIDsObject.kennedy], proc.processExistenceCheck, userCheck1Result, "user check test 1: user exists")
        testWrapper(userCheckObject1)

        const userCheckResult2 = {
            exists: false
        }
        const userCheckObject2 = new TestObject(null, read.checkIfUserIDExists, null,
            ["asdfalsdfio1023lknaslf asdlkfjasdl"], proc.processExistenceCheck, userCheckResult2, "user check test 2: user does not exist")
        testWrapper(userCheckObject2)

        const userCheckResult3 = {
            exists: true
        }
        const userCheckObject3 = new TestObject(null, read.checkIfUserIDExists, null,
            [userIDsObject.peter], proc.processExistenceCheck, userCheckResult3, "user check test 3: user exists")
        testWrapper(userCheckObject3)

        const userCheckResult4 = {
            exists: false
        }
        const userCheckObject4 = new TestObject(null, read.checkIfUserIDExists, null,
            [""], proc.processExistenceCheck, userCheckResult4, "user check test 4: user exists")
        testWrapper(userCheckObject4)



    })
    describe("check if userName exists", () => {
        const testResult1 = {
            exists: true
        }
        const testObject1 = new TestObject(null, read.checkIfUserNameExists, null, ["the_king"],
            proc.processExistenceCheck, testResult1, "user name check 1: username does already exist")
        testWrapper(testObject1)

        const testResult2 = {
            exists: true,
        }
        const testObject2 = new TestObject(null, read.checkIfUserNameExists, null, ["theo_the_man"],
            proc.processExistenceCheck, testResult2, "user name check 2: username does already exist")
        testWrapper(testObject2)

        const testResult3 = {
            exists: false,
        }
        const testObject3 = new TestObject(null, read.checkIfUserNameExists, null, ["the_snack"],
            proc.processExistenceCheck, testResult3, "user name check 3: username does not already exist")
        testWrapper(testObject3)


        const testResult4 = {
            exists: false,
        }
        const testObject4 = new TestObject(null, read.checkIfUserNameExists, null, ["the_nard_dog"],
            proc.processExistenceCheck, testResult4, "user name check 4: username does not already exist")
        testWrapper(testObject4)


    })
    describe("editing, creating, deleting user", () => {

        const uid = "user id user id"
        const createUserResult = { exists: true }
        const createUserObj = new TestObject(write.createUser, testCypher.getNumUsers, [uid, "", "", "", "", "", true], [uid],
            proc.processExistenceCheck, createUserResult, "create user test 1: user exists")
        testWrapper(createUserObj)

        const mergeUserResult1 = 1
        const mergeUserObj1 = new TestObject(write.createUser, testCypher.getNumUsers, [uid, "", "", "", "", "", true], [uid],
            testProc.processNumberOfRecords, mergeUserResult1, "merge user test 2: one user")
        testWrapper(mergeUserObj1)


        const mergeUserResult2 = 1
        const mergeUserObj2 = new TestObject(write.createUser, testCypher.getNumUsers, [uid, "asdfsdf", "", "", "", "", true], [uid],
            testProc.processNumberOfRecords, mergeUserResult2, "merge user test 3: still one user, even though property is updated")
        testWrapper(mergeUserObj2)

        const mergeUserResult3 = 1
        const mergeUserObj3 = new TestObject(write.createUser, testCypher.getNumUsers, [uid, "", "", "", "", "", true], [uid],
            testProc.processNumberOfRecords, mergeUserResult3, "merge user test 4: still one user")
        testWrapper(mergeUserObj3)



        const deleteUserObj = new TestObject(write.deleteUser, testCypher.getUserAndAllRelationships, [uid], [uid], testProc.basicProcess, [], "delete user test", "user")
        testWrapper(deleteUserObj)


    })
    describe("friend requests", () => {


        // sending friend request
        const friendRequestObj1 = new TestObject(write.sendFriendRequest, testCypher.getUserRelationship,
            [userIDsObject.francisco, userIDsObject.weston],
            [userIDsObject.francisco, userIDsObject.weston],
            testProc.processRelationship, ["FRIEND_REQUEST"], "friend request test 1: sending friend request", "String Array")

        testWrapper(friendRequestObj1)

        // ensure correct direction

        const friendRequestOb2 = new TestObject(null, testCypher.getUserRelationshipDirection, null,
            [userIDsObject.francisco, userIDsObject.weston],
            testProc.processRelationshipDirection, {selfIsStart: true}, "friend request test 2: verifying direction of relationship")
        testWrapper(friendRequestOb2)
        // accept friend request

        const friendRequestObj3 = new TestObject(write.guardAddFriend, testCypher.getUserRelationship,
            [userIDsObject.weston, userIDsObject.francisco],
            [userIDsObject.weston, userIDsObject.francisco],
            testProc.processRelationship, ["FRIEND"], "friend request test 3: accepting friend request", "String Array")

        testWrapper(friendRequestObj3)

        const friendRequestObj4 = new TestObject(write.sendFriendRequest, testCypher.getUserRelationship,
            [userIDsObject.francisco, userIDsObject.weston], [userIDsObject.francisco, userIDsObject.weston], testProc.processRelationships,
            ["FRIEND"], "friend request test 4: can't friend request a friend", "String Array")
        testWrapper(friendRequestObj4)


        const friendRequestObj5 = new TestObject(write.sendFriendRequest, testCypher.getUserRelationship,
            [userIDsObject.francisco, userIDsObject.alayna],
            [userIDsObject.francisco, userIDsObject.alayna],
            testProc.processRelationship, ["FRIEND_REQUEST"], "friend request test 5: sending friend request again", "String Array")
        testWrapper(friendRequestObj5)


        const friendRequestObj6 = new TestObject(write.deleteReceivedRequest, testCypher.getUserRelationship,
            [userIDsObject.alayna, userIDsObject.francisco],
            [userIDsObject.francisco, userIDsObject.alayna],
            testProc.processRelationship, ["DELETED"], "friend request test 6: deleting request", "String Array")
        testWrapper(friendRequestObj6)

        const friendRequestObj7 = new TestObject(write.sendFriendRequest, testCypher.getUserRelationship,
            [userIDsObject.francisco, userIDsObject.alayna],
            [userIDsObject.francisco, userIDsObject.alayna],
            testProc.processRelationships, ["DELETED"], "friend request test 7: can't request someone who deleted your request", "String Array")
        testWrapper(friendRequestObj7)

        const friendRequestObj8 = new TestObject(write.sendFriendRequest, testCypher.getUserRelationship,
            [userIDsObject.francisco, userIDsObject.julia],
            [userIDsObject.francisco, userIDsObject.julia],
            testProc.processRelationship, ["FRIEND_REQUEST"], "friend request test 8: sending friend request again", "String Array")
        testWrapper(friendRequestObj8)

        const friendRequestObj9 = new TestObject(write.sendFriendRequest, testCypher.getUserRelationship,
            [userIDsObject.francisco, userIDsObject.julia],
            [userIDsObject.francisco, userIDsObject.julia],
            testProc.processRelationships, ["FRIEND_REQUEST"], "friend request test 9: friend request rel is merged", "String Array")
        testWrapper(friendRequestObj9)

        const friendRequestObj10 = new TestObject(write.deleteReceivedRequest, testCypher.getUserRelationship,
            [userIDsObject.montana, userIDsObject.tyler],
            [userIDsObject.montana, userIDsObject.tyler],
            testProc.processRelationship, null, "friend request test 10: can't delete random people", "String Array")
        testWrapper(friendRequestObj10)

        const friendRequestObj11 = new TestObject(write.sendFriendRequest, testCypher.getEventRelationship,
            [userIDsObject.montana, eventIDsObject.one], [userIDsObject.montana, eventIDsObject.one],
            testProc.processRelationship, null, "friend request test 12: can't invite events")
        testWrapper(friendRequestObj11)

        const friendRequestObj12 = new TestObject(write.deleteReceivedRequest, testCypher.getUserRelationship,
            [userIDsObject.francisco, userIDsObject.julia], [userIDsObject.francisco, userIDsObject.julia],
            testProc.processRelationship, ["FRIEND_REQUEST"], "friend request 13: sender can't delete request", "String Array")
        testWrapper(friendRequestObj12)

        afterAll( async() => {
            await beforeAfter.afterEachDeleteRel(executor)
        })

    })
    describe("Adding friends ", () => {
        beforeAll(async () => {
            await beforeAfter.beforeAddingFriend(executor)
        })

        // tests for adding friend
        const addFriendTest1 = new UserRelationship(write.guardAddFriend, userIDsObject.zach, userIDsObject.kennedy,
            "friend request test 1: can add friend, only friend rel is returned", ["FRIEND"])
        testWrapper(addFriendTest1)

        const addFriendTest2 = new UserRelationship(write.guardAddFriend, userIDsObject.peter, userIDsObject.veronica,
            "friend request test 2: can add friend, only friend rel is returned (connection gone)", ["FRIEND"])
        testWrapper(addFriendTest2)

        const addFriendTest3 = new UserRelationship(write.guardAddFriend, userIDsObject.maribel, userIDsObject.taylor,
            "friend request test 3: no friend with connection rel ", ["CONNECTION"])
        testWrapper(addFriendTest3)

        const addFriendTest4 = new UserRelationship(write.guardAddFriend, userIDsObject.theodore, userIDsObject.francisco,
            "friend request test 4: no friend with sent request", ["FRIEND_REQUEST"])
        testWrapper(addFriendTest4)

        const addFriendTest5 = new UserRelationship(write.guardAddFriend, userIDsObject.leonore, userIDsObject.montana, "friend request test 5: only one friendship rel can exist",
            ["FRIEND"])
        testWrapper(addFriendTest5)

        const addFriendTest6 = new EventRelationship(write.guardAddFriend, userIDsObject.leonore, "eventID", "friend request test 6: can't add friend event", null)
        testWrapper(addFriendTest6)

        const addFriendTest7 = new GroupRelationship(write.guardAddFriend, userIDsObject.leonore, "groupID", "friend request test 7: can't add friend group", null)
        testWrapper(addFriendTest7)

        const addFriendTest8 = new UserRelationship(write.guardAddFriend, userIDsObject.alex, userIDsObject.alex, "friend request test 8: can't add friend to oneself", null)
        testWrapper(addFriendTest8)


        afterAll(async () => {
            await beforeAfter.afterEachDeleteRel(executor)
        })
    })

    describe("removing friends", () => {

        beforeAll( async() => {
            await beforeAfter.beforeRemovingFriends(executor)
        })

        // // tests for removing friend
        const removeFriend1 = new UserRelationship(write.unFriend, userIDsObject.jake, userIDsObject.eric, "remove friend test 1: can remove friend", null)
        testWrapper(removeFriend1)

        const removeFriend2 = new UserRelationship(write.unFriend, userIDsObject.kennedy, userIDsObject.maribel, "remove friend test 2: doesn't remove connection", ["CONNECTION"])
        testWrapper(removeFriend2)

        const removeFriend3 = new UserRelationship(write.unFriend, userIDsObject.kennedy, userIDsObject.jeremy, "remove friend test 3: not removing no relationship", null)
        testWrapper(removeFriend3)

        const removeFriend4 = new UserRelationship(write.unFriend, userIDsObject.francisco, userIDsObject.weston, "remove friend test 4: not removing friend request", ["FRIEND_REQUEST"])
        testWrapper(removeFriend4)

        const removeFriend5 = new UserRelationship(write.unFriend, userIDsObject.jake, "eventID", "remove friend test 5: no effect on events", null)
        testWrapper(removeFriend5)

        const removeFriend6 = new UserRelationship(write.unFriend, userIDsObject.eric, "groupID", "remove friend test 6: no effect on groups", null)
        testWrapper(removeFriend6)

        afterAll(async() => {
            await beforeAfter.afterEachDeleteRel(executor)
        })
    })
    describe("adding connections narrative", () => {

        const addConnectionsResult1 = {
            users: []
        }
        const addConnections1 = new Connections(userIDsObject.joe, userIDsObject.jeremy, "connections test 1: joe - jeremy, none for joe", addConnectionsResult1)
        testWrapper(addConnections1)

        const addConnectionsResult2 = {
            users: []
        }
        const addConnections2 = new Connections(userIDsObject.jeremy, userIDsObject.joe, "connections test 2: reverse, none for jeremy", addConnectionsResult2)
        testWrapper(addConnections2)

        const addConnectionsResult3 = {
            users: []
        }
        const addConnections3 = new Connections(userIDsObject.jeremy, userIDsObject.frank, "connections test 3: jeremy to frank, none for jeremy", addConnectionsResult3)
        testWrapper(addConnections3)

        const addConnectionsResult4 = {
            users: [
                {
                    userID: userIDsObject.joe,
                    links: 1
                }

            ]
        }
        const addConnections4 = new Connections(userIDsObject.frank, userIDsObject.jeremy, "connections test 4: frank - jeremy, 1 new for frank and joe", addConnectionsResult4)
        testWrapper(addConnections4)

        const addConnectionsResult5 = {
            users: [
                {
                    userID: userIDsObject.frank,
                    links: 1,
                }
            ]
        }
        const addConnections5 = new Connections(userIDsObject.joe, userIDsObject.nathan, "connections test 5: joe - nathan, still 1 for joe", addConnectionsResult5)
        testWrapper(addConnections5)

        const addConnectionsResult6 = {
            users: [
                {
                    userID: userIDsObject.jeremy,
                    links: 1,
                }
            ]
        }
        const addConnections6 = new Connections(userIDsObject.nathan, userIDsObject.joe, "connections test 6: nathan - joe, 1 new for nathan and jeremy", addConnectionsResult6)
        testWrapper(addConnections6)

        const addConnectionsResult7 = {
            users: [
                {
                    userID: userIDsObject.frank,
                    links: 1
                }
            ]
        }
        const addConnections7 = new Connections(userIDsObject.joe, userIDsObject.peter, "connections test 7: joe - peter, still 1 for joe", addConnectionsResult7)
        testWrapper(addConnections7)

        const addConnectionsResult8 = {
            users: [
                {
                    userID: userIDsObject.jeremy,
                    links: 1,
                },

                {
                    userID: userIDsObject.nathan,
                    links: 1,
                },
            ]
        }
        const addConnections8 = new Connections(userIDsObject.peter, userIDsObject.joe, "connections test 8: peter - joe, 2 new for peter", addConnectionsResult8)
        testWrapper(addConnections8)

        const addConnectionsResult9 = {
            users: [
                {
                    userID: userIDsObject.joe,
                    links: 1,
                }
            ]
        }
        const addConnections9 = new Connections(userIDsObject.caroline, userIDsObject.peter, "connections test 9: caroline - peter, 1 new for caroline and joe", addConnectionsResult9)
        testWrapper(addConnections9)

        const addConnectionsResult10 = {
            users: [
                {
                    userID: userIDsObject.jeremy,
                    links: 1,
                },
                {
                    userID: userIDsObject.nathan,
                    links: 1
                }
            ]

        }
        const addConnections10 = new Connections(userIDsObject.peter, userIDsObject.caroline, "connections test 10: peter - caroline, still 2 for peter", addConnectionsResult10)
        testWrapper(addConnections10)

        const addConnectionsResult11 = {
            users: [
                {
                    userID: userIDsObject.joe,
                    links: 2
                },
                {
                    userID: userIDsObject.frank,
                    links: 1
                },
            ]
        }
        const addConnections11 = new Connections(userIDsObject.caroline, userIDsObject.jeremy, "connections test 11: caroline - jeremy, increase links", addConnectionsResult11)
        testWrapper(addConnections11)

        const addConnectionsResult12 = {
            users: [
                {
                    userID: userIDsObject.nathan,
                    links: 1
                },

                {
                    userID: userIDsObject.peter,
                    links: 2
                }
            ]
        }
        const addConnections12 = new Connections(userIDsObject.jeremy, userIDsObject.caroline, "connections test 12: jeremy = caroline, increase links", addConnectionsResult12)
        testWrapper(addConnections12)

        const addConnectionsResult13 = {
            users: [
                {
                    userID: userIDsObject.jeremy,
                    links: 1
                },

                {
                    userID: userIDsObject.peter,
                    links: 1
                }
            ]
        }
        const addConnections13 = new Connections(userIDsObject.alex, userIDsObject.caroline, "connections test 13: alex - caroline, 2 new", addConnectionsResult13)
        testWrapper(addConnections13)

        const addConnectionsResult14 = {
            users: [
                {
                    userID: userIDsObject.joe,
                    links: 2
                },
                {
                    userID: userIDsObject.frank,
                    links: 1
                },
            ]
        }
        const addConnections14 = new Connections(userIDsObject.caroline, userIDsObject.alex, "connections test 14: caroline to alex, none new", addConnectionsResult14)
        testWrapper(addConnections14)

        const addConnectionsResult15 = {
            users: [
                {
                    userID: userIDsObject.jeremy,
                    links: 2
                },
                {
                    userID: userIDsObject.peter,
                    links: 1
                },
            ]
        }
        const addConnections15 = new Connections(userIDsObject.alex, userIDsObject.frank, "connections test 15: alex - frank, increase links", addConnectionsResult15)
        testWrapper(addConnections15)

        const addConnectionsResult16 = {
            users: [
                {
                    userID: userIDsObject.caroline,
                    links: 2
                },
                {
                    userID: userIDsObject.joe,
                    links: 1
                },
            ]
        }
        const addConnections16 = new Connections(userIDsObject.frank, userIDsObject.alex, "connections test 16: alex - frank, increase links", addConnectionsResult16)
        testWrapper(addConnections16)

        afterAll(async () => {
            await beforeAfter.afterEachDeleteRel(executor)
        })
    })

    describe("removing connections", () => {
        beforeAll(async () => {
            await beforeAfter.beforeRemovingConnections(executor)
        })

        const removeConnections1 = new ConnectionsRemoval(userIDsObject.kennedy, userIDsObject.zach, "no connections to remove", { users: [] })
        testWrapper(removeConnections1)

        const newConnectionsResult1 = {
            users: [
                {
                    userID: userIDsObject.nathan,
                    links: 1,
                },

                {
                    userID: userIDsObject.alex,
                    links: 1,
                },

                {
                    userID: userIDsObject.tyler,
                    links: 1,
                }

            ]
        }
        const removeConnections2 = new ConnectionsRemoval(userIDsObject.julia, userIDsObject.joe, "removing connections test 1", newConnectionsResult1)
        testWrapper(removeConnections2)

        const newConnections2 = {
            users: [
                {
                    userID: userIDsObject.caroline,
                    links: 1,
                },

                {
                    userID: userIDsObject.peter,
                    links: 2,
                },

                {
                    userID: userIDsObject.frank,
                    links: 1,
                },

                {
                    userID: userIDsObject.ben,
                    links: 2,
                },
            ]

        }
        const removeConnections3 = new ConnectionsRemoval(userIDsObject.joe, userIDsObject.julia, "removing connections test 2", newConnections2)
        testWrapper(removeConnections3)

        const removeSelf = new ConnectionsRemoval(userIDsObject.joe, userIDsObject.joe, "removing connections test 3: can't work with self", newConnections2)
        testWrapper(removeSelf)

    })

    describe("event messages", () => {
        beforeAll( async() => {
            await beforeAfter.beforeEventMessage(executor)
        })

        const eventMessageResult1 = ["INVITE", 0]
        const eventMessageTestObject1 = new MessageEvent(null, null, [userIDsObject.theodore, "eventID"], "event message test 1: invite starts having seen zero", eventMessageResult1)
        testWrapper(eventMessageTestObject1)

        const eventMessageResult2 = ["INVITE", 2]
        const eventMessageTestObject2 = new MessageEvent(write.updateMessagesEvent, [userIDsObject.theodore, "eventID", 2], [userIDsObject.theodore, "eventID"],
            "event message test 2: updated to 2", eventMessageResult2)
        testWrapper(eventMessageTestObject2)

        const eventMessageResult3 = ["INVITE", 3]
        const eventMessageTestObject3 = new MessageEvent(write.updateMessagesEvent, [userIDsObject.theodore, "eventID", 3], [userIDsObject.theodore, "eventID"],
            "event message test 2: updated again to 3", eventMessageResult3)
        testWrapper(eventMessageTestObject3)

        const eventMessageResult4 = ["HOST", 0]
        const eventMessageTestObject4 = new MessageEvent(null, [userIDsObject.kennedy, "eventID", 3], [userIDsObject.kennedy, "eventID"],
            "event message test 3: host starts with 0 being seen", eventMessageResult4)
        testWrapper(eventMessageTestObject4)


        const eventMessageResult5 = ["HOST", 3]
        const eventMessageTestObject5 = new MessageEvent(write.updateMessagesEvent, [userIDsObject.kennedy, "eventID", 3], [userIDsObject.kennedy, "eventID"],
            "event message test 4: host updates to 3", eventMessageResult5)
        testWrapper(eventMessageTestObject5)


        const eventMessageResult6 = ["HOST", 4]
        const eventMessageTestObject6 = new MessageEvent(write.updateMessagesEvent, [userIDsObject.kennedy, "eventID", 4], [userIDsObject.kennedy, "eventID"],
            "event message test 5: host sends message and updates to four", eventMessageResult6)
        testWrapper(eventMessageTestObject6)

        const eventMessageResult7 = null
        const eventMessageTestObject7 = new MessageEvent(write.updateMessagesEvent, [userIDsObject.unknown, "eventID", 1231023], [userIDsObject.unknown, "eventID"],
            "event message test 6: doesn't work with unknown", eventMessageResult7)
        testWrapper(eventMessageTestObject7)

    })
    describe("event action", () => {
        beforeAll(async () => {
            await beforeAfter.beforeEventAction(executor)
        })

        const eventAction1 = new EventRelationship(null, userIDsObject.kennedy, eventIDsObject.one, "event action 1: initial host status", ["HOST"])
        testWrapper(eventAction1)

        const eventAction2 = new EventRelationship(null, userIDsObject.weston, eventIDsObject.one, "event action 2: initial attend status", ["ATTEND"])
        testWrapper(eventAction2)

        const eventAction3 = new EventRelationship(null, userIDsObject.leonore, eventIDsObject.one, "event action 3: initial not-invited status", null)
        testWrapper(eventAction3)

        const eventAction4 = new EventRelationship(null, userIDsObject.theodore, eventIDsObject.one, "event action 4: initial invite status", ["INVITE"])
        testWrapper(eventAction4)

        const eventAction5 = new EventRelationship(write.rsvpEvent, userIDsObject.theodore, eventIDsObject.one, "event action 5: rsvp to event", ["ATTEND"])
        testWrapper(eventAction5)

        const eventAction5_5 = new TestObject(null, testCypher.getNumAttending, null, [eventIDsObject.one],
            testProc.processNumber, 4, "event action 6: checking if num attending has increased")
        testWrapper(eventAction5_5)

        const eventAction10 = new EventRelationship(write.rsvpEvent, userIDsObject.alex, eventIDsObject.one, "event action 7: can't rsvp to event not invited", null)
        testWrapper(eventAction10)

        const eventAction11 = new EventRelationship(write.rsvpEvent, userIDsObject.kennedy, eventIDsObject.one, "event action 8: can't rsvp to event you created", ["HOST"])
        testWrapper(eventAction11)

        const eventAction12 = new EventRelationship(write.rsvpEvent, userIDsObject.weston, eventIDsObject.one, "event action 9: can't rsvp to event you are attending", ["ATTEND"])
        testWrapper(eventAction12)


        const eventAction6 = new EventRelationship(write.leaveEvent, userIDsObject.weston, eventIDsObject.one, "event action 10: leaving event", ["INVITE"])
        testWrapper(eventAction6)

        const eventAction6_5 = new TestObject(null, testCypher.getNumAttending, null, [eventIDsObject.one],
            testProc.processNumber, 3, "event action 11: checking if num attending has decreased")
        testWrapper(eventAction6_5)

        const eventAction13 = new EventRelationship(write.leaveEvent, userIDsObject.kennedy, eventIDsObject.one, "event action 12: can't leave event you created", ["HOST"])
        testWrapper(eventAction13)

        const eventAction14 = new EventRelationship(write.leaveEvent, userIDsObject.zach, eventIDsObject.one, "event action 13: can't leave event you are invited to", ['INVITE'])
        testWrapper(eventAction14)

        const eventAction15 = new EventRelationship(write.leaveEvent, userIDsObject.alex, eventIDsObject.one, "event action 14: can't leave event you aren't invited to ", null)
        testWrapper(eventAction15)

        const eventAction7 = new EventRelationship(write.dismissEvent, userIDsObject.johnny, eventIDsObject.one, "event action 15: dismissing event from feed", ["DISMISSED"])
        testWrapper(eventAction7)

        const eventAction18 = new EventRelationship(write.dismissEvent, userIDsObject.julia, eventIDsObject.one, "event action 16: can't dismiss if attending", ["ATTEND"])
        testWrapper(eventAction18)

        const eventAction19 = new EventRelationship(write.dismissEvent, userIDsObject.kennedy, eventIDsObject.one, "event action 17: can't dismiss if hosting", ["HOST"])
        testWrapper(eventAction19)

        const eventAction16 = new EventRelationship(write.cancelEvent, userIDsObject.zach, eventIDsObject.one, "event action 18: can't cancel event you are invited to", ['INVITE'])
        testWrapper(eventAction16)

        const eventAction17 = new EventRelationship(write.cancelEvent, userIDsObject.julia, eventIDsObject.one, "event action 19: can't cancel event you are attending", ["ATTEND"])
        testWrapper(eventAction17)

        const eventAction8 = new EventRelationship(write.cancelEvent, userIDsObject.kennedy, eventIDsObject.one, "event action 20: cancelling hosting event", null)
        testWrapper(eventAction8)

        const eventAction9 = new EventRelationship(null, userIDsObject.zach, eventIDsObject.one, "event action 21: cancelled event is cancelled for everyone", null)
        testWrapper(eventAction9)


        afterAll( async () => {
            await beforeAfter.afterAllEventAction(executor)
        })


    })

    describe("extra event invites", () => {
        beforeAll( async() => {
            await beforeAfter.beforeGetExtraInvites(executor)
        })


        const extraInvites1 = new AltTestObject(getExtraInvites, [executor, userIDsObject.kennedy, false, false], [], "get extra invites test 1: none")
        altTestWrapper(extraInvites1)

        const result2 =  [userIDsObject.eric, userIDsObject.alayna, userIDsObject.zach].sort()
        const extraInvites2 = new AltTestObject(getExtraInvites, [executor, userIDsObject.kennedy, true, false], result2, "get extra invites test 2: only friends")
        altTestWrapper(extraInvites2)

        const result3 = [userIDsObject.taylor, userIDsObject.maribel].sort()
        const extraInvites3 = new AltTestObject(getExtraInvites, [executor, userIDsObject.kennedy, false, true], result3, "get extra invites test 3: only connections")
        altTestWrapper(extraInvites3)

        const result4 = result2.concat(result3).sort()
        const extraInvites4 = new AltTestObject(getExtraInvites, [executor, userIDsObject.kennedy, true, true], result4, "get extra invites test 4: both friends and connections")
        altTestWrapper(extraInvites4)

        const result5 = []
        const extraInvites5 = new AltTestObject(getExtraInvites, [executor, userIDsObject.unknown, true, true], result5, "get extra invites test 5: has no friends or connections")
        altTestWrapper(extraInvites5)

        const result6 = [userIDsObject.veronica, userIDsObject.taylor]
        const extraInvites6 = new AltTestObject(getExtraInvites, [executor, userIDsObject.francisco, false, true], result6, "get extra invites test 6: has no friends, getting connections")
        altTestWrapper(extraInvites6)

        const result7 = [userIDsObject.frank, userIDsObject.ben]
        const extraInvites7 = new AltTestObject(getExtraInvites, [executor, userIDsObject.joe, true, false], result7, "get extra invites test 7: has no connections, getting friends")
        altTestWrapper(extraInvites7)

        const result8 = []
        const extraInvites8 = new AltTestObject(getExtraInvites, [executor, userIDsObject.francisco, true, false], result8, "get extra invites test 7: has no friends, trying to get friends")
        altTestWrapper(extraInvites8)

        const result9 = []
        const extraInvites9 = new AltTestObject(getExtraInvites, [executor, userIDsObject.joe, false, false], result9, "get extra invites test 7: has no connections, trying to get connections")
        altTestWrapper(extraInvites9)


    })
})

describe("get tests", () => {
    beforeAll(async () => {
        await resetDatabase(executor)
    })

    describe("get events", () => {
        const eventsResult1 = {
            events: [
                {
                    core: {
                        userID: demoEvents[eventIDsObject.one].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.one].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.one].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.one].hostID].fullName,
                        links: null,
                        hasImage: true,
                        relationship: "SELF"
                    },
                    date: demoEvents[eventIDsObject.one].date,
                    eventID: demoEvents[eventIDsObject.one].eventID,
                    description: demoEvents[eventIDsObject.one].description,
                    numberMessages: demoEvents[eventIDsObject.one].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.one].length + 1, // plus one for host
                    numInvited: demoEvents[eventIDsObject.one].invited.length,
                    relationshipToEvent: "HOST",
                },

                {
                    core: {
                        userID: demoEvents[eventIDsObject.two].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.two].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.two].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.two].hostID].fullName,
                        hasImage: true,
                        links: 3,
                        relationship: "CONNECTION"
                    },
                    date: demoEvents[eventIDsObject.two].date,
                    eventID: demoEvents[eventIDsObject.two].eventID,
                    description: demoEvents[eventIDsObject.two].description,
                    numberMessages: demoEvents[eventIDsObject.two].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.two].length + 1,
                    numInvited: demoEvents[eventIDsObject.two].invited.length,
                    relationshipToEvent: "INVITE",
                },

                {
                    core: {
                        userID: demoEvents[eventIDsObject.three].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.three].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.three].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.three].hostID].fullName,
                        links: null,
                        hasImage: false,
                        relationship: "FRIEND"
                    },
                    date: demoEvents[eventIDsObject.three].date,
                    eventID: demoEvents[eventIDsObject.three].eventID,
                    description: demoEvents[eventIDsObject.three].description,
                    numberMessages: demoEvents[eventIDsObject.three].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.three].length + 1,
                    numInvited: demoEvents[eventIDsObject.three].invited.length,
                    relationshipToEvent: "INVITE",
                },

                {
                    core: {
                        userID: demoEvents[eventIDsObject.four].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.four].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.four].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.four].hostID].fullName,
                        hasImage: true,
                        links: 3,
                        relationship: "CONNECTION"
                    },
                    date: demoEvents[eventIDsObject.four].date,
                    eventID: demoEvents[eventIDsObject.four].eventID,
                    description: demoEvents[eventIDsObject.four].description,
                    numberMessages: demoEvents[eventIDsObject.four].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.four].length + 1,
                    numInvited: demoEvents[eventIDsObject.four].invited.length,
                    relationshipToEvent: "INVITE",
                },

                {
                    core: {
                        userID: demoEvents[eventIDsObject.five].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.five].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.five].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.five].hostID].fullName,
                        links: null,
                        hasImage: true,
                        relationship: "FRIEND"
                    },
                    date: demoEvents[eventIDsObject.five].date,
                    eventID: demoEvents[eventIDsObject.five].eventID,
                    description: demoEvents[eventIDsObject.five].description,
                    numberMessages: demoEvents[eventIDsObject.five].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.five].length + 1,
                    numInvited: demoEvents[eventIDsObject.five].invited.length,
                    relationshipToEvent: "INVITE",
                },

                {
                    core: {
                        userID: demoEvents[eventIDsObject.six].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.six].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.six].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.six].hostID].fullName,
                        links: null,
                        hasImage: true,
                        relationship: "FRIEND"
                    },
                    date: demoEvents[eventIDsObject.six].date,
                    eventID: demoEvents[eventIDsObject.six].eventID,
                    description: demoEvents[eventIDsObject.six].description,
                    numberMessages: demoEvents[eventIDsObject.six].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.six].length + 1,
                    numInvited: demoEvents[eventIDsObject.six].invited.length,
                    relationshipToEvent: "INVITE",
                },
            ],
            firstName: demoUsers[userIDsObject.kennedy].firstName,
        }
        const events1 = new Feed(read.getFutureEvents, [userIDsObject.kennedy], eventsResult1, "get events 1: future feed w/ content")
        testWrapper(events1)

        const eventsResult2 = {
            events: [
                {
                    core: {
                        userID: demoEvents[eventIDsObject.one].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.one].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.one].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.one].hostID].fullName,
                        links: null,
                        hasImage: true,
                        relationship: "FRIEND"
                    },
                    date: demoEvents[eventIDsObject.one].date,
                    eventID: demoEvents[eventIDsObject.one].eventID,
                    description: demoEvents[eventIDsObject.one].description,
                    numberMessages: demoEvents[eventIDsObject.one].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.one].length + 1,
                    numInvited: demoEvents[eventIDsObject.one].invited.length,
                    relationshipToEvent: "INVITE",
                },

                {
                    core: {
                        userID: demoEvents[eventIDsObject.two].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.two].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.two].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.two].hostID].fullName,
                        links: null,
                        hasImage: true,
                        relationship: null
                    },
                    date: demoEvents[eventIDsObject.two].date,
                    eventID: demoEvents[eventIDsObject.two].eventID,
                    description: demoEvents[eventIDsObject.two].description,
                    numberMessages: demoEvents[eventIDsObject.two].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.two].length + 1,
                    numInvited: demoEvents[eventIDsObject.two].invited.length,
                    relationshipToEvent: "INVITE",
                },

                {
                    core: {
                        userID: demoEvents[eventIDsObject.six].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.six].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.six].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.six].hostID].fullName,
                        hasImage: true,
                        links: null,
                        relationship: null
                    },
                    date: demoEvents[eventIDsObject.six].date,
                    eventID: demoEvents[eventIDsObject.six].eventID,
                    description: demoEvents[eventIDsObject.six].description,
                    numberMessages: demoEvents[eventIDsObject.six].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.six].length + 1,
                    numInvited: demoEvents[eventIDsObject.six].invited.length,
                    relationshipToEvent: "INVITE",
                },


            ],
            firstName: demoUsers[userIDsObject.johnny].firstName,
        }
        const events2 = new Feed(read.getFutureEvents, [userIDsObject.johnny], eventsResult2, "get events 2: future feed w/ content")
        testWrapper(events2)

        const eventsResult3 = {
            events: [
                {
                    core: {
                        userID: demoEvents[eventIDsObject.seven].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.seven].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.seven].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.seven].hostID].fullName,
                        hasImage: true,
                        links: null,
                        relationship: "FRIEND"
                    },
                    date: demoEvents[eventIDsObject.seven].date,
                    eventID: demoEvents[eventIDsObject.seven].eventID,
                    description: demoEvents[eventIDsObject.seven].description,
                    numberMessages: demoEvents[eventIDsObject.seven].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.seven].length + 1,
                    numInvited: demoEvents[eventIDsObject.seven].invited.length,
                    relationshipToEvent: "ATTEND",
                },

                {
                    core: {
                        userID: demoEvents[eventIDsObject.ten].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.ten].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.ten].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.ten].hostID].fullName,
                        hasImage: true,
                        links: null,
                        relationship: "SELF"
                    },
                    date: demoEvents[eventIDsObject.ten].date,
                    eventID: demoEvents[eventIDsObject.ten].eventID,
                    description: demoEvents[eventIDsObject.ten].description,
                    numberMessages: demoEvents[eventIDsObject.ten].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.ten].length + 1,
                    numInvited: demoEvents[eventIDsObject.ten].invited.length,
                    relationshipToEvent: "HOST",
                },
            ],
            firstName: demoUsers[userIDsObject.kennedy].firstName,
        }
        const events3 = new Feed(read.getPastEvents, [userIDsObject.kennedy, userIDsObject.kennedy], eventsResult3, "get events 3: past feed w/ content")
        testWrapper(events3)

        const eventsResult4 = {
            events: [
                {
                    core: {
                        userID: demoEvents[eventIDsObject.seven].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.seven].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.seven].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.seven].hostID].fullName,
                        hasImage: true,
                        links: null,
                        relationship: "SELF"
                    },
                    date: demoEvents[eventIDsObject.seven].date,
                    eventID: demoEvents[eventIDsObject.seven].eventID,
                    description: demoEvents[eventIDsObject.seven].description,
                    numberMessages: demoEvents[eventIDsObject.seven].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.seven].length + 1,
                    numInvited: demoEvents[eventIDsObject.seven].invited.length,
                    relationshipToEvent: "HOST",
                },
            ],
            firstName: demoUsers[userIDsObject.johnny].firstName,
        }
        const events4 = new Feed(read.getPastEvents, [userIDsObject.johnny, userIDsObject.johnny], eventsResult4, "get events 4: past feed w/ content")
        testWrapper(events4)


        const events5 = new Feed(read.getPastEvents, [userIDsObject.unknown, userIDsObject.unknown], {events: [], firstName: null}, "get events 5: past feed w/ no content") // firstname is null with no events
        testWrapper(events5)

        const events6 = new Feed(read.getFutureEvents, [userIDsObject.unknown], { events: [], firstName: null }, "get events 6: future feeed w/ no content")
        testWrapper(events6)

        const eventsResult7 = {
            events: [
                {
                    core: {
                        userID: demoEvents[eventIDsObject.seven].hostID,
                        firstName: demoUsers[demoEvents[eventIDsObject.seven].hostID].firstName,
                        userName: demoUsers[demoEvents[eventIDsObject.seven].hostID].userName,
                        fullName: demoUsers[demoEvents[eventIDsObject.seven].hostID].fullName,
                        hasImage: true,
                        links: null,
                        relationship: null
                    },
                    date: demoEvents[eventIDsObject.seven].date,
                    eventID: demoEvents[eventIDsObject.seven].eventID,
                    description: demoEvents[eventIDsObject.seven].description,
                    numberMessages: demoEvents[eventIDsObject.seven].numMessages,
                    numMessagesSeen: 0,
                    numAttending: eventsJoinObject[eventIDsObject.seven].length + 1,
                    numInvited: demoEvents[eventIDsObject.seven].invited.length,
                    relationshipToEvent: null,
                },
            ],
            firstName: demoUsers[userIDsObject.leonore].firstName,
        }
        const events7 = new Feed(read.getPastEvents, [userIDsObject.leonore, userIDsObject.johnny], eventsResult7, "get events 7: past feed of different user")
        testWrapper(events7)

    })
    describe("get user", () => {
        const user1Result = {
            core: {
                userID: userIDsObject.kennedy,
                firstName: demoUsers[userIDsObject.kennedy].firstName,
                userName: demoUsers[userIDsObject.kennedy].userName,
                fullName: demoUsers[userIDsObject.kennedy].fullName,
                hasImage: true,
                links: null,
                relationship: "SELF"
            },
            requestStatus: null,
        }
        const user1 = new User(userIDsObject.kennedy, userIDsObject.kennedy, user1Result, "user test 1: viewing self profile")
        testWrapper(user1)

        const user2Result = {
            core: {
                userID: userIDsObject.zach,
                firstName: demoUsers[userIDsObject.zach].firstName,
                userName: demoUsers[userIDsObject.zach].userName,
                fullName: demoUsers[userIDsObject.zach].fullName,
                hasImage: true,
                links: 3,
                relationship: "CONNECTION"
            },
            requestStatus: "RECEIVED",
        }
        const user2 = new User(userIDsObject.kennedy, userIDsObject.zach, user2Result, "user test 2: viewing other profile received request")
        testWrapper(user2)

        const user3Result = {
            core: {
                userID: userIDsObject.veronica,
                firstName: demoUsers[userIDsObject.veronica].firstName,
                userName: demoUsers[userIDsObject.veronica].userName,
                fullName: demoUsers[userIDsObject.veronica].fullName,
                hasImage: true,
                links: 1,
                relationship: "CONNECTION"
            },
            requestStatus: "SENT",
        }
        const user3 = new User(userIDsObject.kennedy, userIDsObject.veronica, user3Result, "user test 3: viewing other profile sent request")
        testWrapper(user3)

        const userResult4 = {
            core: {
                userID: userIDsObject.eric,
                firstName: demoUsers[userIDsObject.eric].firstName,
                userName: demoUsers[userIDsObject.eric].userName,
                fullName: demoUsers[userIDsObject.eric].fullName,
                hasImage: true,
                links: null,
                relationship: "FRIEND"
            },
            requestStatus: null,
        }
        const user4 = new User(userIDsObject.kennedy, userIDsObject.eric, userResult4, "user test 4; viewing other profile friend")
        testWrapper(user4)

        const userResult5 = {
            core: {
                userID: userIDsObject.tyler,
                firstName: demoUsers[userIDsObject.tyler].firstName,
                userName: demoUsers[userIDsObject.tyler].userName,
                fullName: demoUsers[userIDsObject.tyler].fullName,
                hasImage: true,
                links: 3,
                relationship: "CONNECTION"
            },
            requestStatus: null,
        }
        const user5 = new User(userIDsObject.kennedy, userIDsObject.tyler, userResult5, "user test 5: viewing other profile connection")
        testWrapper(user5)

        const userResult6 = {
            core: {
                userID: userIDsObject.unknown,
                firstName: demoUsers[userIDsObject.unknown].firstName,
                userName: demoUsers[userIDsObject.unknown].userName,
                fullName: demoUsers[userIDsObject.unknown].fullName,
                hasImage: true,
                links: null,
                relationship: null
            },
            requestStatus: null,
        }
        const user6 = new User(userIDsObject.kennedy, userIDsObject.unknown, userResult6, "user test 6: viewing unknown profile")
        testWrapper(user6)
    })
    describe("get linking friends", () => {
        // tests for getting linking friend
        const noRelationship = new UserList(read.getLinkingFriends,[userIDsObject.kennedy, userIDsObject.paul], "linking friends test 1: no relationship", { users: [] })
        testWrapper(noRelationship)

        const friend = {
            users: [
                {
                    userID: userIDsObject.sarah,
                    firstName: demoUsers[userIDsObject.sarah].firstName,
                    userName: demoUsers[userIDsObject.sarah].userName,
                    fullName: demoUsers[userIDsObject.sarah].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND"
                },
            ]
        }
        const oneFriend = new UserList(read.getLinkingFriends, [userIDsObject.kennedy, userIDsObject.taylor], "linking friends test 2: one linking friend", friend)
        testWrapper(oneFriend)

        const multipleFriendsResult = {
            users: [
                {
                    userID: userIDsObject.weston,
                    firstName: demoUsers[userIDsObject.weston].firstName,
                    userName: demoUsers[userIDsObject.weston].userName,
                    fullName: demoUsers[userIDsObject.weston].fullName,
                    links: null,
                    hasImage: true,
                    relationship: "FRIEND"
                },

                {
                    userID: userIDsObject.eric,
                    firstName: demoUsers[userIDsObject.eric].firstName,
                    userName: demoUsers[userIDsObject.eric].userName,
                    fullName: demoUsers[userIDsObject.eric].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.sarah,
                    firstName: demoUsers[userIDsObject.sarah].firstName,
                    userName: demoUsers[userIDsObject.sarah].userName,
                    fullName: demoUsers[userIDsObject.sarah].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },
            ]
        }
        const multipleFriends = new UserList(read.getLinkingFriends, [userIDsObject.kennedy, userIDsObject.tyler], "linking friends test 3: multiple linking friends", multipleFriendsResult)
        testWrapper(multipleFriends)

        const selfLinking = new UserList(read.getLinkingFriends, [userIDsObject.kennedy, userIDsObject.kennedy], "linking friends test 3: linking with self", {users: []})
        testWrapper(selfLinking)

        const isFriend = new UserList(read.getLinkingFriends, [userIDsObject.kennedy, userIDsObject.eric], "linking friends test 4: is already friend", { users: [] })
        testWrapper(isFriend)
    })

    describe("get friends", () => {
        const noFriendsTestObj = new UserList(read.getFriends, [userIDsObject.unknown, userIDsObject.unknown], "friends test 1: no friends viewed self", {users: []})
        testWrapper(noFriendsTestObj)

        const noFriendsTestObjOther = new UserList(read.getFriends, [userIDsObject.kennedy, userIDsObject.unknown], "friends test 2: viewed no friends", {users:[]})
        testWrapper(noFriendsTestObjOther)

        const othersFriendsExpected = {
            users: [
                {
                    userID: userIDsObject.montana,
                    firstName: demoUsers[userIDsObject.montana].firstName,
                    userName: demoUsers[userIDsObject.montana].userName,
                    fullName: demoUsers[userIDsObject.montana].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.johnny,
                    firstName: demoUsers[userIDsObject.johnny].firstName,
                    userName: demoUsers[userIDsObject.johnny].userName,
                    fullName: demoUsers[userIDsObject.johnny].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.eric,
                    firstName: demoUsers[userIDsObject.eric].firstName,
                    userName: demoUsers[userIDsObject.eric].userName,
                    fullName: demoUsers[userIDsObject.eric].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.isaac,
                    firstName: demoUsers[userIDsObject.isaac].firstName,
                    userName: demoUsers[userIDsObject.isaac].userName,
                    fullName: demoUsers[userIDsObject.isaac].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },
            ]
        }
        const othersFriends = new UserList(read.getFriends, [userIDsObject.kennedy, userIDsObject.grace], "friends test 3: viewed has friends", othersFriendsExpected)
        testWrapper(othersFriends)

        const othersFriendsResult2 = {
            users: [
                {
                    userID: userIDsObject.eric,
                    firstName: demoUsers[userIDsObject.eric].firstName,
                    userName: demoUsers[userIDsObject.eric].userName,
                    fullName: demoUsers[userIDsObject.eric].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.felix,
                    firstName: demoUsers[userIDsObject.felix].firstName,
                    userName: demoUsers[userIDsObject.felix].userName,
                    fullName: demoUsers[userIDsObject.felix].fullName,
                    hasImage: true,
                    links: 2,
                    relationship: "CONNECTION"
                },
            ]
        }
        const othersFriends2 = new UserList(read.getFriends, [userIDsObject.kennedy, userIDsObject.leonore], "friends test 4: viewed has friends", othersFriendsResult2)
        testWrapper(othersFriends2)

        const otherFriendsResult3  = {
            users: [
                {
                    userID: userIDsObject.kennedy,
                    firstName: demoUsers[userIDsObject.kennedy].firstName,
                    userName: demoUsers[userIDsObject.kennedy].userName,
                    fullName: demoUsers[userIDsObject.kennedy].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "SELF",
                },

                {
                    userID: userIDsObject.grace,
                    firstName: demoUsers[userIDsObject.grace].firstName,
                    userName: demoUsers[userIDsObject.grace].userName,
                    fullName: demoUsers[userIDsObject.grace].fullName,
                    hasImage: true,
                    links: 4,
                    relationship: "CONNECTION",
                },
            ]
        }
        const otherFriends3 = new UserList(read.getFriends, [userIDsObject.kennedy, userIDsObject.montana], "friends test 5: viewed has friends", otherFriendsResult3)
        testWrapper(otherFriends3)


        const selfFriendsResult1 = {
            users: [
                {
                    userID: userIDsObject.montana,
                    firstName: demoUsers[userIDsObject.montana].firstName,
                    userName: demoUsers[userIDsObject.montana].userName,
                    fullName: demoUsers[userIDsObject.montana].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.jose,
                    firstName: demoUsers[userIDsObject.jose].firstName,
                    userName: demoUsers[userIDsObject.jose].userName,
                    fullName: demoUsers[userIDsObject.jose].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND"
                },

                {
                    userID: userIDsObject.johnny,
                    firstName: demoUsers[userIDsObject.johnny].firstName,
                    userName: demoUsers[userIDsObject.johnny].userName,
                    fullName: demoUsers[userIDsObject.johnny].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.eric,
                    firstName: demoUsers[userIDsObject.eric].firstName,
                    userName: demoUsers[userIDsObject.eric].userName,
                    fullName: demoUsers[userIDsObject.eric].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.isaac,
                    firstName: demoUsers[userIDsObject.isaac].firstName,
                    userName: demoUsers[userIDsObject.isaac].userName,
                    fullName: demoUsers[userIDsObject.isaac].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.weston,
                    firstName: demoUsers[userIDsObject.weston].firstName,
                    userName: demoUsers[userIDsObject.weston].userName,
                    fullName: demoUsers[userIDsObject.weston].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND"
                },

                {
                    userID: userIDsObject.alayna,
                    firstName: demoUsers[userIDsObject.alayna].firstName,
                    userName: demoUsers[userIDsObject.alayna].userName,
                    fullName: demoUsers[userIDsObject.alayna].fullName,
                    hasImage: false,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.francisco,
                    firstName: demoUsers[userIDsObject.francisco].firstName,
                    userName: demoUsers[userIDsObject.francisco].userName,
                    fullName: demoUsers[userIDsObject.francisco].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.sarah,
                    firstName: demoUsers[userIDsObject.sarah].firstName,
                    userName: demoUsers[userIDsObject.sarah].userName,
                    fullName: demoUsers[userIDsObject.sarah].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.julia,
                    firstName: demoUsers[userIDsObject.julia].firstName,
                    userName: demoUsers[userIDsObject.julia].userName,
                    fullName: demoUsers[userIDsObject.julia].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.hayden,
                    firstName: demoUsers[userIDsObject.hayden].firstName,
                    userName: demoUsers[userIDsObject.hayden].userName,
                    fullName: demoUsers[userIDsObject.hayden].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

            ]
        }
        const selfFriends1 = new UserList(read.getFriends, [userIDsObject.kennedy, userIDsObject.kennedy], "friends test 6: self has friends", selfFriendsResult1)
        testWrapper(selfFriends1)

        const selfFriendsResult2 = {
            users: [
                {
                    userID: userIDsObject.eric,
                    firstName: demoUsers[userIDsObject.eric].firstName,
                    userName: demoUsers[userIDsObject.eric].userName,
                    fullName: demoUsers[userIDsObject.eric].fullName,
                    links: null,
                    hasImage: true,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.felix,
                    firstName: demoUsers[userIDsObject.felix].firstName,
                    userName: demoUsers[userIDsObject.felix].userName,
                    fullName: demoUsers[userIDsObject.felix].fullName,
                    links: null,
                    hasImage: true,
                    relationship: "FRIEND",
                }
            ]
        }
        const selfFriends2 = new UserList(read.getFriends, [userIDsObject.leonore, userIDsObject.leonore], "friends test 7: self has friends", selfFriendsResult2)
        testWrapper(selfFriends2)
    })
    describe("get connections", () => {
        beforeAll(async () => {
            await beforeAfter.beforeGetConnections(executor)
        })

        const noConnectionsSelfView = new UserList(read.getConnections, [userIDsObject.unknown, userIDsObject.unknown], "connections test 1: no connections self view", {users:[]})
        testWrapper(noConnectionsSelfView)

        const noConnectionsOtherView = new UserList(read.getConnections, [userIDsObject.kennedy, userIDsObject.unknown], "connections test 2: no connections other view", {users:[]})
        testWrapper(noConnectionsOtherView)

        const selfConnectionsResult1 = {
            users: [
                {
                    userID: userIDsObject.tyler,
                    firstName: demoUsers[userIDsObject.tyler].firstName,
                    userName: demoUsers[userIDsObject.tyler].userName,
                    fullName: demoUsers[userIDsObject.tyler].fullName,
                    hasImage: true,
                    links: 3,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.jake,
                    firstName: demoUsers[userIDsObject.jake].firstName,
                    userName: demoUsers[userIDsObject.jake].userName,
                    fullName: demoUsers[userIDsObject.jake].fullName,
                    hasImage: true,
                    links: 2,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.wesley,
                    firstName: demoUsers[userIDsObject.wesley].firstName,
                    userName: demoUsers[userIDsObject.wesley].userName,
                    fullName: demoUsers[userIDsObject.wesley].fullName,
                    hasImage: true,
                    links: 3,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.veronica,
                    firstName: demoUsers[userIDsObject.veronica].firstName,
                    userName: demoUsers[userIDsObject.veronica].userName,
                    fullName: demoUsers[userIDsObject.veronica].fullName,
                    hasImage: true,
                    links: 1,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.grace,
                    firstName: demoUsers[userIDsObject.grace].firstName,
                    userName: demoUsers[userIDsObject.grace].userName,
                    fullName: demoUsers[userIDsObject.grace].fullName,
                    hasImage: true,
                    links: 4,
                    relationship: "CONNECTION"
                },

                {
                    userID: userIDsObject.zach,
                    firstName: demoUsers[userIDsObject.zach].firstName,
                    userName: demoUsers[userIDsObject.zach].userName,
                    fullName: demoUsers[userIDsObject.zach].fullName,
                    hasImage: true,
                    links: 3,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.theodore,
                    firstName: demoUsers[userIDsObject.theodore].firstName,
                    userName: demoUsers[userIDsObject.theodore].userName,
                    fullName: demoUsers[userIDsObject.theodore].fullName,
                    hasImage: true,
                    links: 1,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.felix,
                    firstName: demoUsers[userIDsObject.felix].firstName,
                    userName: demoUsers[userIDsObject.felix].userName,
                    fullName: demoUsers[userIDsObject.felix].fullName,
                    hasImage: true,
                    links: 2,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.elenore,
                    firstName: demoUsers[userIDsObject.elenore].firstName,
                    userName: demoUsers[userIDsObject.elenore].userName,
                    fullName: demoUsers[userIDsObject.elenore].fullName,
                    hasImage: true,
                    links: 1,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.leonore,
                    firstName: demoUsers[userIDsObject.leonore].firstName,
                    userName: demoUsers[userIDsObject.leonore].userName,
                    fullName: demoUsers[userIDsObject.leonore].fullName,
                    hasImage: true,
                    links: 1,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.maribel,
                    firstName: demoUsers[userIDsObject.maribel].firstName,
                    userName: demoUsers[userIDsObject.maribel].userName,
                    fullName: demoUsers[userIDsObject.maribel].fullName,
                    hasImage: true,
                    links: 1,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.taylor,
                    firstName: demoUsers[userIDsObject.taylor].firstName,
                    userName: demoUsers[userIDsObject.taylor].userName,
                    fullName: demoUsers[userIDsObject.taylor].fullName,
                    hasImage: true,
                    links: 1,
                    relationship: "CONNECTION",
                },
            ]
        }
        const selfConnections1 = new UserList(read.getConnections, [userIDsObject.kennedy, userIDsObject.kennedy], "connections test 3: self connections", selfConnectionsResult1)
        testWrapper(selfConnections1)

        const selfConnectionsResult2 = {
            users: [
                {
                    userID: userIDsObject.kennedy,
                    firstName: demoUsers[userIDsObject.kennedy].firstName,
                    userName: demoUsers[userIDsObject.kennedy].userName,
                    fullName: demoUsers[userIDsObject.kennedy].fullName,
                    hasImage: true,
                    links: 1,
                    relationship: "CONNECTION",
                }
            ]
        }
        const selfConnections2 = new UserList(read.getConnections, [userIDsObject.leonore, userIDsObject.leonore], "connections test 4: self connections", selfConnectionsResult2)
        testWrapper(selfConnections2)

        const connectionsResult3 = {
            users: [
                {
                    userID: userIDsObject.ben,
                    firstName: demoUsers[userIDsObject.ben].firstName,
                    userName: demoUsers[userIDsObject.ben].userName,
                    fullName: demoUsers[userIDsObject.ben].fullName,
                    hasImage: true,
                    links: null,
                    relationship: null,
                },

                {
                    userID: userIDsObject.peter,
                    firstName: demoUsers[userIDsObject.peter].firstName,
                    userName: demoUsers[userIDsObject.peter].userName,
                    fullName: demoUsers[userIDsObject.peter].fullName,
                    hasImage: true,
                    links: null,
                    relationship: null,
                },
            ]
        }
        const selfConnections3 = new UserList(read.getConnections, [userIDsObject.kennedy, userIDsObject.nathan], "connections test 5: viewing other's connections", connectionsResult3)
        testWrapper(selfConnections3)


    })


    describe("get invited", () => {

        const resultInvited1 = { users: [] }
        const invitedTestObject1 = new UserList(read.getInvitedToEvent, [userIDsObject.jeremy, eventIDsObject.eight], "invited test 1: no one invited", resultInvited1)
        testWrapper(invitedTestObject1)

        const resultInvited2 = {
            users: [
                {
                    userID: userIDsObject.kennedy,
                    firstName: demoUsers[userIDsObject.kennedy].firstName,
                    userName: demoUsers[userIDsObject.kennedy].userName,
                    fullName: demoUsers[userIDsObject.kennedy].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "SELF",
                },
                {
                    userID: userIDsObject.hayden,
                    firstName: demoUsers[userIDsObject.hayden].firstName,
                    userName: demoUsers[userIDsObject.hayden].userName,
                    fullName: demoUsers[userIDsObject.hayden].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.elenore,
                    firstName: demoUsers[userIDsObject.elenore].firstName,
                    userName: demoUsers[userIDsObject.elenore].userName,
                    fullName: demoUsers[userIDsObject.elenore].fullName,
                    hasImage: true,
                    links: 1,
                    relationship: "CONNECTION",
                },

            ]
        }
        const invitedTestObject2 = new UserList(read.getInvitedToEvent, [userIDsObject.kennedy, eventIDsObject.seven], "invited test 2: 3 people invited, including self", resultInvited2)
        testWrapper(invitedTestObject2)

        const resultInvited3 = {
            users: [
                {
                    userID: userIDsObject.kennedy,
                    firstName: demoUsers[userIDsObject.kennedy].firstName,
                    userName: demoUsers[userIDsObject.kennedy].userName,
                    fullName: demoUsers[userIDsObject.kennedy].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "SELF",
                },

                {
                    userID: userIDsObject.isaac,
                    firstName: demoUsers[userIDsObject.isaac].firstName,
                    userName: demoUsers[userIDsObject.isaac].userName,
                    fullName: demoUsers[userIDsObject.isaac].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.johnny,
                    firstName: demoUsers[userIDsObject.johnny].firstName,
                    userName: demoUsers[userIDsObject.johnny].userName,
                    fullName: demoUsers[userIDsObject.johnny].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.jake,
                    firstName: demoUsers[userIDsObject.jake].firstName,
                    userName: demoUsers[userIDsObject.jake].userName,
                    fullName: demoUsers[userIDsObject.jake].fullName,
                    hasImage: true,
                    links: 2,
                    relationship: "CONNECTION",
                },
                {
                    userID: userIDsObject.alayna,
                    firstName: demoUsers[userIDsObject.alayna].firstName,
                    userName: demoUsers[userIDsObject.alayna].userName,
                    fullName: demoUsers[userIDsObject.alayna].fullName,
                    hasImage: false,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.grace,
                    firstName: demoUsers[userIDsObject.grace].firstName,
                    userName: demoUsers[userIDsObject.grace].userName,
                    fullName: demoUsers[userIDsObject.grace].fullName,
                    hasImage: true,
                    links: 4,
                    relationship: "CONNECTION",
                },
            ]
        }
        const invitedTestObject3 = new UserList(read.getInvitedToEvent, [userIDsObject.kennedy, eventIDsObject.six], "invited test 3: many people, invite and dismissed", resultInvited3)
        testWrapper(invitedTestObject3)

    })
    describe("get attending", () => {
        const attendingTestResult1 = {
            users: [
                {
                    userID: userIDsObject.alayna,
                    firstName: demoUsers[userIDsObject.alayna].firstName,
                    userName: demoUsers[userIDsObject.alayna].userName,
                    fullName: demoUsers[userIDsObject.alayna].fullName,
                    hasImage: false,
                    links: null,
                    relationship: null,
                },
            ]
        }
        const attendingTestObject1 = new UserList(read.getAttendingEvent, [userIDsObject.felix, eventIDsObject.three], "attending test 1: only host is attending event", attendingTestResult1)
        testWrapper(attendingTestObject1)

        const attendingTestResult2 = {
            users: [
                {
                    userID: userIDsObject.kennedy,
                    firstName: demoUsers[userIDsObject.kennedy].firstName,
                    userName: demoUsers[userIDsObject.kennedy].userName,
                    fullName: demoUsers[userIDsObject.kennedy].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.johnny,
                    firstName: demoUsers[userIDsObject.johnny].firstName,
                    userName: demoUsers[userIDsObject.johnny].userName,
                    fullName: demoUsers[userIDsObject.johnny].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "SELF",
                },

            ]
        }
        const attendingTestObject2 = new UserList(read.getAttendingEvent, [userIDsObject.johnny, eventIDsObject.seven], "attending test 2: one person attending event plus host", attendingTestResult2)
        testWrapper(attendingTestObject2)

        const attendingTestResult3 = {
            users: [
                {
                    userID: userIDsObject.jake,
                    firstName: demoUsers[userIDsObject.jake].firstName,
                    userName: demoUsers[userIDsObject.jake].userName,
                    fullName: demoUsers[userIDsObject.jake].fullName,
                    hasImage: true,
                    links: 2,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.alayna,
                    firstName: demoUsers[userIDsObject.alayna].firstName,
                    userName: demoUsers[userIDsObject.alayna].userName,
                    fullName: demoUsers[userIDsObject.alayna].fullName,
                    hasImage: false,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.eric,
                    firstName: demoUsers[userIDsObject.eric].firstName,
                    userName: demoUsers[userIDsObject.eric].userName,
                    fullName: demoUsers[userIDsObject.eric].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                }
            ]
        }
        const attendingTestObject3 = new UserList(read.getAttendingEvent, [userIDsObject.kennedy, eventIDsObject.six], "attending test 3: multiple people attending event", attendingTestResult3)
        testWrapper(attendingTestObject3)

    })
    describe("searching", () => {
        const searchResult1 = {
            users: [
                {
                    userID: userIDsObject.kennedy,
                    firstName: demoUsers[userIDsObject.kennedy].firstName,
                    userName: demoUsers[userIDsObject.kennedy].userName,
                    fullName: demoUsers[userIDsObject.kennedy].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "SELF",
                }
            ]
        }
        const searchObject1 = new Search(userIDsObject.kennedy, "Kenn*", "search test 1: searching for yourself", searchResult1)
        testWrapper(searchObject1)

        const searchResult2 = {
            users: []
        }
        const searchObject2 = new Search(userIDsObject.francisco, "39201*", "search test 2: searching for no one", searchResult2)
        testWrapper(searchObject2)

        const searchResult3 = {
            users: [
                {
                    userID: userIDsObject.jake,
                    firstName: demoUsers[userIDsObject.jake].firstName,
                    userName: demoUsers[userIDsObject.jake].userName,
                    fullName: demoUsers[userIDsObject.jake].fullName,
                    hasImage: true,
                    links: 2,
                    relationship: "CONNECTION",
                },

                {
                    userID: userIDsObject.julia,
                    firstName: demoUsers[userIDsObject.julia].firstName,
                    userName: demoUsers[userIDsObject.julia].userName,
                    fullName: demoUsers[userIDsObject.julia].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.jeremy,
                    firstName: demoUsers[userIDsObject.jeremy].firstName,
                    userName: demoUsers[userIDsObject.jeremy].userName,
                    fullName: demoUsers[userIDsObject.jeremy].fullName,
                    hasImage: true,
                    links: null,
                    relationship: null,
                },

                {
                    userID: userIDsObject.jose,
                    firstName: demoUsers[userIDsObject.jose].firstName,
                    userName: demoUsers[userIDsObject.jose].userName,
                    fullName: demoUsers[userIDsObject.jose].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.joe,
                    firstName: demoUsers[userIDsObject.joe].firstName,
                    userName: demoUsers[userIDsObject.joe].userName,
                    fullName: demoUsers[userIDsObject.joe].fullName,
                    hasImage: true,
                    links: null,
                    relationship: null,
                },

                {
                    userID: userIDsObject.johnny,
                    firstName: demoUsers[userIDsObject.johnny].firstName,
                    userName: demoUsers[userIDsObject.johnny].userName,
                    fullName: demoUsers[userIDsObject.johnny].fullName,
                    hasImage: true,
                    links: null,
                    relationship: "FRIEND",
                },

                {
                    userID: userIDsObject.wesley,
                    firstName: demoUsers[userIDsObject.wesley].firstName,
                    userName: demoUsers[userIDsObject.wesley].userName,
                    fullName: demoUsers[userIDsObject.wesley].fullName,
                    hasImage: true,
                    links: 3,
                    relationship: "CONNECTION",
                },
            ]
        }
        const searchObject3 = new Search(userIDsObject.kennedy, "j*", "search test 3: searching for everyone with j", searchResult3)
        testWrapper(searchObject3)
    })
})


// describe("groups and events", () => {
//     const groupInviteResult1 = null
//     const groupInviteTestObj1 = new TestObject(inviteGroupToEvent, getGroupEventRelationship, [userIDsObject.unknown, eventIDsObject.one, [groupIDsObject.one]],
//         [eventIDsObject.one, groupIDsObject.one], processRelationship, groupInviteResult1, "group invite test 1: unknown can't invite", "String Array")
//     testWrapper(groupInviteTestObj1)
//
//     const groupInviteResult2 = null
//     const groupInviteTestObj2 = new TestObject(inviteGroupToEvent, getGroupEventRelationship, [userIDsObject.alayna, eventIDsObject.one, [groupIDsObject.one]],
//         [eventIDsObject.one, groupIDsObject.one], processRelationship, groupInviteResult2, "group invite test 2: attending can't invite", "String Array")
//     testWrapper(groupInviteTestObj2)
//
//     const groupInviteResult3 = ["GROUP_INVITE"]
//     const groupInviteTestObj3 = new TestObject(inviteGroupToEvent, getGroupEventRelationship, [userIDsObject.kennedy, eventIDsObject.one, [groupIDsObject.one]],
//         [eventIDsObject.one, groupIDsObject.one], processRelationship, groupInviteResult3, "group invite test 3: host can invite", "String Array")
//     testWrapper(groupInviteTestObj3)
//
//     const groupInviteResult4 = null
//     const groupInviteTestObj4 = new TestObject(deleteGroupEventRelationship, getGroupEventRelationship,
//         [eventIDsObject.one, groupIDsObject.one], [eventIDsObject.one, groupIDsObject.one],
//         processRelationship, groupInviteResult4, "group invite test 4: you can delete relationship", "String Array")
//     testWrapper(groupInviteTestObj4)
//
//     const groupInviteResult5 = ["GROUP_INVITE"]
//     const groupInviteTestObj5 = new TestObject(inviteGroupToEvent, getGroupEventRelationship,
//         [userIDsObject.kennedy, eventIDsObject.one, [groupIDsObject.one, groupIDsObject.two]], [eventIDsObject.one, groupIDsObject.two],
//         processRelationship, groupInviteResult5, "group invite test 5: invite multiple groups", "String Array")
//     testWrapper(groupInviteTestObj5)
//
//     const groupInviteResult6 = ["GROUP_INVITE"]
//     const groupInviteTestObj6 = new TestObject(null, getGroupEventRelationship,
//         null, [eventIDsObject.one, groupIDsObject.one],
//         processRelationship, groupInviteResult6, "group invite test 6: other group is invited", "String Array")
//     testWrapper(groupInviteTestObj6)
//
//
//
//
// })



// describe("group action", () => {
//
//     const groupActionTestObject1 = new TestObject(addPersonToGroup, getGroupRelationship,
//         [userIDsObject.kennedy, groupIDsObject.two, userIDsObject.felix],
//         [userIDsObject.felix, groupIDsObject.two], processRelationship, ["GROUP_MEMBER_REQUEST"],
//         "group action test 1: member inviting new person", "String Array")
//     testWrapper(groupActionTestObject1)
//
//     const groupActionTestObject2 = new TestObject(addPersonToGroup, getGroupRelationship,
//         [userIDsObject.kennedy, groupIDsObject.one, userIDsObject.taylor], [userIDsObject.taylor, groupIDsObject.one],
//         processRelationship, ["GROUP_MEMBER_REQUEST"], "group action test 2: creator inviting new person", "String Array")
//     testWrapper(groupActionTestObject2)
//
//     const groupActionTestObject2_5 = new TestObject(addPersonToGroup, getGroupRelationship,
//         [userIDsObject.kennedy, groupIDsObject.one, userIDsObject.felix], [userIDsObject.felix, groupIDsObject.one],
//         processRelationship, ["GROUP_MEMBER_REQUEST"], "group action test 2.5: creator merging requests", "String Array")
//     testWrapper(groupActionTestObject2_5)
//
//     const groupActionTestObject3 = new TestObject(addPersonToGroup, getGroupRelationship,
//         [userIDsObject.jeremy, groupIDsObject.one, userIDsObject.hayden], [userIDsObject.hayden, groupIDsObject.one],
//         processRelationship, null, "group action test 3: random person can't invite new people", "String Array")
//     testWrapper(groupActionTestObject3)
//
//
//     const groupActionTestObject4 = new TestObject(removePersonFromGroup, getGroupRelationship,
//         [userIDsObject.kennedy, groupIDsObject.two, userIDsObject.francisco], [userIDsObject.francisco, groupIDsObject.two],
//         processRelationship, ["GROUP_MEMBER"], "group action test 4: member can't remove other member", "String Array")
//     testWrapper(groupActionTestObject4)
//
//     const groupActionTestObject5 = new TestObject(removePersonFromGroup, getGroupRelationship,
//         [userIDsObject.hayden, groupIDsObject.two, userIDsObject.francisco], [userIDsObject.francisco, groupIDsObject.two],
//         processRelationship, null, "group action test 5: creator can remove other member", "String Array")
//     testWrapper(groupActionTestObject5)
//
//     const groupActionTestObject6 = new TestObject(removePersonFromGroup, getGroupRelationship,
//         [userIDsObject.peter, groupIDsObject.two, userIDsObject.jose], [userIDsObject.jose, groupIDsObject.two],
//         processRelationship, ["GROUP_MEMBER"], "group action test 6: random person can't remove member", "String Array")
//     testWrapper(groupActionTestObject6)
//
//
//     const groupActionTestObject7 = new TestObject(guardJoinGroup, getGroupRelationship,
//         [userIDsObject.taylor, groupIDsObject.one], [userIDsObject.taylor, groupIDsObject.one],
//         processRelationship, ["GROUP_MEMBER"], "group action test 7: accepting group request from member", "String Array")
//     testWrapper(groupActionTestObject7)
//
//
//     const groupActionTestObject8 = new TestObject(guardJoinGroup, getGroupRelationship,
//         [userIDsObject.peter, groupIDsObject.two], [userIDsObject.peter, groupIDsObject.two],
//         processRelationship, null, "group action test 8: random person can't join group", "String Array")
//     testWrapper(groupActionTestObject8)
//
//     const groupActionTestObject8_5 = new TestObject(leaveGroup, getGroupRelationship, [userIDsObject.taylor, groupIDsObject.one],
//         [userIDsObject.taylor, groupIDsObject.one], processRelationship, null, "group test 8.5: leaving group")
//     testWrapper(groupActionTestObject8_5)
//
//     const groupActionTestObject8_75 = new TestObject(leaveGroup, getGroupRelationship,
//         [userIDsObject.kennedy, groupIDsObject.one],
//         [userIDsObject.kennedy, groupIDsObject.one],
//         processRelationship, ["GROUP_CREATOR"], "group test 8.75: creator can't leave group, can only delete")
//     testWrapper(groupActionTestObject8_75)
//
//     const groupActionTestObject9 = new TestObject(deleteGroupRequest, getGroupRelationship,
//         [userIDsObject.felix, groupIDsObject.two], [userIDsObject.felix, groupIDsObject.two],
//         processRelationship, ["GROUP_MEMBER_REQUEST_DELETED"], "group action test 9: deleting group member request", "String Array")
//     testWrapper(groupActionTestObject9)
//
//     const groupActionTestObject10 = new TestObject(deleteGroup, getGroupRelationship,
//         [userIDsObject.kennedy, groupIDsObject.three], [userIDsObject.kennedy, groupIDsObject.three],
//         processRelationship, ["GROUP_MEMBER"], "group action test 10: member can't delete group", "String Array")
//     testWrapper(groupActionTestObject10)
//
//     const groupActionTestObject11 = new TestObject(deleteGroup, getGroupRelationship,
//         [userIDsObject.tyler, groupIDsObject.three], [userIDsObject.tyler, groupIDsObject.three],
//         processRelationship, null, "group action test 11: creator can delete group", "String Array")
//     testWrapper(groupActionTestObject11)
//
//     let currentDate = getCurrentDate()
//     const groupNewMessageResult = {
//         groups: [
//             {
//                 groupID: groupIDsObject.two,
//                 groupName: demoGroups[groupIDsObject.two].name,
//                 mostRecentMessage: "Hi guys!",
//                 mostRecentMessageDate: currentDate,
//                 relationshipToGroup: "GROUP_MEMBER",
//                 numMembers: demoGroups[groupIDsObject.two].members.length, // francisco was kicked out
//             },
//         ]
//     }
//     const groupActionTestObject12 = new TestObject(updateMessagesGroup, getGroups,
//         [userIDsObject.veronica, groupIDsObject.two, "Hi guys!", currentDate], [userIDsObject.veronica,  userIDsObject.two],
//         processGroups, groupNewMessageResult, "group action test 12: new most recent message works on null", "groups")
//     testWrapper(groupActionTestObject12)
//
//     currentDate = getCurrentDate()
//     const groupNewMessageResult2 = {
//         groups:
//             [
//                 {
//                     groupID: groupIDsObject.one,
//                     groupName: demoGroups[groupIDsObject.one].name,
//                     mostRecentMessage: "How's it going",
//                     mostRecentMessageDate: currentDate,
//                     relationshipToGroup: "GROUP_MEMBER",
//                     numMembers: demoGroups[groupIDsObject.one].members.length + 1,
//                 },
//             ]
//
//     }
//     const groupActionTestObject13 = new TestObject(updateMessagesGroup, getGroups,
//         [userIDsObject.sarah, groupIDsObject.one, "How's it going", currentDate], [userIDsObject.sarah,  userIDsObject.one],
//         processGroups, groupNewMessageResult2, "group action test 13: new most recent message works on strings", "groups")
//     testWrapper(groupActionTestObject13)
//
//
//
// })
// describe("group uniqueness", () => {
//     const groupUniqResult1 = 1
//     const newGroupParams = [userIDsObject.frank, "groupID-1231231848393", "", [userIDsObject.peter,  userIDsObject.ben]]
//     const groupUniqTestObj1 = new TestObject(createGroup, getNumGroups, newGroupParams, ["groupID-1231231848393"],
//         processNumberOfRecords, groupUniqResult1, "group unique test 1: creating new group")
//     testWrapper(groupUniqTestObj1)
//
//     const groupUniqResult2 = 1
//     const groupUniqTestObj2 = new TestObject(createGroup, getNumGroups, newGroupParams, ["groupID-1231231848393"],
//         processNumberOfRecords, groupUniqResult2, "group unique test 2: still one group")
//     testWrapper(groupUniqTestObj2)
//
//     const groupUniqResult3 = ["group name"]
//     const newGroupParams2 = [userIDsObject.frank, "groupID-1231231848393", "group name", [userIDsObject.peter,  userIDsObject.ben]]
//     const groupUniqTestObj3 = new TestObject(createGroup, getGroupName, newGroupParams2, ["groupID-1231231848393"],
//         processRelationship, groupUniqResult3, "group unique test 2: still one group")
//     testWrapper(groupUniqTestObj3)
//
//     const groupUniqResult4 = 3
//     const newGroupParams3 = [userIDsObject.frank, "groupID-1231231848393", "group name", [userIDsObject.peter,  userIDsObject.ben, userIDsObject.caroline]]
//     const groupUniqTestObj4 = new TestObject(createGroup, getNumInvitedGroup, newGroupParams3, ["groupID-1231231848393"],
//         processNumberOfRecords, groupUniqResult4, "group unique test 2: still one group")
//     testWrapper(groupUniqTestObj4)
//
// })


// describe("get groups", () => {
//     const groupsResult1 = { groups: [] }
//     const groupsTestObject1 = new Groups(userIDsObject.unknown, groupsResult1, "group test 1: no groups")
//     testWrapper(groupsTestObject1)
//
//     const groupsResult2 = {
//         groups: [
//             {
//                 groupID: groupIDsObject.one,
//                 groupName: demoGroups[groupIDsObject.one].name,
//                 mostRecentMessage: demoGroups[groupIDsObject.one].message,
//                 mostRecentMessageDate: demoGroups[groupIDsObject.one].date,
//                 relationshipToGroup: "GROUP_CREATOR",
//                 numMembers: demoGroups[groupIDsObject.one].members.length + 1,
//             },
//
//             {
//                 groupID: groupIDsObject.two,
//                 groupName: demoGroups[groupIDsObject.two].name,
//                 mostRecentMessage: demoGroups[groupIDsObject.two].message,
//                 mostRecentMessageDate: demoGroups[groupIDsObject.two].date,
//                 numMembers: demoGroups[groupIDsObject.two].members.length + 1,
//                 relationshipToGroup: "GROUP_MEMBER",
//             },
//
//             {
//                 groupID: groupIDsObject.three,
//                 groupName: demoGroups[groupIDsObject.three].name,
//                 mostRecentMessage: demoGroups[groupIDsObject.three].message,
//                 mostRecentMessageDate: demoGroups[groupIDsObject.three].date,
//                 numMembers: demoGroups[groupIDsObject.three].members.length + 1,
//                 relationshipToGroup: "GROUP_MEMBER",
//             },
//         ]
//     }
//     const groupsTestObject2 = new Groups(userIDsObject.kennedy, groupsResult2, "group test 2: multiple groups, member and creator")
//     testWrapper(groupsTestObject2)
//
//     const groupsResult3 = {
//         groups: [
//             {
//                 groupID: groupIDsObject.one,
//                 groupName: demoGroups[groupIDsObject.one].name,
//                 mostRecentMessage: demoGroups[groupIDsObject.one].message,
//                 mostRecentMessageDate: demoGroups[groupIDsObject.one].date,
//                 numMembers: demoGroups[groupIDsObject.one].members.length + 1,
//                 relationshipToGroup: "GROUP_MEMBER",
//             },
//         ]
//     }
//     const groupsTestObject3 = new Groups(userIDsObject.sarah, groupsResult3, "groups test 3: one group, different perspective")
//     testWrapper(groupsTestObject3)
//
//     const groupsResult4 = {
//         groups: [
//             {
//                 groupID: groupIDsObject.one,
//                 groupName: demoGroups[groupIDsObject.one].name,
//                 mostRecentMessage: demoGroups[groupIDsObject.one].message,
//                 mostRecentMessageDate: demoGroups[groupIDsObject.one].date,
//                 numMembers: demoGroups[groupIDsObject.one].members.length + 1,
//                 relationshipToGroup: "GROUP_MEMBER",
//             },
//
//             {
//                 groupID: groupIDsObject.three,
//                 groupName: demoGroups[groupIDsObject.three].name,
//                 mostRecentMessage: demoGroups[groupIDsObject.three].message,
//                 mostRecentMessageDate: demoGroups[groupIDsObject.three].date,
//                 numMembers: demoGroups[groupIDsObject.three].members.length + 1,
//                 relationshipToGroup: "GROUP_MEMBER",
//             },
//         ]
//     }
//     const groupsTestObject4 = new Groups(userIDsObject.julia, groupsResult4, "groups test 4: two groups, both member")
//     testWrapper(groupsTestObject4)
//
//
//
// })
// describe("get group members", () => {
//     const groupMembersResult1 = {
//         users: []
//     }
//     const groupMembersTestObject1 = new UserList(getGroupMembers, [userIDsObject.unknown, groupIDsObject.one],
//         "group members test 1: no result if not part of group", groupMembersResult1)
//     testWrapper(groupMembersTestObject1)
//
//     const groupMembersResult2 = {
//         users: [
//             {
//                 userID: userIDsObject.kennedy,
//                 firstName: demoUsers[userIDsObject.kennedy].firstName,
//                 lastName: demoUsers[userIDsObject.kennedy].lastName,
//                 userName: demoUsers[userIDsObject.kennedy].userName,
//                 fullName: demoUsers[userIDsObject.kennedy].fullName,
//                 phoneNumber: demoUsers[userIDsObject.kennedy].phoneNumber,
//                 links: null,
//                 relationship: "SELF",
//             },
//             {
//                 userID: userIDsObject.sarah,
//                 firstName: demoUsers[userIDsObject.sarah].firstName,
//                 lastName: demoUsers[userIDsObject.sarah].lastName,
//                 userName: demoUsers[userIDsObject.sarah].userName,
//                 fullName: demoUsers[userIDsObject.sarah].fullName,
//                 phoneNumber: demoUsers[userIDsObject.sarah].phoneNumber,
//                 links: null,
//                 relationship: "FRIEND",
//             },
//
//             {
//                 userID: userIDsObject.julia,
//                 firstName: demoUsers[userIDsObject.julia].firstName,
//                 lastName: demoUsers[userIDsObject.julia].lastName,
//                 userName: demoUsers[userIDsObject.julia].userName,
//                 fullName: demoUsers[userIDsObject.julia].fullName,
//                 phoneNumber: demoUsers[userIDsObject.julia].phoneNumber,
//                 links: null,
//                 relationship: "FRIEND",
//             },
//
//             {
//                 userID: userIDsObject.alayna,
//                 firstName: demoUsers[userIDsObject.alayna].firstName,
//                 lastName: demoUsers[userIDsObject.alayna].lastName,
//                 userName: demoUsers[userIDsObject.alayna].userName,
//                 fullName: demoUsers[userIDsObject.alayna].fullName,
//                 phoneNumber: demoUsers[userIDsObject.alayna].phoneNumber,
//                 links: null,
//                 relationship: "FRIEND",
//             },
//
//         ]
//     }
//     const groupMembersTestObject2 = new UserList(getGroupMembers, [userIDsObject.kennedy, groupIDsObject.one], "group members test 2: works for creator", groupMembersResult2)
//     testWrapper(groupMembersTestObject2)
//
//     const groupMembersResult3 = {
//         users: [
//             {
//                 userID: userIDsObject.kennedy,
//                 firstName: demoUsers[userIDsObject.kennedy].firstName,
//                 lastName: demoUsers[userIDsObject.kennedy].lastName,
//                 userName: demoUsers[userIDsObject.kennedy].userName,
//                 fullName: demoUsers[userIDsObject.kennedy].fullName,
//                 phoneNumber: demoUsers[userIDsObject.kennedy].phoneNumber,
//                 links: null,
//                 relationship: "FRIEND",
//             },
//             {
//                 userID: userIDsObject.sarah,
//                 firstName: demoUsers[userIDsObject.sarah].firstName,
//                 lastName: demoUsers[userIDsObject.sarah].lastName,
//                 userName: demoUsers[userIDsObject.sarah].userName,
//                 fullName: demoUsers[userIDsObject.sarah].fullName,
//                 phoneNumber: demoUsers[userIDsObject.sarah].phoneNumber,
//                 links: null,
//                 relationship: "SELF",
//             },
//
//             {
//                 userID: userIDsObject.julia,
//                 firstName: demoUsers[userIDsObject.julia].firstName,
//                 lastName: demoUsers[userIDsObject.julia].lastName,
//                 userName: demoUsers[userIDsObject.julia].userName,
//                 fullName: demoUsers[userIDsObject.julia].fullName,
//                 phoneNumber: demoUsers[userIDsObject.julia].phoneNumber,
//                 links: null,
//                 relationship: null,
//             },
//
//             {
//                 userID: userIDsObject.alayna,
//                 firstName: demoUsers[userIDsObject.alayna].firstName,
//                 lastName: demoUsers[userIDsObject.alayna].lastName,
//                 userName: demoUsers[userIDsObject.alayna].userName,
//                 fullName: demoUsers[userIDsObject.alayna].fullName,
//                 phoneNumber: demoUsers[userIDsObject.alayna].phoneNumber,
//                 links: null,
//                 relationship: null,
//             },
//         ]
//     }
//     const groupMembersTestObject3 = new UserList(getGroupMembers, [userIDsObject.sarah, groupIDsObject.one], "group members test 3: works for member, same group", groupMembersResult3)
//     testWrapper(groupMembersTestObject3)
//
//
// })

// const editUserResult = {
//     core: {
//         userID: uid,
//         userName: "new-userName",
//         firstName: "new-firstName",
//         fullName: "new-fullName",
//         hasImage: true,
//         links: null,
//         relationship: "SELF",
//     },
//     requestStatus: null
// }
// const editUserObj = new TestObject(write.editUser, read.getUser, [uid, "new-firstName", "new-lastName", "new-userName", "new-fullName", true],
//     [uid, uid], proc.processUser, editUserResult, "edit user test", "user")
// testWrapper(editUserObj)


// const addConnection3 = new UserRelationship(write.addConnection, userIDsObject.joe, userIDsObject.nathan, "already friend", ['FRIEND'])
// testWrapper(addConnection3)


// add create event later for thoroughness

// describe("adding connection and edge cases", () => {
//     beforeAll(async () => {
//         await beforeAfter.beforeAddingConnections(executor)
//     })
//
//     const addConnection1 = new UserRelationship(write.addConnection, userIDsObject.joe, userIDsObject.peter, "re adding single connection friend removal", ["CONNECTION"])
//     testWrapper(addConnection1)
//
//     const addConnection2 = new UserRelationship(write.addConnection, userIDsObject.joe, userIDsObject.alex, "no relationship", null)
//     testWrapper(addConnection2)
//
//
//
//     const franksConnections = {
//         users: []
//     }
//     const addConnectionsSelf = new Connections(userIDsObject.frank, userIDsObject.frank, "can't add to self", franksConnections)
//     testWrapper(addConnectionsSelf)
//
//     const eventConnection = new EventRelationship(write.addConnections, userIDsObject.alex, "eventID", "cam't add connections with respect to event", null)
//     testWrapper(eventConnection)
//
//     const groupConnection = new GroupRelationship(write.addConnections, userIDsObject.alex, "groupID", "can't add connections with respect to group", null)
//     testWrapper(groupConnection)
//
// })