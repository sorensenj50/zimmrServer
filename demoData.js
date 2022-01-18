const { proc } = require("../processingFunctions")
const { testProc } = require("./testFuncs")


class DemoUser {
    constructor(uid, firstName, lastName, userName) {
        this.uid = uid
        this.firstName = firstName
        this.creationDate = 123219191 // example
        this.userName = userName
        this.fullName = firstName + " " + lastName
        this.phoneNumber = "+16505551280" // example
    }

    getParams() {
        return [this.uid, this.firstName, this.userName, this.fullName, true, this.phoneNumber, this.creationDate]
    }
}

class DemoUsers {
    constructor(uids, firstNames, lastNames, userNames) {
        var arrayDemoUsers = []
        for(let i = 0; i < uids.length; i++) {
            this.uids = uids
            const demoUser = new DemoUser(uids[i], firstNames[i], lastNames[i], userNames[i])
            this[uids[i]] = demoUser
            arrayDemoUsers.push(demoUser)
        }
        this.users = arrayDemoUsers
    }
}


class DemoEvent {
    constructor(eventID, hostID, description, date, invited, numMessages, messageSeer) {
        this.eventID = eventID
        this.hostID = hostID
        this.description = description
        this.date = date
        this.invited = invited
        this.numMessages = numMessages
        this.messageSeer = messageSeer
    }

    getParams() {
        return [this.hostID, this.eventID, this.description, this.invited, this.invited.length, this.date, this.numMessages]
    }


}

class DemoEvents {
    constructor(eventIDs, hostIDs, descriptions, dates, invitations, numMessages, messageSeers) {
        var events = []
        for (let i = 0; i < eventIDs.length; i++) {
            const event = new DemoEvent(eventIDs[i], hostIDs[i], descriptions[i], dates[i], invitations[i], numMessages[i], messageSeers[i])
            events.push(event)
            this[eventIDs[i]] = event
        }
        this.events = events
    }
}


class Group {
    constructor(id, name, creatorID, members, message, date) {

        this.id = id
        this.name = name
        this.creatorID = creatorID
        this.members = members
        this.message = message
        this.date = date
    }

    getParams() {
        return [this.creatorID, this.id, this.name, this.members]
    }


}

class DemoGroups {
    constructor(groupIDs, groupNames, groupCreators, groupMembers, groupMessages, groupMessageDates) {
        this.groupIDs = groupIDs
        var groups = []
        for (let i = 0; i < groupIDs.length; i++) {
            const group =  new Group(groupIDs[i], groupNames[i], groupCreators[i], groupMembers[i], groupMessages[i], groupMessageDates[i])
            groups.push(group)
            this[groupIDs[i]] = group
        }

        this.groups = groups
    }
}





const userIDsObject = {
    kennedy: "gX7of1dtKHQwvfP8pFNIP8GuLBy1",
    weston: "wpUU5mrgmvS3fDeh06tmW5zVj2c2",
    johnny: "JToMBft7RnbNRRUCyRfYgLVIb2x1",
    isaac: "yQ6NHmiY1uTtpomyaO7gxjbti6I3",
    eric: "c6ktkpL3FNSiJe0Kr458khp46x52",
    julia: "Oy89dGS4hnThrQKbod8234pHbu92",
    alayna: "0emvTgRnOVd4pX8uXR3GKz5BI692",
    jose: "DPto7SQJhFTG6rGXqVRSAkiNoAW2",
    sarah: "slpH4K4TUoRmRaHfVyrfjSe6vgf1",
    francisco: "5yUXG4GXrBY5oBqt9FTRRfG3Dpg1",
    veronica: "vO3V2AeV3QVENb9u32kcTLHI5b12",
    montana: "mtVgA602qKMxqadufxWDxMPWMvo2",
    hayden: "HiB1WdznkKW95PQbnflSW94AVX83",
    jake: "jrwsla8CN1VekAw7Yeh4BrXwoTs2",
    wesley: "weST5RAFXbfFrwWp1QznOdcTrwh1",
    tyler: "tNXtMG4FhTR2MiwJ9bklxocLPs63",
    zach: "ZzuxFaOJPpdwlyRCOck0sz54gk23",
    grace: "g8FwRdNMa9VSlyoX5y3vFHNpJtJ2",
    theodore: "03d10g5SXkV905b7yHhfgN3zIHw2",
    elenore: "ElgdzKR1SqMxnSObn2U7cEFWNBm1",
    felix: "F1laATGocCPuXSNADSJVYwNhb8G2",
    leonore: "LjtrUkeNuOZtur5V22m8JsmFp3t1",
    maribel: "MgjmgvT2xMO9mN3muKgzDTE8Q302",
    taylor: "TzrpKbhAqUPpm5Z8fZDdHdZMaPz1",
    paul: "p2vTmAQP2VXcyyEnJgGfyYtzRuj1",
    jeremy: "asldkfjasldkas0234234",
    joe: "pa2-394123;lsdfs;",
    caroline: "123kasdf,212991",
    frank: "asd234,assdf-;asdfl3313",
    ben: "asd23-lsa;sdf,  ;sadfas",
    peter: "p0123 asdkfas1231231101",
    alex: "12039lasdfalskasks",
    unknown: "asdflkasdf0129312",
    nathan: "sla23rasd asdf0-2134alsd",
}
const userIDs = testProc.getObjectValues(userIDsObject)


