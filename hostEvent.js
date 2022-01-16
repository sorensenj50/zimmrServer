
const {read} = require("./getCypher");
const {write} = require("./postCypher");


async function hostEvent(executor, query, body) {
    const extraInvites = await getExtraInvites(executor, query.userID, query.friendsNotLoaded == "true", query.connectionsNotLoaded == "true")
    const totalInvites = body.invited.concat(extraInvites)
    return executor.writeQuery(write.createEvent, [query.userID, query.eventID, body.description, totalInvites, totalInvites.length, body.unixDate, 0])

}

function getExtraInvites(executor, userID, friendsNotLoad, connectionsNotLoad) {
    return new Promise(resolve => {
        let promises = []

        if (friendsNotLoad) {
            promises.push(executor.readQuery(read.getFriendUserIDs, [userID]))
        }

        if (connectionsNotLoad) {
            promises.push(executor.readQuery(read.getConnectionUserIDs, [userID]))
        }

        if (promises.length == 0) {
            resolve([])
        } else {
            Promise.all(promises).then(results => {
                resolve(processUserIDArrays(results))
            })
        }
    })
}

function processUserIDArrays(results) {
    if (results.length == 1) {
        return processUserIDArray(results[0])
    } else {
        const friendResult = processUserIDArray(results[0])
        const connectionResult = processUserIDArray(results[1])
        return friendResult.concat(connectionResult)
    }
}

function processUserIDArray(result) {
    return result.records.map(record => {
        return record.get(0)
    })
}

module.exports = { hostEvent }