import { createClient } from "@supabase/supabase-js";

const { SERVICE_ROLE_KEY } = {
  ...process.env,
};

const streamerDetails = "StreamerDetails";
const streamerSettings = "StreamerSettings";

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://bbebftpqcczxwdckglqt.supabase.co",
  SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

const getUserDetails = async (broadcasterID) => {
  const { data, error } = await supabase
    .from(streamerDetails)
    .select()
    .eq("broadcasterID", broadcasterID);

  if (error) {
    throw new Error(error);
  } else {
    return data;
  }
};

const updateUser = async (body, broadcasterID) => {
  const { data, error } = await supabase
    .from(streamerDetails)
    .update(body)
    .eq("broadcasterID", broadcasterID)
    .select();

  if (error) {
    throw new Error(error);
  } else {
    return data;
  }
};

const insertUser = async (body) => {
  const { data, error } = await supabase
    .from(streamerDetails)
    .insert(body)
    .eq("broadcasterID", body.broadcasterID)
    .select();

  if (error) {
    throw new Error(error);
  } else {
    return data;
  }
};

const deleteUser = async (broadcasterID) => {
  const { data, error } = await supabase
    .from(streamerDetails)
    .delete()
    .eq("broadcasterID", broadcasterID)
    .select();

  if (error) {
    throw new Error(error);
  } else {
    return data;
  }
};

const updateSubscriptions = async (subscriptions, broadcasterID) => {
  const { data, error } = await supabase
    .from(streamerDetails)
    .update({ subscriptions })
    .eq("broadcasterID", broadcasterID);

  if (error) {
    throw new Error(error);
  } else {
    return data;
  }
};

const getUserSettings = async (broadcasterID) => {
  const { data, error } = await supabase
    .from(streamerSettings)
    .select()
    .eq("broadcasterID", broadcasterID);

  if (error) {
    console.log("Error", error);
  }

  return data;
};

export {
  supabase,
  getUserDetails,
  getUserSettings,
  updateUser,
  insertUser,
  updateSubscriptions,
};