const firstNames = ["Kennedy", "Weston", "Johnny", "Isaac", "Eric", "Julia", "Alayna", "Jose", "Sarah", "Francisco",
    "Veronica", "Montana", "Hayden", "Jake", "Wesley", "Tyler", "Zach", "Grace", "Theodore", "Elenore",
    "Felix", "Leonore", "Maribel", "Taylor", "Paul", "Jeremy", "Joe", "Caroline", "Frank", "Ben", "Peter", "Alex", "Unknown", "Nathan"]

const lastNames = ["Foster", "Snyder", "Larson", "Matthews", "Christensen", "North", "Sparks", "Watts", "Benson", "d'Anconia", "Daniels",
    "Cragun", "Bergeson", "Cook", "Johnson", "Dawson", "Mckenzie", "Hobbs", "Wyatt",
    "King", "Patterson", "Pierce", "Vaughn", "Olson", "Beck", "Beacham", "lastName", "lastName", "lastName", "lastName", "lastName", "lastName", "lastName", "lastName"]

const userNames = ["kenfoster11", "wesseg90", "thetractor", "imatthews12", "the_real_christensen", "jules25", "alanya1",
    "no_way_jose", "sarah_real", "theOneAndOnly", "the_veronica", "mo89", "haydenj90","jcook12", "wes12", "tycobb",
    "zachattack", "gpalmer85", "theo_the_man", "the_king", "the_felix_effect",
    "me_and_david", "mvaughn43", "real_taylor", "unknown_paul", "another_unknown_character",
    "jos-username", "caroline-username", "frank-username", "ben-username", "peter-username", "alexasldkfas", "actual_unknown_character", "sorensen"]









const groupIDsObject = {
    one: "2361f93a-7680-43cc-bfbb-a893a1aa567b",
    two: "cef4f746-a231-4702-af8d-e2edd38fb4a4",
    three: "6e564022-7182-4287-a9a2-8d6780f8df0c",
}

const groupIDs = testProc.getObjectValues(groupIDsObject)

const groupNames = ["Roommates", "Cousins", "Chaco Tacos"]

const groupCreators = [
    userIDsObject.kennedy,
    userIDsObject.hayden,
    userIDsObject.tyler,
]

const groupMembers = [
    [userIDsObject.julia, userIDsObject.alayna, userIDsObject.sarah],
    [userIDsObject.francisco, userIDsObject.jose, userIDsObject.kennedy, userIDsObject.leonore, userIDsObject.veronica],
    [userIDsObject.julia, userIDsObject.isaac, userIDsObject.theodore, userIDsObject.wesley, userIDsObject.taylor, userIDsObject.kennedy]
]

const mostRecentMessages = ["Hey I found your phone", null, "Where are we meeting again?"]

const mostRecentMessageDate = [proc.getCurrentDate() - 40_000, null, proc.getCurrentDate() - 100_000,]


