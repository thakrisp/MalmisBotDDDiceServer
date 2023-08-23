import crypto from "crypto";
import { rollDice } from "./dddice.js";

const { VALIDATION_SECRET } = {
  ...process.env,
};

const sub = (fastify, _, done) => {
  fastify.post("/", async (req, res) => {
    // Notification request headers
    const TWITCH_MESSAGE_ID = "Twitch-Eventsub-Message-Id".toLowerCase();
    const TWITCH_MESSAGE_TIMESTAMP =
      "Twitch-Eventsub-Message-Timestamp".toLowerCase();
    const TWITCH_MESSAGE_SIGNATURE =
      "Twitch-Eventsub-Message-Signature".toLowerCase();
    const MESSAGE_TYPE = "Twitch-Eventsub-Message-Type".toLowerCase();

    // Notification message types
    const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification";
    const MESSAGE_TYPE_NOTIFICATION = "notification";
    const MESSAGE_TYPE_REVOCATION = "revocation";

    // Prepend this string to the HMAC that's created from the message
    const HMAC_PREFIX = "sha256=";
    let secret = getSecret();
    let message = getHmacMessage(req);
    let hmac = HMAC_PREFIX + getHmac(secret, message); // Signature to compare

    if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
      console.log("signatures match");

      // Get JSON object from body, so you can process the message.
      let notification = req.body;

      if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
        // TODO: Do something with the event's data.

        if (notification.subscription.type === "channel.cheer") {
          await validateMessage(notification);

          if (notification.event.bits >= 100) {
            console.log(notification.event);
            /* await rollDice(
              notification.event["user_name"],
              "d20",
              "5oOpsGr",
              "aspernatur"
            ); */
          }
          console.log("Cheers");
        }

        //console.log(`Event type: ${notification.subscription.type}`);
        //console.log(JSON.stringify(notification.event, null, 4));

        res.code(204);
      } else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
        res.code(200).send(notification.challenge);
      } else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {
        res.code(204);

        console.log(`${notification.subscription.type} notifications revoked!`);
        console.log(`reason: ${notification.subscription.status}`);
        console.log(
          `condition: ${JSON.stringify(
            notification.subscription.condition,
            null,
            4
          )}`
        );
      } else {
        res.code(204);
        console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`);
      }
    } else {
      console.log("403"); // Signatures didn't match.
      res.code(403);
    }

    function getSecret() {
      // TODO: Get secret from secure storage. This is the secret you pass
      // when you subscribed to the event.
      return VALIDATION_SECRET;
    }

    // Build the message used to get the HMAC.
    function getHmacMessage(request) {
      return (
        request.headers[TWITCH_MESSAGE_ID] +
        request.headers[TWITCH_MESSAGE_TIMESTAMP] +
        JSON.stringify(request.body)
      );
    }

    // Get the HMAC.
    function getHmac(secret, message) {
      return crypto.createHmac("sha256", secret).update(message).digest("hex");
    }

    // Verify whether our hash matches the hash that Twitch passed in the header.
    function verifyMessage(hmac, verifySignature) {
      return crypto.timingSafeEqual(
        Buffer.from(hmac),
        Buffer.from(verifySignature)
      );
    }
  });

  done();
};

export { sub };

async function validateMessage(data) {
  console.log(data.event.bits);
  if (data.event.bits > 10) {
    console.log("You have cheered enough bits");
  }
}
