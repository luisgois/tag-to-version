var express = require('express');
var router = express.Router();
var bitbucketUrl = process.env.BITBUCKET_URL;

function cmd_exec(cmd, args, cb_stdout, cb_end) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
    me.exit = 0;  // Send a cb to set 1 when cmd exits
    me.stdout = "";
    child.stdout.on('data', function (data) { cb_stdout(me, data) });
    child.stdout.on('end', function () { cb_end(me) });
}

function log_console() {
    console.log(foo.stdout);
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
          if (eval(JSON.stringify(refChanges[i].new.type)) == 'tag' ) {
              tag = eval(JSON.stringify(refChanges[i].new.name));
              commitHash = eval(JSON.stringify(refChanges[i].new.target.hash));
              console.log('Created tag: ' + tag);
              break;
          }
      }
      else {
          if (eval(JSON.stringify(refChanges[i].old.type)) == 'tag' ) {
              tag = eval(JSON.stringify(refChanges[i].old.name));
              console.log('Removed tag: ' + tag);
              break;
          }
      }
  }

  if (!tag) return res.sendStatus(200); // no tag found for processing

  console.log('TAG found:' + tag);

  // check if repo already cloned, otherwise clone
  var repository = eval(JSON.stringify(req.body.repository.slug));
  var project    = eval(JSON.stringify(req.body.repository.project.key));
  var repositoryUrl  = bitbucketUrl + '/' + project + '/' + repository + '.git';

  console.log('git clone ' + repositoryUrl);

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


