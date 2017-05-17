var Git = require('nodegit');
var express = require('express');
var path = require('path');

var router = express.Router();

var bitbucketServer = process.env.ACM_BITBUCKET_SERVER;
var bitbucketUser = process.env.ACM_BITBUCKET_USER;
var bitbucketPassword = process.env.ACM_BITBUCKET_PASSWORD;
var jiraUrl = process.env.ACM_JIRA_URL;
var jiraUser = process.env.ACM_JIRA_USER;
var jiraPassword = process.env.ACM_JIRA_PASSWORD;
var local = path.join.bind(path, __dirname);

// TODO git-promise
// TODO node-git-tags (semver)
// TODO node-semver

// if none of the above results, go for Jenkins as webservice (logs and retry of POST to Jira for free)

// TODO update JIRA with version, files (and git diff?!) in the issue comments


var cloneOptions = {
    fetchOpts: {
        callbacks: {
            certificateCheck: function() {
                return 1;
            },
            credentials: function(url, userName) {
                return Git.Cred.sshKeyFromAgent(userName);
            }
        },
        downloadTags: 1
    }
};

// return JSON payload values as string, no enclosing quotes
function stringify(value) {
    return eval(JSON.stringify(value));
}

function getVersionArray(repo, commit) {
    repo.createRevWalk(String)
    .then( function(tag_list) {
        callback(null, tag_list);
    })
}

function hasTag(commit) {
    return Git.Tag.commit.toString() != magicSha;
}

// get list of issues and modified files for each commit between since previous tag
function getUpdates(repo, tagName) {
    var cloneOptions = {
        fetchOpts: {
            callbacks: {
                certificateCheck: function() {
                    return 1;
                },
                credentials: function(url, userName) {
                    return Git.Cred.sshKeyFromAgent(userName);
                }
            },
            downloadTags: 1
        }
    };

    console.log('fetching latest updates...');

    // repo remote update
    Git.Remote.setAutotag(repo, 'origin', 1);


    repo.fetch('origin',cloneOptions)
        .then(function() {
            console.log('fetched');
        })
        .catch(function(err) {
            console.error(err);
        });

    //git-cli branch

    // repo go to commit that triggered POST


    // get list of issues between last 2 tags
    Git.Tag.list(repo)
        .then(function(tagNames) {
            return tagNames.filter(function (tagNameTest) {
                return tagName !== tagNameTest;
            })
        })
        .then(function(tagNames) {
            console.log(tagNames);
        });

/*    var revwalk = repo.createRevWalk();
    revwalk.getCommitsUntil(hasTag)
        .then(function(array) {
            // Use array
        });*/
}

//TODO check if environment variables are set at application launch and abort otherwise

/* GET webhook payload listing. */
router.get('/', function(req, res, next) {
  var resText='this was a GET' + req.body;
  res.send(resText);
  console.log(resText);
});

/* GET webhook payload listing. */
router.post('/', function(req, res, next) {
  var tagToVersionWorkDir = require('path').join(__dirname, '../../tag-to-version-workdir/');

  if (!req.body) return res.sendStatus(400);

  console.log(req.body);
  console.log('==============================');

  var refChanges = req.body.push.changes;

  // check if tag

  var tag;
  var created;
  var commitHash;

  for (var i=0; i<refChanges.length; i++){
      console.log(refChanges[i]);

      // boolean, true if push is about a ref creation
      created=eval(JSON.stringify(refChanges[i].created));

      if (created) {
          if (stringify(refChanges[i].new.type) == 'tag' ) {
              tag = stringify(refChanges[i].new.name);
              commitHash = stringify(refChanges[i].new.target.hash);
              console.log('Created tag: ' + tag + ' on ' + commitHash);
              break;
          }
      }
      else {
          if (stringify(refChanges[i].old.type) == 'tag' ) {
              tag = stringify(refChanges[i].old.name);
              console.log('Removed tag: ' + tag);
          }
      }
  }

  if (!tag) return res.sendStatus(200); // no tag found for processing

  console.log('TAG found:' + tag);

  // check if repo already cloned, otherwise clone

  var repositoryName = stringify(req.body.repository.slug);
  var projectName    = stringify(req.body.repository.project.key);

  // We can clone using
    // http://goi@gramme:7990/bitbucket/scm/nco/common_iem.git
    // or
    // ssh://git@gramme:7999/nco/common_iem.git

  //var repositoryUrl = 'http://goi@gramme.cfmu.corp.eurocontrol.int:7990/bitbucket/scm/nco/common_iem.git';
  var repositoryUrl  = 'ssh://' + bitbucketUser + '@' + bitbucketServer + '/' + projectName + '/' + repositoryName + '.git';
  var repositoryClonePath = local("../repos/" + projectName.toLowerCase() + "/" + repositoryName.toLowerCase());

  // Credentials are required for ssh cloning authentication

  var updates;

  Git.Repository.open(repositoryClonePath)
      .then(function (repo) {
        // This is the first function of the then which contains the successfully
        // calculated result of the promise
        console.log('using repository clone in ' + repositoryClonePath);

        updates = getUpdates(repo, tag);
      })
      .catch(function (reasonForFailure) {
        // failure is handled here
        console.error(reasonForFailure);

        // TODO clone only if directory not present

        console.log('cloning repository ' + repositoryUrl + ' to dir ' + repositoryClonePath);

        Git.Clone(repositoryUrl, repositoryClonePath, cloneOptions)
        .then(function (repo) {
            console.log('Cloned: to ' + repo.workdir());
            // Use a known commit sha from this repository.
            /*console.log(repo.getTag(tag));
            return repo.getCommit(commitHash);*/

            updates = getUpdates(repo, tag);
        })
        .catch(function (err) {
            console.error(err);// failure is handled here
            res.sendStatus(900);
        });
      });


  // check if JIRA already has version = tag, otherwise create it
  // update fixVersion of each issue with tag value

  // if everything ok, send 200, else send 400
  res.sendStatus(200);
});

module.exports = router;


