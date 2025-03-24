const core = require("@actions/core");
const github = require("@actions/github");
const {IncomingWebhook} = require("@slack/webhook");

async function notify() {
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
          "text": `*:red_circle: Branch rebase \`${baseBranch}\`->\`${targetBranch}\` [failed]*`
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

module.exports = {
  notify
}