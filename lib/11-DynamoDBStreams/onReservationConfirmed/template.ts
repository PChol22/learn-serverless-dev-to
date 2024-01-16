export const reservationConfirmedTemplateHtml = `<html>
  <head>
    <style>
      * {
        font-family: sans-serif;
        text-align: center;
        padding: 0;
        margin: 0;
      }
      .title {
        color: #fff;
        background: #17bb90;
        padding: 1em;
      }
      .container {
        border: 2px solid #17bb90;
        border-radius: 1em;
        margin: 1em auto;
        max-width: 500px;
        overflow: hidden;
      }
      .message {
        padding: 1em;
        line-height: 1.5em;
        color: #033c49;
      }
      .footer {
        font-size: .8em;
        color: #888;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="title">
        <h1>Reservation confirmed!</h1>
      </div>
      <div class="message">
        <p>Hello {{firstName}} {{lastName}}!</p>
        <p>Your reservation for a party of {{partySize}} on {{dateTime}} was confirmed.</p>
      </div>
    </div>
    <p class="footer">This is an automated message, please do not try to answer</p>
  </body>
</html>`;
