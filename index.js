const fs = require('fs');
const readline = require('readline');
const path = require('path');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const actions = {
    LIST: "list",
    GET_FILE: "file",
    UPLOAD_FILE: "upload"
}

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    const args = getArgs();
    console.log(args);
    if (args.type) {
        switch (args.type) {
            case actions.LIST:
                authorize(JSON.parse(content), listFiles, args);
                break;
            case actions.GET_FILE:
                authorize(JSON.parse(content), getFile, args);
                break;
            case actions.UPLOAD_FILE:
                authorize(JSON.parse(content), uploadFile, args);
                break;
            default:
                console.log('type: ' + args.type + ' is not valid');
        }
    } else {
        console.log('invalid type');
    }
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
const authorize = (credentials, callback, args) => {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        switch (args.type) {
            case actions.LIST:
                callback(oAuth2Client, '');
                break;
            case actions.GET_FILE:
                if (args.fileId) {
                    callback(oAuth2Client, args.fileId);
                } else {
                    console.log('missing fileId argument');
                }
                break;
            case actions.UPLOAD_FILE:
                if (args.filePath) {
                    callback(oAuth2Client, args.filePath, args.parentId);
                } else {
                    console.log('missing filePath argument');
                }
                break;
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
const getAccessToken = (oAuth2Client, callback) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Uploads a file to a specific folder
 */
const uploadFile = (auth, filePath, parent) => {
    const drive = google.drive({version: 'v3', auth});
    const filename = path.basename(filePath);
    let fileMetadata = {
        'name': `${filename}`
    };
    // upload to specific parent folder if parent id is passed
    if (parent) {
        fileMetadata = {
            ...fileMetadata, parents: [parent],
        }
    }
    const media = {
        mimeType: 'image/png',
        body: fs.createReadStream(filePath)
    };
    drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    }, function (err, res) {
        if (err) {
            // Handle error
            console.log(err);
        } else {
            console.log('File Id: ', res.data.id);
        }
    });
};

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
const listFiles = (auth, nameParam) => {
    const drive = google.drive({version: 'v3', auth});
    getList(drive, '', nameParam);
};

const processList = (files) => {
    console.log('Processing...');
    files.forEach((file) => {
        console.log(`${file.name} (${file.id})`);
    });
}

/**
 *
 * @param drive
 * @param pageToken
 */
const getList = (drive, pageToken, nameParam) => {
    console.log(nameParam);
    drive.files.list({
        pageSize: 10,
        // q: `name=${nameParam}`,
        pageToken: pageToken ? pageToken : '',
        fields: 'nextPageToken, files(id, name)',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        if (files.length) {
            console.log('Files:');
            processList(files);
            if (res.data.nextPageToken) {
                getList(drive, res.data.nextPageToken);
            }
        } else {
            console.log('No files found.');
        }
    });
}

/**
 *
 * @param auth
 * @param fileId
 */
const getFile = (auth, fileId) => {
    const drive = google.drive({version: 'v3', auth});
    drive.files.get({fileId: fileId, fields: '*'}, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        console.log(res.data);
    });
}

const getArgs = () => {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach(arg => {
            // long arg
            if (arg.slice(0, 2) === '--') {
                const longArg = arg.split('=');
                const longArgFlag = longArg[0].slice(2, longArg[0].length);
                const longArgValue = longArg.length > 1 ? longArg[1] : true;
                args[longArgFlag] = longArgValue;
            }
            // flags
            else if (arg[0] === '-') {
                const flags = arg.slice(1, arg.length).split('');
                flags.forEach(flag => {
                    args[flag] = true;
                });
            }
        });
    return args;
}