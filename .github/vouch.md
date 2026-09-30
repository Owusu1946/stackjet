# Contributor trust

We use [Vouch](https://github.com/mitchellh/vouch) to record trusted contributors in
[VOUCHED.td](VOUCHED.td). This initial list includes the repository's current contributors.
Leaving someone off the list means they are unvouched. It does not denounce them.

Owusu1946, mhaadiabu, and Sonnysam can vouch, unvouch, and denounce contributors.
[VOUCHED-MANAGERS.td](VOUCHED-MANAGERS.td) records this permission for all three actions.

Run the **Manage contributor trust** workflow with an action, a GitHub username, and a reason.
It reads the maintainer list from `dev` and opens the change as a PR against `dev`.
Review and merge that PR manually. The workflow does not merge PRs.
GitHub requires this workflow on the default branch before it appears in the Actions menu.

Changes to either trust list should also target `dev` when submitted manually.
This setup records trust and manages the list. It does not automatically close or lock issues
or PRs from unvouched contributors.
