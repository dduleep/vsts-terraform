import * as tl from 'vsts-task-lib';
import fs = require('fs');

import {
    ApplyCommandBuilder,
    InitCommandBuilder,
    PlanCommandBuilder,
    WorkspaceCommandBuilder,
    StoreOutputCommandBuilder,
} from './terraformCommandBuilder';
import { downloadTerraform, loginAzure } from './utilities';

async function run() {
    try {
        let workDir: string = tl.getInput('cwd', true);
        if (!fs.existsSync(workDir)) {
            throw new Error(`Directory ${workDir} does not exist.`);
        }

        let download = tl.getBoolInput('download', true);
        if (download) {
            let tfVersion: string = tl.getInput('tfversion', true);
            if (!new RegExp('^(\d+\.)(\d+\.)(\d+)$').test(tfVersion)) {
                throw new Error(`Version ${tfVersion} is not an acceptable Terraform version number`);
            }
            await downloadTerraform(workDir, tfVersion);
        }

        if (tl.getBoolInput('useazurerm', true)) {
            loginAzure();
        }

        if (tl.getBoolInput('init', true)) {
            new InitCommandBuilder(workDir)
                .setBackend(
                    tl.getInput('backendrg', true),
                    tl.getInput('backendstorage', true),
                    tl.getInput('backendcontainer', true),
                    tl.getInput('backendkey', true)
                ).execute();
        }

        if (tl.getBoolInput('useworkspace', true)) {
            let workspace = tl.getInput('workspace', true);
            try {
                new WorkspaceCommandBuilder(workDir)
                    .setSelect(workspace)
                    .execute();
            } catch {
                new WorkspaceCommandBuilder(workDir)
                    .setNew(workspace)
                    .execute();
            }
        }

        let cmdType: string = tl.getInput('cmdType', true);
        switch (cmdType) {
            case "plan":
                var planBuilder = new PlanCommandBuilder(workDir);
                var varsFile = tl.getInput('varsfile', false)
                if (varsFile) {
                    planBuilder.setVarsFile(varsFile);
                }
                let savePlanResult = tl.getBoolInput('savePlanResult', true);
                if (savePlanResult) {
                    planBuilder.savePlan(tl.getInput('planOutput', true));
                }
                planBuilder.execute();
                break;
            case 'apply':
                var applyBuilder = new ApplyCommandBuilder(workDir);
                var varsFile = tl.getInput('varsfile', false)
                if (varsFile) {
                    applyBuilder.setVarsFile(varsFile);
                }
                let usePlanResult = tl.getBoolInput('usePlanResult', true);
                if (usePlanResult) {
                    applyBuilder.setOutput(tl.getInput('applyInput', true));
                }
                applyBuilder.execute();
                break;
            default:
                break;
        }

        if (tl.getBoolInput('storeoutput', true)) {
            new StoreOutputCommandBuilder(workDir, tl.getInput('taskoutputname', true))
                .setOutputName(tl.getInput('tfoutputname', true))
                .execute();
        }

        tl.setResult(tl.TaskResult.Succeeded, "Ok !")
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();
