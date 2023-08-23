import "dotenv/config";

const DDDICE_APIKEY = process.env.DDDICE_APIKEY;

async function checkIfBotExistInRoom(roomSlug) {
  let rooms = await fetch("https://dddice.com/api/1.0/room", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${DDDICE_APIKEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => data.data)
    .catch((e) => console.error(e));

  //console.log(rooms.data.filter((e) => e.user.username === "MalmisBot"));

  return rooms.filter((room) => room.slug === roomSlug);
}

async function joinRoom(roomSlug, passcode) {
  let body = passcode !== "" ? JSON.stringify({ passcode: passcode }) : {};

  return await fetch(
    `https://dddice.com/api/1.0/room/${roomSlug}/participant/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DDDICE_APIKEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body,
    }
  )
    .then((res) => res.json())
    .then((data) => data.data)
    .catch((e) => console.error(e));
}

async function updateUserName(roomSlug, eventUserName, roomUserID, passcode) {
  const url = new URL(
    `https://dddice.com/api/1.0/room/${roomSlug}/participant/${roomUserID}`
  );

  const headers = {
    Authorization: `Bearer ${DDDICE_APIKEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  let body = {
    passcode,
    username: eventUserName,
    color: "#B50000",
  };

  fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .then((data) => console.log(data));
}

async function rollDice(eventUserName, dice, roomSlug, passcode) {
  console.log(`fired!, room: ${roomSlug}, dice: ${dice}`);

  let botExistInRoom, userRoomID;

  try {
    botExistInRoom = await checkIfBotExistInRoom(roomSlug);
  } catch (error) {
    throw new Error(error);
  }

  if (botExistInRoom.length === 0) {
    try {
      let joinRoomData = await joinRoom(roomSlug, passcode);
      userRoomID = joinRoomData.participants.filter(
        (e) => e.user.username === "MalmisBot"
      )[0].id;
    } catch (error) {
      throw new Error(error);
    }
  } else {
    userRoomID = botExistInRoom[0].participants.filter(
      (e) => e.user.username === "MalmisBot"
    )[0].id;

    console.log(userRoomID);
  }

  try {
    await updateUserName(roomSlug, eventUserName, userRoomID, passcode);

    await fetch("https://dddice.com/api/1.0/roll", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DDDICE_APIKEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        dice: [
          {
            type: dice,
            theme: "dddice-red",
          },
        ],
        room: roomSlug,
      }),
    })
      .then((res) => res.json())
      .then((data) => data)
      .catch((err) => console.error(err));

    await updateUserName(roomSlug, "MalmisBot", userRoomID, passcode);
  } catch (error) {
    throw new Error(error);
  }
}

export { rollDice };
