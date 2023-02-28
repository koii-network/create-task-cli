/**
 * Hello world
 */

import {
    establishConnection,
} from './task_contract_test';
import prompts from 'prompts';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@_koi/web3.js';
import fs, { existsSync } from 'fs';
import { config } from 'dotenv';
import { tmpdir } from "os";
import { join } from "path"
import { Web3Storage, getFilesFromPath } from 'web3.storage';
config();
let web3Key: string | null;
async function main() {
    web3Key = process.env["web3_key"] || null
    if (!web3Key) {
        while (!web3Key)
            web3Key = (
                await prompts({
                    type: 'text',
                    name: 'web3Key',
                    message: 'Enter your WEB3 Access Key',
                    validate: value => value ? true : "Please Enter a valid WEB3 Access key"
                })
            ).web3Key;
    }
    const mode = (
        await prompts({
            type: 'select',
            name: 'mode',
            message: 'Select operation',

            choices: [
                { title: 'Generate Metadata', value: 'generate-metadata' },
                { title: 'upload local vars to IPFS', value: 'generate-locals' },

            ],
        })
    ).mode;
    console.log(mode);
    switch (mode) {
        case "generate-metadata": {
            await takeInputForMetadata();
            break;
        }
        case "generate-locals": {
            //  let web3Key = process.env["web3_key"] || null
            await processUploadLocalVars()

        }
        // const connection = await establishConnection();
    }

}
const processUploadLocalVars = async () => {
    let filePath = (
        await prompts({
            type: 'text',
            name: 'filePath',
            message: 'Enter the path of the file.',
            validate: v => existsSync(v) ? true : "Please enter a valid file path"
        })
    ).filePath;
    console.log("UPLOADING TO IPFS ")
    let data = fs.readFileSync(filePath, { encoding: "utf-8" });
    try {
        data = JSON.parse(data);
    } catch (e) {

        console.log("Not a valid Json FIle")
    }
    const storageClient = new Web3Storage({ token: web3Key as string });
    let upload = await getFilesFromPath([filePath])
    upload[0].name = "locals.json"
    let result = await storageClient.put(upload);
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', `Your Environment variables CID is ${result}/locals.json`)



}
async function takeInputForMetadata() {
    let metadata = {
        name: "",
        description: "",
        author: "",
        githubURL: "",
        imageURL: "",
        createdAt: "",
        nodeSpec: {
            storage: "",
            cpu: "",
            memory: "",
            os: "",
            network: "",
        }
    }

    metadata.name = (
        await prompts({
            type: 'text',
            name: 'task_name',
            message: 'Enter the name of the task',
        })
    ).task_name;
    metadata.author = (
        await prompts({
            type: 'text',
            name: 'author',
            message: 'Enter the name of the task Author',
        })
    ).author;
    metadata.description = (
        await prompts({
            type: 'text',
            name: 'description',
            message: 'Enter the task description',
        })
    ).description;
    metadata.githubURL = (
        await prompts({
            type: 'text',
            name: 'githubURL',
            message: 'Enter the task Github Repository URL',
        })
    ).githubURL;
    metadata.imageURL = (
        await prompts({
            type: 'text',
            name: 'imageURL',
            message: 'Enter the task Image URL',
        })
    ).imageURL;
    metadata.nodeSpec.cpu = (
        await prompts({
            type: 'text',
            name: 'cpu',
            message: 'Enter the minimum CPU cores required to run this task',
        })
    ).cpu;
    metadata.nodeSpec.memory = (
        await prompts({
            type: 'text',
            name: 'ram',
            message: 'Enter the minimum RAM required to run this task',
        })
    ).ram;
    metadata.nodeSpec.network = (
        await prompts({
            type: 'text',
            name: 'network',
            message: 'Enter the minimum Network Bandwidth required to run this task',
        })
    ).network;

    metadata.nodeSpec.os = (
        await prompts({
            type: 'multiselect',
            name: 'os',
            message: 'Select OS on which your task can run',
            choices: [
                { title: "Linux", value: "Linux" },
                { title: "Windows", value: "Windows" },
                { title: "MacOS", value: "MacOS" }
            ]
        })
    ).os;

    console.log(metadata);
    let tmp = tmpdir();
    let metadataPath = join(tmp, "metadata.json")
    fs.writeFileSync(metadataPath, JSON.stringify(metadata))
    const storageClient = new Web3Storage({ token: web3Key as string });
    let upload = await getFilesFromPath([metadataPath])
    let result = await storageClient.put(upload);
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', `Your MetaData CID is ${result}/metadata.json`)


}

export default main;