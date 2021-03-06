<p>
    <img src="https://img.shields.io/badge/Node.js-16.13.2-green" />
    <img src="https://img.shields.io/badge/Express-4.17.2-blue" />
    <img src="https://img.shields.io/badge/Neo4j--Driver-4.4.1-purple" />
    <img src="https://img.shields.io/badge/Jest-27.4.7-red" />
</p>

# Zimmr

Zimmr is a social media app I built with Swift, Node.js, Neo4j, and Firebase. This repo in particular holds the code for my Node.js server. Another repo in my profile contains the code for my Swift frontend. If you've already visited that repo, you can skip past the Zimmr's premise and the purpose of the repo.

### Purpose of Repo

Though this repo is public, I am not seeking contributors to improve Zimmr. Instead, I intend this repo to display the work I've put into Zimmr so that employers or other interested parties can get a sense of my abilities. In the rest of this `README`, I'll give a summary of the code and my thought process behind it. You can also install my app via TestFlight to see what it does for yourself.

Link: https://testflight.apple.com/join/pvHUsutx

### Premise

Zimmr was originally intended to be a startup, not just a programming project. The idea was for Zimmr to be a platform for people to post about fun activities they're hosting and to see what activities they've been invited to.

Here's the description I used for the app when I submitted it to the App Store:

>HOST <br> With Zimmr, you can post about parties, game nights, or other events you are hosting and invite your friends. You can choose who’s invited, when the event is happening, and write a description about what you’ll be doing. <br><br> INVITATIONS <br>
On the main feed of the app, you can see all the events you’ve been invited to and when they’re happening. You can see who’s invited, who’s attending, and can decide whether or not you want to attend. <br><br> CHAT <br> Inside each event is a group chat with everyone who’s invited or attending. This is the perfect place to ask questions about the event—like where to meet or what to bring. <br><br> PROFILE <br>
Your profile is super simple at Zimmr—just your name, nickname, and profile picture. There are no metrics—no follower counts or friend counts. Zimmr is not about maximizing the number of followers you have, but about helping you have more fun in real life with your real friends. <br><br> FRIENDS & CONNECTIONS <br>
Like Facebook and other social media apps, Zimmr has a friend request feature so you and your friends can meet up on the app. In addition to your friends, Zimmr also tracks your “connections.” This is our word for the friends of your friends. In our experience, friend groups often grow through people meeting the friends of their friends, or their “connections.” Zimmr makes this easy—not only can you invite your friends to any events you host, you can also invite your connections!
<br>

I decided to turn Zimmr into a programming project because I realized (after building it) that the vision and many of the supposedly unique features of Zimmr were already captured by another startup--[IRL](https://www.irl.com/). Because they already have an established user base and a more mature app, I decided that trying to directly compete with IRL was not worth it.


### Architecture of Backend

My Node.js backend is very simple and straightforward compared to my Swift frontend. I'm using Neo4j's Aura DB as my primary app database, so several of the files are dedicated to housing dozens of Cypher queries to communicate with my database. Another section of my codebase deals with processing the `.json` Neo4j returns into something useful. There's also the Node.js / Express server itself, as well as several files dedicated to providing a comprehensive set of unit tests for my queries. But that's about it.

To summarize:

* Express Server
* Cypher Queries
* JSON processing
* Unit Testing

And since I'm not doing anything special with Express, we can safely skip that section. 

#### Cypher Queries

Cypher is a database query language for Neo4j's Aura DB graph database. You can read more about them [here](https://neo4j.com/). Because of the naturally graph-like nature of social networks (and especially for the algorithm that tracks people's Connections on Zimmr) Neo4j proved to be a useful and intuitive choice.


A simple query that returned a user with a given userID would look like this:

```cypher
MATCH (user: USER {userID: $userID})
RETURN user
```

Wrapping this in a javascript function looks like this:

```javascript
function getUser(tx, userID) {
    return tx.run("" +
        "MATCH (user: USER {userID: $userID})" +
        "RETURN user)",
        {"userID": userID}
}
```

Basically, the Cypher query is passed as a string to the run method of this `tx` object (which is provided in a callback of the function that executes the query) along with a mapper object of parameters. 