function fillFriendShips() {
    let friendShips = {}

    friendShips[userIDsObject.kennedy] = [userIDsObject.weston, userIDsObject.alayna,
        userIDsObject.francisco, userIDsObject.montana, userIDsObject.eric,
        userIDsObject.isaac, userIDsObject.johnny, userIDsObject.sarah, userIDsObject.hayden,
        userIDsObject.jose, userIDsObject.julia]

    friendShips[userIDsObject.tyler] = [userIDsObject.weston, userIDsObject.eric, userIDsObject.sarah]
    friendShips[userIDsObject.jake] = [userIDsObject.jose, userIDsObject.alayna]
    friendShips[userIDsObject.wesley] = [userIDsObject.hayden, userIDsObject.alayna, userIDsObject.francisco]
    friendShips[userIDsObject.julia] = [userIDsObject.peter]
    friendShips[userIDsObject.grace] = [userIDsObject.montana, userIDsObject.johnny, userIDsObject.eric, userIDsObject.isaac]
    friendShips[userIDsObject.zach] = [userIDsObject.jose, userIDsObject.julia, userIDsObject.isaac]
    friendShips[userIDsObject.theodore] = [userIDsObject.weston]
    friendShips[userIDsObject.leonore] = [userIDsObject.eric]
    friendShips[userIDsObject.felix] = [userIDsObject.francisco, userIDsObject.hayden, userIDsObject.leonore]
    friendShips[userIDsObject.elenore]  = [userIDsObject.alayna, userIDsObject.johnny, userIDsObject.weston]
    friendShips[userIDsObject.maribel] = [userIDsObject.isaac]
    friendShips[userIDsObject.taylor] = [userIDsObject.sarah]

    return friendShips
}

const friendShips = fillFriendShips()

const connections = [userIDsObject.tyler, userIDsObject.jake, userIDsObject.wesley, userIDsObject.veronica,
    userIDsObject.grace, userIDsObject.zach, userIDsObject.theodore, userIDsObject.felix, userIDsObject.elenore,
    userIDsObject.leonore, userIDsObject.maribel, userIDsObject.taylor]

const links = [3, 2, 3, 1, 4, 3, 1, 2, 1, 1, 1, 1]




const requestors = [userIDsObject.zach, userIDsObject.grace, userIDsObject.leonore, userIDsObject.theodore]

const receivers = [userIDsObject.veronica, userIDsObject.felix]




const demoUsers = new DemoUsers(userIDs, firstNames, lastNames, userNames)

const eventIDsObject = {
    one: "2c462026-0253-44f3-b132-6b4adc2b2e3f",
    two: "0aa17f25-b2dc-41dd-a607-d92d40a3d9cf",
    three: testProc.create_UUID(),
    four: "d61d02b2-1e44-4f00-9c10-1ed8fd1d0006",
    five: "cadb8bbd-ae17-4ab4-8004-0e95f2eee65b",
    six: "e2be6335-dd36-49e2-a0c1-26bd946b33a5",
    seven: "b17f91cf-6ed5-4152-af07-e37ffc7e7672",
    eight: testProc.create_UUID(),
    nine: testProc.create_UUID(),
    ten: testProc.create_UUID(),
}

const eventIDs = testProc.getObjectValues(eventIDsObject)


const invitations = [
    [userIDsObject.weston, userIDsObject.johnny, userIDsObject.zach, userIDsObject.theodore, userIDsObject.julia],
    [userIDsObject.kennedy, userIDsObject.johnny, userIDsObject.eric, userIDsObject.alayna, userIDsObject.jake, userIDsObject.felix],
    [userIDsObject.kennedy, userIDsObject.eric, userIDsObject.weston, userIDsObject.leonore, userIDsObject.grace, userIDsObject.julia],
    [userIDsObject.kennedy, userIDsObject.hayden, userIDsObject.weston, userIDsObject.alayna, userIDsObject.julia, userIDsObject.grace, userIDsObject.theodore, userIDsObject.wesley],
    [userIDsObject.kennedy, userIDsObject.maribel, userIDsObject.tyler, userIDsObject.grace, userIDsObject.veronica, userIDsObject.elenore, userIDsObject.isaac],
    [userIDsObject.kennedy, userIDsObject.johnny, userIDsObject.jake, userIDsObject.alayna, userIDsObject.isaac, userIDsObject.grace],
    [userIDsObject.kennedy, userIDsObject.hayden, userIDsObject.elenore],
    [],
    [userIDsObject.weston, userIDsObject.johnny, userIDsObject.zach, userIDsObject.theodore],
    [userIDsObject.kennedy, userIDsObject.johnny, userIDsObject.eric, userIDsObject.alayna, userIDsObject.jake, userIDsObject.felix],

]


