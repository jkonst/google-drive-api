## A node.js Google Drive API in Typescript

1. list all files `list`
2. get specific file `file`
3. upload specific file to a specific folder `upload`

### Prerequisites
- create your own credentials.json --> https://developers.google.com/drive/api/v3/quickstart/nodejs
- install google-drive libraries `npm install googleapis@39 --save`
- First time you execute one of the available apis, you need to authenticate/authorize the app by creating your own token.json

### Execute
`npm start -- --type=list`

`npm start -- --type=file --fileId=11IeF2t9IUKIBiA__n2Mxm5EAQ1ripsSl`

`npm start -- --type=upload
--parentId=11IeF2t9IUKIBiA__n2Mxm5EAQ1ripsSl
--mimeType=image/png
--filePath=/temp/python/PythonDataVisualization/jkonst/speed-test/graphs/speed-cli-2021-02-06-graph.png
`
