const { resetDatabase, createDemo } = require("./createDemo")
const { QueryExecutor } = require("../processingFunctions")

const uri = 'neo4j+s://e16c9ee5.databases.neo4j.io';
const user = 'neo4j';
const password = '4KqMAcYQTToW21B-e9VbgwqFp6wRTY-bQDG0avitw3k';
const neo4j = require('neo4j-driver')

if (uri == 'neo4j+s://10681f25.databases.neo4j.io') {
    throw "Don't reset Production Database"
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const executor = new QueryExecutor(driver)



// resetDatabase(executor)