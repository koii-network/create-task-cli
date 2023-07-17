const os = require("os");
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");

let str = `
json_rpc_url: "hhtp://192.168.18.114"
websocket_url: ""
keypair_path: /home/dev/.config/koii/id.json
address_labels:
  "11111111111111111111111111111111": System Program
commitment: confirmed
`

console.log(yaml.parse(fs.readFileSync("kkkk")))