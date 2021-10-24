import * as fs from 'fs';

export interface GoogleCredential {
    installed: GoogleInstalledToken;
}

export interface GoogleInstalledToken {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
}

export interface Argument {
    type: string;
    fileId?: string;
    parentId?: string;
    filePath?: string;
}

export interface FileMetadata {
    name: string;
    parents: string | string[];
}

export interface FileMediaType {
    body: fs.ReadStream;
    mimeType?: string;
}

export const actions = {
    LIST: "list",
    GET_FILE: "file",
    UPLOAD_FILE: "upload"
}
