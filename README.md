## A node.js Google Drive API

1. list all files `list`
2. get specific file `file`
3. upload specific file to a specific folder `upload`

### Prerequisites
- create your own credentials.json --> https://developers.google.com/drive/api/v3/quickstart/nodejs
- install googledrive libraries `npm install googleapis@39 --save`
- First time you execute one of the available apis, you need to authenticate/authorize the app by creating your own token.json

### Execute
`node index.js --type=list`

`node index.js --type=file --fileId=11IeF2t9IUKIBiA__n2Mxm5EAQ1ripsSl`

`node index.js --type=upload --parentId=11IeF2t9IUKIBiA__n2Mxm5EAQ1ripsSl --filePath=/temp/python/PythonDataVisualization/jkonst/speed-test/graphs/speed-cli-2021-02-06-graph.png`
