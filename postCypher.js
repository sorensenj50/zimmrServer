const write = {
    createUser: function(tx, userID, firstName, userName, fullName, hasImage,  phoneNumber, creationDate) {
        return tx.run("" +
            "MERGE (self:USER {userID: $userID}) " +
            "SET self.firstName = $firstName, " +
            "self.userName = $userName, " +
            "self.fullName = $fullName, " +
            "self.hasImage = $hasImage, " +
            "self.phoneNumber = $phoneNumber," +
            "self.creationDate = $creationDate ",
            {"userID": userID, "firstName": firstName, "userName": userName, "fullName": fullName, "hasImage": hasImage, "phoneNumber": phoneNumber, "creationDate": creationDate});
    },


    sendFriendRequest: function(tx, userID, otherUserID) {
        return tx.run(
            "MATCH (self:USER {userID: $userID}) " +
            "MATCH (receiver:USER {userID: $otherUserID}) " +
            "WHERE NOT exists ( (self)-[:FRIEND]-(receiver) )" +
            "MERGE (self)-[r:FRIEND_REQUEST]->(receiver)",
            {"userID": userID, "otherUserID": otherUserID})
    },

    deleteReceivedRequest: function(tx, userID, otherUserID) {
        return tx.run(
            "MATCH (self:USER {userID: $userID})<-[r:FRIEND_REQUEST]-(sender:USER {userID: $otherUserID}) " +
            "DELETE r " +
            "CREATE (self)-[:DELETED]->(sender)",
            {"userID": userID, "otherUserID": otherUserID})
    },

    guardAddFriend: function(tx, userID, otherUserID) {
        return tx.run(
            "MATCH (self:USER {userID: $userID})<-[r1:FRIEND_REQUEST]-(other:USER {userID: $otherUserID}) " +
            "OPTIONAL MATCH (self)-[r2:CONNECTION]-(other)" +
            "DELETE r1, r2 " +
            "CREATE (self)-[:FRIEND]->(other) ",
            {"userID": userID, "otherUserID": otherUserID})
    },


    addConnections: function(tx, userID, otherUserID) {
        return tx.run(
            "MATCH (self:USER {userID: $userID}) " +
            "MATCH (newFriend:USER {userID: $otherUserID}) " +
            "MATCH (newFriend)-[:FRIEND]-(potentialConnection:USER) " +
            "WHERE potentialConnection.userID <> self.userID AND NOT exists ( (self)-[:FRIEND]-(potentialConnection) ) " +
            "MERGE (self)-[r:CONNECTION]-(potentialConnection) " +
            "ON MATCH SET r.links = r.links + 1 " +
            "ON CREATE SET r.links = 1 ",
            {"userID": userID, "otherUserID": otherUserID})
    },


    addConnection: function(tx, userID, otherUserID) {// used when unfriending someone, to create a connection if needed
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[:FRIEND]-(friends:USER)-[:FRIEND]-(other:USER {userID: $otherUserID}) " +
            "WITH COUNT(friends) as numLinks, self, other " +
            "CREATE (self)-[r:CONNECTION {links: numLinks}]->(other) " +
            "RETURN TYPE(r) ",
            {"userID": userID, "otherUserID": otherUserID})
    },

    createEvent: function(tx, userID, eventID, description, invited, numInvited, date, numberMessages) {
        return tx.run(
            "MATCH (self:USER {userID: $userID}) " +
            "MERGE (event:EVENT {eventID: $eventID})" +
            "SET event.description = $description, event.date = $date, event.numberMessages = $numberMessages, event.numAttending = 1, event.numInvited = $numInvited " +
            "MERGE (self)-[:HOST]->(event) " +
            "WITH event " +
            "MATCH (invitedUser:USER) WHERE invitedUser.userID IN $invited " +
            "MERGE (event)-[:INVITE]->(invitedUser) ",
            {"userID": userID, "eventID": eventID, "description": description, "invited": invited, "numInvited": numInvited, "date": date, "numberMessages": numberMessages})
    },




    rsvpEvent: function(tx, userID, eventID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[r:INVITE]-(event:EVENT {eventID: $eventID})" +
            "CREATE (self)-[:ATTEND {numSeen: r.numSeen}]->(event) " +
            "DELETE r " +
            "SET event.numAttending = event.numAttending + 1",
            {"userID": userID, "eventID": eventID})
    },

    leaveEvent: function(tx, userID, eventID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[r:ATTEND]-(event:EVENT {eventID: $eventID})" +
            "CREATE (self)-[:INVITE {numSeen: r.numSeen}]->(event) " +
            "DELETE r " +
            "SET event.numAttending = event.numAttending - 1",
            {"userID": userID, "eventID": eventID})
    },

    dismissEvent: function(tx, userID, eventID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[r:INVITE]-(event:EVENT {eventID: $eventID}) " +
            "DELETE r " +
            "CREATE (self)-[:DISMISSED]->(event)",
            {"userID": userID, "eventID": eventID})
    },

    cancelEvent: function(tx, userID, eventID) {
        return tx.run("" +
            "MATCH (self:USER {userID: $userID})-[:HOST]-(event:EVENT {eventID: $eventID})" +
            "MATCH (event)-[r]-(n) " +
            "DELETE r " +
            "DELETE event",
            {"userID": userID, "eventID": eventID})
    },

    updateMessagesEvent: function(tx, userID, eventID, newNumber) {
        return tx.run("" +
            "MATCH (user:USER {userID: $userID})-[r:INVITE|ATTEND|HOST]-(event:EVENT {eventID: $eventID}) " +
            "SET event.numberMessages = $newNumber " +
            "SET r.numSeen = $newNumber ",
            {"userID": userID, "eventID": eventID, "newNumber": newNumber})
    },

    seeMessages: function(tx, userID, eventID, newNumber) {
        return tx.run("" +
            "MATCH (user:USER {userID: $userID})-[r:INVITE|ATTEND|HOST]-(event:EVENT {eventID: $eventID}) " +
            "SET r.numSeen = $newNumber",
            {"userID": userID, "eventID": eventID, "newNumber": newNumber})
    },
}

module.exports = { write }