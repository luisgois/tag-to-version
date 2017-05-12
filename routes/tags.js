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

  var refChanges = req.body.refChanges;
  //console.log(JSON.stringify(refChanges));

  // check if tag

  var regex = /^refs\/tags\/(.+)$/;
  var tag;
  for (var i=0; i<refChanges.length; i++){
      var refId = eval(JSON.stringify(refChanges[i].refId));
      var result = refId.match(regex);
      tag=result[1];
      var operation = eval(JSON.stringify(refChanges[i].type));

      console.log(tag);
      console.log(operation);

      if (tag && operation == 'ADD') {
         console.log(tag);
         break;
      }
  }

  if (!tag || operation != 'ADD') return res.sendStatus(200); // no tag found

  console.log('TAG found:' + tag);

  // check if repo already cloned, otherwise clone
  var repository = eval(JSON.stringify(req.body.repository.slug));
  var project    = eval(JSON.stringify(req.body.repository.project.key));
  var repositoryUrl  = bitbucketUrl + '/' + project + '/' + repository + '.git';

  console.log('git clone ' + repositoryUrl);

  var changesetsValues= req.body.changesets.values;
  console.log(JSON.stringify(changesetsValues));

  // check if tag

  for (var i=0; i<changesetsValues.length; i++){

      console.log(changesetsValues[i]);

  }

/*
  foo = new cmd_exec('git clone', [repositoryUrl],
      function (me, data) {me.stdout += data.toString();},
      function (me) {me.exit = 1;}
  );

  setTimeout(
      // wait 0.25 seconds and print the output
      log_console,
      250);*/

  // repo remote update
  // repo go to commit that triggered POST
  // get list of issues between last 2 tags

  // check if JIRA already has version = tag, otherwise create it
  // update fixVersion of each issue with tag value

  // if everything ok, send 200, else send 400
  res.sendStatus(200);
});

module.exports = router;


