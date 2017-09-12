<!doctype html>
<html>
  <head>
    <title>WorkForce Gmail API</title>
    <meta charset="UTF-8">
	<meta name="autor" content="Ariel Garcia leirags@gmail.com">
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap-theme.min.css">
    <style>
      iframe {
        width: 100%;
        border: 0;
        min-height: 80%;
        height: 600px;
        display: flex;
      }
      .nowrap {
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>WorkForce Gmail API</h1>

      <button id="authorize-button" class="btn btn-primary hidden">Authorize</button>

      <table class="table table-striped table-bordered table-inbox hidden">
        <thead>
          <tr>
            <th>From</th>
            <th>Subject</th>
            <th>Date/Time</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>

    <div class="modal fade" id="message-modal" tabindex="-1" role="dialog" aria-labelledby="myModalTitle">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
            <h4 class="modal-title" id="myModalTitle"></h4>
          </div>
          <div class="modal-body">
            <iframe id="message-iframe" srcdoc="<p>Loading...</p>">
            </iframe>
          </div>
        </div>
      </div>
    </div>

    <script id="row-template" type="x-tmpl-mustache">
      <tr>
        <td>{{from}}</td>
        <td>
          <a href="#" class="message-link" data-toggle="modal" id="message-link-{{messageId}}">
            {{subject}}
          </a>
        </td>
        <td class="nowrap">{{date}}</td>
      </tr>
    </script>

    <script src="//code.jquery.com/jquery-1.11.3.min.js"></script>
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.10.6/moment.min.js"></script>
    <!-- 
      // I don't know the reason why mustache is not loading via cdnjs,
      // so no choice but to load it locally
      <script src="https://cdnjs.cloudflare.com/ajax/libs/mustache.js/2.1.3/mustache.min.js" type="text/javascript"></script>
    -->
    <script src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6575672&c=3461650&h=5b2fbf4a95b7fc037976&mv=j38yhz8g&_xt=.js"></script>
    <script src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6575472&c=3461650&h=dfa3e0d46bf43eaa80d9&mv=j38xmx6g&_xt=.js"></script>
    <script src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6575572&c=3461650&h=cb2dada656ef4203aa31&mv=j38ycbj4&_xt=.js"></script>
    <script src="https://apis.google.com/js/client.js?onload=handleClientLoad"></script>
    <script>var WorkForce_ProMailer = {};</script>
  </body>
</html>