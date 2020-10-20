const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const { exit } = require('process');

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
    var fileNameFormat = core.getInput("file-name-format").trim();
    var pathToSave = core.getInput("path-to-save").trim();
    var fileNameExtension = core.getInput("file-name-extension").trim();
    var githubToken = core.getInput('token');
    var tweetLength = core.getInput('tweet-length');
    
    var issueContext = github.context.payload.issue.body;
    var issueNumber = github.context.payload.issue.number;
    var issueTitle = github.context.payload.issue.title;

    var tweetContent = issueContext.substring(issueContext.indexOf(startingParseSymbol) + startingParseSymbol.length, issueContext.lastIndexOf(startingParseSymbol));

    var newLine = `
    `


    core.info("================================================================")
    core.info(!/^[0-9a-zA-Z]+$/.test(tweetContent))
    core.info(tweetContent.includes(newLine))
    core.info("================================================================")


    if ((!/^[0-9a-zA-Z]+$/.test(tweetContent)) || tweetContent.includes(newLine)) {        
        core.info("The issue "+issueNumber+" is not for creation of new tweet.")
        exit(0)
    }

    var tweetScheduleTime = issueContext.substring(issueContext.indexOf("Time:")+5, issueContext.length).trim();

    var fileNameDate, completeFileName;
    var issueTitle30Chars = issueTitle.substring(0,30);
    var sanitizedIssueTitle = issueTitle30Chars.replace(/[^a-zA-Z0-9]/g,'-').trim().slice(0, -1);

    // Validate the given timestamp is valid time and return null, 
    // if not valid, throws an error and exits.
    validateTimestamp(tweetScheduleTime, githubToken)

    // Validates the length of the tweet content
    validateTweetContentLength(tweetContent, tweetLength, githubToken)
    core.info(`The tweet content is ${tweetContent}`);

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

    if (tweetScheduleTime === "") {
        core.info("Scheduled time is null, creating the file name with the specified format.")
        var date = new Date();
        if (fileNameFormat === "dd-mm-yyyy-hh-MM") {
            fileNameDate = date.ddmmyyyy();
        } else if (fileNameFormat === "mm-dd-yyyy-hh-MM") {
            fileNameDate = date.mmddyyyy();
        }
        completeFileName = fileNameDate+sanitizedIssueTitle+"."+fileNameExtension
        core.info(`File name to be saved as ${completeFileName}`)
    } else {
        fileNameDate = new Date(tweetScheduleTime).toJSON().replace(/[^a-zA-Z0-9]/g,'-').trim().slice(0, -1)
        completeFileName = fileNameDate+sanitizedIssueTitle+"."+fileNameExtension
        core.info(`File name to be saved as ${completeFileName}`)
    }
    const dataFilePath = pathToSave+'/'+completeFileName;
    fs.writeFile(dataFilePath, tweetContent, (err) => {
        if (err) throw err;
    });

    commentToIssue(
        "A new file has been created with your tweet content. Please refer the below linked PR",
        githubToken
    )

    core.setOutput("issueNumber", issueNumber);
} catch (error) {
    core.setFailed(error.message);
}

// Validates the provided time is valid time format
function validateTimestamp(tweetScheduleTime, githubToken) {
    if (tweetScheduleTime !== "") {
        var parsedTime = Date.parse(tweetScheduleTime);
        if (isNaN(parsedTime)) {
            commentToIssue(
                "Specified time is not a valid UTC timestamp for the tweet schedule. Please verify and comment /validate to trigger the workflow again",
                githubToken
            )
            core.setFailed("Error occured while parsing the given timestamp. Please provide the time in conventional UTC format as 2020-10-04T16:02:11.029Z")
        }
    }
}

// Validates the length of the tweer content
function validateTweetContentLength(tweetContent, tweetLength, githubToken) {
    if (tweetContent.length > tweetLength) {
        commentToIssue(
            "Tweet content length is exceeding the permitted tweet length. Please rephrase the tweet and comment /validate to trigger the workflow again.",
            githubToken
        )
        core.setFailed("Tweet content length is exceeding the permitted tweet length. Please rephrase the tweet.")
    }
}

// Commenting back to issue with provided message
function commentToIssue(body, githubToken) {
    github.getOctokit(githubToken).issues.createComment({
        issue_number: github.context.issue.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: body
    });
}