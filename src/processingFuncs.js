const { read } = require("./postCypher")
const neo4j = require("neo4j-driver")

var proc = {

    guardAgainstDeletingProduction: function(uri) {
        if (uri == 'neo4j+s://10681f25.databases.neo4j.io') {
            throw "DONT DELETE PRODUCTION DATABASE"
        } else {
            console.log("Verified Running on Test Database")
        }
    },

    getCurrentDate: function() {
        return new Date().getTime() / 1000
    },

    parseCypherInt: function(variable) {
        try {
            return variable.toInt();
        } catch {
            return variable
        }
    },

    sendJSON: function(res, promise, func) {
        promise.then(result => {
            const processed = func(result)
            res.json(processed)
        })
    },

    handleProfile: function(res, userPromise, pastEventsPromise) {
        Promise.all([userPromise, pastEventsPromise]).then(values => {
            let object = {}

            const user = this.processUser(values[0])
            if (user != null) {
                object.user = user
                object.pastEvents = this.processEvents(values[1])
            } else {
                object.user = null;
                object.pastEvents = { events: [] };
            }
            console.log(object)
            res.json(object);
        })
    },



    processEvents: function(result) {
        const userID = result.summary.query.parameters.userID
        let firstName = null
        const mapped = result.records.map(record => {
            let object = record.get(0).properties
            object.core = proc.processUserStaticCore(record.get(1).properties)


            object.relationshipToEvent = record.get(2)
            object.core.relationship = userID == object.core.userID ? "SELF": record.get(4)
            object.numMessagesSeen = record.get(3) == null ? 0: record.get(3)
            object.numAttending = proc.parseCypherInt(object.numAttending)
            object.numInvited = proc.parseCypherInt(object.numInvited)
            object.core.links = proc.parseCypherInt(record.get(5));
            firstName = record.get(6)

            return object
        })

        const object = {
            events: mapped,
            firstName: firstName,
        }
        return object
    },



    processUsers: function(result) {
        const userID = result.summary.query.parameters.userID;
        const mapped = result.records.map(record => {
            let core = proc.processUserStaticCore(record.get(0).properties)

            if (userID == core.userID) {
                core.relationship = "SELF";
            } else {
                core.relationship = record.get(1);
            }

            core.links = proc.parseCypherInt(record.get(2))

            return core
        })
        return { users: mapped }
    },

    processUserStaticCore: function(receivedCore) {
        let core = {}
        core.userID = receivedCore.userID
        core.userName = receivedCore.userName
        core.firstName = receivedCore.firstName
        core.fullName = receivedCore.fullName
        core.hasImage = receivedCore.hasImage
        return core
    },


    processUser: function(result) {
        const record = result.records[0]
        const userID = result.summary.query.parameters.userID;
        if (record != undefined) {
            let object = {}
            object.core = proc.processUserStaticCore(record.get(0).properties)

            if (userID == object.core.userID) {
                object.core.relationship = "SELF";
                object.core.links = null;
                object.requestStatus = null;

            } else {
                object.core.relationship = record.get(1)
                object.core.links = record.get(2)
                object.requestStatus = proc.parseRequestStatus(record.get(3))
            }

            return object
        } else {
            return null
        }
    },

    parseRequestStatus: function(direction) {
        if (direction == null) {
            return null
        } else if (direction) {
            return "SENT"
        } else {
            return "RECEIVED"
        }
    },

    handlePostRequest: function(promises, res) {
        Promise.all(promises).then(_ => {
            res.json(this.statusResponse)
            console.log("Post Request Completed")
        })
    },

    processExistenceCheck: function(result) {
        return { exists: result.records != 0 }
    },

    statusResponse: {
        status: "success"
    },

    getLaggedDate: function() {
        return proc.getCurrentDate() - (60 * 60 * 6);
    },
}


class QueryExecutor {
    constructor(uri, userName, password, override = false) {
        if (!override) {
            proc.guardAgainstDeletingProduction(uri)
        }

        this.driver = neo4j.driver(uri, neo4j.auth.basic(userName, password));
    }

    readQuery(query, params) {
        return new Promise(resolve => {
            const session = this.driver.session()
            const promise = session.readTransaction(tx => query(tx, ...params))
            promise.then(result => {
                session.close()
                resolve(result)
            })
        })
    }

    writeQuery(query, params) {
        return new Promise(resolve => {
            const session = this.driver.session()
            const promise = session.writeTransaction(tx => query(tx, ...params))
            promise.then(result => {
                session.close()
                resolve(result)
            })
        })
    }
}



module.exports = { proc, QueryExecutor }