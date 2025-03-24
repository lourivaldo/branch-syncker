const core = require('@actions/core');
const github = require('@actions/github');
const { IncomingWebhook } = require('@slack/webhook');
const simpleGit = require('simple-git');

const user = core.getInput('user');
const email = core.getInput('email');

const git = simpleGit('.')
  .addConfig('user.name', user)
  .addConfig('user.email', email);

async function rebaseBranch(sourceBranch, targetBranch) {
  console.log(`${sourceBranch}->${targetBranch}`)
  await git.checkout(sourceBranch);
  await git.fetch('origin');
  await git.checkout(targetBranch);
  try {
    await git.rebase([sourceBranch]);
    await git.push('origin', targetBranch, { '--force-with-lease': true });
  } catch (error) {
    console.log('error', error)
    throw new Error('Rebase conflict')
  }
}

async function notify(fromBranch, toBranch) {
  const url = core.getInput('slack-webhook');
  const { runId } = github.context
  const { name, html_url } = github.context.payload.repository

  const webhook = new IncomingWebhook(url);
  await webhook.send({
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*:red_circle: Branch rebase \`${fromBranch}\`->\`${toBranch}\` [failed]*`
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*Repo*\n<${html_url}|${name}>`
          },
          {
            "type": "mrkdwn",
            "text": `*Build Logs*\n<${html_url}/actions/runs/${runId}|View Logs>`
          }
        ]
      }
    ]
  });
}

const sourceBranch = core.getInput('source-branch');
const targetBranch = core.getInput('target-branch');

const result = {
  sourceBranch,
  targetBranch,
  success: false
}
try {
  rebaseBranch(sourceBranch, targetBranch)
    .then(() => {
      core.setOutput("rebase", result);
    })
    .catch(() => {
      result.success = true
      notify(sourceBranch, targetBranch)
      core.setOutput("rebase", result);
    })
} catch (error) {
  core.setFailed(error.message);
}