A still simple but real example is the query that gets all the users that are attending an event:

```javascript
function getAttendingEvent(tx, userID, eventID) {
    return tx.run("" +
        "MATCH (self:USER {userID: $userID}) " + 
        "MATCH (event:EVENT {eventID: $eventID})-[:ATTEND|HOST]-(other:USER) " + 
        "OPTIONAL MATCH (self)-[r:FRIEND|CONNECTION]-(other:USER) " + 
        "RETURN other, TYPE(r), r.links",
        {"userID": userID, "eventID": eventID})
}
```

The first line finds the user who wants to know this information, while the second line finds the event and everyone who's attending. (The host of the event is always counted as attending.) The third checks to see if there is a relationship between the user who wants to know and everyone who's attending. This line is very common throughout my Cypher query codebase. Recall from the other README that every user in a `UserList` has the relationship between themselves and the viewer attached.

There are many other cypher queries, of course, but it wouldn't be appropriate to go over each of them here. 


#### JSON Processing

Neo4j returns a lot more information for every query than I need, so for every `read` query I make, I must process the returned object into a usable `json` that I can then pass back to the client. 

An example of such a processing function is this:

```javascript

function processUserStaticCore(recievedCore) {
    let core = {}
    core.userID = receivedCore.userID
    core.userName = receivedCore.userName
    core.firstName = receivedCore.firstName
    core.fullName = receivedCore.fullName
    core.hasImage = receivedCore.hasImage
    return core
}
```

Recall the `UserCore` `struct` from the other repo--this function is in charge of mapping what I call the `receivedCore` to an object with some of `UserCore`'s properties. The function is called "static" because it maps non-relational properties--it doesn't deal with `links` or `relationship`, for instance. Why do these static properties need to be mapped? This function exists because there are some properties attached to each user (and thus returned by Cypher) which I don't want to expose to every network call by the frontend. Namely, each user's phone number. 

This function is called within the broader `processUsers` function, which does the processing work for every `UserList` in the app.

```javascript
function processUsers(result) {
    const userID = result.summary.query.parameters.userID;
    const mapped = result.records.map(record => {
        let core = proc.processUserStaticCore(record.get(0).properties)

        if (userID == core.userID) {
             core.relationship = "SELF"; // self is treated as a relationship by the front end, but not in the database
        } else {
             core.relationship = record.get(1);
        }
     
        core.links = proc.parseCypherInt(record.get(2))

        return core
    })
    return { users: mapped }
}
```

Note how `record.get(0)`, `record.get(1)`, and `record.get(2)` map to the three returned objects of `getAttendingEvent` function (which is indeed intended to return a `UserList`). The `json` that this function returns is then `res.json`ed to the requester. 

#### Unit Testing

I regard unit testing as critically important, especially for my server. To that end, I used `Jest` to help me manage my test bank of over 100 tests to ensure that my Cypher queries perform as needed in even unlikely scenarios. To help make programmatic tests easier, I made a `TestObject` class to store inputs for unit tests. The class is as folllows:

```javascript
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
    // ...
}
```

There's no avoiding the need for both a `setFunction` (to write to the database before the test) and a `getFunction` (to check and see if the data was set as expected), but I strove for specificity in my unit tests by only having a production function as one of these functions. When testing whether sending a friend request works as expected, for instance, I used the production `sendFriendRequest` function as the setter, and the non-production `getUserRelationship` as the getter. This getter is too simple to have any use in my production app, but it is perfect for unit-testing purposes, since there's no chance it will fail. 

This `TestObject` class is a bit verbose, so I subclassed it for more specific types of tests. 

See, for instance, the `UserRelationship` subclass:

```javascript
class UserRelationship extends TestObject {
    constructor(setFunction, user, viewed, message, ideal) {
        const params = [user, viewed]
        super(setFunction, testCypher.getUserRelationship, params, params, testProc.processRelationship, ideal, message, "String Array")
    }
}
```

This `UserRelationship` subclass provides a standard interface for those tests which `get` user relationships, but which want to test diffeent `setFunction`s, messages, and params. 

### Conclusion

Though it's impossible to disucss even every important aspect about my app in this README, I hope you were able to get a sense of Zimmr's design and that my thought process could be communicated.

