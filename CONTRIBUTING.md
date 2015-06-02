# Contributing

Your input and contributions are very welcome! Please open issues with improvements, feature requests or bug reports.

If you want to contribute source code, add documentation or fix spelling mistakes try this:

1. [Fork](http://help.github.com/forking/) the project.
1. Install vendor libraries needed for testing etc. via `npm install`.
1. Make your changes and additions (e.g. in a new branch created via ```git branch -b your-issue```).
1. Verify your changes by making sure that `npm test` doesn't fail and add your own tests if appropriate.
1. Verify that the `/demo` page still works and maybe even add a demo to showcase your change.
1. Add, commit, squash and push the changes to your forked repository.
1. Send a [pull request](http://help.github.com/pull-requests/) with a well written issue describing the change and why it is necessary.

Please try to adhere to the coding style that is used throughout the other source files.

Conversion follows [Semantic Versioning](http://semver.org/).

There is no Contributor License Agreement (CLA) to sign, but you have to accept and agree to the [license](LICENSE) and the Contributor Code of Conduct (CoC) to get your patches included.

## Contributor Code of Conduct

As contributors and maintainers of this project, we pledge to respect all people who contribute through reporting issues, posting feature requests, updating documentation, submitting pull requests or patches, and other activities.

We are committed to making participation in this project a harassment-free experience for everyone, regardless of level of experience, gender, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, age, or religion.

Examples of unacceptable behavior by participants include the use of sexual language or imagery, derogatory comments or personal attacks, trolling, public or private harassment, insults, or other unprofessional conduct.

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct. Project maintainers who do not follow the Code of Conduct may be removed from the project team.

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by opening an issue or contacting one or more of the project maintainers.

This Code of Conduct is adapted from the [Contributor Covenant](http://contributor-covenant.org), version 1.0.0, available at [http://contributor-covenant.org/version/1/0/0/](http://contributor-covenant.org/version/1/0/0/).

## Release Procedure

**Before releasing, make sure that:**

1. all changes are merged into a single branch, named like the new version (e.g. `2.4.1`)
1. all Github issues associated with this release are closed
1. all Github issues associated with this release are attached to a milestone with the same name as the branch.

**To prepare the release, follow these steps:**

1. Add a new version to [CHANGELOG.md](CHANGELOG.md) in the following format:

    ```
    # 2.4.1 (2015-06-01)

    * Docs: added release procedure (#97)
    * Updated dependencies (#96)
    ```

    Make sure to include the correct date of the release and the issue number for each change. If there's a change with
    no existing issue, write an issue that explains what the change is and why it was made and then add the number.

1. Run `npm update --save` to update dependencies
1. Check, if the test still run with `npm test`
1. Run `npm shrinkwrap`
1. Change the package version in [package.json](package.json).
1. Commit the updated `package.json` and `npm-shrinkwrap.json`

**After that, finally release:**

1. Merge the release branch into `master`
1. `git push` to github
1. Go to the [relases page](https://github.com/berlinonline/converjon/releases) and draft a new release.

    The relase name is the version number, with no prefix, only "2.4.1". The same for the tag version.

    For the description, copy the change list from the updated [CHANGELOG.md](CHANGELOG.md). Only the changes, not the
    headline.
1. Publish the release. Github will automatically create a git tag.
1. On the master branch, run `npm publish`.
1. Close the Milestone.
