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
    
    var startingParseSymbol = core.getInput("starting-parse-symbol").trim();
    var issueContext = github.context.payload.issue.body;
    var issueNumber = github.context.payload.issue.number;
    var fileNameFormat = core.getInput("file-name-format").trim();
    var pathToSave = core.getInput("path-to-save").trim();
    var fileNameExtension = core.getInput("file-name-extension").trim();
    var fileNameDate, completeFileName;

    var issueTitle = github.context.payload.issue.title;
    var issueTitle30Chars = issueTitle.substring(0,30);
    var sanitizedIssueTitle = issueTitle30Chars.replace(/[^a-zA-Z0-9]/g,'-').trim().slice(0, -1);


    if (!fs.existsSync(pathToSave)){
        fs.mkdirSync(pathToSave, { recursive: true });
    }

    console.log(`
    The symbol declared for parsing is ${startingParseSymbol}
    The file name format is specified as ${fileNameFormat}
    The file name extension is specified as ${fileNameExtension}
    The path to save the file is specified as ${pathToSave}
    Sanitized issue title is ${sanitizedIssueTitle}
    `);
    var tweetContent = issueContext.substring(issueContext.indexOf(startingParseSymbol) + startingParseSymbol.length, issueContext.lastIndexOf(startingParseSymbol));
    console.log(`The tweet content is ${tweetContent}`);

    var scheduledTime = issueContext.substring(issueContext.indexOf("Time:")+5, issueContext.length).trim()
    if (scheduledTime === "") {
        console.log("Scheduled time is null, creating the file name with the specified format.")
        var date = new Date();
        if (fileNameFormat === "dd-mm-yyyy-hh-MM") {
            console.log(date.ddmmyyyy());
            fileNameDate = date.ddmmyyyy();
        } else if (fileNameFormat === "mm-dd-yyyy-hh-MM") {
            console.log(date.mmddyyyy());
            fileNameDate = date.mmddyyyy();
        }
        completeFileName = fileNameDate+sanitizedIssueTitle+"."+fileNameExtension

        console.log(`file name tio be saved is ${completeFileName}`)
    }

    const dataFilePath = pathToSave+'/'+completeFileName;

    fs.writeFile(dataFilePath, tweetContent, (err) => {
        if (err) throw err;
    });

    core.setOutput("issueNumber", issueNumber);

} catch (error) {
    core.setFailed(error.message);
}