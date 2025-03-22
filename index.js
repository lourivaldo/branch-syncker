const core = require('@actions/core');
const github = require('@actions/github');
const simpleGit = require('simple-git');
const { IncomingWebhook } = require('@slack/webhook');

const baseBranch = core.getInput('origin-branch');
const targetBranch = core.getInput('branch');
const git = simpleGit('.');

async function rebaseBranch() {
  console.log(`${baseBranch}->${targetBranch}`)

  await git.checkout(baseBranch);
  await git.fetch('origin');
  await git.checkout(targetBranch);
  try {
    const rebaseResult = await git.rebase([baseBranch]);
    console.log('rebaseResult', rebaseResult)
    await git.push('origin', targetBranch, { '--force-with-lease': true });
    const pushResult = await git.push('origin', targetBranch, { '--force-with-lease': true });
  } catch (error) {
    console.log('error')
    console.log(error)
    throw new Error('Rebase conflict')
  }
}

async function notify() {
  const url = core.getInput('slack-webhook');
  const { runId } = github.context
  const { name, html_url } = github.context.payload.repository

  const webhook = new IncomingWebhook(url);
  await webhook.send({
    text: 'wfef',
    blocks: [
      {
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*:red_circle: GitHub Branch Sync \`${targetBranch}\` [failed]*`
            }
          },
          // {
          //   "type": "section",
          //   "fields": [
          //     {
          //       "type": "mrkdwn",
          //       "text": `*Repo*\n<${html_url}|${name}>`
          //     },
          //     {
          //       "type": "mrkdwn",
          //       "text": `*Build Logs*\n<${html_url}/actions/runs/${runId}|View Logs>`
          //     }
          //   ]
          // }
        ]
      }
    ]
  });
}

try {
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  rebaseBranch()
    .catch(() => {
      notify()
    })
} catch (error) {
  core.setFailed(error.message);
}
