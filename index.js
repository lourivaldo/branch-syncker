const core = require('@actions/core');
const github = require('@actions/github');
const simpleGit = require('simple-git');

const git = simpleGit('.');

async function run() {
  const status = await git.status();
  // console.log(status)
  const baseBranch = core.getInput('origin_branch');
  const targetBranch = core.getInput('branch');
  console.log(`${baseBranch}->${targetBranch}`)

  await git.checkout(baseBranch);
  await git.fetch('origin');
  await git.checkout(targetBranch);
  const rebaseResult = await git.rebase(baseBranch);
  console.log(rebaseResult)
  await git.push('origin', targetBranch, { '--force-with-lease': true });

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
