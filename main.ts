import {promises as fs} from 'fs';
import {authorize, getArgs, getList, isArgsTypeValid, OAuth2Client} from "./root/utils";
import {actions, Argument} from "./root/model";
import {getFile, listFiles, uploadFile} from "./api/google-drive-api";

/**
 * Load client secrets from a local file
 */
const start = async (credentialFileName: string) => {
    try {
        const content: Buffer = await fs.readFile(credentialFileName)
        const args: Argument = getArgs();
        if (args?.type && !!content && isArgsTypeValid(args.type)) {
            const oAuth2Client = await authorize(JSON.parse(content as unknown as string));
            switch (args.type) {
                case actions.LIST:
                    listFiles(oAuth2Client);
                    break;
                case actions.GET_FILE:
                    getFile(oAuth2Client, args.fileId);
                    break;
                case actions.UPLOAD_FILE:
                    uploadFile(oAuth2Client, args.filePath, args.mimeType, args.parentId);
                    break;
                default:
                    console.log('type: ' + args.type + ' is not valid');
            }
        } else {
            console.log('You did not enter type');
        }
    } catch (error) {
        console.log('Error loading client secret file:');
        return;
    }

};

start('./keys/credentials.json');
