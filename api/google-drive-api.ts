import {createFile, getFileId, getList, OAuth2Client, updateFile} from "../root/utils";
import {drive_v3, google} from "googleapis";
import * as fs  from 'fs';
import * as path from "path";
import {FileMediaType, FileMetadata} from "../root/model";

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
export const listFiles = (auth: OAuth2Client) => {
    const drive: drive_v3.Drive = google.drive({version: 'v3', auth});
    getList(drive, '');
};

/**
 *
 * @param auth
 * @param fileId
 */
export const getFile = (auth: OAuth2Client, fileId: string): void => {
    const drive = google.drive({version: 'v3', auth});
    drive.files.get({fileId: fileId, fields: '*'}, (err, res) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        console.log(res.data);
    });
}

/**
 * Uploads a file to a specific folder
 */
export const uploadFile = (auth: OAuth2Client,
                           filePath: string,
                           mimeType?: string,
                           parentId?: string) => {
    const drive = google.drive({version: 'v3', auth});
    const name = path.basename(filePath);

    let fileMetadata: FileMetadata = {
        name,
        parents: '',
    };

    const media: FileMediaType = {
        body: fs.createReadStream(filePath),
        mimeType,
    };
    // upload to specific parent folder if parent id is passed
    if (!!parentId) { // create NEW file
        fileMetadata = {
            ...fileMetadata,
            parents: [parentId],
        }
        createFile(drive, fileMetadata, media);
    } else { // update existing ONE
        // search for file with specific filename
        getFileId(drive, '', name).then(result => {
            if (result) {
                updateFile(drive, fileMetadata, media, result);
            } else {
                console.log(`Error updating file: ${name}`);
            }
        }).catch(err => {
            console.log(`Error updating file: ${name}`);
            console.error(err);
        });
    }

};
