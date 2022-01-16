const read = {
    // user

    getUser: function(tx, userID, viewedID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID}) " +
            "MATCH (user:USER {userID: $viewedID}) " +
            "OPTIONAL MATCH (self)-[r1:FRIEND|CONNECTION]-(user) " +
            "OPTIONAL MATCH (self)-[r2:FRIEND_REQUEST]-(user) " +
            "RETURN user, TYPE(r1), r1.links, startNode(r2) = self",
            {"userID": userID, "viewedID": viewedID})
    },


    getName: function(tx, userID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID}) " +
            "RETURN self.name ",
            {"userID": userID})
    },

    checkIfUserNameExists: function(tx, userName) {
        return tx.run("" +
            "MATCH (user:USER {userName: $userName}) " +
            "RETURN user",
            {"userName": userName})
    },

    checkIfUserIDExists: function(tx, userID) {
        return tx.run("" +
            "MATCH (user:USER {userID: $userID}) " +
            "RETURN user ",
            {"userID": userID})
    },

    // user list
    getFriends: function(tx, userID, viewedUserID) {
        return tx.run("MATCH (viewed:USER {userID: $viewedUserID})-[:FRIEND]-(other:USER) " +
            "OPTIONAL MATCH (self:USER {userID: $userID})-[r:FRIEND|CONNECTION]-(other) " +
            "RETURN other, TYPE(r), r.links",
            {'userID': userID, "viewedUserID": viewedUserID})
    },

    getConnections: function(tx, userID, viewedUserID) {
        return tx.run("MATCH (viewed:USER {userID: $viewedUserID})-[:CONNECTION]-(other:USER) " +
            "OPTIONAL MATCH (self:USER {userID: $userID})-[r:FRIEND|CONNECTION]-(other) " +
            "RETURN other, TYPE(r), r.links",
            {"userID": userID, "viewedUserID": viewedUserID})
    },

    getSentRequests: function(tx, userID) {
        return tx.run("MATCH (self:USER {userID: $userID})-[:FRIEND_REQUEST]->(other:USER) " +
            "OPTIONAL MATCH (self)-[r:FRIEND|CONNECTION]-(other) " +
            "RETURN other, TYPE(r), r.links",
            {"userID": userID})
    },

    getReceivedRequests: function(tx, userID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})<-[:FRIEND_REQUEST]-(other:USER) " +
            "OPTIONAL MATCH (self)-[r:FRIEND|CONNECTION]-(other)" +
            "RETURN other, TYPE(r), r.links",
            {"userID": userID})
    },

    getInvitedToEvent: function(tx, userID, eventID) {
        return tx.run("MATCH (event:EVENT {eventID: $eventID})-[:INVITE|ATTEND|DISMISSED]-(other:USER) " +
            "MATCH (self:USER {userID: $userID}) " +
            "OPTIONAL MATCH (self)-[r:FRIEND|CONNECTION]-(other) " +
            "RETURN other, TYPE(r), r.links",
            {"userID": userID, "eventID": eventID}
        )
    },

    getAttendingEvent: function(tx, userID, eventID) {
        return tx.run("MATCH (event:EVENT {eventID: $eventID})-[:ATTEND|HOST]-(other:USER) " +
            "MATCH (self:USER {userID: $userID}) " +
            "OPTIONAL MATCH (self)-[r:FRIEND|CONNECTION]-(other) " +
            "RETURN other, TYPE(r), r.links",
            {"userID": userID, "eventID": eventID})
    },

    getLinkingFriends: function(tx, userID, otherUserID) {
        return tx.run("MATCH (self:USER {userID: $userID})-[:FRIEND]-(linkingFriend:USER)-[:FRIEND]-(other:USER {userID: $otherUserID}) " +
            "RETURN linkingFriend, \"FRIEND\", null",
            {"userID": userID, "otherUserID": otherUserID})
    },

    userSearch: function(tx, userID, searchTerm) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID}) " +
            "CALL db.index.fulltext.queryNodes(\"userSearch\", $searchTerm) " +
            "yield node, score " +
            "OPTIONAL MATCH (self)-[r:FRIEND|CONNECTION]-(node) " +
            "RETURN node, TYPE(r), r.links " +
            "LIMIT 5 ",
            {"userID": userID, "searchTerm": searchTerm})
    },


    // events

    getPastEvents: function(tx, userID, viewedID, currentDate) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID}) " +
            "MATCH (user:USER {userID: $viewedID})-[:ATTEND|HOST]-(event:EVENT) " +
            "WHERE event.date < $currentDate " +
            "OPTIONAL MATCH (self)-[r1:ATTEND|HOST]-(event:EVENT) "+
            "MATCH (event)-[:HOST]-(host:USER) " +
            "OPTIONAL MATCH (self)-[r2:FRIEND|CONNECTION]-(host) " +
            "RETURN event, host, TYPE(r1), r1.numSeen, TYPE(r2), r2.links, self.firstName " +
            "ORDER BY event.date DESC " +
            "LIMIT 5 ",
            {"userID": userID, "viewedID": viewedID, "currentDate": currentDate})
    },

    getFutureEvents: function(tx, userID, currentDate) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[r1:ATTEND|HOST|INVITE]-(event:EVENT) " +
            "WHERE event.date > $currentDate " +
            "MATCH (event)-[:HOST]-(host:USER) " +
            "OPTIONAL MATCH (self)-[r2:FRIEND|CONNECTION]-(host) " +
            "RETURN event, host, TYPE(r1), r1.numSeen, TYPE(r2), r2.links, self.firstName " + // we need first name for chat
            "ORDER BY event.date DESC",
            {"userID": userID, "currentDate": currentDate})
    },

    getConnectionUserIDs: function(tx, userID) { // used only to invite all friends in case
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[:CONNECTION]-(connection:USER)" +
            "RETURN connection.userID",
            {"userID": userID})
    },

    getFriendUserIDs: function(tx, userID) { // used only to invite all friends in case
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[:FRIEND]-(friend:USER)" +
            "RETURN friend.userID",
            {"userID": userID})
    },



}

module.exports = { read }