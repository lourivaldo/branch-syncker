const core = require('@actions/core');
const github = require('@actions/github');
const simpleGit = require('simple-git');

const git = simpleGit('.');

async function run() {
  const status = await git.status();
  // console.log(status)
  const ORIGIN_BRANCH = core.getInput('origin_branch');
  const BRANCH = core.getInput('branch');

  await git.checkout(ORIGIN_BRANCH);
  await git.fetch('origin');
  await git.checkout(BRANCH);
  await git.rebase(ORIGIN_BRANCH);
  await git.push('origin', BRANCH, { '--force-with-lease': true });


  // Get the JSON webhook payload for the event that triggered the workflow
  // git checkout ${{ github.event.repository.default_branch }}
  // git fetch origin
  // git checkout hotfix
  // git rebase ${{ github.event.repository.default_branch }}
  // git push --force-with-lease
}

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('branch');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  run()
  // const payload = JSON.stringify(github.context.payload, undefined, 2)
  // // console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
