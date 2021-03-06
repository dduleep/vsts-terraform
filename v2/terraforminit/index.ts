import * as tl from 'azure-pipelines-task-lib';
import fs = require('fs');
import { InitCommandBuilder } from '../common/terraformCommandBuilder'
import { loginAzure, setAzureCloudBasedOnServiceEndpoint } from '../common/utilities';

async function run() {
    try {
        let workDir: string = tl.getInput('cwd', true);
        if (!fs.existsSync(workDir)) {
            throw new Error(`Directory ${workDir} does not exist.`);
        }

        if (tl.getBoolInput('useazurerm', true)) {
            setAzureCloudBasedOnServiceEndpoint();
            loginAzure();
        }

        let initBuilder = new InitCommandBuilder(workDir);
        if (tl.getBoolInput('initbackend', true)) {
            initBuilder.setBackend(
                tl.getInput('backendrg', false),
                tl.getInput('backendstorage', false),
                tl.getInput('backendcontainer', false),
                tl.getInput('backendkey', false));
        }

        if(tl.getInput('backendConfigPath', false) != null) {
            initBuilder.setBackendConfig(tl.getPathInput('backendConfigPath'));
        }

        let tfRootPath = tl.getInput('tfrootpath', false);
        if (tfRootPath !== null) {
            initBuilder.setCustomCommandLine(tfRootPath);
        }

        initBuilder.execute();

        tl.setResult(tl.TaskResult.Succeeded, 'Terraform was downloaded successfully.');
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();