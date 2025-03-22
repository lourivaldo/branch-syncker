const core = require('@actions/core');
const github = require('@actions/github');
const simpleGit = require('simple-git');
const { IncomingWebhook } = require('@slack/webhook');

const git = simpleGit('.');

async function rebaseBranch() {
  const baseBranch = core.getInput('origin-branch');
  const targetBranch = core.getInput('branch');
  console.log(`${baseBranch}->${targetBranch}`)

  await git.checkout(baseBranch);
  await git.fetch('origin');
  await git.checkout(targetBranch);
  try {
    const rebaseResult = await git.rebase([baseBranch]);
    console.log('rebaseResult', rebaseResult)
    await git.push('origin', targetBranch, { '--force-with-lease': true });
    const pushResult = await git.push('origin', targetBranch, { '--force-with-lease': true });
    console.log('pushResult', pushResult)
  } catch (error) {
    console.log('error')
    console.log(error)
    throw new Error('Rebase conflict')
  }
}

async function notify() {
  const url = core.getInput('slack-webhook');
  console.log(url)
  const webhook = new IncomingWebhook(url);
  await webhook.send({
    text: 'I\'ve got news for you...',
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*:red_circle: GitHub Branch Sync [failed]*"
        }
      }
    ]
  });
}

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('branch');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  rebaseBranch()
    .catch(() => {
      notify()
    })
  // const payload = JSON.stringify(github.context.payload, undefined, 2)
  // // console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
