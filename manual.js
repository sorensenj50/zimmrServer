const { resetDatabase, createDemo } = require("./createDemo")
const { initializeIndices } = require("./queryIndexes")
const { QueryExecutor, proc } = require("./processingFuncs")

const uri = 'neo4j+s://e16c9ee5.databases.neo4j.io'; // test database
const user = 'neo4j';
const password = '4KqMAcYQTToW21B-e9VbgwqFp6wRTY-bQDG0avitw3k';


const executor = new QueryExecutor(uri, user, password, false)