const descriptions = [
    "hot tubbing at hunter's place! we have towels but bring your swimsuit 🩳",
    "let's get spooked at the fear factory! 😱😱 let me know if you want a touch pass so I can order ahead of time.",
    "me and truman are going mountain biking 🚵 up Logan canyon. we have plenty of space on the bike rack but you'll need you're own bike",
    "jackbox game night wth the boys",
    "Wanna go on a road trip to Seattle for the Real SLC game? me, Sammie, and Ian are already going!",
    "taco thursday 🌮",
    "spidy spidy! we rented out a theater, so we only have limited spots. rsvp asap",
    "no one is invited to this event",
    "st. george trip! we leave in march",
    "game night anyone?"
]

const hosts = [
    userIDsObject.kennedy,
    userIDsObject.wesley,
    userIDsObject.alayna,
    userIDsObject.zach,
    userIDsObject.francisco,
    userIDsObject.eric,
    userIDsObject.johnny,
    userIDsObject.jeremy,
    userIDsObject.julia,
    userIDsObject.kennedy,
]

const dates = [
    proc.getCurrentDate() + 100_000_000,
    proc.getCurrentDate() + 500_000,
    proc.getCurrentDate() + 300_000,
    proc.getCurrentDate() + 700_000,
    proc.getCurrentDate() + 1_000_000,
    proc.getCurrentDate() + 400_000,
    proc.getCurrentDate() - 50_000,
    proc.getCurrentDate() + 100_000,
    proc.getCurrentDate() - 50_000,
    proc.getCurrentDate() - 90_000,
]



const numMessages = [2, 0, 0, 0, 5, 0, 2, 0, 0, 0]

const messageSeers = [ userIDsObject.kennedy, null, null, null, userIDsObject.francisco, null, userIDsObject.johnny, null, null, null]

function fillEventJoinObject() {
    let eventsJoinObject = {}
    eventsJoinObject[eventIDsObject.one] = [userIDsObject.weston, userIDsObject.zach]
    eventsJoinObject[eventIDsObject.two] = []
    eventsJoinObject[eventIDsObject.three] = []
    eventsJoinObject[eventIDsObject.four] = [userIDsObject.grace, userIDsObject.julia]
    eventsJoinObject[eventIDsObject.five] = [userIDsObject.maribel, userIDsObject.tyler, userIDsObject.wesley]
    eventsJoinObject[eventIDsObject.six] = [userIDsObject.alayna, userIDsObject.jake]
    eventsJoinObject[eventIDsObject.seven] = [userIDsObject.kennedy]
    eventsJoinObject[eventIDsObject.eight] = []
    eventsJoinObject[eventIDsObject.nine] = []
    eventsJoinObject[eventIDsObject.ten] = []

    return eventsJoinObject

}
const eventsJoinObject = fillEventJoinObject()

function fillDismissObject() {
    let dismissObject = {}
    dismissObject[eventIDsObject.six] = [userIDsObject.jake, userIDsObject.grace]
    return dismissObject
}

const dismissObject = fillDismissObject()



const demoEvents = new DemoEvents(eventIDs, hosts, descriptions, dates, invitations, numMessages, messageSeers)

const demoGroups = new DemoGroups(groupIDs, groupNames, groupCreators, groupMembers, mostRecentMessages, mostRecentMessageDate)

module.exports = { demoUsers, demoEvents, demoGroups, userIDsObject,
    eventIDsObject, groupIDsObject, friendShips, connections, eventsJoinObject,
    requestors, links, receivers, dismissObject }