import * as readlineSync from 'readline-sync';
import * as fs from 'fs';
interface EnvironmentData {
  name: string;
  values: { key: string; value: string; type: string }[];
}

const baseUrl: string = readlineSync.question(
  'Enter api server Base URL with api/v1/: ',
);
const authToken: string = readlineSync.question('Enter Api Server AuthToken: ');
const environmentData: EnvironmentData = {
  name: 'environment',
  values: [
    { key: 'studio-api-baseUrl', value: baseUrl, type: 'text' },
    { key: 'access_Token', value: authToken, type: 'text' },
  ],
};

const environmentJson: string = JSON.stringify(environmentData, null, 2);
fs.writeFileSync('environment.json', environmentJson);
