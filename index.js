import Fastify from "fastify";
import cors from "@fastify/cors";
import to from "await-to-js";

import jwt from "jsonwebtoken";
const { sign, verify } = jwt;

import { sub } from "./eventsub.js";

import "dotenv/config";

const { JWT_SECRET } = { ...process.env };

import {
  getUserDetails,
  getUserSettings,
  insertUser,
  supabase,
  updateSubscriptions,
  updateUser,
} from "./supabase.js";

import {
  SubscribeToEvents,
  getBroadcasterID,
  getUserAccessTokens,
  getAppAccessToken,
  validateTokens,
  getRedemptions,
} from "./twitchAuth.js";

const fastify = Fastify({
  logger: true,
});

fastify.register(cors, {
  credentials: true,
  origin: "*",
});

fastify.register(sub, { prefix: "/eventsub" });

fastify.post("/twitch/Auth/", async function handler(request, reply) {
  let requestBody = JSON.parse(request.body);

  let userTokenResponse, BroadcasterInfo, user;

  try {
    userTokenResponse = await getUserAccessTokens(requestBody.code);
  } catch (error) {
    console.error(error);
  }

  let { access_token, refresh_token, expires_in } = userTokenResponse;

  console.log(access_token);

  try {
    BroadcasterInfo = await getBroadcasterID(access_token);
  } catch (error) {
    console.error(error);
  }

  try {
    user = await getUserDetails(BroadcasterInfo.id);
  } catch (error) {
    console.log(error);
  }

  /*     if (!user) {
      user = await insertUser({
        access_token,
        refresh_token,
        expires_in,
        broadcasterID: BroadcasterInfo.id,
      });
    } else {
      user = await updateUser(
        {
          access_token,
          refresh_token,
          expires_in,
        },
        BroadcasterInfo.id
      );
    } */

  /*   if (user[0].subscriptions === null) {
    let subToCheers, subToRedemptions;

    try {
      subToCheers = await SubscribeToEvents(
        BroadcasterInfo.id,
        access_token,
        "channel.cheer"
      );
      subToRedemptions = await SubscribeToEvents(
        BroadcasterInfo.id,
        access_token,
        "channel.channel_points_custom_reward_redemption.add"
      );

      if (subToCheers && subToRedemptions) {
        console.log("is true");
        await updateSubscriptions(
          ["cheers", "redemptions"],
          BroadcasterInfo.id
        );
      }
    } catch (error) {
      throw new Error(error);
    }
  } else {
    console.log("already added");
  } */

  let token = sign(
    { code: requestBody.code, broadcasterID: BroadcasterInfo.id },
    JWT_SECRET,
    { expiresIn: "4h" }
  );

  console.log(token);

  reply.code(200).send({ token });
});

fastify.get("/validateTokens", async function handler(request, reply) {
  let AppAccessToken = await getAppAccessToken();

  //let date = new Date();
  //date.setSeconds(date.getSeconds() + AppAccessToken.expires_in);
  //console.log(new Date(date) < new Date(Date.now()));
  let result = await validateTokens(AppAccessToken.access_token);

  reply.send(result);
});

fastify.post("/updateUser", async (request, reply) => {
  let { DDDiceRoom, DDDicePassword } = JSON.parse(request.body);
  let { broadcasterID } = verify(
    request.headers.authorization.split(" ")[1],
    JWT_SECRET
  );

  try {
    await supabase
      .from("StreamerDetails")
      .update({ DDDice_room: DDDiceRoom, DDDice_password: DDDicePassword })
      .eq("broadcasterID", broadcasterID);
  } catch (error) {
    console.log(error);
    reply.code(400).send(error);
  }

  reply.code(200);
});

fastify.get("/getUser", async (request, reply) => {
  const tokenValidated = validateJWT(
    request.headers.authorization.split(" ")[1]
  );

  const [data, error] = await getUserSettings(tokenValidated[0].broadcasterID);

  reply.code(200).send(data);
});

fastify.get("/getRedemptions", async (request, reply) => {
  let token = validateJWT(request.headers.authorization.split(" ")[1]);

  const [userData, error] = await getUserDetails(token.broadcasterID);

  console.log(userData);

  let listOfRedemptions = await getRedemptions(
    token.broadcasterID,
    token.access_token
  );

  if (listOfRedemptions.error) {
    reply.code(401).send(listOfRedemptions);
  }

  reply.code(200).send({ redemption: listOfRedemptions });
});

const validateJWT = (token) => {
  const data = verify(token, JWT_SECRET);

  return data;
};

// Run the server!
try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
