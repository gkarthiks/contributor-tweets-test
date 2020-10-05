const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

Date.prototype.ddmmyyyy = function() {
    var mm = this.getMonth() + 1;
    var dd = this.getDate();
  
    return [(dd>9 ? '' : '0') + dd,
            (mm>9 ? '' : '0') + mm,
            this.getFullYear(),
            this.getUTCHours(),
            this.getUTCMinutes()
           ].join('-');
};

Date.prototype.mmddyyyy = function() {
    var mm = this.getMonth() + 1;
    var dd = this.getDate();
  
    return [(mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd,
            this.getFullYear(),
            this.getUTCHours(),
            this.getUTCMinutes()
           ].join('-');
};

try {
    
    // Extract and create the necessary variables and values
    // sort of initialiazition part
    var startingParseSymbol = core.getInput("starting-parse-symbol").trim();
    var issueContext = github.context.payload.issue.body;
    var issueNumber = github.context.payload.issue.number;
    var fileNameFormat = core.getInput("file-name-format").trim();
    var pathToSave = core.getInput("path-to-save").trim();
    var fileNameExtension = core.getInput("file-name-extension").trim();
    var fileNameDate, completeFileName;
    var tweetScheduleTime = issueContext.substring(issueContext.indexOf("Time:")+5, issueContext.length).trim();
    var githubToken = core.getInput('token');
    var issueTitle = github.context.payload.issue.title;
    var issueTitle30Chars = issueTitle.substring(0,30);
    var sanitizedIssueTitle = issueTitle30Chars.replace(/[^a-zA-Z0-9]/g,'-').trim().slice(0, -1);
    var tweetLength = core.getInput('tweet-length');
    // Validate the given timestamp is valid time and return null, 
    // if not valid, throws an error and exits.
    validateTimestamp(tweetScheduleTime, githubToken)

    // Creates the new file to be committed into the repo.
    if (!fs.existsSync(pathToSave)){
        fs.mkdirSync(pathToSave, { recursive: true });
    }

    core.info(`    
        The symbol declared for parsing is ${startingParseSymbol}
        The file name format is specified as ${fileNameFormat}
        The file name extension is specified as ${fileNameExtension}
        The path to save the file is specified as ${pathToSave}
        Sanitized issue title is ${sanitizedIssueTitle}
        Scheduled tweet time is ${tweetScheduleTime}
    `);

    var tweetContent = issueContext.substring(issueContext.indexOf(startingParseSymbol) + startingParseSymbol.length, issueContext.lastIndexOf(startingParseSymbol));
    validateTweetContentLength(tweetContent, tweetLength, githubToken)

    console.log(`The tweet content is ${tweetContent}`);

    var scheduledTime = issueContext.substring(issueContext.indexOf("Time:")+5, issueContext.length).trim()
    if (scheduledTime === "") {
        console.log("Scheduled time is null, creating the file name with the specified format.")
        var date = new Date();
        if (fileNameFormat === "dd-mm-yyyy-hh-MM") {
            fileNameDate = date.ddmmyyyy();
        } else if (fileNameFormat === "mm-dd-yyyy-hh-MM") {
            fileNameDate = date.mmddyyyy();
        }
        completeFileName = fileNameDate+sanitizedIssueTitle+"."+fileNameExtension
        console.log(`file name tio be saved is ${completeFileName}`)
    } else {
        fileNameDate = new Date(tweetScheduleTime).toJSON().replace(/[^a-zA-Z0-9]/g,'-').trim().slice(0, -1)
        completeFileName = fileNameDate+sanitizedIssueTitle+"."+fileNameExtension
        console.log(`file name tio be saved is ${completeFileName}`)
    }

    const dataFilePath = pathToSave+'/'+completeFileName;

    fs.writeFile(dataFilePath, tweetContent, (err) => {
        if (err) throw err;
    });

    github.getOctokit(githubToken).issues.createComment({
        issue_number: github.context.issue.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: "A new file has been created with your tweet content. Please refer the below linked PR"
    });

    core.setOutput("issueNumber", issueNumber);

} catch (error) {
    core.setFailed(error.message);
}

// Validates the provided time is valid time format
function validateTimestamp(tweetScheduleTime, githubToken) {
    if (tweetScheduleTime !== "") {
        var parsedTime = Date.parse(tweetScheduleTime);
        if (isNaN(parsedTime)) {
            github.getOctokit(githubToken).issues.createComment({
                issue_number: github.context.issue.number,
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                body: "Specified time is not a valid UTC timestamp for the tweet schedule. Please verify and comment /validate to trigger the workflow again"
            });
            core.setFailed("Error occured while parsing the given timestamp. Please provide the time in conventional UTC format as 2020-10-04T16:02:11.029Z")   
        }
    }
}

function validateTweetContentLength(tweetContent, tweetLength, githubToken) {
    if (tweetContent.length > tweetLength) {
        github.getOctokit(githubToken).issues.createComment({
            issue_number: github.context.issue.number,
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            body: "Tweet content length is exceeding the permitted tweet length. Please rephrase the tweet and comment /validate to trigger the workflow again."
        });
        core.setFailed("Tweet content length is exceeding the permitted tweet length. Please rephrase the tweet.")
    }
}