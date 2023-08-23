import { to } from "await-to-js";
import { goTry } from "go-go-try";

const { CLIENT_ID, REDIRECT_URI, CLIENT_SECRET, VALIDATION_SECRET } = {
  ...process.env,
};

//Subscribe to bits and redemptions
const SubscribeToEvents = async (broadcasterID, access_token, eventType) => {
  console.log(`access_token: ${access_token}`);
  console.log(`broadcasterID: ${broadcasterID}`);

  let body;

  if (eventType === "channel.cheer") {
    body = JSON.stringify({
      type: "channel.cheer",
      version: "1",
      condition: { broadcaster_user_id: broadcasterID },
      transport: {
        method: "webhook",
        callback: "https://localhost/eventsub/",
        secret: VALIDATION_SECRET,
      },
    });
  } else if (
    eventType === "channel.channel_points_custom_reward_redemption.add"
  ) {
    body = JSON.stringify({
      type: "channel.channel_points_custom_reward_redemption.add",
      version: "1",
      condition: {
        broadcaster_user_id: broadcasterID,
      },
      transport: {
        method: "webhook",
        callback: "https://localhost/eventsub",
        secret: VALIDATION_SECRET,
      },
    });
  }

  return await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
    method: "POST",
    headers: {
      Authorization: "Bearer 3b40idoghxngc5hzyzy1gjr2iw9xcy",
      "Client-Id": CLIENT_ID,
      "Content-Type": "application/json",
    },
    body: body,
  })
    .then((res) => res.json())
    .then((data) => data)
    .catch((error) => console.log(error));
};

//get broadcastersID to subscribe to events
const getBroadcasterID = async (access_token) => {
  return await fetch("https://api.twitch.tv/helix/users", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + access_token,
      "Client-Id": CLIENT_ID,
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      return data["data"][0];
    })
    .catch((error) => console.log(error));
};

//get users acceess token and refresh token from acceess code
const getUserAccessTokens = async (code) => {
  return await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body:
      "client_id=" +
      CLIENT_ID +
      "&client_secret=" +
      CLIENT_SECRET +
      "&code=" +
      code +
      "&grant_type=authorization_code&redirect_uri=" +
      REDIRECT_URI,
  })
    .then((res) => res.json())
    .then((data) => {
      return { ...data };
    })
    .catch((e) => e);
};

const getAppAccessToken = async () => {
  return await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${client_secret}&grant_type=client_credentials`,
    {
      method: "POST",
    }
  )
    .then((res) => res.json())
    .then((data) => data)
    .catch((err) => console.log(err));
};

//validate tokens on request.
const validateTokens = async (token) => {
  return await fetch("https://id.twitch.tv/oauth2/validate", {
    method: "Get",
    headers: { Authorization: "Bearer " + token },
  })
    .then((res) => res.json())
    .then((data) => data);
};

//get a list of broadcasters redemptions
const getRedemptions = async (broadcasterID, token) => {
  return await fetch(
    `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcasterID}`,
    {
      headers: {
        "Client-Id": CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data)
    .catch((e) => e);
};

export {
  SubscribeToEvents,
  getBroadcasterID,
  getUserAccessTokens,
  getAppAccessToken,
  validateTokens,
  getRedemptions,
};
