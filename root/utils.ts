import {drive_v3, google, GoogleApis} from 'googleapis';
import {promises as fs} from 'fs';
import * as readline from 'readline';
import {actions, Argument, FileMediaType, FileMetadata, GoogleCredential} from "./model";
import Params$Resource$Files$Create = drive_v3.Params$Resource$Files$Create;

export type OAuth2Client = typeof GoogleApis.prototype.auth.OAuth2.prototype;

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './keys/token.json'; // path relative to main.ts
const SCOPES = ['https://www.googleapis.com/auth/drive'];

export const getArgs = (): Argument => {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach(arg => {
            // long arg
            if (arg.slice(0, 2) === '--') {
                const longArg = arg.split('=');
                const longArgFlag = longArg[0].slice(2, longArg[0].length);
                args[longArgFlag] = longArg.length > 1 ? longArg[1] : true;
            }
            // flags
            else if (arg[0] === '-') {
                const flags = arg.slice(1, arg.length).split('');
                flags.forEach(flag => {
                    args[flag] = true;
                });
            }
        });
    return args as Argument;
}

export const isArgsTypeValid = (type: string) => {
    return Object.values(actions).includes(type);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
export const authorize = async (credentials: GoogleCredential): Promise<OAuth2Client> => {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client: OAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    // Check if we have previously stored a token.
    try {
        const token = await fs.readFile(TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(token as unknown as string));
        return oAuth2Client;
    } catch (error) {
        await getAndStoreAccessToken(oAuth2Client);
        return oAuth2Client;
    }
}

export const createFile = (drive: drive_v3.Drive, metadata: FileMetadata, media: FileMediaType): void => {
    drive.files.create({
        resource: metadata,
        media: media,
        fields: 'id'
    } as Params$Resource$Files$Create, (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Created File w/ Id: ', res.data.id);
        }
    });
};

export const updateFile = (drive: drive_v3.Drive, metadata: FileMetadata, media: FileMediaType, id: string): void => {
    drive.files.update({
        fileId: id,
        resource: metadata,
        media: media
    }as Params$Resource$Files$Create, (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Updated File w/ Id: ', res.data.id);
        }
    });
};

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
const getAndStoreAccessToken = async (oAuth2Client) => {
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
            if (err) {
                console.error('Error retrieving access token', err);
                return;
            }
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token)).then((_) => {
                console.log('Token stored to', TOKEN_PATH);
            }).catch((error) => {
                console.error(error);
            });
        });
    });
}

/**
 *
 * @param drive
 * @param pageToken
 */
export const getList = (drive: drive_v3.Drive, pageToken: string): void => {
    drive.files.list({
        pageSize: 10,
        pageToken: pageToken ? pageToken : '',
        fields: 'nextPageToken, files(id, name)',
    }, (error, res) => {
        if (error) {
            console.log('The API returned an error: ' + error);
            return;
        }
        const files = res.data.files;
        if (files?.length && files.length > 0) {
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
 * A function that returns the file id after searching for a file on drive
 * based on its name
 * @param drive
 * @param pageToken
 * @param fileName
 */
export const getFileId = async(drive: drive_v3.Drive,
                          pageToken: string,
                          fileName: string,
                          ): Promise<string | null> => {
    const res = await drive.files.list({
        pageSize: 10,
        q: `name='${fileName}'`,
        pageToken: pageToken ? pageToken : '',
        fields: 'nextPageToken, files(id, name)',
    });
    if (res) {
        const files = res.data.files;
        if (files?.length && files.length === 1) {
            console.log('File found: ' + files[0].id);
            return files[0].id;
        } else {
            console.log(`0 or more than 1 entries of File with name: ${fileName} were found`);
            return null;
        }
    } else {
        return null;
    }
}

const processList = (files: drive_v3.Schema$File[]) => {
    console.log('Processing...');
    files.forEach((file) => {
        console.log(`${file.name} (${file.id})`);
    });
}

