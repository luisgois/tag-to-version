var git = require('nodegit');
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

// return JSON payload values as string, no enclosing quotes
function stringify(value) {
    return eval(JSON.stringify(value));
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
  var repository = stringify(req.body.repository.slug);
  var project    = stringify(req.body.repository.project.key);

  //http://goi@gramme:7990/bitbucket/scm/nco/common_iem.git
  //var repositoryUrl  = 'ssh://' + bitbucketUser + '@' + bitbucketServer + '/' + project + '/' + repository + '.git';

  var repositoryUrl = 'http://goi@gramme.cfmu.corp.eurocontrol.int:7990/bitbucket/scm/nco/common_iem.git';
  var repositoryClonePath = local("../repos/" + project.toLowerCase() + "/" + repository.toLowerCase());

  console.log('git clone ' + repositoryUrl + ' # to dir ' + repositoryClonePath);

  var repository = git.Clone(repositoryUrl, repositoryClonePath)
    // Look up this known commit.
        .then(function(repo) {
            console.log('Cloned: to ' + repo.workdir());
            // Use a known commit sha from this repository.
            /*console.log(repo.getTag(tag));
                return repo.getCommit(commitHash);*/
            })
        .catch(function (err) {
          console.error(err);// failure is handled here
      });

  console.log(repository);


            //var sshPublicKeyPath = local("/home/" + bitbucketUser + "/.ssh/id_rsa.pub");
  //var sshPrivateKeyPath = local("/home/" + bitbucketUser + "/.ssh/id_rsa");

/*

  var cloneOptions = {
     fetchOpts: {
          callbacks: {
              certificateCheck: function() {
                  return 1;
              },
              credentials: function(url, userName) {
                  return NodeGit.Cred.sshKeyFromAgent(userName);
              }
          }
      }
  };

  var tagToVersionWorkDir = require('path').join(__dirname, '../../tag-to-version.workdir/' + repository);
  var cloneRepository = NodeGit.Clone(cloneURL, localPath, cloneOptions);

  var errorAndAttemptOpen = function() {
    return NodeGit.Repository.open(local);
  };

  cloneRepository.catch(errorAndAttemptOpen)
    .then(function(repository) {
        // Access any repository methods here.
        console.log("Is the repository bare? %s", Boolean(repository.isBare()));
  });*/


/*
  git.Clone(repositoryUrl, tagToVersionWorkDir, cloneOptions).then(function (repo) {
        console.log('Cloned: ' + repository + " to " + repo.workdir());
        // repo remote update
        //repo.fetchAll()
        //    .then(() => )
        // repo go to commit that triggered POST
        // get list of issues between last 2 tags
    }).catch(function (err) {
        console.log("Not cloned: " + err);
    });
*/

  // repo remote update
  // repo go to commit that triggered POST
  // get list of issues between last 2 tags


    /*
      foo = new cmd_exec('git clone', [repositoryUrl],
          function (me, data) {me.stdout += data.toString();},
          function (me) {me.exit = 1;}
      );

      setTimeout(
          // wait 0.25 seconds and print the output
          log_console,
          250);*/


  // check if JIRA already has version = tag, otherwise create it
  // update fixVersion of each issue with tag value

  // if everything ok, send 200, else send 400
  res.sendStatus(200);
});

module.exports = router;


