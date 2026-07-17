/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as books from "../books.js";
import type * as chambers from "../chambers.js";
import type * as chapters from "../chapters.js";
import type * as comments from "../comments.js";
import type * as commerce from "../commerce.js";
import type * as commerceHelpers from "../commerceHelpers.js";
import type * as contentBlocks from "../contentBlocks.js";
import type * as episodePages from "../episodePages.js";
import type * as episodes from "../episodes.js";
import type * as likes from "../likes.js";
import type * as migrations from "../migrations.js";
import type * as onboarding from "../onboarding.js";
import type * as portal from "../portal.js";
import type * as reading from "../reading.js";
import type * as realms from "../realms.js";
import type * as siteText from "../siteText.js";
import type * as tokenCommerce from "../tokenCommerce.js";
import type * as tokenHelpers from "../tokenHelpers.js";
import type * as tokens from "../tokens.js";
import type * as upcomingEpisodes from "../upcomingEpisodes.js";
import type * as users from "../users.js";
import type * as vibes from "../vibes.js";
import type * as vides from "../vides.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  books: typeof books;
  chambers: typeof chambers;
  chapters: typeof chapters;
  comments: typeof comments;
  commerce: typeof commerce;
  commerceHelpers: typeof commerceHelpers;
  contentBlocks: typeof contentBlocks;
  episodePages: typeof episodePages;
  episodes: typeof episodes;
  likes: typeof likes;
  migrations: typeof migrations;
  onboarding: typeof onboarding;
  portal: typeof portal;
  reading: typeof reading;
  realms: typeof realms;
  siteText: typeof siteText;
  tokenCommerce: typeof tokenCommerce;
  tokenHelpers: typeof tokenHelpers;
  tokens: typeof tokens;
  upcomingEpisodes: typeof upcomingEpisodes;
  users: typeof users;
  vibes: typeof vibes;
  vides: typeof vides;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
