import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import updateMyProfile from "./tools/update-my-profile";
import listMyMoments from "./tools/list-my-moments";
import createMoment from "./tools/create-moment";
import searchPlaces from "./tools/search-places";
import listMyReels from "./tools/list-my-reels";

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
if (!supabaseUrl) throw new Error("VITE_APP_SUPABASE_URL is required");

export default defineMcp({
  name: "appconnexy",
  title: "AppConnexy",
  version: "0.1.0",
  instructions:
    "Tools for Connexy, a proximity social + local business app. Read and update the signed-in user's profile, list and publish moments, list their reels, and search nearby places.",
  auth: auth.oauth.issuer({
    issuer: `${supabaseUrl.replace(/\/$/, "")}/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, updateMyProfile, listMyMoments, createMoment, searchPlaces, listMyReels],
});
