// uniqueness constraint and better performance
function createUserIndex(tx) {
    return tx.run("CREATE CONSTRAINT ON (user:USER) ASSERT user.userID IS UNIQUE")
}

// uniqueness constraint and better performance
function createEventIndex(tx) {
    return tx.run("CREATE CONSTRAINT ON (event:EVENT) ASSERT event.eventID IS UNIQUE")
}

// uniqueness constraint and better performance
function createGroupIndex(tx) {
    return tx.run("CREATE CONSTRAINT ON (group:GROUP) ASSERT group.groupID IS UNIQUE")
}


function displayIndexes(tx) {
    return tx.run("SHOW INDEXES")
}

function createUserNameIndex(tx) {
    return tx.run("CREATE INDEX userName_index FOR (user:USER) on (user.userName)")
}

// for search by real users
function createUserFullTextSearchIndex(tx) {
    return tx.run("CREATE FULLTEXT INDEX userSearch FOR (n:USER) ON EACH [n.fullName, n.userName]")
}

function initializeIndices(executor) {
    return new Promise(resolve => {
        executor.writeQuery(createUserIndex, [])
            .then(_ => {
                console.log("Created Index on userID")
                return executor.writeQuery(createEventIndex, [])
            })
            .then(_ => {
                console.log("Created Index on eventID")
                return executor.writeQuery(createUserNameIndex, [])
            })
            .then(_ => {
                console.log("Created Index on userName")
                return executor.writeQuery(createUserFullTextSearchIndex, [])
            })
            .then(_ => {
                console.log("Created Full text search index")
                console.log("Group Index not yet created")
                resolve("Finished")
            })
    })
}




module.exports = { displayIndexes, initializeIndices };